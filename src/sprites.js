import { ageStage } from './calendar.js';
import { SCALE, TILE } from './constants.js';
import { isNight } from './util.js';

let AGE = 0;

function paintAge(p, y) {
  if (AGE >= 1) {
    p.set(7, y + 5, '#e0b090');
    p.set(8, y + 5, '#e0b090');
  }
  if (AGE >= 2) {
    p.set(5, y, '#8d8680');
    p.set(10, y, '#8d8680');
  }
  if (AGE >= 3) p.rect(6, y, 4, 1, '#b7b1a8');
}

export const TREES = [
  {c:2, r:14, kind:0},
  {c:3, r:13, kind:1},
  {c:18, r:13, kind:2},
  {c:19, r:14, kind:0}
];

export const PROPS = [
  {kind:'bed', c:1, r:1, w:3, h:2},
  {kind:'wardrobe', c:8, r:1, w:2, h:2},
  {kind:'nightstand', c:5, r:1, w:1, h:1},
  {kind:'fridge', c:11, r:1, w:2, h:2},
  {kind:'stove', c:14, r:1, w:2, h:1},
  {kind:'counter', c:17, r:1, w:4, h:1},
  {kind:'counterEnd', c:20, r:2, w:1, h:1},
  {kind:'table', c:15, r:3, w:2, h:2},
  {kind:'sofa', c:1, r:8, w:4, h:1},
  {kind:'shelf', c:1, r:7, w:2, h:1},
  {kind:'barbell', c:7, r:8, w:2, h:1},
  {kind:'desk', c:14, r:8, w:3, h:1},
  {kind:'bookcase', c:11, r:7, w:2, h:2},
  {kind:'plant', c:19, r:10, w:1, h:1},
  {kind:'plant2', c:19, r:4, w:1, h:1},
  {kind:'mailbox', c:7, r:13, w:1, h:1},
  {kind:'bench', c:12, r:14, w:2, h:1},
  {kind:'garden', c:8, r:13, w:3, h:2},
  {kind:'rugBed', c:1, r:3, w:5, h:2, flat:true},
  {kind:'rugLive', c:2, r:9, w:4, h:2, flat:true},
  {kind:'rugStudy', c:13, r:9, w:4, h:2, flat:true},
  {kind:'rugKit', c:11, r:5, w:4, h:1, flat:true},
  {kind:'mat', c:6, r:9, w:3, h:2, flat:true},
  {kind:'doormat', c:5, r:13, w:1, h:1, flat:true},
  {kind:'chairDesk', c:15, r:9, w:1, h:1, flat:true},
  {kind:'chairEat', c:17, r:4, w:1, h:1, flat:true}
];

export const LAMPS = [
  {x:5.5 * TILE * SCALE, y:1.15 * TILE * SCALE, rad:128},
  {x:16.4 * TILE * SCALE, y:2.35 * TILE * SCALE, rad:156},
  {x:4.5 * TILE * SCALE, y:8.7 * TILE * SCALE, rad:150},
  {x:15.5 * TILE * SCALE, y:8.05 * TILE * SCALE, rad:146},
  {x:5.5 * TILE * SCALE, y:12.7 * TILE * SCALE, rad:132}
];

export const SK = {
  hair:'#4a3328', hairL:'#7a5340', skin:'#f6c8a4', skinD:'#e3aa84',
  blush:'#ee9b8c', eye:'#2b241e', mouth:'#c47068',
  shirt:'#c85b3c', shirtD:'#8f3d2c', shirtL:'#e28768', cream:'#f6e3cc',
  pant:'#3d4c74', pantD:'#2a3554', shoe:'#2c241c', shoeL:'#5a4a3c',
  spoon:'#d5dbe2', wood:'#8a5a34', bar:'#b7c0c8', barD:'#5a626a', food:'#e6b15a'
};

export function strideOf(pose, frame) {
  if (pose !== 'walk') return {l:0, r:0, al:0, ar:0};
  if (frame === 1) return {l:-1, r:1, al:1, ar:-1};
  if (frame === 3) return {l:1, r:-1, al:-1, ar:1};
  return {l:0, r:0, al:0, ar:0};
}

export function bobOf(pose, frame) {
  if (pose === 'walk' && frame === 2) return -1;
  if ((pose === 'idle' || pose === 'sit') && frame === 1) return -1;
  if (pose === 'lift' && (frame === 1 || frame === 2)) return 1;
  return 0;
}

