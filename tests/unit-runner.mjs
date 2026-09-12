/**
 * Расширенный unit-набор по видам работ (без браузера).
 * Запуск: npm run test:unit
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const art = path.join(root, 'test-artifacts');
fs.mkdirSync(art, { recursive: true });

let failed = 0;
const results = [];

function expect(cond, name, detail = '') {
  if (cond) {
    results.push({ name, ok: true, detail });
    console.log(`PASS  ${name}${detail ? ' — ' + detail : ''}`);
  } else {
    failed++;
    results.push({ name, ok: false, detail });
    console.error(`FAIL  ${name}${detail ? ' — ' + detail : ''}`);
  }
}

async function load() {
  return import(pathToFileURL(path.join(root, 'src/index.mjs')).href);
}

const {
  calculateNdt,
  calculateWelding,
  calculateLogistics,
  findCity,
  suggestCities,
  pickTransportAuto,
  resolveDependencies,
  listObjectMatrix,
  listNdtMethods,
  FIELD_ROLES,
  OBJECT_PROFILES,
  NDT_TARIFFS,
  coeffThickness,
  coeffDiameter
} = await load();

console.log('\n=== A. РОЛИ И ЗАВИСИМОСТИ ===\n');

{
  const keys = Object.keys(FIELD_ROLES);
  expect(keys.length >= 15, 'A1. FIELD_ROLES содержит поля формы', String(keys.length));
  expect(FIELD_ROLES.city.owner === 'logistics' && FIELD_ROLES.city.price === true, 'A2. Город — роль logistics, влияет на цену');
  expect(FIELD_ROLES.methods.owner === 'ndt', 'A3. Методы принадлежат виду НК');
  expect(FIELD_ROLES.points.owner === 'ndt', 'A4. Точки принадлежат виду НК');
}

{
  const matrix = listObjectMatrix();
  expect(matrix.length === 5, 'A5. Матрица объектов: 5 профилей', String(matrix.length));
  const metal = resolveDependencies({ workType: 'ndt', objectKey: 'metal' });
  expect(metal.effective.showDiameter === false, 'A6. Металл: диаметр скрыт');
  expect(metal.effective.showMeters === true, 'A7. Металл: п.м. видны');
  expect(metal.fields.diameter.state === 'no', 'A8. Металл: diameter state=no');
}

{
  const weld = resolveDependencies({ workType: 'welding', objectKey: 'pipe' });
  expect(weld.effective.showMethods === false, 'A9. Сварка: методы скрыты');
  expect(weld.effective.showPoints === false, 'A10. Сварка: точки скрыты');
  expect(weld.effective.includesWeld === true && weld.effective.includesNdt === false, 'A11. Сварка: флаги вида работ');
}

{
  const ndtRk = resolveDependencies({ workType: 'ndt', objectKey: 'pipe', methods: ['rk'] });
  expect(ndtRk.effective.showPoints === true, 'A12. НК+РК: точки активны');
  const ndtVik = resolveDependencies({ workType: 'ndt', objectKey: 'pipe', methods: ['vik'] });
  expect(['soft', 'yes'].includes(ndtVik.fields.points.state), 'A13. НК+ВИК: точки по профилю', ndtVik.fields.points.state);
}

{
  // все комбинации объект × вид работ
  let combos = 0;
  for (const obj of Object.keys(OBJECT_PROFILES)) {
    for (const wt of ['ndt', 'welding']) {
      const d = resolveDependencies({ workType: wt, objectKey: obj, methods: wt === 'ndt' ? ['vik'] : [] });
      expect(!!d.effective, `A14. deps ${obj}/${wt} резолвятся`);
      combos++;
      if (wt === 'welding') {
        expect(d.effective.showMethods === false, `A15. ${obj}/welding: methods off`);
      }
      if (obj === 'metal') {
        expect(d.effective.showDiameter === false, `A16. metal/${wt}: diameter off`);
      }
    }
  }
  expect(combos === 10, 'A17. Проверено 10 комбинаций объект×вид', String(combos));
}

console.log('\n=== B. ВИД РАБОТ: НК ===\n');

{
  const methods = listNdtMethods();
  expect(methods.length === 6, 'B1. 6 методов НК', String(methods.length));
  expect(NDT_TARIFFS.vik.joint === 250, 'B2. Тариф ВИК стык 250');
  expect(NDT_TARIFFS.rk.needsPoints === true && NDT_TARIFFS.thick.needsPoints === true, 'B3. РК и толщинометрия требуют точки');
}

{
  const r = calculateNdt({
    objectKey: 'pipe', methods: ['vik'], joints: 10, meters: 0, points: 0,
    diameter: 108, thickness: 6, urgency: 1, access: 1
  });
  expect(r.ndtBase === 2500, 'B4. Труба ВИК 10 стыков база 2500', String(r.ndtBase));
  expect(r.weldBase === 0, 'B5. НК: сварка = 0');
  expect(r.total === 2500, 'B6. НК итог 2500', String(r.total));
  expect(r.crew === 1, 'B7. ВИК crew=1');
}

{
  const r = calculateNdt({
    objectKey: 'vessel', methods: ['uzk'], joints: 5, diameter: 219, thickness: 15
  });
  // 5*700=3500; kt=1.15 kd=1.08 → 4347
  const expected = Math.round(3500 * 1.15 * 1.08);
  expect(r.ndtBase === 3500, 'B8. УЗК база 3500');
  expect(r.total === expected, `B9. УЗК с коэфф. = ${expected}`, String(r.total));
  expect(r.crew === 2, 'B10. УЗК crew=2');
}

{
  const r = calculateNdt({
    objectKey: 'pipe', methods: ['rk'], joints: 0, meters: 0, points: 4, diameter: 108, thickness: 6
  });
  expect(r.total === 3600, 'B11. РК 4 снимка = 3600', String(r.total));
  expect(r.deps.effective.showPoints === true, 'B12. РК включает точки');
}

{
  const r = calculateNdt({
    objectKey: 'pipe', methods: ['thick'], points: 10, diameter: 108, thickness: 6
  });
  expect(r.total === 1800, 'B13. Толщинометрия 10 точек = 1800', String(r.total));
}

{
  const r = calculateNdt({
    objectKey: 'metal', methods: ['vik'], joints: 0, meters: 10, diameter: 1020, thickness: 6
  });
  // 10*150=1500; diameter ignored
  expect(r.total === 1500, 'B14. Металл: диаметр игнорируется', String(r.total));
  expect(r.kd === 1, 'B15. Металл kd=1');
}

{
  const r = calculateNdt({
    objectKey: 'tank', methods: ['pvk', 'mk'], meters: 10, joints: 2, diameter: 108, thickness: 8
  });
  // pvk: 2*600+10*500=6200; mk: 2*650+10*550=6800; base=13000
  expect(r.ndtBase === 13000, 'B16. ПВК+МК комбинированный тариф', String(r.ndtBase));
}

{
  const r = calculateNdt({ objectKey: 'pipe', methods: [], joints: 10 });
  expect(r.warnings.some((w) => /метод/i.test(w)), 'B17. Предупреждение без методов', r.warnings.join(';'));
}

{
  const r = calculateNdt({
    objectKey: 'pipe', methods: ['vik'], joints: 10, thickness: 25, diameter: 530,
    urgency: 1.3, access: 1.15
  });
  const base = 2500;
  const expected = Math.round(base * coeffThickness(25) * coeffDiameter(530) * 1.3 * 1.15);
  expect(r.total === expected, `B18. Срочность×доступ = ${expected}`, String(r.total));
}

{
  // скрытые стыки на metal soft — всё ещё видны soft; joints учитываются
  const r = calculateNdt({ objectKey: 'metal', methods: ['vik'], joints: 4, meters: 0, thickness: 6 });
  expect(r.ndtBase === 1000, 'B19. Металл soft-стыки учитываются если заполнены', String(r.ndtBase));
}

console.log('\n=== C. ВИД РАБОТ: СВАРКА ===\n');

{
  const r = calculateWelding({
    objectKey: 'pipe', joints: 10, meters: 0, diameter: 108, thickness: 6
  });
  expect(r.weldBase === 12000, 'C1. 10 стыков × 1200 = 12000', String(r.weldBase));
  expect(r.ndtBase === 0, 'C2. Сварка: НК = 0');
  expect(r.deps.effective.showMethods === false, 'C3. Методы скрыты');
  expect(r.total === 12000, 'C4. Итог 12000');
}

{
  const r = calculateWelding({
    objectKey: 'metal', joints: 0, meters: 10, diameter: 530, thickness: 12
  });
  const expected = Math.round(9500 * 1.15);
  expect(r.weldBase === 9500, 'C5. 10 п.м. × 950 = 9500');
  expect(r.kd === 1, 'C6. Металл: kd=1 при сварке');
  expect(r.total === expected, `C7. Сварка металл t=12 = ${expected}`, String(r.total));
}

{
  const r = calculateWelding({ objectKey: 'vessel', joints: 5, meters: 2, diameter: 219, thickness: 15 });
  // weld=5*1200+2*950=7900; *1.15*1.08
  const expected = Math.round(7900 * 1.15 * 1.08);
  expect(r.total === expected, `C8. Сосуд стыки+п.м. = ${expected}`, String(r.total));
  expect(r.crew.welders >= 1, 'C9. Оценка роли сварщика ≥ 1', String(r.crew.welders));
  expect(r.crew.roles.some((x) => x.key === 'helper'), 'C10. Роль помощника в бригаде');
}

{
  const r = calculateWelding({ objectKey: 'pipe', joints: 0, meters: 0 });
  expect(r.warnings.length > 0, 'C11. Предупреждение при нулевом объёме');
  expect(r.crew.total === 0, 'C12. Бригада 0 при нулевом объёме');
}

{
  const r = calculateWelding({
    objectKey: 'tank', joints: 100, meters: 50, diameter: 108, thickness: 6
  });
  expect(r.crew.welders >= 5, 'C13. Большой объём → больше сварщиков', String(r.crew.welders));
}

{
  // points не должны влиять на сварку даже если переданы
  const a = calculateWelding({ objectKey: 'pipe', joints: 2, points: 100, diameter: 108, thickness: 6 });
  const b = calculateWelding({ objectKey: 'pipe', joints: 2, points: 0, diameter: 108, thickness: 6 });
  expect(a.total === b.total, 'C14. Точки не влияют на сварку', `${a.total} vs ${b.total}`);
}

console.log('\n=== D. ЛОГИСТИКА: ГОРОД / БИЛЕТЫ / ОТЕЛИ / AUTO ===\n');

{
  expect(findCity('Казань')?.id === 'kzn', 'D1. Поиск «Казань»');
  expect(findCity('kazan')?.id === 'kzn', 'D2. Поиск alias kazan');
  expect(findCity('Казань, ул. Баумана 1')?.id === 'kzn', 'D3. Город + адрес');
  expect(findCity('питер')?.id === 'spb', 'D4. Alias питер → СПб');
  expect(findCity('') === null, 'D5. Пустая строка → null');
  expect(findCity('Атлантида') === null, 'D6. Неизвестный город → null');
}

{
  const cleared = calculateLogistics({ cityQuery: '', cleared: true });
  expect(cleared.costs.total === 0 && cleared.matched === false, 'D7. Очистка города сбрасывает сумму');
  expect(/сброшен/i.test(cleared.message), 'D8. Сообщение о сбросе', cleared.message);
}

{
  const r = calculateLogistics({ cityQuery: 'Тверь', transportMode: 'auto', people: 2, workDays: 2 });
  expect(r.matched === true, 'D9. Тверь найдена');
  expect(r.transport.mode === 'car', 'D10. Тверь auto → автомобиль', r.transport.mode);
  expect(r.costs.road > 0, 'D11. Дорога > 0', String(r.costs.road));
  expect(r.nights >= 1, 'D12. Ночи для выезда >80 км', String(r.nights));
  expect(r.costs.hotel > 0, 'D13. Отель из базы', String(r.costs.hotel));
}

{
  const r = calculateLogistics({ cityQuery: 'Казань', transportMode: 'auto', people: 1, nights: 2 });
  expect(r.transport.mode === 'train', 'D14. Казань auto → поезд', r.transport.mode + ' / ' + r.transport.reason);
  expect(r.costs.tickets === r.city.ticketAvgRT.train, 'D15. Билет = усреднённый train RT', String(r.costs.tickets));
  expect(r.costs.hotel === r.city.hotelAvgNight * 2, 'D16. Отель = avg × ночи', String(r.costs.hotel));
  expect(r.costs.transfer > 0, 'D17. Трансфер вокзал', String(r.costs.transfer));
}

{
  const r = calculateLogistics({ cityQuery: 'Новосибирск', transportMode: 'auto', people: 2, nights: 3 });
  expect(r.transport.mode === 'flight', 'D18. Новосибирск auto → самолёт', r.transport.mode);
  expect(r.costs.tickets === r.city.ticketAvgRT.flight * 2, 'D19. Билеты × люди', String(r.costs.tickets));
}

{
  const r = calculateLogistics({ cityQuery: 'Владивосток', transportMode: 'auto', people: 1, nights: 1 });
  expect(r.transport.mode === 'flight', 'D20. Владивосток → flight', r.transport.mode);
  expect(r.city.ticketAvgRT.car === 0, 'D21. В базе car=0 для ДФО');
}

{
  const manual = calculateLogistics({
    cityQuery: 'Казань', transportMode: 'flight', people: 1, nights: 1
  });
  expect(manual.transport.mode === 'flight', 'D22. Ручной override → flight');
  expect(manual.costs.tickets === manual.city.ticketAvgRT.flight, 'D23. Ручной билет flight');
}

{
  const local = calculateLogistics({ cityQuery: 'Москва', transportMode: 'auto', people: 1 });
  expect(local.costs.total === 0, 'D24. Москва/база → логистика 0', String(local.costs.total));
  expect(local.transport.mode === 'car', 'D25. База → car');
}

{
  const s = suggestCities('крас');
  expect(s.some((c) => c.id === 'kras') && s.some((c) => c.id === 'krd'), 'D26. suggestCities «крас» → Красноярск/Краснодар');
}

{
  const pick = pickTransportAuto(findCity('Воронеж'));
  expect(pick.mode === 'train', 'D27. Воронеж auto train', pick.mode + ' ' + pick.reason);
}

{
  // удаление адреса не должно ломать матч города
  const a = calculateLogistics({ cityQuery: 'Самара', address: 'пр. Ленина 10', people: 1, nights: 1, transportMode: 'auto' });
  const b = calculateLogistics({ cityQuery: 'Самара', address: '', people: 1, nights: 1, transportMode: 'auto' });
  expect(a.matched && b.matched && a.costs.tickets === b.costs.tickets, 'D28. Очистка адреса сохраняет билеты города');
}

{
  const unknown = calculateLogistics({ cityQuery: 'Город-N', people: 2 });
  expect(unknown.matched === false && unknown.costs.total === 0, 'D29. Неизвестный город без авто-суммы');
}

console.log('\n=== E. СКЛЕЙКА УСЛОВИЙ (пока раздельно + логистика) ===\n');

{
  const log = calculateLogistics({ cityQuery: 'Казань', transportMode: 'auto', people: 2, nights: 2 });
  const ndt = calculateNdt({
    objectKey: 'pipe', methods: ['vik'], joints: 10, diameter: 108, thickness: 6,
    logisticsTotal: log.costs.total
  });
  expect(ndt.total === 2500 + log.costs.total, 'E1. НК + логистика Казань', String(ndt.total));
}

{
  const log = calculateLogistics({ cityQuery: 'Тверь', transportMode: 'auto', people: 3, workDays: 2 });
  const weld = calculateWelding({
    objectKey: 'metal', meters: 10, thickness: 12, joints: 0,
    logisticsTotal: log.costs.total
  });
  const expected = Math.round(9500 * 1.15) + log.costs.total;
  expect(weld.total === expected, 'E2. Сварка + логистика Тверь', String(weld.total));
}

{
  // численность людей из ролей НК
  const ndt = calculateNdt({ objectKey: 'pipe', methods: ['uzk', 'rk'], joints: 2, points: 2, diameter: 108, thickness: 6 });
  const log = calculateLogistics({
    cityQuery: 'Екатеринбург', transportMode: 'auto', people: ndt.crew, nights: 2
  });
  expect(ndt.crew === 2, 'E3. УЗК+РК crew=2');
  expect(log.people === 2 && log.transport.mode === 'flight', 'E4. Логистика по crew НК', `${log.people}/${log.transport.mode}`);
}

const summary = {
  passed: results.filter((r) => r.ok).length,
  failed: results.filter((r) => !r.ok).length,
  results
};
fs.writeFileSync(path.join(art, 'unit-report.json'), JSON.stringify(summary, null, 2));
console.log('\n==== UNIT SUMMARY ====');
console.log(`Passed: ${summary.passed}, Failed: ${summary.failed}`);
process.exit(failed ? 1 : 0);
