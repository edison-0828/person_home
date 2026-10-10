import { FEEL_NAME, LESSON_TEXT, SKILL_META } from './constants.js';
import { researchNeed } from './market.js';
import { log, memory } from './memory.js';
import { moneyPressure } from './money.js';
import { skillRank } from './skills.js';
import { freshToday, s } from './state.js';
import { cl, hour, rand, weatherOf } from './util.js';

export function freshFeel() {
  return {joy:46, anxiety:28, loneliness:52, pride:24, regret:8, hope:44, nostalgia:12};
}

export function freshValues() { return {health:1, craft:1, calm:1, money:1}; }

export function lessonOf(id) {
  return (s.lessons || []).find(function (l) { return l && l.id === id; }) || null;
}

export function lessonStrength(id) {
  const l = lessonOf(id);
  return l ? cl(l.strength || 0) : 0;
}

export function feelTo(key, delta) {
  if (!s.feel) s.feel = freshFeel();
  if (s.feel[key] === undefined || !isFinite(delta)) return;
  s.feel[key] = cl(s.feel[key] + delta);
  const moodMap = {joy:0.08, hope:0.05, pride:0.05, anxiety:-0.06, regret:-0.06, loneliness:-0.04, nostalgia:0.02};
  if (moodMap[key]) s.m = cl(s.m + delta * moodMap[key]);
}

export function feelBaseline() {
  return {
    joy:42 + (s.m - 50) * 0.12,
    anxiety:24 + moneyPressure(),
    loneliness:48,
    pride:22 + Math.min(10, s.streak && s.streak.workout || 0),
    regret:12,
    hope:(s.job ? 56 : 40) - ((s.debt || 0) > 0 ? 10 : 0) - (s.money < 120 ? 6 : 0),
    nostalgia:weatherOf(s.day).short === '小雨' ? 34 : 16
  };
}

export function decayFeel(mins) {
  if (!s.feel) s.feel = freshFeel();
  const base = feelBaseline();
  const k = 1 - Math.exp(-Math.max(0, mins) / 220);
  Object.keys(base).forEach(function (key) {
    s.feel[key] = cl(s.feel[key] + (base[key] - s.feel[key]) * k);
  });
}

export function rainMood() {
  if (!s.today) return;
  if (weatherOf(s.day).short !== '小雨' || s.today.rainNoted) return;
  s.today.rainNoted = 1;
  feelTo('nostalgia', 20);
  feelTo('loneliness', 6);
  memory('rain', '下雨了，他想起以前一个人听雨的晚上。');
}

