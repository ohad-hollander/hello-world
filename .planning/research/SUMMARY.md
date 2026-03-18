# Project Research Summary

**Project:** Space Invaders Browser Remake
**Domain:** Browser-based HTML5 Canvas arcade game
**Researched:** 2026-03-18
**Confidence:** HIGH

## Executive Summary

This is a faithful browser remake of the 1978 Space Invaders arcade game, implemented entirely in vanilla JavaScript with the HTML5 Canvas 2D API and no external dependencies or build tooling. The canonical approach — confirmed across all four research areas — is to use `requestAnimationFrame` with delta-time or a fixed-timestep accumulator loop, represent the 55-alien grid as a single coordinated entity, and separate concerns cleanly into input, entities, collision, and renderer modules. The project is deliberately small in scope (~500 lines of logic) and does not benefit from any game framework or bundler; the right call is to keep the stack at zero dependencies and serve via a simple local HTTP server.

The feature set is well-specified by the 1978 original. Table stakes — the 11×5 alien grid, horizontal march with edge-bounce and descent, alien acceleration as count drops, player single-shot constraint, alien return fire, four destructible pixel-eroding shields, the mystery UFO, three lives with a bonus life at 1500 points, and wave progression — must all be present or the game is not recognizably Space Invaders. Sound effects, 2-frame alien walk animation, pixel-art sprites, localStorage high score, and pause are low-effort high-authenticity additions that belong in a v1.x polish pass after the core loop is validated. The only genuinely hard feature is the destructible shields, which require per-pixel canvas manipulation via offscreen canvases and a two-phase (AABB then pixel) collision check.

The two highest-risk areas are the game loop and shield implementation. Frame-rate-dependent movement, timer leaks on game restart, and event-rate input handling are the pitfalls most likely to be introduced early and be expensive to retrofit. Building the game loop correctly from the start — delta time, input state map, accumulator-based alien step timing — prevents the vast majority of bugs. The shield subsystem deserves its own focused phase because it is architecturally different from all other collision logic and cannot be simplified to AABB without breaking the faithful remake contract.

## Key Findings

### Recommended Stack

No external libraries or build tools are needed for this project. Vanilla JavaScript (ES2022 ESModules) loaded via `<script type="module">` combined with the browser-native Canvas 2D API handles every requirement: the game loop, rendering, input, collision detection, and (optionally) sound via the Web Audio API. The project constraint of opening `index.html` directly in a browser is trivially met with `python3 -m http.server` (required because ESModules do not load from `file://`). If the project grows to 5+ scenes or needs TypeScript, Vite would be the right upgrade path — not a concern for this project.

**Core technologies:**
- Vanilla JS (ESModules, ES2022+): All game logic — no framework adds value at this scale
- HTML5 Canvas 2D API (browser-native): Rendering at 60 FPS; `requestAnimationFrame` drives the loop
- Web Audio API (browser-native, optional): Synthesized sound effects when added; no asset files needed
- `python3 -m http.server` or `npx serve`: Local dev server; required for ESModule CORS compliance

**Explicitly rejected:**
- Phaser 3 / PixiJS / Kontra.js: Overkill for 55 sprites; Phaser requires a bundler
- `setInterval`/`setTimeout` for the game loop: Does not sync to display refresh; causes timing drift
- `Date.now()` for frame timing: Use `performance.now()` (monotonic, sub-millisecond)
- DOM elements for game objects: Layout thrashing prevents 60 FPS
- Floating-point draw coordinates: Use `Math.round()` to prevent blurry pixel-art sprites

### Expected Features

