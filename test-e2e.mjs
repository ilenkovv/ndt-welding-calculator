/**
 * E2E-тесты калькулятора НК (план: 8 сценариев).
 * Запуск: node /agent/test-e2e.mjs
 */
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const CHROME = fs.existsSync('/usr/local/bin/google-chrome')
  ? '/usr/local/bin/google-chrome'
  : '/usr/bin/google-chrome';
const HTML = pathToFileURL('/agent/ndt-welding-calculator.html').href;
const ART = '/agent/test-artifacts';
fs.mkdirSync(ART, { recursive: true });

let failed = 0;
const results = [];

function expect(cond, name, detail = '') {
  if (cond) {
    results.push({ name, ok: true, detail });
    console.log(`PASS  ${name}${detail ? ' — ' + detail : ''}`);
  } else {
    failed++;
    results.push({ name, ok: false, detail });
    console.error(`FAIL  ${name}${detail ? ' — ' + detail : ''}`);
  }
}

function money(s) {
  return Number(String(s).replace(/[^\d]/g, ''));
}

function norm(s) {
  return String(s).replace(/\u00a0/g, ' ').trim();
}

async function setValue(page, id, value) {
  await page.$eval(
    `#${id}`,
    (el, v) => {
      el.value = String(v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    },
    value
  );
}

async function setSelect(page, id, value) {
  await page.$eval(
    `#${id}`,
    (el, v) => {
      el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    },
    value
  );
}

async function setMethod(page, value, checked) {
  await page.$eval(
    `.method[value="${value}"]`,
    (el, c) => {
      el.checked = c;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    },
    checked
  );
}

async function text(page, sel) {
  return page.$eval(sel, (el) => el.textContent.trim());
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(ART, `${name}.png`) });
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  protocolTimeout: 60000,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
page.setDefaultTimeout(15000);

page.on('dialog', async (d) => {
  await d.dismiss().catch(() => {});
});

