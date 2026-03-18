# Pitfalls Research

**Domain:** Browser-based HTML5 Canvas arcade game (Space Invaders)
**Researched:** 2026-03-18
**Confidence:** HIGH

---

## Critical Pitfalls

### Pitfall 1: Frame-Rate-Dependent Movement

**What goes wrong:**
Game objects (player cannon, bullets, aliens) move at speeds expressed in pixels-per-frame rather than pixels-per-second. On a 60 Hz display the game runs fine. On a 120 Hz display everything moves twice as fast and is unplayable. On a throttled or busy system the game runs in slow motion.

**Why it happens:**
The simplest implementation multiplies a speed constant by 1 each frame: `x += speed`. This looks correct at 60 FPS and the problem only surfaces when tested on different hardware.

**How to avoid:**
Use delta time. `requestAnimationFrame` passes a high-resolution timestamp to its callback. Calculate `deltaTime = (timestamp - lastTimestamp) / 1000` (seconds) and multiply all movement by it: `x += speed * deltaTime`. For Space Invaders specifically, the alien step-movement mechanic is timer-driven (time between steps), not pixel-per-frame, so using `setInterval`-based timing for the alien movement tick is actually acceptable here — but the player cannon and bullets must still use delta time.

**Warning signs:**
- Movement looks fast on your MacBook but sluggish on a Windows laptop
- No `deltaTime` or timestamp variable anywhere in the game loop

**Phase to address:** Game loop / core mechanics phase (foundational — hard to retrofit)

---

### Pitfall 2: Using setInterval for the Alien Movement Clock and Leaking It on Restart

**What goes wrong:**
Many Space Invaders tutorials use `setInterval` for the alien movement tick. When the player dies and the game restarts, a new `setInterval` is created but the old one is never cleared. Multiple intervals fire simultaneously, causing aliens to move erratically and at exponentially increasing speeds. This was cited as the most challenging bug by multiple JavaScript Space Invaders implementations.

**Why it happens:**
`setInterval` returns an ID needed to cancel it. Developers forget to store the ID in a variable scoped outside the restart function, making `clearInterval` impossible without it.

**How to avoid:**
Store every interval ID in a module-level variable. Before any restart, call `clearInterval` (or `cancelAnimationFrame`) on all stored IDs, then reinitialize. A cleaner alternative: drive alien step timing entirely from within the `requestAnimationFrame` loop using an accumulator (`alienStepAccumulator += deltaTime; if (alienStepAccumulator >= alienStepInterval) { stepAliens(); alienStepAccumulator = 0; }`). This eliminates `setInterval` entirely.

**Warning signs:**
- Aliens suddenly begin moving at double or triple speed after the first game-over/restart cycle
- `setInterval(...)` call inside a function that runs more than once without a paired `clearInterval`

**Phase to address:** Game loop phase; verified again in game-over / restart phase

---

### Pitfall 3: Keyboard Input Using Event-Rate Instead of Game-Loop-Rate

**What goes wrong:**
Player movement is applied directly inside `keydown` event handlers rather than in the game loop. Because `keydown` repeats at the OS key-repeat rate (typically 30 Hz) and the game loop runs at 60 Hz, movement is choppy and inconsistent. Additionally, only one key can be tracked at a time, so holding left while pressing fire feels unresponsive.

**Why it happens:**
Moving the player in `onkeydown` feels intuitive and works in simple demos. The problem is only noticeable when the game loop runs faster than the OS repeat rate, or when the player holds two keys simultaneously.

**How to avoid:**
Use the "input state map" pattern. On `keydown`, set `keys[event.key] = true`. On `keyup`, set `keys[event.key] = false`. In the game loop update step, read `keys['ArrowLeft']`, `keys['ArrowRight']`, `keys[' ']` (spacebar) to determine what to do. This decouples input sampling from input processing.

**Warning signs:**
- Movement or shooting logic inside a `keydown` or `keyup` handler directly (not just setting a flag)
- Player movement visually stutters at steady speed

**Phase to address:** Input handling phase (foundational — player controls)

---

### Pitfall 4: Alien Grid Direction Change Off by One Pixel

**What goes wrong:**
Aliens reverse direction and drop one row at the wrong position — either reversing before reaching the edge (leaving a gap) or reversing after they've already gone off-screen (clipping through the wall). This is especially jarring because the original arcade game's edge detection is pixel-precise.

**Why it happens:**
The grid boundary check is done against the reference alien's position without accounting for the width of the entire formation. The check should be: `(leftmostAlienX <= leftMargin)` and `(rightmostAlienX + alienWidth >= rightMargin)`. Developers often check only the reference alien or forget to add `alienWidth`.

**How to avoid:**
Track the bounding box of the entire live alien formation dynamically. After each horizontal step, compute `minX = min of all living alien x positions` and `maxX = max of all living alien x positions + alienWidth`. Reverse direction and drop when either boundary is crossed.

**Warning signs:**
- Aliens visually clip the screen edge before reversing
- A gap remains between the last alien column and the screen edge when reversing

**Phase to address:** Alien movement phase

---

### Pitfall 5: Collision Detection Runs Against Dead Aliens

