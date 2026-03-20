# Phase 3: Destructible Shields — Research

**Researched:** 2026-03-20
**Phase:** 03 — Destructible Shields
**Requirements:** SHLD-01, SHLD-02, SHLD-03

---

## 1. Existing Codebase Architecture (What Phase 3 Inherits)

From Phase 2, the project has this file structure:

```
index.html          — canvas setup, DPR scaling, rAF loop, initGame() entry
js/constants.js     — LOGICAL_WIDTH=672, LOGICAL_HEIGHT=768, all game constants
js/input.js         — keys state map
js/player.js        — player entity, playerBullet, updatePlayer(), renderPlayer()
js/aliens.js        — aliens array, march state, doMarchStep(), renderAliens()
js/bullets.js       — overlaps(), updateBullets(), checkCollisions()
js/hud.js           — renderHUD()
js/game.js          — gameState, update(), render(), renderPlaying()
```

Key facts for Phase 3:
- Canvas is 672×768 logical pixels (DPR-scaled in index.html, `ctx` is a global)
- Player sits at y≈690, `GROUND_LINE=720`
- Alien formation starts at y=120, `ALIEN_CELL_H=48`
- `playerBullet` is a global nullable object `{x, y, w, h, vy}`
- `alienBullets` is a global array of `{x, y, w, h, vy}` objects
- `aliens` is a global array with `.x`, `.y`, `.w`, `.h`, `.alive`, `.row`, `.col`
- Collision detection is in `bullets.js`: `checkPlayerBulletVsAliens()` and `checkAlienBulletsVsPlayer()`
- `checkCollisions()` is called from `updatePlaying()` in `game.js`
- `renderPlaying()` in `game.js` calls render functions in order: aliens, player, HUD, alien bullets

---

## 2. Shield Layout (SHLD-01)

### Authentic Space Invaders Shield Positions

Original Space Invaders uses 4 shields, evenly spaced between the player and alien formation.

In the 3× scaled coordinate system (672×768):

```
SHIELD_Y = 600       // top edge of shields (above player at y=690)
SHIELD_W = 66        // 22px × 3 scale
SHIELD_H = 48        // 16px × 3 scale (authentic proportions)

// 4 shields evenly distributed across 672px width
// Original spacing: shields at x≈48, 168, 288, 408 (× 3 scale)
SHIELD_POSITIONS = [96, 240, 384, 528]  // left edges
```

The shield shape in authentic Space Invaders is not a plain rectangle — it has a notch cut out from the bottom-center (where the player gun nozzle sits under it). For Phase 3, a bitmap template defines the initial shape.

---

## 3. Core Technique: Offscreen Canvas for Pixel-Level Collision (SHLD-02)

This is the key architectural decision (already flagged in STATE.md): **each shield is rendered to its own offscreen canvas, and pixel-level collision is checked by reading pixel alpha values from that offscreen canvas.**

### Why Offscreen Canvas

- The main canvas is re-cleared every frame — shields can't "persist" on it
- Storing a 2D boolean array of pixels would work but requires manual rendering
- Offscreen canvas approach: shields are both stored and rendered via canvas API naturally
- `ctx.getImageData()` lets us read pixel alpha to check if a pixel is "live" or "eroded"
- `ctx.clearRect()` erodes pixels — fast, native, handles the irregular crater shapes

### Shield Object Structure

```javascript
// js/shields.js
const shields = [];

// Each shield:
{
  x: 96,          // logical x of top-left corner (main canvas coords)
  y: 600,         // logical y of top-left corner (main canvas coords)
  w: 66,          // logical width in pixels
  h: 48,          // logical height in pixels
  canvas: null,   // OffscreenCanvas (or regular canvas) — the pixel store
  ctx: null       // 2d context of the offscreen canvas
}
```

### OffscreenCanvas vs. createElement('canvas')

`OffscreenCanvas` is supported in modern browsers (Chrome, Firefox, Edge). For maximum compatibility (and since this project avoids build tools and opens as `file://`), using `document.createElement('canvas')` is safer — it works identically for this use case:

```javascript
function createShield(x, y) {
  const offscreen = document.createElement('canvas');
  offscreen.width  = SHIELD_W;   // in logical pixels (no DPR — offscreen is pixel-accurate)
  offscreen.height = SHIELD_H;
  const sCtx = offscreen.getContext('2d');
  // Draw initial shield shape
  drawShieldShape(sCtx, SHIELD_W, SHIELD_H);
  return { x, y, w: SHIELD_W, h: SHIELD_H, canvas: offscreen, ctx: sCtx };
}
```

**Critical:** The offscreen canvas has `width=SHIELD_W, height=SHIELD_H` in logical pixels. The main canvas has DPR scaling applied via `ctx.scale(dpr, dpr)`. When drawing the offscreen canvas to the main canvas using `drawImage()`, we draw at logical coords and let the DPR scaling handle device pixels automatically.

