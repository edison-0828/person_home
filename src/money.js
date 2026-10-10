import { MIND } from './constants.js';
import { feelTo, freshValues, mistake } from './emotions.js';
import { marketValue } from './market.js';
import { log, memory } from './memory.js';
import { skillRank } from './skills.js';
import { s } from './state.js';
import { $, cl, rand, time } from './util.js';

export function hireChance() {
  const n = s.searches || 0;
  const skill = Math.min(Math.max(n, 1), 8) * 0.03;
  const cog = (MIND.cognition - 72) * 0.0024;
  const cond = (s.e >= 42 ? 0.02 : -0.035) + (s.m >= 48 ? 0.015 : -0.02);
  const fatigue = s.today && s.today.search >= 3 ? -0.05 : 0;
  return cl(0.04 + skill + cog + cond + fatigue, 0.015, 0.36);
}

export const RENT = 22;

export const SHOP = {
  phone:{id:'phone', name:'新手机', cost:720, need:1100, impulse:false},
  computer:{id:'computer', name:'新电脑', cost:2600, need:3400, impulse:false},
  sofa:{id:'sofa', name:'更软的沙发', cost:1500, need:2100, impulse:false},
  gym:{id:'gym', name:'更好的器械', cost:1280, need:1900, impulse:false},
  guitar:{id:'guitar', name:'一把新吉他', cost:960, need:1500, impulse:false},
  junk:{id:'junk', name:'一时看上的小东西', cost:280, need:900, impulse:true}
};

export const RANK = {
  junior:{title:'初级远程设计师', wage:46},
  designer:{title:'远程设计师', wage:64},
  senior:{title:'资深远程设计师', wage:86},
  lead:{title:'设计主管', wage:112}
};

export function owns(id) { return (s.owned || []).indexOf(id) >= 0; }

export function rankInfo() {
  if (!s.job) return {id:'none', title:'在找工作', wage:0};
  const id = (s.career && RANK[s.career]) ? s.career : 'designer';
  return {id:id, title:RANK[id].title, wage:RANK[id].wage};
}

export function hourlyWage() {
  const info = rankInfo();
  if (!info.wage) return 0;
  let w = info.wage + (s.raise || 0);
  if (owns('computer')) w += 10;
  w += Math.round(((s.e || 50) - 50) * 0.12 + ((s.m || 50) - 50) * 0.05);
  return Math.max(28, w);
}

export function netWorth() {
  return Math.round((s.money || 0) + marketValue() - (s.debt || 0));
}

export function moneyPressure() {
  let n = s.job ? 0 : 5;
  if (s.money < 80) n += 30;
  else if (s.money < 220) n += 20;
  else if (s.money < 480) n += 12;
  if ((s.debt || 0) > 0) n += 12;
  if ((s.rentBehind || 0) > 0) n += 6;
  return n;
}

export function stageOf(score) {
  if (score >= 58) return '从容';
  if (score >= 30) return '上坡';
  if (score >= 10) return '稳住';
  if (score >= -8) return '摇摆';
  if (score >= -30) return '下滑';
  if (score >= -52) return '下沉';
  return '谷底';
}

export function tx(kind, label, amount) {
  amount = Math.round(amount);
  if (!amount) return;
  if (!s.ledger) s.ledger = [];
  s.ledger.unshift({day:s.day, time:time(), kind:kind, label:label, amount:amount});
  if (s.ledger.length > 20) s.ledger.length = 20;
  if (amount > 0) s.monthIn = (s.monthIn || 0) + amount;
  else s.monthOut = (s.monthOut || 0) + (-amount);
}

export function nextPurchase() {
  if (s.today && s.today.itch && !owns('junk') && s.money >= SHOP.junk.need) return SHOP.junk;
  const order = s.job
    ? ['computer', 'gym', 'guitar', 'sofa', 'phone']
    : ['phone', 'guitar', 'gym', 'sofa', 'computer'];
  for (let i = 0; i < order.length; i++) {
    const item = SHOP[order[i]];
    if (!owns(item.id) && s.money >= item.need) return item;
  }
  return null;
}

export function pickGig() {
  const energy = s.e || 50;
  if (energy > 68 && rand() < 0.55) return {id:'boxes', name:'搬箱子', pay:Math.round(54 + rand() * 22), tired:16};
  if (energy < 40 || rand() < 0.42) return {id:'flyers', name:'发传单', pay:Math.round(32 + rand() * 14), tired:8};
  return {id:'delivery', name:'送外卖', pay:Math.round(42 + rand() * 18), tired:12};
}

