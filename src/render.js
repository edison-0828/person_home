import { H, W, g } from './canvas.js';
import { COLS, ROWS, SCALE, TILE } from './constants.js';
import { currentPose } from './decision.js';
import { owns } from './money.js';
import { ART, LAMPS, PROPS, TREES, actorSprite, ensureArt } from './sprites.js';
import { s } from './state.js';
import { cellSprite } from './tiles.js';
import { isNight, weatherOf } from './util.js';

export function poseFrame(pose) {
  const a = s.anim || 0;
  if (pose === 'walk') return Math.floor(a * 0.45) % 4;
  if (pose === 'sleep') return Math.floor(a * 0.18) % 2;
  if (pose === 'idle' || pose === 'sit') return Math.floor(a * 0.22) % 2;
  return Math.floor(a * 0.4) % 4;
}

export function actorAnchor() {
  const pose = currentPose();
  if (pose === 'sleep') return {x:2.5 * TILE, y:2.15 * TILE, pose:pose, dir:'down', sortY:3 * TILE + 2};
  let x = s.x, y = s.y;
  if (!s.moving) {
    const n = (pose === 'sit' || pose === 'type' || pose === 'cook' || pose === 'lift') ? 4 : (pose === 'eat' ? 3 : 0);
    const face = s.face || 'down';
    if (face === 'up') y -= n;
    else if (face === 'down') y += n;
    else if (face === 'left') x -= n;
    else x += n;
  }
  return {x:x, y:y, pose:pose, dir:s.face || 'down', sortY:y};
}

export function ownedDecor() {
  const list = [];
  if (owns('computer')) list.push({kind:'computer', c:16, r:8, w:1, h:1});
  if (owns('phone')) list.push({kind:'phone', c:14, r:8, w:1, h:1});
  if (owns('guitar')) list.push({kind:'guitarItem', c:6, r:7, w:1, h:1});
  if (owns('gym')) list.push({kind:'rack', c:9, r:8, w:1, h:1});
  if (owns('sofa')) list.push({kind:'cushion', c:2, r:8, w:1, h:1});
  if (owns('junk')) list.push({kind:'gadget', c:2, r:7, w:1, h:1});
  return list;
}

export function drawProp(prop) {
  const spr = ART.props[prop.kind];
  if (!spr) return;
  const dw = spr.width * SCALE;
  const dh = spr.height * SCALE;
  const dx = prop.c * TILE * SCALE + (prop.w * TILE * SCALE - dw) / 2;
  const dy = (prop.r + prop.h) * TILE * SCALE - dh;
  g.drawImage(spr, Math.round(dx), Math.round(dy), dw, dh);
}

export function drawTree(tree) {
  const spr = ART.trees[tree.kind % ART.trees.length];
  const dx = Math.round((tree.c + 0.5) * TILE * SCALE - 13 * SCALE);
  const dy = Math.round((tree.r + 1) * TILE * SCALE - spr.height * SCALE);
  g.drawImage(spr, dx, dy, spr.width * SCALE, spr.height * SCALE);
}

export function drawBits(anchor, dx, dy) {
  const f = Math.floor((s.anim || 0) * 0.3) % 4;
  if (anchor.pose === 'sleep') {
    g.fillStyle = '#fffaf3';
    const zx = dx + 20 * SCALE;
    const zy = dy + (2 - f) * SCALE;
    g.fillRect(zx, zy, 3 * SCALE, SCALE);
    g.fillRect(zx + 2 * SCALE, zy + SCALE, SCALE, SCALE);
    g.fillRect(zx, zy + 2 * SCALE, 3 * SCALE, SCALE);
  } else if (anchor.pose === 'cook') {
    g.fillStyle = 'rgba(255,255,255,0.7)';
    g.fillRect(dx + 6 * SCALE, dy + (2 - f) * SCALE, SCALE, SCALE);
    g.fillRect(dx + 10 * SCALE, dy - f * SCALE, SCALE, SCALE);
  }
}

export function drawActor(anchor) {
  const spr = actorSprite(anchor.pose, anchor.dir, poseFrame(anchor.pose));
  const dx = Math.round(anchor.x * SCALE - spr.footX * SCALE);
  const dy = Math.round(anchor.y * SCALE - spr.footY * SCALE);
  if (anchor.pose !== 'sleep') {
    g.fillStyle = 'rgba(48, 32, 18, 0.30)';
    g.fillRect(Math.round(anchor.x * SCALE - 4 * SCALE), Math.round(anchor.y * SCALE - SCALE), 8 * SCALE, 2 * SCALE);
  }
  g.drawImage(spr, dx, dy, spr.width * SCALE, spr.height * SCALE);
  drawBits(anchor, dx, dy);
}