---

## 4. Shield Shape: Bitmap Template

The authentic Space Invaders shield is a bunker shape — wider than it is tall, with a notch carved from the bottom center for the player gun. The exact pixel template (in a 22×16 logical pixel grid, 3× = 66×48):

```
Rows 0-9:  full solid green (66px wide)
Rows 10-15: two pillars — left 18px and right 18px solid, center 30px empty (notch)
```

Drawing function:

```javascript
function drawShieldShape(sCtx, w, h) {
  sCtx.fillStyle = '#0f0'; // classic green
  // Upper solid block (rows 0 through ~60% of height)
  const notchY = Math.floor(h * 0.625); // notch starts at row 10 of 16 (62.5%)
  sCtx.fillRect(0, 0, w, notchY);
  // Left pillar of notch
  const notchW = Math.floor(w * 0.45);   // 45% center gap
  const pillarW = Math.floor((w - notchW) / 2);
  sCtx.fillRect(0, notchY, pillarW, h - notchY);
  // Right pillar
  sCtx.fillRect(w - pillarW, notchY, pillarW, h - notchY);
}
```

---

## 5. Bullet vs. Shield Pixel Collision (SHLD-02)

### Detection Algorithm

For each active bullet, check if it overlaps a shield's bounding box (AABB first, fast rejection), then sample the pixel under the bullet's tip on the shield's offscreen canvas.

**Player bullet:** moving upward — check the TOP edge of the bullet (it hits from below the shield going up... wait, actually player bullets travel up, so they enter a shield from its BOTTOM). Check `bullet.y` (top of bullet) against shield.

Actually: player bullet travels upward (vy < 0). It enters a shield from the bottom of the shield. The "tip" of the upward-moving bullet is its top edge at `bullet.y`. Check pixels at the bullet tip.

**Alien bullet:** moving downward (vy > 0). Tip is the bottom edge at `bullet.y + bullet.h`. Check pixels at that point.

```javascript
function checkBulletVsShield(bullet, shield, isAlienBullet) {
  // 1. AABB fast check
  if (bullet.x + bullet.w <= shield.x) return false;
  if (bullet.x >= shield.x + shield.w) return false;
  if (bullet.y + bullet.h <= shield.y) return false;
  if (bullet.y >= shield.y + shield.h) return false;

  // 2. Pixel-level check — translate bullet tip to shield local coords
  const tipX = Math.floor(bullet.x + bullet.w / 2 - shield.x); // center of bullet
  const tipY = isAlienBullet
    ? Math.floor(bullet.y + bullet.h - shield.y)  // alien bullet: bottom tip
    : Math.floor(bullet.y - shield.y);             // player bullet: top tip

  // Clamp to offscreen canvas bounds
  const px = Math.max(0, Math.min(shield.w - 1, tipX));
  const py = Math.max(0, Math.min(shield.h - 1, tipY));

  // Read pixel alpha from offscreen canvas
  const imgData = shield.ctx.getImageData(px, py, 1, 1);
  const alpha = imgData.data[3]; // index 3 = alpha channel

  return alpha > 0; // pixel is live (not yet eroded)
}
```

### Erosion on Hit

When a bullet hits a live shield pixel, erase a small circular area around the impact point:

```javascript
function erodeShield(shield, localX, localY, radius) {
  shield.ctx.clearRect(
    localX - radius,
    localY - radius,
    radius * 2,
    radius * 2
  );
  // Or for circular craters:
  shield.ctx.save();
  shield.ctx.globalCompositeOperation = 'destination-out';
  shield.ctx.beginPath();
  shield.ctx.arc(localX, localY, radius, 0, Math.PI * 2);
  shield.ctx.fill();
  shield.ctx.restore();
}
```

Crater radius: 4px (logical) — visually significant but not too destructive per hit.

**`destination-out` composite operation** erases pixels within the arc — this is the key technique for non-rectangular erosion.

### Bullet Consumed on Shield Hit

Like alien collision, bullet is removed from play when it hits a shield pixel.

---

## 6. Rendering Shields on Main Canvas

Each frame in `renderPlaying()`, draw all shields:

```javascript
function renderShields(ctx) {
  for (const shield of shields) {
    ctx.drawImage(shield.canvas, shield.x, shield.y, shield.w, shield.h);
  }
}
```

`drawImage(offscreenCanvas, dx, dy, dw, dh)` — draws the offscreen canvas at logical coords. The DPR scaling applied to `ctx` handles device pixel mapping automatically. The transparent (eroded) pixels remain transparent.

---

## 7. Alien Overflight Erosion (SHLD-03)

When aliens march over a shield position, the shield is eroded from above.

