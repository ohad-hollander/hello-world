# Phase 2: Playable Core — Research

**Researched:** 2026-03-20
**Phase:** 02 — Playable Core
**Requirements:** PLAY-01, PLAY-02, PLAY-03, PLAY-04, ALIN-01, ALIN-02, ALIN-03, ALIN-04, ALIN-05, CMBT-01, CMBT-02, CMBT-03, CMBT-04

---

## 1. Architecture: Single File vs. Split Files

**Decision: Split to multiple JS files in Phase 2.**

Phase 1 had ~80 lines. Phase 2 adds: player entity, alien grid (55 entities), bullet arrays, collision detection, HUD rendering, game state machine, alien firing AI — estimated 400–600 lines total. A single inline `<script>` becomes hard to navigate.

**Approach:** Extract game logic into linked `<script src="...">` files, keeping `index.html` as the shell.

Recommended split:
```
index.html          — canvas setup, DPR scaling, rAF loop entry point
js/constants.js     — LOGICAL_WIDTH, LOGICAL_HEIGHT, FIXED_STEP, game constants
js/input.js         — keys state map, event listeners
js/player.js        — player entity, movement, bullet
js/aliens.js        — formation data, march logic, firing
js/bullets.js       — bullet arrays, update, collision
js/hud.js           — score/lives rendering
js/game.js          — game state machine, update(), render() orchestration
```

No module system — plain `<script>` tags in order. No build step. Works with `file://` directly in browser.

**Alternative considered:** Keep single file. Rejected — 500+ lines in one `<script>` is unmaintainable and conflicts with the Phase 1 CONTEXT.md decision to split "when unwieldy (likely around Phase 2-3)."

---

## 2. Canvas Coordinate System

The canvas is 672×768 logical pixels (224×256 × 3). All coordinates below are in logical pixels.

Original Space Invaders layout (scaled to 672×768):
- Top area (y 0–90): Score/lives HUD
- Alien formation (y 90–400): 5 rows × 11 columns
- Bottom area (y 600–720): Player cannon
- Ground line: y ≈ 720 (player cannon sits just above)

Alien formation start position: x ≈ 60, y ≈ 120
Alien cell size: ~48×48 px (alien sprite ~36×24 px in a 48px cell)
Formation width: 11 × 48 = 528 px (fits within 672 with margins)

Player cannon: centered at x = 336, y = 690 initially; width ~48px

---

## 3. Player Entity (PLAY-01, PLAY-02)

```javascript
const player = {
  x: 312,        // left edge (center = 336)
  y: 690,
  w: 48,
  h: 24,
  speed: 180,    // px/sec
  alive: true
};
```

**Movement:** Each frame in `update(dt)`:
```javascript
if (keys['ArrowLeft'] || keys['KeyA']) player.x -= player.speed * dt;
if (keys['ArrowRight'] || keys['KeyD']) player.x += player.speed * dt;
// Clamp to bounds:
player.x = Math.max(0, Math.min(LOGICAL_WIDTH - player.w, player.x));
```

**Bullet (one at a time, PLAY-02):**
```javascript
let playerBullet = null; // null when no bullet active

// Fire: only if no active bullet
if ((keys['Space']) && !playerBullet) {
  playerBullet = { x: player.x + player.w/2 - 2, y: player.y, w: 4, h: 12, vy: -480 };
  spaceWasDown = true; // edge detection to prevent hold-to-spam
}
```
Bullet speed: -480 px/sec (upward). Despawn when y < 0.

**Edge detection for spacebar:** Track `prevSpaceDown` each frame — only fire on rising edge (key pressed this frame, not last frame), preventing hold-to-fire-continuously (original Space Invaders only fires on press, not hold).

---

## 4. Alien Formation (ALIN-01, ALIN-02, ALIN-03)

### Grid Structure

55 aliens: 5 rows × 11 columns.

