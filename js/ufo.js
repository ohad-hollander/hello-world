// js/ufo.js
// Mystery UFO — periodic flyby at top of screen, bonus points on hit

const ufo = {
  active: false,    // is UFO currently visible/moving on screen?
  x: 0,
  y: UFO_Y,
  w: UFO_W,
  h: UFO_H,
  vx: 0,           // px/sec (positive = right, negative = left)
  spawnTimer: 0,   // seconds elapsed since last despawn
  spawnInterval: 0 // randomized seconds until next spawn (set in initUFO / despawnUFO)
};

function initUFO() {
  ufo.active = false;
  ufo.spawnTimer = 0;
  ufo.spawnInterval = randomUFOInterval();
}

function randomUFOInterval() {
  return UFO_MIN_INTERVAL + Math.random() * (UFO_MAX_INTERVAL - UFO_MIN_INTERVAL);
}

function spawnUFO() {
  // Randomly enter from left or right edge
  const goRight = Math.random() < 0.5;
  ufo.vx = goRight ? UFO_SPEED : -UFO_SPEED;
  ufo.x  = goRight ? -UFO_W : LOGICAL_WIDTH;  // start fully off-screen
  ufo.y  = UFO_Y;
  ufo.active = true;
  ufo.spawnTimer = 0;
  ufo.spawnInterval = randomUFOInterval(); // schedule next appearance
}

function despawnUFO() {
  ufo.active = false;
  ufo.spawnTimer = 0;
  // spawnInterval already set in spawnUFO — reuse for next cycle
}

function updateUFO(dt) {
  if (!ufo.active) {
    // Count down to next spawn
    ufo.spawnTimer += dt;
    if (ufo.spawnTimer >= ufo.spawnInterval) {
      spawnUFO();
    }
    return;
  }

  // Move horizontally
  ufo.x += ufo.vx * dt;

  // Despawn when fully off the opposite edge
  if ((ufo.vx > 0 && ufo.x > LOGICAL_WIDTH) ||
      (ufo.vx < 0 && ufo.x + ufo.w < 0)) {
    despawnUFO();
  }
}

function renderUFO(ctx) {
  if (!ufo.active) return;
  ctx.fillStyle = '#f00'; // classic red mystery ship
  ctx.fillRect(ufo.x, ufo.y, ufo.w, ufo.h);
}

function checkPlayerBulletVsUFO() {
  // Called from checkCollisions() in bullets.js
  if (!ufo.active || !playerBullet) return;

  // AABB collision check (overlaps() defined in bullets.js)
  if (!overlaps(playerBullet, ufo)) return;

  // Hit! Award random bonus points
  const bonus = UFO_POINTS[Math.floor(Math.random() * UFO_POINTS.length)];
  score += bonus;

  // Consume bullet and despawn UFO
  playerBullet = null;
  despawnUFO();
}
