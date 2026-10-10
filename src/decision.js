import { WHIM_FREE, WHIM_JOB } from './actions/catalog.js';
import { isWeekend, seasonOf } from './calendar.js';
import { holidayThought } from './holidays.js';
import { SKILL_META } from './constants.js';
import { actionIds, getAction } from './actions/define.js';
import { applyInnerBias } from './emotions.js';
import { goToPlace } from './map.js';
import { ensureCash } from './market.js';
import { log, memoryNudge, trace } from './memory.js';
import { tx } from './money.js';
import { s } from './state.js';
import { hour, nightTax, rand, randn, weatherOf } from './util.js';

export function explain(ev) {
  const top = ev.parts.filter(p => p.value > 6).sort((a, b) => b.value - a.value).slice(0, 3);
  if (!top.length) return '没什么特别急的事，他按自己的感觉选了这个。';
  return top.map(p => p.label).join('，') + '。';
}

export function choose() {
  const opts = [];
  for (const id of actionIds()) {
    const ev = evaluate(id);
    if (!ev.ok) continue;
    const noise = Math.max(-12, Math.min(12, randn() * 6.2));
    opts.push({id:id, score:ev.score, parts:ev.parts, noisy:ev.score + noise});
  }
  if (!opts.length) return {id:'relax', reason:'没什么可做的，先歇一下。', scores:{}};
  const max = Math.max.apply(null, opts.map(o => o.noisy));
  const T = 7.4;
  const weights = opts.map(o => Math.exp((o.noisy - max) / T));
  let total = 0;
  for (const w of weights) total += w;
  let r = rand() * total;
  let chosen = opts[opts.length - 1];
  for (let i = 0; i < opts.length; i++) {
    r -= weights[i];
    if (r <= 0) { chosen = opts[i]; break; }
  }
  const scores = {};
  opts.forEach(o => { scores[o.id] = Math.round(o.score * 10) / 10; });
  return {id:chosen.id, reason:explain(chosen), scores:scores};
}

export function rawScores() {
  const scores = {};
  for (const id of actionIds()) {
    const ev = evaluate(id);
    if (ev.ok) scores[id] = Math.round(ev.score * 10) / 10;
  }
  return scores;
}

export function morningPlan() {
  if (s.h >= 70) return '先吃饭';
  if (s.e < 20) return '补觉';
  if (!s.job) return s.money < 400 ? '尽快找到收入' : '找工作';
  if (s.day < s.workFromDay) return '准备开工';
  if ((s.today.workMin || 0) < 180) return '完成项目';
  if (s.yesterday && !s.yesterday.workout) return '补上训练';
  if ((s.today.practice || 0) < 1 && s.focus && SKILL_META[s.focus] && (s.day % 3 === 0)) return '练' + SKILL_META[s.focus].name;
  return '研究市场';
}

export function pickOne(arr) {
  if (!arr.length) return '';
  return arr[Math.floor(rand() * arr.length)];
}

export function rollWhim() {
  const pool = s.job ? WHIM_JOB : WHIM_FREE;
  return pool[Math.floor(rand() * pool.length)];
}

export function evaluate(id) {
  const parts = [];
  const add = (label, value) => {
    if (!isFinite(value) || Math.abs(value) < 0.05) return;
    parts.push({label:label, value:value});
  };
  const bad = {ok:false, score:-1e9, parts:[]};
  const action = getAction(id);
  if (s.block === id || !action) return bad;
  const h = hour();
  const tax = nightTax(h);
  const poorEnergy = s.e < 16;
  const repeat = (id === s.action && id !== 'sleep') ? -(8 + (s.chain || 1) * 5) : 0;
  if (action.score) {
    const veto = action.score({add:add, h:h, tax:tax, poorEnergy:poorEnergy});
    if (veto === false) return bad;
  }
  if (repeat) add('刚做过，先换一件', repeat);
  const nudge = memoryNudge(id);
  if (nudge) add(nudge.label, nudge.v);
  if (id === s.whim && id !== 'sleep') add('今天有点想做这件事', 8);
  applyInnerBias(id, add);
  const score = parts.reduce((sum, p) => sum + p.value, 0);
  return {ok:true, score:score, parts:parts};
}

export function durationMin(id) {
  const action = getAction(id);
  if (action && action.duration) return action.duration();
  return action ? action.mins : 10;
}

export function makeSpec(id) {
  const spec = {hunger:0, energy:0, mood:0, cost:0, wage:0};
  const action = getAction(id);
  if (action && action.spec) action.spec(spec);
  return spec;
}

export function startLog(id, spec) {
  const action = getAction(id);
  if (action && action.journal) return action.journal(spec);
  return (action && action.label) || id;
}

export function actionLabel(id) {
  const action = getAction(id);
  if (!action) return id || '';
  if (action.labelOf) return action.labelOf();
  return action.label;
}

export function currentPose() {
  if (s.moving) return 'walk';
  const action = getAction(s.action);
  if (!action) return 'idle';
  if (typeof action.pose === 'function') return action.pose();
  return action.pose || 'idle';
}

