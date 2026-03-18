# Requirements: Space Invaders

**Defined:** 2026-03-18
**Core Value:** A fully playable, faithful recreation of the original Space Invaders experience — if the core shooting and alien wave mechanics don't feel right, nothing else matters.

## v1 Requirements

### Foundation

- [ ] **FOUND-01**: Game runs in browser via HTML5 Canvas with a `requestAnimationFrame` + delta-time fixed-timestep loop
- [ ] **FOUND-02**: Canvas is sized and scaled correctly (based on original 224×256, scaled 3×)
- [ ] **FOUND-03**: Keyboard input uses a state-map pattern (flags set in event handlers, read each frame in game loop)

### Player

- [ ] **PLAY-01**: Player cannon moves left and right within bounds using arrow keys or A/D
- [ ] **PLAY-02**: Player fires a bullet with spacebar; only one player bullet active at a time
- [ ] **PLAY-03**: Player loses a life when hit by an alien bullet
- [ ] **PLAY-04**: Player starts with 3 lives; game ends when all lives are lost

### Aliens

- [ ] **ALIN-01**: 55 aliens arranged in a 5-row × 11-column formation with 3 visual types
- [ ] **ALIN-02**: Formation marches left/right as a single coordinated unit and steps down when reaching a wall
- [ ] **ALIN-03**: March speed increases as aliens are eliminated (fewer remaining = faster)
- [ ] **ALIN-04**: Aliens in the bottom row of each column fire bullets at the player
- [ ] **ALIN-05**: Game ends immediately if any alien reaches the bottom of the screen

### Combat

- [ ] **CMBT-01**: Player bullets destroy aliens on contact
- [ ] **CMBT-02**: Alien bullets damage the player on contact (life lost, brief respawn)
- [ ] **CMBT-03**: Score increases when an alien is destroyed (different values per row type)
- [ ] **CMBT-04**: HUD displays current score and remaining lives at all times

### Shields

- [ ] **SHLD-01**: 4 destructible shields are positioned above the player cannon
- [ ] **SHLD-02**: Shields erode pixel-by-pixel when hit by player or alien bullets
- [ ] **SHLD-03**: Shields are destroyed by alien overflight (aliens marching over them remove shield pixels)

### UFO

- [ ] **UFO-01**: A mystery UFO periodically flies across the top of the screen
- [ ] **UFO-02**: Shooting the UFO awards bonus points

### Game Flow

- [ ] **FLOW-01**: When all aliens are destroyed, a new wave begins (aliens reset, speed increases slightly)
- [ ] **FLOW-02**: A game-over screen is shown when all lives are lost, with a restart option
- [ ] **FLOW-03**: The game can be restarted cleanly without page reload (no timer leaks)

## v2 Requirements

### Audio

- **AUDI-01**: Alien march sound — 4-beat tempo that accelerates with alien speed
- **AUDI-02**: Shoot, explosion, and UFO sound effects via Web Audio API oscillators

### Polish

- **POLS-01**: Pixel-art sprite sheet replaces programmatic shapes
- **POLS-02**: UFO score follows the authentic 15-value shot-count cycle
- **POLS-03**: High score persisted in localStorage

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile touch controls | Keyboard-first; adds complexity without serving the goal |
| Multiplayer | Out of scope for a single-player faithful remake |
| Multiple difficulty settings | Classic mode is the goal; difficulty is implicit in wave progression |
| Leaderboard / server persistence | Personal project, no backend needed |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Pending |
| FOUND-02 | Phase 1 | Pending |
| FOUND-03 | Phase 1 | Pending |
| PLAY-01 | Phase 2 | Pending |
| PLAY-02 | Phase 2 | Pending |
| PLAY-03 | Phase 2 | Pending |
| PLAY-04 | Phase 2 | Pending |
| ALIN-01 | Phase 3 | Pending |
| ALIN-02 | Phase 3 | Pending |
| ALIN-03 | Phase 3 | Pending |
| ALIN-04 | Phase 4 | Pending |
| ALIN-05 | Phase 4 | Pending |
| CMBT-01 | Phase 4 | Pending |
| CMBT-02 | Phase 4 | Pending |
| CMBT-03 | Phase 4 | Pending |
| CMBT-04 | Phase 4 | Pending |
| SHLD-01 | Phase 5 | Pending |
| SHLD-02 | Phase 5 | Pending |
| SHLD-03 | Phase 5 | Pending |
| UFO-01 | Phase 6 | Pending |
| UFO-02 | Phase 6 | Pending |
| FLOW-01 | Phase 6 | Pending |
| FLOW-02 | Phase 6 | Pending |
| FLOW-03 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 after initial definition*
