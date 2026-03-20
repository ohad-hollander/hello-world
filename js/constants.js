// js/constants.js
// All game constants — single source of truth for all modules

// Canvas / logical dimensions
const LOGICAL_WIDTH  = 672;   // 224 x 3
const LOGICAL_HEIGHT = 768;   // 256 x 3

// Game loop
const FIXED_STEP = 1 / 60;   // 60 Hz update rate

// Layout
const GROUND_LINE    = 720;   // y coordinate of the ground line (player sits just above)
const HUD_HEIGHT     = 80;    // px reserved at top for score/lives

// Player
const PLAYER_W       = 48;
const PLAYER_H       = 24;
const PLAYER_SPEED   = 180;   // px/sec
const PLAYER_START_X = 312;   // left edge (center = 336)
const PLAYER_START_Y = 690;
const PLAYER_BULLET_SPEED = 480; // px/sec upward (stored as positive, applied as negative)
const PLAYER_BULLET_W = 4;
const PLAYER_BULLET_H = 12;

// Alien formation
const FORMATION_LEFT   = 60;
const FORMATION_TOP    = 120;
const ALIEN_CELL_W     = 48;
const ALIEN_CELL_H     = 48;
const ALIEN_W          = 36;
const ALIEN_H          = 24;
const ALIEN_ROWS       = 5;
const ALIEN_COLS       = 11;

// Alien march
const MARCH_DX         = 6;    // px per step
const MARCH_DY         = 24;   // px to step down at wall
const MARCH_LEFT_BOUND = 24;   // left boundary for formation
const MARCH_RIGHT_BOUND = 648; // right boundary for formation

// Alien bullets
const MAX_ALIEN_BULLETS     = 3;
const ALIEN_BULLET_SPEED    = 240; // px/sec downward
const ALIEN_BULLET_W        = 4;
const ALIEN_BULLET_H        = 12;

// Scoring
const ROW_POINTS = [30, 20, 20, 10, 10]; // index = row (0=top, 4=bottom)
