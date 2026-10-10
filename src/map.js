import { COLS, ROWS, TILE } from './constants.js';
import { s } from './state.js';

export const SPOTS = {
  bed: {c:3, r:3, face:'up'},
  fridge: {c:13, r:2, face:'left'},
  stove: {c:14, r:2, face:'up'},
  table: {c:17, r:4, face:'left'},
  desk: {c:15, r:9, face:'up'},
  sofa: {c:2, r:9, face:'up'},
  gym: {c:7, r:10, face:'up'},
  yard: {c:15, r:15, face:'down'},
  gate: {c:5, r:16, face:'down'}
};

// A bedroom, B kitchen, C living, S study, G grass, P path, + door, # wall, F fence.
const grid = [];

for (let r = 0; r < ROWS; r++) {
  const row = [];
  for (let col = 0; col < COLS; col++) row.push('#');
  grid.push(row);
}

export function fill(c0, r0, c1, r1, ch) {
  for (let r = r0; r <= r1; r++) for (let col = c0; col <= c1; col++) grid[r][col] = ch;
}

fill(1, 1, 9, 5, 'A');

fill(11, 1, 20, 5, 'B');

grid[3][10] = '+';

fill(1, 7, 9, 11, 'C');

fill(11, 7, 20, 11, 'S');

grid[6][4] = '+';

grid[6][16] = '+';

grid[9][10] = '+';

grid[12][5] = '+';

fill(1, 13, 20, 16, 'G');

for (let r = 13; r <= 16; r++) { grid[r][0] = 'F'; grid[r][21] = 'F'; }

for (let col = 0; col < COLS; col++) grid[17][col] = 'F';

grid[17][5] = 'X';

for (let r = 13; r <= 16; r++) grid[r][5] = 'P';

for (let col = 5; col <= 16; col++) grid[15][col] = 'P';

export const solids = new Set();

export function occupy(col, row, w, h) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) solids.add((col + x) + ',' + (row + y));
}

occupy(1, 1, 3, 2);

occupy(8, 1, 2, 2);

occupy(5, 1, 1, 1);

occupy(11, 1, 2, 2);

occupy(14, 1, 2, 1);

occupy(17, 1, 4, 1);

occupy(20, 2, 1, 1);

occupy(15, 3, 2, 2);

occupy(1, 8, 4, 1);

occupy(1, 7, 2, 1);

occupy(7, 8, 2, 1);

occupy(14, 8, 3, 1);

occupy(11, 7, 2, 2);

occupy(19, 10, 1, 1);

occupy(19, 4, 1, 1);

occupy(7, 13, 1, 1);

occupy(12, 14, 2, 1);

occupy(8, 13, 3, 2);

[[2, 14], [3, 13], [18, 13], [19, 14]].forEach(function (t) { occupy(t[0], t[1], 1, 1); });

export function cell(col, row) {
  if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return '#';
  return grid[row][col];
}

export function walkable(col, row) {
  const ch = cell(col, row);
  if ('ABCSGP*+X'.indexOf(ch) < 0) return false;
  return !solids.has(col + ',' + row);
}

export function tileOf(x, y) {
  let col = Math.floor(x / TILE);
  let row = Math.floor(y / TILE);
  if (col < 0) col = 0; else if (col >= COLS) col = COLS - 1;
  if (row < 0) row = 0; else if (row >= ROWS) row = ROWS - 1;
  return {c: col, r: row};
}

export function walkableAt(x, y) {
  if (!isFinite(x) || !isFinite(y)) return false;
  const t = tileOf(x, y);
  return walkable(t.c, t.r) && x >= 0 && y >= 0 && x < COLS * TILE && y < ROWS * TILE;
}

export function roomAt(x, y) {
  const t = tileOf(x, y);
  const ch = cell(t.c, t.r);
  if (ch === 'A') return 'bedroom';
  if (ch === 'B') return 'kitchen';
  if (ch === 'C') return 'living';
  if (ch === 'S') return 'study';
  if (ch === 'G' || ch === 'P' || ch === '*') return 'yard';
  return '';
}

export function findPath(c0, r0, c1, r1) {
  if (!walkable(c1, r1)) return null;
  if (c0 === c1 && r0 === r1) return [];
  const prev = new Map();
  const q = [[c0, r0]];
  prev.set(c0 + ',' + r0, null);
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let qi = 0; qi < q.length; qi++) {
    const c = q[qi][0], r = q[qi][1];
    for (let i = 0; i < dirs.length; i++) {
      const nc = c + dirs[i][0], nr = r + dirs[i][1];
      const k = nc + ',' + nr;
      if (prev.has(k) || !walkable(nc, nr)) continue;
      prev.set(k, [c, r]);
      if (nc === c1 && nr === r1) {
        const path = [[nc, nr]];
        let p = [c, r];
        while (p && !(p[0] === c0 && p[1] === r0)) {
          path.push(p);
          p = prev.get(p[0] + ',' + p[1]);
        }
        path.reverse();
        return path;
      }
      q.push([nc, nr]);
    }
  }
  return null;
}

export function goToPlace(place) {
  const spot = SPOTS[place] || SPOTS.bed;
  s.faceGoal = spot.face;
  if (!Array.isArray(s.path)) s.path = [];
  let here = tileOf(s.x, s.y);
  if (!walkable(here.c, here.r)) {
    s.x = (spot.c + 0.5) * TILE;
    s.y = (spot.r + 0.5) * TILE;
    here = {c: spot.c, r: spot.r};
  }
  if (here.c === spot.c && here.r === spot.r) {
    s.x = (spot.c + 0.5) * TILE;
    s.y = (spot.r + 0.5) * TILE;
    s.path = [];
    s.face = spot.face;
    s.moving = false;
  } else {
    const path = findPath(here.c, here.r, spot.c, spot.r);
    if (!path) {
      s.x = (spot.c + 0.5) * TILE;
      s.y = (spot.r + 0.5) * TILE;
      s.path = [];
      s.face = spot.face;
      s.moving = false;
    } else {
      s.path = path;
      s.moving = path.length > 0;
    }
  }
  const rm = roomAt(s.x, s.y);
  if (rm) s.room = rm;
}

export function auditMap() {
  const problems = [];
  Object.keys(SPOTS).forEach(function (name) {
    const sp = SPOTS[name];
    if (!walkable(sp.c, sp.r)) problems.push(name + ' blocked');
    const path = findPath(SPOTS.bed.c, SPOTS.bed.r, sp.c, sp.r);
    if (!path) problems.push(name + ' unreachable');
    else {
      let pc = SPOTS.bed.c, pr = SPOTS.bed.r;
      for (let i = 0; i < path.length; i++) {
        const step = path[i];
        if (Math.abs(step[0] - pc) + Math.abs(step[1] - pr) !== 1) problems.push(name + ' diagonal');
        if (!walkable(step[0], step[1])) problems.push(name + ' bad step');
        pc = step[0];
        pr = step[1];
      }
    }
  });
  [[10, 3], [4, 6], [16, 6], [10, 9], [5, 12]].forEach(function (d) {
    if (cell(d[0], d[1]) !== '+') problems.push('door missing ' + d[0] + ',' + d[1]);
    if (!walkable(d[0], d[1])) problems.push('door blocked ' + d[0] + ',' + d[1]);
  });
  if (problems.length) console.error('map audit: ' + problems.join('; '));
  return problems;
}
