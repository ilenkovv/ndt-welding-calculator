import { safeNum } from './utils.mjs';

/** Коэффициент толщины стенки / металла */
export function coeffThickness(t) {
  t = safeNum(t);
  return t <= 10 ? 1 : t <= 20 ? 1.15 : t <= 30 ? 1.3 : t <= 50 ? 1.5 : 1.75;
}

/** Коэффициент диаметра (трубы / сосуды / ёмкости) */
export function coeffDiameter(d) {
  d = safeNum(d);
  return d <= 108 ? 1 : d <= 219 ? 1.08 : d <= 426 ? 1.18 : d <= 630 ? 1.3 : 1.45;
}

export function conditionsFactor(urgency = 1, access = 1) {
  const u = safeNum(urgency) || 1;
  const a = safeNum(access) || 1;
  return (u > 0 ? u : 1) * (a > 0 ? a : 1);
}
