import { domOf, isNewMonth, seasonOf } from './calendar.js';
import { holidayOf } from './holidays.js';
import { feelTo, mistake } from './emotions.js';
import { log, memory } from './memory.js';
import { owns, tx } from './money.js';
import { freshToday, s } from './state.js';
import { cl, rand, weatherOf } from './util.js';

export { domOf, isNewMonth };

export const RENT_AMOUNT = 2180;

export function freshUsage() {
  return {home:0, hot:0, ac:0, heat:0};
}

export function freshLifeNote() {
  return {day:0, haircut:0, clothes:0, regret:0, sick:0, rentTight:0, billWorry:0, utilities:0, supplies:0, phone:0, internet:0};
}

export function payMetro() {
  const fare = 4 + Math.round(rand() * 5);
  if ((s.money || 0) < fare + 8) return 0;
  s.money -= fare;
  tx('expense', '地铁', -fare);
  if (s.today) s.today.metro = (s.today.metro || 0) + 1;
  return fare;
}

export function noteUsage(mins) {
  if (!s.usage) s.usage = freshUsage();
  if (!(mins > 0)) return;
  if (s.action === 'gig' || s.away) return;
  s.usage.home += mins;
  const w = weatherOf(s.day).short;
  const sea = seasonOf().id;
  const h = (s.t || 0) / 60;
  const hotHour = h >= 11 && h <= 21;
  if (sea === 'summer' && hotHour) s.usage.ac += mins * (w === '晴热' ? 1 : (w === '晴朗' ? 0.7 : 0.4));
  else if (w === '晴热' && hotHour) s.usage.ac += mins * 0.45;
  if (sea === 'winter' && (h < 9 || h > 18)) s.usage.heat += mins * (w === '小雨' || w === '阴天' ? 0.7 : 0.35);
  if ((w === '阴天' || w === '小雨') && (s.action === 'wake' || s.action === 'relax' || s.action === 'workout')) {
    s.usage.hot += mins * 0.45;
  }
  if (s.action === 'workout') s.usage.hot += mins * 0.25;
}

function charge(label, amount, opts) {
  opts = opts || {};
  amount = Math.max(0, Math.round(amount));
  if (!amount) return {paid:0, short:0, skipped:true};
  if (!opts.obligatory && s.money < amount) return {paid:0, short:0, skipped:true};
  if (s.money >= amount) {
    s.money -= amount;
    tx('expense', label, -amount);
    s.money = Math.max(0, s.money);
    return {paid:amount, short:0, skipped:false};
  }
  const keep = opts.keep == null ? 8 : opts.keep;
  const paid = Math.max(0, Math.round(s.money - keep));
  if (paid > 0) {
    s.money -= paid;
    tx('expense', '只付了一部分' + label, -paid);
  }
  const short = amount - paid;
  s.debt = (s.debt || 0) + short;
  s.money = Math.max(0, s.money);
  return {paid:paid, short:short, skipped:false};
}

function repayDebt() {
  if ((s.debt || 0) <= 0) return;
  const pay = Math.min(s.debt, Math.max(0, Math.floor(s.money - 80)));
  if (pay <= 0) return;
  s.money -= pay;
  s.debt -= pay;
  tx('expense', '还欠款', -pay);
  if (s.debt <= 0) {
    s.debt = 0;
    s.rentBehind = 0;
    log('欠款还清了，肩膀轻了一点。');
  }
}

function worry(name) {
  if (!s.today) s.today = freshToday();
  s.today.billWorry = 1;
  feelTo('anxiety', 6);
  feelTo('hope', -3);
  s.m = cl(s.m - 2);
  log(name + '没付齐，差额记进了欠款。');
}