### Detection

Each march step, check if any alive alien's bounding box overlaps any shield's bounding box:

```javascript
function checkAlienOverflightVsShields() {
  for (const alien of aliens) {
    if (!alien.alive) continue;
    for (const shield of shields) {
      if (overlaps(alien, shield)) {
        // Alien is over this shield — erase top strip
        const localX = Math.floor(alien.x + alien.w / 2 - shield.x);
        const localY = Math.floor(alien.y + alien.h - shield.y); // alien bottom in shield coords
        erodeShieldStrip(shield, localX, localY, alien.w);
      }
    }
  }
}
```

### Overflight Erosion Strategy

Rather than individual pixel checks, erase a horizontal strip matching the alien's width at the contact y-position:

```javascript
function erodeShieldStrip(shield, localX, localY, width) {
  // Erase a rectangular strip from the top of the shield where the alien overlaps
  const stripX = Math.max(0, localX - Math.floor(width / 2));
  const stripW = Math.min(shield.w - stripX, width);
  const stripY = Math.max(0, localY - 4); // 4px strip height
  const stripH = Math.min(shield.h - stripY, 4);
  shield.ctx.clearRect(stripX, stripY, stripW, stripH);
}
```

This is called once per march step (not every frame), matching the "aliens passing over erodes shields" authentic behavior.

---

## 8. Coordinate System: The Critical Translation

**Problem flagged in STATE.md:** Shields live at logical main-canvas coordinates (e.g., x=96, y=600). The offscreen canvas has its own local coordinate system (0,0) to (66,48).

**Translation formula:**
```
localX = worldX - shield.x
localY = worldY - shield.y
```

This applies when:
- Converting bullet tip position to offscreen canvas coords for `getImageData()`
- Converting bullet impact point to offscreen canvas coords for `erodeShield()`
- Converting alien bottom-edge position to offscreen canvas coords for overflight erosion

**DPR is NOT a factor for offscreen canvas pixel reads.** The offscreen canvas is created at logical pixel dimensions (66×48). The `drawImage()` call scales it to the DPR-scaled main canvas automatically. `getImageData()` reads from the offscreen canvas in its own logical pixel space — no DPR correction needed.

---

## 9. Integration Points in Existing Code

### What needs to change in existing files:

**`js/constants.js`** — add shield constants:
```javascript
const SHIELD_Y    = 600;
const SHIELD_W    = 66;
const SHIELD_H    = 48;
const SHIELD_POSITIONS = [96, 240, 384, 528]; // x left-edges of 4 shields
const SHIELD_CRATER_RADIUS = 4;  // px radius of bullet erosion crater
```

**`js/bullets.js`** — extend `checkCollisions()` to call shield checks:
```javascript
function checkCollisions() {
  checkPlayerBulletVsAliens();
  checkAlienBulletsVsPlayer();
  checkPlayerBulletVsShields();   // NEW
  checkAlienBulletsVsShields();   // NEW
}
```

**`js/game.js`** — extend `initGame()` and `renderPlaying()`:
```javascript
function initGame() {
  // ... existing ...
  initShields();   // NEW
}

function renderPlaying() {
  renderShields(ctx);  // NEW — render under aliens (shields are below alien level)
  renderAliens(ctx);
  renderPlayer(ctx);
  renderHUD(ctx);
  // alien bullets...
}
```

Also call `checkAlienOverflightVsShields()` from `doMarchStep()` in `aliens.js` after each step.

**`js/aliens.js`** — add overflight check in `doMarchStep()`:
```javascript
function doMarchStep() {
  // ... existing march logic ...
  if (typeof checkAlienOverflightVsShields === 'function') {
    checkAlienOverflightVsShields();
  }
}
```

**`index.html`** — add `<script src="js/shields.js"></script>` before `game.js`.

### New file: `js/shields.js`

All shield initialization, pixel collision, erosion, and rendering logic lives here.

---

## 10. Performance Considerations

### `getImageData()` Cost

`getImageData()` is relatively expensive when called many times per frame. Mitigations:

1. **AABB pre-filter:** Only call `getImageData()` when bullet bounding box overlaps shield bounding box — most frames, no bullet is near a shield.
2. **Read 1×1 pixel only:** `getImageData(px, py, 1, 1)` reads a single pixel — minimal data.
3. **Max bullets:** Player has 1 bullet, aliens have 3 max — at most 4 `getImageData()` calls per frame (after AABB filter).
4. **Overflight on step:** Alien overflight check runs once per march step (every ~0.05–1.0 seconds), not every frame.

Expected `getImageData()` calls per frame in worst case: 4 × 4 shields = 16 calls (one per bullet-shield pair after AABB). In practice, far fewer — bullets are rarely near all shields simultaneously.

---

## 11. Pitfalls to Avoid

