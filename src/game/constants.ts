export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 800;

export const PLAYER_SIZE = 48;
export const OBSTACLE_SIZE = 40;

// Player physics
export const PLAYER_ACCELERATION = 1800; // px/s²
export const PLAYER_MAX_SPEED = 420; // px/s
export const PLAYER_FRICTION = 6; // deceleration multiplier (higher = more friction)

// Dash
export const DASH_SPEED = 900; // px/s impulse
export const DASH_DURATION = 0.12; // seconds
export const ENERGY_FILL_TIME = 4; // seconds to fully charge

// Obstacles
export const OBSTACLE_BASE_SPEED = 200; // px/s
export const OBSTACLE_SPEED_INCREASE = 15; // per second of game time
export const INITIAL_SPAWN_INTERVAL = 1.2; // seconds
export const MIN_SPAWN_INTERVAL = 0.18;
export const INITIAL_OBSTACLES_PER_SPAWN = 1;
export const MAX_OBSTACLES_PER_SPAWN = 6;

// Collision shrink factor (forgiving hitbox)
export const HITBOX_SHRINK = 0.55;
