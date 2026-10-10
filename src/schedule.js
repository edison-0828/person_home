import { isWeekend, seasonOf } from './calendar.js';
import { holidayOf } from './holidays.js';
import { freshToday, s } from './state.js';

function sway(day) {
  let x = Math.imul((day | 0) ^ 0x5f3759df, 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 13), 0x45d9f3b);
  return ((x ^ (x >>> 16)) >>> 0) % 100;
}

export function decideOvertime() {
  if (!s.today) s.today = freshToday();
  const hol = holidayOf();
  const off = isWeekend() || !!hol;
  s.today.otDay = s.day;
  s.today.otSet = 1;
  if (!off || !s.job || s.day < (s.workFromDay || 0)) {
    s.today.overtime = 0;
    return 0;
  }
  let urge = 0;
  if ((s.money || 0) < 500) urge += 3;
  else if ((s.money || 0) < 1500) urge += 2;
  else if ((s.money || 0) < 4000) urge += 1;
  if ((s.debt || 0) > 0) urge += 2;
  if ((s.rentBehind || 0) > 0) urge += 1;
  if ((s.performance || 0) >= 70) urge += 2;
  else if ((s.performance || 0) >= 55) urge += 1;
  if ((s.daysInRank || 0) >= 50 && (s.performance || 0) >= 52) urge += 1;
  if (s.values && s.values.money >= 1.12) urge += 1;
  if ((s.e || 0) >= 68) urge += 2;
  else if ((s.e || 0) >= 48) urge += 1;
  else if ((s.e || 0) < 38) urge -= 3;
  if ((s.m || 0) >= 58) urge += 1;
  else if ((s.m || 0) < 38) urge -= 2;
  if ((s.sickDays || 0) > 0) urge -= 4;
  (s.lessons || []).forEach(function (lesson) {
    if (!lesson || (lesson.strength || 0) < 18) return;
    if (lesson.id === 'sleep') urge -= 2;
    if (lesson.id === 'train') urge -= 1;
  });
  if (hol) urge -= 2;
  if (hol && hol.id === 'cny') urge -= 2;
  let yes = 0;
  if (urge >= 6) yes = 1;
  else if (urge > 2) yes = sway(s.day + urge * 17) < (30 + urge * 8) ? 1 : 0;
  s.today.overtime = yes;
  return yes;
}

export function ensureDayStamp() {
  if (!s.today) s.today = freshToday();
  if (s.today.stampDay === s.day) return false;
  const hol = holidayOf();
  s.today.holiday = hol ? 1 : 0;
  s.today.holidayName = hol ? hol.name : '';
  s.today.weekend = isWeekend() ? 1 : 0;
  s.today.season = seasonOf().id;
  s.today.stampDay = s.day;
  s.today.otSet = 0;
  decideOvertime();
  return true;
}

export function wantsOvertime() {
  ensureDayStamp();
  return !!(s.today && s.today.overtime);
}

export function scheduleLabel() {
  ensureDayStamp();
  const hol = holidayOf();
  const ot = !!(s.today && s.today.overtime);
  if (hol && ot) return hol.name + ' · 仍在加班';
  if (hol) return hol.name + ' · 休息';
  if (isWeekend() && ot) return '周末 · 加班';
  if (isWeekend()) return '周末 · 休息';
  return '工作日';
}
