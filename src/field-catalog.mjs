/**
 * Каталог полей: описания для UI + скрипты робота и человека.
 * Один источник правды для лаб, бота-секретаря и менеджера.
 */
export const FIELD_CATALOG = {
  client: {
    id: 'client',
    num: '1',
    label: 'Клиент / организация',
    description: 'Наименование заказчика для сделки и КП. На цену не влияет.',
    placeholder: 'ООО «Пример»',
    botAsk: 'Как называется организация-заказчик?',
    botFollowUp: 'Если название длинное — зафиксируйте краткое и полное.',
    humanTip: 'Сверьте юр. название с карточкой / реквизитами. Не путать с площадкой работ.',
    required: true,
    price: false,
    owner: 'shared'
  },
  contact: {
    id: 'contact',
    num: '2',
    label: 'Контакт',
    description: 'ФИО и телефон ЛПР / инженера на объекте. Для связи и КП.',
    placeholder: 'Иванов И.И., +7…',
    botAsk: 'Кто контактное лицо и какой телефон?',
    botFollowUp: 'Уточните роль: инженер, снабжение, директор.',
    humanTip: 'Запишите роль контакта. Если несколько — основной + на объекте.',
    required: true,
    price: false,
    owner: 'shared'
  },
  city: {
    id: 'city',
    num: '3',
    label: 'Город',
    description: 'Город выезда. Из базы подтягиваются расстояние, усреднённые билеты и отель. Очистка города сбрасывает логистику.',
    placeholder: 'Казань, СПб, Тверь…',
    botAsk: 'В каком городе объект?',
    botFollowUp: 'Если города нет в базе — всё равно запишите; логистику уточнит менеджер.',
    humanTip: 'Сверьте написание с базой. При очистке города сумма логистики обнуляется.',
    required: true,
    price: true,
    owner: 'logistics'
  },
  address: {
    id: 'address',
    num: '3b',
    label: 'Адрес / площадка',
    description: 'Улица, цех, площадка. Не меняет тариф города. Очистка адреса не сбрасывает город.',
    placeholder: 'ул. …, цех / площадка',
    botAsk: 'Какой точный адрес или название площадки?',
    botFollowUp: 'Можно кратко: «площадка Север», «цех №3».',
    humanTip: 'Нужен для проезда бригады. На усреднённый тариф города не влияет.',
    required: false,
    price: false,
    owner: 'logistics'
  },
  workType: {
    id: 'workType',
    num: '4',
    label: 'Тип работ',
    description: 'Включает НК и/или сварку. «Только сварка» скрывает методы НК и точки.',
    placeholder: '',
    botAsk: 'Какие работы нужны: только НК, только сварка или сварка + НК?',
    botFollowUp: 'Если клиент не уверен — предложите «сварка + НК» и уточните методы позже.',
    humanTip: 'От выбора зависят видимые поля и база цены. Не смешивайте с «методами НК».',
    required: true,
    price: true,
    owner: 'shared',
    options: [
      { value: 'ndt', label: 'Только НК' },
      { value: 'welding', label: 'Только сварка' },
      { value: 'complex', label: 'Сварка + НК' }
    ]
  },
  object: {
    id: 'object',
    num: '5',
    label: 'Объект',
    description: 'Тип конструкции. Задаёт, какие поля объёма и геометрии обязательны / скрыты (например, диаметр скрыт у металлоконструкций).',
    placeholder: '',
    botAsk: 'Что за объект: трубопровод, резервуар, металлоконструкция, сосуд/котёл или другое?',
    botFollowUp: 'Если «другое» — попросите коротко описать в комментарии.',
    humanTip: 'Профиль объекта управляет стыками / п.м. / диаметром. Для металла диаметр не применяется.',
    required: true,
    price: true,
    owner: 'shared',
    options: [
      { value: 'pipe', label: 'Трубопровод' },
      { value: 'tank', label: 'Резервуар' },
      { value: 'metal', label: 'Металлоконструкция' },
      { value: 'vessel', label: 'Сосуд / котёл' },
      { value: 'other', label: 'Другое' }
    ]
  },
  joints: {
    id: 'joints',
    num: '6',
    label: 'Стыки, шт.',
    description: 'Количество стыков / швов «по штукам». Основной объём для труб и сосудов; для металла — опционально.',
    placeholder: '0',
    botAsk: 'Сколько стыков нужно сварить или проконтролировать?',
    botFollowUp: 'Если считают погонные метры — стыки можно оставить 0.',
    humanTip: 'Не путать со снимками РК. Стык = единица объёма для тарифа «за стык».',
    required: false,
    price: true,
    owner: 'shared'
  },
  meters: {
    id: 'meters',
    num: '7',
    label: 'Длина шва, п.м.',
    description: 'Погонные метры шва. Основной объём для металлоконструкций и протяжённых швов.',
    placeholder: '0',
    botAsk: 'Какая длина швов в погонных метрах?',
    botFollowUp: 'Если объём только в стыках — п.м. = 0.',
    humanTip: 'Для металла это главный объём. Можно сочетать со стыками (штуцера и т.п.).',
    required: false,
    price: true,
    owner: 'shared'
  },
  points: {
    id: 'points',
    num: '8',
    label: 'Точки / снимки, шт.',
    description: 'Точки контроля или снимки. Нужны для РК и УЗ-толщинометрии. Скрыто при «только сварка».',
    placeholder: '0',
    botAsk: 'Сколько точек контроля или снимков нужно?',
    botFollowUp: 'Спрашивайте, если выбран РК или толщинометрия. Иначе можно пропустить.',
    humanTip: 'Активируется методами РК / толщинометрия. При сварке без НК поле скрыто.',
    required: false,
    price: true,
    owner: 'ndt'
  },
  diameter: {
    id: 'diameter',
    num: '9',
    label: 'Диаметр, мм',
    description: 'Наружный диаметр трубы / сосуда / цилиндра. Даёт коэффициент диаметра. Для металлоконструкций не применяется (k=1).',
    placeholder: '108',
    botAsk: 'Какой диаметр трубы или сосуда в миллиметрах?',
    botFollowUp: 'Для металлоконструкций вопрос можно пропустить.',
    humanTip: 'Скрыт у профиля «металл». Чем больше Ø, тем выше коэффициент.',
    required: false,
    price: true,
    owner: 'shared'
  },
  thickness: {
    id: 'thickness',
    num: '10',
    label: 'Толщина, мм',
    description: 'Толщина стенки / металла. Даёт коэффициент толщины для почти всех объектов.',
    placeholder: '6',
    botAsk: 'Какая толщина стенки или металла в миллиметрах?',
    botFollowUp: 'Если диапазон — берите наибольшую рабочую толщину.',
    humanTip: 'Всегда участвует в цене при видимом поле. Уточняйте по чертежу / паспорту.',
    required: true,
    price: true,
    owner: 'shared'
  },
  methods: {
    id: 'methods',
    num: '11',
    label: 'Методы НК',
    description: 'ВИК, УЗК, РК, ПВК, МК, УЗ-толщинометрия. Задают тарифы НК. РК и толщинометрия требуют точки/снимки.',
    placeholder: '',
    botAsk: 'Какие методы контроля нужны: ВИК, УЗК, РК, ПВК, МК, толщинометрия?',
    botFollowUp: 'Можно несколько. Если клиент сказал «рентген» — это РК; «ультразвук швов» — УЗК.',
    humanTip: 'Без методов база НК = 0. РК/толщинометрия → обязательно спросить точки.',
    required: false,
    price: true,
    owner: 'ndt',
    options: [
      { value: 'vik', label: 'ВИК' },
      { value: 'uzk', label: 'УЗК' },
      { value: 'rk', label: 'РК' },
      { value: 'pvk', label: 'ПВК' },
      { value: 'mk', label: 'МК' },
      { value: 'thick', label: 'УЗ толщинометрия' }
    ]
  },
  urgency: {
    id: 'urgency',
    num: '12',
    label: 'Срочность',
    description: 'Множитель на работы: стандарт ×1, срочно ×1.3, экстренно ×1.5. На логистику не действует.',
    placeholder: '',
    botAsk: 'Какие сроки: стандарт, срочно (+30%) или экстренно (+50%)?',
    botFollowUp: 'Если «на этой неделе» без уточнения — ставьте срочно и отметьте в комментарии.',
    humanTip: 'Умножается только на работы, не на билеты/отель.',
    required: true,
    price: true,
    owner: 'shared',
    options: [
      { value: '1', label: 'Стандарт' },
      { value: '1.3', label: 'Срочно (+30%)' },
      { value: '1.5', label: 'Экстренно (+50%)' }
    ]
  },
  access: {
    id: 'access',
    num: '13',
    label: 'Доступ',
    description: 'Сложность доступа к месту работ: нормальный / стеснённый / высота / опасный. Множитель на работы.',
    placeholder: '',
    botAsk: 'Какой доступ к месту работ: нормальный, стеснённый, высота/сложный или опасный?',
    botFollowUp: 'Высота, колодец, действующее производство — не «нормальный».',
    humanTip: 'Влияет на цену работ и на состав бригады/СИЗ. Фиксируйте в комментарии детали.',
    required: true,
    price: true,
    owner: 'shared',
    options: [
      { value: '1', label: 'Нормальный' },
      { value: '1.15', label: 'Стеснённый (+15%)' },
      { value: '1.25', label: 'Высота / сложный (+25%)' },
      { value: '1.4', label: 'Опасный (+40%)' }
    ]
  },
  transport: {
    id: 'transport',
    num: '14',
    label: 'Транспорт',
    description: 'Способ доставки бригады. Режим «Авто» выбирает автомобиль / поезд / самолёт по расстоянию и базе билетов.',
    placeholder: '',
    botAsk: 'Транспорт оставить автоматически по городу или выбрать вручную?',
    botFollowUp: 'По умолчанию — авто-режим.',
    humanTip: 'Auto: ≤200 км авто, ≤900 км поезд, иначе самолёт (если есть билет в базе).',
    required: true,
    price: true,
    owner: 'logistics',
    options: [
      { value: 'auto', label: 'Авто (по расстоянию)' },
      { value: 'car', label: 'Автомобиль' },
      { value: 'train', label: 'Поезд' },
      { value: 'flight', label: 'Самолёт' },
      { value: 'bus', label: 'Автобус' }
    ]
  },
  people: {
    id: 'people',
    num: '15b',
    label: 'Человек в выезде',
    description: 'Число сотрудников в командировке. Умножает билеты, трансфер и отель.',
    placeholder: '2',
    botAsk: 'Сколько человек поедет на объект?',
    botFollowUp: 'Если неизвестно — ориентир по бригаде НК/сварки из расчёта.',
    humanTip: 'Сверяйте с оценкой бригады (crew) из модулей НК/сварки.',
    required: true,
    price: true,
    owner: 'logistics'
  },
  nights: {
    id: 'nights',
    num: '15',
    label: 'Ночи проживания',
    description: 'Ночи в отеле. Пусто = авто по дням работ и расстоянию (>80 км). Усреднённая цена отеля из базы города.',
    placeholder: 'авто',
    botAsk: 'На сколько ночей нужно проживание? Или посчитать автоматически?',
    botFollowUp: 'Если клиент не знает — оставьте авто.',
    humanTip: 'Авто: при выезде >80 км ночи ≥ max(1, дни работ).',
    required: false,
    price: true,
    owner: 'logistics'
  },
  workDays: {
    id: 'workDays',
    num: '15c',
    label: 'Дни работ',
    description: 'Плановая длительность работ в днях. Используется для авто-расчёта ночей.',
    placeholder: '1',
    botAsk: 'На сколько дней рассчитаны работы на объекте?',
    botFollowUp: 'Если «пара дней» — поставьте 2.',
    humanTip: 'Влияет на авто-ночи, не на тариф работ напрямую.',
    required: false,
    price: true,
    owner: 'logistics'
  },
  comment: {
    id: 'comment',
    num: '16',
    label: 'Комментарий',
    description: 'Марка стали, НТД, график, особенности допуска. На цену не влияет, важно для КП.',
    placeholder: 'НТД, марка стали, график, допуск…',
    botAsk: 'Есть особые требования: НТД, марка стали, график, пропускной режим?',
    botFollowUp: 'Если нет — оставьте пустым.',
    humanTip: 'Переносите в КП дословно ключевые ограничения заказчика.',
    required: false,
    price: false,
    owner: 'shared'
  }
};

/** Порядок опроса для бота / менеджера */
export const INTAKE_ORDER = [
  'client', 'contact', 'city', 'address',
  'workType', 'object',
  'joints', 'meters', 'points',
  'diameter', 'thickness',
  'methods',
  'urgency', 'access',
  'transport', 'people', 'workDays', 'nights',
  'comment'
];

export function getField(id) {
  return FIELD_CATALOG[id] || null;
}

export function listFields() {
  return INTAKE_ORDER.map((id) => FIELD_CATALOG[id]).filter(Boolean);
}

/** Поля, видимые для скрипта при выбранном типе работ */
export function fieldsForWorkType(workType = 'ndt') {
  return listFields().filter((f) => {
    if (workType === 'welding' && (f.id === 'methods' || f.id === 'points')) return false;
    if (workType === 'ndt' && f.owner === 'shared' && f.id === 'workType') return true;
    return true;
  });
}
