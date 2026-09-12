import { CITIES, TRANSPORT_MODES } from '../data/cities.mjs';
import { LOGISTICS_CFG } from '../tariffs.mjs';
import { normalizeText, roundMoney, safeNum, clampMin } from '../utils.mjs';

/**
 * Вид работ / блок: логистика.
 * При вводе города/адреса — подтягивание из базы:
 *  - усреднённые билеты
 *  - отели
 *  - авто-выбор транспорта
 * При очистке города — сброс подсказок.
 */

function citySearchBlob(city) {
  return normalizeText([city.name, city.region, ...(city.aliases || [])].join(' '));
}

/** Поиск города по строке ввода (город или «город, адрес») */
export function findCity(query) {
  const q = normalizeText(query);
  if (!q) return null;

  // точное совпадение имени/алиаса
  for (const c of CITIES) {
    const names = [c.name, ...(c.aliases || [])].map(normalizeText);
    if (names.includes(q)) return c;
  }

  // город в начале строки «казань, ул. ленина 1»
  const head = q.split(',')[0].trim();
  for (const c of CITIES) {
    const names = [c.name, ...(c.aliases || [])].map(normalizeText);
    if (names.includes(head)) return c;
  }

  // частичное вхождение
  let best = null;
  let bestScore = 0;
  for (const c of CITIES) {
    const blob = citySearchBlob(c);
    if (blob.includes(head) || head.includes(normalizeText(c.name))) {
      const score = normalizeText(c.name).length;
      if (score > bestScore) {
        best = c;
        bestScore = score;
      }
    }
  }
  return best;
}

export function suggestCities(query, limit = 8) {
  const q = normalizeText(query);
  if (!q) return CITIES.slice(0, limit);
  return CITIES.filter((c) => citySearchBlob(c).includes(q) || normalizeText(c.name).startsWith(q))
    .slice(0, limit);
}

/**
 * Авто-выбор транспорта по расстоянию и доступности билетов в базе.
 */
export function pickTransportAuto(city) {
  if (!city || city.distanceKm <= 0) {
    return { mode: 'car', label: TRANSPORT_MODES.car.label, reason: 'Работы на базе / в городе базы' };
  }
  const d = city.distanceKm;
  const tickets = city.ticketAvgRT || {};
  const { carMax, trainMax } = LOGISTICS_CFG.auto;

  const available = (mode) => {
    if (mode === 'car') return true;
    return safeNum(tickets[mode]) > 0;
  };

  if (d <= carMax && available('car')) {
    return { mode: 'car', label: TRANSPORT_MODES.car.label, reason: `≤ ${carMax} км → автомобиль` };
  }
  if (d <= trainMax && available('train')) {
    return { mode: 'train', label: TRANSPORT_MODES.train.label, reason: `≤ ${trainMax} км → поезд (усреднённый билет)` };
  }
  if (available('flight')) {
    return { mode: 'flight', label: TRANSPORT_MODES.flight.label, reason: `> ${trainMax} км → самолёт (усреднённый билет)` };
  }
  if (available('train')) {
    return { mode: 'train', label: TRANSPORT_MODES.train.label, reason: 'Самолёт недоступен в базе → поезд' };
  }
  if (available('bus')) {
    return { mode: 'bus', label: TRANSPORT_MODES.bus.label, reason: 'Запасной вариант → автобус' };
  }
  return { mode: 'car', label: TRANSPORT_MODES.car.label, reason: 'Нет билетов в базе → автомобиль' };
}

function roadCost(distanceKm) {
  const paid = Math.max(0, safeNum(distanceKm) - LOGISTICS_CFG.freeKm);
  // туда-обратно по дороге для автомобиля
  return paid * LOGISTICS_CFG.roadKmRate * 2;
}

/**
 * Расчёт логистики из базы города.
 * transportMode: auto | car | train | flight | bus
 */
