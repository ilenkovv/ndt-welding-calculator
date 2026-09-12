/**
 * База городов / логистики (усреднённые цены билетов и отелей).
 * База выезда: Москва.
 * ticketAvgRT — средний билет туда-обратно на 1 чел. (₽)
 * hotelAvgNight — средний отель / ночь / чел. (₽)
 * distanceKm — расстояние от базы
 * aliases — варианты написания для поиска при вводе/удалении
 */
export const CITIES = [
  {
    id: 'msk', name: 'Москва', region: 'ЦФО', distanceKm: 0,
    ticketAvgRT: { car: 0, train: 0, flight: 0, bus: 0 },
    hotelAvgNight: 0,
    aliases: ['москва', 'мск', 'moscow']
  },
  {
    id: 'spb', name: 'Санкт-Петербург', region: 'СЗФО', distanceKm: 710,
    ticketAvgRT: { car: 9000, train: 6500, flight: 12000, bus: 4500 },
    hotelAvgNight: 4500,
    aliases: ['санкт-петербург', 'спб', 'питер', 'petersburg', 'st petersburg']
  },
  {
    id: 'tver', name: 'Тверь', region: 'ЦФО', distanceKm: 180,
    ticketAvgRT: { car: 2200, train: 1800, flight: 0, bus: 1200 },
    hotelAvgNight: 3200,
    aliases: ['тверь']
  },
  {
    id: 'tula', name: 'Тула', region: 'ЦФО', distanceKm: 185,
    ticketAvgRT: { car: 2300, train: 1700, flight: 0, bus: 1100 },
    hotelAvgNight: 3000,
    aliases: ['тула']
  },
  {
    id: 'nn', name: 'Нижний Новгород', region: 'ПФО', distanceKm: 420,
    ticketAvgRT: { car: 5500, train: 3200, flight: 9000, bus: 2800 },
    hotelAvgNight: 3800,
    aliases: ['нижний новгород', 'нновгород', 'нижний']
  },
  {
    id: 'kzn', name: 'Казань', region: 'ПФО', distanceKm: 820,
    ticketAvgRT: { car: 11000, train: 4800, flight: 9500, bus: 4200 },
    hotelAvgNight: 4000,
    aliases: ['казань', 'kazan']
  },
  {
    id: 'sam', name: 'Самара', region: 'ПФО', distanceKm: 1060,
    ticketAvgRT: { car: 14000, train: 5200, flight: 10000, bus: 5000 },
    hotelAvgNight: 3700,
    aliases: ['самара']
  },
  {
    id: 'ufa', name: 'Уфа', region: 'ПФО', distanceKm: 1350,
    ticketAvgRT: { car: 17000, train: 6200, flight: 11000, bus: 5800 },
    hotelAvgNight: 3600,
    aliases: ['уфа']
  },
  {
    id: 'ekb', name: 'Екатеринбург', region: 'УрФО', distanceKm: 1800,
    ticketAvgRT: { car: 22000, train: 7500, flight: 13000, bus: 7000 },
    hotelAvgNight: 4200,
    aliases: ['екатеринбург', 'екб', 'свердловск']
  },
  {
    id: 'chel', name: 'Челябинск', region: 'УрФО', distanceKm: 1900,
    ticketAvgRT: { car: 23000, train: 7800, flight: 12500, bus: 7200 },
    hotelAvgNight: 3500,
    aliases: ['челябинск']
  },
  {
    id: 'tyumen', name: 'Тюмень', region: 'УрФО', distanceKm: 2100,
    ticketAvgRT: { car: 26000, train: 9000, flight: 14000, bus: 8000 },
    hotelAvgNight: 3900,
    aliases: ['тюмень']
  },
  {
    id: 'nsk', name: 'Новосибирск', region: 'СФО', distanceKm: 3200,
    ticketAvgRT: { car: 38000, train: 12000, flight: 16000, bus: 11000 },
    hotelAvgNight: 4100,
    aliases: ['новосибирск', 'нск']
  },
  {
    id: 'kras', name: 'Красноярск', region: 'СФО', distanceKm: 4100,
    ticketAvgRT: { car: 48000, train: 15000, flight: 19000, bus: 13000 },
    hotelAvgNight: 4000,
    aliases: ['красноярск']
  },
  {
    id: 'irk', name: 'Иркутск', region: 'СФО', distanceKm: 5200,
    ticketAvgRT: { car: 60000, train: 18000, flight: 22000, bus: 16000 },
    hotelAvgNight: 3800,
    aliases: ['иркутск']
  },
  {
    id: 'khab', name: 'Хабаровск', region: 'ДФО', distanceKm: 8400,
    ticketAvgRT: { car: 0, train: 28000, flight: 32000, bus: 0 },
    hotelAvgNight: 4500,
    aliases: ['хабаровск']
  },
  {
    id: 'vl', name: 'Владивосток', region: 'ДФО', distanceKm: 9100,
    ticketAvgRT: { car: 0, train: 30000, flight: 35000, bus: 0 },
    hotelAvgNight: 4800,
    aliases: ['владивосток']
  },
  {
    id: 'rnd', name: 'Ростов-на-Дону', region: 'ЮФО', distanceKm: 1070,
    ticketAvgRT: { car: 13000, train: 5500, flight: 10500, bus: 4800 },
    hotelAvgNight: 3700,
    aliases: ['ростов-на-дону', 'ростов', 'ростов на дону']
  },
  {
    id: 'krd', name: 'Краснодар', region: 'ЮФО', distanceKm: 1350,
    ticketAvgRT: { car: 16000, train: 6000, flight: 11000, bus: 5200 },
    hotelAvgNight: 3900,
    aliases: ['краснодар']
  },
  {
    id: 'vlg', name: 'Волгоград', region: 'ЮФО', distanceKm: 970,
    ticketAvgRT: { car: 12000, train: 5000, flight: 10000, bus: 4500 },
    hotelAvgNight: 3400,
    aliases: ['волгоград']
  },
  {
    id: 'vrn', name: 'Воронеж', region: 'ЦФО', distanceKm: 520,
    ticketAvgRT: { car: 6500, train: 2800, flight: 8500, bus: 2400 },
    hotelAvgNight: 3300,
    aliases: ['воронеж']
  },
  {
    id: 'yar', name: 'Ярославль', region: 'ЦФО', distanceKm: 280,
    ticketAvgRT: { car: 3500, train: 2200, flight: 0, bus: 1600 },
    hotelAvgNight: 3100,
    aliases: ['ярославль']
  },
  {
    id: 'perm', name: 'Пермь', region: 'ПФО', distanceKm: 1400,
    ticketAvgRT: { car: 17500, train: 6500, flight: 11500, bus: 6000 },
    hotelAvgNight: 3600,
    aliases: ['пермь']
  },
  {
    id: 'oms', name: 'Омск', region: 'СФО', distanceKm: 2700,
    ticketAvgRT: { car: 32000, train: 11000, flight: 15000, bus: 10000 },
    hotelAvgNight: 3500,
    aliases: ['омск']
  }
];

export const TRANSPORT_MODES = {
  auto: { key: 'auto', label: 'Авто (по расстоянию)' },
  car: { key: 'car', label: 'Автомобиль' },
  train: { key: 'train', label: 'Поезд' },
  flight: { key: 'flight', label: 'Самолёт' },
  bus: { key: 'bus', label: 'Автобус' }
};
