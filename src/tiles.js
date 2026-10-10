import { TILE } from './constants.js';
import { cell } from './map.js';
import { paintGate, sprite } from './sprites.js';
import { isNight } from './util.js';

export function tileHash(col, row) {
  let x = Math.imul((col + 1) ^ ((row + 3) * 131), 2246822519);
  x = Math.imul(x ^ (x >>> 13), 3266489917);
  return (x ^ (x >>> 16)) >>> 0;
}

export const cellCache = new Map();

export function paintFlower(ctx, x, y, col) {
  ctx.fillStyle = '#3e7a32';
  ctx.fillRect(x + 1, y + 2, 1, 3);
  ctx.fillStyle = col;
  ctx.fillRect(x, y, 3, 2);
  ctx.fillStyle = '#fff3c4';
  ctx.fillRect(x + 1, y, 1, 1);
}

export function paintGrass(ctx, col, row, flowers) {
  const h = tileHash(col, row);
  ctx.fillStyle = ['#63a246', '#57963c', '#70b250'][h % 3];
  ctx.fillRect(0, 0, 16, 16);
  ctx.fillStyle = '#4c8634';
  for (let i = 0; i < 5; i++) ctx.fillRect((h >> (i * 3)) & 13, (h >> (i + 2)) & 13, 1, 2);
  ctx.fillStyle = '#9ad46e';
  ctx.fillRect(h % 13, (h >> 5) % 13, 1, 1);
  if (!flowers) return;
  const cols = ['#e86d8c', '#f0d15e', '#f7f3ea', '#d7a0e4', '#ef8a4a'];
  if (h % 4 === 0) paintFlower(ctx, 3 + (h % 7), 4 + ((h >> 3) % 6), cols[h % 5]);
  if (h % 9 === 0) paintFlower(ctx, 9, 9, cols[(h >> 4) % 5]);
}

export function paintPath(ctx, col, row) {
  paintGrass(ctx, col, row, false);
  const h = tileHash(col, row);
  ctx.fillStyle = '#d9c29a';
  ctx.fillRect(1, 2, 6, 5);
  ctx.fillRect(8, 8, 7, 5);
  if (h % 2 === 0) ctx.fillRect(3, 9, 4, 3);
  ctx.fillStyle = '#b89a72';
  ctx.fillRect(1, 6, 6, 1);
  ctx.fillRect(8, 12, 7, 1);
  ctx.fillStyle = '#f2e4c8';
  ctx.fillRect(2, 3, 2, 1);
  ctx.fillRect(10, 9, 2, 1);
}

export function paintWood(ctx, col, row, kind) {
  const bases = {
    bed:['#e6c08a', '#d7ae78', '#efd0a0'],
    live:['#e0b56e', '#d4a45c', '#c99555']
  };
  const lines = {bed:'#b4834e', live:'#a87440'};
  const h = tileHash(col, row);
  ctx.fillStyle = bases[kind][h % 3];
  ctx.fillRect(0, 0, 16, 16);
  ctx.fillStyle = lines[kind];
  const shift = (col * 3 + row) % 5;
  for (let y = shift; y < 16; y += 5) ctx.fillRect(0, y, 16, 1);
  const cut = (h % 14) + 1;
  ctx.fillRect(cut, 0, 1, 16);
  if (h % 6 === 0) {
    ctx.fillStyle = 'rgba(120,72,32,0.35)';
    ctx.fillRect(3 + (h % 8), 7, 2, 2);
  }
}

export function paintKitchen(ctx, col, row) {
  for (let y = 0; y < 16; y += 4) {
    for (let x = 0; x < 16; x += 4) {
      const alt = ((x + y) / 4 + col + row) % 2 === 0;
      ctx.fillStyle = alt ? '#f7ecd4' : '#e7d3ae';
      ctx.fillRect(x, y, 4, 4);
      ctx.fillStyle = '#d2bc96';
      ctx.fillRect(x, y, 4, 1);
      ctx.fillRect(x, y, 1, 4);
    }
  }
}

export function paintCarpet(ctx, col, row) {
  const h = tileHash(col, row);
  ctx.fillStyle = ['#7f8f5e', '#738454', '#8b9a68'][h % 3];
  ctx.fillRect(0, 0, 16, 16);
  ctx.fillStyle = 'rgba(255,248,230,0.16)';
  for (let i = (h % 3); i < 16; i += 4) ctx.fillRect(i, 0, 1, 16);
  ctx.fillStyle = 'rgba(50,40,20,0.18)';
  for (let y = 3; y < 16; y += 5) ctx.fillRect(0, y, 16, 1);
}