function utilityAmount(day) {
  const u = s.usage || freshUsage();
  const homeDays = (u.home || 0) / 1440;
  const acDays = (u.ac || 0) / 1440;
  const heatDays = (u.heat || 0) / 1440;
  const showers = (u.hot || 0) / 40;
  const sea = seasonOf(day).id;
  const seasonBase = sea === 'summer' ? 28 : (sea === 'winter' ? 14 : 6);
  const bill = 80 + seasonBase + homeDays * 6 + acDays * 26 + heatDays * 18 + showers * 4;
  return Math.round(Math.max(90, Math.min(520, bill)));
}

function settleHealth(day) {
  if (!s.today) s.today = freshToday();
  if ((s.sickDays || 0) > 0) {
    const name = s.sickName || '感冒';
    s.today.sick = 1;
    s.today.sickLabel = name;
    s.e = cl(s.e - 3);
    s.m = cl(s.m - 2);
    s.sickDays -= 1;
    if (s.sickDays <= 0) {
      s.sickDays = 0;
      s.sickName = '';
      s.today.recovered = 1;
      s.m = cl(s.m + 4);
      log(name + '好得差不多了。');
    }
    return;
  }
  const w = weatherOf(day).short;
  const tired = Math.min(s.e || 50, (s.today && s.today.lowE != null) ? s.today.lowE : (s.e || 50));
  const mood = Math.min(s.m || 50, (s.today && s.today.lowM != null) ? s.today.lowM : (s.m || 50));
  let p = 0.02;
  if (tired < 40) p += 0.04;
  if (mood < 45) p += 0.025;
  if (w === '阴天' || w === '小雨') p += 0.034;
  if (tired < 24) p += 0.028;
  if (p > 0.16) p = 0.16;
  if (rand() >= p) return;
  const roll = rand();
  const name = roll < 0.62 ? '感冒' : (roll < 0.84 ? '发烧' : '肠胃不舒服');
  const days = 2 + Math.floor(rand() * 3);
  const cost = 120 + Math.round(rand() * 180);
  s.sickDays = days;
  s.sickName = name;
  s.today.sick = 1;
  s.today.sickOnset = 1;
  s.today.sickLabel = name;
  s.e = cl((s.e || 50) - (14 + Math.round(rand() * 10)));
  s.m = cl((s.m || 50) - (6 + Math.round(rand() * 5)));
  feelTo('hope', -4);
  feelTo('anxiety', 6);
  const bill = charge('看病', cost, {obligatory:true, keep:20});
  payMetro();
  if (bill.short > 0) {
    s.today.billWorry = 1;
    feelTo('anxiety', 4);
  }
  const text = '他' + name + '了，去看了一趟，花了 ¥' + cost + '。这几天先养着。';
  log(text);
  memory('sick', '第' + day + '天' + name + '，看病 ¥' + cost + '。');
}

function settleSupplies(day) {
  if (!s.today) s.today = freshToday();
  if (!isFinite(s.supplies)) s.supplies = 12;
  if ((s.supplyWait || 0) > 0) {
    s.supplyWait -= 1;
    s.supplies = Math.max(0, s.supplies - 0.35);
    return;
  }
  s.supplies = Math.max(0, s.supplies - (0.75 + rand() * 0.35));
  if (s.supplies > 1.6) return;
  const cost = 46 + Math.round(rand() * 32);
  if (s.money < cost) {
    s.supplyWait = 2;
    s.today.billWorry = 1;
    s.m = cl(s.m - 3);
    feelTo('anxiety', 5);
    log('牙膏和洗衣液见底了，口袋里却凑不齐。');
    memory('supplies', '第' + day + '天日用品用完了，暂时没钱补。');
    return;
  }
  const bill = charge('日用品', cost, {obligatory:false});
  if (bill.skipped || !bill.paid) return;
  s.supplies = 10 + Math.round(rand() * 4);
  s.today.supplyBuy = 1;
  log('补了日用品，花了 ¥' + bill.paid + '。牙膏和洗衣液又能撑一阵。');
  payMetro();
}

