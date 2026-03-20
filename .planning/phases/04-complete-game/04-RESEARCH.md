# Phase 4: Complete Game — Research

**Researched:** 2026-03-20
**Phase:** 04 — Complete Game
**Requirements:** UFO-01, UFO-02, FLOW-01, FLOW-02, FLOW-03

---

## 1. Existing Codebase Architecture (What Phase 4 Inherits)

After Phases 1-3, the project has this file structure:

```
index.html          — canvas setup, DPR scaling (ctx.scale(dpr, dpr)), rAF fixed-timestep loop, initGame() entry
js/constants.js     — LOGICAL_WIDTH=672, LOGICAL_HEIGHT=768, all game constants
js/input.js         — keys state map
js/player.js        — player entity, playerBullet, updatePlayer(), renderPlayer()
js/aliens.js        — aliens array, march state, doMarchStep(), killAlien(), getAliveCount(), renderAliens()
js/bullets.js       — overlaps(), updateBullets(), checkCollisions()
js/shields.js       — shields array, initShields(), renderShields(), pixel collision, overflight
js/hud.js           — renderHUD()
js/game.js          — gameState, update(), render(), renderPlaying(), renderGameOver(), renderWaveClear()
```

**Key facts for Phase 4:**

- Canvas: 672×768 logical pixels, DPR-scaled via `ctx.scale(dpr, dpr)` in index.html. Global `ctx` is the scaled context.
- `gameState` is a string: `'playing'` | `'game_over'` | `'wave_clear'`
- `update(dt)` only updates when `gameState === 'playing'`; game_over and wave_clear freeze state (stub placeholders from Phase 2)
- `initGame()` resets: gameState='playing', score=0, lives=3, resetPlayer(), initAliens(), alienBullets.length=0, initShields()
- `score` and `lives` are globals in game.js
- `getAliveCount()` returns the live alien count (tracked in aliens.js via `aliveCount`)
- `killAlien(alien)` decrements aliveCount and recalculates march/fire intervals
- `renderGameOver()` exists but shows placeholder text "(full restart in Phase 4)"
- `renderWaveClear()` exists but shows placeholder text "(wave progression in Phase 4)"
- **No UFO exists yet** — new file `js/ufo.js` needed

---

## 2. UFO Mechanics (UFO-01, UFO-02)

### Authentic Space Invaders UFO Behavior

The mystery UFO (sometimes called "Saucer" or "Mystery Ship") in the original game:
- Flies horizontally across the very top of the screen (above the alien formation)
- Appears periodically, alternating direction (left-to-right or right-to-left)
- Awards bonus points when shot — 50, 100, 150, or 300 points in the authentic game
- For v1, a fixed bonus (e.g., 100 or randomized from [50, 100, 150, 300]) is sufficient
- v2 refinement (POLS-02) is the authentic 15-value shot-count cycle — explicitly out of scope for Phase 4

### UFO Position and Size

In the 672×768 logical coordinate system:
- UFO y-position: y=30 (top area, above aliens which start at y=120, below HUD text at y=12-56)
- UFO size: ~48×18 px (same 3× scale as other entities)
- UFO travels from left edge x = -UFO_W (off-screen) to right edge x = LOGICAL_WIDTH, or reverse
- Speed: ~90 px/sec (authentic feel — slow enough to reward skill)

```javascript
// js/constants.js additions
const UFO_W         = 48;
const UFO_H         = 18;
const UFO_Y         = 30;           // top edge y (sits in top band above aliens)
const UFO_SPEED     = 90;           // px/sec
const UFO_MIN_INTERVAL = 15;        // seconds between UFO appearances (minimum)
const UFO_MAX_INTERVAL = 25;        // seconds between UFO appearances (maximum)
const UFO_POINTS    = [50, 100, 150, 300]; // bonus point values — pick randomly
```

### UFO State Object

```javascript
// js/ufo.js
const ufo = {
  active: false,        // is UFO currently on screen?
  x: 0,
  y: UFO_Y,
  w: UFO_W,
  h: UFO_H,
  vx: 0,              // velocity (positive = right, negative = left)
  spawnTimer: 0,      // countdown to next spawn attempt
  spawnInterval: 0    // randomized interval for this cycle
};
```

### UFO Spawn Logic

