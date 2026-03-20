---
phase: 4
slug: complete-game
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — browser-only vanilla JS project, no build tooling |
| **Config file** | none |
| **Quick run command** | `grep -n "..." js/ufo.js js/game.js` (structural checks per task) |
| **Full suite command** | Open `index.html` in browser, run visual checklist |
| **Estimated runtime** | ~2 minutes (visual checklist) |

---

## Sampling Rate

- **After every task commit:** Run the grep-based `<acceptance_criteria>` checks from the plan task
- **After every plan wave:** Open `index.html`, run visual checklist from plan Verification section
- **Before `/gsd:verify-work`:** All grep checks pass AND full visual checklist passes
- **Max feedback latency:** ~30 seconds (grep checks) / ~2 minutes (full visual)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | UFO-01 | grep | `grep "UFO_SPEED" js/constants.js` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | UFO-01 | grep | `test -f js/ufo.js && echo OK` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | UFO-02 | grep | `grep "checkPlayerBulletVsUFO" js/bullets.js` | ❌ W0 | ⬜ pending |
| 04-01-04 | 01 | 1 | UFO-01/02 | visual | UFO appears at top, player bullet destroys it | manual | ⬜ pending |
| 04-02-01 | 02 | 2 | FLOW-01 | grep | `grep "startNextWave" js/game.js` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 2 | FLOW-01 | grep | `grep "waveNumber" js/game.js` | ❌ W0 | ⬜ pending |
| 04-02-03 | 02 | 2 | FLOW-02 | grep | `grep "updateGameOver" js/game.js` | ❌ W0 | ⬜ pending |
| 04-02-04 | 02 | 2 | FLOW-03 | grep | `grep "initUFO" js/game.js` | ❌ W0 | ⬜ pending |
| 04-02-05 | 02 | 2 | FLOW-01/02/03 | visual | Full game loop: wave clear → wave 2, game over → restart | manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

This is a browser-only vanilla JS project with no test framework. There are no Wave 0 setup tasks.

All verification is either:
1. **Grep-based structural checks** — run against source files directly (fast, ~5s)
2. **Visual browser checks** — open `index.html`, interact with the game

*Existing infrastructure covers all phase requirements — no new test files needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| UFO appears periodically and moves across screen | UFO-01 | Visual animation, no test harness | Wait 15-25s after start; UFO should fly across top of screen |
| Shooting UFO awards bonus points | UFO-02 | Score delta requires player interaction | Shoot UFO; confirm score increases by 50/100/150/300 |
| WAVE CLEAR screen transitions to Wave 2 | FLOW-01 | State machine transition, visual | Destroy all aliens; confirm "WAVE CLEAR!" then Wave 2 start |
| Wave 2 aliens march faster than Wave 1 | FLOW-01 | Subjective speed comparison | Compare march speed in Wave 2 vs Wave 1 |
| GAME OVER screen shows final score + restart prompt | FLOW-02 | Visual rendering | Lose all lives; confirm "GAME OVER", score, and "Press ENTER or R" |
| Restart returns to clean state | FLOW-03 | Full state reset verification | Restart; confirm score=0, lives=3, Wave 1, no visual artifacts |
| No timer leaks after multiple restart cycles | FLOW-03 | Requires multiple play cycles | Play 3+ full games (restart each time); confirm no accumulated speed or state |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s (grep) / 2min (visual)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
