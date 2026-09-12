/**
 * Профиль объекта: роль полей объёма/геометрии.
 * yes  — основное / обязательно учитывать
 * soft — опционально, видно и учитывается если заполнено
 * no   — скрыто, в расчёте 0 / коэфф. = 1
 */
export const OBJECT_PROFILES = {
  pipe: {
    key: 'pipe',
    label: 'Трубопровод',
    joints: 'yes', meters: 'soft', points: 'soft', diameter: 'yes', thickness: 'yes',
    logic: 'Диаметр + толщина + стыки. П.м. — дополнительно для протяжённых швов.'
  },
  metal: {
    key: 'metal',
    label: 'Металлоконструкция',
    joints: 'soft', meters: 'yes', points: 'soft', diameter: 'no', thickness: 'yes',
    logic: 'Толщина + погонные метры. Диаметр не применим. Стыки — опционально.'
  },
  tank: {
    key: 'tank',
    label: 'Резервуар / ёмкость',
    joints: 'soft', meters: 'yes', points: 'soft', diameter: 'yes', thickness: 'yes',
    logic: 'Толщина + п.м. швов; диаметр для цилиндра; стыки — штуцера/врезки.'
  },
  vessel: {
    key: 'vessel',
    label: 'Сосуд / котёл',
    joints: 'yes', meters: 'soft', points: 'soft', diameter: 'yes', thickness: 'yes',
    logic: 'Диаметр + толщина + стыки (швы корпуса/патрубков).'
  },
  other: {
    key: 'other',
    label: 'Другое',
    joints: 'yes', meters: 'yes', points: 'yes', diameter: 'yes', thickness: 'yes',
    logic: 'Все поля доступны; заполняются по факту ТЗ.'
  }
};

export function getObjectProfile(key) {
  return OBJECT_PROFILES[key] || OBJECT_PROFILES.other;
}
