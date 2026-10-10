import { ageOf, isBirthday } from './calendar.js';
import { TILE } from './constants.js';
import { choose, morningPlan, resolve, rollWhim, startAction } from './decision.js';
import { writeDiary } from './diary.js';
import { decayFeel, feelTo, mistake, rainMood } from './emotions.js';
import { SPOTS, roomAt, tileOf } from './map.js';
import { driftPrices, markMood, marketValue } from './market.js';
import { log, memory } from './memory.js';
import { isNewMonth, noteUsage, settleLiving } from './expenses.js';
import { careerDay, moneyMood, owns, shiftTrajectory } from './money.js';
import { persist } from './persist.js';
import { chooseFocus } from './skills.js';
import { flags, freshToday, s } from './state.js';
import { absMin, cl, hour, rand, weatherOf } from './util.js';

export function spoilCheck() {
  if (!s.prepped) return;
  if (absMin() - s.preppedAt < 180) return;
  s.prepped = false;
  s.m = cl(s.m - 4);
  log('做好的晚饭放凉了。');
  memory('waste', '晚饭放凉了，有点可惜。');
}

export function finishAndDecide() {
  if (flags.deciding) return;
  flags.deciding = true;
  try {
    resolve(s.action);
    spoilCheck();
    const c = choose();
    s.decision = {action:c.id, reason:c.reason, scores:c.scores};
    startAction(c.id);
    persist();
  } finally {
    flags.deciding = false;
  }
}

export function baseDrift(mins) {
  const sess = s.session || {hunger:0, energy:0, mood:0};
  if (s.action === 'sleep') {
    let recover = 0.135 + (sess.energy || 0);
    let mood = 0.006 + (sess.mood || 0);
    if (s.money < 180 || (s.debt || 0) > 0 || (s.feel && s.feel.anxiety > 68)) {
      recover *= 0.62;
      mood -= 0.014;
    }
    if ((s.sickDays || 0) > 0) recover *= 0.72;
    s.e = cl(s.e + mins * recover);
    s.h = cl(s.h + mins * (0.02 + (sess.hunger || 0)));
    s.m = cl(s.m + mins * mood);
    return;
  }
  let e = -0.028 + (sess.energy || 0);
  let h = 0.05 + (sess.hunger || 0);
  let m = -0.008 + (sess.mood || 0);
  if (s.h > 82) m -= 0.055;
  if (s.e < 14) m -= 0.04;
  if (s.money < 70 && marketValue() < 40) m -= 0.015;
  if ((s.sickDays || 0) > 0) { e -= 0.016; m -= 0.008; }
  s.e = cl(s.e + mins * e);
  s.h = cl(s.h + mins * h);
  s.m = cl(s.m + mins * m);
}

export function move(dt) {
  s.anim += dt;
  if (!s.path || !s.path.length) {
    s.moving = false;
    if (s.action === 'gig') {
      const here = tileOf(s.x, s.y);
      if (here.c === SPOTS.gate.c && here.r === SPOTS.gate.r) s.away = true;
    } else s.away = false;
    if (s.action === 'walk') {
      const looks = ['down', 'right', 'up', 'left'];
      s.face = looks[Math.floor(s.anim * 0.08) % 4];
    } else if (s.faceGoal) s.face = s.faceGoal;
    const rm = roomAt(s.x, s.y);
    if (rm) s.room = rm;
    return;
  }
  s.moving = true;
  let budget = 2.7 * dt;
  let guard = 0;
  while (budget > 0 && s.path.length && guard++ < 6) {
    const node = s.path[0];
    if (!node || !isFinite(node[0]) || !isFinite(node[1])) {
      s.path.shift();
      continue;
    }
    const tx = (node[0] + 0.5) * TILE;
    const ty = (node[1] + 0.5) * TILE;
    const dx = tx - s.x, dy = ty - s.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= 0.35) {
      s.x = tx;
      s.y = ty;
      s.path.shift();
      continue;
    }
    const hop = Math.min(budget, dist);
    s.x += dx / dist * hop;
    s.y += dy / dist * hop;
    if (Math.abs(dx) >= Math.abs(dy)) s.face = dx > 0 ? 'right' : 'left';
    else s.face = dy > 0 ? 'down' : 'up';
    budget -= hop;
    if (hop >= dist - 0.01) {
      s.x = tx;
      s.y = ty;
      s.path.shift();
    } else break;
  }
  if (!s.path.length) {
    s.moving = false;
    if (s.faceGoal) s.face = s.faceGoal;
  }
  const rm = roomAt(s.x, s.y);
  if (rm) s.room = rm;
}

