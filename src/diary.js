import { SKILL_META } from './constants.js';
import { dominantFeel, freshFeel, maybeInsight } from './emotions.js';
import { memory } from './memory.js';
import { freshToday, s } from './state.js';
import { $, rand, time, weatherOf } from './util.js';

export function writeDiary(day) {
  if (!s.feel) s.feel = freshFeel();
  if (rand() < 0.34) maybeInsight(null);
  const td = s.today || freshToday();
  const dom = dominantFeel();
  const meals = td.meals || 0;
  const parts = ['第' + day + '天，' + weatherOf(day).short + '。', '吃了' + meals + '顿', td.workout ? '练过' : '没练'];
  if (s.job) parts.push('工作' + Math.round(td.workMin || 0) + '分钟');
  else parts.push('投了' + (td.search || 0) + '份简历');
  if (td.gigs) parts.push('散工进账约 ¥' + Math.round(td.gigPay || 0));
  if ((s.debt || 0) > 0) parts.push('还欠着 ¥' + Math.round(s.debt));
  const pnl = Math.round(td.pnl || 0);
  if (pnl <= -5) parts.push('市场亏了约 ¥' + Math.abs(pnl));
  else if (pnl >= 5) parts.push('市场盈了约 ¥' + pnl);
  parts.push('存款 ¥' + Math.round(s.money));
  if (td.practice) parts.push('练过' + ((SKILL_META[s.focus] || {}).name || '手艺'));
  let body = parts[0] + parts.slice(1).join('，') + '。';
  body += '心里最沉的是' + dom.name + '。';
  if ((s.feel && s.feel.anxiety > 55) && (s.money < 280 || (s.debt || 0) > 0)) body += '钱的事让这一天发紧。';
  const mine = (s.mistakes || []).filter(function (m) { return m.day === day; });
  if (mine.length) {
    let bit = mine[0].text || '';
    if (!/[。！？]$/.test(bit)) bit += '。';
    body += '今天后悔：' + bit;
  }
  const top = (s.lessons || [])[0];
  if (top && top.strength > 14) body += '想记住：' + top.text;
  else if (s.focus && SKILL_META[s.focus]) body += '明天还想碰一碰' + SKILL_META[s.focus].name + '。';
  if (dom.key === 'nostalgia') body += '安静的时候，旧晚上会自己走进来。';
  if (td.breakthrough) body += '有一门手艺今天忽然顺了一点。';
  const insight = (s.insights || []).find(function (i) { return i.day === day; });
  if (insight) body += '另外他好像明白了：' + insight.text;
  if (!s.diary) s.diary = [];
  const entry = {day:day, time:time(), text:body, feel:dom.key};
  const idx = s.diary.findIndex(function (d) { return d.day === day; });
  if (idx >= 0) s.diary[idx] = entry;
  else {
    s.diary.unshift(entry);
    memory('diary', body.slice(0, 90));
  }
  if (s.diary.length > 16) s.diary.length = 16;
}
