import { TILE, SCALE, COLS, ROWS } from './constants.js';

export const canvas = document.querySelector('#world');
canvas.width = COLS * TILE * SCALE;
canvas.height = ROWS * TILE * SCALE;
export const g = canvas.getContext('2d');
g.imageSmoothingEnabled = false;
export const W = canvas.width;
export const H = canvas.height;