```javascript
function initUFO() {
  ufo.active = false;
  ufo.spawnTimer = 0;
  ufo.spawnInterval = randomUFOInterval();
}

function randomUFOInterval() {
  return UFO_MIN_INTERVAL + Math.random() * (UFO_MAX_INTERVAL - UFO_MIN_INTERVAL);
}

function updateUFO(dt) {
  if (!ufo.active) {
    ufo.spawnTimer += dt;
    if (ufo.spawnTimer >= ufo.spawnInterval) {
      spawnUFO();
    }
    return;
  }

  // Move UFO
  ufo.x += ufo.vx * dt;

  // Despawn when off-screen (no score, just disappears)
  if ((ufo.vx > 0 && ufo.x > LOGICAL_WIDTH) ||
      (ufo.vx < 0 && ufo.x + ufo.w < 0)) {
    despawnUFO();
  }
}

function spawnUFO() {
  // Alternate direction each spawn (authentic behavior)
  const goRight = Math.random() < 0.5; // simple: random direction
  ufo.vx   = goRight ? UFO_SPEED : -UFO_SPEED;
  ufo.x    = goRight ? -UFO_W : LOGICAL_WIDTH;
  ufo.y    = UFO_Y;
  ufo.active = true;
  ufo.spawnTimer = 0;
  ufo.spawnInterval = randomUFOInterval();
}

function despawnUFO() {
  ufo.active = false;
}
```

### UFO Collision (UFO-02)

The player bullet can hit the UFO. Use the existing `overlaps()` from bullets.js:

```javascript
function checkPlayerBulletVsUFO() {
  if (!ufo.active || !playerBullet) return;
  if (!overlaps(playerBullet, ufo)) return;

  // Hit! Award bonus points
  const bonus = UFO_POINTS[Math.floor(Math.random() * UFO_POINTS.length)];
  score += bonus;
  playerBullet = null;   // bullet consumed
  despawnUFO();

  // Optional: brief "hit flash" — not required for v1
}
```

This function is called from `checkCollisions()` in bullets.js.

### UFO Rendering

```javascript
function renderUFO(ctx) {
  if (!ufo.active) return;
  ctx.fillStyle = '#f00'; // classic red
  ctx.fillRect(ufo.x, ufo.y, ufo.w, ufo.h);
}
```

Rendered in `renderPlaying()` before the HUD (behind HUD, in front of background).

### Integration Points

- `js/ufo.js` — new file with all UFO logic
- `js/constants.js` — add UFO constants
- `js/game.js` — call `initUFO()` in `initGame()`, `updateUFO(dt)` in `updatePlaying()`, `renderUFO(ctx)` in `renderPlaying()`
- `js/bullets.js` — add `checkPlayerBulletVsUFO()` to `checkCollisions()`
- `index.html` — add `<script src="js/ufo.js"></script>` after shields.js

---

## 3. Wave Progression (FLOW-01)

### Trigger: All Aliens Destroyed

`updatePlaying()` in game.js already checks `getAliveCount() === 0` and sets `gameState = 'wave_clear'`. Phase 4 fills in the stub.

### Wave State

A `waveNumber` counter (starts at 1, increments each wave clear) is needed to calculate increasing speed.

```javascript
// In game.js
let waveNumber = 1;
```

### Restart Wave on Clear

When all aliens die, transition through a brief "WAVE CLEAR" display, then reset the wave:

```javascript
// Wave clear timer — show "WAVE CLEAR!" for 2 seconds, then start next wave
let waveClearTimer = 0;
const WAVE_CLEAR_DELAY = 2.0; // seconds

function updateWaveClear(dt) {
  waveClearTimer += dt;
  if (waveClearTimer >= WAVE_CLEAR_DELAY) {
    startNextWave();
  }
}

function startNextWave() {
  waveNumber++;
  gameState = 'playing';
  waveClearTimer = 0;

  // Reset aliens to formation
  initAliens();

  // Apply wave speed bonus: each wave, march interval is 5% faster
  // clamp to a minimum (don't go faster than 1 alien remaining)
  march.stepInterval = Math.max(0.05, calcStepInterval(55) * Math.pow(0.95, waveNumber - 1));

  // Reset UFO timer
  initUFO();

  // Reset shields (authentic: shields persist between waves — do NOT reset shields)
  // alienBullets cleared
  alienBullets.length = 0;
  playerBullet = null;
  // Player is NOT reset between waves (lives and position persist)
}
```