```javascript
// Row types (top to bottom):
// Row 0: squid (top)     — 30 pts
// Row 1: crab            — 20 pts
// Row 2: crab            — 20 pts
// Row 3: octopus         — 10 pts
// Row 4: octopus         — 10 pts

const aliens = [];
for (let row = 0; row < 5; row++) {
  for (let col = 0; col < 11; col++) {
    aliens.push({
      row, col,
      x: FORMATION_LEFT + col * ALIEN_CELL_W,
      y: FORMATION_TOP  + row * ALIEN_CELL_H,
      w: ALIEN_W,       // 36
      h: ALIEN_H,       // 24
      alive: true,
      frame: 0          // animation frame (0 or 1 — toggled each march step)
    });
  }
}
```

Constants:
```javascript
const FORMATION_LEFT = 60;
const FORMATION_TOP  = 120;
const ALIEN_CELL_W   = 48;
const ALIEN_CELL_H   = 48;
const ALIEN_W        = 36;
const ALIEN_H        = 24;
```

### March Mechanic (ALIN-02)

The original game uses a **step-based march**: the formation moves a fixed pixel amount on each "step", not continuously. A step fires every N seconds where N decreases as aliens die.

```javascript
const march = {
  dx: 6,           // px per step (positive = right)
  dy: 24,          // px to step down when hitting wall
  stepTimer: 0,    // time since last step
  stepInterval: 0.8, // seconds between steps (recalculated from alive count)
  movingDown: false,
  pendingDown: false // set true when wall hit, triggers one down-step
};
```

**Per-step logic:**
1. Move all alive aliens by `march.dx` horizontally
2. Check if any alien's left edge ≤ `LEFT_BOUNDARY` (when moving left) or right edge ≥ `RIGHT_BOUNDARY` (when moving right)
3. On boundary hit: reverse `march.dx`, set `march.pendingDown = true`
4. On next step when `pendingDown`: move all aliens down by `march.dy`, clear flag

**Step interval (ALIN-03):**
```javascript
// Original Space Invaders: ~55 aliens = slowest, 1 alien = fastest
// Interval range: ~1.0s (55 aliens) to ~0.05s (1 alien)
march.stepInterval = 0.05 + (aliveCount / 55) * 0.95;
```

The march also toggles alien `frame` (0↔1) on each step — the two-frame animation that makes aliens appear to "walk."

**Boundaries:** Left = 24px, Right = 648px (leaving margin).

---

## 5. Alien Firing (ALIN-04)

Only the **bottom-most alive alien in each column** can fire.

```javascript
function getColumnShooters() {
  // For each column 0-10, find the alive alien with the highest row index (lowest on screen)
  const shooters = [];
  for (let col = 0; col < 11; col++) {
    let bottom = null;
    for (const alien of aliens) {
      if (alien.alive && alien.col === col) {
        if (bottom === null || alien.row > bottom.row) bottom = alien;
      }
    }
    if (bottom) shooters.push(bottom);
  }
  return shooters;
}
```

**Firing timer:** Aliens fire at random intervals.
```javascript
const alienFireTimer = { elapsed: 0, interval: 1.2 }; // seconds between fire attempts

// Each interval: pick a random shooter, fire if < maxAlienBullets active
const MAX_ALIEN_BULLETS = 3;
```

Alien bullet: moves downward at +240 px/sec.
```javascript
alienBullets.push({ x: shooter.x + shooter.w/2 - 2, y: shooter.y + shooter.h, w: 4, h: 12, vy: 240 });
```

As alien count decreases, firing interval also decreases (they fire more aggressively):
```javascript
alienFireTimer.interval = 0.4 + (aliveCount / 55) * 0.8; // 1.2s → 0.4s as aliens die
```

---

## 6. Collision Detection (CMBT-01, CMBT-02)

AABB (axis-aligned bounding box) — sufficient for Phase 2. Pixel-level is Phase 3 (shields).

```javascript
function overlaps(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}
```