export function makeBuf(w, h) {
  const data = new Uint32Array(w * h);
  const colors = [];
  const index = new Map();
  function id(col) {
    let n = index.get(col);
    if (!n) { colors.push(col); n = colors.length; index.set(col, n); }
    return n;
  }
  function set(x, y, col) {
    if (!col || x < 0 || y < 0 || x >= w || y >= h) return;
    data[y * w + x] = id(col);
  }
  function rect(x, y, rw, rh, col) {
    if (!col || rw <= 0 || rh <= 0) return;
    const n = id(col);
    for (let yy = 0; yy < rh; yy++) {
      const py = y + yy;
      if (py < 0 || py >= h) continue;
      for (let xx = 0; xx < rw; xx++) {
        const px = x + xx;
        if (px < 0 || px >= w) continue;
        data[py * w + px] = n;
      }
    }
  }
  function flush(ctx, ox, oy) {
    ctx.fillStyle = '#2a1c16';
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!data[y * w + x]) continue;
      if (x === 0 || !data[y * w + x - 1]) ctx.fillRect(ox + x - 1, oy + y, 1, 1);
      if (x === w - 1 || !data[y * w + x + 1]) ctx.fillRect(ox + x + 1, oy + y, 1, 1);
      if (y === 0 || !data[(y - 1) * w + x]) ctx.fillRect(ox + x, oy + y - 1, 1, 1);
      if (y === h - 1 || !data[(y + 1) * w + x]) ctx.fillRect(ox + x, oy + y + 1, 1, 1);
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const n = data[y * w + x];
      if (!n) continue;
      ctx.fillStyle = colors[n - 1];
      ctx.fillRect(ox + x, oy + y, 1, 1);
    }
  }
  return {set:set, rect:rect, flush:flush, w:w, h:h};
}

export function paintLegs(p, y, st, sit) {
  if (sit) {
    p.rect(3, y + 18, 10, 3, SK.pant);
    p.rect(3, y + 20, 4, 1, SK.pantD);
    p.rect(9, y + 20, 4, 1, SK.pantD);
    p.rect(3, y + 21, 3, 2, SK.shoe);
    p.rect(10, y + 21, 3, 2, SK.shoe);
    return;
  }
  p.rect(4, y + 18 + st.l, 3, 6, SK.pant);
  p.rect(9, y + 18 + st.r, 3, 6, SK.pant);
  p.rect(4, y + 22 + st.l, 3, 1, SK.pantD);
  p.rect(9, y + 22 + st.r, 3, 1, SK.pantD);
  p.rect(4, y + 24 + st.l, 3, 2, SK.shoe);
  p.rect(9, y + 24 + st.r, 3, 2, SK.shoe);
  p.set(4, y + 24 + st.l, SK.shoeL);
  p.set(9, y + 24 + st.r, SK.shoeL);
}

export function paintFront(p, pose, frame) {
  const st = strideOf(pose, frame);
  const sit = pose === 'sit';
  const y = 2 + bobOf(pose, frame) + (sit ? 3 : 0);
  p.rect(4, y, 8, 3, SK.hair);
  p.rect(5, y, 5, 1, SK.hairL);
  p.rect(6, y - 1, 2, 1, SK.hair);
  p.rect(3, y + 2, 10, 2, SK.hair);
  p.rect(4, y + 4, 8, 6, SK.skin);
  p.rect(3, y + 4, 2, 4, SK.hair);
  p.rect(11, y + 4, 2, 4, SK.hair);
  p.rect(4, y + 4, 8, 1, SK.hair);
  p.set(6, y + 6, SK.eye);
  p.set(9, y + 6, SK.eye);
  paintAge(p, y);
  p.set(5, y + 8, SK.blush);
  p.set(10, y + 8, SK.blush);
  p.rect(7, y + 8, 2, 1, SK.mouth);
  p.set(3, y + 6, SK.skinD);
  p.set(12, y + 6, SK.skinD);
  p.rect(6, y + 10, 4, 1, SK.skinD);
  p.rect(4, y + 11, 8, 7, SK.shirt);
  p.rect(5, y + 11, 6, 1, SK.cream);
  p.rect(4, y + 16, 8, 2, SK.shirtD);
  p.set(7, y + 13, SK.shirtD);
  if (pose === 'lift') {
    p.rect(3, y + 3, 2, 7, SK.shirt);
    p.rect(11, y + 3, 2, 7, SK.shirt);
    p.set(3, y + 3, SK.skin);
    p.set(12, y + 3, SK.skin);
    p.rect(2, y + 2, 12, 2, SK.bar);
    p.rect(1, y + 1, 2, 4, SK.barD);
    p.rect(13, y + 1, 2, 4, SK.barD);
  } else if (pose === 'cook') {
    p.rect(2, y + 12, 2, 6, SK.shirt);
    p.set(2, y + 17, SK.skin);
    p.rect(12, y + 6, 2, 6, SK.shirt);
    p.set(12, y + 6, SK.skin);
    p.rect(13, y + 4, 1, 3, SK.spoon);
    p.set(13, y + 3, SK.wood);
  } else if (pose === 'eat') {
    p.rect(2, y + 12, 2, 6, SK.shirt);
    p.set(2, y + 17, SK.skin);
    p.rect(11, y + 8, 2, 4, SK.shirt);
    p.set(11, y + 7, SK.skin);
    p.set(12, y + 7, SK.food);
  } else if (pose === 'type') {
    p.rect(3, y + 15, 4, 2, SK.shirtD);
    p.rect(9, y + 15, 4, 2, SK.shirtD);
    p.rect(4, y + 16, 3, 1, SK.skin);
    p.rect(9, y + 16, 3, 1, SK.skin);
  } else {
    p.rect(2, y + 12 + st.al, 2, 6, SK.shirt);
    p.rect(12, y + 12 + st.ar, 2, 6, SK.shirt);
    p.set(2, y + 17 + st.al, SK.skin);
    p.set(13, y + 17 + st.ar, SK.skin);
    p.rect(2, y + 12 + st.al, 1, 3, SK.shirtL);
  }
  paintLegs(p, y, st, sit);
}

