import { cognitionNow, isWeekend, seasonOf } from '../calendar.js';
import { payMetro } from '../expenses.js';
import { holidayMarkup, holidayOf } from '../holidays.js';
import { wantsOvertime } from '../schedule.js';
import { SKILL_META } from '../constants.js';
import { morningPlan } from '../decision.js';
import { registerAction } from './define.js';
import { writeDiary } from '../diary.js';
import { feelTo, lessonStrength, markFollowed, mistake } from '../emotions.js';
import { buy, canPay, driftPrices, markMood, marketValue, pickAsset, positionValue, researchNeed, sell, tradeGate } from '../market.js';
import { mealCost } from './meals.js';
import { log, memory } from '../memory.js';
import { RANK, hireChance, hourlyWage, nextPurchase, owns, pickGig, promoteOrRaise, rankInfo, tx } from '../money.js';
import { gainSkill, impulseChance, practicePlace, skillRank } from '../skills.js';
import { s } from '../state.js';
import { absMin, circadian, cl, hour, peak, rand, weatherOf } from '../util.js';

// 新行动只在这里登记一次。
// 必填：id、label、place（落点格子名）、mins（时长，分钟）、pose（停下时的姿势）。
// 选填：score(ctx) 打分，返回 false 表示这会儿做不了；spec(spec) 写入消耗和花费；
// destination() 覆盖落点；duration() 覆盖时长；onStart() 一开始的副作用；
// resolve(mins, id) 做完之后的副作用；thoughts(push, id) / thoughtsLate(push, id) 念头；
// mind() / mindEarly() 思维画像；journal(spec) 生活痕迹；labelOf() 状态栏标题。
// 登记顺序就是每回合打分的顺序。每日念头的候选在文件底部的 WHIM_JOB / WHIM_FREE。

export const WHIM_JOB = ['market', 'workout', 'walk', 'cook', 'relax', 'work', 'practice', 'shop'];
export const WHIM_FREE = ['market', 'workout', 'walk', 'cook', 'relax', 'search', 'practice', 'gig'];

registerAction({
  id: 'wake',
  label: '醒来，坐在床边',
  place: 'bed',
  room: 'bedroom',
  mins: 10,
  pose: 'sit',
  onStart() {
    if (hour() < 8.6) markFollowed('oversleep');
  },
  score(ctx) {
    const add = ctx.add;
    const h = ctx.h;
    const tax = ctx.tax;
    const poorEnergy = ctx.poorEnergy;
    const id = 'wake';
    if (s.action !== 'sleep' || h < 5.5 || h > 10.5) return false;
    add('早上了，可以起床', peak(h, 6, 9.2) * 26);
    add('精力恢复了一些', Math.max(0, s.e - 48) * 0.28);
    add('身体还想继续睡', -circadian(h) * 24);

  },
  thoughts(push, id) {
    const y = s.yesterday;
    const w = weatherOf(s.day);
    push(true, '眼睛睁开的时候，屋子还是静的。');
    push(true, '先坐一会儿，不急着把自己交给今天。');
    push(s.e < 40, '觉没睡透，但再躺下去也只是发呆。');

  },
  journal(spec) {
    const cost = spec.cost ? ('，花了 ¥' + spec.cost) : '';
    return '林默醒了，在床边坐了一会儿。';
  }
});

registerAction({
  id: 'breakfast',
  label: '给自己做早餐',
  place: 'fridge',
  room: 'kitchen',
  mins: 20,
  pose: 'cook',
  onStart() { s.meals.breakfast = true; },
  score(ctx) {
    const add = ctx.add;
    const h = ctx.h;
    const tax = ctx.tax;
    const poorEnergy = ctx.poorEnergy;
    const id = 'breakfast';
    if (s.meals.breakfast || !canPay(8)) return false;
    add('肚子空了', s.h * 0.82);
    add('快到早饭时间', peak(h, 6.5, 10.5) * 40);
    if (h >= 7 && h <= 9.5) add('早上习惯吃一点', 14);
    if (h < 5.5 || h > 11.5) add('不是吃早饭的时候', -32);
    if (s.sinceEatMin < 50) add('刚吃过', -22);
    if (s.h > 80) add('饿得发慌', 22);
    if (poorEnergy) add('累得做不动饭', -16);
    add('夜里不适合折腾', -tax);

  },
  spec(spec) {
    const poor = s.money < 170 && marketValue() < 50;
    const id = 'breakfast';
    spec.hunger = poor ? -1.05 : -1.4; spec.mood = 0.12; spec.energy = 0.03;
    mealCost(18, 10, spec);

  },
  resolve(mins, id) {
    if (id === 'breakfast' || id === 'lunch' || id === 'dinner' || id === 'eat') {

        s.today.meals += 1;
        s.sinceEatMin = 0;
        if (id === 'dinner') s.prepped = false;
        s.m = cl(s.m + (s.hungerAtStart > 55 ? 4 : 2));
        feelTo('joy', (s.session && s.session.comfort) ? 2 : 5);
        if (skillRank('cooking') >= 2) feelTo('pride', 3);
        if (id === 'breakfast' || id === 'dinner') gainSkill('cooking', id === 'breakfast' ? 3 : 4);
        if (s.hungerAtStart > 64) memory('meal', '这顿是真的饿了才吃的。');

    }
  },
  thoughts(push, id) {
    const y = s.yesterday;
    const w = weatherOf(s.day);
    push(true, '先吃东西，别的都往后放。');
    push(s.h > 60, '胃已经在抗议了。');
    push(s.money < 220, '这顿简单一点，钱要留着。');
    push(id === 'cook' || (id === 'dinner' && s.prepped), '热的比外卖更像把自己照顾好。');
    push(id === 'breakfast', '冰箱里还有鸡蛋，够今天早上的。');
    push(y && y.skippedMeal, '昨天没吃好，今天不想再硬撑。');

  },
  journal(spec) {
    const cost = spec.cost ? ('，花了 ¥' + spec.cost) : '';
    return '给自己做早餐' + cost + '。';
  }
});

