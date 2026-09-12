/** Тарифы НК и сварки (база прайса) */

export const NDT_TARIFFS = {
  vik: { key: 'vik', name: 'ВИК', joint: 250, meter: 150, point: 0, crew: 1, needsPoints: false },
  uzk: { key: 'uzk', name: 'УЗК', joint: 700, meter: 650, point: 0, crew: 2, needsPoints: false },
  rk: { key: 'rk', name: 'РК', joint: 1500, meter: 1300, point: 900, crew: 2, needsPoints: true },
  pvk: { key: 'pvk', name: 'ПВК', joint: 600, meter: 500, point: 0, crew: 1, needsPoints: false },
  mk: { key: 'mk', name: 'МК', joint: 650, meter: 550, point: 0, crew: 1, needsPoints: false },
  thick: { key: 'thick', name: 'УЗ толщинометрия', joint: 0, meter: 0, point: 180, crew: 1, needsPoints: true }
};

export const WELD_TARIFFS = {
  joint: 1200,
  meter: 950,
  /** роли бригады для оценки численности */
  roles: {
    welder: { label: 'Сварщик', perJointDay: 8, perMeterDay: 12 },
    helper: { label: 'Помощник', ratio: 0.5 }
  }
};

export const LOGISTICS_CFG = {
  baseCity: 'Москва',
  freeKm: 30,
  roadKmRate: 35,
  /** пороги авто-выбора транспорта, км */
  auto: {
    carMax: 200,
    trainMax: 900
  },
  /** запас на такси/трансфер вокруг вокзала/аэропорта */
  localTransfer: 2500,
  /** минимум ночей при выезде > 80 км */
  minNightsRemote: 1
};

export const WORK_TYPES = {
  ndt: { key: 'ndt', label: 'Только НК', includesNdt: true, includesWeld: false },
  welding: { key: 'welding', label: 'Только сварка', includesNdt: false, includesWeld: true },
  complex: { key: 'complex', label: 'Сварка + НК', includesNdt: true, includesWeld: true }
};
