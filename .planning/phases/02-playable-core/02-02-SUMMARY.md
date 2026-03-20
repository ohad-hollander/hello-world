---
plan: 02-02
phase: 02-playable-core
status: complete
completed: 2026-03-20
self_check: PASSED
---

# Plan 02-02 Summary: Alien Formation

## What Was Built

The alien formation system: 55 aliens in a 5x11 grid with step-based march, wall-bounce step-down, acceleration as aliens are killed, column-based shooter designation, and alien bullet firing.

## Files Created / Modified

### Created
- `js/aliens.js` — Full formation system: aliens array, march object, alienFireState, initAliens, updateAliens, doMarchStep, doAlienFire, getColumnShooters, killAlien, getAliveCount, renderAliens

### Modified
- `js/game.js` — initGame calls initAliens; updatePlaying calls updateAliens + invasion check; renderPlaying draws aliens + alien bullets
- `index.html` — Added `<script src="js/aliens.js">` between player.js and game.js

## Key Decisions

- `alienBullets` global declared in aliens.js with `if (typeof alienBullets === 'undefined') var alienBullets = []` — plan 03 will take ownership, this guard prevents redeclaration errors
- `march.pendingDown` schedules a down-step on the NEXT march tick after a wall hit (not the same tick) — authentic arcade behavior
- Color scheme: cyan (row 0 squid), white (rows 1-2 crab), magenta (rows 3-4 octopus)
- Animation uses `animFrame` width offset (4px shrink) for a "walk" visual on each step

## Key Files

- `js/aliens.js` — Core formation module with all march and firing logic

## Requirements Covered

- ALIN-01: 55 aliens (5x11) in grid, 3 visual types by row color
- ALIN-02: Step-based march (doMarchStep on timer), pendingDown schedules step-down, march.dx reversal at walls
- ALIN-03: calcStepInterval(count) = 0.05 + (count/55) × 0.95; recalculated in killAlien()
- ALIN-04: getColumnShooters() per column bottom-most alive; doAlienFire() picks random shooter; MAX_ALIEN_BULLETS cap

## Self-Check: PASSED

All acceptance criteria verified:
- js/aliens.js: aliens=[], aliveCount=0, march={}, initAliens, updateAliens, doMarchStep, getColumnShooters, killAlien, renderAliens, calcStepInterval, march.pendingDown, march.dx=-march.dx, ALIEN_ROWS*ALIEN_COLS
- js/game.js: initAliens(), updateAliens(dt), renderAliens(ctx), alien.y+alien.h>=GROUND_LINE invasion check, gameState='game_over' trigger
- index.html: aliens.js tag after player.js, before game.js