**What goes wrong:**
A bullet collides with an alien that was already destroyed earlier the same frame (or previous frames), registering a phantom hit. On the player side, an alien bullet can kill the player after the player was already dead.

**Why it happens:**
The alien array is not filtered before collision checks, and destroyed aliens remain in the array with a flag like `alive = false`. The collision loop checks all entries including dead ones, and if the position data is still set, a hit can be registered.

**How to avoid:**
Skip entities with `alive === false` at the top of every collision check loop. Use a guard: `if (!alien.alive) continue;`. For bullets, remove them from the array immediately when they hit something rather than marking and filtering later.

**Warning signs:**
- Player loses a life immediately after a bullet appears to miss
- Score increments without a visible alien being on screen at that position

**Phase to address:** Collision detection phase

---

### Pitfall 6: Destructible Shields Implemented as Rectangles Instead of Pixel Maps

**What goes wrong:**
Shields are implemented as solid rectangles with AABB collision. When a bullet hits, the entire shield disappears or a rectangular chunk is removed. This looks nothing like the original game's erosion effect where pixel-level craters form around each hit.

**Why it happens:**
AABB collision is taught first and is significantly simpler. The pixel-level erosion of the original game requires a different approach that most tutorials skip.

**How to avoid:**
Represent each shield as an offscreen `<canvas>` element (or an array of pixel state booleans matching the shield's bounding box). On a bullet hit, perform a two-step check: (1) broad-phase AABB to detect which shield was hit, (2) narrow-phase pixel check using `getImageData` at the bullet's position to confirm an actual pixel exists there and hasn't already been eroded. Erase a small radius of pixels around the impact point using `clearRect` or `destination-out` composite operation.

**Warning signs:**
- Shield disappears completely on first hit
- Shield shows rectangular damage chunks rather than irregular craters

**Phase to address:** Shields phase — this is the most complex feature; deserves its own phase or sub-task

---

### Pitfall 7: Player Bullet Limit Not Enforced

**What goes wrong:**
The player can fire continuously without restriction, flooding the screen with bullets. This removes a core tension mechanic of the original game and trivializes the challenge. The original Space Invaders enforces exactly one player laser on screen at a time.

**Why it happens:**
Adding a bullet limit is a one-line check that is easy to overlook during initial implementation: `if (bullets.length > 0) return;` before creating a new bullet. The game "works" without it.

**How to avoid:**
Add the single-bullet constraint explicitly in the shoot handler: only spawn a new player laser if no player laser currently exists in the active bullet array. Track player and alien bullets separately so this constraint applies only to the player.

**Warning signs:**
- Spacebar spam instantly clears any alien column
- No variable or check gating how many player bullets exist

**Phase to address:** Shooting mechanics phase

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `location.reload()` for game restart | Dead simple restart logic | Resets page, flickers, loses any in-memory state you might want | MVP only — replace before shipping |
| Pixel-per-frame movement (no delta time) | Simpler math | Unplayable on non-60 Hz devices | Never — fix in game loop phase |
| Global variables for all game state | Fast to prototype | Restart logic becomes a nightmare of manual resets | MVP only — encapsulate in a state object early |
| AABB-only shield collision | Much simpler code | Looks wrong, breaks the "feels faithful" requirement | Never for this project — shields are a stated requirement |
| Flat alien array (no grid abstraction) | Less code upfront | Direction logic becomes tangled; hard to track bounding box | Never — represent the grid as a logical structure from day one |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Canvas `requestAnimationFrame` callback | Not passing `timestamp` argument, using `Date.now()` inside the loop instead | Use the `timestamp` parameter RAF provides; it is higher-resolution and consistent within a frame |
| Canvas resize / DPI scaling | Drawing at CSS pixel size without accounting for `devicePixelRatio`, causing blurry sprites on retina displays | Multiply canvas `width`/`height` by `window.devicePixelRatio` and scale the context with `ctx.scale(dpr, dpr)` |
| Event listeners on `window` vs. canvas element | Attaching keyboard listeners to the canvas element — it only fires if canvas has focus | Attach keyboard listeners to `document` or `window`; they bubble correctly |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Creating new bullet objects every fire event | Gradual frame rate drop as many bullets accumulate | Reuse a bullet pool or simply remove bullets immediately when they leave the screen or hit something | Once 20+ bullets are on screen simultaneously (rare in Space Invaders but possible) |
| Calling `getImageData` every frame for shield pixel checks | Severe frame rate drop — `getImageData` forces a GPU read-back | Only call `getImageData` when a bullet is inside a shield's AABB (narrow-phase only) | Every frame even with 4 shields |
| Clearing the entire canvas with `clearRect(0,0,width,height)` every frame | Marginal; canvas is small enough this is fine at 60 FPS | Acceptable for this project's scale | Not an issue at Space Invaders canvas size |
| Drawing all 55 aliens individually with `fillRect` per frame | Fine at 55 aliens; no concern | Pre-render alien sprites to an offscreen canvas if needed | Not an issue at this scale |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No visual feedback when alien is hit (instant removal) | Hits feel unregistered; game feels unresponsive | Brief flash or explosion sprite on hit, even if just 2-3 frames |
| Player death resets score to 0 immediately | Disorienting; player doesn't know what their score was | Display "GAME OVER" with final score before resetting |
| Aliens reach the bottom with no warning | Sudden game-over feels unfair | Have aliens visually accelerate (already natural) but ensure the game-over condition is clearly communicated |
| No pause on tab switch | `requestAnimationFrame` halts automatically when tab loses focus, but resuming drops accumulated delta time causing a huge position jump | Clamp `deltaTime` to a maximum value (e.g., `Math.min(deltaTime, 0.05)`) to prevent teleportation after a tab switch |

---

## "Looks Done But Isn't" Checklist

- [ ] **Alien speed increase:** The formation speeds up as aliens are eliminated — verify that fewer aliens actually step more frequently, not just that speed is incremented on kill
- [ ] **Bottom alien fires only:** Only the lowest alive alien in each column fires at the player — verify the column check filters by alive status
- [ ] **Restart is clean:** All bullets, aliens, the player state, timers, and score reset on restart — verify no ghost entities from the previous game survive
- [ ] **UFO scoring:** The mystery UFO awards variable points (50, 100, 150, 300 in the original) — verify the score is not hardcoded to a single value
- [ ] **Shield pixel erosion:** Alien bullets also erode shields from above, not only player bullets from below — verify bidirectional shield damage
- [ ] **Player bullet limit:** Only one player laser can be on screen at a time — verify fire input is ignored while a player laser is active
- [ ] **Game over on alien reaching bottom row:** If any alien reaches the player's row, the game ends immediately even if the player has lives left — verify this condition

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Frame-rate-dependent movement discovered post-implementation | MEDIUM | Introduce `deltaTime` into the game loop; audit every `x +=` and `y +=` statement to multiply by `deltaTime`; re-tune all speed constants (they will need rescaling from px/frame to px/sec) |
| Timer leak on restart discovered | LOW | Identify all `setInterval`/`setTimeout` calls, ensure IDs are stored in module-level variables, add `clearInterval`/`clearTimeout` to the restart function |
| AABB-only shields discovered | HIGH | Shields must be rebuilt as offscreen canvas pixel maps; substantial rework of collision detection for shield objects |
| Global state making restart buggy | MEDIUM | Encapsulate all mutable game state in a plain object; write a `resetGameState()` function that reinitializes the object to starting values |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Frame-rate-dependent movement | Game loop setup | Test on a device or simulated 120 Hz display; confirm player speed is consistent |
| setInterval timer leak on restart | Game loop setup + restart flow | Restart 5 times rapidly; alien speed must remain consistent |
| Keyboard event-rate input | Input handling | Hold left + fire simultaneously; both must register each frame |
| Alien grid direction off-by-one | Alien movement | Watch aliens reach both left and right edges; confirm flush contact, no gap or clip |
| Collision against dead entities | Collision detection | Destroy entire row quickly; confirm no phantom score or phantom death |
| Shields as rectangles only | Shields phase | Fire at shield corner; confirm pixel-level erosion pattern |
| Missing player bullet limit | Shooting mechanics | Hold spacebar; confirm only one player laser on screen at a time |
| Unclamped delta time on tab switch | Game loop setup | Switch away mid-game for 5 seconds, return; player must not teleport |

---

## Sources

- [MDN: Anatomy of a video game](https://developer.mozilla.org/en-US/docs/Games/Anatomy) — game loop fundamentals
- [Spicy Yoghurt: Proper Game Loop](https://spicyyoghurt.com/tutorials/html5-javascript-game-development/create-a-proper-game-loop-with-requestanimationframe) — setInterval vs requestAnimationFrame pitfalls
- [Aleksandr Hovhannisyan: JavaScript Game Loop](https://www.aleksandrhovhannisyan.com/blog/javascript-game-loop/) — performant game loops
- [Computer Archeology: Space Invaders disassembly](https://computerarcheology.com/Arcade/SpaceInvaders/) — original game mechanics reference (alien count, movement, timing)
- [Brian Koponen: Space Invaders Part 3 — Enemy Behavior](https://www.briankoponen.com/html5-javascript-game-tutorial-space-invaders-part-3/) — group movement and firing logic
- [Brian Koponen: Space Invaders Part 4 — Collision Detection](https://www.briankoponen.com/html5-javascript-game-tutorial-space-invaders-part-4/) — shield collision approaches
- [toivjon: HTML5 Space Invaders blog](https://toivjon.wordpress.com/2017/09/17/html5-space-invaders/) — two-phase shield collision, pixel-level destruction
- [MDN: Optimizing canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) — performance pitfalls
- [xjavascript.com: Multiple keys pressed at once](https://www.xjavascript.com/blog/how-to-detect-if-multiple-keys-are-pressed-at-once-using-javascript/) — input state map pattern
- [Classic Gaming: Space Invaders play guide](https://classicgaming.cc/classics/space-invaders/play-guide) — one-bullet rule, original mechanics

---
*Pitfalls research for: HTML5 Canvas Space Invaders (browser game)*
*Researched: 2026-03-18*
