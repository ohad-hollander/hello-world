# Stack Research

**Domain:** Browser-based HTML5 Canvas arcade game (Space Invaders remake)
**Researched:** 2026-03-18
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Vanilla JavaScript (ESModules) | ES2022+ | Game logic and rendering | No build step required; `<script type="module">` works in all modern browsers. For a single-screen arcade game, a framework adds zero value and significant complexity. |
| HTML5 Canvas 2D API | Browser-native | All rendering | Direct pixel-level control. `requestAnimationFrame` + `CanvasRenderingContext2D` is the lowest-friction path to a working game loop. No library overhead. |
| Web Audio API | Browser-native | Sound effects (optional) | If sound is added later, the Web Audio API handles short sound effects cleanly without a library. Not needed for core MVP. |

### Supporting Libraries

**Recommendation: None.** The project constraint (open `index.html` directly, no build step) and scope (single-screen arcade game, ~500 lines of logic) do not justify any external dependency. Every feature needed — game loop, sprite drawing, input, collision detection — is covered by native browser APIs.

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Phaser 3 | 3.88+ | Full game framework (physics, scenes, loader, input) | Only if the project grows to multiple levels, scenes, or complex physics. Overkill for a faithful Space Invaders remake. Requires a bundler for convenient use. |
| PixiJS | 8.x | WebGL-accelerated 2D renderer | Only if Canvas 2D performance is a bottleneck (it will not be for 55 sprites). Adds significant bundle size. |
| Kontra.js | 10.x | Micro game library (~13KB, no build step) | If you want a thin game-object abstraction without a bundler. Acceptable fallback if managing entity state in vanilla JS feels unwieldy, but not needed here. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `python3 -m http.server` or `npx serve` | Local dev server | ES Modules require an HTTP server (CORS restriction on `file://`). No installation needed with Python. `npx serve` is a one-liner alternative. |
| Browser DevTools | Debugging, performance profiling | Chrome/Firefox Performance tab shows frame times. Use the Canvas inspector in Chrome DevTools to audit draw calls. |
| Aseprite (or any pixel art tool) | Sprite creation | Optional. The classic Space Invaders bitmap sprites are simple enough to draw programmatically using canvas `fillRect` calls, avoiding asset loading entirely for the MVP. |

## Installation

No npm dependencies are needed for the core game.

```bash
# Serve locally with Python (no install required)
python3 -m http.server 8080

# Or, one-time npx serve (downloads automatically)
npx serve .
```

If Kontra.js is added later as a micro-library:

```bash
# Copy the single-file build directly — no bundler needed
curl -o kontra.js https://unpkg.com/kontra@10/kontra.js
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Vanilla JS + Canvas 2D | Phaser 3 | Game expands to 5+ scenes, requires tile maps, complex physics, or a professional shipping target. Phaser's scene manager and asset loader justify the overhead at that scale. |
| Vanilla JS + Canvas 2D | Kaboom.js / Kaplay | Prototyping speed is the priority and you accept an opinionated API. Kaboom has slow rendering performance in benchmarks but excellent DX. Not worth it for a learning project. |
| Canvas 2D | WebGL / PixiJS | Rendering hundreds of animated sprites simultaneously. Space Invaders peaks at ~60 objects on screen — Canvas 2D handles this trivially. |
| Canvas 2D | DOM / CSS animations | Purely content-driven animated sites. DOM cannot efficiently clear and redraw a game scene at 60 FPS. |
| Native ESModules | Bundler (Vite/webpack) | Project grows beyond 5–6 files, or TypeScript is introduced. At that point, Vite's dev server with HMR is worth the setup cost. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `setInterval` / `setTimeout` for the game loop | Does not sync to display refresh rate; causes tearing and timing drift. Frame rate is not guaranteed. | `requestAnimationFrame` with delta-time tracking |
| `Date.now()` for frame timing | Resolution is capped at 1ms; subject to system clock adjustments. | `performance.now()` (sub-millisecond, monotonic) |
| Floating-point sprite coordinates | Sub-pixel rendering causes blurry sprites — especially visible in a retro pixel art game. | Round all draw positions with `Math.round()` or `Math.floor()` before passing to `drawImage` / `fillRect` |
| DOM elements for game objects (divs, imgs) | DOM layout thrashing kills frame rate. Forced reflows make 60 FPS impossible at game object counts. | Canvas draw calls only |
| External sprite sheet image files for the MVP | Adds an asset loading step and HTTP request. Classic Space Invaders sprites are 1-bit pixel art trivially reproducible with `fillRect`. | Programmatic sprite drawing using arrays of 0/1 pixel data |
| Phaser 3 without a bundler | Phaser's recommended usage is via npm + bundler; CDN builds work but add 1MB+ to the page. No benefit for a 55-sprite game. | Vanilla Canvas 2D |

## Stack Patterns by Variant

**If adding sound effects later:**
- Use `Web Audio API` directly (`AudioContext`, `OscillatorNode` for synthesized beeps, or `AudioBufferSourceNode` for samples)
- The original Space Invaders used synthesized tones — recreatable with `OscillatorNode` with no asset files at all

**If the project grows beyond a single file:**
- Split into ESModules: `game.js` (main loop), `entities.js` (Player, Alien, Bullet, Shield classes), `input.js` (keyboard state), `renderer.js` (all canvas draw calls), `constants.js`
- Import via `<script type="module" src="game.js">` — no bundler required until TypeScript or tree-shaking is needed

**If TypeScript is introduced later:**
- Use Vite (`npm create vite@latest`) for zero-config TS + hot reload
- Do not attempt tsc-only compilation without a bundler when modules are involved

## Game Loop Pattern (Canonical)

This is the pattern to implement. No library needed.

```javascript
// Use performance.now() for timing, never Date.now()
let lastTime = 0;

