import { TILE } from './constants.js';
import { memory, trace } from './memory.js';

export function freshToday() {
  return {meals:0, workout:0, market:0, workMin:0, search:0, rejects:0, pnl:0, spent:0, earned:0, walk:0, relax:0, trades:0, practice:0, gigs:0, gigPay:0, shop:0, junkMeals:0, itch:0, moneyNoted:0, mistakeIds:[], comfort:0, rainNoted:0, breakthrough:0};
}

export function blank() {
  return {
    day:1, t:462, e:72, h:28, m:64, money:1840,
    job:false, searches:0, workFromDay:9999, studies:0,
    action:'', left:40, acted:0,
    x:(3 + 0.5) * TILE, y:(3 + 0.5) * TILE, face:'up', faceGoal:'up', path:[], moving:false, anim:0, map:'topdown', room:'bedroom',
    logs:[], memory:[], trace:[],
    awakeMin:8, sinceEatMin:240,
    meals:{breakfast:false, lunch:false, dinner:false},
    today:freshToday(), yesterday:null,
    streak:{workout:0},
    research:0, riskOffDays:0, restLock:false,
    shares:{btc:0, spy:0}, cost:{btc:0, spy:0},
    prices:{btc:100, spy:100}, lastMove:{btc:0, spy:0},
    lastUnreal:0, lastPnl:0,
    prepped:false, preppedAt:0,
    chain:1, whim:'market', block:null,
    plan:'找工作', thought:'', mind:'',
    feel:{joy:46, anxiety:28, loneliness:52, pride:24, regret:8, hope:44, nostalgia:12},
    skills:{cooking:{xp:8, level:0, plateau:0}, guitar:{xp:4, level:0, plateau:0}, drawing:{xp:3, level:0, plateau:0}, trading:{xp:6, level:0, plateau:0}},
    values:{health:1, craft:1, calm:1, money:1},
    focus:'guitar', lessons:[], diary:[], insights:[], mistakes:[], arc:[],
    debt:0, rentBehind:0, career:'', raise:0, performance:42, daysInRank:0, absent:0, hopCooldown:0,
    owned:[], ledger:[], monthIn:0, monthOut:0, monthDay:1,
    trajectory:6, track:[], turning:'', recovery:0, complacent:0, wakeupDay:0, softDay:0, away:false,
    decision:{action:'wake', reason:'', scores:{}},
    session:{hunger:0, energy:0, mood:0, cost:0, wage:0},
    hungerAtStart:28,
    seed: (Date.now() ^ 0x9e3779b9) >>> 0,
    savedAt:0
  };
}

export const s = blank();
export const flags = { quiet: false, deciding: false };
