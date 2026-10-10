import { MIND } from './constants.js';
import { s } from './state.js';

export const CITY = '深圳';
export const BIRTH = {y:2004, m:3, d:18};
export const GRAD_YEAR = 2026;
export const EPOCH = {y:2026, m:7, d:1};

const MONTH_DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function leap(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year, month) {
  if (month === 2 && leap(year)) return 29;
  return MONTH_DAYS[month];
}

export function dateOf(day) {
  let y = EPOCH.y;
  let m = EPOCH.m;
  let d = EPOCH.d;
  let left = Math.max(1, day | 0) - 1;
  while (left > 0) {
    const room = daysInMonth(y, m) - d;
    if (left <= room) {
      d += left;
      left = 0;
    } else {
      left -= room + 1;
      d = 1;
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
    }
  }
  return {y:y, m:m, d:d};
}

export function formatDate(day) {
  const dt = dateOf(day == null ? s.day : day);
  return dt.y + '年' + dt.m + '月' + dt.d + '日';
}

const WEEKDAY = ['日', '一', '二', '三', '四', '五', '六'];

export function weekdayOf(day) {
  const dt = dateOf(day == null ? s.day : day);
  return new Date(Date.UTC(dt.y, dt.m - 1, dt.d)).getUTCDay();
}

export function weekdayName(day) {
  return '周' + WEEKDAY[weekdayOf(day)];
}

export function isWeekend(day) {
  const w = weekdayOf(day);
  return w === 0 || w === 6;
}

export function seasonOf(day) {
  const m = dateOf(day == null ? s.day : day).m;
  if (m >= 3 && m <= 5) return {id:'spring', name:'春', long:'深圳的春天'};
  if (m >= 6 && m <= 9) return {id:'summer', name:'夏', long:'深圳的夏天'};
  if (m >= 10 && m <= 11) return {id:'autumn', name:'秋', long:'深圳的秋天'};
  return {id:'winter', name:'冬', long:'深圳的冬天'};
}

export function domOf(day) {
  return dateOf(day == null ? s.day : day).d;
}

export function isNewMonth(day) {
  if (!(day > 1)) return false;
  const prev = dateOf(day - 1);
  const now = dateOf(day);
  return prev.y !== now.y || prev.m !== now.m;
}

export function monthEnded(day) {
  return dateOf((day || 1) + 1).d === 1;
}

export function isBirthday(day) {
  const dt = dateOf(day);
  return day > 1 && dt.m === BIRTH.m && dt.d === BIRTH.d;
}

export function ageOf(day) {
  const dt = dateOf(day == null ? s.day : day);
  let age = dt.y - BIRTH.y;
  if (dt.m < BIRTH.m || (dt.m === BIRTH.m && dt.d < BIRTH.d)) age -= 1;
  return age;
}

export function ageStage(day) {
  const age = ageOf(day == null ? s.day : day);
  if (age < 27) return 0;
  if (age < 32) return 1;
  if (age < 38) return 2;
  return 3;
}

export function cognitionNow() {
  const years = Math.max(0, ageOf() - 22);
  let skillSum = 0;
  const skills = s.skills || {};
  Object.keys(skills).forEach(function (id) {
    const xp = skills[id] && skills[id].xp || 0;
    skillSum += Math.max(0, Math.min(8, Math.floor(Math.sqrt(Math.max(0, xp) / 18))));
  });
  const bonus = Math.min(7, years * 0.5 + skillSum * 0.12);
  return Math.max(MIND.cognition, Math.min(99, Math.round(MIND.cognition + bonus)));
}