**Player bullet vs aliens:**
```javascript
if (playerBullet) {
  for (const alien of aliens) {
    if (alien.alive && overlaps(playerBullet, alien)) {
      alien.alive = false;
      playerBullet = null;
      score += rowPoints[alien.row]; // CMBT-03
      aliveCount--;
      break;
    }
  }
}
```

**Alien bullet vs player:**
```javascript
for (const bullet of alienBullets) {
  if (overlaps(bullet, player) && !player.invincible) {
    lives--;           // PLAY-03
    alienBullets.splice(alienBullets.indexOf(bullet), 1);
    if (lives <= 0) {
      gameState = 'game_over'; // PLAY-04, ALIN-05 triggers separately
    } else {
      respawn();       // brief invincibility, reposition
    }
    break;
  }
}
```

**Alien reaches bottom (ALIN-05):**
```javascript
for (const alien of aliens) {
  if (alien.alive && alien.y + alien.h >= GROUND_LINE) {
    gameState = 'game_over';
    break;
  }
}
```

---

## 7. Score and Point Values (CMBT-03)

Authentic Space Invaders point values by row (top = highest, bottom = lowest):
```javascript
const ROW_POINTS = [30, 20, 20, 10, 10]; // index = row (0=top squid, 4=bottom octopus)
```

Score is a simple integer, displayed in HUD.

---

## 8. HUD (CMBT-04)

Rendered at top of canvas each frame after clearing.

```javascript
function renderHUD(ctx) {
  ctx.fillStyle = '#fff';
  ctx.font = '24px monospace';
  ctx.textBaseline = 'top';

  // Score (top left)
  ctx.fillText('SCORE', 24, 12);
  ctx.fillText(String(score).padStart(4, '0'), 24, 40);

  // Lives (top right)
  ctx.fillText('LIVES', 500, 12);
  ctx.fillText(String(lives), 500, 40);
}
```

Ground line (visual separator):
```javascript
ctx.strokeStyle = '#0f0';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(0, GROUND_LINE);
ctx.lineTo(LOGICAL_WIDTH, GROUND_LINE);
ctx.stroke();
```

---

## 9. Respawn Mechanic (PLAY-03, PLAY-04)

After the player is hit:
1. Set `player.invincible = true`, `player.invincibleTimer = 2.0` (2 seconds)
2. Reposition player to center: `player.x = 312`
3. Each frame: decrement timer; when ≤ 0, clear invincible flag
4. During invincibility: player flickers (render only on even-numbered frames or use a toggle)
5. During invincibility: alien bullets pass through player (collision check skipped)

---

## 10. Game State Machine

```javascript
let gameState = 'playing'; // 'playing' | 'game_over'

function update(dt) {
  if (gameState === 'playing') updatePlaying(dt);
  // game_over: no updates, wait for restart key (Phase 4 adds full restart flow)
}

function render() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  if (gameState === 'playing') renderPlaying();
  else if (gameState === 'game_over') renderGameOver();
}
```

Game over screen (minimal for Phase 2 — full restart flow is Phase 4):
```javascript
function renderGameOver() {
  ctx.fillStyle = '#fff';
  ctx.font = '48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', LOGICAL_WIDTH/2, LOGICAL_HEIGHT/2);
  ctx.font = '24px monospace';
  ctx.fillText('Score: ' + score, LOGICAL_WIDTH/2, LOGICAL_HEIGHT/2 + 60);
}
```

---

## 11. Rendering Approach (No Sprites Yet)

Phase 2 uses programmatic shapes (filled rectangles + simple polygon paths). Sprite sheets are Phase 4 polish (POLS-01).

- **Player cannon:** Green triangle or rectangle at player.x/y
- **Alien squid (row 0):** White rectangle with notches (or just a white rect for now)
- **Alien crab (rows 1-2):** Slightly wider white rect
- **Alien octopus (rows 3-4):** Shorter, wider white rect
- **Player bullet:** Thin white rect (4×12 px)
- **Alien bullet:** Thin white rect (4×12 px), slightly different shade
- **HUD:** White text, monospace font