function settleHair(day) {
  if (!s.today) s.today = freshToday();
  if (!isFinite(s.nextHairDay) || s.nextHairDay < 1) s.nextHairDay = day + 23;
  if (day < s.nextHairDay) return;
  const cost = 58 + Math.round(rand() * 30);
  if (s.money < cost) {
    s.nextHairDay = day + 4;
    s.today.billWorry = 1;
    log('头发该剪了，口袋里却不够。');
    return;
  }
  const bill = charge('剪头发', cost, {obligatory:false});
  if (bill.skipped || !bill.paid) return;
  s.nextHairDay = day + 21 + Math.floor(rand() * 15);
  s.today.haircut = 1;
  s.m = cl(s.m + 5);
  feelTo('pride', 4);
  feelTo('joy', 3);
  log('去楼下剪了头发，花了 ¥' + bill.paid + '。镜子里清爽了一点。');
  payMetro();
  memory('haircut', '第' + day + '天剪了头发。');
}

function weatherShift(day) {
  const now = weatherOf(day).short;
  const prev = s.weatherSeen || '';
  if (!prev || prev === now) return false;
  return prev === '晴热' || now === '晴热' || prev === '小雨' || now === '小雨' || prev === '阴天' || now === '阴天';
}

function postponeClothes(day) {
  const gap = day - (s.lastClothesDay || 1);
  s.clothesGap = gap + 4;
}

function settleClothes(day) {
  if (!s.today) s.today = freshToday();
  if (!isFinite(s.lastClothesDay)) s.lastClothesDay = 1;
  if (!isFinite(s.clothesGap) || s.clothesGap < 8) s.clothesGap = 19;
  const gap = day - s.lastClothesDay;
  const sea = seasonOf(day).id;
  const prevSea = day > 1 ? seasonOf(day - 1).id : sea;
  let need = s.clothesGap;
  if (sea === 'winter') need = Math.max(8, need - 7);
  else if (sea === 'summer') need += 4;
  const scheduled = gap >= need;
  const turned = prevSea !== sea && gap >= 8;
  const shifted = weatherShift(day) && gap >= 9;
  const want = gap >= 12 && (s.m || 50) > 62 && rand() < 0.35;
  const low = gap >= 10 && (s.m || 50) < 38 && rand() < 0.28;
  if (!scheduled && !shifted && !want && !low && !turned) return;
  const impulse = low && !scheduled;
  const cost = impulse ? (168 + Math.round(rand() * 160)) : (96 + Math.round(rand() * 140));
  if (s.money < cost) {
    postponeClothes(day);
    return;
  }
  const bill = charge('衣服', cost, {obligatory:false});
  if (bill.skipped || !bill.paid) {
    postponeClothes(day);
    return;
  }
  s.lastClothesDay = day;
  s.clothesGap = 18 + Math.floor(rand() * 9);
  s.today.clothes = 1;
  if (impulse) {
    s.today.clothesRegret = 1;
    s.m = cl(s.m + 3);
    mistake('impulsebuy', '第' + day + '天心情不好，还是买了衣服，花了 ¥' + bill.paid + '，事后有点后悔。');
  } else {
    s.m = cl(s.m + 6);
    feelTo('joy', 6);
    feelTo('pride', 3);
    log('在深圳添了件衣服，花了 ¥' + bill.paid + '。人看着齐整一点。');
  }
  payMetro();
}