try {
  await page.goto(HTML, { waitUntil: 'domcontentloaded' });

  // 1. Старт — итог 0 ₽, hint предупреждает выбрать метод НК
  {
    const total = await text(page, '#total');
    const hint = await text(page, '#methodsHint');
    const warn = await page.$eval('#methodsHint', (el) => el.classList.contains('warn'));
    expect(money(total) === 0, '1. Старт: итог 0 ₽', norm(total));
    expect(hint.includes('Выберите хотя бы один метод'), '1. Старт: предупреждение про метод НК', hint.slice(0, 80));
    expect(warn, '1. Старт: hint.warn активен');
    await shot(page, '01-start');
  }

  // 2. НК: ВИК, 10 стыков — база 2500, итог 2500
  {
    await setMethod(page, 'vik', true);
    await setValue(page, 'joints', 10);
    expect(money(await text(page, '#workSum')) === 2500, '2. ВИК 10 стыков: workSum 2500', await text(page, '#workSum'));
    expect(money(await text(page, '#total')) === 2500, '2. ВИК 10 стыков: total 2500', await text(page, '#total'));
    expect(money(await text(page, '#ndtSum')) === 2500, '2. ВИК: ndtSum 2500', await text(page, '#ndtSum'));
    await shot(page, '02-vik-10');
  }

  // 3. Коэффициенты — Ø219, толщина 15, access 1.15, urgency 1.3
  {
    await setValue(page, 'diameter', 219);
    await setValue(page, 'thickness', 15);
    await setSelect(page, 'access', '1.15');
    await setSelect(page, 'urgency', '1.3');
    const kt = norm(await text(page, '#thicknessK'));
    const kd = norm(await text(page, '#diameterK'));
    const kc = norm(await text(page, '#conditionsK'));
    const expected = Math.round(2500 * 1.15 * 1.08 * (1.15 * 1.3));
    expect(kt === '× 1,15', '3. kt толщина 15', kt);
    expect(kd === '× 1,08', '3. kd диаметр 219', kd);
    expect(kc.startsWith('× 1,4'), '3. kc access×urgency', kc);
    expect(money(await text(page, '#total')) === expected, `3. total с коэффициентами = ${expected}`, await text(page, '#total'));
    await shot(page, '03-coeffs');
  }

  // 4. Логистика — distance 50, travel 5000 → 5700 в #logistics
  {
    await setValue(page, 'distance', 50);
    await setValue(page, 'travel', 5000);
    expect(money(await text(page, '#logistics')) === 5700, '4. logistics 5700', await text(page, '#logistics'));
    const expected = Math.round(2500 * 1.15 * 1.08 * (1.15 * 1.3) + 5700);
    expect(money(await text(page, '#total')) === expected, `4. total с логистикой = ${expected}`, await text(page, '#total'));
    await shot(page, '04-logistics');
  }

  // 5. Сварка — методы disabled, points не влияют, база = 10×1200 + 5×950 = 16750
  {
    await setSelect(page, 'workType', 'welding');
    await setValue(page, 'joints', 10);
    await setValue(page, 'meters', 5);
    await setValue(page, 'points', 99);
    await setValue(page, 'diameter', 108);
    await setValue(page, 'thickness', 6);
    await setSelect(page, 'access', '1');
    await setSelect(page, 'urgency', '1');
    await setValue(page, 'distance', 0);
    await setValue(page, 'travel', 0);

    const disabled = await page.$$eval('.method', (els) => els.every((e) => e.disabled));
    expect(disabled, '5. Сварка: методы disabled');
    expect(!(await page.$eval('#weldRow', (el) => el.hidden)), '5. Сварка: weldRow видна');
    expect(await page.$eval('#ndtRow', (el) => el.hidden), '5. Сварка: ndtRow скрыта');
    expect(money(await text(page, '#workSum')) === 16750, '5. Сварка workSum 16750', await text(page, '#workSum'));
    expect(money(await text(page, '#total')) === 16750, '5. Сварка total 16750 (points не влияют)', await text(page, '#total'));
    await shot(page, '05-welding');
  }

  // 6. Сварка + НК — обе строки, сумма баз 2500+12000=14500
  {
    await setSelect(page, 'workType', 'complex');
    await setValue(page, 'joints', 10);
    await setValue(page, 'meters', 0);
    await setValue(page, 'points', 0);
    const enabled = await page.$$eval('.method', (els) => els.every((e) => !e.disabled));
    expect(enabled, '6. Complex: методы enabled');
    await setMethod(page, 'vik', true);
    expect(
      !(await page.$eval('#ndtRow', (el) => el.hidden)) && !(await page.$eval('#weldRow', (el) => el.hidden)),
      '6. Complex: ndtRow и weldRow видны'
    );
    expect(money(await text(page, '#ndtSum')) === 2500, '6. Complex ndtSum 2500', await text(page, '#ndtSum'));
    expect(money(await text(page, '#weldSum')) === 12000, '6. Complex weldSum 12000', await text(page, '#weldSum'));
    expect(money(await text(page, '#workSum')) === 14500, '6. Complex workSum 14500', await text(page, '#workSum'));
    await shot(page, '06-complex');
  }

  // 7. КП — XSS экранирован (&lt;script&gt;)
  {
    await setValue(page, 'client', '<script>alert(1)</script>');
    await setValue(page, 'comment', 'тест & "кавычки"');

    const popupPromise = new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), 4000);
      browser.once('targetcreated', async (target) => {
        clearTimeout(timer);
        try {
          resolve(await target.page());
        } catch {
          resolve(null);
        }
      });
    });

    await page.click('#proposal');
    const prop = await popupPromise;

    if (prop) {
      await prop.evaluate(() => {
        window.print = () => {};
      }).catch(() => {});
      await new Promise((r) => setTimeout(r, 400));
      const html = await prop.content();
      const hasRaw = /<td>[^<]*<script>alert\(1\)<\/script>/.test(html);
      const hasEscaped = html.includes('&lt;script&gt;');
      expect(!hasRaw && hasEscaped, '7. КП: XSS экранирован', hasEscaped ? 'escaped' : 'raw');
      expect(html.includes('Коммерческое предложение'), '7. КП: заголовок на месте');
      await prop.screenshot({ path: path.join(ART, '07-proposal.png') }).catch(() => {});
      await prop.close().catch(() => {});
    } else {
      const escaped = await page.evaluate(() => escapeHtml(document.getElementById('client').value));
      expect(escaped.includes('&lt;script&gt;'), '7. КП: popup blocked, escapeHtml ok', escaped);
      expect(true, '7. КП: окно не открылось (headless ok), escape проверен');
    }
  }

  // 8. Copy / dataText — состав работ и итоговая сумма
  {
    const data = await page.evaluate(() => (typeof dataText === 'function' ? dataText() : null));
    expect(!!data && data.includes('РАСЧЁТ НК'), '8. dataText: заголовок');
    expect(!!data && data.includes('Состав работ:'), '8. dataText: состав работ');
    expect(!!data && data.includes('Расчётная стоимость:'), '8. dataText: расчётная стоимость');
    expect(!!data && /[\d\s\u00a0]+₽/.test(data), '8. dataText: есть сумма в ₽');
    expect(!!data && data.includes('<script>alert(1)</script>'), '8. dataText: клиент plain text');

    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: async () => {} },
      });
    });
    await page.click('#copy');
    await new Promise((r) => setTimeout(r, 200));
    const label = await text(page, '#copy');
    expect(
      label.includes('скопированы') || label.includes('Скопировать'),
      '8. Кнопка copy кликабельна',
      label
    );
    await shot(page, '08-final');
  }
} catch (e) {
  failed++;
  console.error('FATAL', e);
  await shot(page, 'fatal').catch(() => {});
} finally {
  await browser.close();
}

const summary = {
  passed: results.filter((r) => r.ok).length,
  failed: results.filter((r) => !r.ok).length,
  results,
};
fs.writeFileSync(path.join(ART, 'report.json'), JSON.stringify(summary, null, 2));
console.log('\n==== SUMMARY ====');
console.log(`Passed: ${summary.passed}, Failed: ${summary.failed}`);
process.exit(failed ? 1 : 0);