**Must have (table stakes) — not Space Invaders without all of these:**
- 11×5 alien grid with 3 types (Squid 30pts, Crab 20pts, Octopus 10pts)
- Horizontal march with edge-bounce and one-row descent; entire formation moves as one unit
- Alien acceleration as count drops (shorter step interval proportional to survivors)
- Player cannon left/right movement only
- Single player shot on screen at a time (core tension mechanic — not a limitation, a design feature)
- Alien return fire from bottom-row aliens per column
- 4 destructible shields with pixel-level erosion (bidirectional: player and alien bullets erode from respective sides; aliens also destroy from above as they pass over)
- Mystery UFO across top row (every ~25.6s; scores 50–300 pts; stops below 8 aliens)
- Lives system: 3 lives, extra life at 1500 points
- Live score display
- Game over when aliens reach bottom row OR all lives lost
- Game over/restart flow with final score display
- Wave progression: each new wave starts the formation lower on screen

**Should have (polish, low cost, high authenticity payoff):**
- Authentic sound effects: 4-beat march tempo via Web Audio `OscillatorNode`, shoot/explosion noise bursts
- 2-frame alien walk animation (each alien type alternates frames on each march step)
- Pixel-art alien sprites (can start as placeholder shapes, swap in authentic designs)
- High score via `localStorage` (no backend required)
- Pause functionality (toggle; freeze all movement and timers)

**Defer to v2+:**
- Exact UFO shot-count scoring formula (predetermined 15-value cycle based on shot count)
- Particle/explosion effects on alien death
- Alternating two-player mode (original was turns, not simultaneous)

**Anti-features (do not build):**
- Mobile/touch controls — keyboard-first, out of scope per PROJECT.md
- Online leaderboard — requires backend infrastructure
- Power-ups, unique levels, procedural generation — breaks faithful remake contract
- Auto-fire — fundamentally breaks the single-shot mechanic

### Architecture Approach

The architecture follows a classic game loop separation pattern: a single `Game` module owns the `requestAnimationFrame` loop and wires together four independent concerns — `Input` (key state snapshot), `Entities` (Player, AlienGrid, Bullet, Shield, UFO), `Collision` (AABB plus pixel-level for shields), and `Renderer` (stateless draw pass). All mutable state lives in a single plain `state.js` object (`score`, `lives`, `phase`, `bullets[]`, etc.) shared by reference. No pub/sub, no frameworks, no callbacks needed at this scale.

**Major components:**
1. `Game` (game.js) — Owns the rAF loop; orchestrates input → update → render each frame; manages phase transitions (title / playing / paused / game-over)
2. `Input` (input.js) — Maintains a `Set` of pressed key codes via `keydown`/`keyup` listeners; exposes `isDown(code)` — no game logic in handlers
3. `AlienGrid` (entities/alienGrid.js) — 55 aliens as one coordinated entity; tracks shared direction, step timer, and bounding box; speed is `BASE_INTERVAL * (aliveCount / 55)`
4. `Shield` (entities/shield.js) — Each shield is an offscreen canvas; bullet hits use `getImageData`/`putImageData` on a small region around the impact point
5. `Collision` (collision.js) — The single module that mutates cross-entity state: removes bullets, sets `alien.alive = false`, decrements `state.lives`, erodes shield pixels
6. `Renderer` (renderer.js) — Read-only access to `state`; draws everything in explicit order; no game logic

**Key patterns:**
- Fixed-timestep accumulator loop: `lag += elapsed; while (lag >= STEP) { update(STEP); lag -= STEP; }` — decouples physics from monitor refresh rate
- Input state snapshot: handlers write only to a key `Set`; game loop reads that Set in `processInput()`
- AlienGrid as single coordinated entity: one shared direction flag; only the grid checks boundaries and triggers row descent
- Off-screen canvas per shield: AABB broad-phase first, then pixel narrow-phase; `getImageData` only on small region around hit

### Critical Pitfalls

1. **Frame-rate-dependent movement** — Express all speeds in px/second and multiply by `deltaTime`; use the fixed-timestep accumulator from day one. This is foundational and expensive to retrofit if skipped.

2. **Timer leak on game restart** — Never use `setInterval` for alien step timing; instead drive it with an in-loop accumulator (`alienStepAccumulator += dt; if (accumulator >= interval) { stepAliens(); accumulator = 0; }`). If `setInterval` is used anywhere, store every ID and `clearInterval` all of them on restart. Aliens running at 2× or 4× speed after restart is the symptom.