export function composeThought(id) {
  const lines = [];
  const push = (cond, t) => { if (cond) lines.push(t); };
  const action = getAction(id);
  if (action && action.thoughts) action.thoughts(push, id);
  const missed = (s.mistakes || [])[0];
  push(!!missed, '还记得：' + (missed ? String(missed.text).slice(0, 42) : ''));
  const held = (s.lessons || [])[0];
  push(!!held && held.strength > 20, '他提醒自己：' + (held ? held.text : ''));
  push(!!(s.feel && s.feel.regret > 40), '后悔还没散，所以这回想慢一点。');
  push(!!(s.feel && s.feel.nostalgia > 45), '旧晚上又来了，他没有赶走它。');
  const seen = (s.insights || [])[0];
  push(!!seen, '他近来认定：' + (seen ? String(seen.text).slice(0, 36) : ''));
  if (action && action.thoughtsLate) action.thoughtsLate(push, id);
  const fest = holidayThought();
  push(!!fest, fest);
  push(isWeekend() && s.today && s.today.overtime, '周末本来想歇，存款和这件事让他打开了电脑。');
  push(isWeekend() && s.job && !(s.today && s.today.overtime), '周末，他让自己停一停。');
  const sea = seasonOf().id;
  const sky = weatherOf(s.day).short;
  push(sea === 'summer' && sky === '晴热', '深圳的太阳把院子晒得发烫，空调一直转着。');
  push(sea === 'autumn', '这个季节出门刚刚好。');
  push(sea === 'winter', '深圳的冬天不算冷，薄外套就够。');
  push(sea === 'spring' && sky === '小雨', '回南天，墙上有点潮。');
  push((s.debt || 0) > 0, '欠着的数字比天气更清楚。');
  push(s.money < 180, '存款见底的时候，连呼吸都变短。');
  push(s.money < 140, '钱包比计划更诚实。');
  const note = s.lifeNote || {};
  const yesterdayNote = note.day && s.day === note.day + 1;
  push((s.sickDays || 0) > 0, '嗓子不舒服，今天的事先放轻一点。');
  push(!!(yesterdayNote && note.sick) && !(s.sickDays > 0), '身子还记得前几天不舒服。');
  push(!!(yesterdayNote && note.haircut), '昨天把头发剪短了，镜子里清爽一点。');
  push(!!(yesterdayNote && note.rentTight), '房租刚走，口袋空了一块。');
  push(!!note.regret, '那件衣服买的时候高兴，现在看着有点多余。');
  push(!!(yesterdayNote && note.utilities), '水电单比预想的厚，是在家待久了。');
  push(!!(yesterdayNote && note.supplies), '牙膏和洗衣液又买上了。');
  push(!!(note.billWorry && (s.debt || 0) > 0), '有一笔账没付齐，数字还挂着。');
  const line = pickOne(lines) || '……';
  return '“' + line + '”';
}

export function composeMind(id) {
  const action = getAction(id);
  if (action && action.mindEarly) {
    const line = action.mindEarly();
    if (line) return line;
  }
  if ((s.debt || 0) > 0) return '“欠款还在，先把日子垫平。”';
  if (action && action.mind) {
    const line = action.mind();
    if (line) return line;
  }
  if (s.riskOffDays > 0) return '“亏过的那笔还在起作用：允许研究，暂停加仓。”';
  if (s.yesterday && s.yesterday.pnl < -15) return '“昨天的回撤是波动，不是要翻本的指令。”';
  const pool = [
    '“先理解，再行动；不被短期波动牵着走。”',
    '“兴趣是加密和美股，方法是把仓位留小。”',
    '“认知高一点，用处是少做蠢事，不是预测明天。”'
  ];
  return pool[Math.floor(rand() * pool.length)];
}

export function resolve(id) {
  const mins = s.acted || 0;
  const action = getAction(id);
  if (action && action.resolve) action.resolve(mins, id);
  s.money = Math.max(0, s.money);
}

export function startAction(id, depth) {
  depth = depth || 0;
  if (!getAction(id) || depth > 4) id = 'relax';
  const spec = makeSpec(id);
  if (spec.cost > 0) {
    ensureCash(spec.cost);
    if (s.money < spec.cost) {
      s.block = id;
      const alt = choose();
      s.block = null;
      s.decision = {action:alt.id, reason:alt.reason, scores:alt.scores};
      return startAction(alt.id === id ? 'relax' : alt.id, depth + 1);
    }
  }
  if (id === s.action) s.chain = (s.chain || 1) + 1;
  else s.chain = 1;
  s.action = id;
  s.hungerAtStart = s.h;
  s.session = spec;
  s.acted = 0;
  s.left = durationMin(id) * 4;
  const action = getAction(id);
  goToPlace(action.destination ? action.destination() : action.place);
  if (spec.cost > 0) {
    s.money = Math.max(0, s.money - spec.cost);
    s.today.spent += spec.cost;
    tx('expense', (spec.item && spec.item.name) || actionLabel(id), -spec.cost);
  }
  if (spec.junk) s.today.junkMeals = (s.today.junkMeals || 0) + 1;
  if (spec.comfort) s.today.comfort = 1;
  if (action.onStart) action.onStart();
  s.thought = composeThought(id);
  s.mind = composeMind(id);
  s.plan = morningPlan();
  log(startLog(id, spec));
  trace(id);
}
