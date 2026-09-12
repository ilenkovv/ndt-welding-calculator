/**
 * Скрипт робота-секретаря (менеджер по продажам, автодиалог).
 *
 * Назначение: пошаговый сбор заявки в чат/телефонию/CRM-бот.
 * Не считает цену сам — собирает поля и отдаёт JSON для калькулятора.
 *
 * Запуск:
 *   node scripts/secretary-bot.mjs
 *   node scripts/secretary-bot.mjs --demo
 *   node scripts/secretary-bot.mjs --json   # только JSON-сценарий для интеграции
 */
import { FIELD_CATALOG, INTAKE_ORDER, listFields } from '../src/field-catalog.mjs';

const args = new Set(process.argv.slice(2));

const OPENING = [
  'Здравствуйте! Я секретарь отдела продаж по НК и сварке.',
  'Задам несколько вопросов — подготовлю заявку для расчёта стоимости.',
  'Можно отвечать кратко. Если чего-то не знаете — скажите «не знаю» или «пропустить».'
];

const CLOSING = [
  'Спасибо! Заявку собрал.',
  'Передаю менеджеру на расчёт КП. Если появятся чертежи или НТД — пришлите ответом на это сообщение.'
];

/** Правила ветвления для бота */
function shouldAsk(fieldId, draft) {
  const wt = draft.workType || 'complex';
  if (fieldId === 'methods' || fieldId === 'points') {
    if (wt === 'welding') return false;
  }
  if (fieldId === 'points') {
    const methods = draft.methods || [];
    const needs = methods.includes('rk') || methods.includes('thick');
    // спрашиваем точки всегда мягко при НК, но помечаем как важные при РК/толщине
    if (wt === 'welding') return false;
    draft._pointsImportant = needs;
  }
  if (fieldId === 'diameter') {
    if (draft.object === 'metal') return false;
  }
  return true;
}

function buildSteps(draft = {}) {
  const steps = [];
  for (const id of INTAKE_ORDER) {
    if (!shouldAsk(id, draft)) continue;
    const f = FIELD_CATALOG[id];
    if (!f) continue;
    steps.push({
      id: f.id,
      num: f.num,
      label: f.label,
      ask: f.botAsk,
      followUp: f.botFollowUp,
      description: f.description,
      required: f.required,
      options: f.options || null,
      price: f.price
    });
  }
  return steps;
}

/** Демо-сценарий «как говорит бот» */
function printDemoDialogue() {
  const draft = { workType: 'complex', object: 'pipe', methods: ['vik', 'uzk'] };
  console.log('=== РОБОТ-СЕКРЕТАРЬ: ДЕМО ДИАЛОГА ===\n');
  for (const line of OPENING) console.log(`Бот: ${line}`);
  console.log('');

  const answers = {
    client: 'ООО «СеверТруб»',
    contact: 'Петров А.С., +7 900 000-00-00, инженер',
    city: 'Казань',
    address: 'промзона Юг, цех 2',
    workType: 'complex',
    object: 'pipe',
    joints: '12',
    meters: '0',
    points: '0',
    diameter: '219',
    thickness: '10',
    methods: 'ВИК, УЗК',
    urgency: 'стандарт',
    access: 'стеснённый',
    transport: 'auto',
    people: '2',
    workDays: '2',
    nights: 'авто',
    comment: 'ГОСТ, допуск по пропускам'
  };

  const steps = buildSteps({ ...draft, workType: 'complex', object: 'pipe', methods: ['vik', 'uzk'] });
  for (const step of steps) {
    console.log(`Бот: ${step.ask}`);
    if (step.options) {
      console.log(`     Варианты: ${step.options.map((o) => o.label).join(' / ')}`);
    }
    console.log(`     (поле №${step.num} «${step.label}»: ${step.description})`);
    console.log(`Клиент: ${answers[step.id] ?? 'не знаю'}`);
    if (step.followUp) console.log(`Бот: ${step.followUp}`);
    console.log('');
  }

  for (const line of CLOSING) console.log(`Бот: ${line}`);
  console.log('\n=== КАРТОЧКА ЗАЯВКИ (для калькулятора) ===');
  console.log(JSON.stringify(answers, null, 2));
}