export let lightCv = null;

export function drawLighting() {
  if (!isNight()) return;
  if (!lightCv) {
    lightCv = document.createElement('canvas');
    lightCv.width = W;
    lightCv.height = H;
  }
  const lg = lightCv.getContext('2d');
  lg.setTransform(1, 0, 0, 1, 0, 0);
  lg.globalCompositeOperation = 'source-over';
  lg.clearRect(0, 0, W, H);
  lg.fillStyle = 'rgba(16, 22, 48, 0.58)';
  lg.fillRect(0, 0, W, H);
  lg.globalCompositeOperation = 'destination-out';
  function punch(x, y, rad, strength) {
    const inner = Math.max(4, rad * 0.08);
    const rg = lg.createRadialGradient(x, y, inner, x, y, rad);
    rg.addColorStop(0, 'rgba(0,0,0,' + strength + ')');
    rg.addColorStop(0.42, 'rgba(0,0,0,' + (strength * 0.72) + ')');
    rg.addColorStop(0.75, 'rgba(0,0,0,' + (strength * 0.28) + ')');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    lg.fillStyle = rg;
    lg.beginPath();
    lg.arc(x, y, rad, 0, Math.PI * 2);
    lg.fill();
  }
  for (let i = 0; i < LAMPS.length; i++) punch(LAMPS[i].x, LAMPS[i].y, LAMPS[i].rad, 1);
  punch(11 * TILE * SCALE, 15 * TILE * SCALE, 230, 0.42);
  lg.globalCompositeOperation = 'source-over';
  g.drawImage(lightCv, 0, 0);
  for (let i = 0; i < LAMPS.length; i++) {
    const lamp = LAMPS[i];
    const rad = lamp.rad * 0.72;
    const rg = g.createRadialGradient(lamp.x, lamp.y, 6, lamp.x, lamp.y, rad);
    rg.addColorStop(0, 'rgba(255, 196, 110, 0.26)');
    rg.addColorStop(0.45, 'rgba(255, 160, 70, 0.10)');
    rg.addColorStop(1, 'rgba(255, 140, 40, 0)');
    g.fillStyle = rg;
    g.beginPath();
    g.arc(lamp.x, lamp.y, rad, 0, Math.PI * 2);
    g.fill();
  }
}

export function drawRain() {
  g.fillStyle = 'rgba(232, 240, 248, 0.55)';
  const t = Math.floor((s.anim || 0) * 3);
  for (let i = 0; i < 90; i++) {
    const x = (i * 89 + t * 7) % W;
    const y = (i * 47 + t * 13) % H;
    g.fillRect(x, y, SCALE, 4 * SCALE);
  }
}

export function draw() {
  ensureArt();
  g.imageSmoothingEnabled = false;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      g.drawImage(cellSprite(col, row), col * TILE * SCALE, row * TILE * SCALE, TILE * SCALE, TILE * SCALE);
    }
  }
  for (let i = 0; i < PROPS.length; i++) if (PROPS[i].flat) drawProp(PROPS[i]);
  const ents = [];
  for (let i = 0; i < PROPS.length; i++) if (!PROPS[i].flat) {
    const prop = PROPS[i];
    ents.push({y:(prop.r + prop.h) * TILE, draw:drawProp.bind(null, prop)});
  }
  for (let i = 0; i < TREES.length; i++) {
    const tree = TREES[i];
    ents.push({y:(tree.r + 1) * TILE - 2, draw:drawTree.bind(null, tree)});
  }
  ownedDecor().forEach(function (prop) {
    ents.push({y:(prop.r + prop.h) * TILE, draw:drawProp.bind(null, prop)});
  });
  if (!s.away) {
    const anchor = actorAnchor();
    ents.push({y:anchor.sortY, draw:drawActor.bind(null, anchor)});
  }
  ents.sort(function (a, b) { return a.y - b.y; });
  for (let i = 0; i < ents.length; i++) ents[i].draw();
  drawLighting();
  if (weatherOf(s.day).short === '小雨') drawRain();
}