export function dailyDue() {
  let subs = 0;
  if (owns('phone')) subs += 4;
  if (owns('computer')) subs += 6;
  if (owns('gym')) subs += 3;
  return {rent:RENT, subs:subs, total:RENT + subs};
}

export function promoteOrRaise(hop) {
  const order = ['junior', 'designer', 'senior', 'lead'];
  const cur = (s.career && RANK[s.career]) ? s.career : 'junior';
  const i = order.indexOf(cur);
  if (i < order.length - 1 && (!hop || rand() < 0.7)) {
    s.career = order[i + 1];
    s.daysInRank = 0;
    s.job = true;
    const text = (hop ? '他跳去了更好的位置，现在是' : '他升到了') + rankInfo().title + '，时薪大约 ¥' + hourlyWage() + '。';
    log(text);
    memory('career', text);
    feelTo('pride', 12);
    feelTo('joy', 8);
    feelTo('hope', 6);
  } else {
    s.raise = (s.raise || 0) + (hop ? 8 : 5);
    s.job = true;
    const text = '时薪涨了，现在大约 ¥' + hourlyWage() + '。';
    log(text);
    memory('career', text);
    feelTo('pride', 8);
  }
}

export function fireHim() {
  const title = rankInfo().title;
  s.job = false;
  s.career = '';
  s.workFromDay = 9999;
  s.absent = 0;
  s.daysInRank = 0;
  feelTo('anxiety', 16);
  feelTo('hope', -12);
  feelTo('pride', -10);
  s.m = cl(s.m - 8);
  const text = title + '的位子没了。连续没好好干活，对方停了合作。';
  log(text);
  memory('fired', text);
}

export function settleBills(day) {
  const due = dailyDue();
  if (s.money >= due.total) {
    s.money -= due.rent;
    tx('expense', '房租', -due.rent);
    if (due.subs > 0) {
      s.money -= due.subs;
      tx('expense', '订阅和会员', -due.subs);
    }
    if ((s.debt || 0) > 0) {
      const pay = Math.min(s.debt, Math.max(0, Math.floor(s.money - 80)));
      if (pay > 0) {
        s.money -= pay;
        s.debt -= pay;
        tx('expense', '还欠款', -pay);
        if (s.debt <= 0) {
          s.debt = 0;
          s.rentBehind = 0;
          log('欠款还清了，肩膀轻了一点。');
        }
      }
    }
  } else {
    const paid = Math.max(0, Math.round(s.money - 12));
    if (paid > 0) {
      s.money -= paid;
      tx('expense', '只付了一部分房租', -paid);
    }
    const short = due.total - paid;
    s.debt = (s.debt || 0) + short;
    s.rentBehind = (s.rentBehind || 0) + 1;
    feelTo('anxiety', 12);
    feelTo('hope', -6);
    s.m = cl(s.m - 5);
    mistake('rent', '第' + day + '天房租没付齐，又欠下 ¥' + short + '。');
  }
  s.money = Math.max(0, s.money);
}

export function careerDay(td) {
  if ((s.hopCooldown || 0) > 0) s.hopCooldown -= 1;
  if (!s.job || s.day < (s.workFromDay || 0)) return;
  s.daysInRank = (s.daysInRank || 0) + 1;
  if ((td.workMin || 0) >= 40) {
    s.performance = cl((s.performance || 40) + 7, 0, 100);
    s.absent = 0;
  } else if ((td.workMin || 0) < 15) {
    s.performance = cl((s.performance || 40) - 8, 0, 100);
    s.absent = (s.absent || 0) + 1;
  }
  if ((s.absent || 0) >= 3 && (s.performance || 0) < 34 && rand() < 0.62) {
    fireHim();
    return;
  }
  if ((s.performance || 0) >= 74 && (s.daysInRank || 0) >= 4 && rand() < 0.42) promoteOrRaise(false);
  else if ((s.daysInRank || 0) >= 6 && (s.performance || 0) >= 55 && rand() < 0.28) {
    s.raise = (s.raise || 0) + 4;
    log('干得稳，时薪悄悄涨到 ¥' + hourlyWage() + '。');
    feelTo('pride', 6);
  }
}