function printJsonPlaybook() {
  const playbook = {
    role: 'secretary_bot_sales',
    title: 'Робот-секретарь отдела продаж (НК / сварка)',
    goal: 'Собрать поля заявки для предварительного расчёта, без обещания финальной цены',
    opening: OPENING,
    closing: CLOSING,
    rules: [
      'Задавать по одному вопросу за ход',
      'Если ответ «не знаю» — записать null и идти дальше',
      'Не называть финальную цену — только «передам на расчёт»',
      'При workType=welding не спрашивать методы НК и точки',
      'При object=metal не спрашивать диаметр',
      'При методах РК/толщинометрия обязательно уточнить точки/снимки',
      'Город очищать нельзя без подтверждения — это сбрасывает логистику'
    ],
    fields: listFields().map((f) => ({
      id: f.id,
      num: f.num,
      label: f.label,
      ask: f.botAsk,
      followUp: f.botFollowUp,
      description: f.description,
      required: f.required,
      price: f.price,
      owner: f.owner,
      options: f.options || null
    })),
    branch: {
      skipMethodsIf: 'workType == welding',
      skipPointsIf: 'workType == welding',
      skipDiameterIf: 'object == metal',
      emphasizePointsIf: 'methods includes rk OR thick'
    },
    outputSchema: {
      client: 'string',
      contact: 'string',
      city: 'string',
      address: 'string|null',
      workType: 'ndt|welding|complex',
      object: 'pipe|tank|metal|vessel|other',
      joints: 'number',
      meters: 'number',
      points: 'number',
      diameter: 'number|null',
      thickness: 'number',
      methods: 'string[]',
      urgency: '1|1.3|1.5',
      access: '1|1.15|1.25|1.4',
      transport: 'auto|car|train|flight|bus',
      people: 'number',
      workDays: 'number',
      nights: 'number|null',
      comment: 'string|null'
    }
  };
  console.log(JSON.stringify(playbook, null, 2));
}

function printTextPlaybook() {
  console.log('=== СКРИПТ РОБОТА-СЕКРЕТАРЯ (МЕНЕДЖЕР ПО ПРОДАЖАМ) ===\n');
  console.log('Роль: автосекретарь / бот продаж НК и сварки');
  console.log('Цель: собрать поля заявки → передать на расчёт КП\n');
  console.log('— Открытие —');
  OPENING.forEach((l, i) => console.log(`${i + 1}. ${l}`));
  console.log('\n— Вопросы по полям —\n');
  for (const id of INTAKE_ORDER) {
    const f = FIELD_CATALOG[id];
    console.log(`№${f.num} ${f.label}`);
    console.log(`  Спросить: ${f.botAsk}`);
    console.log(`  Зачем: ${f.description}`);
    if (f.botFollowUp) console.log(`  Уточнение: ${f.botFollowUp}`);
    if (f.options) console.log(`  Варианты: ${f.options.map((o) => o.label).join('; ')}`);
    console.log(`  Обязательно: ${f.required ? 'да' : 'нет'} · В цене: ${f.price ? 'да' : 'нет'}`);
    console.log('');
  }
  console.log('— Ветвления —');
  console.log('  • welding → не спрашивать методы НК и точки');
  console.log('  • metal → не спрашивать диаметр');
  console.log('  • РК / толщинометрия → обязательно точки/снимки');
  console.log('\n— Закрытие —');
  CLOSING.forEach((l, i) => console.log(`${i + 1}. ${l}`));
}

if (args.has('--json')) printJsonPlaybook();
else if (args.has('--demo')) printDemoDialogue();
else printTextPlaybook();
