import { CITY, GRAD_YEAR, ageOf, ageStage, cognitionNow, formatDate, seasonOf, weekdayName } from './calendar.js';
import { holidayOf } from './holidays.js';
import { scheduleLabel } from './schedule.js';
import { FEEL_NAME, KEY, MIND, SKILL_META } from './constants.js';
import { actionLabel, choose, currentPose, rawScores, startAction } from './decision.js';
import { finishAndDecide } from './loop.js';
import { SPOTS, auditMap, cell, findPath, tileOf, walkable } from './map.js';
import { buy, marketValue, sell, tradeGate } from './market.js';
import { memory } from './memory.js';
import { hireChance, hourlyWage, netWorth, rankInfo, stageOf } from './money.js';
import { applyIncoming, persist } from './persist.js';
import { draw } from './render.js';
import { impulseChance, skillLevelOf } from './skills.js';
import { s } from './state.js';
import { ui } from './ui.js';
import { fmtDur, rand, time, weatherOf } from './util.js';

export function snapshotText() {
  const scores = (s.decision && s.decision.scores) || {};
  return JSON.stringify({
    coordinate_system:'top-down 16px tiles; origin top-left; x right, y down; screen = world * 2',
    day:s.day,
    time:time(),
    agent:(function () {
      const t = tileOf(s.x, s.y);
      return {
        x:Math.round(s.x), y:Math.round(s.y),
        tile:{c:t.c, r:t.r},
        facing:s.face || 'down',
        pose:currentPose(),
        room:s.away ? 'away' : s.room,
        away:!!s.away,
        action:actionLabel(s.action),
        thought:s.thought || ''
      };
    })(),
    needs:{energy:Math.round(s.e), hunger:Math.round(s.h), mood:Math.round(s.m), money:Math.round(s.money)},
    personality:{cognition:MIND.cognition, interests:MIND.interests.slice(), risk:MIND.risk},
    resident:{
      name:'林默',
      city:CITY,
      age:ageOf(),
      graduated:GRAD_YEAR,
      date:formatDate(s.day),
      cognition:cognitionNow(),
      ageStage:ageStage(),
      season:seasonOf().name,
      weekday:weekdayName(),
      holiday:(holidayOf() && holidayOf().name) || '',
      schedule:scheduleLabel()
    },
    employment:s.job ? 'remote designer' : 'job seeking',
    autonomy:'observer only; no player controls',
    recent_events:s.logs.slice(0, 3),
    decision:{
      action:s.decision ? s.decision.action : s.action,
      reason:s.decision ? s.decision.reason : '',
      scores:scores
    },
    memory:{
      recent:s.memory.slice(0, 6).map(m => m.text),
      yesterday:s.yesterday ? s.yesterday.text : null
    },
    emotions:(function () {
      const out = {};
      Object.keys(FEEL_NAME).forEach(function (k) { out[k] = Math.round((s.feel && s.feel[k]) || 0); });
      return out;
    })(),
    skills:(function () {
      const out = {};
      Object.keys(SKILL_META).forEach(function (id) {
        const sk = (s.skills && s.skills[id]) || {xp:0};
        out[id] = {level:skillLevelOf(sk.xp), xp:Math.round((sk.xp || 0) * 10) / 10};
      });
      return out;
    })(),
    focus:s.focus || 'guitar',
    lessons:(s.lessons || []).map(function (l) {
      return {id:l.id, text:l.text, strength:Math.round(l.strength || 0), followed:l.followed || 0};
    }),
    insights:(s.insights || []).map(function (i) { return i.text; }),
    diary:(s.diary || []).slice(0, 3).map(function (d) { return d.text; }),
    arc:(s.arc || []).slice(-4),
    finances:{
      cash:Math.round(s.money),
      debt:Math.round(s.debt || 0),
      netWorth:netWorth(),
      title:rankInfo().title,
      hourlyWage:hourlyWage(),
      monthIncome:Math.round(s.monthIn || 0),
      monthExpense:Math.round(s.monthOut || 0),
      gigToday:Math.round((s.today && s.today.gigPay) || 0),
      rentBehind:s.rentBehind || 0,
      owned:(s.owned || []).slice(),
      transactions:(s.ledger || []).slice(0, 6),
      bills:(s.billHistory || []).slice(0, 8),
      supplies:Math.round((s.supplies || 0) * 10) / 10,
      sickDays:s.sickDays || 0,
      sickName:s.sickName || ''
    },
    trajectory:{
      score:s.trajectory || 0,
      stage:stageOf(s.trajectory || 0),
      turning:s.turning || '',
      history:(s.track || []).slice(-12)
    },
    awake:s.action === 'sleep' ? '睡眠中' : fmtDur(s.awakeMin),
    plan:s.plan,
    weather:weatherOf(s.day).full,
    portfolio:{
      cash:Math.round(s.money),
      marketValue:Math.round(marketValue()),
      research:Math.round(s.research),
      studies:s.studies || 0,
      lastPnl:Math.round(s.lastPnl || 0),
      riskOffDays:s.riskOffDays || 0
    }
  });
}

export function withState(over, fn) {
  const backup = {};
  const keys = Object.keys(over || {});
  for (const k of keys) backup[k] = s[k];
  Object.assign(s, over || {});
  try { return fn(); }
  finally { for (const k of keys) s[k] = backup[k]; }
}

export function installDebug() {
  window.__debug = {
    key: KEY,
    get state() { return s; },
    score(over) { return withState(over || {}, rawScores); },
    preview(over) { return withState(over || {}, choose); },
    hireChance: hireChance,
    rollHire() { return rand() < hireChance(); },
    tradeGate: tradeGate,
    impulseChance: impulseChance,
    hourlyWage: hourlyWage,
    netWorth: netWorth,
    buy: buy,
    sell: sell,
    weatherOf: weatherOf,
    persist: persist,
    replace(snap) { applyIncoming(snap); },
    start(id) { startAction(id); ui(); draw(); },
    finish() { finishAndDecide(); ui(); draw(); },
    tile() {
      const t = tileOf(s.x, s.y);
      return {c:t.c, r:t.r, ch:cell(t.c, t.r), walk:walkable(t.c, t.r), face:s.face, pose:currentPose(), moving:!!s.moving};
    },
    walkable: walkable,
    pathTo(place) {
      const spot = SPOTS[place] || SPOTS.bed;
      const here = tileOf(s.x, s.y);
      return findPath(here.c, here.r, spot.c, spot.r);
    },
    audit: auditMap
  };
}