1. **DPR confusion in offscreen canvas:** The offscreen canvas is created at logical pixel dimensions (SHIELD_W × SHIELD_H). Do NOT apply DPR scaling to it. `getImageData()` reads in offscreen-canvas pixel space (= logical pixel space). The `ctx.drawImage()` in the main canvas handles DPR automatically via the pre-applied `ctx.scale(dpr, dpr)`.

2. **Coordinate translation errors:** Every bullet-position-to-shield-local-space conversion must subtract `shield.x` and `shield.y`. Off-by-one here causes collision misses or wrong erosion positions.

3. **Bounds clamping for `getImageData()`:** `getImageData(px, py, 1, 1)` throws if px or py is out of canvas bounds. Always clamp: `px = Math.max(0, Math.min(shield.w - 1, px))`.

4. **`destination-out` composite operation:** Must save/restore context state around composite operation use. Failing to restore `globalCompositeOperation` to `'source-over'` will make subsequent draws erase content instead of painting it.

5. **Bullet order in collision checks:** Check bullet vs. shields BEFORE checking bullet vs. aliens (or vice versa — but be consistent). If a bullet hits a shield, it should be consumed and not checked against aliens in the same frame. Current `checkCollisions()` returns early from alien check when bullet is null — shields check can do the same.

6. **Overflight frequency:** Only check alien overflight in `doMarchStep()`, not in `updateAliens()` (which runs every fixed-step frame). Running it every frame would destroy shields too fast. The authentic behavior is gradual erosion as the formation passes over.

7. **`clearRect` vs `destination-out`:** `clearRect()` works for rectangular erosion. For circular craters, must use `destination-out`. Both produce transparent pixels that `drawImage()` renders as transparent on the main canvas (since the main canvas background is black `#000`).

---

## 12. Plan Structure Recommendation

Phase 3 can be implemented in **1 plan** (single wave, all 3 requirements are tightly coupled):

**Plan 03-01 — Shields: Offscreen Canvas + Pixel Collision + Overflight**
- SHLD-01: `initShields()` — create 4 offscreen canvases, draw bunker shapes, add to `shields[]`
- SHLD-02: pixel collision for player and alien bullets — `checkPlayerBulletVsShields()`, `checkAlienBulletsVsShields()`, `erodeShield()`
- SHLD-03: alien overflight — `checkAlienOverflightVsShields()` called from `doMarchStep()`
- Integration: `js/shields.js` new file, updates to `constants.js`, `bullets.js`, `game.js`, `aliens.js`, `index.html`

All 3 requirements share the same offscreen canvas infrastructure — splitting into separate plans would force awkward partial states.

---

## Validation Architecture

How to verify Phase 3 works without a test framework (browser-only project):

**Console-verifiable checks:**
- `shields` array has length 4 after `initGame()`
- Each shield has `canvas` with `width=66, height=48`
- After a player bullet hits a shield: `getImageData()` on the impact pixel returns alpha=0

**Visual verification (human checkpoint):**
1. Open `index.html` → see 4 green bunker shapes above the player, below the alien formation
2. Fire player bullet into shield bottom → visible crater forms in the shield
3. Alien bullet hits shield from above → visible crater forms at impact
4. Multiple hits on same shield area → progressive destruction, shield visibly shrinks
5. Hit same spot repeatedly → shield disappears entirely in that area
6. Let alien formation march down until it overlaps shield positions → shield pixels erode from top as aliens pass over
7. Eventually a shield erodes completely → no pixels remain visible, bullets pass through

**Grep-verifiable acceptance criteria:**
- `js/shields.js` exists and contains `getImageData`
- `js/shields.js` contains `destination-out` (for crater erosion)
- `js/shields.js` contains `drawImage` (for rendering shields to main canvas)
- `js/constants.js` contains `SHIELD_POSITIONS`
- `js/constants.js` contains `SHIELD_Y`
- `js/bullets.js` contains `checkPlayerBulletVsShields`
- `js/bullets.js` contains `checkAlienBulletsVsShields`
- `js/aliens.js` contains `checkAlienOverflightVsShields`
- `index.html` contains `shields.js`

---

## Summary

Phase 3 is architecturally self-contained but tightly coupled internally. The key technique is the **offscreen canvas per shield**: it serves as both the pixel data store (alpha=0 means eroded) and the rendering source (`drawImage` to main canvas). The DPR handling is clean — offscreen canvases live in logical pixel space, DPR scaling is applied only on the main canvas and handles rendering automatically.

The three requirements (position, erosion, overflight) all use the same offscreen canvas infrastructure. One plan is sufficient and appropriate.

Critical coordinates: `SHIELD_Y=600`, positions `[96, 240, 384, 528]`, size `66×48`.

## RESEARCH COMPLETE