export function paintBack(p, pose, frame) {
  const st = strideOf(pose, frame);
  const sit = pose === 'sit';
  const y = 2 + bobOf(pose, frame) + (sit ? 3 : 0);
  p.rect(3, y, 10, 9, SK.hair);
  p.rect(5, y, 6, 2, SK.hairL);
  p.rect(6, y - 1, 3, 1, SK.hairL);
  p.set(3, y + 7, SK.skin);
  p.set(12, y + 7, SK.skin);
  paintAge(p, y);
  p.rect(4, y + 9, 8, 8, SK.shirt);
  p.rect(5, y + 9, 6, 1, SK.shirtL);
  p.rect(4, y + 15, 8, 2, SK.shirtD);
  if (pose === 'lift') {
    p.rect(2, y + 2, 2, 7, SK.shirt);
    p.rect(12, y + 2, 2, 7, SK.shirt);
    p.rect(1, y + 1, 14, 2, SK.bar);
    p.rect(0, y + 1, 2, 3, SK.barD);
    p.rect(14, y + 1, 2, 3, SK.barD);
  } else if (pose === 'cook') {
    p.rect(1, y + 11, 2, 6, SK.shirt);
    p.set(1, y + 16, SK.skin);
    p.rect(13, y + 4, 2, 7, SK.shirt);
    p.set(14, y + 4, SK.skin);
    p.rect(14, y + 2, 1, 3, SK.spoon);
  } else if (pose === 'type') {
    p.rect(3, y + 7, 2, 4, SK.shirt);
    p.rect(11, y + 7, 2, 4, SK.shirt);
    p.set(3, y + 7, SK.skin);
    p.set(12, y + 7, SK.skin);
  } else if (pose === 'eat') {
    p.rect(1, y + 11, 2, 6, SK.shirt);
    p.rect(12, y + 9, 2, 5, SK.shirt);
    p.set(13, y + 9, SK.skin);
  } else {
    p.rect(1, y + 10 + st.al, 2, 6, SK.shirt);
    p.rect(13, y + 10 + st.ar, 2, 6, SK.shirt);
    p.set(1, y + 15 + st.al, SK.skin);
    p.set(14, y + 15 + st.ar, SK.skin);
  }
  paintLegs(p, y, st, sit);
}

