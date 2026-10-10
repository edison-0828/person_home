import { SKILL_META } from './constants.js';
import { feelTo, freshFeel, lessonStrength } from './emotions.js';
import { log, memory } from './memory.js';
import { owns } from './money.js';
import { s } from './state.js';
import { cl, rand } from './util.js';

export function freshSkills() {
  return {
    cooking:{xp:8, level:0, plateau:0},
    guitar:{xp:4, level:0, plateau:0},
    drawing:{xp:3, level:0, plateau:0},
    trading:{xp:6, level:0, plateau:0}
  };
}

export function skillLevelOf(xp) {
  return Math.max(0, Math.min(8, Math.floor(Math.sqrt(Math.max(0, xp) / 18))));
}

export function skillRank(id) {
  const sk = s.skills && s.skills[id];
  return sk ? skillLevelOf(sk.xp) : 0;
}

export function gainSkill(id, raw) {
  if (!s.skills || !s.skills[id] || !(raw > 0)) return;
  if (id === 'guitar' && owns('guitar')) raw *= 1.28;
  if ((id === 'drawing' || id === 'trading') && owns('computer')) raw *= 1.22;
  const sk = s.skills[id];
  const lvl = skillLevelOf(sk.xp);
  let gain = raw / (1 + lvl * 0.45);
  const into = sk.xp % 36;
  const plateau = lvl >= 1 && into > 22 && into < 33;
  if (plateau) {
    sk.plateau = (sk.plateau || 0) + 1;
    gain *= 0.38;
    if (sk.plateau >= 2 && rand() < 0.28) {
      gain += 14;
      sk.plateau = 0;
      feelTo('pride', 14);
      feelTo('joy', 8);
      const text = SKILL_META[id].name + '卡了一阵，忽然顺了。';
      log(text);
      memory('breakthrough', text);
      if (s.today) s.today.breakthrough = (s.today.breakthrough || 0) + 1;
    }
  } else sk.plateau = 0;
  const before = lvl;
  sk.xp = Math.round((sk.xp + gain) * 10) / 10;
  sk.level = skillLevelOf(sk.xp);
  if (sk.level > before) {
    feelTo('pride', 12);
    feelTo('joy', 6);
    const text = SKILL_META[id].name + '到了 ' + sk.level + ' 级。';
    log(text);
    memory('skill', text);
  }
}

export function chooseFocus() {
  const f = s.feel || freshFeel();
  const weights = {
    cooking:1 + (lessonStrength('spend') > 16 ? 0.85 : 0) + Math.max(0, (s.values.craft || 1) - 1),
    guitar:1.2 + Math.max(0, f.loneliness - 42) / 48 + (f.nostalgia > 40 ? 0.4 : 0),
    drawing:0.8 + (f.nostalgia > 34 ? 0.35 : 0) + Math.max(0, (s.values.craft || 1) - 1) * 0.8,
    trading:1 + Math.max(0, f.anxiety - 38) / 42 + Math.max(0, (s.values.money || 1) - 1) + (lessonStrength('patient') > 12 ? 0.55 : 0)
  };
  const keys = Object.keys(weights);
  let sum = 0;
  keys.forEach(function (k) { weights[k] = Math.max(0.2, weights[k]); sum += weights[k]; });
  let r = rand() * sum;
  let pick = keys[0];
  for (let i = 0; i < keys.length; i++) {
    r -= weights[keys[i]];
    if (r <= 0) { pick = keys[i]; break; }
  }
  s.focus = pick;
}

export function impulseChance() {
  const skill = skillRank('trading');
  const anx = s.feel ? s.feel.anxiety : 30;
  const lesson = lessonStrength('patient');
  let p = 0.3;
  p += Math.max(0, anx - 36) * 0.004;
  p -= skill * 0.04;
  p -= lesson * 0.0052;
  p -= ((s.values && s.values.calm) || 1) > 1 ? ((s.values.calm - 1) * 0.12) : 0;
  if (s.riskOffDays > 0) p *= 0.5;
  return cl(p, 0.04, 0.68);
}

export function practicePlace() {
  return (SKILL_META[s.focus] || SKILL_META.guitar).place;
}
