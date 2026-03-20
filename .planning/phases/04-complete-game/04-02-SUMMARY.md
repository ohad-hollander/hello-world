---
phase: 04-complete-game
plan: "04-02"
subsystem: ui
tags: [canvas, game-loop, wave-progression, game-over, hud]

requires:
  - phase: 04-complete-game/04-01
    provides: initUFO() callable in startNextWave(), UFO integration in game loop

provides:
  - Wave progression: destroying all aliens → 2s WAVE CLEAR! pause → next wave with 5% speed increase
  - Game-over screen: GAME OVER in red, final score, wave reached, "Press ENTER or R to restart"
  - Keyboard restart via ENTER or R key in game_over state
  - Wave number shown in HUD center (replaces static HI-SCORE placeholder)
  - All game states fully wired: playing / wave_clear / game_over

affects: []

tech-stack:
  added: []
  patterns: [state-machine update dispatch, overlay rendering pattern (renderPlaying() + dim + text)]

key-files:
  created: []
  modified:
    - js/constants.js
    - js/game.js
    - js/hud.js

key-decisions:
  - "renderGameOver() and renderWaveClear() call renderPlaying() internally; render() dispatch simplified"
  - "Shields intentionally NOT reset between waves (authentic Space Invaders behavior)"
  - "Wave speed: Math.pow(0.95, waveNumber-1) gives 5% compounding speed increase per wave"
  - "HUD center updated from static HI-SCORE placeholder to live wave number"

patterns-established:
  - "Overlay pattern: renderPlaying() + semi-transparent fillRect + centered text over frozen frame"
  - "State machine dispatch in update(dt) with clear branch per gameState"

requirements-completed: [FLOW-01, FLOW-02, FLOW-03]

duration: ~25min
completed: 2026-03-20
---

# Plan 04-02: Game Flow — Wave Progression, Game-Over Screen, and Restart Summary

**Complete Space Invaders game loop: wave counter with 5% compounding speed per wave, full GAME OVER screen with restart (ENTER/R), and wave number in HUD**

## Performance

- **Duration:** ~25 min
- **Tasks:** 6
- **Files modified:** 3

## Accomplishments
- Wave progression: all 55 aliens killed → 2s WAVE CLEAR! overlay → Wave N+1 starts with 5% faster march
- GAME OVER screen: red 72px title, final score, wave reached, restart prompt
- Keyboard restart: ENTER or R calls initGame() — resets score=0, lives=3, wave=1, fresh shields
- HUD center now shows live WAVE N instead of static HI-SCORE placeholder
- Shield damage correctly persists across waves; only full restart resets shields

## Task Commits

1. **Task 1: Wave constants** - `97c2dba` (feat)
2. **Task 2: Wave globals + initGame** - `0c07a6a` (feat)
3. **Task 3: updateWaveClear, startNextWave, updateGameOver, wire update()** - `e95e062` (feat)
4. **Task 4: renderGameOver replacement** - `36280f7` (feat)
5. **Task 5: renderWaveClear replacement** - `05fbc71` (feat)
6. **Task 6: Wave number in HUD** - `5c56a93` (feat)

## Files Created/Modified
- `js/constants.js` - WAVE_CLEAR_DELAY=2.0, WAVE_SPEED_FACTOR=0.95
- `js/game.js` - waveNumber, waveClearTimer globals; updateWaveClear(), startNextWave(), updateGameOver(); replaced placeholder renderGameOver() and renderWaveClear(); fixed render() dispatch
- `js/hud.js` - center area now shows WAVE + waveNumber instead of static HI-SCORE

## Decisions Made
- renderGameOver() and renderWaveClear() both call renderPlaying() internally, so render() dispatch was simplified to remove redundant renderPlaying() calls
- Wave speed uses Math.pow(0.95, waveNumber-1) for clean compounding; Wave 1 = base speed, Wave 2 = 95%, Wave 3 = 90.25%

## Deviations from Plan

None - plan executed exactly as written. One minor addition: updated render() dispatch to remove redundant renderPlaying() calls since the new overlay functions include renderPlaying() internally.

## Issues Encountered
None

## Next Phase Readiness
- Phase 04 complete — full Space Invaders game loop implemented
- All phases complete: canvas/input, player, aliens, shields, UFO, game flow

---
*Phase: 04-complete-game*
*Completed: 2026-03-20*