registerAction({
  id: 'eat',
  label: '吃点东西垫一下',
  place: 'table',
  room: 'kitchen',
  mins: 16,
  pose: 'eat',
  score(ctx) {
    const add = ctx.add;
    const h = ctx.h;
    const tax = ctx.tax;
    const poorEnergy = ctx.poorEnergy;
    const id = 'eat';
    if (s.h < 36 || s.sinceEatMin < 75 || !canPay(6)) return false;
    add('饿了就先吃', s.h * 0.95);
    if (s.h > 70) add('已经很饿了', 18);
    add('正餐时间更想正经吃', -(peak(h, 6.5, 10) * 12 + peak(h, 11.3, 14) * 12 + peak(h, 18, 21) * 12));
    if (s.restLock) add('先补充一点', 8);

  },
  spec(spec) {
    const poor = s.money < 170 && marketValue() < 50;
    const id = 'eat';
    spec.hunger = poor ? -0.95 : -1.25; spec.mood = 0.08;
    mealCost(16, 8, spec);

  },
  resolve(mins, id) {
    if (id === 'breakfast' || id === 'lunch' || id === 'dinner' || id === 'eat') {

        s.today.meals += 1;
        s.sinceEatMin = 0;
        if (id === 'dinner') s.prepped = false;
        s.m = cl(s.m + (s.hungerAtStart > 55 ? 4 : 2));
        feelTo('joy', (s.session && s.session.comfort) ? 2 : 5);
        if (skillRank('cooking') >= 2) feelTo('pride', 3);
        if (id === 'breakfast' || id === 'dinner') gainSkill('cooking', id === 'breakfast' ? 3 : 4);
        if (s.hungerAtStart > 64) memory('meal', '这顿是真的饿了才吃的。');

    }
  },
  thoughts(push, id) {
    const y = s.yesterday;
    const w = weatherOf(s.day);
    push(true, '先吃东西，别的都往后放。');
    push(s.h > 60, '胃已经在抗议了。');
    push(s.money < 220, '这顿简单一点，钱要留着。');
    push(id === 'cook' || (id === 'dinner' && s.prepped), '热的比外卖更像把自己照顾好。');
    push(id === 'breakfast', '冰箱里还有鸡蛋，够今天早上的。');
    push(y && y.skippedMeal, '昨天没吃好，今天不想再硬撑。');

  },
  journal(spec) {
    const cost = spec.cost ? ('，花了 ¥' + spec.cost) : '';
    return '先吃点东西垫一下' + cost + '。';
  }
});

registerAction({
  id: 'lunch',
  label: '吃午饭',
  place: 'table',
  room: 'kitchen',
  mins: 22,
  pose: 'eat',
  onStart() { s.meals.lunch = true; },
  score(ctx) {
    const add = ctx.add;
    const h = ctx.h;
    const tax = ctx.tax;
    const poorEnergy = ctx.poorEnergy;
    const id = 'lunch';
    if (s.meals.lunch || !canPay(10)) return false;
    add('有点饿', s.h * 0.85);
    add('接近午饭时间', peak(h, 11.2, 14.3) * 18);
    if (h < 10.5 || h > 15.5) add('不是午饭时间', -28);
    if (s.sinceEatMin < 50) add('刚吃过', -18);
    if (s.h > 80) add('饿得发慌', 20);
    add('夜里不适合', -tax);

  },
  spec(spec) {
    const poor = s.money < 170 && marketValue() < 50;
    const id = 'lunch';
    spec.hunger = poor ? -1.05 : -1.35; spec.mood = 0.1; spec.energy = 0.02;
    mealCost(35, 16, spec);

  },
  resolve(mins, id) {
    if (id === 'breakfast' || id === 'lunch' || id === 'dinner' || id === 'eat') {

        s.today.meals += 1;
        s.sinceEatMin = 0;
        if (id === 'dinner') s.prepped = false;
        s.m = cl(s.m + (s.hungerAtStart > 55 ? 4 : 2));
        feelTo('joy', (s.session && s.session.comfort) ? 2 : 5);
        if (skillRank('cooking') >= 2) feelTo('pride', 3);
        if (id === 'breakfast' || id === 'dinner') gainSkill('cooking', id === 'breakfast' ? 3 : 4);
        if (s.hungerAtStart > 64) memory('meal', '这顿是真的饿了才吃的。');

    }
  },
  thoughts(push, id) {
    const y = s.yesterday;
    const w = weatherOf(s.day);
    push(true, '先吃东西，别的都往后放。');
    push(s.h > 60, '胃已经在抗议了。');
    push(s.money < 220, '这顿简单一点，钱要留着。');
    push(id === 'cook' || (id === 'dinner' && s.prepped), '热的比外卖更像把自己照顾好。');
    push(id === 'breakfast', '冰箱里还有鸡蛋，够今天早上的。');
    push(y && y.skippedMeal, '昨天没吃好，今天不想再硬撑。');

  },
  journal(spec) {
    const cost = spec.cost ? ('，花了 ¥' + spec.cost) : '';
    return '开始吃午饭' + cost + '。';
  }
});

registerAction({
  id: 'cook',
  label: '准备晚饭',
  place: 'stove',
  room: 'kitchen',
  mins: 26,
  pose: 'cook',
  score(ctx) {
    const add = ctx.add;
    const h = ctx.h;
    const tax = ctx.tax;
    const poorEnergy = ctx.poorEnergy;
    const id = 'cook';
    if (s.meals.dinner || s.prepped || !canPay(10)) return false;
    add('想吃热乎的', 16 + Math.max(0, 58 - s.m) * 0.12);
    add('晚饭前的时间', peak(h, 16.5, 20.5) * 34);
    add('肚子有一点空', s.h * 0.26);
    if (h < 15 || h > 21.5) add('现在做饭不合适', -26);
    if (s.h > 78) add('太饿了，来不及慢慢做', -12);
    add('夜里不适合', -tax);

  },
  spec(spec) {
    const poor = s.money < 170 && marketValue() < 50;
    const id = 'cook';
    spec.hunger = -0.1; spec.mood = 0.1;
    mealCost(26, 14, spec);

  },
  resolve(mins, id) {
    if (id === 'cook') {

        s.prepped = true;
        s.preppedAt = absMin();
        gainSkill('cooking', 6);
        feelTo('pride', 3);
        if (lessonStrength('spend') >= 12) markFollowed('spend');
        memory('cook', '晚饭做好了，等一会儿吃。');

    }
  },
  thoughts(push, id) {
    const y = s.yesterday;
    const w = weatherOf(s.day);
    push(true, '先吃东西，别的都往后放。');
    push(s.h > 60, '胃已经在抗议了。');
    push(s.money < 220, '这顿简单一点，钱要留着。');
    push(id === 'cook' || (id === 'dinner' && s.prepped), '热的比外卖更像把自己照顾好。');
    push(id === 'breakfast', '冰箱里还有鸡蛋，够今天早上的。');
    push(y && y.skippedMeal, '昨天没吃好，今天不想再硬撑。');

  },
  journal(spec) {
    const cost = spec.cost ? ('，花了 ¥' + spec.cost) : '';
    return '准备晚饭' + cost + '。';
  }
});

