import { FEEL_NAME, MIND, SKILL_META } from './constants.js';
import { actionLabel, morningPlan } from './decision.js';
import { dominantFeel } from './emotions.js';
import { renderLog } from './memory.js';
import { SHOP, drawTrackChart, hourlyWage, netWorth, rankInfo, stageOf } from './money.js';
import { skillLevelOf } from './skills.js';
import { s } from './state.js';
import { $, cl, esc, fmtDur, time, weatherOf } from './util.js';

export function renderInner() {
  const emo = $('emo');
  if (emo && s.feel) {
    emo.innerHTML = Object.keys(FEEL_NAME).map(function (k) {
      return '<b>' + FEEL_NAME[k] + ' ' + Math.round(s.feel[k] || 0) + '</b>';
    }).join('');
  }
  const note = $('feel-note');
  if (note) {
    const dom = dominantFeel();
    let cause = '它会慢慢回到日常的水位。';
    if (dom.key === 'nostalgia' && weatherOf(s.day).short === '小雨') cause = '雨声把旧晚上带回来了。';
    else if (dom.key === 'regret' && s.mistakes && s.mistakes[0]) cause = '因为' + String(s.mistakes[0].text).slice(0, 28);
    else if (dom.key === 'pride' && s.focus) cause = '手艺或训练留下了一点痕迹。';
    else if (dom.key === 'anxiety' && s.money < 500) cause = '存款偏紧的时候，它会先冒出来。';
    note.textContent = '现在最明显的是' + dom.name + '。' + cause;
  }
  const skills = $('skills');
  if (skills && s.skills) {
    skills.innerHTML = Object.keys(SKILL_META).map(function (id) {
      const sk = s.skills[id] || {xp:0, plateau:0};
      const lvl = skillLevelOf(sk.xp);
      const prev = lvl * lvl * 18;
      const next = (lvl + 1) * (lvl + 1) * 18;
      const pct = lvl >= 8 ? 100 : cl((sk.xp - prev) / Math.max(1, next - prev) * 100);
      const tag = s.focus === id ? ' · 今天' : '';
      const plat = (sk.plateau || 0) >= 2 ? ' · 平台' : '';
      return '<div class="skill-row"><span><b>' + SKILL_META[id].name + tag + plat + '</b><b>Lv.' + lvl + '</b></span><div class="track"><div class="fill mood" style="width:' + pct + '%"></div></div></div>';
    }).join('');
  }
  const fl = $('focus-label');
  if (fl) fl.textContent = '今天 · ' + ((SKILL_META[s.focus] || SKILL_META.guitar).name);
  const diary = $('diary');
  if (diary) {
    if (!s.diary || !s.diary.length) diary.innerHTML = '<div class="empty-note">他还没写下今天。</div>';
    else diary.innerHTML = s.diary.slice(0, 4).map(function (d) {
      return '<div class="diary-item"><time>第' + d.day + '天 · ' + esc(d.time || '') + '</time>' + esc(d.text) + '</div>';
    }).join('');
  }
  const lessons = $('lessons');
  if (lessons) {
    const bits = [];
    (s.insights || []).forEach(function (i) {
      bits.push('<div class="lesson-item"><time>醒悟 · 第' + i.day + '天</time>' + esc(i.text) + '</div>');
    });
    (s.lessons || []).forEach(function (l) {
      const meta = '教训 · 强度 ' + Math.round(l.strength || 0) + (l.followed ? ' · 照做过 ' + l.followed + ' 次' : '');
      const why = l.why ? '<div>起因：' + esc(l.why) + '</div>' : '';
      bits.push('<div class="lesson-item"><time>' + meta + '</time>' + esc(l.text) + why + '</div>');
    });
    lessons.innerHTML = bits.length ? bits.join('') : '<div class="empty-note">还没有留下教训。</div>';
  }
  renderLivelihood();
}

