# Space Invaders

## What This Is

A faithful browser-based remake of the classic Space Invaders arcade game, built with HTML5 Canvas. The player controls a cannon at the bottom of the screen, shooting waves of descending aliens while dodging their fire. Built as a personal learning project.

## Core Value

A fully playable, faithful recreation of the original Space Invaders experience — if the core shooting and alien wave mechanics don't feel right, nothing else matters.

## Requirements

### Validated

Validated in Phase 1: Foundation
- [x] Game loop (rAF + fixed-timestep), canvas setup, keyboard input

Validated in Phase 2: Playable Core
- [x] Player cannon moves left/right and shoots (one bullet, rising-edge spacebar)
- [x] Grid of aliens (55, 5×11) moves and descends, increasing speed as they're eliminated
- [x] Aliens fire back at the player (bottom-row per column, max 3 bullets)
- [x] Lives system (3 lives, game over on depletion)
- [x] Score tracking displayed on screen (zero-padded HUD)
- [x] Game ends if alien reaches ground line

Validated in Phase 3: Destructible Shields
- [x] Four destructible shields protect the player (offscreen canvas, pixel-level erosion)
- [x] Player and alien bullets erode circular craters into shields
- [x] Alien overflight strips shield pixels on each march step

### Active

- [ ] Mystery UFO flies across the top for bonus points
- [ ] Game over and restart flow
- [ ] Wave progression (new wave when all aliens destroyed)

### Out of Scope

- Mobile touch controls — keyboard-first for now
- High score persistence — personal project, not needed
- Sound effects — optional nice-to-have, not core
- Multiple levels / difficulty progression — faithful single-loop experience

## Context

- Greenfield browser game; existing repo is just a hello-world placeholder
- Codebase map exists at `.planning/codebase/` — minimal existing code
- No frameworks or build tools currently; plain HTML/JS/Canvas is the natural fit
- Classic Space Invaders (1978) is the reference: 55 aliens in 5 rows, 4 shields, 1 UFO row

## Constraints

- **Tech stack**: Vanilla HTML5/CSS/JavaScript — no framework overhead for a simple game
- **Platform**: Browser — must run without a build step (open index.html directly)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| HTML5 Canvas over DOM/SVG | Game loop performance, pixel-level control | — Pending |
| Vanilla JS over framework | No build tooling needed, learning-focused | — Pending |

## Current State

Phase 3 complete — four destructible shields added. Pixel-level offscreen canvas erosion via
destination-out craters. Alien overflight strips shield pixels each march step. 8 JS modules:
constants, input, player, aliens, bullets, shields, hud, game.

---
*Last updated: 2026-03-20 after Phase 3: Destructible Shields*