export function calculateLogistics(input = {}) {
  const {
    cityQuery = '',
    address = '',
    transportMode = 'auto',
    people = 1,
    nights = null,
    workDays = 1,
    manualDistance = null,
    cleared = false
  } = input;

  if (cleared || !normalizeText(cityQuery)) {
    return emptyLogistics('Город очищен или не указан — подсказки базы сброшены');
  }

  const city = findCity(cityQuery);
  if (!city) {
    return {
      ...emptyLogistics('Город не найден в базе — введите вручную или выберите из списка'),
      query: cityQuery,
      address: String(address || ''),
      matched: false
    };
  }

  const distanceKm = manualDistance != null && manualDistance !== ''
    ? safeNum(manualDistance)
    : city.distanceKm;

  const picked = transportMode === 'auto'
    ? pickTransportAuto({ ...city, distanceKm })
    : {
        mode: transportMode,
        label: TRANSPORT_MODES[transportMode]?.label || transportMode,
        reason: 'Ручной выбор транспорта'
      };

  const ppl = Math.max(1, Math.round(safeNum(people) || 1));
  const days = Math.max(1, safeNum(workDays) || 1);
  const autoNights = distanceKm > 80
    ? Math.max(LOGISTICS_CFG.minNightsRemote, Math.ceil(days))
    : 0;
  const nightsFinal = nights == null || nights === '' ? autoNights : clampMin(nights, 0);

  const ticketUnit = safeNum(city.ticketAvgRT?.[picked.mode]);
  let tickets = 0;
  let road = 0;
  let transfer = 0;

  if (picked.mode === 'car') {
    road = roadCost(distanceKm);
    tickets = 0;
  } else {
    tickets = ticketUnit * ppl;
    transfer = distanceKm > 0 ? LOGISTICS_CFG.localTransfer * ppl : 0;
    // лёгкая дорожная составляющая до вокзала/аэропорта не дублируем сильно
  }

  const hotelUnit = safeNum(city.hotelAvgNight);
  const hotel = hotelUnit * nightsFinal * ppl;

  const total = roundMoney(tickets + road + transfer + hotel);

  return {
    matched: true,
    query: cityQuery,
    address: String(address || ''),
    city: {
      id: city.id,
      name: city.name,
      region: city.region,
      distanceKm,
      hotelAvgNight: hotelUnit,
      ticketAvgRT: { ...city.ticketAvgRT }
    },
    transport: {
      mode: picked.mode,
      label: picked.label,
      reason: picked.reason,
      requested: transportMode
    },
    people: ppl,
    nights: nightsFinal,
    workDays: days,
    costs: {
      tickets: roundMoney(tickets),
      ticketUnit: roundMoney(ticketUnit),
      road: roundMoney(road),
      transfer: roundMoney(transfer),
      hotel: roundMoney(hotel),
      hotelUnit: roundMoney(hotelUnit),
      total
    },
    cfg: {
      freeKm: LOGISTICS_CFG.freeKm,
      roadKmRate: LOGISTICS_CFG.roadKmRate,
      baseCity: LOGISTICS_CFG.baseCity
    },
    message: `База: ${city.name}. ${picked.label}. Билеты/отель — усреднённые из справочника.`
  };
}

function emptyLogistics(message) {
  return {
    matched: false,
    query: '',
    address: '',
    city: null,
    transport: { mode: 'auto', label: TRANSPORT_MODES.auto.label, reason: message, requested: 'auto' },
    people: 0,
    nights: 0,
    workDays: 0,
    costs: { tickets: 0, ticketUnit: 0, road: 0, transfer: 0, hotel: 0, hotelUnit: 0, total: 0 },
    cfg: {
      freeKm: LOGISTICS_CFG.freeKm,
      roadKmRate: LOGISTICS_CFG.roadKmRate,
      baseCity: LOGISTICS_CFG.baseCity
    },
    message
  };
}

export function listCities() {
  return CITIES.map((c) => ({
    id: c.id,
    name: c.name,
    region: c.region,
    distanceKm: c.distanceKm,
    hotelAvgNight: c.hotelAvgNight
  }));
}

export function transportModes() {
  return Object.values(TRANSPORT_MODES);
}