The two-frame animation: toggle alien render width/height or color slightly each march step. Even a subtle change (arm-out vs arm-in) is visible. For Phase 2, a simple color flash (white ↔ light green) on step is acceptable.

---

## 12. Pitfalls to Avoid

1. **Continuous spacebar firing:** Must use rising-edge detection (keypress this frame AND not last frame), not just `keys['Space']`. Otherwise player fires a new bullet every fixed-step frame while holding space.

2. **Formation wall detection timing:** Check AFTER moving, not before. Check the extreme edges of the entire formation (leftmost alive alien's left edge, rightmost alive alien's right edge).

3. **March step vs. continuous movement:** The original game moves by discrete steps, not pixel-per-frame. This is what gives it the characteristic "chunky" march feel. Implementing as continuous smooth movement loses authenticity.

4. **Column shooter lookup efficiency:** Rebuild column shooter list each time an alien dies (or each fire attempt). Don't cache — it becomes stale immediately.

5. **Bullet count limits:** Player: max 1 bullet. Aliens: max 3 simultaneous bullets. Enforce these limits.

6. **dt accumulation in march timer:** Use the fixed timestep dt (FIXED_STEP = 1/60), not raw frame dt. The march timer increments by FIXED_STEP each update() call.

7. **Multiple collisions same frame:** When player bullet hits alien, null out the bullet immediately and break — don't continue checking other aliens.

8. **Game over trigger order:** Check alien-reached-bottom BEFORE checking lives — game over from invasion is immediate, not life-based.

9. **Script load order:** When splitting to multiple .js files, constants.js must load before all others. game.js last (it depends on all others).

---

## Validation Architecture

How to verify Phase 2 works without a test framework (browser-only project):

**Console-verifiable checks (add temporary logging):**
- Log `aliveCount` each step — should start at 55, decrement on kill
- Log `march.stepInterval` each step — should decrease as aliens die
- Log `score` on each kill — verify point values match ROW_POINTS
- Log `lives` on each hit — should decrement from 3 to 0

**Visual verification (human checkpoint):**
1. Open index.html → see alien formation (55 aliens in 5×11 grid)
2. Press ArrowLeft/ArrowRight → player moves and stops at screen edges
3. Press Space → single bullet fires upward; holding Space fires only one bullet
4. Wait 2 seconds → alien formation marches; confirm step-down at each wall
5. Kill several aliens → confirm march visibly accelerates
6. Get hit by alien bullet → life count decrements; player respawns at center
7. Kill all 55 aliens → confirm win condition (or game continues to next wave if implemented)
8. Let aliens reach bottom → GAME OVER appears immediately
9. Lose all 3 lives → GAME OVER appears
10. Score display → correct values (30 for top row, 10 for bottom row)

**Grep-verifiable acceptance criteria:**
- `index.html` or `js/game.js` contains `gameState`
- `js/aliens.js` contains `march.stepInterval`
- `js/aliens.js` contains `ROW_POINTS` or `rowPoints`
- `js/player.js` contains `player.invincible`
- `js/bullets.js` or `js/aliens.js` contains `MAX_ALIEN_BULLETS`
- Score display rendered via canvas `fillText` with `SCORE`
- Lives rendered via canvas `fillText` with `LIVES`

---

## Summary

Phase 2 is the largest leap in the project — going from a blank loop to a fully playable game. The key architectural choices:

1. **Split to .js files** — the code volume demands it
2. **Step-based march** — discrete steps, not continuous, for authentic feel
3. **Rising-edge spacebar** — prevents continuous fire
4. **AABB collision** — simple and sufficient (pixel-level is Phase 3)
5. **State machine** — `playing` | `game_over` states from day one
6. **Programmatic shapes** — no sprites needed for Phase 2 to be playable

The phase should produce 3-4 plans covering: (1) file structure + constants + player movement, (2) alien formation + march, (3) bullets + collision + combat, (4) HUD + game state + integration.

## RESEARCH COMPLETE