export function paintSide(p, pose, frame) {
  const st = strideOf(pose, frame);
  const sit = pose === 'sit';
  const y = 2 + bobOf(pose, frame) + (sit ? 3 : 0);
  p.rect(3, y, 7, 4, SK.hair);
  p.rect(4, y, 4, 1, SK.hairL);
  p.rect(6, y - 1, 2, 1, SK.hair);
  p.rect(6, y + 3, 6, 6, SK.skin);
  p.rect(3, y + 3, 5, 5, SK.hair);
  p.rect(4, y + 7, 2, 2, SK.skinD);
  p.set(10, y + 5, SK.eye);
  paintAge(p, y);
  p.set(11, y + 6, SK.skinD);
  p.set(9, y + 7, SK.blush);
  p.set(10, y + 8, SK.mouth);
  p.rect(4, y + 10, 7, 8, SK.shirt);
  p.rect(4, y + 10, 6, 1, SK.shirtL);
  p.rect(4, y + 16, 7, 2, SK.shirtD);
  if (pose === 'lift') {
    p.rect(8, y + 2, 2, 8, SK.shirt);
    p.set(9, y + 2, SK.skin);
    p.rect(3, y + 1, 10, 2, SK.bar);
    p.rect(2, y, 2, 4, SK.barD);
    p.rect(12, y, 2, 4, SK.barD);
  } else if (pose === 'cook') {
    p.rect(10, y + 9, 4, 2, SK.shirt);
    p.set(13, y + 9, SK.skin);
    p.rect(14, y + 7, 1, 3, SK.spoon);
    p.set(14, y + 6, SK.wood);
  } else if (pose === 'eat') {
    p.rect(9, y + 7, 3, 2, SK.shirt);
    p.set(11, y + 7, SK.skin);
    p.set(12, y + 7, SK.food);
  } else if (pose === 'type') {
    p.rect(9, y + 13, 4, 2, SK.shirtD);
    p.rect(12, y + 14, 2, 1, SK.skin);
  } else {
    p.rect(9, y + 11 + st.ar, 2, 6, SK.shirt);
    p.set(10, y + 16 + st.ar, SK.skin);
  }
  if (sit) {
    p.rect(4, y + 18, 8, 3, SK.pant);
    p.rect(10, y + 20, 3, 2, SK.shoe);
  } else {
    p.rect(4, y + 18 + st.l, 3, 6, SK.pantD);
    p.rect(7, y + 18 + st.r, 3, 6, SK.pant);
    p.rect(4, y + 24 + st.l, 3, 2, SK.shoe);
    p.rect(7, y + 24 + st.r, 3, 2, SK.shoe);
    p.set(7, y + 24 + st.r, SK.shoeL);
  }
}

export function paintSleep(frame) {
  const p = makeBuf(32, 16);
  p.rect(1, 3, 9, 9, '#efe4d4');
  p.rect(2, 4, 7, 7, '#fffaf3');
  p.rect(3, 5, 6, 6, SK.skin);
  p.rect(3, 4, 6, 3, SK.hair);
  if (AGE >= 2) p.set(5, 4, '#8d8680');
  if (AGE >= 3) p.set(6, 4, '#b7b1a8');
  p.rect(3, 6, 2, 3, SK.hair);
  p.rect(5, 7, 3, 1, SK.eye);
  p.set(8, 8, SK.blush);
  p.rect(9, 4, 21, 8, frame ? '#c45c48' : '#b6523e');
  p.rect(9, 4, 21, 2, '#f0d2b4');
  p.rect(14, 8, 5, 2, '#f0d2b4');
  p.rect(22, 7, 4, 2, '#e7b89a');
  return p;
}

export const actorCache = new Map();

export function spriteFromBuf(p, footX, footY) {
  const cv = document.createElement('canvas');
  cv.width = p.w + 2;
  cv.height = p.h + 2;
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  p.flush(ctx, 1, 1);
  cv.footX = footX;
  cv.footY = footY;
  return cv;
}

export function mirrorSprite(src) {
  const cv = document.createElement('canvas');
  cv.width = src.width;
  cv.height = src.height;
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.translate(src.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(src, 0, 0);
  cv.footX = src.width - 1 - src.footX;
  cv.footY = src.footY;
  return cv;
}

export function actorSprite(pose, dir, frame) {
  AGE = ageStage();
  const face = dir === 'left' ? 'right' : (dir || 'down');
  const key = AGE + ':' + pose + ':' + face + ':' + frame;
  if (!actorCache.has(key)) {
    let p;
    if (pose === 'sleep') p = paintSleep(frame);
    else {
      p = makeBuf(16, 32);
      if (face === 'up') paintBack(p, pose, frame);
      else if (face === 'right') paintSide(p, pose, frame);
      else paintFront(p, pose, frame);
    }
    const footX = pose === 'sleep' ? 17 : 9;
    const footY = pose === 'sleep' ? 10 : 28;
    actorCache.set(key, spriteFromBuf(p, footX, footY));
  }
  const spr = actorCache.get(key);
  if (dir !== 'left' || pose === 'sleep') return spr;
  const mk = key + ':L';
  if (!actorCache.has(mk)) actorCache.set(mk, mirrorSprite(spr));
  return actorCache.get(mk);
}

export function sprite(w, h, fn) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const box = function (x, y, bw, bh, col) { ctx.fillStyle = col; ctx.fillRect(x, y, bw, bh); };
  fn(ctx, box);
  return cv;
}