registerAction({
  id: 'dinner',
  label: '一个人吃晚饭',
  place: 'table',
  room: 'kitchen',
  mins: 24,
  pose: 'eat',
  onStart() { s.meals.dinner = true; },
  score(ctx) {
    const add = ctx.add;
    const h = ctx.h;
    const tax = ctx.tax;
    const poorEnergy = ctx.poorEnergy;
    const id = 'dinner';
    const cost = s.prepped ? 0 : 16;
    if (s.meals.dinner || (cost > 0 && !canPay(cost))) return false;
    add('该吃晚饭了', peak(h, 17.5, 21.6) * 34);
    add('饿了', s.h * 0.74);
    if (s.prepped) add('饭已经做好了', 26);
    else add('还没做，只能买着吃', -10);
    if (h < 16.5 || h > 22.6) add('不是晚饭时间', -24);
    if (s.sinceEatMin < 45) add('刚吃过', -16);
    if (s.h > 80) add('饿得发慌', 18);

  },
  spec(spec) {
    const poor = s.money < 170 && marketValue() < 50;
    const id = 'dinner';
    spec.hunger = -1.32; spec.energy = 0.03;
    if (s.prepped) {
      spec.cost = 0; spec.mood = 0.16 + skillRank('cooking') * 0.015;
    } else {
      spec.mood = 0.05;
      mealCost(42, 20, spec);
      if ((s.feel && s.feel.loneliness > 62) && lessonStrength('spend') < 18 && skillRank('cooking') < 2) {
        spec.cost += 12;
        spec.comfort = true;
      }
    }

  },
  resolve(mins, id) {
    if (id === 'breakfast' || id === 'lunch' || id === 'dinner' || id === 'eat') {

        s.today.meals += 1;
        s.sinceEatMin = 0;
        if (id === 'dinner') s.prepped = false;
        s.m = cl(s.m + (s.hungerAtStart > 55 ? 4 : 2));
        feelTo('joy', (s.session && s.session.comfort) ? 2 : 5);
        if (skillRank('cooking') >= 2) feelTo('pride', 3);
        if (id === 'breakfast' || id === 'dinner') gainSkill('cooking', id === 'breakfast' ? 3 : 4);
        if (s.hungerAtStart > 64) memory('meal', '这顿是真的饿了才吃的。');

    }
  },
  thoughts(push, id) {
    const y = s.yesterday;
    const w = weatherOf(s.day);
    push(true, '先吃东西，别的都往后放。');
    push(s.h > 60, '胃已经在抗议了。');
    push(s.money < 220, '这顿简单一点，钱要留着。');
    push(id === 'cook' || (id === 'dinner' && s.prepped), '热的比外卖更像把自己照顾好。');
    push(id === 'breakfast', '冰箱里还有鸡蛋，够今天早上的。');
    push(y && y.skippedMeal, '昨天没吃好，今天不想再硬撑。');

  },
  journal(spec) {
    const cost = spec.cost ? ('，花了 ¥' + spec.cost) : '';
    return (s.prepped ? '把做好的晚饭吃掉' : '晚饭简单解决') + cost + '。';
  }
});