function settleFixed(day) {
  if (!s.today) s.today = freshToday();
  const dom = domOf(day);
  let paidBill = false;
  let shortfall = false;
  if (dom === 1) {
    const bill = charge('房租', RENT_AMOUNT, {obligatory:true, keep:12});
    s.today.rentHit = 1;
    paidBill = true;
    if (bill.short > 0) {
      shortfall = true;
      s.rentBehind = (s.rentBehind || 0) + 1;
      feelTo('anxiety', 12);
      feelTo('hope', -6);
      s.m = cl(s.m - 5);
      s.today.billWorry = 1;
      mistake('rent', '第' + day + '天房租没付齐，又欠下 ¥' + bill.short + '。');
    } else if (s.money < 2600) {
      s.today.rentTight = 1;
      log('深圳这间合租的房租付完，剩下的钱一下子少了很多。');
      memory('rent', '第' + day + '天付了房租 ¥' + RENT_AMOUNT + '，口袋空了一截。');
    } else log('付了深圳合租的房租 ¥' + RENT_AMOUNT + '。');
  }
  if (dom === 8) {
    const bill = charge('网费', 129, {obligatory:true, keep:20});
    s.today.internet = 1;
    paidBill = true;
    if (bill.short > 0) { shortfall = true; worry('网费'); }
    else log('深圳宽带 ¥129 扣掉了。');
  }
  if (dom === 16) {
    let amount = 69 + Math.round((rand() - 0.5) * 16);
    if (owns('phone')) amount += 18 + Math.round(rand() * 12);
    const bill = charge('电话费', amount, {obligatory:true, keep:8});
    s.today.phone = 1;
    paidBill = true;
    if (bill.short > 0) { shortfall = true; worry('电话费'); }
    else log('电话费 ¥' + amount + ' 扣掉了。');
  }
  if (dom === 21) {
    let subs = 0;
    if (owns('computer')) subs += 68;
    if (owns('gym')) subs += 199;
    if (subs > 0) {
      const bill = charge('订阅和会员', subs, {obligatory:true, keep:8});
      paidBill = true;
      if (bill.short > 0) { shortfall = true; worry('订阅'); }
      else log('订阅和会员扣了 ¥' + subs + '。');
    }
  }
  if (dom === 28) {
    const amount = utilityAmount(day);
    const bill = charge('水电费', amount, {obligatory:true, keep:8});
    s.today.utilities = 1;
    paidBill = true;
    s.usage = freshUsage();
    if (bill.short > 0) { shortfall = true; worry('水电费'); }
    else log('水电费 ¥' + amount + '。在家待得越久，这张单越厚。');
  }
  if (paidBill && !shortfall) repayDebt();
}

export function settleLiving(day) {
  if (!s.today) s.today = freshToday();
  if (!s.usage) s.usage = freshUsage();
  settleHealth(day);
  settleSupplies(day);
  settleHair(day);
  settleClothes(day);
  settleFixed(day);
  s.weatherSeen = weatherOf(day).short;
  s.lifeNote = {
    day:day,
    haircut:s.today.haircut || 0,
    clothes:s.today.clothes || 0,
    regret:s.today.clothesRegret || 0,
    sick:s.today.sick || 0,
    rentTight:s.today.rentTight || 0,
    billWorry:s.today.billWorry || 0,
    utilities:s.today.utilities || 0,
    supplies:s.today.supplyBuy || 0,
    phone:s.today.phone || 0,
    internet:s.today.internet || 0
  };
  s.money = Math.max(0, s.money);
}

export function settleFestival() {
  const hol = holidayOf();
  if (!hol || hol.id !== 'cny' || (hol.phase !== 'eve' && hol.phase !== 'day1')) return;
  if ((s.redYear || 0) === hol.year) return;
  if (!s.today) s.today = freshToday();
  const gift = 380 + (hol.year % 6) * 40;
  s.money += gift;
  tx('income', '红包', gift);
  s.redYear = hol.year;
  s.today.redPacket = gift;
  feelTo('joy', 8);
  feelTo('hope', 5);
  log('家里的红包到了，¥' + gift + '。');
  memory('redenvelope', '春节红包 ¥' + gift + '。', {value:gift});
  const spend = 150 + (hol.year % 5) * 18;
  if (s.money > spend + 200) {
    s.money -= spend;
    tx('expense', '年货', -spend);
    s.today.festivalSpend = spend;
    s.m = cl(s.m + 2);
    log('置办年货花了 ¥' + spend + '。');
  }
}
