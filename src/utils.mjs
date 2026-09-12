/** Общие утилиты расчёта */

export function safeNum(v) {
  const x = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(',', '.'));
  if (!Number.isFinite(x) || x < 0) return 0;
  return x;
}

export function clampMin(v, min = 0) {
  return Math.max(min, safeNum(v));
}

export function rub(v) {
  const n = Number.isFinite(v) ? v : 0;
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' ₽';
}

export function roundMoney(v) {
  return Math.round(safeNum(v));
}

export function normalizeText(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9\s\-]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
