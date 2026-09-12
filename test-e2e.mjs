/**
 * Полный набор проверок калькулятора НК / сварки.
 *
 * Покрывает:
 *  - матрицу зависимостей по объекту (труба / металлоконструкция / …)
 *  - зависимости по типу работ (НК / сварка / комплекс)
 *  - формулы расчёта и коэффициенты
 *  - логистику
 *  - наличие печатной таблицы зависимостей
 *
 * Запуск:
 *   npm test
 *   node test-e2e.mjs
 */
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const CHROME = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome']
  .find((p) => fs.existsSync(p));
const HTML = pathToFileURL(path.resolve('ndt-welding-calculator.html')).href;
const ART = path.resolve('test-artifacts');
fs.mkdirSync(ART, { recursive: true });

if (!CHROME) {
  console.error('Google Chrome not found');
  process.exit(1);
}

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
  return Number(String(s).replace(/[^\d]/g, '')) || 0;
}

async function set(page, id, value) {
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

async function checkMethod(page, value, on = true) {
  await page.$eval(
    `.method[value="${value}"]`,
    (el, on) => {
      el.checked = on;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    },
    on
  );
}

async function clearMethods(page) {
  await page.$$eval('.method', (els) => {
    els.forEach((el) => {
      el.checked = false;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });
}

async function text(page, sel) {
  return page.$eval(sel, (el) => el.textContent.trim());
}

async function isHidden(page, id) {
  return page.$eval(`#${id}`, (el) => el.classList.contains('dep-hidden') || el.hidden === true);
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(ART, `${name}.png`), fullPage: true });
}

/** Эталонные коэффициенты — как в калькуляторе */
function kt(t) {
  return t <= 10 ? 1 : t <= 20 ? 1.15 : t <= 30 ? 1.3 : t <= 50 ? 1.5 : 1.75;
}
function kd(d) {
  return d <= 108 ? 1 : d <= 219 ? 1.08 : d <= 426 ? 1.18 : d <= 630 ? 1.3 : 1.45;
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e.message || e)));

