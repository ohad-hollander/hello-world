# Feature Research

**Domain:** Browser-based Space Invaders arcade remake
**Researched:** 2026-03-18
**Confidence:** HIGH — original arcade specifications are well-documented and stable

## Feature Landscape

### Table Stakes (Users Expect These)

Missing any of these and it is not recognizably Space Invaders.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| 11x5 alien grid (55 aliens) | Canonical formation from 1978 original | MEDIUM | 3 alien types: Squid (top row, 30pts), Crab (middle 2 rows, 20pts), Octopus (bottom 2 rows, 10pts) |
| Horizontal alien march with edge-bounce descent | Defines the game's rhythm and threat | MEDIUM | Entire formation moves as one unit; shifts down one row on edge contact, reverses direction |
| Aliens accelerate as their count drops | Core difficulty escalation mechanic | LOW | Original was a hardware accident (fewer sprites = faster loop); must be deliberately implemented in software |
| Player cannon horizontal movement | Foundational control | LOW | Left/right only; no vertical movement |
| Single player shot on screen at a time | Core constraint defining shot timing skill | LOW | Player must wait for shot to reach top or hit target before firing again |
| Alien return fire | Aliens shoot back at player | MEDIUM | Three shot types in original (rolling, plunger, squiggly); at minimum aliens fire downward projectiles |
| 4 destructible shields/bunkers | Iconic defensive mechanic | HIGH | Shields eroded by both player and alien shots; aliens also destroy them from above as they pass over |
| Mystery UFO (Saucer) flying across top | Bonus target, iconic element | LOW | Appears every ~25.6 seconds; scores 50–300 pts based on shot count; stops spawning below 8 aliens |
| Lives system (3 lives) | Standard for the genre, defines game over | LOW | Extra life awarded at 1500 points |
| Score display | Players must see their score | LOW | Displayed live during gameplay |
| Game over condition | Aliens reach the bottom OR player loses all lives | LOW | If any alien reaches the cannon's row, game ends immediately regardless of lives remaining |
| Game over and restart flow | Players must be able to play again | LOW | Show final score, offer restart |
| Wave progression | Defeating all aliens starts a new wave | LOW | Each successive wave starts the formation lower on screen, making game harder over time |
| Escalating march tempo (sound or visual indicator) | Psychological pressure mechanic | LOW | Original used 4-beat bass tempo that sped up with fewer aliens; can be audio or visual pulse |

### Differentiators (Competitive Advantage)

These go beyond a faithful remake. Reasonable to include some; not required for authenticity.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Authentic sound effects (4-beat march + shoot + explosion + UFO) | Completes the sensory experience; strong nostalgia trigger | LOW | Web Audio API oscillators can reproduce the 4 descending notes without assets; shoot/explosion use short noise bursts |
| Pixel-art sprite rendering (original alien designs) | Visual authenticity; fans expect the specific alien shapes | LOW | Can be drawn on canvas using pixel grids; squid/crab/octopus each have 2-frame walk cycles |
| 2-frame alien walk animation | Aliens "walk" — subtle but iconic | LOW | Each alien type has 2 sprite frames that alternate with each march step |
| UFO score display on hit | Shows points earned above UFO on kill | LOW | Strong visual feedback, matches original behavior |
| High score tracking (localStorage) | Personal best adds replay motivation | LOW | No backend needed; simple localStorage read/write |
| Pause functionality | Quality of life for browser play | LOW | Toggle pause state; freeze all movement and timers |
| Exact scoring system (UFO shot-count formula) | Hard-core authenticity; rewards mastery | MEDIUM | UFO score cycles through predetermined values based on shot count — rewarding players who count shots |
| Particle/explosion effects on alien death | Modern visual polish | LOW | Small canvas particle burst on hit; not in original but widely expected in browser games |
| Difficulty progression across waves | Replayability beyond wave 1 | MEDIUM | Starting position of formation lowers each wave; could also increase alien fire rate per wave |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Touch / mobile controls | Mobile users exist | Out of scope per PROJECT.md; adds significant UI complexity for keyboard-first game; on-screen buttons feel bad for this game type | Keyboard is the right primary input; mobile can be revisited after core is working |
| Online leaderboard / backend | Competitive play, sharing scores | Requires a server, auth, persistence infrastructure — massively out of scope for a learning project | localStorage high score gives personal-best without any backend |
| Multiple levels with unique mechanics | Adds depth | Breaks faithful remake contract; Space Invaders is one repeating loop — adding unique levels turns it into a different game | Wave progression (each wave starts lower/faster) is the faithful version of difficulty escalation |
| Power-ups | Feels exciting | Not in original; belongs to Space Invaders Extreme, not the 1978 game; undermines the faithful remake goal | Stick to exact original mechanics; the skill ceiling of the original is already interesting |
| Two-player simultaneous mode | Classic arcade feature | Original was alternating turns, not simultaneous; simultaneous requires layout changes and complicates state | If adding multiplayer, implement alternating turns to match original |
| Auto-fire / held fire | Players want to hold shoot button | Fundamentally breaks the single-shot mechanic that defines the game's pacing and strategy | Enforce one-shot-at-a-time; it is a design feature not a limitation |
| Procedurally generated levels | Adds variety | Defeats the point of a faithful remake; also adds complexity without learning value for this project | Stick to fixed 5-row, 11-column formation |

