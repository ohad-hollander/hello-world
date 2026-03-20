---
phase: 2
slug: playable-core
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual browser verification (no automated test framework — vanilla JS, no build step) |
| **Config file** | none |
| **Quick run command** | Open `index.html` in browser, check console + visual |
| **Full suite command** | Open `index.html` in browser, run all 10 manual checklist items |
| **Estimated runtime** | ~3 minutes (manual) |

---

## Sampling Rate

- **After every task commit:** Open `index.html`, verify the specific behavior added by that task (see per-task map below)
- **After every plan wave:** Run full 10-item manual checklist
- **Before `/gsd:verify-work`:** Full checklist must pass
- **Max feedback latency:** ~3 minutes (manual open + verify)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Manual Check |
|---------|------|------|-------------|-----------|-------------------|--------------|
| File structure + constants | 01 | 1 | FOUND-01 | grep | `grep -r "LOGICAL_WIDTH" js/constants.js` | ✅ |
| Player movement | 01 | 1 | PLAY-01 | grep + manual | `grep "player.speed" js/player.js` | Arrow keys move cannon, stops at edges |
| Player bullet | 01 | 1 | PLAY-02 | grep + manual | `grep "playerBullet" js/player.js` | Space fires bullet, hold Space = still one bullet |
| Alien formation render | 02 | 1 | ALIN-01 | grep + manual | `grep "aliens.push" js/aliens.js` | 55 aliens visible in 5×11 grid |
| Alien march | 02 | 1 | ALIN-02 | grep + manual | `grep "march.stepInterval" js/aliens.js` | Formation steps left/right, steps down at walls |
| Alien march acceleration | 02 | 1 | ALIN-03 | grep + manual | `grep "aliveCount" js/aliens.js` | Kill aliens, march visibly speeds up |
| Alien firing | 02 | 2 | ALIN-04 | grep + manual | `grep "getColumnShooters\|columnShooter" js/aliens.js` | Bottom-row aliens fire downward bullets |
| Player bullet vs alien | 03 | 2 | CMBT-01 | grep + manual | `grep "alien.alive = false" js/bullets.js` | Bullet destroys alien on contact |
| Alien bullet vs player | 03 | 2 | CMBT-02 | grep + manual | `grep "lives--" js/bullets.js` | Player hit = life lost, respawn |
| Score increment | 03 | 2 | CMBT-03 | grep + manual | `grep "ROW_POINTS\|rowPoints" js/aliens.js` | Score increases by correct row value |
| HUD display | 04 | 2 | CMBT-04 | grep + manual | `grep "SCORE\|LIVES" js/hud.js` | Score and lives visible at top of screen |
| Lives system | 03 | 2 | PLAY-03, PLAY-04 | grep + manual | `grep "lives" js/game.js` | 3 lives, game over on depletion |
| Alien bottom trigger | 03 | 2 | ALIN-05 | grep + manual | `grep "GROUND_LINE\|game_over" js/game.js` | Alien reaching bottom = immediate game over |

---

## Wave 0 Requirements

This phase has no automated test framework. All verification is browser-manual.

Wave 0 is not applicable — no test infrastructure to install. However, the first plan (file structure) must establish all constants and the JS module loading order before any other plan executes.

*Wave 0 equivalent: Plan 01 must complete before Plans 02, 03, 04 (establishes file structure and constants).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Player cannon moves within screen bounds | PLAY-01 | Visual/interactive — no DOM query for position | Open browser, hold ArrowLeft → cannon stops at left edge; hold ArrowRight → stops at right edge |
| One bullet at a time | PLAY-02 | Interactive timing behavior | Fire bullet, immediately press Space again → no second bullet appears until first despawns |
| Spacebar rising-edge only | PLAY-02 | Hold-vs-press distinction | Hold Space continuously → exactly one bullet fires, not continuous stream |
| Alien step-down at wall | ALIN-02 | Visual animation | Watch full march cycle → formation steps down each time it reverses at a wall |
| March speed increase | ALIN-03 | Visual/temporal | Kill 30+ aliens → step interval noticeably faster |
| Player invincibility flash | PLAY-03 | Visual feedback | Get hit → player flickers for ~2 seconds |
| Game over on alien invasion | ALIN-05 | State transition | Let leftmost column march to bottom → GAME OVER text appears immediately |
| Correct score values | CMBT-03 | Arithmetic verification | Kill top-row alien → score +30; kill bottom-row → score +10 |

---

## Validation Sign-Off

- [ ] All plans have task-level grep-verifiable acceptance criteria
- [ ] Human checkpoint at end of each plan wave
- [ ] Wave 0 equivalent: constants/file structure plan completes before entity plans
- [ ] No automated watch-mode (not applicable — no test framework)
- [ ] Feedback latency: ~3 min per manual check (acceptable for browser game)
- [ ] `nyquist_compliant: true` set in frontmatter when checklist passes

**Approval:** pending
