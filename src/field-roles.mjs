import { OBJECT_PROFILES, getObjectProfile } from './object-profiles.mjs';
import { NDT_TARIFFS, WORK_TYPES } from './tariffs.mjs';

/**
 * Роли полей формы (метаданные для UI и тестов).
 * price: влияет ли на цену
 * owner: какой вид работ «владеет» полем
 */
export const FIELD_ROLES = {
  client: { id: 'client', num: 1, role: 'deal_meta', price: false, owner: 'shared' },
  contact: { id: 'contact', num: 2, role: 'deal_meta', price: false, owner: 'shared' },
  city: { id: 'city', num: 3, role: 'location', price: true, owner: 'logistics', note: 'Подтягивает базу логистики' },
  address: { id: 'address', num: '3b', role: 'location', price: false, owner: 'logistics', note: 'Уточнение; при очистке city сброс подсказок' },
  workType: { id: 'workType', num: 4, role: 'switch', price: true, owner: 'shared' },
  object: { id: 'object', num: 5, role: 'switch', price: true, owner: 'shared' },
  joints: { id: 'joints', num: 6, role: 'volume', price: true, owner: 'shared' },
  meters: { id: 'meters', num: 7, role: 'volume', price: true, owner: 'shared' },
  points: { id: 'points', num: 8, role: 'volume', price: true, owner: 'ndt' },
  diameter: { id: 'diameter', num: 9, role: 'geometry', price: true, owner: 'shared' },
  thickness: { id: 'thickness', num: 10, role: 'geometry', price: true, owner: 'shared' },
  methods: { id: 'methods', num: 11, role: 'ndt_methods', price: true, owner: 'ndt' },
  urgency: { id: 'urgency', num: 12, role: 'condition', price: true, owner: 'shared' },
  access: { id: 'access', num: 13, role: 'condition', price: true, owner: 'shared' },
  transport: { id: 'transport', num: 14, role: 'logistics', price: true, owner: 'logistics' },
  nights: { id: 'nights', num: 15, role: 'logistics', price: true, owner: 'logistics' },
  people: { id: 'people', num: '15b', role: 'logistics', price: true, owner: 'logistics' },
  comment: { id: 'comment', num: 16, role: 'deal_meta', price: false, owner: 'shared' }
};

/**
 * Разрешение видимости/учёта полей для конкретного вида работ + объекта.
 * state: yes | soft | no
 */
export function resolveDependencies({ workType = 'ndt', objectKey = 'pipe', methods = [] } = {}) {
  const wt = WORK_TYPES[workType] || WORK_TYPES.ndt;
  const profile = getObjectProfile(objectKey);
  const methodList = Array.isArray(methods) ? methods : [];
  const needsPoints = methodList.some((m) => NDT_TARIFFS[m]?.needsPoints);

  const fields = {
    joints: { state: profile.joints, reason: `профиль ${profile.label}` },
    meters: { state: profile.meters, reason: `профиль ${profile.label}` },
    diameter: { state: profile.diameter, reason: `профиль ${profile.label}` },
    thickness: { state: profile.thickness, reason: `профиль ${profile.label}` },
    points: {
      state: !wt.includesNdt ? 'no' : needsPoints ? (profile.points === 'no' ? 'soft' : profile.points === 'yes' ? 'yes' : 'soft') : profile.points,
      reason: !wt.includesNdt
        ? 'вид работ без НК'
        : needsPoints
          ? 'методы РК/толщинометрия требуют точки'
          : `профиль ${profile.label}`
    },
    methods: {
      state: wt.includesNdt ? 'yes' : 'no',
      reason: wt.includesNdt ? 'вид работ включает НК' : 'только сварка — методы скрыты'
    },
    weldingVolume: {
      state: wt.includesWeld ? 'yes' : 'no',
      reason: wt.includesWeld ? 'вид работ включает сварку' : 'только НК — сварка = 0'
    }
  };

  const visible = (key) => fields[key]?.state !== 'no';
  const effective = {
    showJoints: visible('joints'),
    showMeters: visible('meters'),
    showPoints: visible('points'),
    showDiameter: visible('diameter'),
    showThickness: visible('thickness'),
    showMethods: visible('methods'),
    showWelding: visible('weldingVolume'),
    includesNdt: wt.includesNdt,
    includesWeld: wt.includesWeld
  };

  return {
    workType: wt.key,
    workLabel: wt.label,
    objectKey: profile.key,
    objectLabel: profile.label,
    profile,
    fields,
    effective,
    matrixRow: {
      joints: profile.joints,
      meters: profile.meters,
      points: fields.points.state,
      diameter: profile.diameter,
      thickness: profile.thickness,
      methods: fields.methods.state
    }
  };
}

/** Эффективный объём: скрытые поля → 0 */
export function effectiveVolume(deps, volume = {}) {
  const e = deps.effective;
  return {
    joints: e.showJoints ? Number(volume.joints) || 0 : 0,
    meters: e.showMeters ? Number(volume.meters) || 0 : 0,
    points: e.showPoints ? Number(volume.points) || 0 : 0,
    diameter: e.showDiameter ? Number(volume.diameter) || 0 : 0,
    thickness: e.showThickness ? Number(volume.thickness) || 0 : 0
  };
}

export function listObjectMatrix() {
  return Object.values(OBJECT_PROFILES).map((p) => ({
    key: p.key,
    label: p.label,
    joints: p.joints,
    meters: p.meters,
    points: p.points,
    diameter: p.diameter,
    thickness: p.thickness,
    logic: p.logic
  }));
}
