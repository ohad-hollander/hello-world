# Architecture Research

**Domain:** Browser-based HTML5 Canvas arcade game (Space Invaders)
**Researched:** 2026-03-18
**Confidence:** HIGH — Core patterns verified against MDN, multiple implementation guides, and well-established game dev literature

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Entry Point (index.html)                  │
│                         Boots canvas, loads JS                   │
├─────────────────────────────────────────────────────────────────┤
│                        Game (game.js)                            │
│   Owns the loop, wires components, manages global game state    │
│   (phase: title / playing / paused / game-over / win)           │
├──────────┬──────────────┬──────────────────┬────────────────────┤
│  Input   │   Entities   │   Collision      │   Renderer         │
│ (input.js│  (entities/) │ (collision.js)   │ (renderer.js)      │
│          │              │                  │                     │
│ Keyboard │  Player      │ Bullet ↔ Alien   │ Clears canvas      │
│ state    │  Alien Grid  │ Bullet ↔ Shield  │ Draws all entities │
│ snapshot │  Bullet      │ Alien ↔ Shield   │ Draws HUD          │
│          │  Shield      │ Alien ↔ Player   │                    │
│          │  UFO         │ Bullet ↔ UFO     │                    │
├──────────┴──────────────┴──────────────────┴────────────────────┤
│                      Game State (state.js)                       │
│   score, lives, wave, entities[], phase — plain JS object        │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `Game` | Owns the `requestAnimationFrame` loop; orchestrates input → update → render each frame | Single class/module; calls into all others |
| `Input` | Captures keyboard events; exposes a snapshot of currently-held keys | `Set` of pressed key codes, updated on `keydown`/`keyup` |
| `Player` | Position, movement speed, shoot cooldown, lives | Plain object or class with `x, y, width, height` |
| `AlienGrid` | 55 aliens in 5×11 formation; collective left/right/down movement; per-alien alive flag; speed increases as count drops | 2D array of alien objects; grid tracks direction and step timer |
| `Bullet` | Position, velocity (player bullets go up, alien bullets go down), owner tag | Small objects pooled or created on demand |
| `Shield` | Four shields; per-pixel damage state | Off-screen canvas per shield; `getImageData`/`putImageData` for pixel-level erosion |
| `UFO` | Periodic appearance across top row; random bonus score on hit | Simple object; spawned on timer |
| `Renderer` | Stateless draw pass: clears canvas, iterates entity list, draws HUD | Module of `draw*` functions; no game logic |
| `Collision` | AABB checks between bullets and targets; pixel-level check for shields | Pure functions; no entity state mutation |
| `GameState` | Single shared object: `{ score, lives, phase, entities }` | Plain JS object passed by reference |

## Recommended Project Structure

```
/
├── index.html            # Canvas element, loads game.js as module
├── game.js               # Entry: Game class, rAF loop, wires all modules
├── state.js              # Shared mutable game state (score, lives, phase)
├── input.js              # Keyboard event capture, pressed-key Set
├── renderer.js           # All canvas draw calls; no logic
├── collision.js          # Collision detection functions
├── constants.js          # Canvas size, alien dimensions, speeds, frame rates
└── entities/
    ├── player.js         # Player cannon
    ├── alien.js          # Individual alien (type, sprite row, alive)
    ├── alienGrid.js      # Formation logic, movement, firing AI
    ├── bullet.js         # Bullet (position, velocity, owner)
    ├── shield.js         # Destructible shield (off-screen canvas)
    └── ufo.js            # Mystery UFO
```

### Structure Rationale

- **entities/:** Each entity encapsulates only its own state and per-entity update logic. No entity knows about others.
- **collision.js separate from entities:** Collision is a cross-cutting concern. Putting it here keeps entity files free of inter-entity knowledge.
- **renderer.js separate from entities:** Entities own no draw methods. The renderer iterates the entity list and draws everything in one stateless pass — this makes draw order explicit and trivial to change.
- **constants.js:** Original Space Invaders has many magic numbers (55 aliens, 4 shields, speeds). Centralising them makes tuning straightforward.
- **No build step:** All files are ES modules loaded via `<script type="module">`. Works with `open index.html` directly.

## Architectural Patterns

### Pattern 1: Fixed-Timestep Game Loop with rAF

**What:** `requestAnimationFrame` drives the loop. A `lag` accumulator triggers physics updates at a fixed interval (e.g., 16.67ms = 60 fps logic). Rendering runs every rAF tick regardless.

**When to use:** Always for Canvas games. Decouples physics consistency from monitor refresh rate (prevents 120 Hz monitors running the game at double speed).

**Trade-offs:** Slight added complexity vs. naive variable-step loop; eliminates frame-rate-dependent gameplay bugs entirely.

**Example:**
```javascript
const STEP = 1000 / 60; // 16.67ms
let lag = 0;
let lastTime = 0;

function loop(timestamp) {
  const elapsed = timestamp - lastTime;
  lastTime = timestamp;
  lag += elapsed;

  processInput();

  while (lag >= STEP) {
    update(STEP);
    lag -= STEP;
  }

  render();
  requestAnimationFrame(loop);
}
```

### Pattern 2: Input State Snapshot (not event-driven logic)

**What:** Key event handlers only write to a `Set<string>` of currently-pressed keys. The `processInput()` phase reads that Set and mutates game state. No game logic runs inside event handlers.

**When to use:** Any keyboard-driven game. Without this, rapid key events between frames can fire logic multiple times or at unpredictable times.

**Trade-offs:** None meaningful at this scale. It is strictly better than putting logic in keydown handlers.

**Example:**
```javascript
// input.js
const pressed = new Set();
document.addEventListener('keydown', e => pressed.add(e.code));
document.addEventListener('keyup',  e => pressed.delete(e.code));
export const isDown = code => pressed.has(code);

// game.js processInput()
if (input.isDown('ArrowLeft'))  player.x -= player.speed * STEP;
if (input.isDown('ArrowRight')) player.x += player.speed * STEP;
if (input.isDown('Space'))      tryShoot(player);
```

### Pattern 3: Off-Screen Canvas for Destructible Shields

**What:** Each shield is rendered to an off-screen `OffscreenCanvas` (or a hidden `<canvas>`). Bullet hits call `getImageData` around the impact point, check alpha for collision, then `putImageData` zeroing pixels in the damage radius. The off-screen canvas is blitted to the main canvas each frame.

**When to use:** Only for shields. AABB is sufficient for all other collisions. Per-pixel work is expensive; limit it to the shield subsystem.

**Trade-offs:** More complex than AABB; `getImageData` is slow if called on a large area. Keep the sampled region small (e.g., 8×8 px around hit point) and the damage radius small (4–6 px).

**Example:**
```javascript
function damageShield(shield, hitX, hitY, radius) {
  const ctx = shield.offscreenCtx;
  const region = ctx.getImageData(hitX - radius, hitY - radius,
                                   radius * 2, radius * 2);
  for (let i = 3; i < region.data.length; i += 4) {
    region.data[i] = 0; // zero alpha
  }
  ctx.putImageData(region, hitX - radius, hitY - radius);
}
```

### Pattern 4: AlienGrid as a Single Coordinated Entity

**What:** The 55 aliens do not move independently. The grid tracks a single direction flag and a step timer. When the timer fires, all living aliens step one unit in the current direction. When any alien reaches a screen edge, the grid steps down one row and reverses direction. Speed increases by reducing the step timer interval proportionally to aliens remaining.

**When to use:** This is the correct Space Invaders pattern. Treating each alien as an independent agent that polls boundaries separately is an anti-pattern — it makes the direction-reversal logic non-deterministic.

**Trade-offs:** None. This directly mirrors the original hardware's approach.

## Data Flow

### Frame Cycle

```
requestAnimationFrame callback
    |
    +--> processInput()
    |        reads Input.pressed Set
    |        writes Player.x, Player.y, enqueues shoot
    |
    +--> update(dt)
    |        AlienGrid.update(dt)   -- move grid, maybe fire
    |        Player.update(dt)      -- apply queued shoot
    |        Bullets[].update(dt)   -- advance positions
    |        UFO.update(dt)         -- advance or spawn
    |        Collision.check(state) -- AABB + shield pixel checks
    |            writes: alien.alive=false, bullet removed,
    |                    state.score+=, state.lives-=,
    |                    shield pixel data mutated
    |        GamePhase.evaluate()   -- win/lose/next-wave?
    |
    +--> render()
             ctx.clearRect(...)
             Renderer.drawShields(state.shields)   -- blit off-screen canvases
             Renderer.drawAliens(state.alienGrid)
             Renderer.drawPlayer(state.player)
             Renderer.drawBullets(state.bullets)
             Renderer.drawUFO(state.ufo)
             Renderer.drawHUD(state.score, state.lives)
```

### Key Data Flows

1. **Shooting:** Player presses Space -> `processInput` sets `player.wantsToShoot = true` -> `update` creates a new Bullet in `state.bullets[]` if shoot cooldown allows.
2. **Alien firing:** `AlienGrid.update` picks a random bottom-row alien at a random interval and adds an alien Bullet to `state.bullets[]`.
3. **Collision resolution:** `Collision.check` is the single place that removes bullets, sets `alien.alive = false`, decrements `state.lives`, and mutates shield pixel data. No entity mutates another entity.
4. **Speed escalation:** `AlienGrid` recalculates its step interval after any alien death: `interval = BASE_INTERVAL * (aliveCount / TOTAL_ALIENS)`.
5. **Phase transitions:** After `update`, `GamePhase.evaluate` checks `state.lives <= 0` (game over), `aliveCount === 0` (wave clear / win), and sets `state.phase` accordingly. The `render` function checks `state.phase` to overlay screens.

### State Ownership

```
state.js owns: score, lives, phase, player, alienGrid, bullets[], shields[], ufo
    |
    read by: Collision, Renderer, GamePhase.evaluate
    written by: processInput (player position), update functions, Collision
```

State is a single plain object. No callbacks or pub/sub needed at this scale.

## Scaling Considerations

This is a single-player local game with no server, users, or persistence. Scaling in the web-service sense is irrelevant. Relevant performance considerations:

| Concern | At current scope | If scope grew |
|---------|-----------------|---------------|
| Entity count | ~70 max simultaneous entities — AABB O(n²) is fine | Spatial grid or quadtree if >500 entities |
| Shield pixel ops | `getImageData` on small region per bullet hit — negligible | Pre-computed bitmask array would be faster |
| Rendering | `clearRect` + draw ~70 sprites per frame — well within rAF budget | Dirty-region rendering or layered canvases if overdraw became costly |
| Canvas size | Fixed 800×600 (or similar) — no dynamic resize needed | `devicePixelRatio` scaling for HiDPI if desired |

## Anti-Patterns

### Anti-Pattern 1: Game Logic in Event Handlers

**What people do:** Put `player.x -= 5` directly inside `keydown` handler.
**Why it's wrong:** Event timing is not tied to the frame loop. Logic fires asynchronously, causing duplicate moves per frame, missed inputs, or physics running at keyboard repeat rate.
**Do this instead:** Write only to a key-state Set in handlers. Read that Set inside `processInput()` during the frame loop.

### Anti-Pattern 2: Each Alien Polls Its Own Boundary

**What people do:** Give each alien an `update()` that checks if it hit the left/right wall and reverses its own direction.
**Why it's wrong:** Aliens are supposed to move as a synchronized formation. Individual boundary checks cause aliens to reverse at different times, breaking the classic stepped-descent pattern.
**Do this instead:** AlienGrid tracks one shared direction. Only the grid checks boundaries and triggers row descent.

### Anti-Pattern 3: Render Methods on Entity Classes

**What people do:** `alien.draw(ctx)`, `player.draw(ctx)` — each entity draws itself.
**Why it's wrong:** Draw order becomes implicit and hard to change. HUD layering, screen overlays (game-over screen), and debug visualisations require reach-in hacks.
**Do this instead:** Keep a single `Renderer` module. It receives the full state and draws everything in explicit order.

### Anti-Pattern 4: Shield Collision via Full-Canvas Pixel Scan

**What people do:** Call `ctx.getImageData(0, 0, canvasWidth, canvasHeight)` every frame to detect shield hits.
**Why it's wrong:** Reading the entire canvas pixel buffer is extremely slow (tens of milliseconds on a modest canvas).
**Do this instead:** Maintain per-shield off-screen canvases. On a potential hit (AABB with shield bounding box first), sample only a small region around the bullet position.

### Anti-Pattern 5: Variable-Timestep Physics

**What people do:** `alien.x += alien.speed` (speed in px/frame, no delta time).
**Why it's wrong:** On 120 Hz displays the game runs at double speed. On throttled/background tabs it lurches.
**Do this instead:** Use the fixed-timestep loop (Pattern 1). Express speeds in px/second, multiply by `dt` in seconds.

## Integration Points

### External Services

None. This is a fully self-contained browser game with no network calls, no backend, no analytics.

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `Input` -> `Game` | `isDown(keyCode)` function call | Input module has no knowledge of game state |
| `Game` -> `Entities` | Direct property reads/writes on `state` object | No message passing needed at this scale |
| `Collision` -> `Entities` | Reads entity positions, writes `alive`, removes bullets | Collision is the single mutator of cross-entity state |
| `Renderer` -> `Entities` | Read-only access to `state` | Renderer never writes to state |
| `AlienGrid` -> `Bullet` creation | AlienGrid pushes new bullet into `state.bullets[]` | AlienGrid owns alien firing decision; Collision owns outcome |

## Build Order Implications

Dependencies flow as follows — build in this order:

1. **`constants.js`** — no dependencies; needed by everything
2. **`state.js`** — no dependencies; defines the shared data structure
3. **`input.js`** — no dependencies; pure DOM event wiring
4. **Entity files** (`player.js`, `alien.js`, `bullet.js`, `ufo.js`) — depend only on constants
5. **`alienGrid.js`** — depends on `alien.js` and constants
6. **`shield.js`** — depends on Canvas API and constants; can be built standalone
7. **`collision.js`** — depends on entity shapes (constants) and shield's off-screen canvas interface
8. **`renderer.js`** — depends on all entity types (read-only) and constants
9. **`game.js`** — ties everything together; depends on all of the above

This ordering means each phase of the project can ship a runnable game: add the loop first (blank canvas), add player movement, add alien grid, add bullets + collision, add shields last (most complex).

## Sources

- [requestAnimationFrame — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) — HIGH confidence
- [2D Collision Detection — MDN Games](https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection) — HIGH confidence
- [Create a Proper Game Loop — Spicy Yoghurt](https://spicyyoghurt.com/tutorials/html5-javascript-game-development/create-a-proper-game-loop-with-requestanimationframe) — HIGH confidence
- [Performant Game Loops in JavaScript — Aleksandr Hovhannisyan](https://www.aleksandrhovhannisyan.com/blog/javascript-game-loop/) — HIGH confidence
- [Coding Space Invaders' Disintegrating Shields — Raspberry Pi / Wireframe](https://www.raspberrypi.com/news/coding-space-invaders-disintegrating-shields-wireframe-9/) — MEDIUM confidence (page fetch failed; findings cross-confirmed with other shield implementation sources)
- [Implementing Efficient Sprite Management — peerdh.com](https://peerdh.com/blogs/programming-insights/implementing-efficient-sprite-management-for-performance-optimization-in-html5-canvas-games-1) — MEDIUM confidence

---
*Architecture research for: Browser-based HTML5 Canvas Space Invaders*
*Researched: 2026-03-18*