export function paintWindow(ctx) {
  ctx.fillStyle = '#5c3a28';
  ctx.fillRect(2, 3, 12, 10);
  ctx.fillStyle = isNight() ? '#1b2b4a' : '#b7e4ee';
  ctx.fillRect(3, 4, 10, 8);
  if (!isNight()) {
    ctx.fillStyle = '#f4fcff';
    ctx.fillRect(4, 5, 2, 2);
  } else {
    ctx.fillStyle = '#f4e6b0';
    ctx.fillRect(10, 5, 1, 1);
  }
  ctx.fillStyle = '#f3e6cf';
  ctx.fillRect(7, 4, 1, 8);
  ctx.fillRect(3, 8, 10, 1);
  ctx.fillStyle = '#c45448';
  ctx.fillRect(3, 4, 2, 8);
  ctx.fillRect(11, 4, 2, 8);
}

export function paintPicture(ctx, col) {
  ctx.fillStyle = '#6b4228';
  ctx.fillRect(3, 5, 10, 8);
  ctx.fillStyle = col % 2 ? '#7eb0c8' : '#f0d78a';
  ctx.fillRect(4, 6, 8, 6);
  ctx.fillStyle = col % 2 ? '#3f7a48' : '#c45c3c';
  ctx.fillRect(4, 9, 8, 3);
  ctx.fillStyle = '#fff8ee';
  ctx.fillRect(6, 7, 2, 2);
}

export function paintClock(ctx) {
  ctx.fillStyle = '#6b4228';
  ctx.fillRect(4, 4, 8, 8);
  ctx.fillStyle = '#f7f1e4';
  ctx.fillRect(5, 5, 6, 6);
  ctx.fillStyle = '#2a211c';
  ctx.fillRect(8, 6, 1, 3);
  ctx.fillRect(8, 8, 2, 1);
}

export function paintSconce(ctx) {
  ctx.fillStyle = '#8a5a32';
  ctx.fillRect(7, 9, 2, 3);
  ctx.fillStyle = isNight() ? '#ffe7a8' : '#f3d48a';
  ctx.fillRect(4, 6, 8, 4);
  ctx.fillStyle = '#fff6d4';
  ctx.fillRect(6, 7, 4, 2);
}

export function paintWall(ctx, col, row) {
  const key = col + ',' + row;
  if (row === 12) {
    ctx.fillStyle = '#e7c89a';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#c9a06a';
    for (let y = 2; y < 14; y += 4) ctx.fillRect(0, y, 16, 1);
    ctx.fillStyle = '#8d5a34';
    ctx.fillRect(0, 0, 16, 2);
    ctx.fillStyle = '#6b4128';
    ctx.fillRect(0, 14, 16, 2);
    ctx.fillStyle = '#f6e6cc';
    ctx.fillRect(0, 2, 16, 1);
  } else if (row === 0 || col === 0 || col === 21) {
    ctx.fillStyle = '#ecd4b4';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#6e4330';
    ctx.fillRect(0, 0, 16, 3);
    ctx.fillStyle = '#c48a56';
    ctx.fillRect(0, 3, 16, 1);
    ctx.fillStyle = '#c9a278';
    ctx.fillRect(0, 13, 16, 3);
    if (col === 0) { ctx.fillStyle = '#6e4330'; ctx.fillRect(0, 0, 3, 16); }
    if (col === 21) { ctx.fillStyle = '#6e4330'; ctx.fillRect(13, 0, 3, 16); }
  } else {
    ctx.fillStyle = '#f6e6ce';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#7a4e32';
    ctx.fillRect(0, 0, 16, 3);
    ctx.fillStyle = '#e0b072';
    ctx.fillRect(0, 3, 16, 1);
    ctx.fillStyle = '#e4c8a4';
    ctx.fillRect(0, 13, 16, 3);
    ctx.fillStyle = '#b48458';
    ctx.fillRect(0, 15, 16, 1);
    if ((col + row) % 4 === 0) {
      ctx.fillStyle = '#c4956a';
      ctx.fillRect(0, 4, 2, 9);
    }
  }
  if (['3,0','7,0','13,0','17,0','2,12','8,12','15,12','18,12'].indexOf(key) >= 0) paintWindow(ctx);
  if (['3,6','14,6'].indexOf(key) >= 0) paintPicture(ctx, col);
  if (key === '8,6') paintClock(ctx);
  if (['5,6','16,0','4,12','18,6'].indexOf(key) >= 0) paintSconce(ctx);
}

