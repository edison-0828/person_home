import './actions/catalog.js';
import { canvas } from './canvas.js';
import { s } from './state.js';
import { auditMap } from './map.js';
import { load, persist } from './persist.js';
import { rollWhim, morningPlan, rawScores, startAction } from './decision.js';
import { tick } from './loop.js';
import { ui } from './ui.js';
import { draw } from './render.js';
import { snapshotText, installDebug } from './snapshot.js';

window.render_game_to_text = snapshotText;
window.advanceTime = function (ms) {
  const n = Math.max(1, Math.round((ms || 0) / 50));
  for (let i = 0; i < n; i++) tick(0.8);
  ui();
  draw();
};
installDebug();

function boot() {
  const resumed = load();
  if (!resumed) {
    s.whim = rollWhim();
    s.plan = morningPlan();
    s.decision = {action:'wake', reason:'刚醒，先在床边坐一会儿，再决定接下来做什么。', scores:rawScores()};
    startAction('wake');
    persist();
  }
  auditMap();
  ui();
  draw();
}
boot();
window.addEventListener('pagehide', () => persist());
let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  if (window.__PAUSE_LIFE__) { last = now; return; }
  const dt = Math.min(40, now - last) / 50;
  last = now;
  tick(dt);
  ui();
  draw();
}
requestAnimationFrame(loop);
void canvas;