registerAction({
  id: 'search',
  label: '浏览招聘信息',
  place: 'desk',
  room: 'study',
  mins: 48,
  pose: 'type',
  score(ctx) {
    const add = ctx.add;
    const h = ctx.h;
    const tax = ctx.tax;
    const poorEnergy = ctx.poorEnergy;
    const id = 'search';
    if (s.restLock || poorEnergy) return false;
    if (s.job) {
      if (s.day < s.workFromDay || (s.performance || 0) < 48 || (s.hopCooldown || 0) > 0) return false;
      if (holidayOf()) add('节日那边多半不看邮件', -8);
      add('这份工作还能往上走', 12);
      add('履历够用，可以看看别的团队', Math.max(0, (s.performance || 0) - 40) * 0.22);
      if (s.money < 500) add('现在跳槽太险', -22);
      if (s.e < 24) add('太累，投不动', -18);
      if ((s.today.search || 0) >= 1) add('今天问过了', -14);
      add('这个点不适合投简历', -tax);
    } else {
    if (holidayOf()) add('节日那边多半不看邮件', -8);
    add('还没有工作', 18);
    add('适合看招聘的时间', Math.max(peak(h, 9, 12) * 24, peak(h, 14, 17.6) * 20));
    if (s.money < 250) add('存款快见底了', 44);
    else if (s.money < 700) add('存款在变少', 26);
    else if (s.money < 1600) add('得多一份收入', 14);
    else add('工作可以慢慢找', 6);
    add('写得清简历', (cognitionNow() - 70) * 0.18);
    if (s.e < 24) add('太累，投不动', -26);
    if (s.h > 72) add('饿得没法集中', -20);
    if (s.today.search >= 2) add('今天已经投过几封', -14);
    if (s.today.search >= 4) add('再投也只是重复', -18);
    add('这个点不适合投简历', -tax);
    }

  },
  spec(spec) {
    const poor = s.money < 170 && marketValue() < 50;
    const id = 'search';
    spec.energy = -0.03; spec.mood = -0.012;

  },
  resolve(mins, id) {
    if (id === 'search' && mins > 16) {

        s.searches += 1;
        s.today.search += 1;
        const p = hireChance();
        if (rand() < p) {
          const hopping = !!s.job && s.day >= s.workFromDay;
          s.job = true;
          if (hopping) {
            promoteOrRaise(true);
            s.hopCooldown = 90;
          } else {
            s.career = s.career && RANK[s.career] ? s.career : 'junior';
            s.workFromDay = s.day + 1;
            s.daysInRank = 0;
            s.performance = Math.max(36, s.performance || 0);
          }
          s.m = cl(s.m + 15);
          feelTo('hope', 18); feelTo('joy', 12); feelTo('pride', 8);
          const text = hopping
            ? ('新东家要他，职位是' + rankInfo().title + '，时薪大约 ¥' + hourlyWage() + '。')
            : ('收到录用邮件，职位是' + rankInfo().title + '，时薪大约 ¥' + hourlyWage() + '。他打算明天再开始。');
          log(text);
          memory('job_offer', text);
          s.plan = morningPlan();
        } else {
          const hit = 3 + Math.round(rand() * 4);
          const calm = cognitionNow() > 85 ? 0.72 : 1;
          s.m = cl(s.m - hit * calm);
          feelTo('anxiety', 10); feelTo('hope', -8);
          s.today.rejects += 1;
          const text = '这封简历没有回音。他把要求记下来，准备改一版。';
          log(text);
          memory('job_reject', text, {value:-hit});
        }

    }
  },
  thoughts(push, id) {
    const y = s.yesterday;
    const w = weatherOf(s.day);
    push(true, '先看要求，再决定这封要不要认真写。');
    push(true, '这个岗位，看起来可以试一版。');
    push(s.searches > 0, '上一封没回音，这封把项目经历写清楚些。');
    push(s.money < 500, '存款不多了，找工作不再是可选项。');
    push(y && y.rejections >= 1, '拒信还在，简历可以再改，但不跟它生气。');

  },
  mind() { return '“先把收入的不确定性降下来。”'; },
  journal(spec) {
    const cost = spec.cost ? ('，花了 ¥' + spec.cost) : '';
    return '坐到桌前看招聘。';
  }
});

registerAction({
  id: 'work',
  label: '在线处理客户的工作',
  place: 'desk',
  room: 'study',
  mins: 100,
  pose: 'type',
  duration() { return s.today.workMin > 120 ? 70 : 100; },
  labelOf() { return (s.today && s.today.overtime) ? '周末加班' : '远程工作'; },
  score(ctx) {
    const add = ctx.add;
    const h = ctx.h;
    const tax = ctx.tax;
    const poorEnergy = ctx.poorEnergy;
    const id = 'work';
    if (!s.job || s.day < s.workFromDay || s.restLock || poorEnergy) return false;
    if (isWeekend() || holidayOf()) {
      if (wantsOvertime()) add('今天他自己决定加班', 12);
      else add('休息日，先把工作放下', -48);
    }
    add('今天还有项目要做', 22);
    add('适合工作的时间', Math.max(peak(h, 9, 12.2) * 30, peak(h, 13.5, 18.2) * 28));
    if (s.today.workMin > 150) add('今天已经做了不少', -18);
    if (s.today.workMin > 280) add('再做下去会透支', -30);
    if (s.e < 22) add('精力不够工作', -28);
    if (s.h > 74) add('太饿，先吃饭', -22);
    if ((s.sickDays || 0) >= 2) add('病着，今天先歇', -38);
    else if ((s.sickDays || 0) > 0) add('有点不舒服', -18);
    add('这个点不适合开工', -tax);

  },
  spec(spec) {
    const poor = s.money < 170 && marketValue() < 50;
    const id = 'work';
    const ot = !!(s.today && s.today.overtime);
    let wage = hourlyWage() || (56 + s.e * 0.22 + s.m * 0.1);
    if (ot) wage = Math.round(wage * 1.5);
    spec.energy = ot ? -0.07 : -0.045;
    spec.mood = ot ? -0.015 : (owns('computer') ? 0.04 : 0.02);
    spec.wage = wage;

  },
  resolve(mins, id) {
    if (id === 'work' && mins > 8) {

        const wage = (s.session && s.session.wage) || 60;
        const pay = Math.max(0, Math.round(wage * (mins / 60)));
        if (pay > 0) {
          s.money += pay;
          s.today.earned += pay;
          s.today.workMin += mins;
          s.m = cl(s.m + 3);
          tx('income', (s.today && s.today.overtime) ? '周末加班' : (rankInfo().title || '远程工作'), pay);
          if (s.today && s.today.overtime) {
            s.e = cl(s.e - 3);
            s.m = cl(s.m - 2);
            feelTo('pride', 2);
            feelTo('anxiety', 2);
          }
          const text = ((s.today && s.today.overtime) ? '周末加班' : (rankInfo().title || '远程工作')) + '告一段落，进账 ¥' + pay + '，时薪大约 ¥' + Math.round((s.session && s.session.wage) || pay) + '。';
          log(text);
          memory('work', text, {value:pay});
        }

    }
  },
  thoughts(push, id) {
    const y = s.yesterday;
    const w = weatherOf(s.day);
    push(true, '先把这一页做完，再看盘。');
    push(true, '远程没有人站在背后，所以得自己收住。');
    push(s.e < 40, '有点累，这块做完就停。');
    push(s.lastPnl < 0, '工作是确定性的收入，行情不是。');

  },
  mind() { return '“先把收入的不确定性降下来。”'; },
  journal(spec) {
    const cost = spec.cost ? ('，花了 ¥' + spec.cost) : '';
    return (s.today && s.today.overtime) ? '开始加班。' : '开始处理远程工作。';
  }
});

