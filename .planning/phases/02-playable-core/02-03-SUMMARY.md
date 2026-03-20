---
plan: 02-03
phase: 02-playable-core
status: complete
completed: 2026-03-20
self_check: PASSED
---

# Plan 02-03 Summary: Collision Detection & Combat

## What Was Built

Full collision detection and combat system: player bullets destroy aliens (with correct score per row), alien bullets damage the player (lives decrement, respawn with invincibility), and both game-over conditions are fully wired (lives=0 and alien invasion).

## Files Created / Modified

### Created
- `js/bullets.js` — AABB collision detection: overlaps(), updateBullets() (alien bullet movement + despawn), checkCollisions() routing to player-bullet-vs-aliens and alien-bullets-vs-player

### Modified
- `js/game.js` — updatePlaying now calls updateBullets(dt) and checkCollisions(); wave_clear state added; initGame resets alienBullets; renderGameOver/WaveClear show zero-padded score
- `index.html` — Added `<script src="js/bullets.js">` between aliens.js and game.js

## Key Decisions

- Alien bullet movement handled in bullets.js updateBullets() (not aliens.js) — keeps physics separate from firing logic
- `playerBullet` set to null on collision (bullet consumed) — prevents multi-hit from a single bullet
- `player.invincible` guard in checkAlienBulletsVsPlayer() — prevents double-hits during respawn
- wave_clear state added (getAliveCount() === 0) — clean state transition, Phase 4 will add wave progression

## Key Files

- `js/bullets.js` — overlaps(), updateBullets(), checkCollisions(), checkPlayerBulletVsAliens(), checkAlienBulletsVsPlayer()

## Requirements Covered

- CMBT-01: checkPlayerBulletVsAliens() — AABB check → killAlien() + playerBullet = null
- CMBT-02: checkAlienBulletsVsPlayer() — AABB check → lives-- → resetPlayer() or game_over
- CMBT-03: score += ROW_POINTS[alien.row] — 30/20/20/10/10 by row
- PLAY-03: alien bullet hit → lives-- → resetPlayer() (invincible=true 2s, flicker)
- PLAY-04: lives-- → if(lives <= 0) gameState = 'game_over'
- ALIN-05: updatePlaying() checks alien.y + alien.h >= GROUND_LINE → game_over

## Self-Check: PASSED

All acceptance criteria verified:
- js/bullets.js: overlaps(a,b) AABB, updateBullets(dt), checkCollisions(), killAlien(alien), score+=ROW_POINTS, lives--, resetPlayer(), gameState='game_over', player.invincible check
- js/game.js: updateBullets(dt) in updatePlaying, checkCollisions() in updatePlaying, getAliveCount()===0 wave_clear, renderWaveClear(), alienBullets.length=0 in initGame
- index.html: bullets.js tag after aliens.js, before game.js
