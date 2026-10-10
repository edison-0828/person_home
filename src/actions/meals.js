import { marketValue } from '../market.js';
import { skillRank } from '../skills.js';
import { s } from '../state.js';

export function mealCost(full, poorCost, spec) {
  const poor = s.money < 170 && marketValue() < 50;
  const lvl = skillRank('cooking');
  const disc = poor ? 0 : Math.min(lvl, 4);
  spec.cost = Math.max(poor ? 4 : 6, (poor ? poorCost : full) - disc);
  spec.mood = (spec.mood || 0) + lvl * 0.015;
  if (poor) spec.junk = true;
}