export function shiftTrajectory(day, td) {
  let d = 0;
  if (td.workout) d += 2.4;
  if ((td.meals || 0) >= 2 && !td.junkMeals) d += 1.2;
  if (td.junkMeals) d -= 2.2;
  if ((td.workMin || 0) >= 40) d += 2;
  if (s.job && s.day >= (s.workFromDay || 0) && (td.workMin || 0) < 15) d -= 2.6;
  if ((td.gigs || 0) > 0) d += 1.2;
  if (td.practice) d += 1.1;
  let skillSum = 0;
  ['cooking', 'guitar', 'drawing', 'trading'].forEach(function (id) { skillSum += skillRank(id); });
  d += Math.min(2, skillSum * 0.22);
  if ((s.debt || 0) > 160) d -= 5.5;
  else if ((s.debt || 0) > 0) d -= 2.8;
  if ((td.pnl || 0) <= -25) d -= 2.4;
  const todays = (s.mistakes || []).filter(function (m) { return m && m.day === day; });
  todays.forEach(function (m) {
    if (m.id === 'impulse') d -= 3.2;
    else if (m.id === 'late' || m.id === 'impulsebuy' || m.id === 'spend' || m.id === 'rent') d -= 1.6;
  });
  if ((td.relax || 0) >= 3 && !td.workout && (td.workMin || 0) < 20 && !(td.gigs > 0)) d -= 2.2;
  if (s.money > 1200 && !(s.debt > 0)) d += 0.8;
  if ((s.lessons || []).some(function (l) { return l && l.followDay === day; })) d += 1;
  if ((s.recovery || 0) > 0) d += 1.6;
  if ((s.complacent || 0) > 0) d -= 1.2;
  s.trajectory = Math.max(-100, Math.min(100, Math.round(((s.trajectory || 0) + d) * 10) / 10));
  if (!s.track) s.track = [];
  s.track.push({day:day, score:s.trajectory});
  if (s.track.length > 48) s.track.splice(0, s.track.length - 48);
  if (s.recovery > 0) s.recovery -= 1;
  if (s.complacent > 0) s.complacent -= 1;
  if (s.trajectory <= -42 && !s.wakeupDay) {
    s.wakeupDay = day;
    s.turning = 'wakeup';
    s.recovery = 5;
    feelTo('hope', 14);
    feelTo('anxiety', 4);
    if (!s.values) s.values = freshValues();
    s.values.health = cl(s.values.health + 0.18, 0.65, 1.75);
    s.values.calm = cl(s.values.calm + 0.12, 0.65, 1.75);
    log('他碰到谷底，忽然想把日子拉回来。');
    memory('turning', '谷底之后，他想重新把日子过清楚。');
  } else if (s.trajectory >= 55 && s.money > 2500 && !s.softDay && !(s.recovery > 0)) {
    s.softDay = day;
    s.turning = 'soft';
    s.complacent = 4;
    feelTo('pride', 8);
    log('日子顺了，他开始有点松手。');
    memory('turning', '顺起来之后，警惕也松了一点。');
  }
}

export function moneyMood() {
  if (!s.today || s.today.moneyNoted) return;
  if (s.money < 220 || (s.debt || 0) > 0) {
    s.today.moneyNoted = 1;
    feelTo('anxiety', s.money < 80 || (s.debt || 0) > 0 ? 12 : 7);
    feelTo('hope', -4);
    s.m = cl(s.m - 2);
  }
}

export function drawTrackChart() {
  const cv = $('track');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const w = cv.width, h = cv.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#fff6e6';
  ctx.fillRect(0, 0, w, h);
  const hist = (s.track && s.track.length) ? s.track : [{day:s.day, score:s.trajectory || 0}];
  let min = -20, max = 20;
  hist.forEach(function (pt) {
    if (pt.score < min) min = pt.score;
    if (pt.score > max) max = pt.score;
  });
  min -= 4; max += 4;
  const span = Math.max(8, max - min);
  function yOf(v) { return 12 + (h - 24) * (1 - (v - min) / span); }
  ctx.strokeStyle = '#e2c49a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(16, yOf(0));
  ctx.lineTo(w - 10, yOf(0));
  ctx.stroke();
  ctx.beginPath();
  hist.forEach(function (pt, i) {
    const x = hist.length === 1 ? w / 2 : 16 + (w - 28) * (i / (hist.length - 1));
    const y = yOf(pt.score);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  const last = hist[hist.length - 1].score;
  ctx.strokeStyle = last >= 10 ? '#6d8f4e' : (last < -8 ? '#d46a45' : '#c47a45');
  ctx.lineWidth = 2;
  ctx.stroke();
  const lx = hist.length === 1 ? w / 2 : w - 12;
  ctx.fillStyle = ctx.strokeStyle;
  ctx.beginPath();
  ctx.arc(lx, yOf(last), 3.5, 0, Math.PI * 2);
  ctx.fill();
}