export function summarize(day) {
  const td = s.today || freshToday();
  if (!td.workout && s.e > 22) mistake('skip', '第' + day + '天有力气，却把训练跳过去了。');
  if (td.comfort) mistake('spend', '第' + day + '天晚饭多点了一份安慰自己的东西，花得有点心虚。');
  settleLiving(day);
  if (isBirthday(day)) {
    s.today.birthday = 1;
    const age = ageOf(day);
    log('今天是他的生日，在深圳' + age + '岁了。');
    memory('birthday', '第' + day + '天，他' + age + '岁了。');
    feelTo('joy', 8);
    feelTo('hope', 4);
    s.m = cl(s.m + 4);
  }
  careerDay(td);
  shiftTrajectory(day, td);
  writeDiary(day);
  if (s.lessons && s.lessons.length) {
    s.lessons = s.lessons.filter(function (l) {
      if (!l) return false;
      l.strength = (l.strength || 0) - (l.followDay === day ? 3 : 6);
      return l.strength >= 8;
    });
  }
  const pnl = Math.round(td.pnl || 0);
  const pnlText = Math.abs(pnl) < 1 ? '市场几乎没动' : (pnl > 0 ? '市场约盈 ¥' + pnl : '市场约亏 ¥' + Math.abs(pnl));
  const jobText = s.job ? (td.workMin > 0 ? '工作 ' + Math.round(td.workMin) + ' 分钟' : '没开工') : ('投了 ' + (td.search || 0) + ' 份简历');
  const text = '第' + day + '天：吃了 ' + (td.meals || 0) + ' 顿，' + (td.workout ? '练过' : '没练') + '，' + jobText + '，' + pnlText + '，存款 ¥' + Math.round(s.money) + '。';
  s.yesterday = {
    day:day, text:text,
    workout:td.workout > 0,
    meals:td.meals || 0,
    pnl:pnl,
    rejections:td.rejects || 0,
    skippedMeal:(td.meals || 0) < 2,
    worked:(td.workMin || 0) >= 30,
    searches:td.search || 0
  };
  memory('day_summary', text, {value:pnl});
  if ((td.meals || 0) < 1) s.m = cl(s.m - 6);
  if (!td.workout) s.streak.workout = 0;
  s.today = freshToday();
  s.meals = {breakfast:false, lunch:false, dinner:false};
  s.research = cl(s.research - 8, 0, 100);
  if (s.riskOffDays > 0) s.riskOffDays -= 1;
  driftPrices(1.15);
  const overnight = markMood();
  if (Math.abs(overnight) >= 18 && ((s.cost.btc || 0) + (s.cost.spy || 0)) > 30) {
    const t = overnight > 0 ? '过夜持仓多了约 ¥' + Math.round(overnight) + '。' : '过夜持仓少了约 ¥' + Math.abs(Math.round(overnight)) + '。';
    memory('market_pnl', t, {value:overnight});
    s.lastPnl = Math.round(overnight);
  }
}

export function tick(dt) {
  if (!isFinite(dt) || dt <= 0) return;
  dt = Math.min(dt, 2);
  const mins = dt / 4;
  s.t += mins;
  noteUsage(mins);
  let guard = 0;
  while (s.t >= 1440 && guard++ < 4) {
    s.t -= 1440;
    summarize(s.day);
    s.day += 1;
    if (isNewMonth(s.day)) {
      s.monthIn = 0;
      s.monthOut = 0;
      s.monthDay = s.day;
    }
    s.whim = rollWhim();
    chooseFocus();
    s.plan = morningPlan();
    if (!owns('junk') && (((s.complacent || 0) > 0) || (s.money > 4600 && rand() < 0.5))) s.today.itch = 1;
    log('新的一天开始了。天气是' + weatherOf(s.day).short + '。');
  }
  moneyMood();
  decayFeel(mins);
  rainMood();
  const hh = hour();
  if (s.action !== 'sleep' && s.action !== 'wake' && hh >= 23.3) mistake('late', '第' + s.day + '天已经过了十一点还没去睡。');
  if (s.action === 'sleep' && hh >= 9.5 && hh < 11) mistake('oversleep', '第' + s.day + '天睡到将近十点，早晨被睡过去了。');
  if (s.action === 'sleep') s.awakeMin = 0;
  else s.awakeMin += mins;
  s.sinceEatMin += mins;
  s.acted += mins;
  baseDrift(mins);
  if (s.today) {
    if (s.today.lowE == null || s.e < s.today.lowE) s.today.lowE = s.e;
    if (s.today.lowM == null || s.m < s.today.lowM) s.today.lowM = s.m;
  }
  move(dt);
  if (s.e > 30) s.restLock = false;
  if (s.e <= 8 && (s.action === 'workout' || s.action === 'work' || s.action === 'search' || s.action === 'gig')) {
    s.restLock = true;
    if (s.left > 0) log('精力撑不住，他提前停下了。');
    s.left = 0;
  }
  s.left -= dt;
  if (s.left <= 0) finishAndDecide();
}
