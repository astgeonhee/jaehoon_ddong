export interface Player {
  x: number;
  y: number;
  vx: number;
  lastDir: number; // -1 left, 1 right
  isDashing: boolean;
  dashTimer: number;
  energy: number; // 0..1
}

export interface Obstacle {
  x: number;
  y: number;
  speed: number;
  size: number;
}

export type GameState = 'menu' | 'playing' | 'gameover';
