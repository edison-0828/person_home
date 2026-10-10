import { seasonOf } from './calendar.js';
import { WEATHERS } from './constants.js';
import { s } from './state.js';

export function cl(n, a, b) {
  if (a === undefined) a = 0;
  if (b === undefined) b = 100;
  if (!isFinite(n)) n = a;
  return Math.max(a, Math.min(b, n));
}

export function $(id) { return document.getElementById(id); }

export function rand() {
  s.seed = (s.seed + 0x6D2B79F5) | 0;
  let t = Math.imul(s.seed ^ (s.seed >>> 15), 1 | s.seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function randn() {
  const u = Math.max(1e-9, rand());
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function clockMin() {
  let q = Math.floor(s.t % 1440);
  if (q < 0) q += 1440;
  return q;
}

export function hour() { return clockMin() / 60; }

export function fmtDur(mins) {
  mins = Math.max(0, Math.floor(mins));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

export function time() { return fmtDur(clockMin()); }

export function absMin() { return (s.day - 1) * 1440 + clockMin(); }

export function isNight() {
  const q = clockMin();
  return q < 390 || q > 1140;
}

export function weatherOf(day) {
  const d = day == null ? s.day : day;
  let x = Math.imul(d | 0, 747796405) + 2891336453;
  x = Math.imul(x ^ (x >>> 16), 2246822507);
  x = (x ^ (x >>> 13)) >>> 0;
  const w = WEATHERS[x % WEATHERS.length];
  if (seasonOf(d).id === 'winter' && w.short === '晴热') return WEATHERS[0];
  return w;
}

export function peak(h, a, b) {
  if (h < a || h > b) return 0;
  const mid = (a + b) / 2;
  const half = (b - a) / 2 || 1;
  return 1 - Math.abs(h - mid) / half;
}

export function circadian(h) {
  if (h >= 23) return 0.72 + (h - 23) * 0.2;
  if (h < 5) return 0.9 - h * 0.05;
  if (h < 7) return 0.62 - (h - 5) * 0.18;
  if (h < 12) return 0.1;
  if (h < 14.5) return 0.2;
  if (h < 21) return 0.1;
  return 0.26 + (h - 21) * 0.2;
}

export function nightTax(h) {
  if (h >= 23 || h < 5.5) return 34;
  if (h < 6.5) return 12;
  return 0;
}

export function esc(t) {
  return String(t || '').replace(/[&<>]/g, function (ch) { return {'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]; });
}