function gameLoop(timestamp) {
  const deltaTime = (timestamp - lastTime) / 1000; // seconds
  lastTime = timestamp;

  update(deltaTime);  // advance game state by deltaTime
  render();           // clear canvas and redraw everything

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
```

Variable timestep (delta time passed to `update`) is correct for Space Invaders. Fixed timestep is not necessary — the game has no physics simulation requiring deterministic integration.

## Collision Detection Pattern

AABB (Axis-Aligned Bounding Box) rectangle overlap is sufficient and standard for this game. No library needed.

```javascript
function overlaps(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + b.height > b.y
  );
}
```

Spatial partitioning (quadtree, grid) is not needed. At peak, collision checks are: 1 player bullet × 55 aliens + N alien bullets × 1 player = well under 100 checks per frame.

## Version Compatibility

| Item | Details |
|------|---------|
| ES Modules (`type="module"`) | Supported in all modern browsers (Chrome 61+, Firefox 60+, Safari 10.1+). Can I Use: 97%+ global support as of 2026. |
| Canvas 2D API | Universal browser support since IE9. No compatibility concerns. |
| `requestAnimationFrame` | Universal browser support. No polyfill needed. |
| `performance.now()` | Supported in all modern browsers. No polyfill needed. |

## Sources

- [MDN — Anatomy of a video game](https://developer.mozilla.org/en-US/docs/Games/Anatomy) — game loop patterns, fixed vs variable timestep, performance.now() guidance (HIGH confidence, official)
- [MDN — Optimizing canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) — offscreen canvas, clearRect, alpha: false, Math.floor() for pixel coords (HIGH confidence, official)
- [MDN — requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) — timing callback, DOMHighResTimeStamp (HIGH confidence, official)
- [LogRocket — Best JavaScript and HTML5 game engines (2025)](https://blog.logrocket.com/best-javascript-html5-game-engines-2025/) — Phaser vs PixiJS vs vanilla comparison (MEDIUM confidence, editorial)
- [JS Game Rendering Benchmark](https://github.com/Shirajuki/js-game-rendering-benchmark) — Phaser, Kaboom, Kontra, Canvas API performance data (MEDIUM confidence, community benchmark)
- [DEV.to — 120 HTML5 Games Using Pure Canvas (No Frameworks)](https://dev.to/cannan_david/i-built-120-html5-games-using-pure-canvas-no-frameworks-gdm) — real-world vanilla canvas viability at scale (MEDIUM confidence, practitioner)
- [DEV.to — Coding Space Invaders in JavaScript](https://dev.to/codingwithadam/coding-space-invaders-in-javascript-complete-tutorial-every-step-explained-with-html5-canvas-45ja) — Space Invaders-specific vanilla Canvas implementation reference (MEDIUM confidence, practitioner)

---
*Stack research for: Browser HTML5 Canvas arcade game (Space Invaders)*
*Researched: 2026-03-18*