3. **Keyboard event-rate input** — Never put movement logic inside `keydown` handlers. Write only `pressed.add(e.code)` in the handler; read `pressed` during `processInput()` in the game loop. Simultaneous key presses and consistent per-frame timing require this.

4. **Shields implemented as rectangles** — AABB-only shield collision is a showstopper for authenticity; recovery cost is HIGH (full rebuild). Build shields as offscreen canvases with pixel erosion from the start. Two-phase collision: AABB broad-phase then `getImageData` narrow-phase.

5. **Collision against dead entities** — Guard every collision loop with `if (!alien.alive) continue;`. Remove bullets from the array immediately on hit rather than marking-and-filtering later. Phantom score increments and phantom deaths are the symptom.

**Additional must-verify items:**
- Only the lowest alive alien per column fires at the player
- Player bullet limit (exactly one on screen) — check before creating a new bullet
- Game over triggers immediately if any alien reaches the player's row, regardless of lives remaining
- `deltaTime` must be clamped (`Math.min(dt, 0.05)`) to prevent entity teleportation after a tab switch

## Implications for Roadmap

Based on the dependency graph from FEATURES.md and the build-order analysis from ARCHITECTURE.md, the natural phase structure flows from infrastructure to core mechanics to complex features to polish. The shield subsystem is the only P1 feature that cannot be built incrementally on top of simpler primitives — it requires its own focused phase.

### Phase 1: Foundation — Game Loop, Canvas, Input

**Rationale:** Everything else depends on this. The three most expensive-to-retrofit pitfalls (frame-rate-dependent movement, timer leak, event-rate input) all live here. Getting this right eliminates the majority of future debugging.
**Delivers:** Blank canvas rendering at 60 FPS, working fixed-timestep loop with delta time, input state snapshot, `constants.js` and `state.js` scaffolding.
**Addresses:** Canvas setup, `requestAnimationFrame` loop, `performance.now()` timing, `devicePixelRatio` scaling
**Avoids:** Frame-rate-dependent movement (Pitfall 1), timer leak on restart (Pitfall 2), event-rate input (Pitfall 3), unclamped delta time on tab switch

### Phase 2: Player Cannon and Shooting

**Rationale:** Player movement and the single-shot mechanic are low complexity and produce immediate visible feedback. Validates the input and loop from Phase 1 before adding alien complexity.
**Delivers:** Player cannon moving left/right; spacebar fires one bullet; bullet travels upward; bullet removed on screen exit; single-shot constraint enforced.
**Addresses:** Player cannon movement, player shooting, single-shot constraint (P1 features)
**Avoids:** Player bullet limit not enforced (Pitfall 7)

### Phase 3: Alien Formation, March, and Acceleration

**Rationale:** The alien grid is the core identity of Space Invaders. It depends on the loop and bullet system but nothing else. Building it as a single coordinated entity from the start avoids the per-alien-polling anti-pattern.
**Delivers:** 11×5 grid of three alien types with correct point values; synchronized horizontal march; edge-bounce with one-row descent; speed increase as aliens are destroyed.
**Addresses:** Alien formation, march, acceleration (all P1)
**Avoids:** Each alien polling its own boundary (Architecture anti-pattern 2), alien grid direction off-by-one (Pitfall 4)

### Phase 4: Alien Return Fire and Basic Collision

**Rationale:** Alien shooting depends on the grid (Phase 3) and the projectile system (Phase 2). This phase wires them together and introduces the collision module, which is the single source of truth for cross-entity state mutation.
**Delivers:** Bottom-row aliens fire downward projectiles at random intervals; player death on hit; lives decrement; game over when lives reach zero; score increments on alien kill.
**Addresses:** Alien return fire, lives system, score display, game over condition (P1)
**Avoids:** Collision against dead entities (Pitfall 5), each entity mutating other entities directly