export function paintFence(ctx, col) {
  const vertical = col === 0 || col === 21;
  ctx.fillStyle = '#c4894e';
  ctx.fillStyle = '#b67a42';
  if (vertical) {
    ctx.fillRect(3, 0, 3, 16);
    ctx.fillRect(9, 0, 3, 16);
    ctx.fillStyle = '#8a542c';
    ctx.fillRect(5, 0, 1, 16);
    ctx.fillRect(11, 0, 1, 16);
    ctx.fillStyle = '#6b4128';
    ctx.fillRect(6, 1, 3, 4);
    ctx.fillRect(6, 9, 3, 5);
    ctx.fillStyle = '#e2b56a';
    ctx.fillRect(6, 2, 1, 3);
  } else {
    ctx.fillStyle = '#c48a4e';
    ctx.fillRect(0, 3, 16, 3);
    ctx.fillRect(0, 9, 16, 3);
    ctx.fillStyle = '#8a542c';
    ctx.fillRect(0, 5, 16, 1);
    ctx.fillRect(0, 11, 16, 1);
    ctx.fillStyle = '#6b4128';
    ctx.fillRect(1, 0, 3, 16);
    ctx.fillStyle = '#e2b56a';
    ctx.fillRect(2, 1, 1, 14);
  }
}

export function paintDoor(ctx, col, row) {
  const ns = cell(col, row - 1) !== '#' && cell(col, row + 1) !== '#';
  const near = [cell(col - 1, row), cell(col + 1, row), cell(col, row - 1), cell(col, row + 1)];
  if (near.indexOf('B') >= 0 && near.indexOf('A') < 0 && near.indexOf('S') < 0) paintKitchen(ctx, col, row);
  else if (near.indexOf('S') >= 0 && near.indexOf('C') < 0 && near.indexOf('B') < 0) paintCarpet(ctx, col, row);
  else if (near.indexOf('G') >= 0 || near.indexOf('P') >= 0) paintWood(ctx, col, row, 'live');
  else if (near.indexOf('A') >= 0) paintWood(ctx, col, row, 'bed');
  else paintWood(ctx, col, row, 'live');
  ctx.fillStyle = '#5c3a28';
  if (ns) {
    ctx.fillRect(0, 0, 2, 16);
    ctx.fillRect(14, 0, 2, 16);
    ctx.fillStyle = '#a86b3c';
    ctx.fillRect(11, 1, 3, 14);
    ctx.fillStyle = '#c48958';
    ctx.fillRect(11, 2, 3, 1);
    ctx.fillStyle = '#f0d48a';
    ctx.fillRect(12, 8, 1, 1);
    ctx.fillStyle = '#8a6240';
    ctx.fillRect(2, 14, 9, 2);
  } else {
    ctx.fillRect(0, 0, 16, 2);
    ctx.fillRect(0, 14, 16, 2);
    ctx.fillStyle = '#a86b3c';
    ctx.fillRect(1, 2, 5, 12);
    ctx.fillStyle = '#c48958';
    ctx.fillRect(1, 3, 5, 1);
    ctx.fillStyle = '#f0d48a';
    ctx.fillRect(4, 8, 1, 1);
  }
}

export function paintCell(ctx, col, row) {
  const ch = cell(col, row);
  if (ch === '#') paintWall(ctx, col, row);
  else if (ch === 'F') { paintGrass(ctx, col, row, false); paintFence(ctx, col); }
  else if (ch === 'G' || ch === '*') paintGrass(ctx, col, row, true);
  else if (ch === 'P') paintPath(ctx, col, row);
  else if (ch === '+') paintDoor(ctx, col, row);
  else if (ch === 'X') { paintPath(ctx, col, row); paintGate(ctx); }
  else if (ch === 'A') paintWood(ctx, col, row, 'bed');
  else if (ch === 'B') paintKitchen(ctx, col, row);
  else if (ch === 'C') paintWood(ctx, col, row, 'live');
  else if (ch === 'S') paintCarpet(ctx, col, row);
  else paintWall(ctx, col, row);
  if ('ABCSGP*+'.indexOf(ch) >= 0 && cell(col, row - 1) === '#') {
    ctx.fillStyle = 'rgba(72, 42, 24, 0.20)';
    ctx.fillRect(0, 0, 16, 3);
  }
}

export function cellSprite(col, row) {
  const key = (isNight() ? 'n' : 'd') + ':' + col + ':' + row;
  let spr = cellCache.get(key);
  if (spr) return spr;
  spr = sprite(TILE, TILE, function (ctx) { paintCell(ctx, col, row); });
  cellCache.set(key, spr);
  return spr;
}