registerAction({
  id: 'market',
  label: '研究加密货币和美股',
  place: 'desk',
  room: 'study',
  mins: 40,
  pose: 'type',
  score(ctx) {
    const add = ctx.add;
    const h = ctx.h;
    const tax = ctx.tax;
    const poorEnergy = ctx.poorEnergy;
    const id = 'market';
    if (s.restLock && s.e < 20) return false;
    add('想把加密和美股看懂', 18 + (cognitionNow() - 70) * 0.22);
    add('适合看资料的时间', Math.max(peak(h, 8, 11.6) * 16, peak(h, 20, 23) * 14));
    if (s.research < researchNeed()) add('还没研究到敢动手的程度', 8);
    if ((s.today.market || 0) >= 2) add('今天已经看过一阵子盘', -16);
    if ((s.today.market || 0) >= 4) add('同一批数字再看下去意义不大', -18);
    if (s.e < 18) add('太累，看不进去', -24);
    if (s.h > 76) add('饿得看不进去', -18);
    if (s.money < 180 && !s.job) add('该先解决收入', -14);
    if (h >= 23.5 || h < 5.5) add('深更半夜不看盘', -30);
    else if (tax) add('有点晚了', -6);

  },
  spec(spec) {
    const poor = s.money < 170 && marketValue() < 50;
    const id = 'market';
    spec.energy = -0.02; spec.mood = 0.035;

  },
  resolve(mins, id) {
    if (id === 'market' && mins > 10) {

        s.studies = (s.studies || 0) + 1;
        s.research = cl(s.research + 14 + cognitionNow() / 20, 0, 100);
        s.today.market += 1;
        driftPrices(1);
        const delta = markMood();
        let impulsive = false;
        if (s.money > 100 && rand() < impulseChance()) {
          const asset = pickAsset();
          const amount = Math.round(Math.min(s.money - 80, 48 + rand() * 36));
          const name = asset === 'btc' ? 'BTC' : '标普';
          if (amount >= 30 && buy(asset, amount, '没看完就买了' + name + '，金额 ¥' + amount + '。')) {
            impulsive = true;
            const drop = 0.14 + rand() * 0.16;
            s.prices[asset] = Math.max(5, (s.prices[asset] || 100) * (1 - drop));
            const hit = markMood();
            let loss = Math.abs(Math.round(hit || 0));
            if (loss < 1) {
              loss = Math.max(1, Math.round(amount * drop));
              s.today.pnl -= loss;
              s.lastPnl = -loss;
            }
            mistake('impulse', '没研究完就买了' + name + '，浮亏大约 ¥' + loss);
            gainSkill('trading', 2);
          }
        }
        if (!impulsive) {
          const gate = tradeGate();
          let line = '';
          if (!gate.canBuy) {
            if ((s.studies || 0) < 2) line = '这是第 ' + s.studies + ' 次认真看，只记笔记，不动仓。';
            else if (s.research < gate.need) line = '研究深度 ' + Math.round(s.research) + '，还不到出手的时候。';
            else if (s.riskOffDays > 0) line = '最近亏过，这回只研究，不买。';
            else line = '现金要留作吃饭，先不建仓。';
            memory('market_research', line);
          } else if (rand() < 0.42) {
            line = '资料看完了，他选择继续观望。';
            memory('market_research', line);
          } else {
            const riskFrac = 0.042 + (100 - cognitionNow()) * 0.0004;
            const amount = Math.round(Math.min(s.money - gate.floor, s.money * riskFrac, 36 + s.research * 0.9));
            const asset = pickAsset();
            if (!(amount >= 30 && buy(asset, amount))) line = '算了算仓位，还是先不动。';
          }
          if (line) log(line);
          gainSkill('trading', 5);
          if (lessonStrength('patient') >= 12) markFollowed('patient');
        }
        const holding = marketValue();
        const bought = s.memory[0] && s.memory[0].kind === 'market_trade';
        if (!impulsive && !bought && holding > 240 && s.research > 62 && s.riskOffDays <= 0 && rand() < 0.18) {
          const a = positionValue('btc') >= positionValue('spy') ? 'btc' : 'spy';
          sell(a, 0.3, false);
        }
        if (!impulsive && Math.abs(delta) >= 12) {
          const t = delta > 0
            ? '持仓浮盈大约 ¥' + Math.round(delta) + '。他没因此加大仓位。'
            : '持仓回撤大约 ¥' + Math.abs(Math.round(delta)) + '。这是事先接受的波动。';
          memory('market_pnl', t, {value:delta});
          s.lastPnl = Math.round(delta);
        }

    }
  },
  thoughts(push, id) {
    const y = s.yesterday;
    const w = weatherOf(s.day);
    push(true, '先理解，再行动。看不懂的仓位，不加。');
    push(true, '知道自己不知道什么，比多看一个指标有用。');
    push(s.research < researchNeed(), '研究大概到 ' + Math.round(s.research) + ' 分，还早。');
    push(s.studies < 2, '资料还没看够第二遍，今天只记笔记。');
    push(s.riskOffDays > 0, '最近亏过，今天只允许看，不允许手痒。');
    push(s.lastPnl > 8, '上次是赚的，但这不构成今天要买的理由。');
    push(s.lastPnl < -8, '上次的亏损还在，先核对是判断错了还是波动。');

  },
  mind() { return '“研究深度 ' + Math.round(s.research) + ' · 先看懂 BTC / 美股，再谈仓位。”'; },
  journal(spec) {
    const cost = spec.cost ? ('，花了 ¥' + spec.cost) : '';
    return '打开行情和财报，先看再决定动不动。';
  }
});

