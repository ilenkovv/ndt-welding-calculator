/**
 * Smoke-проверка лабораторий видов работ в браузере.
 * Запуск: node tests/labs-smoke.mjs
 */
import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const port = 4177;
const art = path.join(root, 'test-artifacts');
fs.mkdirSync(art, { recursive: true });

const chrome = ['/usr/bin/google-chrome', '/usr/local/bin/google-chrome']
  .find((p) => fs.existsSync(p));
if (!chrome) {
  console.error('Chrome not found');
  process.exit(1);
}

const server = spawn('node', [path.join(root, 'scripts/serve-labs.mjs')], {
  cwd: root,
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe']
});

await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('server timeout')), 8000);
  server.stdout.on('data', (buf) => {
    if (String(buf).includes('http://')) {
      clearTimeout(t);
      resolve();
    }
  });
  server.stderr.on('data', (buf) => console.error(String(buf)));
  server.on('exit', (code) => reject(new Error('server exited ' + code)));
});

let failed = 0;
const pass = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) failed++;
};

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
});

try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message || e)));

  // НК
  await page.goto(`http://127.0.0.1:${port}/labs/ndt.html`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('#total');
  const ndtTotal = await page.$eval('#total', (el) => el.textContent);
  pass('Lab НК загрузилась', /2[\s ]*500/.test(ndtTotal), ndtTotal);
  await page.select('#object', 'metal');
  await page.waitForFunction(() => document.getElementById('wrapDiameter').classList.contains('dep-hidden'));
  pass('Lab НК: металл скрывает диаметр', true);
  await page.screenshot({ path: path.join(art, 'lab-ndt.png'), fullPage: true });

  // Сварка
  errors.length = 0;
  await page.goto(`http://127.0.0.1:${port}/labs/welding.html`, { waitUntil: 'networkidle0' });
  const weldTotal = await page.$eval('#total', (el) => el.textContent);
  pass('Lab сварка загрузилась', /10[\s ]*925/.test(weldTotal), weldTotal);
  const diameterHidden = await page.$eval('#wrapDiameter', (el) => el.classList.contains('dep-hidden'));
  pass('Lab сварка: металл без диаметра', diameterHidden);
  await page.screenshot({ path: path.join(art, 'lab-welding.png'), fullPage: true });

  // Логистика
  errors.length = 0;
  await page.goto(`http://127.0.0.1:${port}/labs/logistics.html`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.getElementById('total').textContent.replace(/\D/g, '') !== '0');
  const logTotal = await page.$eval('#total', (el) => el.textContent);
  const mode = await page.$eval('#tMode', (el) => el.textContent);
  pass('Lab логистика Казань > 0', Number(logTotal.replace(/\D/g, '')) > 0, logTotal);
  pass('Lab логистика auto → поезд', /поезд/i.test(mode), mode);

  // очистка города
  await page.$eval('#city', (el) => {
    el.value = '';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForFunction(() => document.getElementById('total').textContent.replace(/\D/g, '') === '0');
  pass('Lab логистика: очистка города сбрасывает сумму', true);

  // снова Казань + очистка адреса
  await page.$eval('#city', (el) => {
    el.value = 'Казань';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForFunction(() => Number(document.getElementById('total').textContent.replace(/\D/g, '')) > 0);
  const before = await page.$eval('#total', (el) => el.textContent);
  await page.$eval('#address', (el) => {
    el.value = 'ул. Баумана 1';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.$eval('#address', (el) => {
    el.value = '';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  const after = await page.$eval('#total', (el) => el.textContent);
  pass('Lab логистика: очистка адреса сохраняет сумму', before === after, `${before} vs ${after}`);

  await page.screenshot({ path: path.join(art, 'lab-logistics.png'), fullPage: true });
  pass('Нет pageerror на лабах', errors.length === 0, errors.join(' | '));
} catch (e) {
  failed++;
  console.error('FATAL', e);
} finally {
  await browser.close();
  server.kill('SIGTERM');
}

console.log(`\nLabs smoke: ${failed ? 'FAILED' : 'OK'} (failed=${failed})`);
process.exit(failed ? 1 : 0);