try {
  await page.goto(HTML, { waitUntil: 'domcontentloaded' });

  // ---------- 0. Старт / матрица ----------
  {
    expect(money(await text(page, '#total')) === 0, '0. Старт: итог 0 ₽', await text(page, '#total'));
    const rows = await page.$$eval('#depsMatrixBody tr', (trs) => trs.length);
    expect(rows === 5, '0. Матрица зависимостей: 5 объектов', String(rows));
    const printRows = await page.$$eval('#printObjectMatrix tr', (trs) => trs.length);
    expect(printRows >= 5, '0. Печатная таблица объектов заполнена', String(printRows));
    expect(await page.$('#printDeps') !== null, '0. Кнопка печати таблицы зависимостей есть');
    await shot(page, '00-start');
  }

  // ---------- 1. Трубопровод: диаметр + толщина + стыки ----------
  {
    await set(page, 'object', 'pipe');
    await set(page, 'workType', 'ndt');
    expect(!(await isHidden(page, 'wrapJoints')), '1. Труба: №6 стыки видны');
    expect(!(await isHidden(page, 'wrapMeters')), '1. Труба: №7 п.м. видны (опц.)');
    expect(!(await isHidden(page, 'wrapDiameter')), '1. Труба: №9 диаметр виден');
    expect(!(await isHidden(page, 'wrapThickness')), '1. Труба: №10 толщина видна');
    expect(!(await isHidden(page, 'methodsSection')), '1. Труба+НК: методы видны');

    await clearMethods(page);
    await checkMethod(page, 'vik', true);
    await set(page, 'joints', 10);
    await set(page, 'meters', 0);
    await set(page, 'points', 0);
    await set(page, 'diameter', 108);
    await set(page, 'thickness', 6);
    await set(page, 'urgency', '1');
    await set(page, 'access', '1');
    await set(page, 'distance', 0);
    await set(page, 'travel', 0);
    // 10*250 = 2500; kt=1 kd=1
    expect(money(await text(page, '#total')) === 2500, '1. Труба ВИК 10 стыков = 2500 ₽', await text(page, '#total'));
    await shot(page, '01-pipe-vik');
  }

  // ---------- 2. Металлоконструкция: толщина + п.м., без диаметра ----------
  {
    await set(page, 'object', 'metal');
    await set(page, 'workType', 'welding');
    expect(!(await isHidden(page, 'wrapMeters')), '2. Металл: №7 п.м. видны');
    expect(!(await isHidden(page, 'wrapThickness')), '2. Металл: №10 толщина видна');
    expect(await isHidden(page, 'wrapDiameter'), '2. Металл: №9 диаметр скрыт');
    expect(await isHidden(page, 'methodsSection'), '2. Металл+сварка: методы скрыты');
    expect(await isHidden(page, 'wrapPoints'), '2. Металл+сварка: точки скрыты');

    await set(page, 'joints', 100); // даже если видны как soft — для metal welding meters главное
    await set(page, 'meters', 10);
    await set(page, 'thickness', 12);
    await set(page, 'diameter', 530); // должно игнорироваться
    // weld = 100*1200 + 10*950 = 120000+9500 = 129500, НО joints soft still shown
    // wait - soft means still visible and counted! So joints=100 will count.
    // For pure metal test, set joints=0
    await set(page, 'joints', 0);
    // weld = 10*950 = 9500; kt(12)=1.15; kd=1 (diameter hidden)
    const expected = Math.round(9500 * 1.15);
    expect(
      money(await text(page, '#total')) === expected,
      `2. Металл сварка 10 п.м. t=12 = ${expected} ₽`,
      await text(page, '#total')
    );
    expect(money(await text(page, '#weldSum')) === 9500, '2. База сварки 9500', await text(page, '#weldSum'));
    const live = await text(page, '#depsLive');
    expect(live.includes('Металлоконструкция') || live.includes('металл'), '2. Live-подсказка про объект', live.slice(0, 100));
    await shot(page, '02-metal-weld');
  }

  // ---------- 3. Сосуд: диаметр+стыки ----------
  {
    await set(page, 'object', 'vessel');
    await set(page, 'workType', 'complex');
    expect(!(await isHidden(page, 'wrapJoints')), '3. Сосуд: стыки видны');
    expect(!(await isHidden(page, 'wrapDiameter')), '3. Сосуд: диаметр виден');
    expect(!(await isHidden(page, 'methodsSection')), '3. Сосуд+complex: методы видны');

    await clearMethods(page);
    await checkMethod(page, 'uzk', true);
    await set(page, 'joints', 5);
    await set(page, 'meters', 0);
    await set(page, 'points', 0);
    await set(page, 'diameter', 219);
    await set(page, 'thickness', 15);
    // ndt=5*700=3500; weld=5*1200=6000; base=9500
    // kt=1.15 kd=1.08 kc=1 → 9500*1.15*1.08 = 11799
    const expected = Math.round(9500 * 1.15 * 1.08);
    expect(
      money(await text(page, '#total')) === expected,
      `3. Сосуд complex УЗК 5 стыков = ${expected}`,
      await text(page, '#total')
    );
    expect(money(await text(page, '#ndtSum')) === 3500, '3. НК база 3500');
    expect(money(await text(page, '#weldSum')) === 6000, '3. Сварка база 6000');
    await shot(page, '03-vessel-complex');
  }

  // ---------- 4. Резервуар: п.м. + толщина + диаметр ----------
  {
    await set(page, 'object', 'tank');
    await set(page, 'workType', 'ndt');
    expect(!(await isHidden(page, 'wrapMeters')), '4. Резервуар: п.м. видны');
    expect(!(await isHidden(page, 'wrapDiameter')), '4. Резервуар: диаметр виден');
    await clearMethods(page);
    await checkMethod(page, 'pvk', true);
    await set(page, 'joints', 0);
    await set(page, 'meters', 20);
    await set(page, 'diameter', 108);
    await set(page, 'thickness', 8);
    // 20*500=10000; kt=1 kd=1
    expect(money(await text(page, '#total')) === 10000, '4. Резервуар ПВК 20 п.м. = 10000', await text(page, '#total'));
  }

  // ---------- 5. Точки для РК / толщинометрии ----------
  {
    await set(page, 'object', 'pipe');
    await set(page, 'workType', 'ndt');
    await clearMethods(page);
    await checkMethod(page, 'rk', true);
    await set(page, 'joints', 0);
    await set(page, 'meters', 0);
    await set(page, 'points', 4);
    await set(page, 'diameter', 108);
    await set(page, 'thickness', 6);
    // 4*900=3600
    expect(money(await text(page, '#total')) === 3600, '5. РК 4 снимка = 3600', await text(page, '#total'));

    await clearMethods(page);
    await checkMethod(page, 'thick', true);
    await set(page, 'points', 10);
    // 10*180=1800
    expect(money(await text(page, '#total')) === 1800, '5. Толщинометрия 10 точек = 1800', await text(page, '#total'));
  }

  // ---------- 6. Логистика и коэффициенты срочности ----------
  {
    await set(page, 'object', 'pipe');
    await set(page, 'workType', 'ndt');
    await clearMethods(page);
    await checkMethod(page, 'vik', true);
    await set(page, 'joints', 10);
    await set(page, 'meters', 0);
    await set(page, 'points', 0);
    await set(page, 'diameter', 219);
    await set(page, 'thickness', 15);
    await set(page, 'urgency', '1.3');
    await set(page, 'access', '1.15');
    await set(page, 'distance', 50);
    await set(page, 'travel', 5000);
    // base=2500; kt=1.15 kd=1.08 kc=1.15*1.3; log=5000+20*35=5700
    const expected = Math.round(2500 * 1.15 * 1.08 * (1.15 * 1.3) + 5700);
    expect(money(await text(page, '#logistics')) === 5700, '6. Логистика 5700', await text(page, '#logistics'));
    expect(
      money(await text(page, '#total')) === expected,
      `6. Итог с коэфф. и логистикой = ${expected}`,
      await text(page, '#total')
    );
    await shot(page, '06-logistics');
  }

  // ---------- 7. Скрытие диаметра обнуляет kd ----------
  {
    await set(page, 'object', 'metal');
    await set(page, 'workType', 'ndt');
    await clearMethods(page);
    await checkMethod(page, 'vik', true);
    await set(page, 'joints', 0);
    await set(page, 'meters', 10);
    await set(page, 'diameter', 1020); // огромный, но поле скрыто → kd=1
    await set(page, 'thickness', 6);
    await set(page, 'urgency', '1');
    await set(page, 'access', '1');
    await set(page, 'distance', 0);
    await set(page, 'travel', 0);
    // 10*150=1500; kt=1 kd=1
    expect(money(await text(page, '#total')) === 1500, '7. Металл: большой диаметр игнорируется', await text(page, '#total'));
    expect(await isHidden(page, 'rowDiameterK') || await isHidden(page, 'wrapDiameter'), '7. Строка/поле диаметра скрыты');
  }

  // ---------- 8. Нет JS-ошибок ----------
  {
    expect(pageErrors.length === 0, '8. Нет pageerror', pageErrors.join(' | ') || 'ok');
  }

  await shot(page, '08-final');
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
  pageErrors,
};
fs.writeFileSync(path.join(ART, 'report.json'), JSON.stringify(summary, null, 2));
console.log('\n==== SUMMARY ====');
console.log(`Passed: ${summary.passed}, Failed: ${summary.failed}`);
process.exit(failed ? 1 : 0);