### Phase 5: Destructible Shields

**Rationale:** Shields are the highest-complexity P1 feature and require a different collision approach (pixel-level) than all other entities (AABB). Isolating this phase prevents shield complexity from contaminating earlier phases. Building it after alien collision is working means the broad-phase AABB infrastructure is already in place.
**Delivers:** Four shields represented as offscreen canvases; pixel-level erosion on bullet impact from player and aliens; aliens erode shields from above as they pass; bidirectional damage verified.
**Addresses:** Destructible shields (P1, HIGH complexity)
**Avoids:** Shields implemented as rectangles (Pitfall 6), full-canvas `getImageData` every frame (Performance trap)

### Phase 6: Mystery UFO and Wave Progression

**Rationale:** Both features depend on the alien count (already tracked) and the projectile system (already built). Mystery UFO is a timer-driven feature; wave progression is a formation-reset feature. Low complexity, rounds out the complete playable loop.
**Delivers:** UFO spawns every ~25.6 seconds; player can shoot it for variable score; stops spawning below 8 aliens. Wave clear triggers formation reset at lower starting Y; game loops indefinitely.
**Addresses:** Mystery UFO, wave progression (P1); extra life at 1500 points
**Avoids:** UFO score hardcoded to single value (Looks-done-but-isn't checklist)

### Phase 7: Polish — Sound, Animation, Sprites, QoL

**Rationale:** All P2 features are independent of each other and low complexity. Adding them after the core loop is validated means changes don't break game mechanics. Sound in particular requires the alien count to already be tracked (already done in Phase 3).
**Delivers:** Web Audio march tempo (accelerates with fewer aliens), shoot/explosion/UFO sounds; 2-frame alien walk animation; pixel-art alien sprite designs; `localStorage` high score; pause functionality.
**Addresses:** Sound effects, alien animation, pixel-art sprites, high score, pause (all P2)

### Phase Ordering Rationale

- **Infrastructure before entities:** The game loop, input, and state scaffolding underpin everything. Retrofitting delta-time or input handling is expensive; doing it first eliminates that risk entirely.
- **Player before aliens:** Validates the loop with simple, immediately-visible feedback before introducing the grid's coordinated movement logic.
- **Alien grid before alien fire:** The grid is a prerequisite for alien firing (must know which column's bottom alien fires). This ordering also matches the feature dependency graph in FEATURES.md.
- **Basic collision before shields:** AABB collision for alien/player/bullet is straightforward and establishes the collision module boundary. Shields layer pixel-level logic on top of that boundary.
- **Core loop validated before polish:** Sound and animation are independent but should be added after the game feels right mechanically, so tuning decisions are made on stable ground.

### Research Flags

Phases with standard, well-documented patterns — skip deeper research during planning:
- **Phase 1 (Foundation):** `requestAnimationFrame` loop, fixed-timestep accumulator, and input state snapshot are canonical and covered thoroughly by MDN. No research needed.
- **Phase 2 (Player + Shooting):** Straightforward player movement and projectile system; standard patterns.
- **Phase 3 (Alien Grid):** The coordinated-entity pattern is well-documented in multiple Space Invaders implementation references. No surprises expected.
- **Phase 4 (Alien Fire + Collision):** AABB collision is standard; collision module boundary is already defined in ARCHITECTURE.md.
- **Phase 7 (Polish):** Web Audio oscillators for march tempo and localStorage for high score are both trivial; MDN documentation is comprehensive.

Phases likely needing focused planning attention (not external research, but careful design upfront):
- **Phase 5 (Shields):** The pixel-level erosion mechanic is the highest-complexity feature in the project. The approach is well-documented (offscreen canvas + `getImageData`/`putImageData`), but the implementation details — exactly what region to sample, how to handle the alien-erodes-from-above case, coordinate translation between main and offscreen canvases — warrant a sub-task design step before coding begins.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Recommendations are based on MDN official docs and confirmed by multiple practitioner sources. Zero-dependency vanilla JS is the unambiguous right choice for this scope. |
| Features | HIGH | Original arcade specifications are stable and well-documented across multiple independent sources (classicgaming.cc, Shmups Wiki, Wikipedia, disassembly references). |
| Architecture | HIGH | Patterns verified against MDN, Spicy Yoghurt, and multiple Space Invaders-specific implementation guides. The coordinated-entity alien grid and offscreen-canvas shield patterns are cross-confirmed. |
| Pitfalls | HIGH | Pitfalls are drawn from real implementation failures documented in practitioner guides and the original arcade disassembly. The timer-leak-on-restart pitfall in particular was independently cited by multiple sources. |

**Overall confidence:** HIGH

### Gaps to Address

- **UFO scoring formula:** The exact predetermined 15-value cycle based on player shot count is documented but complex to verify without testing against original hardware behavior. The simplified approach (random value from {50, 100, 150, 300}) is acceptable for v1 and deferred to v2+. No action needed in the roadmap.
- **Shield coordinate translation:** The offscreen-canvas approach for shields requires careful coordinate mapping between the main canvas and each shield's local canvas space. This is not a research gap but an implementation detail to nail down during Phase 5 planning.
- **`devicePixelRatio` scaling:** Retina/HiDPI display handling is mentioned in PITFALLS.md but was not deeply researched. The fix is standard (`ctx.scale(dpr, dpr)`), but the exact interaction with the fixed canvas size should be verified early in Phase 1.

## Sources

### Primary (HIGH confidence)
- [MDN — Anatomy of a video game](https://developer.mozilla.org/en-US/docs/Games/Anatomy) — game loop patterns, fixed vs. variable timestep, `performance.now()` guidance
- [MDN — Optimizing canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) — offscreen canvas, `clearRect`, `Math.floor()` for pixel coordinates
- [MDN — requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) — timing callback, `DOMHighResTimeStamp`
- [MDN — 2D Collision Detection](https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection) — AABB patterns
- [Space Invaders — classicgaming.cc play guide](https://classicgaming.cc/classics/space-invaders/play-guide) — original arcade mechanics
- [Space Invaders — Shmups Wiki](https://shmups.wiki/library/Space_Invaders) — UFO timing, shot types, alien mechanics
- [Computer Archeology: Space Invaders disassembly](https://computerarcheology.com/Arcade/SpaceInvaders/) — original hardware behavior reference

### Secondary (MEDIUM confidence)
- [Spicy Yoghurt: Proper Game Loop with rAF](https://spicyyoghurt.com/tutorials/html5-javascript-game-development/create-a-proper-game-loop-with-requestanimationframe) — fixed-timestep accumulator pattern
- [Aleksandr Hovhannisyan: JavaScript Game Loop](https://www.aleksandrhovhannisyan.com/blog/javascript-game-loop/) — performant loop patterns
- [Brian Koponen: Space Invaders Parts 3–4](https://www.briankoponen.com/html5-javascript-game-tutorial-space-invaders-part-3/) — group movement, firing logic, shield collision
- [toivjon: HTML5 Space Invaders](https://toivjon.wordpress.com/2017/09/17/html5-space-invaders/) — two-phase shield collision, pixel-level destruction
- [DEV.to — Coding Space Invaders in JavaScript](https://dev.to/codingwithadam/coding-space-invaders-in-javascript-complete-tutorial-every-step-explained-with-html5-canvas-45ja) — full Canvas implementation reference
- [LogRocket — Best JavaScript game engines (2025)](https://blog.logrocket.com/best-javascript-html5-game-engines-2025/) — framework comparison
- [JS Game Rendering Benchmark](https://github.com/Shirajuki/js-game-rendering-benchmark) — Phaser/Kaboom/Kontra/Canvas API performance data

---
*Research completed: 2026-03-18*
*Ready for roadmap: yes*