registerAction({
  id: 'workout',
  label: '进行力量训练',
  place: 'gym',
  room: 'living',
  mins: 36,
  pose: 'lift',
  score(ctx) {
    const add = ctx.add;
    const h = ctx.h;
    const tax = ctx.tax;
    const poorEnergy = ctx.poorEnergy;
    const id = 'workout';
    if (s.e < 18 || s.restLock) return false;
    add('想训练，健身是长期兴趣', 18);
    add('早晨或傍晚适合练', Math.max(peak(h, 6.3, 9.3) * 22, peak(h, 17, 20.6) * 20));
    if (s.e < 34) add('力气不太够', -16);
    if (s.h > 70) add('空肚子练不动', -16);
    if (s.today.workout >= 1) add('今天练过了', -30);
    if (s.today.workout >= 2) add('再练就过量了', -18);
    if (s.e > 55) add('精力够用', 6);
    add('这个点不适合练', -tax);

  },
  spec(spec) {
    const poor = s.money < 170 && marketValue() < 50;
    const id = 'workout';
    spec.energy = owns('gym') ? -0.15 : -0.2; spec.mood = 0.16; spec.hunger = 0.06;

  },
  resolve(mins, id) {
    if (id === 'workout' && mins > 8) {

        if (!s.today.workout) s.streak.workout = (s.streak.workout || 0) + 1;
        s.today.workout += 1;
        s.m = cl(s.m + 6);
        s.h = cl(s.h + 4);
        s.e = cl(s.e - 4);
        log('力量训练做完了。');
        feelTo('pride', 8);
        feelTo('loneliness', -4);
        if (lessonStrength('train') >= 12) markFollowed('train');
        if (owns('gym')) feelTo('pride', 4);
        memory('workout', '完成一次力量训练，连续 ' + s.streak.workout + ' 天。');

    }
  },
  thoughts(push, id) {
    const y = s.yesterday;
    const w = weatherOf(s.day);
    push(true, '身体是认知的底盘，今天不想偷懒。');
    push(s.streak.workout >= 2, '连续练了 ' + s.streak.workout + ' 天，别把节奏断了。');
    push(y && !y.workout, '昨天没练，肌肉记得。');
    push(s.e < 48, '力气一般，就减重点，把动作做完。');

  },
  mind() { return '“力量训练 · 把今天的组数留下。”'; },
  journal(spec) {
    const cost = spec.cost ? ('，花了 ¥' + spec.cost) : '';
    return '开始力量训练。';
  }
});

registerAction({
  id: 'walk',
  label: '在院子里走走',
  place: 'yard',
  room: 'yard',
  mins: 20,
  pose: 'idle',
  score(ctx) {
    const add = ctx.add;
    const h = ctx.h;
    const tax = ctx.tax;
    const poorEnergy = ctx.poorEnergy;
    const id = 'walk';
    const w = weatherOf(s.day);
    add('想透气', 10 + Math.max(0, 50 - s.m) * 0.28);
    if (w.walk >= 0) add('天气还行，想到院子里', w.walk * 16);
    else add('下雨，院子里没那么舒服', w.walk * 22);
    const sea = seasonOf().id;
    if (sea === 'summer' && h >= 11 && h <= 16) add('中午的太阳把人往屋里推', -8);
    else if (sea === 'autumn' && h > 8 && h < 18) add('这个季节适合出门', 5);
    else if (sea === 'winter') add('冬天的风有点凉', -3);
    if (h > 7 && h < 19) add('白天适合出门', 8);
    if (s.today.walk >= 2) add('已经出去过了', -12 * s.today.walk);
    if (s.e < 14) add('太累', -18);
    if (h >= 22 || h < 6) add('外面黑了', -16);

  },
  spec(spec) {
    const poor = s.money < 170 && marketValue() < 50;
    const id = 'walk';
    spec.energy = -0.03; spec.mood = 0.1 + Math.max(0, weatherOf(s.day).walk) * 0.05;

  },
  resolve(mins, id) {
    if (id === 'walk') {

        s.today.walk += 1;
        s.m = cl(s.m + 2);
        feelTo('loneliness', -6);
        if (weatherOf(s.day).short === '小雨') feelTo('nostalgia', 6);

    }
  },
  thoughts(push, id) {
    const y = s.yesterday;
    const w = weatherOf(s.day);
    push(true, w.walk > 0.5 ? '风不大，出去透口气。' : '就算天气一般，也想到院子里站一会儿。');
    push(w.short === '小雨', '雨不大，沿着屋檐走两圈就回来。');
    push(s.m < 45, '心情闷的时候，走路比刷屏有用。');

  },
  journal(spec) {
    const cost = spec.cost ? ('，花了 ¥' + spec.cost) : '';
    return '到院子里走走。';
  }
});

registerAction({
  id: 'relax',
  label: '窝在沙发上发呆',
  place: 'sofa',
  room: 'living',
  mins: 24,
  pose: 'sit',
  score(ctx) {
    const add = ctx.add;
    const h = ctx.h;
    const tax = ctx.tax;
    const poorEnergy = ctx.poorEnergy;
    const id = 'relax';
    add('需要缓一缓', 9);
    if (s.m < 42) add('心情不高', 16);
    if (s.e < 40 && h >= 11) add('有点没劲', 14);
    if (h >= 20.5 && h < 23.6) add('晚上适合发呆', 12);
    if (s.e > 78 && s.h < 35 && h > 9 && h < 17) add('精神很好，不必干坐着', -12);
    if (s.today.relax >= 3) add('已经歇了很久', -12);
    if (h >= 23.8 || h < 5) add('这个点更该睡', -12);
    if (s.restLock) add('身体要求先停下来', 18);
    if ((isWeekend() || holidayOf()) && !(s.today && s.today.overtime)) add('休息日想多歇一会儿', 8);
    if (holidayOf()) add('节日更想待在家里', 10);

  },
  spec(spec) {
    const poor = s.money < 170 && marketValue() < 50;
    const id = 'relax';
    spec.energy = 0.08; spec.mood = owns('sofa') ? 0.11 : 0.07;

  },
  resolve(mins, id) {
    if (id === 'relax') {

        s.today.relax += 1;
        if (owns('phone')) feelTo('loneliness', -3);
        if (owns('sofa')) feelTo('joy', 2);

    }
  },
  thoughts(push, id) {
    const y = s.yesterday;
    const w = weatherOf(s.day);
    push(true, '什么也不做，也算休息。');
    push(s.m < 40, '坐着，等心情自己浮上来。');
    push(s.e < 35, '不是懒，是电量不够了。');
    push(y && !y.workout, '沙发上会想起昨天没练，但不必马上惩罚自己。');

  },
  journal(spec) {
    const cost = spec.cost ? ('，花了 ¥' + spec.cost) : '';
    return '窝进沙发，什么也不做。';
  }
});

