---
phase: 3
slug: destructible-shields
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — vanilla JS browser project, no test runner |
| **Config file** | none |
| **Quick run command** | Open `index.html` in browser, check console for errors |
| **Full suite command** | Open `index.html` in browser, run visual checklist below |
| **Estimated runtime** | ~2 minutes (human visual verification) |

This project has no automated test framework — it opens directly as `file://` with no build step. All verification is grep-based (structural) plus browser visual verification (behavioral).

---

## Sampling Rate

- **After every task commit:** `grep` acceptance criteria in modified files (structural check)
- **After every plan wave:** Open `index.html`, run full visual checklist
- **Before `/gsd:verify-work`:** Full visual checklist must pass + all grep checks green
- **Max feedback latency:** ~2 minutes (open browser + run checklist)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 3-01-01 | 01 | 1 | SHLD-01 | grep | `grep -n "SHIELD_POSITIONS" js/constants.js` | ⬜ pending |
| 3-01-02 | 01 | 1 | SHLD-01 | grep | `grep -n "initShields" js/shields.js` | ⬜ pending |
| 3-01-03 | 01 | 1 | SHLD-02 | grep | `grep -n "getImageData" js/shields.js` | ⬜ pending |
| 3-01-04 | 01 | 1 | SHLD-02 | grep | `grep -n "destination-out" js/shields.js` | ⬜ pending |
| 3-01-05 | 01 | 1 | SHLD-02 | grep | `grep -n "checkPlayerBulletVsShields\|checkAlienBulletsVsShields" js/bullets.js` | ⬜ pending |
| 3-01-06 | 01 | 1 | SHLD-03 | grep | `grep -n "checkAlienOverflightVsShields" js/aliens.js` | ⬜ pending |
| 3-01-07 | 01 | 1 | SHLD-01,02,03 | visual | Open browser, run visual checklist | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — no test framework to install. All verification uses grep on source files and browser visual inspection.

*Existing infrastructure (browser + grep) covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 4 shields visible at correct positions | SHLD-01 | Browser canvas rendering | Open index.html → see 4 green bunker shapes above player, below alien formation |
| Player bullet erodes shield from below | SHLD-02 | Pixel-level visual | Fire upward into shield → crater visible in bottom of shield |
| Alien bullet erodes shield from above | SHLD-02 | Pixel-level visual | Let alien bullet hit shield → crater visible in top of shield |
| Progressive shield destruction | SHLD-02 | Multi-hit visual | Hit same shield area repeatedly → pixels disappear progressively |
| Shield fully destroys when all pixels gone | SHLD-02 | Complete erosion visual | Destroy all pixels in one area → bullets pass through |
| Aliens marching over shield erode pixels | SHLD-03 | Timed interaction | Wait for alien formation to march down to shield y≈600 → top pixels erode as aliens pass |

---

## Visual Verification Checklist (Full Suite)

Run after completing the plan:

1. [ ] Open `index.html` in browser — no console errors
2. [ ] 4 green bunker-shaped shields visible above player, below alien formation
3. [ ] Fire player bullet upward into shield bottom → visible impact crater
4. [ ] Multiple player bullet hits → progressive erosion visible, craters accumulate
5. [ ] Allow alien bullet to reach shield → visible crater on top surface
6. [ ] Wait for alien formation to march toward shield y position → shield top erodes as aliens pass over
7. [ ] Bullet hitting fully-eroded area passes through without creating new crater
8. [ ] Shield with all pixels eroded is invisible — no rendering artifact
9. [ ] Shields re-initialize on game restart (if `initGame()` resets them)
10. [ ] No performance degradation — game still runs at 60 FPS with shields active

---

## Grep Acceptance Criteria (Structural)

Run these after plan completion to verify implementation is present:

```bash
# Shield constants
grep -n "SHIELD_POSITIONS" js/constants.js
grep -n "SHIELD_Y" js/constants.js
grep -n "SHIELD_W" js/constants.js
grep -n "SHIELD_CRATER_RADIUS" js/constants.js

# Shield file structure
test -f js/shields.js && echo "shields.js exists"
grep -n "initShields" js/shields.js
grep -n "renderShields" js/shields.js
grep -n "getImageData" js/shields.js
grep -n "destination-out" js/shields.js
grep -n "drawImage" js/shields.js
grep -n "createShield\|createElement" js/shields.js

# Integration
grep -n "checkPlayerBulletVsShields" js/bullets.js
grep -n "checkAlienBulletsVsShields" js/bullets.js
grep -n "checkAlienOverflightVsShields" js/aliens.js
grep -n "initShields" js/game.js
grep -n "renderShields" js/game.js
grep -n "shields.js" index.html
```

---

## Validation Sign-Off

- [ ] All tasks have grep verify or visual verification steps documented
- [ ] Sampling continuity: visual check after plan completion covers all requirements
- [ ] No Wave 0 required (no test framework)
- [ ] No watch-mode flags
- [ ] Feedback latency < 2 minutes (browser open + visual scan)
- [ ] `nyquist_compliant: true` set in frontmatter when sign-off complete

**Approval:** pending
