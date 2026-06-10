export const CLOUD_COUNT = 40;
export const GRID_COLS = 8;
export const GRID_ROWS = 5;

export const START_SCORE = 9999;
export const SCORE_DECREMENT = 5;
export const MIN_SCORE = 1;

export const TOTAL_TIME_SECONDS = 10 * 60;

export const KITTY_SPEED = 30;
export const KITTY_Z = 10;
export const CAMERA_DISTANCE = 32;
export const CHECK_RADIUS = 10;

export const FIELD = {
  minX: -62,
  maxX: 62,
  minY: 2,
  maxY: 58
};

export const DEBUG =
  import.meta.env.VITE_DEBUG === '1' ||
  new URLSearchParams(window.location.search).has('debug');