registerAction({
  id: 'practice',
  label: '练一门手艺',
  place: 'sofa',
  room: 'living',
  mins: 30,
  pose() {
    if (s.focus === 'cooking') return 'cook';
    if (s.focus === 'guitar') return 'sit';
    return 'type';
  },
  destination() { return practicePlace(); },
  labelOf() {
    return '练习' + ((SKILL_META[s.focus] || SKILL_META.guitar).name);
  },
  score(ctx) {
    const add = ctx.add;
    const h = ctx.h;
    const tax = ctx.tax;
    const poorEnergy = ctx.poorEnergy;
    const id = 'practice';
    const meta = SKILL_META[s.focus] || SKILL_META.guitar;
    if (s.restLock && s.e < 16) return false;
    if (s.focus === 'cooking' && !canPay(6)) return false;
    add('想把' + meta.name + '练扎实', 12);
    add('这个点适合慢练', Math.max(peak(h, 10, 12) * 8, peak(h, 19, 22.5) * 16));
    if (s.focus === 'guitar' || s.focus === 'drawing') add('一个人的时候想做点能留下的事', Math.max(0, ((s.feel && s.feel.loneliness) || 0) - 40) * 0.35);
    if (s.focus === 'trading') add('与其下单，不如复盘', 8);
    if ((s.today.practice || 0) >= 2) add('今天练过了', -16);
    if (s.h > 78) add('太饿，静不下来', -14);
    add('夜里不适合', -tax * 0.6);

  },
  spec(spec) {
    const poor = s.money < 170 && marketValue() < 50;
    const id = 'practice';
    if (s.focus === 'cooking') spec.cost = 6;
    spec.energy = -0.02; spec.mood = 0.06;

  },
  resolve(mins, id) {
    if (id === 'practice' && mins > 8) {

        s.today.practice = (s.today.practice || 0) + 1;
        const focus = s.focus && SKILL_META[s.focus] ? s.focus : 'guitar';
        gainSkill(focus, 7 + rand() * 3);
        if (focus === 'trading') {
          s.research = cl(s.research + 6, 0, 100);
          if (lessonStrength('patient') >= 12) markFollowed('patient');
        }
        if (focus === 'guitar') feelTo('loneliness', -8);
        if (focus === 'drawing') feelTo('nostalgia', 4);
        feelTo('pride', 4);
        feelTo('joy', 3);
        memory('practice', '练了一会儿' + SKILL_META[focus].name + '，现在大约 ' + skillRank(focus) + ' 级。');

    }
  },
  thoughts(push, id) {
    const y = s.yesterday;
    const w = weatherOf(s.day);
    const meta = SKILL_META[s.focus] || SKILL_META.guitar;
    push(true, '把' + meta.name + '练一会儿，不求今天就变厉害。');
    push(skillRank(s.focus) < 2, meta.name + '还生，生就慢慢来。');
    push(s.focus === 'trading', '今天只复盘，不拿仓位出气。');

  },
  mindEarly() {
    const meta = SKILL_META[s.focus] || SKILL_META.guitar;
    return '“' + meta.name + ' · 大约 ' + skillRank(s.focus) + ' 级，慢慢来。”';
  },
  journal(spec) {
    const cost = spec.cost ? ('，花了 ¥' + spec.cost) : '';
    return '开始练习' + ((SKILL_META[s.focus] || SKILL_META.guitar).name) + '。';
  }
});

registerAction({
  id: 'gig',
  label: '出门打散工',
  place: 'gate',
  room: 'yard',
  mins: 70,
  pose: 'walk',
  labelOf() {
    const gig = s.session && s.session.gig;
    return gig && gig.name ? ('出门' + gig.name) : '出门打散工';
  },
  score(ctx) {
    const add = ctx.add;
    const h = ctx.h;
    const tax = ctx.tax;
    const poorEnergy = ctx.poorEnergy;
    const id = 'gig';
    if (s.restLock || s.e < 14) return false;
    if (h < 7 || h > 20.5) add('这个点没有散工', -30);
    if (s.money < 90 || (s.debt || 0) > 0) add('口袋见底，得出去挣钱', 46);
    else if (s.money < 260) add('存款不够安心', 22);
    else if (!s.job && s.money < 520) add('还没稳定收入', 12);
    else add('手头还过得去', -16);
    if ((s.debt || 0) > 0) add('欠租不能再拖', 16);
    if (holidayOf()) add(holidayOf().id === 'cny' ? '过年几乎没人叫散工' : '节日散工不好找', holidayOf().id === 'cny' ? -28 : -16);
    if (s.job && s.money > 420 && !(s.debt > 0)) add('正职更值', -20);
    if ((s.today.search || 0) >= 1 && s.money < 320) add('简历解决不了今天的饭', 18);
    if (s.money < 90) add('今天就得有现金', 16);
    if ((s.today.gigs || 0) >= 2) add('今天跑过了', -16);
    if ((s.today.gigs || 0) >= 3) add('再跑就只剩累', -18);
    if (s.h > 76) add('太饿，跑不动', -16);
    if ((s.sickDays || 0) >= 2) add('病着，跑不动', -28);
    else if ((s.sickDays || 0) > 0) add('有点不舒服', -12);
    add('夜里不适合', -tax);

  },
  spec(spec) {
    const poor = s.money < 170 && marketValue() < 50;
    const id = 'gig';
    spec.energy = -0.16; spec.hunger = 0.07; spec.mood = -0.01; spec.gig = pickGig();
    if (holidayOf() && spec.gig) {
      const cut = holidayOf().id === 'cny' ? 0.55 : 0.75;
      spec.gig.pay = Math.max(20, Math.round(spec.gig.pay * cut));
    }

  },
  resolve(mins, id) {
    if (id === 'gig' && mins > 8) {

        const gig = (s.session && s.session.gig) || {name:'散工', pay:40, tired:10};
        const pay = Math.max(20, Math.round(gig.pay || 40));
        s.money += pay;
        s.today.earned += pay;
        s.today.gigs = (s.today.gigs || 0) + 1;
        s.today.gigPay = (s.today.gigPay || 0) + pay;
        s.e = cl(s.e - (gig.tired || 10));
        s.h = cl(s.h + 6);
        s.away = false;
        tx('income', gig.name || '散工', pay);
        const fare = payMetro();
        feelTo('anxiety', -8);
        feelTo('pride', 5);
        feelTo('joy', 3);
        const text = '从深圳街上回来了。' + (gig.name || '散工') + '进账 ¥' + pay + (fare ? ('，地铁 ¥' + fare) : '') + '，人是累的。';
        log(text);
        memory('gig', text, {value:pay});

    }
  },
  thoughtsLate(push, id) {
    const y = s.yesterday;
    const w = weatherOf(s.day);
    const gname = (s.session && s.session.gig && s.session.gig.name) || '散工';
    push(true, '出门' + gname + '，比干坐着算账有用。');
    push(s.money < 200, '存款见底的时候，腿比脑子诚实。');
    push((s.debt || 0) > 0, '欠着的房租会在路上一直响。');

  },
  mindEarly() { return '“出去跑一趟，把今天的现金垫上。”'; },
  journal(spec) {
    const cost = spec.cost ? ('，花了 ¥' + spec.cost) : '';
    return '拎上东西，从院子的门出去打散工。';
  }
});

