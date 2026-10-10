import { dateOf, isWeekend } from './calendar.js';
import { s } from './state.js';

const lunarInfo = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
  0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,
  0x0d520
];

const HOLIDAY_LINE = {
  newyear: '元旦，他给自己放一天，也给家里打了个电话。',
  cny: '过年了，想回家的路，也想在深圳歇一歇。',
  qingming: '清明，他安静了一会儿，想起家里的人。',
  labor: '劳动节，班可以停一停。',
  duanwu: '端午，粽子的味道比日程更先到。',
  midautumn: '中秋，月亮升起来的时候会想家。',
  national: '国庆，深圳的街上人很多，他更想待在屋里。'
};

function leapMonth(year) {
  return lunarInfo[year - 1900] & 0xf;
}

function leapDays(year) {
  if (leapMonth(year)) return (lunarInfo[year - 1900] & 0x10000) ? 30 : 29;
  return 0;
}

function monthDays(year, month) {
  return (lunarInfo[year - 1900] & (0x10000 >> month)) ? 30 : 29;
}

function lYearDays(year) {
  let sum = 348;
  for (let i = 0x8000; i > 0x8; i >>= 1) sum += (lunarInfo[year - 1900] & i) ? 1 : 0;
  return sum + leapDays(year);
}

function solarToLunar(y, m, d) {
  if (y < 1901 || y > 2100) return {year:y, month:m, day:d, isLeap:false};
  let offset = (Date.UTC(y, m - 1, d) - Date.UTC(1900, 0, 31)) / 86400000;
  let i;
  let temp = 0;
  for (i = 1900; i < 2101 && offset > 0; i++) {
    temp = lYearDays(i);
    offset -= temp;
  }
  if (offset < 0) {
    offset += temp;
    i--;
  }
  const year = i;
  const leap = leapMonth(year);
  let isLeap = false;
  let month;
  for (month = 1; month < 13 && offset > 0; month++) {
    if (leap > 0 && month === leap + 1 && isLeap === false) {
      month--;
      isLeap = true;
      temp = leapDays(year);
    } else temp = monthDays(year, month);
    if (isLeap === true && month === leap + 1) isLeap = false;
    offset -= temp;
  }
  if (offset === 0 && leap > 0 && month === leap + 1) {
    if (isLeap) isLeap = false;
    else {
      isLeap = true;
      month--;
    }
  }
  if (offset < 0) {
    offset += temp;
    month--;
  }
  return {year:year, month:month, day:offset + 1, isLeap:isLeap};
}

function qingmingDay(year) {
  const y = year % 100;
  return Math.floor(y * 0.2422 + 4.81) - Math.floor(y / 4);
}

export function lunarOf(day) {
  const dt = dateOf(day == null ? s.day : day);
  return solarToLunar(dt.y, dt.m, dt.d);
}

export function holidayOf(day) {
  const dt = dateOf(day == null ? s.day : day);
  const lunar = solarToLunar(dt.y, dt.m, dt.d);
  if (dt.m === 1 && dt.d === 1) return {id:'newyear', name:'元旦', year:dt.y};
  if (!lunar.isLeap && lunar.month === 12 && lunar.day === monthDays(lunar.year, 12)) {
    return {id:'cny', name:'春节', phase:'eve', year:lunar.year + 1};
  }
  if (!lunar.isLeap && lunar.month === 1 && lunar.day >= 1 && lunar.day <= 6) {
    return {id:'cny', name:'春节', phase:lunar.day === 1 ? 'day1' : 'week', year:lunar.year, lunarDay:lunar.day};
  }
  if (dt.m === 4 && dt.d === qingmingDay(dt.y)) return {id:'qingming', name:'清明', year:dt.y};
  if (dt.m === 5 && dt.d >= 1 && dt.d <= 3) return {id:'labor', name:'劳动节', year:dt.y};
  if (!lunar.isLeap && lunar.month === 5 && lunar.day === 5) return {id:'duanwu', name:'端午', year:dt.y};
  if (!lunar.isLeap && lunar.month === 8 && lunar.day === 15) return {id:'midautumn', name:'中秋', year:dt.y};
  if (dt.m === 10 && dt.d >= 1 && dt.d <= 7) return {id:'national', name:'国庆', year:dt.y};
  return null;
}

export function isOffDay(day) {
  return isWeekend(day) || !!holidayOf(day);
}

export function holidayThought(day) {
  const hol = holidayOf(day);
  if (!hol) return '';
  return HOLIDAY_LINE[hol.id] || '';
}

export function holidayMarkup(amount) {
  if (!(amount > 0)) return amount;
  const hol = holidayOf();
  if (!hol) return amount;
  const rate = (hol.id === 'cny' || hol.id === 'national') ? 1.18 : 1.1;
  return Math.max(1, Math.round(amount * rate));
}
