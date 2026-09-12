/**
 * Скрипт для человека — менеджера по продажам.
 *
 * Назначение: чек-лист разговора с клиентом + подсказки по полям.
 * Можно распечатать или держать рядом с калькулятором.
 *
 * Запуск:
 *   node scripts/sales-human.mjs
 *   node scripts/sales-human.mjs --checklist
 *   node scripts/sales-human.mjs --json
 */
import { FIELD_CATALOG, INTAKE_ORDER, listFields } from '../src/field-catalog.mjs';

const args = new Set(process.argv.slice(2));

const INTRO = [
  'Вы — менеджер по продажам НК / сварки.',
  'Задача: за 5–10 минут собрать данные для предварительного расчёта и КП.',
  'Не обещайте финальную цену до проверки объёма и НТД.',
  'Город вносите аккуратно: очистка города в калькуляторе сбрасывает логистику.'
];

const TALK_TRACK = [
  {
    stage: 'Контакт',
    say: 'Добрый день! Подготовим предварительный расчёт. Подскажите организацию и контакт на объекте.',
    fields: ['client', 'contact']
  },
  {
    stage: 'Локация',
    say: 'Где объект — город и адрес/площадка? От города зависит логистика (билеты, отель).',
    fields: ['city', 'address']
  },
  {
    stage: 'Состав работ',
    say: 'Нужен только контроль, только сварка или комплекс? Что за объект?',
    fields: ['workType', 'object']
  },
  {
    stage: 'Объём',
    say: 'Какой объём: стыки, погонные метры, точки/снимки?',
    fields: ['joints', 'meters', 'points']
  },
  {
    stage: 'Геометрия',
    say: 'Диаметр и толщина металла/стенки? Для металлоконструкций диаметр не нужен.',
    fields: ['diameter', 'thickness']
  },
  {
    stage: 'Методы НК',
    say: 'Какие методы контроля: ВИК, УЗК, РК, ПВК, МК, толщинометрия?',
    fields: ['methods']
  },
  {
    stage: 'Условия',
    say: 'Сроки и доступ к месту работ — стандарт или сложнее?',
    fields: ['urgency', 'access']
  },
  {
    stage: 'Логистика',
    say: 'Транспорт можем поставить автоматически по городу. Сколько человек и дней на объекте?',
    fields: ['transport', 'people', 'workDays', 'nights']
  },
  {
    stage: 'Финал',
    say: 'Есть НТД, марка стали, пропускной режим? Зафиксирую в комментарии и отправлю предварительный расчёт.',
    fields: ['comment']
  }
];

function printGuide() {
  console.log('=== СКРИПТ МЕНЕДЖЕРА ПО ПРОДАЖАМ (ЧЕЛОВЕК) ===\n');
  INTRO.forEach((l) => console.log(`• ${l}`));
  console.log('');

  for (const stage of TALK_TRACK) {
    console.log(`—— ${stage.stage} ——`);
    console.log(`Сказать: «${stage.say}»`);
    for (const id of stage.fields) {
      const f = FIELD_CATALOG[id];
      console.log(`  №${f.num} ${f.label}`);
      console.log(`     Описание: ${f.description}`);
      console.log(`     Подсказка: ${f.humanTip}`);
      console.log(`     Вопрос: ${f.botAsk}`);
      if (f.options) console.log(`     Варианты: ${f.options.map((o) => o.label).join(' / ')}`);
    }
    console.log('');
  }

  console.log('—— Красные флаги ——');
  console.log('  • Клиент путает РК и УЗК — уточните «рентген/снимки» vs «ультразвук швов»');
  console.log('  • Металлоконструкция + диаметр — диаметр не считается, не настаивайте');
  console.log('  • Только сварка — не тратьте время на методы НК');
  console.log('  • Нет объёма (0 стыков и 0 п.м.) — расчёт работ будет 0');
  console.log('  • Город не из базы — логистику оценить вручную');
  console.log('\n—— После звонка ——');
  console.log('  1. Внести поля в лабы / калькулятор');
  console.log('  2. Проверить авто-транспорт и ночи');
  console.log('  3. Отправить предварительное КП с пометкой «уточняется по ТЗ»');
}

function printChecklist() {
  console.log('=== ЧЕК-ЛИСТ МЕНЕДЖЕРА (галочки) ===\n');
  for (const id of INTAKE_ORDER) {
    const f = FIELD_CATALOG[id];
    const req = f.required ? 'обязательно' : 'по ситуации';
    console.log(`[ ] №${f.num} ${f.label} (${req})`);
    console.log(`    ${f.humanTip}`);
  }
  console.log('\n[ ] Заявка внесена в калькулятор');
  console.log('[ ] Логистика по городу проверена');
  console.log('[ ] Клиенту отправлено предварительное КП');
}

function printJson() {
  const payload = {
    role: 'human_sales_manager',
    title: 'Скрипт менеджера по продажам (человек)',
    intro: INTRO,
    talkTrack: TALK_TRACK.map((s) => ({
      stage: s.stage,
      say: s.say,
      fields: s.fields.map((id) => {
        const f = FIELD_CATALOG[id];
        return {
          id: f.id,
          num: f.num,
          label: f.label,
          description: f.description,
          humanTip: f.humanTip,
          ask: f.botAsk,
          options: f.options || null
        };
      })
    })),
    fields: listFields()
  };
  console.log(JSON.stringify(payload, null, 2));
}

if (args.has('--json')) printJson();
else if (args.has('--checklist')) printChecklist();
else printGuide();