export function paintBed(ctx, box) {
  box(0, 6, 48, 8, '#7a4930');
  box(2, 7, 44, 3, '#c48958');
  box(0, 12, 4, 26, '#6b412c');
  box(44, 12, 4, 26, '#6b412c');
  box(4, 28, 40, 8, '#8a5640');
  box(4, 16, 40, 16, '#c45c48');
  box(4, 16, 40, 3, '#a34838');
  box(8, 20, 8, 3, '#f0d2b4');
  box(22, 24, 10, 3, '#f0d2b4');
  box(34, 20, 6, 2, '#f0d2b4');
  box(6, 12, 16, 8, '#fff7ee');
  box(26, 12, 16, 8, '#f4e7d6');
  box(8, 14, 5, 2, '#e7d3c2');
  box(28, 14, 5, 2, '#e7d3c2');
  box(4, 30, 40, 2, '#f2e0cc');
}

export function paintWardrobe(ctx, box) {
  box(1, 4, 30, 36, '#8a5a34');
  box(2, 2, 28, 6, '#6b4128');
  box(3, 8, 26, 28, '#a86b3c');
  box(16, 8, 1, 28, '#6b4128');
  box(5, 10, 9, 16, '#d8c4a4');
  box(18, 10, 9, 16, '#c4b090');
  box(6, 11, 7, 6, '#e7f2f4');
  box(13, 18, 1, 3, '#f0d48a');
  box(18, 18, 1, 3, '#f0d48a');
  box(4, 32, 10, 3, '#c48958');
  box(18, 32, 10, 3, '#c48958');
}

export function paintNightstand(ctx, box) {
  box(1, 10, 14, 12, '#a86b3c');
  box(2, 12, 12, 4, '#c48958');
  box(6, 13, 2, 2, '#f0d48a');
  box(4, 8, 8, 3, '#6b4128');
  box(5, 4, 6, 5, isNight() ? '#ffe7a2' : '#f3d48a');
  box(6, 5, 4, 2, '#fff6d2');
  box(7, 2, 2, 3, '#8a5a34');
}

export function paintFridge(ctx, box) {
  box(2, 4, 28, 34, '#f4f1ea');
  box(2, 4, 28, 4, '#d9d3c8');
  box(3, 10, 26, 1, '#c8c0b4');
  box(24, 12, 2, 8, '#b7c4c8');
  box(24, 24, 2, 8, '#b7c4c8');
  box(6, 14, 6, 5, '#f2d56a');
  box(8, 16, 3, 2, '#8a9a6a');
  box(16, 22, 4, 4, '#d45a48');
  box(4, 36, 24, 2, '#d0c8bc');
}

export function paintStove(ctx, box) {
  box(0, 6, 32, 16, '#3a3836');
  box(2, 8, 12, 8, '#2a2826');
  box(18, 8, 12, 8, '#2a2826');
  box(4, 10, 8, 4, '#5a5856');
  box(20, 10, 8, 4, '#5a5856');
  box(6, 4, 8, 6, '#c45c48');
  box(8, 2, 4, 3, '#8a4034');
  box(9, 1, 2, 2, '#d7dbe0');
  box(1, 16, 2, 2, '#c9a06a');
  box(8, 16, 2, 2, '#c9a06a');
  box(22, 16, 2, 2, '#c9a06a');
  box(28, 16, 2, 2, '#c9a06a');
}

export function paintCounter(ctx, box) {
  box(0, 8, 64, 14, '#8a5a34');
  box(1, 10, 62, 8, '#a86b3e');
  box(0, 6, 64, 4, '#d7a36a');
  box(0, 6, 64, 1, '#f0d2a4');
  box(4, 12, 14, 5, '#6b4128');
  box(22, 12, 16, 5, '#6b4128');
  box(42, 12, 16, 5, '#6b4128');
  box(6, 2, 10, 5, '#e6c48a');
  box(7, 3, 8, 2, '#f3ddb0');
  box(18, 3, 5, 4, '#6e8f4e');
  box(19, 1, 3, 3, '#8fbf62');
  box(28, 3, 8, 4, '#c45c48');
  box(30, 4, 4, 2, '#e7d3a4');
  box(40, 4, 6, 3, '#f4efe6');
  box(50, 3, 8, 4, '#d7a36a');
  box(52, 1, 4, 3, '#e8e0d4');
}

export function paintCounterEnd(ctx, box) {
  box(0, 4, 16, 16, '#8a5a34');
  box(1, 6, 14, 10, '#a86b3e');
  box(0, 2, 16, 4, '#d7a36a');
  box(0, 2, 16, 1, '#f0d2a4');
  box(4, 4, 8, 3, '#6e8f4e');
}

