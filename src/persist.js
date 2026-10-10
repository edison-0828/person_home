import { KEY, SIM_MIN_PER_SEC, SKILL_META, TILE } from './constants.js';
import { getAction } from './actions/define.js';
import { freshFeel, freshValues } from './emotions.js';
import { tick } from './loop.js';
import { SPOTS, roomAt, walkableAt } from './map.js';
import { log, memory, renderLog } from './memory.js';
import { freshSkills, skillLevelOf } from './skills.js';
import { freshLifeNote, freshUsage } from './expenses.js';
import { blank, flags, freshToday, s } from './state.js';
import { cl } from './util.js';
import './actions/catalog.js';

export function persist() {
  if (window.__SUSPEND_SAVE__) return;
  try {
    const savedAt = Date.now();
    s.savedAt = savedAt;
    const state = JSON.parse(JSON.stringify(s));
    localStorage.setItem(KEY, JSON.stringify({v:1, savedAt:savedAt, state:state}));
  } catch (err) {}
}

export function applyIncoming(incoming) {
  const base = blank();
  if (incoming && typeof incoming === 'object') {
    for (const k of Object.keys(base)) {
      if (incoming[k] !== undefined) base[k] = incoming[k];
    }
  }
  for (const k of Object.keys(s)) delete s[k];
  Object.assign(s, base);
  s.meals = Object.assign({breakfast:false, lunch:false, dinner:false}, incoming && incoming.meals || {});
  s.today = Object.assign(freshToday(), incoming && incoming.today || {});
  s.shares = Object.assign({btc:0, spy:0}, incoming && incoming.shares || {});
  s.cost = Object.assign({btc:0, spy:0}, incoming && incoming.cost || {});
  s.prices = Object.assign({btc:100, spy:100}, incoming && incoming.prices || {});
  s.streak = Object.assign({workout:0}, incoming && incoming.streak || {});
  s.session = Object.assign({hunger:0, energy:0, mood:0, cost:0, wage:0}, incoming && incoming.session || {});
  s.lastMove = Object.assign({btc:0, spy:0}, incoming && incoming.lastMove || {});
  s.logs = Array.isArray(incoming && incoming.logs) ? incoming.logs : [];
  s.memory = Array.isArray(incoming && incoming.memory) ? incoming.memory : [];
  s.trace = Array.isArray(incoming && incoming.trace) ? incoming.trace : [];
  s.feel = Object.assign(freshFeel(), incoming && incoming.feel || {});
  s.skills = freshSkills();
  const incomingSkills = (incoming && incoming.skills) || {};
  Object.keys(s.skills).forEach(function (id) {
    if (incomingSkills[id]) Object.assign(s.skills[id], incomingSkills[id]);
    s.skills[id].xp = Math.max(0, Number(s.skills[id].xp) || 0);
    s.skills[id].level = skillLevelOf(s.skills[id].xp);
    s.skills[id].plateau = s.skills[id].plateau || 0;
  });
  s.values = Object.assign(freshValues(), incoming && incoming.values || {});
  s.lessons = Array.isArray(incoming && incoming.lessons) ? incoming.lessons : [];
  s.diary = Array.isArray(incoming && incoming.diary) ? incoming.diary : [];
  s.owned = Array.isArray(incoming && incoming.owned) ? incoming.owned.slice() : [];
  s.ledger = Array.isArray(incoming && incoming.ledger) ? incoming.ledger : [];
  s.billHistory = Array.isArray(incoming && incoming.billHistory) ? incoming.billHistory : [];
  s.track = Array.isArray(incoming && incoming.track) ? incoming.track : [];
  s.usage = Object.assign(freshUsage(), (incoming && incoming.usage) || {});
  s.lifeNote = Object.assign(freshLifeNote(), (incoming && incoming.lifeNote) || {});
  if (!isFinite(s.supplies)) s.supplies = 12;
  if (!isFinite(s.nextHairDay) || s.nextHairDay < 1) s.nextHairDay = (s.day || 1) + 23;
  if (!isFinite(s.lastClothesDay)) s.lastClothesDay = s.day || 1;
  if (!isFinite(s.clothesGap) || s.clothesGap < 8) s.clothesGap = 19;
  if (!isFinite(s.supplyWait)) s.supplyWait = 0;
  if (!isFinite(s.sickDays) || s.sickDays < 0) s.sickDays = 0;
  if (typeof s.sickName !== 'string') s.sickName = '';
  if (typeof s.weatherSeen !== 'string') s.weatherSeen = '';
  if (!isFinite(s.debt)) s.debt = 0;
  if (!isFinite(s.trajectory)) s.trajectory = 6;
  if (!isFinite(s.performance)) s.performance = 42;
  if (!isFinite(s.monthIn)) s.monthIn = 0;
  if (!isFinite(s.monthOut)) s.monthOut = 0;
  if (s.action !== 'gig') s.away = false;
  s.insights = Array.isArray(incoming && incoming.insights) ? incoming.insights : [];
  s.mistakes = Array.isArray(incoming && incoming.mistakes) ? incoming.mistakes : [];
  s.arc = Array.isArray(incoming && incoming.arc) ? incoming.arc : [];
  if (!SKILL_META[s.focus]) s.focus = 'guitar';
  s.decision = incoming && incoming.decision ? incoming.decision : {action:s.action || 'wake', reason:'', scores:{}};
  if (!isFinite(s.money)) s.money = 0;
  if (!isFinite(s.e)) s.e = 50;
  if (!isFinite(s.h)) s.h = 40;
  if (!isFinite(s.m)) s.m = 50;
  s.e = cl(s.e); s.h = cl(s.h); s.m = cl(s.m);
  if (!isFinite(s.t) || s.t < 0) s.t = 462;
  let spins = 0;
  while (s.t >= 1440 && spins++ < 3) { s.t -= 1440; s.day += 1; }
  if (!s.seed) s.seed = (Date.now() ^ 0x51f00d) >>> 0;
  if (!s.today) s.today = freshToday();
  if (!s.face) s.face = 'down';
  if (!s.faceGoal) s.faceGoal = s.face;
  if (!Array.isArray(s.path)) s.path = [];
  s.path = s.path.filter(function (node) {
    return Array.isArray(node) && isFinite(node[0]) && isFinite(node[1]);
  });
  if (!isFinite(s.anim)) s.anim = 0;
  const legacy = !(incoming && incoming.map === 'topdown');
  const keepPlace = !legacy && walkableAt(s.x, s.y);
  if (!keepPlace) {
    const place = ((getAction(s.action) && getAction(s.action).place)) || 'bed';
    const spot = SPOTS[place] || SPOTS.bed;
    s.x = (spot.c + 0.5) * TILE;
    s.y = (spot.r + 0.5) * TILE;
    s.face = spot.face;
    s.faceGoal = spot.face;
    s.path = [];
    s.moving = false;
  } else if (!Array.isArray(s.path)) s.path = [];
  s.map = 'topdown';
  const rm = roomAt(s.x, s.y);
  if (rm) s.room = rm;
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data || data.v !== 1 || !data.state) return false;
    const savedAt = data.savedAt || Date.now();
    applyIncoming(data.state);
    const elapsed = Math.max(0, Date.now() - savedAt);
    const simMin = Math.min(elapsed / 1000 * SIM_MIN_PER_SEC, 36 * 60);
    if (elapsed >= 12000 && simMin >= 1) {
      flags.quiet = true;
      const steps = Math.round(simMin / 0.2);
      for (let i = 0; i < steps; i++) tick(0.8);
      flags.quiet = false;
      renderLog();
      if (simMin >= 20) {
        const hours = Math.max(1, Math.round(simMin / 60));
        memory('catchup', '有一段时间没被看到。按他自己的节奏，大约过了 ' + hours + ' 小时。');
        log('你离开后，他又过了约 ' + hours + ' 小时。');
      }
    }
    persist();
    return true;
  } catch (err) {
    return false;
  }
}
