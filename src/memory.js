import { lostToday } from './market.js';
import { flags, s } from './state.js';
import { $, time } from './util.js';

export function log(v) {
  s.logs.unshift({t:time(), v:v});
  if (s.logs.length > 6) s.logs.length = 6;
  if (!flags.quiet) renderLog();
}

export function renderLog() {
  const el = $('log');
  if (!el) return;
  el.innerHTML = s.logs.map(z => '<div class="log-item"><time>' + z.t + '</time>' + z.v + '</div>').join('');
}

export function memory(kind, text, extra) {
  const item = {day:s.day, time:time(), kind:kind, text:text};
  if (extra && typeof extra.value === 'number' && isFinite(extra.value)) item.value = Math.round(extra.value * 100) / 100;
  s.memory.unshift(item);
  if (s.memory.length > 24) s.memory.length = 24;
}

export function trace(id) {
  s.trace.push({day:s.day, t:time(), id:id});
  if (s.trace.length > 160) s.trace.splice(0, s.trace.length - 160);
}

export function memoryNudge(id) {
  const y = s.yesterday;
  if (y) {
    if (id === 'workout' && !y.workout) return {v:14, label:'昨天没练，今天想补上'};
    if (id === 'workout' && y.workout) return {v:5, label:'训练正在变成习惯'};
    if ((id === 'breakfast' || id === 'lunch' || id === 'eat') && y.skippedMeal) return {v:12, label:'昨天没吃好，今天先吃饭'};
    if (id === 'search' && y.rejections >= 2) return {v:-8, label:'昨天连着被拒，有点泄气'};
    if (id === 'market' && y.pnl < -25) return {v:-6, label:'昨天亏了，今天更谨慎'};
    if (id === 'work' && y.worked) return {v:4, label:'沿用昨天的工作节奏'};
  }
  if (id === 'market' && lostToday()) return {v:-8, label:'今天已经亏过，先消化一下'};
  return null;
}
