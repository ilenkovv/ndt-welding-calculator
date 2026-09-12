import { WELD_TARIFFS } from '../tariffs.mjs';
import { coeffThickness, coeffDiameter, conditionsFactor } from '../coeffs.mjs';
import { resolveDependencies, effectiveVolume } from '../field-roles.mjs';
import { roundMoney, safeNum } from '../utils.mjs';

/**
 * Вид работ: сварка.
 * Изолированный расчёт — без НК.
 */
export function estimateWeldCrew(volume = {}) {
  const joints = safeNum(volume.joints);
  const meters = safeNum(volume.meters);
  const { welder, helper } = WELD_TARIFFS.roles;
  const welders = Math.max(
    joints > 0 || meters > 0 ? 1 : 0,
    Math.ceil(joints / welder.perJointDay),
    Math.ceil(meters / welder.perMeterDay)
  );
  const helpers = welders > 0 ? Math.max(1, Math.ceil(welders * helper.ratio)) : 0;
  return {
    welders,
    helpers,
    total: welders + helpers,
    roles: [
      { key: 'welder', label: welder.label, count: welders },
      { key: 'helper', label: helper.label, count: helpers }
    ]
  };
}

export function calcWeldBase(volume = {}) {
  const joints = safeNum(volume.joints);
  const meters = safeNum(volume.meters);
  const base = joints * WELD_TARIFFS.joint + meters * WELD_TARIFFS.meter;
  const warnings = [];
  if (base === 0) warnings.push('Заполните стыки и/или погонные метры для сварки');
  return {
    base: roundMoney(base),
    breakdown: {
      joints: roundMoney(joints * WELD_TARIFFS.joint),
      meters: roundMoney(meters * WELD_TARIFFS.meter)
    },
    warnings,
    crew: estimateWeldCrew(volume)
  };
}

export function calculateWelding(input = {}) {
  const {
    objectKey = 'pipe',
    joints = 0,
    meters = 0,
    points = 0,
    diameter = 0,
    thickness = 0,
    urgency = 1,
    access = 1,
    logisticsTotal = 0
  } = input;

  const deps = resolveDependencies({ workType: 'welding', objectKey, methods: [] });
  const vol = effectiveVolume(deps, { joints, meters, points, diameter, thickness });
  const weld = calcWeldBase(vol);

  const kt = deps.effective.showThickness ? coeffThickness(vol.thickness) : 1;
  const kd = deps.effective.showDiameter ? coeffDiameter(vol.diameter) : 1;
  const kc = conditionsFactor(urgency, access);
  const works = roundMoney(weld.base * kt * kd * kc);
  const total = roundMoney(works + safeNum(logisticsTotal));

  return {
    workType: 'welding',
    label: 'Только сварка',
    deps,
    volume: vol,
    ndtBase: 0,
    weldBase: weld.base,
    breakdown: weld.breakdown,
    warnings: weld.warnings,
    crew: weld.crew,
    kt, kd, kc,
    works,
    logisticsTotal: roundMoney(logisticsTotal),
    total,
    formula: '(база_сварки) × k_толщины × k_диаметра × (срочность×доступ) + логистика'
  };
}

export function weldTariffs() {
  return { ...WELD_TARIFFS };
}