**Note on shields between waves:** In the authentic Space Invaders, shields persist and accumulate damage across waves. Do NOT call `initShields()` in `startNextWave()`.

**Note on player between waves:** Player position and lives are preserved. Only `resetPlayer()` (which gives brief invincibility) is appropriate if desired — but the authentic game does not reset player position between waves.

### `update()` Integration

```javascript
function update(dt) {
  if (gameState === 'playing') {
    updatePlaying(dt);
  } else if (gameState === 'wave_clear') {
    updateWaveClear(dt);   // NEW
  }
  // game_over: frozen (handled by restart key input)
}
```

---

## 4. Game-Over Screen and Restart (FLOW-02, FLOW-03)

### Current State

`renderGameOver()` already exists in game.js with placeholder text. Phase 4 replaces the placeholder with the full implementation:
1. Show "GAME OVER" + final score
2. Show "Press ENTER to restart" (or SPACE, or R key)
3. On keypress: call `initGame()` — full clean reset

### Restart Key Detection

Phase 4 needs to listen for a restart key in the `game_over` state. Use the existing `keys` state map from input.js:

```javascript
// In update() or a dedicated updateGameOver(dt):
function updateGameOver(dt) {
  // Listen for Enter, Space, or R key to restart
  if (keys['Enter'] || keys['KeyR']) {
    initGame();
  }
}
```

**Important:** `initGame()` already resets everything cleanly:
- `gameState = 'playing'`
- `score = 0`, `lives = 3`
- `resetPlayer()`
- `initAliens()`
- `alienBullets.length = 0`
- `initShields()`

After Phase 4, `initGame()` must also reset `waveNumber = 1` and `initUFO()`.

### Timer Leak Prevention (FLOW-03)

"No timer leaks" means all timers/state reset when `initGame()` is called. Audit:

| Timer/State | Reset Location | Method |
|---|---|---|
| `gameState` | `initGame()` | Set to 'playing' ✓ |
| `score`, `lives` | `initGame()` | Set to 0 / 3 ✓ |
| `player` | `initGame()` → `resetPlayer()` | Resets position, invincible timer ✓ |
| `playerBullet` | `initGame()` → `resetPlayer()` | Set to null ✓ |
| `aliens`, `aliveCount` | `initGame()` → `initAliens()` | Full reset ✓ |
| `march.stepTimer`, `march.pendingDown` | `initAliens()` | Reset ✓ |
| `alienFireState.timer` | `initAliens()` | Reset ✓ |
| `alienBullets` | `initGame()` | `.length = 0` ✓ |
| `shields` | `initGame()` → `initShields()` | Full reinit ✓ |
| `ufo` | `initGame()` → `initUFO()` | NEW — must add ✓ |
| `waveNumber` | `initGame()` | NEW — must add ✓ |
| `waveClearTimer` | `initGame()` | NEW — must add ✓ |
| `rAF loop` | Never canceled — loop runs forever | No leak ✓ |

The `requestAnimationFrame` loop in index.html runs continuously (calls `requestAnimationFrame(loop)` at the end of each frame) — it does not accumulate or leak. `update()` is gated by `gameState`, so timers inside `update()` only tick when in the correct state.

**Key conclusion:** As long as `initGame()` resets `ufo`, `waveNumber`, and `waveClearTimer`, there are no timer leaks.

### Full `initGame()` After Phase 4

```javascript
function initGame() {
  gameState = 'playing';
  score = 0;
  lives = 3;
  waveNumber = 1;
  waveClearTimer = 0;
  resetPlayer();
  initAliens();
  alienBullets.length = 0;
  playerBullet = null;
  initShields();
  initUFO();
}
```

### `renderGameOver()` Replacement

```javascript
function renderGameOver() {
  renderPlaying(); // render frozen game state behind overlay

  // Dim overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#f00';
  ctx.font = 'bold 72px monospace';
  ctx.fillText('GAME OVER', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 - 60);

  ctx.fillStyle = '#fff';
  ctx.font = '32px monospace';
  ctx.fillText('Score: ' + String(score).padStart(4, '0'), LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 + 10);

  ctx.fillStyle = '#aaa';
  ctx.font = '22px monospace';
  ctx.fillText('Press ENTER or R to restart', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 + 70);
}
```