## Feature Dependencies

```
Player cannon movement
    └──requires──> Game loop + canvas render

Player shooting
    └──requires──> Player cannon movement
    └──requires──> Single-shot constraint enforcement

Alien formation march
    └──requires──> Game loop + canvas render
    └──requires──> Edge detection + row descent logic

Alien acceleration
    └──requires──> Alien formation march
    └──requires──> Alien count tracking

Alien return fire
    └──requires──> Alien formation march
    └──requires──> Projectile system (shared with player shooting)

Destructible shields
    └──requires──> Projectile system
    └──requires──> Pixel-level or segment-level collision detection

Mystery UFO
    └──requires──> Game loop timer
    └──requires──> Projectile system (player can shoot it)

UFO score formula
    └──requires──> Mystery UFO
    └──requires──> Player shot counter

Wave progression
    └──requires──> Alien formation (full clear detection)
    └──requires──> Formation reset with lower starting Y position

Extra life at 1500pts
    └──requires──> Score tracking
    └──requires──> Lives system

Escalating march tempo (audio)
    └──requires──> Alien count tracking
    └──enhances──> Alien acceleration (same trigger, different output)

2-frame alien animation
    └──enhances──> Alien formation march (frame advances on each step)

High score (localStorage)
    └──requires──> Score tracking
    └──requires──> Game over flow
```

### Dependency Notes

- **Projectile system is shared:** Player bullets and alien bullets share the same underlying projectile logic (position, movement, collision). Build this once, use for both.
- **Alien count is a key shared state:** It drives acceleration, UFO spawn cutoff, and wave-clear detection. Track it centrally.
- **Shield destruction requires careful collision design:** Shields erode by area, not as single objects. This is the highest-complexity table stakes feature — pixel-level or tile-segment erosion. Plan this phase carefully.
- **Escalating march tempo requires alien count:** Build alien count tracking before adding audio; the tempo is a direct function of remaining aliens.

## MVP Definition

### Launch With (v1)

Minimum to be recognizably Space Invaders and satisfy the project goal.

- [ ] 11x5 alien grid with 3 types and correct point values — the core identity
- [ ] Alien march with edge-bounce, row descent, and acceleration — the core mechanic
- [ ] Player cannon movement and single-shot constraint — foundational control
- [ ] Alien return fire (simplified to random column targeting is fine) — necessary challenge
- [ ] 4 destructible shields — iconic defense mechanic
- [ ] Mystery UFO flying across top with scoring — iconic bonus feature
- [ ] Lives system (3 lives, extra life at 1500pts) — game structure
- [ ] Score display — player feedback
- [ ] Game over condition (aliens reach bottom or lives depleted) and restart flow — playable loop
- [ ] Wave progression (new wave starts lower) — game doesn't dead-end

### Add After Validation (v1.x)

Add once core loop is confirmed working and feeling right.