export function maybeInsight(fromLesson) {
  if (s.today && s.today.insight && fromLesson) return;
  const recent = (s.insights || []).some(function (i) { return i && s.day - i.day < 2; });
  if (recent && !fromLesson) return;
  if (!fromLesson && rand() > 0.22) return;
  let text = '';
  let origin = fromLesson || 'life';
  const shift = {health:0, craft:0, calm:0, money:0};
  const had = function (src) {
    return (s.insights || []).some(function (i) { return i && i.from === src; });
  };
  if (fromLesson === 'patient') {
    text = '钱会回来，手痒的那一下不会。存款还剩 ¥' + Math.round(s.money) + '，不够拿来出气。';
    shift.money = -0.16; shift.calm = 0.18;
  } else if (fromLesson === 'train' || fromLesson === 'oversleep') {
    text = '把自己照顾好不是奖励，是第二天还能想事情的前提。';
    shift.health = 0.22; shift.calm = 0.08;
  } else if (fromLesson === 'spend' || fromLesson === 'sleep') {
    text = '孤独填不满账单，熬夜也补不回判断。';
    shift.craft = 0.12; shift.calm = 0.12; shift.money = -0.08;
  } else if (s.feel && s.feel.regret > 36 && s.mistakes && s.mistakes[0] && !had('regret')) {
    text = '后悔如果只停在晚上，第二天还会重来。存款还剩 ¥' + Math.round(s.money) + '。';
    shift.calm = 0.14;
    origin = 'regret';
  } else if ((s.money || 0) < 520 && !s.job && !had('money')) {
    text = '第' + s.day + '天存款只剩 ¥' + Math.round(s.money) + '，先把日子稳住，再谈翻盘。';
    shift.money = 0.12; shift.calm = 0.08;
    origin = 'money';
  } else if ((s.streak && s.streak.workout || 0) >= 4 && !had('streak')) {
    text = '连续练了 ' + s.streak.workout + ' 天，身体比计划更诚实。';
    shift.health = 0.14;
    origin = 'streak';
  } else if (s.focus && skillRank(s.focus) >= 2 && !had('craft')) {
    text = (SKILL_META[s.focus] || SKILL_META.guitar).name + '慢慢变成了自己的事，而不是打发时间。';
    shift.craft = 0.16;
    origin = 'craft';
  } else if (s.feel && s.feel.nostalgia > 50 && !had('nostalgia')) {
    text = '想念不会把一个人变好，但承认它，晚上会轻一点。第' + s.day + '天他这么觉得。';
    shift.calm = 0.1; shift.craft = 0.08;
    origin = 'nostalgia';
  } else if (s.feel && s.feel.loneliness > 64 && !had('alone')) {
    text = '一个人住没关系，但日子不能只剩行情和招聘。';
    shift.craft = 0.18;
    origin = 'alone';
  } else return;
  if (!s.values) s.values = freshValues();
  s.values.health = cl(s.values.health + shift.health, 0.65, 1.75);
  s.values.craft = cl(s.values.craft + shift.craft, 0.65, 1.75);
  s.values.calm = cl(s.values.calm + shift.calm, 0.65, 1.75);
  s.values.money = cl(s.values.money + shift.money, 0.65, 1.75);
  if (!s.insights) s.insights = [];
  s.insights.unshift({day:s.day, text:text, from:origin});
  if (s.insights.length > 6) s.insights.length = 6;
  if (s.today) s.today.insight = 1;
  feelTo('hope', 6);
  log('他停了一下：' + text);
  memory('insight', text);
}

export function reinforceLesson(id, amount, why) {
  if (!s.lessons) s.lessons = [];
  let l = lessonOf(id);
  const born = !l;
  if (!l) {
    l = {id:id, text:LESSON_TEXT[id] || id, strength:0, day:s.day, formed:s.day, followed:0, ignored:0, why:why || ''};
    s.lessons.unshift(l);
    if (s.lessons.length > 8) s.lessons.length = 8;
  } else l.ignored = (l.ignored || 0) + 1;
  const before = l.strength || 0;
  l.strength = cl(before + amount);
  l.day = s.day;
  l.why = why || l.why;
  if (before < 52 && l.strength >= 52) maybeInsight(id);
  else if (born && l.strength >= 52) maybeInsight(id);
  return l;
}

export function markFollowed(id) {
  const l = lessonOf(id);
  if (!l || (l.strength || 0) < 12) return;
  if (l.followDay === s.day) return;
  l.followDay = s.day;
  l.followed = (l.followed || 0) + 1;
  l.strength = cl(l.strength + 4);
  if (!s.arc) s.arc = [];
  s.arc.push({lesson:id, day:s.day, regret:Math.round(s.feel && s.feel.regret || 0), text:l.text});
  if (s.arc.length > 16) s.arc.splice(0, s.arc.length - 16);
}

export function mistake(id, detail) {
  if (!s.today) s.today = freshToday();
  if (!s.today.mistakeIds) s.today.mistakeIds = [];
  if (s.today.mistakeIds.indexOf(id) >= 0) return;
  s.today.mistakeIds.push(id);
  log(detail);
  memory('mistake', detail);
  feelTo('regret', 16);
  feelTo('joy', -6);
  if (id === 'impulse') { feelTo('anxiety', 8); reinforceLesson('patient', 34, detail); }
  else if (id === 'late') { feelTo('anxiety', 5); reinforceLesson('sleep', 26, detail); }
  else if (id === 'skip') reinforceLesson('train', 24, detail);
  else if (id === 'spend') { feelTo('anxiety', 6); reinforceLesson('spend', 26, detail); }
  else if (id === 'oversleep') reinforceLesson('oversleep', 22, detail);
  else if (id === 'rent') { feelTo('anxiety', 8); reinforceLesson('rent', 28, detail); }
  else if (id === 'impulsebuy') { feelTo('anxiety', 4); reinforceLesson('spend', 22, detail); }
  if (!s.mistakes) s.mistakes = [];
  s.mistakes.unshift({day:s.day, id:id, text:detail});
  if (s.mistakes.length > 12) s.mistakes.length = 12;
}