---

## 5. HUD Updates for Wave Number

The existing `renderHUD()` shows score and lives. Wave number display is a natural addition for Phase 4:

```javascript
// js/hud.js — add wave display
function renderHUD(ctx) {
  ctx.fillStyle = '#fff';
  ctx.font = '24px monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  // Score (top left)
  ctx.fillText('SCORE', 24, 12);
  ctx.fillText(String(score).padStart(4, '0'), 24, 40);

  // Wave (top center)
  ctx.textAlign = 'center';
  ctx.fillText('WAVE ' + waveNumber, LOGICAL_WIDTH / 2, 12);

  // Lives (top right)
  ctx.textAlign = 'right';
  ctx.fillText('LIVES  ' + lives, LOGICAL_WIDTH - 24, 12);
}
```

Note: `waveNumber` is defined in game.js and is globally accessible. The HUD does not need its own reference.

---

## 6. Integration Points Summary

### New file: `js/ufo.js`
All UFO state, update, render, and collision logic.

### Modified files:

**`js/constants.js`** — add UFO constants:
```javascript
const UFO_W = 48;
const UFO_H = 18;
const UFO_Y = 30;
const UFO_SPEED = 90;
const UFO_MIN_INTERVAL = 15;
const UFO_MAX_INTERVAL = 25;
const UFO_POINTS = [50, 100, 150, 300];
const WAVE_CLEAR_DELAY = 2.0;
```

**`js/game.js`** — major additions:
- Add `waveNumber`, `waveClearTimer` globals
- Update `initGame()` to reset all new state
- Add `updateWaveClear(dt)` and `updateGameOver(dt)` functions
- Wire `update()` to call new update functions by state
- Replace `renderGameOver()` placeholder with full implementation
- Replace `renderWaveClear()` placeholder with wave-transition display

**`js/bullets.js`** — add `checkPlayerBulletVsUFO()` to `checkCollisions()`

**`js/hud.js`** — add wave number display

**`index.html`** — add `<script src="js/ufo.js"></script>` after shields.js

---

## 7. Plan Structure Recommendation

Phase 4 has two reasonably independent feature clusters:

**Plan 04-01 — UFO: Spawn, Movement, and Collision (Wave 1)**
- UFO-01: `js/ufo.js` — state, spawn timer, movement, despawn
- UFO-02: `checkPlayerBulletVsUFO()` integrated into bullets.js
- Constants, render in renderPlaying(), init in initGame()

**Plan 04-02 — Game Flow: Wave Progression + Game-Over/Restart (Wave 1)**
- FLOW-01: `updateWaveClear()`, `startNextWave()` — wave counter, alien reset, speed increase
- FLOW-02: Full `renderGameOver()` — "GAME OVER" screen with score + restart prompt
- FLOW-03: `updateGameOver()` — restart key handler; `initGame()` fully resets all timers/state
- HUD wave number display

Both plans can run in **Wave 1 (parallel)** because they touch different files:
- Plan 04-01: ufo.js (new), constants.js, bullets.js, game.js (initGame + renderPlaying), hud.js (minor), index.html
- Plan 04-02: game.js (update + renderGameOver + renderWaveClear), hud.js

**Conflict risk:** Both touch `game.js` and `hud.js`. To avoid merge conflicts, run them **sequentially** (Wave 1 then Wave 2), or carefully partition the game.js tasks:
- Plan 04-01 (Wave 1): ufo.js, constants.js, bullets.js, index.html, game.js UFO init/render sections
- Plan 04-02 (Wave 2): game.js state machine updates, hud.js wave display

Sequential execution is safer and the natural choice given game.js is the coordination point.

---

## 8. Pitfalls to Avoid

1. **`textAlign` not restored after HUD:** `ctx.textAlign = 'center'` persists between frames. Always set `ctx.textAlign` explicitly before each use in render functions, or save/restore.

2. **`waveNumber` access from hud.js:** `waveNumber` is declared in game.js. Since scripts load in order (game.js loads before the inline script, and hud.js loads before game.js), there's a load-order dependency. **Solution:** declare `let waveNumber = 1;` as a top-level global in game.js (not inside a function), so it's available when hud.js renders. This is already the pattern for `score` and `lives`.

