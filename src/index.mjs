/**
 * Публичный API модулей (виды работ пока разделены).
 * Позже: calculateComplex() соединит НК + сварку + логистику.
 */
export { calculateNdt, listNdtMethods, calcNdtBase, estimateNdtCrew } from './work-types/ndt.mjs';
export { calculateWelding, calcWeldBase, estimateWeldCrew, weldTariffs } from './work-types/welding.mjs';
export {
  calculateLogistics,
  findCity,
  suggestCities,
  pickTransportAuto,
  listCities,
  transportModes
} from './work-types/logistics.mjs';
export {
  resolveDependencies,
  effectiveVolume,
  listObjectMatrix,
  FIELD_ROLES
} from './field-roles.mjs';
export { OBJECT_PROFILES, getObjectProfile } from './object-profiles.mjs';
export { NDT_TARIFFS, WELD_TARIFFS, LOGISTICS_CFG, WORK_TYPES } from './tariffs.mjs';
export { coeffThickness, coeffDiameter, conditionsFactor } from './coeffs.mjs';
export { rub, roundMoney, safeNum, normalizeText } from './utils.mjs';
export {
  FIELD_CATALOG,
  INTAKE_ORDER,
  getField,
  listFields,
  fieldsForWorkType
} from './field-catalog.mjs';

/** Алиасы удобных имён для лаб */
export { calculateNdt as calcNdt } from './work-types/ndt.mjs';
export { calculateWelding as calcWelding } from './work-types/welding.mjs';