- [ ] Sound effects (march tempo, shoot, explosion, UFO) — strongest quality-of-life improvement; tempo tempo escalation is a major part of the experience
- [ ] 2-frame alien walk animation — low effort, high authenticity payoff
- [ ] Pixel-art alien sprites — can start with placeholder shapes; swap to proper sprites once layout is correct
- [ ] High score via localStorage — personal best tracking, trivial to add post-game-over
- [ ] Pause functionality — convenience for browser play

### Future Consideration (v2+)

Defer; not needed for a faithful remake as a learning project.

- [ ] Exact UFO shot-count scoring formula — fun easter egg for completionists; adds implementation complexity
- [ ] Particle/explosion effects — visual polish; add if scope allows
- [ ] Alternating two-player mode — only if the project expands beyond personal learning

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Alien formation + march + acceleration | HIGH | MEDIUM | P1 |
| Player cannon + single-shot mechanic | HIGH | LOW | P1 |
| Alien return fire | HIGH | LOW | P1 |
| Destructible shields | HIGH | HIGH | P1 |
| Mystery UFO | HIGH | LOW | P1 |
| Lives + score + game over/restart | HIGH | LOW | P1 |
| Wave progression | HIGH | LOW | P1 |
| Sound effects (march tempo) | HIGH | LOW | P2 |
| Alien walk animation (2 frames) | MEDIUM | LOW | P2 |
| Pixel-art alien sprites | MEDIUM | LOW | P2 |
| High score (localStorage) | MEDIUM | LOW | P2 |
| Pause | LOW | LOW | P2 |
| UFO shot-count scoring formula | LOW | MEDIUM | P3 |
| Particle explosion effects | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch — not Space Invaders without it
- P2: Should have — adds authenticity and polish, low cost
- P3: Nice to have — fun for completionists, defer until core is solid

## Competitor / Reference Analysis

| Feature | Original 1978 Arcade | Common Browser Remakes | This Project |
|---------|---------------------|----------------------|--------------|
| Alien formation | 11x5, 3 types, fixed | Usually 11x5; some simplify to 1 type | 11x5, 3 types per PROJECT.md |
| Alien acceleration | Yes (hardware artifact) | Usually implemented | Yes — required |
| Shields | 4, pixel erosion | Often simplified to HP bars | 4 shields with destruction |
| UFO score | Predetermined 15-value cycle | Usually random or fixed | 300pts for 23rd shot min; cycle optional |
| Sound | 4-beat march + SFX | Often omitted in minimal clones | Out of scope initially per PROJECT.md |
| Lives | 3 + bonus at 1500 | Usually 3, bonus often omitted | 3 lives, bonus at 1500 |
| Wave loop | Infinite, starts lower each wave | Often only 1 wave in tutorials | Yes — infinite loop |
| High score | DIP-switch configurable, no persist | localStorage common | Out of scope per PROJECT.md (personal project) |

## Sources

- [Space Invaders Play Guide — classicgaming.cc](https://classicgaming.cc/classics/space-invaders/play-guide) — original arcade mechanics reference
- [Space Invaders — Shmups Wiki](https://shmups.wiki/library/Space_Invaders) — detailed mechanics including UFO timing, shot types
- [Space Invaders — Wikipedia](https://en.wikipedia.org/wiki/Space_Invaders) — historical and mechanical overview
- [Space Invaders UFO Wiki — Fandom](https://spaceinvaders.fandom.com/wiki/UFO) — UFO scoring details
- [DEV Community: Coding Space Invaders in JavaScript](https://dev.to/codingwithadam/coding-space-invaders-in-javascript-complete-tutorial-every-step-explained-with-html5-canvas-45ja) — HTML5 Canvas implementation reference
- [Space Invaders — Armageddon Online](https://www.armageddononline.org/space-invaders-the-arcade-game/) — alien bullet column patterns
- [344 Audio: Sound Design Moments](https://www.344audio.com/post/article-5-epic-sound-design-moments-in-video-games) — march tempo psychology

---
*Feature research for: Browser-based Space Invaders remake*
*Researched: 2026-03-18*