export function paintTable(ctx, box) {
  box(2, 6, 28, 20, '#a86b3c');
  box(4, 8, 24, 14, '#f6edd8');
  box(4, 8, 24, 2, '#e7c9a0');
  box(6, 12, 8, 6, '#f7f4ee');
  box(7, 13, 6, 4, '#e7b98a');
  box(18, 12, 6, 5, '#c45c48');
  box(19, 11, 4, 2, '#f4efe6');
  box(20, 8, 2, 3, '#6e8f4e');
  box(1, 22, 3, 6, '#6b4128');
  box(28, 22, 3, 6, '#6b4128');
}

export function paintSofa(ctx, box) {
  box(0, 2, 64, 8, '#4f6a3c');
  box(2, 4, 60, 4, '#6d8b50');
  box(0, 10, 6, 14, '#5e7a46');
  box(58, 10, 6, 14, '#5e7a46');
  box(6, 10, 52, 12, '#7ea062');
  box(8, 12, 14, 8, '#d8c4a0');
  box(26, 12, 14, 8, '#c45c48');
  box(44, 12, 12, 8, '#f0e2c4');
  box(2, 22, 3, 4, '#6b4128');
  box(59, 22, 3, 4, '#6b4128');
}

export function paintShelf(ctx, box) {
  box(0, 4, 32, 22, '#6b4128');
  box(2, 6, 28, 18, '#a86b3c');
  const spines = ['#c45c48', '#e6c56a', '#6e8f4e', '#5e86a8', '#f4efe6', '#a85a8a', '#d9894a', '#3d4c74'];
  for (let i = 0; i < 8; i++) box(3 + i * 3, 8, 2, 6, spines[i]);
  for (let i = 0; i < 7; i++) box(4 + i * 3, 16, 2, 6, spines[(i + 3) % spines.length]);
}

export function paintBarbell(ctx, box) {
  box(2, 2, 4, 12, '#6b4128');
  box(26, 2, 4, 12, '#6b4128');
  box(4, 4, 24, 3, '#8a5a34');
  box(6, 5, 6, 6, '#5a626a');
  box(20, 5, 6, 6, '#5a626a');
  box(8, 8, 16, 2, SK.bar);
}

export function paintDesk(ctx, box) {
  const night = isNight();
  box(0, 12, 48, 14, '#8a5a34');
  box(1, 14, 46, 8, '#a86b3e');
  box(0, 10, 48, 4, '#d7a36a');
  box(0, 10, 48, 1, '#f0d2a4');
  box(6, 2, 16, 10, '#2c3438');
  box(7, 3, 14, 8, night ? '#9ad4ff' : '#8fd0c4');
  box(8, 4, 4, 2, night ? '#e7f6ff' : '#d7f4ee');
  box(14, 8, 4, 2, '#2a4a44');
  box(18, 14, 12, 2, '#4a4038');
  box(20, 15, 8, 1, '#c9b8a4');
  box(30, 4, 6, 6, night ? '#ffe7a2' : '#f3d48a');
  box(31, 5, 4, 3, '#fff6d2');
  box(32, 2, 2, 3, '#6b4128');
  box(38, 12, 6, 4, '#f4efe6');
  box(39, 11, 4, 2, '#c45c48');
}

export function paintBookcase(ctx, box) {
  box(0, 2, 32, 38, '#6b4128');
  box(2, 4, 28, 34, '#a86b3c');
  const spines = ['#c45c48', '#e6c56a', '#6e8f4e', '#5e86a8', '#f4efe6', '#a85a8a', '#d9894a', '#3d4c74', '#e7d3a4'];
  for (let row = 0; row < 4; row++) {
    for (let i = 0; i < 8; i++) box(3 + i * 3, 6 + row * 8, 2, 6, spines[(i + row * 2) % spines.length]);
  }
}

export function paintPlant(ctx, box) {
  box(4, 16, 8, 8, '#c46a3c');
  box(3, 15, 10, 2, '#a85630');
  box(5, 18, 6, 4, '#e7b08a');
  box(6, 8, 4, 8, '#3e7a32');
  box(3, 6, 5, 5, '#4e9440');
  box(8, 4, 5, 6, '#6eb854');
  box(5, 3, 4, 4, '#8fd06a');
  box(7, 2, 2, 2, '#d7f0b0');
}