export function renderLivelihood() {
  const facts = $('income-facts');
  const info = rankInfo();
  const wage = hourlyWage();
  if (facts) {
    const cells = [
      ['职位', info.title],
      ['时薪', wage ? ('¥ ' + wage) : '还没有'],
      ['今日散工', '¥ ' + Math.round((s.today && s.today.gigPay) || 0)],
      ['本月收入', '¥ ' + Math.round(s.monthIn || 0)],
      ['本月支出', '¥ ' + Math.round(s.monthOut || 0)],
      ['净资产', '¥ ' + netWorth()],
      ['欠款', (s.debt || 0) > 0 ? ('¥ ' + Math.round(s.debt)) : '没有'],
      ['屋子里的新东西', (s.owned && s.owned.length) ? s.owned.map(function (id) { return (SHOP[id] && SHOP[id].name) || id; }).join('、') : '还没有']
    ];
    facts.innerHTML = cells.map(function (pair) {
      return '<div class="fact"><small>' + pair[0] + '</small><strong>' + esc(pair[1]) + '</strong></div>';
    }).join('');
  }
  const note = $('income-note');
  if (note) {
    if ((s.debt || 0) > 0) note.textContent = '房租还欠着 ¥' + Math.round(s.debt) + '。存款紧的时候，他会从院子的门出去打散工。';
    else if (s.money < 260) note.textContent = '存款不多，焦虑会先冒出来，觉也睡得浅。';
    else if (wage) note.textContent = info.title + '，时薪大约 ¥' + wage + '。吃住和订阅从这里走。';
    else note.textContent = '还没有固定时薪。散工按趟结，回来人是累的。';
  }
  const stage = $('stage-name');
  if (stage) stage.textContent = stageOf(s.trajectory || 0) + ' · ' + Math.round(s.trajectory || 0);
  const slab = $('stage-label');
  if (slab) slab.textContent = s.turning === 'wakeup' ? '醒了' : (s.turning === 'soft' ? '有点松' : 'PATH');
  const tnote = $('track-note');
  if (tnote) {
    if (s.turning === 'wakeup') tnote.textContent = '他碰过谷底，正在把日子往回拉。';
    else if (s.turning === 'soft') tnote.textContent = '顺了一段之后，他开始有点松手。';
    else tnote.textContent = '线往上是成长，往下是把日子过散了。训练、工作和教训往上走，欠租、手痒和赖着不动往下走。';
  }
  drawTrackChart();
  const ledger = $('ledger');
  if (ledger) {
    if (!s.ledger || !s.ledger.length) ledger.innerHTML = '<div class="empty-note">还没有进出账。</div>';
    else ledger.innerHTML = s.ledger.slice(0, 7).map(function (row) {
      const sign = row.amount > 0 ? ('+' + row.amount) : String(row.amount);
      const tag = row.amount > 0 ? 'b' : 'i';
      return '<div class="tx"><span>第' + row.day + '天 ' + esc(row.label) + '</span><' + tag + '>' + sign + '</' + tag + '></div>';
    }).join('');
  }
}

export function ui() {
  const w = weatherOf(s.day || 1);
  const dayEl = $('day'); if (dayEl) dayEl.textContent = String(s.day).padStart(2, '0');
  const clock = $('clock'); if (clock) clock.textContent = time();
  const action = $('action'); if (action) action.textContent = actionLabel(s.action);
  const thought = $('thought'); if (thought) thought.textContent = s.thought || '';
  const role = $('role'); if (role) {
    const info = rankInfo();
    if (!s.job) role.textContent = '自由职业者 · 在找工作';
    else if (s.day < s.workFromDay) role.textContent = info.title + ' · 明天开工 · 时薪 ¥' + hourlyWage();
    else role.textContent = info.title + ' · 时薪 ¥' + hourlyWage();
  }
  const meters = [['energy', s.e], ['hunger', s.h], ['mood', s.m]];
  meters.forEach(([k, v]) => {
    const lab = $(k + '-v'); if (lab) lab.textContent = Math.round(v) + '%';
    const bar = $(k); if (bar) bar.style.width = cl(v) + '%';
  });
  const money = $('money-v'); if (money) money.textContent = '¥ ' + Math.round(s.money);
  const moneyBar = $('money'); if (moneyBar) moneyBar.style.width = cl(s.money / 40) + '%';
  const awake = $('awake'); if (awake) awake.textContent = s.action === 'sleep' ? '睡眠中' : fmtDur(s.awakeMin);
  const plan = $('plan'); if (plan) plan.textContent = s.plan || morningPlan();
  const weather = $('weather'); if (weather) weather.textContent = w.full;
  const weatherShort = $('weather-short'); if (weatherShort) weatherShort.textContent = w.short;
  const mind = $('mind-line'); if (mind) mind.textContent = s.mind || '';
  const cog = $('cog'); if (cog) cog.textContent = '高 · ' + MIND.cognition + ' / 100';
  const risk = $('riskpref'); if (risk) risk.textContent = '研究后决策';
  const likeLong = $('like-long'); if (likeLong) likeLong.textContent = '加密货币';
  const likeMkt = $('like-mkt'); if (likeMkt) likeMkt.textContent = '美股';
  renderLog();
  renderInner();
}