export function dominantFeel() {
  const base = feelBaseline();
  let best = 'loneliness', lift = -1e9, absBest = 'loneliness', abs = -1;
  Object.keys(FEEL_NAME).forEach(function (k) {
    const v = s.feel && s.feel[k] || 0;
    const d = v - (base[k] || 0);
    if (d > lift) { lift = d; best = k; }
    if (v > abs) { abs = v; absBest = k; }
  });
  const key = lift >= 4 ? best : absBest;
  return {key:key, name:FEEL_NAME[key], value:s.feel && s.feel[key] || 0};
}

export function applyInnerBias(id, add) {
  const f = s.feel || freshFeel();
  const v = s.values || freshValues();
  if (id === 'workout') {
    add('身体这件事变重了', (v.health - 1) * 14);
    add('没练过的教训还在', lessonStrength('train') * 0.28);
    if (f.pride > 58) add('想保住练出来的感觉', 5);
  }
  if (id === 'sleep') {
    add('想把作息拉回来', lessonStrength('sleep') * 0.22 + lessonStrength('oversleep') * 0.18);
    add('想让心里静一点', (v.calm - 1) * 10);
    if (f.anxiety > 64 && (hour() >= 22 || hour() < 6)) add('焦虑的时候更该睡', 6);
  }
  if (id === 'market') {
    add('还惦记着钱', (v.money - 1) * 8);
    if (f.anxiety > 64 && lessonStrength('patient') < 12) add('焦虑时会想看盘', 6);
    if (lessonStrength('patient') > 16 && s.research < researchNeed()) add('上次手痒亏过，这回先别扑上去', -lessonStrength('patient') * 0.16);
  }
  if (id === 'practice') {
    add('想把手艺留住', (v.craft - 1) * 14);
    if (s.focus === 'trading') add('教训是先复盘再动手', lessonStrength('patient') * 0.32);
  }
  if (id === 'cook') {
    add('想把饭做好一点', skillRank('cooking') * 1.4 + (s.focus === 'cooking' ? 7 : 0));
    add('少靠外卖撑着', lessonStrength('spend') * 0.22);
  }
  if (id === 'dinner' && !s.prepped) add('外卖会让他心虚', -lessonStrength('spend') * 0.14);
  if (id === 'walk' && f.nostalgia > 48 && weatherOf(s.day).short === '小雨') add('雨声让他想在屋檐下站一会儿', 6);
  if (id === 'relax' && f.nostalgia > 55) add('想一个人坐着', 6);
  if ((id === 'practice' || id === 'walk') && f.loneliness > 62) add('一个人久了，想做点有回声的事', 6);
  if (id === 'search' && f.hope < 28) add('盼头不多，投简历也发虚', -6);
  if (id === 'search' && f.hope > 62) add('还觉得会有回音', 4);
  if (id === 'gig' && (s.money < 240 || (s.debt || 0) > 0)) add('焦虑在推他出门', Math.min(8, Math.max(0, f.anxiety - 36) * 0.12));
  if (id === 'shop' && (s.complacent || 0) > 0) add('顺的时候容易买', 6);
  if (id === 'shop' && (s.debt || 0) > 0) add('欠着钱还想买', -18);
  if (id === 'workout' && (s.complacent || 0) > 0) add('顺的时候不想动', -6);
  if (id === 'sleep' && f.anxiety > 72 && s.money < 180) add('躺下也还在算账', -4);
}
