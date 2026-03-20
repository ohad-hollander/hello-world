---
phase: 04-complete-game
plan: "04-01"
subsystem: ui
tags: [canvas, game-loop, collision-detection, ufo]

requires:
  - phase: 03-shields
    provides: overlaps() AABB helper, checkCollisions() in bullets.js, shields module

provides:
  - Mystery UFO module (js/ufo.js) with spawn, movement, despawn, rendering, and collision
  - UFO constants in constants.js (UFO_W, UFO_H, UFO_Y, UFO_SPEED, UFO_MIN_INTERVAL, UFO_MAX_INTERVAL, UFO_POINTS)
  - checkPlayerBulletVsUFO() integrated into game loop collision chain
  - initUFO(), updateUFO(dt), renderUFO(ctx) wired into game.js

affects: [04-complete-game]

tech-stack:
  added: []
  patterns: [module pattern for game object with init/update/render/collision API]

key-files:
  created:
    - js/ufo.js
  modified:
    - js/constants.js
    - js/bullets.js
    - js/game.js
    - index.html

key-decisions:
  - "UFO checked first in checkCollisions() so consumed bullet is not double-checked"
  - "ufo.js loaded after bullets.js (needs overlaps()) and shields.js, before hud.js and game.js"
  - "Randomized bonus points from UFO_POINTS array [50, 100, 150, 300]"

patterns-established:
  - "Game object pattern: const obj = {state}; function initObj(); function updateObj(dt); function renderObj(ctx)"

requirements-completed: [UFO-01, UFO-02]

duration: ~10min
completed: 2026-03-20
---

# Plan 04-01: UFO — Spawn, Movement, Collision, and Bonus Score Summary

**Mystery UFO module with periodic flyby (15-25s interval), AABB collision, and randomized bonus points (50/100/150/300) integrated into the full game loop**

## Performance

- **Duration:** ~10 min
- **Tasks:** 5
- **Files modified:** 5

## Accomplishments
- Created `js/ufo.js` with complete UFO lifecycle: spawn, movement, despawn, rendering, collision
- UFO flies at y=30 at 90 px/sec, entering from random edge, exiting opposite edge
- Player bullet hitting UFO: bullet consumed, UFO despawned, score += random bonus
- All UFO constants centralized in constants.js
- Script load order in index.html correctly positions ufo.js

## Task Commits

1. **Task 1: Add UFO constants** - `1883262` (feat)
2. **Task 2: Create js/ufo.js** - `806dd88` (feat)
3. **Task 3: Add UFO collision to bullets.js** - `ec48cf0` (feat)
4. **Task 4: Integrate UFO into game.js** - `6bb181d` (feat)
5. **Task 5: Add ufo.js to index.html** - `9270dbb` (feat)

## Files Created/Modified
- `js/ufo.js` - UFO state object, init/update/render/collision functions
- `js/constants.js` - UFO_W, UFO_H, UFO_Y, UFO_SPEED, UFO_MIN/MAX_INTERVAL, UFO_POINTS
- `js/bullets.js` - checkPlayerBulletVsUFO() added as first call in checkCollisions()
- `js/game.js` - initUFO(), updateUFO(dt), renderUFO(ctx) integrated; playerBullet=null on restart
- `index.html` - ufo.js script tag after shields.js, before hud.js

## Decisions Made
- UFO collision checked first in checkCollisions() for correctness (consumed bullet not double-checked)
- despawnUFO() resets spawnTimer to 0 and reuses spawnInterval set by spawnUFO() for next cycle

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- UFO fully functional; plan 04-02 can safely call initUFO() in startNextWave() and restart
- waveNumber global needed by 04-02 not yet declared; 04-02 adds it to game.js

---
*Phase: 04-complete-game*
*Completed: 2026-03-20*