3. **UFO spawn timer running during non-playing states:** `updateUFO(dt)` should only be called from `updatePlaying(dt)`, not from `update(dt)`. The current `update()` gates all gameplay updates through `updatePlaying()` — keep this pattern.

4. **Wave clear: don't reinitialize shields:** Phase 4 must NOT call `initShields()` in `startNextWave()`. Shield damage persists across waves (authentic behavior). Only `initAliens()`, `alienBullets` clear, and `initUFO()` are needed.

5. **Player bullet consumed by UFO vs shields vs aliens — order matters:** Call `checkPlayerBulletVsUFO()` before or after shield/alien checks consistently. Recommended: check UFO first (it's at the top of the screen, unlikely to overlap with shields/aliens simultaneously), but any consistent order is fine.

6. **`prevSpaceDown` edge detection across restart:** After `initGame()` is called, `prevSpaceDown` in player.js is not reset. If the player presses ENTER to restart (not Space), this is fine. If restart is on Space: pressing Space to restart could immediately fire a bullet in frame 1 of the new game. Mitigation: reset `prevSpaceDown = true` in `resetPlayer()` so the first Space press requires a key-up/key-down cycle.

7. **`ctx.textBaseline` persistence:** Like `textAlign`, set explicitly before each text draw.

---

## 9. Validation Architecture

How to verify Phase 4 works without a test framework (browser-only project):

**Console-verifiable checks:**
- `typeof ufo` is object, `ufo.active` starts false
- `waveNumber` starts at 1
- After `initGame()`: `waveNumber === 1`, `ufo.active === false`

**Grep-verifiable acceptance criteria:**
- `js/ufo.js` exists and contains `function initUFO()`
- `js/ufo.js` contains `function updateUFO(`
- `js/ufo.js` contains `function renderUFO(`
- `js/ufo.js` contains `function checkPlayerBulletVsUFO(`
- `js/constants.js` contains `UFO_SPEED`
- `js/constants.js` contains `UFO_POINTS`
- `js/bullets.js` contains `checkPlayerBulletVsUFO`
- `js/game.js` contains `waveNumber`
- `js/game.js` contains `updateWaveClear`
- `js/game.js` contains `startNextWave`
- `js/game.js` contains `updateGameOver`
- `js/game.js` contains `initUFO()`
- `js/hud.js` contains `waveNumber`
- `index.html` contains `ufo.js`

**Visual verification (human checkpoint):**
1. Open `index.html` — no console errors, HUD shows "WAVE 1"
2. Wait 15-25 seconds — red UFO appears at top of screen, moves across
3. Shoot UFO — score increases by [50, 100, 150, or 300]; UFO disappears
4. Destroy all 55 aliens — "WAVE CLEAR!" appears briefly, then Wave 2 starts with aliens reset (shields NOT reset)
5. HUD shows "WAVE 2" after transition
6. Lose all 3 lives — "GAME OVER" screen with score and "Press ENTER or R to restart"
7. Press ENTER — game resets to Wave 1, full clean state (score=0, lives=3, fresh formation)
8. Verify no console errors after multiple restart cycles

---

## Summary

Phase 4 completes the Space Invaders experience with three loosely coupled features:

1. **UFO** (UFO-01, UFO-02): New `js/ufo.js` file. Periodic spawn via timer, horizontal movement, player-bullet collision that awards randomized bonus points. Minimal integration — hooks into `initGame()`, `updatePlaying()`, `renderPlaying()`, `checkCollisions()`.

2. **Wave progression** (FLOW-01): `startNextWave()` resets aliens and increments `waveNumber` with slight march speed increase. Shields intentionally NOT reset (authentic behavior). 2-second "WAVE CLEAR!" interstitial.

3. **Game-over/restart** (FLOW-02, FLOW-03): Full `renderGameOver()` with score display and restart prompt. `updateGameOver()` listens for ENTER/R key and calls `initGame()`. All timers tracked in the leak-prevention audit reset cleanly through `initGame()`.

The biggest coordination risk is `game.js` — both UFO integration and flow management touch it. Plan structure (04-01 for UFO, 04-02 for flow) should carefully partition game.js edits to avoid conflicts.

## RESEARCH COMPLETE