export function paintPlant2(ctx, box) {
  box(4, 14, 8, 8, '#f4efe6');
  box(5, 16, 6, 4, '#e7d8c4');
  box(2, 8, 12, 6, '#5aa24a');
  box(4, 4, 8, 6, '#7bc062');
  box(6, 2, 4, 3, '#c6e88a');
  box(3, 6, 2, 2, '#e86d8c');
  box(11, 5, 2, 2, '#f0d15e');
}

export function paintMailbox(ctx, box) {
  box(7, 10, 3, 14, '#6b4128');
  box(2, 6, 12, 8, '#c45c48');
  box(2, 6, 12, 2, '#e7d3a4');
  box(11, 8, 4, 2, '#f2d56a');
  box(4, 9, 5, 3, '#f4efe6');
}

export function paintBench(ctx, box) {
  box(1, 6, 30, 5, '#c48958');
  box(1, 6, 30, 1, '#f0d2a4');
  box(2, 8, 28, 1, '#8a5a34');
  box(2, 12, 3, 6, '#6b4128');
  box(27, 12, 3, 6, '#6b4128');
  box(14, 12, 3, 5, '#6b4128');
}

export function paintGarden(ctx, box) {
  box(1, 8, 46, 24, '#6b442c');
  box(3, 10, 42, 20, '#8a5a38');
  box(4, 12, 40, 4, '#6b442c');
  box(4, 20, 40, 3, '#6b442c');
  for (let i = 0; i < 6; i++) {
    box(6 + i * 6, 14, 2, 4, '#4e9440');
    box(5 + i * 6, 12, 4, 3, '#6eb854');
  }
  box(8, 22, 3, 3, '#d45a48');
  box(20, 24, 3, 3, '#e6b15a');
  box(32, 22, 4, 3, '#6e8f4e');
  box(36, 16, 3, 3, '#f0d15e');
}

export function paintRug(ctx, box, w, h, a, b, edge) {
  box(0, 0, w, h, a);
  box(0, 0, w, 2, edge);
  box(0, h - 2, w, 2, edge);
  box(0, 0, 2, h, edge);
  box(w - 2, 0, 2, h, edge);
  box(3, 3, w - 6, h - 6, b);
  for (let y = 6; y < h - 4; y += 5) box(5, y, w - 10, 1, edge);
}

export function paintMat(ctx, box) {
  box(0, 0, 48, 32, '#6e8f55');
  box(2, 2, 44, 28, '#87a86a');
  box(0, 0, 48, 2, '#c9a06a');
  box(0, 30, 48, 2, '#c9a06a');
  box(0, 0, 2, 32, '#c9a06a');
  box(46, 0, 2, 32, '#c9a06a');
  box(8, 8, 10, 16, '#5e7a46');
  box(30, 8, 10, 16, '#5e7a46');
}

export function paintGate(ctx) {
  ctx.fillStyle = '#6b4428';
  ctx.fillRect(0, 0, 3, 16);
  ctx.fillRect(13, 0, 3, 16);
  ctx.fillStyle = '#e7c48a';
  ctx.fillRect(1, 2, 1, 12);
  ctx.fillRect(14, 2, 1, 12);
  ctx.fillStyle = '#8d5a38';
  ctx.fillRect(3, 7, 10, 2);
}

export function paintComputer(ctx, box) {
  box(2, 4, 12, 8, '#2c3a4a');
  box(3, 5, 10, 6, '#8fd0e8');
  box(6, 12, 4, 2, '#6b4128');
  box(4, 14, 8, 1, '#3c2a22');
}

export function paintPhone(ctx, box) {
  box(5, 2, 6, 12, '#2a241e');
  box(6, 3, 4, 8, '#9fd0c2');
  box(7, 12, 2, 1, '#d7ecb0');
}

export function paintGuitarItem(ctx, box) {
  box(7, 1, 2, 8, '#c48958');
  box(6, 8, 4, 2, '#8a5a34');
  box(4, 10, 8, 5, '#e0a060');
  box(6, 12, 4, 2, '#5a3824');
  box(7, 11, 2, 2, '#2a241e');
}

export function paintRack(ctx, box) {
  box(2, 4, 2, 10, '#5a626a');
  box(12, 4, 2, 10, '#5a626a');
  box(2, 6, 12, 2, '#b7c0c8');
  box(4, 3, 3, 3, '#8f3d2c');
  box(9, 3, 3, 3, '#8f3d2c');
}

export function paintCushion(ctx, box) {
  box(2, 6, 12, 6, '#c46a58');
  box(3, 7, 10, 4, '#e7a090');
}

export function paintGadget(ctx, box) {
  box(3, 4, 10, 8, '#d46a45');
  box(5, 6, 6, 4, '#f6e3cc');
  box(6, 7, 2, 2, '#5e93a8');
}

