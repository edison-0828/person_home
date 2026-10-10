import { MIND } from './constants.js';
import { log, memory } from './memory.js';
import { tx } from './money.js';
import { s } from './state.js';
import { cl, rand, randn } from './util.js';

export function positionValue(asset) {
  return (s.shares[asset] || 0) * (s.prices[asset] || 0);
}

export function marketValue() { return positionValue('btc') + positionValue('spy'); }

export function unrealized() {
  return (positionValue('btc') - (s.cost.btc || 0)) + (positionValue('spy') - (s.cost.spy || 0));
}

export function canPay(cost) {
  if (cost <= 0) return true;
  if (s.money >= cost) return true;
  return s.money + marketValue() >= cost + 1;
}

export function markMood() {
  const u = unrealized();
  const delta = u - (s.lastUnreal || 0);
  s.lastUnreal = u;
  if (Math.abs(delta) < 1.5) return 0;
  const basis = Math.max(80, (s.cost.btc || 0) + (s.cost.spy || 0));
  const pct = delta / basis;
  const calm = 1 - MIND.cognition / 230;
  s.m = cl(s.m + cl(pct * 80, -9, 9) * calm);
  s.today.pnl += delta;
  return delta;
}

export function sell(asset, frac, living) {
  frac = Math.max(0, Math.min(1, frac));
  const have = s.shares[asset] || 0;
  const price = s.prices[asset] || 0;
  const sh = have * frac;
  const value = sh * price;
  if (value < 1 || !(price > 0)) return 0;
  const cost = (s.cost[asset] || 0) * (have ? sh / have : 0);
  const realized = value - cost;
  s.shares[asset] = have - sh;
  s.cost[asset] = Math.max(0, (s.cost[asset] || 0) - cost);
  if (s.shares[asset] < 1e-6) { s.shares[asset] = 0; s.cost[asset] = 0; }
  s.money += value;
  s.lastPnl = Math.round(realized);
  s.today.pnl += realized;
  s.lastUnreal = unrealized();
  const name = asset === 'btc' ? 'BTC' : '标普';
  tx('income', name + (living ? '变现' : '减仓'), Math.round(value));
  const verb = realized >= 0 ? '盈利' : '亏损';
  const text = (living ? '为了生活费卖掉一部分' : '减掉一部分') + name + '，' + verb + ' ¥' + Math.abs(Math.round(realized)) + '。';
  log(text);
  memory(living ? 'sell_living' : 'market_pnl', text, {value:realized});
  const pct = cost > 0 ? realized / cost : 0;
  const calm = 1 - MIND.cognition / 230;
  s.m = cl(s.m + cl(pct * 70, -10, 10) * calm);
  if (realized < -20) s.riskOffDays = Math.max(s.riskOffDays || 0, 2);
  return value;
}

export function buy(asset, amount, note) {
  amount = Math.round(amount);
  const price = s.prices[asset] || 0;
  if (amount < 20 || s.money < amount || !(price > 0)) return false;
  s.money -= amount;
  s.shares[asset] = (s.shares[asset] || 0) + amount / price;
  s.cost[asset] = (s.cost[asset] || 0) + amount;
  s.lastUnreal = unrealized();
  s.lastPnl = 0;
  s.today.trades += 1;
  const name = asset === 'btc' ? 'BTC' : '标普';
  const text = note || ('研究之后买入少量' + name + '，金额 ¥' + amount + '。');
  log(text);
  memory('market_trade', text, {value:-amount});
  tx('expense', name + '建仓', -amount);
  return true;
}

export function ensureCash(need) {
  if (s.money >= need) return true;
  let guard = 0;
  while (s.money + 0.5 < need && guard++ < 4) {
    let best = null, bestV = 0;
    for (const a of ['btc', 'spy']) {
      const v = positionValue(a);
      if (v > bestV) { bestV = v; best = a; }
    }
    if (!best || bestV < 1) return false;
    sell(best, Math.min(1, (need - s.money + 2) / bestV), true);
  }
  return s.money >= need;
}

export function moveOf(vol) {
  const z = Math.max(-2.4, Math.min(2.4, randn()));
  return z * vol;
}

export function driftPrices(scale) {
  const btc = moveOf(0.032 * scale);
  const spy = moveOf(0.011 * scale);
  s.prices.btc = Math.max(5, (s.prices.btc || 100) * (1 + btc));
  s.prices.spy = Math.max(5, (s.prices.spy || 100) * (1 + spy));
  s.lastMove = {btc:btc, spy:spy};
  return s.lastMove;
}

export function researchNeed() { return 26 + (MIND.cognition - 70) * 0.45; }

export function tradeGate() {
  const floor = 320;
  const need = researchNeed();
  const researched = (s.studies || 0) >= 2 && s.research >= need;
  return {need:need, floor:floor, researched:researched, canBuy: researched && !(s.riskOffDays > 0) && s.money > floor + 80};
}

export function pickAsset() {
  const mv = s.lastMove || {btc:0, spy:0};
  const btcDip = -(mv.btc || 0);
  const spyDip = -(mv.spy || 0) + 0.012;
  if (spyDip > btcDip && rand() < 0.72) return 'spy';
  if (btcDip > spyDip && rand() < 0.58) return 'btc';
  return rand() < 0.48 ? 'btc' : 'spy';
}

export function lostToday() {
  return (s.memory || []).some(m => m && m.day === s.day && m.kind === 'market_pnl' && m.value < 0);
}