registerAction({
  id: 'shop',
  label: '买一件想了很久的东西',
  place: 'desk',
  room: 'study',
  mins: 24,
  pose: 'type',
  labelOf() {
    const item = (s.session && s.session.item) || nextPurchase();
    return item ? ('买' + item.name) : '看看想买的东西';
  },
  score(ctx) {
    const add = ctx.add;
    const h = ctx.h;
    const tax = ctx.tax;
    const poorEnergy = ctx.poorEnergy;
    const id = 'shop';
    const item = nextPurchase();
    if (!item || (s.debt || 0) > 40) return false;
    add('想把' + item.name + '买回来', item.impulse ? 14 : 10);
    if (s.money > 3600) add('存款宽裕', 16);
    if (s.money > 6200) add('再放着也是数字', 10);
    if ((s.today.workMin || 0) > 80 && s.money > 2800) add('今天的班上完了', 14);
    if (item.impulse) add('手有点痒', 8);
    if (s.money < item.cost + 500) add('买完会紧', -12);
    if ((s.today.shop || 0) >= 1) add('今天买过了', -34);
    if (h < 10 || h > 21) add('这会儿不去买', -18);
    if (s.h > 78) add('太饿，没心思逛', -12);
    if (holidayOf()) add('节日标价更贵', -6);

  },
  spec(spec) {
    const poor = s.money < 170 && marketValue() < 50;
    const id = 'shop';
    const item = nextPurchase();
    if (item) { spec.cost = holidayMarkup(item.cost); spec.item = item; spec.mood = item.impulse ? 0.03 : 0.08; }

  },
  resolve(mins, id) {
    if (id === 'shop') {

        const item = s.session && s.session.item;
        if (item && !owns(item.id)) {
          if (!s.owned) s.owned = [];
          s.owned.push(item.id);
          s.today.shop = (s.today.shop || 0) + 1;
          const paid = Math.round((s.session && s.session.cost) || item.cost);
          if (item.impulse) {
            feelTo('joy', 5);
            mistake('impulsebuy', '一时手痒买了' + item.name + '，花了 ¥' + paid + '。');
          } else {
            feelTo('joy', 8);
            feelTo('pride', 4);
            const text = item.name + '到了，放在屋子里。花了 ¥' + paid + '。';
            log(text);
            memory('purchase', text, {value:-paid});
          }
        }

    }
  },
  thoughtsLate(push, id) {
    const y = s.yesterday;
    const w = weatherOf(s.day);
    const item = (s.session && s.session.item) || nextPurchase();
    push(!!item && !item.impulse, item ? (item.name + '会让接下来的日子不一样。') : '');
    push(!!item && item.impulse, '这一下也许不必买，可手已经伸出去了。');

  },
  mindEarly() { return '“买之前先看存款还剩多少。”'; },
  journal(spec) {
    const cost = spec.cost ? ('，花了 ¥' + spec.cost) : '';
    return '坐到桌前，看看想买的那样东西。';
  }
});

registerAction({
  id: 'sleep',
  label: '睡着了',
  place: 'bed',
  room: 'bedroom',
  mins: 80,
  pose: 'sleep',
  duration() { return s.e < 32 ? 100 : 78; },
  onStart() {
    if (hour() < 23.2) markFollowed('sleep');
    const td = s.today || {};
    const lived = (td.meals || 0) + (td.workout || 0) + (td.search || 0) + (td.practice || 0) + ((td.mistakeIds || []).length) + ((td.workMin || 0) > 0 ? 1 : 0);
    if (lived > 0 && (hour() >= 18 || hour() < 4)) writeDiary(s.day);
  },
  score(ctx) {
    const add = ctx.add;
    const h = ctx.h;
    const tax = ctx.tax;
    const poorEnergy = ctx.poorEnergy;
    const id = 'sleep';
    add('这个钟点容易困', circadian(h) * 46);
    const tired = Math.max(0, 100 - s.e) * 0.42;
    if (s.e < 42) add('精力不够了', tired);
    else if (s.e < 75) add('精神还没回满', tired);
    else add('还剩一点困意', tired);
    add('醒得太久', Math.max(0, s.awakeMin / 60 - 14) * 5);
    if (h >= 22.5 || h < 5.5) add('到了夜里', 18);
    if ((s.sickDays || 0) >= 2 && h > 8 && h < 21) add('病着，想躺一会儿', 22);
    else if (h > 8 && h < 21 && s.e > 38) add('大白天还不该睡', -42);
    if (s.h > 74 && h > 6 && h < 23 && canPay(8)) add('太饿，不先睡', -34);

  },
  thoughts(push, id) {
    const y = s.yesterday;
    const w = weatherOf(s.day);
    push(true, '今天的账，明天再算。');
    push(true, '灯可以暗下去了。');
    push(s.e < 30, '身体先于想法投降了。');
    push(y && y.pnl < 0, '睡着之前还想了一下回撤，想完就算了。');

  },
  journal(spec) {
    const cost = spec.cost ? ('，花了 ¥' + spec.cost) : '';
    return '去睡觉了。';
  }
});
