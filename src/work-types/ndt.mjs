import { NDT_TARIFFS } from '../tariffs.mjs';
import { coeffThickness, coeffDiameter, conditionsFactor } from '../coeffs.mjs';
import { resolveDependencies, effectiveVolume } from '../field-roles.mjs';
import { roundMoney, safeNum } from '../utils.mjs';

/**
 * Вид работ: НК (неразрушающий контроль).
 * Изолированный расчёт — без сварки.
 */
export function estimateNdtCrew(methods = []) {
  let crew = 0;
  for (const key of methods) {
    const t = NDT_TARIFFS[key];
    if (t) crew = Math.max(crew, t.crew);
  }
  return crew || (methods.length ? 1 : 0);
}

export function calcNdtBase(methods = [], volume = {}) {
  const joints = safeNum(volume.joints);
  const meters = safeNum(volume.meters);
  const points = safeNum(volume.points);
  let base = 0;
  const used = [];
  const warnings = [];

  for (const key of methods) {
    const t = NDT_TARIFFS[key];
    if (!t) {
      warnings.push(`Неизвестный метод: ${key}`);
      continue;
    }
    const part = t.joint * joints + t.meter * meters + t.point * points;
    base += part;
    used.push({
      key: t.key,
      name: t.name,
      amount: roundMoney(part),
      needsPoints: t.needsPoints
    });
    if (t.needsPoints && points <= 0 && joints <= 0 && meters <= 0) {
      warnings.push(`${t.name}: нужен объём (точки/стыки/п.м.)`);
    } else if (t.needsPoints && points <= 0 && t.point > 0 && t.joint === 0 && t.meter === 0) {
      warnings.push(`${t.name}: заполните точки/снимки`);
    }
  }

  if (!methods.length) warnings.push('Не выбран метод НК');
  if (methods.length && base === 0) warnings.push('Методы выбраны, но объём = 0');

  return { base: roundMoney(base), methods: used, warnings, crew: estimateNdtCrew(methods) };
}

/**
 * Полный расчёт только НК с зависимостями объекта и условиями.
 */
export function calculateNdt(input = {}) {
  const {
    objectKey = 'pipe',
    methods = [],
    joints = 0,
    meters = 0,
    points = 0,
    diameter = 0,
    thickness = 0,
    urgency = 1,
    access = 1,
    logisticsTotal = 0
  } = input;

  const deps = resolveDependencies({ workType: 'ndt', objectKey, methods });
  const vol = effectiveVolume(deps, { joints, meters, points, diameter, thickness });
  const ndt = calcNdtBase(methods, vol);

  const kt = deps.effective.showThickness ? coeffThickness(vol.thickness) : 1;
  const kd = deps.effective.showDiameter ? coeffDiameter(vol.diameter) : 1;
  const kc = conditionsFactor(urgency, access);
  const works = roundMoney(ndt.base * kt * kd * kc);
  const total = roundMoney(works + safeNum(logisticsTotal));

  return {
    workType: 'ndt',
    label: 'Только НК',
    deps,
    volume: vol,
    ndtBase: ndt.base,
    weldBase: 0,
    methods: ndt.methods,
    warnings: ndt.warnings,
    crew: ndt.crew,
    kt, kd, kc,
    works,
    logisticsTotal: roundMoney(logisticsTotal),
    total,
    formula: '(база_НК) × k_толщины × k_диаметра × (срочность×доступ) + логистика'
  };
}

export function listNdtMethods() {
  return Object.values(NDT_TARIFFS);
}
