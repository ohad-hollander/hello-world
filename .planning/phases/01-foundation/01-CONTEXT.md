# Phase 1: Foundation - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

A running game loop that renders to canvas and reads keyboard input — the stable base everything else builds on. No game entities, no gameplay. Just the engine: loop, canvas, input.

</domain>

<decisions>
## Implementation Decisions

### File Structure
- Start with a single `index.html` file with all JS inline — no build step, opens directly in browser
- Split into separate `.js` files when the code gets unwieldy (likely around Phase 2–3 when entities are added)
- No module system or bundler — plain `<script>` tags if/when splitting

### Claude's Discretion
- Canvas presentation: black page background, game canvas centered — classic arcade CRT feel
- Debug scaffolding: blank black canvas with a colored placeholder rect + FPS counter logged to console, proving loop runs at 60fps
- Exact CSS for centering (flexbox, margin auto, etc.)
- Fixed-timestep accumulator implementation details
- Whether to expose a global `game` object or use an IIFE/closure

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Foundation requirements
- `.planning/REQUIREMENTS.md` §Foundation — FOUND-01, FOUND-02, FOUND-03 define the loop pattern, canvas dimensions, and input approach

### Project constraints
- `.planning/PROJECT.md` §Constraints — Vanilla HTML5/CSS/JS, no framework, no build step, must open index.html directly

No external specs — requirements are fully captured in decisions above and REQUIREMENTS.md.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project. Only `hello.py` exists (placeholder, irrelevant to the game).

### Established Patterns
- None yet — Phase 1 establishes all patterns.

### Integration Points
- `index.html` will be the single entry point. All future phases add code to this file (or extract into linked `.js` files when warranted).

</code_context>

<specifics>
## Specific Ideas

- Classic Space Invaders (1978) is the reference: 224×256 canvas, scaled 3× = 672×768
- Game loop uses `requestAnimationFrame` + delta-time fixed-timestep accumulator (not a simple rAF-only loop)
- Keyboard input uses a state-map (object of flags set in `keydown`/`keyup` handlers, read per-frame in the loop) — not event-driven polling

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-18*
