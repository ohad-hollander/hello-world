# Roadmap: Space Invaders

## Overview

Four phases deliver the complete Space Invaders experience. Phase 1 builds the infrastructure that everything depends on — the game loop must be right before any entity moves. Phase 2 delivers the fully playable core: player, alien formation, and combat wired together in one coherent loop. Phase 3 isolates the hardest feature (destructible shields) in its own phase because its pixel-level collision is architecturally different from everything else. Phase 4 rounds out the complete game with the UFO, wave progression, and the full game-over/restart flow.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Game loop, canvas setup, and input handling
- [ ] **Phase 2: Playable Core** - Player, alien formation, and combat in a complete loop
- [ ] **Phase 3: Destructible Shields** - Pixel-level shield erosion and collision
- [ ] **Phase 4: Complete Game** - UFO, wave progression, and game-over/restart flow

## Phase Details

### Phase 1: Foundation
**Goal**: A running game loop that renders to canvas and reads keyboard input — the stable base everything else builds on
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03
**Success Criteria** (what must be TRUE):
  1. Opening index.html in a browser shows a correctly sized canvas with no console errors
  2. The game loop runs at 60 FPS with a fixed-timestep accumulator — frame timing is stable across tab switches
  3. Arrow keys and spacebar register as input state flags readable each frame (verified by logging key state to console)
**Plans**: 1 plan

Plans:
- [ ] 01-01-PLAN.md — HTML5 canvas + fixed-timestep rAF loop + keyboard state-map input

### Phase 2: Playable Core
**Goal**: Users can play a complete round — move and shoot, watch aliens march and return fire, lose lives, and see the score
**Depends on**: Phase 1
**Requirements**: PLAY-01, PLAY-02, PLAY-03, PLAY-04, ALIN-01, ALIN-02, ALIN-03, ALIN-04, ALIN-05, CMBT-01, CMBT-02, CMBT-03, CMBT-04
**Success Criteria** (what must be TRUE):
  1. Player cannon moves left and right within screen bounds and fires one bullet at a time with spacebar
  2. 55 aliens in a 5x11 grid march left/right as a unit, step down at each wall, and visibly accelerate as aliens are destroyed
  3. Bottom-row aliens fire downward bullets; player loses a life on hit and respawns; game ends when all 3 lives are lost
  4. Player bullets destroy aliens on contact; score increases with correct per-row point values; HUD shows live score and lives
  5. Game ends immediately if any alien reaches the bottom of the screen
**Plans**: TBD

### Phase 3: Destructible Shields
**Goal**: Four shields protect the player and erode pixel-by-pixel from both player and alien fire — and are consumed when aliens march over them
**Depends on**: Phase 2
**Requirements**: SHLD-01, SHLD-02, SHLD-03
**Success Criteria** (what must be TRUE):
  1. Four shields appear above the player cannon in their correct positions
  2. Player bullets erode shield pixels from below; alien bullets erode shield pixels from above — impact craters are visible
  3. Shields are progressively destroyed and disappear entirely when all pixels are gone
  4. Aliens marching over a shield's position remove shield pixels from above as they pass
**Plans**: TBD

### Phase 4: Complete Game
**Goal**: The full Space Invaders loop — UFO flies across for bonus points, clearing a wave starts the next, and game-over/restart works cleanly
**Depends on**: Phase 3
**Requirements**: UFO-01, UFO-02, FLOW-01, FLOW-02, FLOW-03
**Success Criteria** (what must be TRUE):
  1. A mystery UFO periodically crosses the top of the screen and awards bonus points when shot
  2. Destroying all aliens triggers a new wave — aliens reset to formation and speed increases slightly
  3. A game-over screen appears when all lives are lost, showing final score and a restart option
  4. Restarting the game returns to a clean initial state with no timer leaks or leftover entities
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/1 | Not started | - |
| 2. Playable Core | 0/TBD | Not started | - |
| 3. Destructible Shields | 0/TBD | Not started | - |
| 4. Complete Game | 0/TBD | Not started | - |