export function paintDoormat(ctx, box) {
  box(2, 4, 12, 8, '#8a4a3a');
  box(3, 5, 10, 6, '#c46a4a');
  box(4, 7, 8, 1, '#f0d2b4');
}

export function paintChair(ctx, box) {
  box(3, 2, 10, 3, '#6b4128');
  box(4, 5, 8, 7, '#c48958');
  box(2, 12, 2, 3, '#6b4128');
  box(12, 12, 2, 3, '#6b4128');
}

export let ART = null;

export function buildProps() {
  return {
    bed: sprite(48, 40, paintBed),
    wardrobe: sprite(32, 42, paintWardrobe),
    nightstand: sprite(16, 24, paintNightstand),
    fridge: sprite(32, 40, paintFridge),
    stove: sprite(32, 24, paintStove),
    counter: sprite(64, 24, paintCounter),
    counterEnd: sprite(16, 22, paintCounterEnd),
    table: sprite(32, 30, paintTable),
    sofa: sprite(64, 28, paintSofa),
    shelf: sprite(32, 28, paintShelf),
    barbell: sprite(32, 16, paintBarbell),
    desk: sprite(48, 30, paintDesk),
    bookcase: sprite(32, 42, paintBookcase),
    plant: sprite(16, 30, paintPlant),
    plant2: sprite(16, 26, paintPlant2),
    mailbox: sprite(16, 26, paintMailbox),
    bench: sprite(32, 20, paintBench),
    garden: sprite(48, 34, paintGarden),
    rugBed: sprite(80, 32, function (ctx, box) { paintRug(ctx, box, 80, 32, '#a85a48', '#c46a58', '#f0d2b4'); }),
    rugLive: sprite(64, 32, function (ctx, box) { paintRug(ctx, box, 64, 32, '#6e8a48', '#87a45e', '#e7d3a4'); }),
    rugStudy: sprite(64, 32, function (ctx, box) { paintRug(ctx, box, 64, 32, '#8d6244', '#a87852', '#f0d8b0'); }),
    rugKit: sprite(64, 16, function (ctx, box) { paintRug(ctx, box, 64, 16, '#8a4034', '#b85242', '#f0d2b4'); }),
    mat: sprite(48, 32, paintMat),
    doormat: sprite(16, 16, paintDoormat),
    chairDesk: sprite(16, 16, paintChair),
    chairEat: sprite(16, 16, paintChair),
    computer: sprite(16, 16, paintComputer),
    phone: sprite(16, 16, paintPhone),
    guitarItem: sprite(16, 16, paintGuitarItem),
    rack: sprite(16, 16, paintRack),
    cushion: sprite(16, 16, paintCushion),
    gadget: sprite(16, 16, paintGadget)
  };
}

export function paintTree(ctx, box, kind) {
  box(8, 31, 10, 3, 'rgba(40,30,20,0.28)');
  box(11, 22, 4, 12, '#6b442c');
  box(12, 22, 1, 12, '#a86b44');
  const g0 = kind === 2 ? '#6a8a48' : '#2f6a32';
  const g1 = kind === 2 ? '#7aa45a' : '#3f8a3c';
  const g2 = kind === 2 ? '#9bc46e' : '#63b050';
  const g3 = kind === 2 ? '#d7e8a8' : '#c6e88a';
  box(4, 16, 18, 10, g0);
  box(2, 12, 22, 8, g1);
  box(5, 7, 16, 8, g2);
  box(8, 4, 10, 5, g2);
  box(6, 8, 3, 2, g3);
  box(14, 11, 3, 2, g3);
  if (kind === 1) {
    box(6, 12, 2, 2, '#e06a6a');
    box(16, 9, 2, 2, '#e06a6a');
    box(10, 14, 2, 2, '#f0d15e');
  }
  if (kind === 2) {
    box(5, 10, 2, 2, '#f4a0b8');
    box(15, 8, 2, 2, '#f7c2d2');
    box(11, 13, 2, 2, '#f4a0b8');
  }
}

export function buildTrees() {
  const out = [];
  for (let i = 0; i < 3; i++) out.push(sprite(26, 36, function (ctx, box) { paintTree(ctx, box, i); }));
  return out;
}

export function ensureArt() {
  const night = isNight() ? 1 : 0;
  if (!ART) ART = {night:-1, props:null, trees:null};
  if (ART.night !== night) {
    ART.night = night;
    ART.props = buildProps();
    if (!ART.trees) ART.trees = buildTrees();
  }
}
