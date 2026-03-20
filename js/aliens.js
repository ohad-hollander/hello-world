// js/aliens.js
// Alien formation — grid data, step-based march, firing eligibility

let aliens = [];      // array of alien objects
let aliveCount = 0;   // tracked separately for fast interval calculation

const march = {
  dx: MARCH_DX,           // current step direction (positive = right, negative = left)
  stepTimer: 0,           // time since last step (seconds)
  stepInterval: 1.0,      // recalculated each step based on aliveCount
  pendingDown: false       // true after wall hit — triggers down-step next step
};

const alienFireState = {
  timer: 0,
  interval: 1.2           // seconds between fire attempts (decreases with alien count)
};

// alienBullets defined in plan 03 (bullets.js) — referenced here for fire events
// For plan 02 standalone: declare locally; plan 03 will replace this
if (typeof alienBullets === 'undefined') var alienBullets = [];

function initAliens() {
  aliens = [];
  aliveCount = ALIEN_ROWS * ALIEN_COLS; // 55

  for (let row = 0; row < ALIEN_ROWS; row++) {
    for (let col = 0; col < ALIEN_COLS; col++) {
      aliens.push({
        row: row,
        col: col,
        x: FORMATION_LEFT + col * ALIEN_CELL_W,
        y: FORMATION_TOP  + row * ALIEN_CELL_H,
        w: ALIEN_W,
        h: ALIEN_H,
        alive: true,
        animFrame: 0    // 0 or 1 — toggled each march step for walk animation
      });
    }
  }

  // Reset march state
  march.dx = MARCH_DX;
  march.stepTimer = 0;
  march.pendingDown = false;
  march.stepInterval = calcStepInterval(aliveCount);

  // Reset fire state
  alienFireState.timer = 0;
  alienFireState.interval = calcFireInterval(aliveCount);
}

function calcStepInterval(count) {
  // 55 aliens = ~1.0s/step (slow); 1 alien = ~0.05s/step (fast)
  return 0.05 + (count / (ALIEN_ROWS * ALIEN_COLS)) * 0.95;
}

function calcFireInterval(count) {
  // 55 aliens = 1.2s between shots; 1 alien = 0.4s
  return 0.4 + (count / (ALIEN_ROWS * ALIEN_COLS)) * 0.8;
}

function updateAliens(dt) {
  if (aliveCount === 0) return;

  // --- March step timer ---
  march.stepTimer += dt;
  if (march.stepTimer >= march.stepInterval) {
    march.stepTimer -= march.stepInterval;
    doMarchStep();
  }

  // --- Alien fire timer ---
  alienFireState.timer += dt;
  if (alienFireState.timer >= alienFireState.interval) {
    alienFireState.timer -= alienFireState.interval;
    doAlienFire();
  }
}

function doMarchStep() {
  if (march.pendingDown) {
    // Step down instead of sideways this step
    for (const alien of aliens) {
      if (alien.alive) alien.y += MARCH_DY;
    }
    march.pendingDown = false;
    // Toggle animation frame
    for (const alien of aliens) {
      if (alien.alive) alien.animFrame = alien.animFrame === 0 ? 1 : 0;
    }
    // Check overflight after stepping down
    if (typeof checkAlienOverflightVsShields === 'function') {
      checkAlienOverflightVsShields();
    }
    return;
  }

  // Move horizontally
  for (const alien of aliens) {
    if (alien.alive) alien.x += march.dx;
  }

  // Toggle animation frame
  for (const alien of aliens) {
    if (alien.alive) alien.animFrame = alien.animFrame === 0 ? 1 : 0;
  }

  // Check wall collision — find extreme edges of living formation
  let leftmost  = Infinity;
  let rightmost = -Infinity;
  for (const alien of aliens) {
    if (alien.alive) {
      if (alien.x < leftmost)           leftmost  = alien.x;
      if (alien.x + alien.w > rightmost) rightmost = alien.x + alien.w;
    }
  }

  // Hit left or right boundary → reverse and schedule down-step
  if ((march.dx < 0 && leftmost <= MARCH_LEFT_BOUND) ||
      (march.dx > 0 && rightmost >= MARCH_RIGHT_BOUND)) {
    march.dx = -march.dx;
    march.pendingDown = true;
  }

  // Alien overflight shield erosion — runs each march step (SHLD-03)
  if (typeof checkAlienOverflightVsShields === 'function') {
    checkAlienOverflightVsShields();
  }
}

function doAlienFire() {
  const shooters = getColumnShooters();
  if (shooters.length === 0) return;

  // Limit concurrent alien bullets
  const currentBullets = (typeof alienBullets !== 'undefined') ? alienBullets.length : 0;
  if (currentBullets >= MAX_ALIEN_BULLETS) return;

  // Pick a random shooter
  const shooter = shooters[Math.floor(Math.random() * shooters.length)];
  alienBullets.push({
    x: shooter.x + shooter.w / 2 - ALIEN_BULLET_W / 2,
    y: shooter.y + shooter.h,
    w: ALIEN_BULLET_W,
    h: ALIEN_BULLET_H,
    vy: ALIEN_BULLET_SPEED
  });
}

function getColumnShooters() {
  // For each column, find the alive alien with the highest row index (lowest on screen = most dangerous)
  const shooters = [];
  for (let col = 0; col < ALIEN_COLS; col++) {
    let bottom = null;
    for (const alien of aliens) {
      if (alien.alive && alien.col === col) {
        if (bottom === null || alien.row > bottom.row) bottom = alien;
      }
    }
    if (bottom) shooters.push(bottom);
  }
  return shooters;
}

function killAlien(alien) {
  alien.alive = false;
  aliveCount--;
  // Recalculate intervals — game accelerates as aliens die
  march.stepInterval = calcStepInterval(aliveCount);
  alienFireState.interval = calcFireInterval(aliveCount);
}

function getAliveCount() {
  return aliveCount;
}

function renderAliens(ctx) {
  const S = 3; // each logical pixel = 3×3 canvas pixels (12×8 grid → 36×24)

  // Squid (row 0) — spiked skull bug with antenna, cyan
  const squidA = [
    [0,0,1,0,0,0,0,0,0,1,0,0],
    [0,0,1,1,0,0,0,0,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,0],
    [1,1,0,0,1,1,1,1,0,0,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [0,1,1,0,1,1,1,1,0,1,1,0],
    [0,1,0,0,0,1,1,0,0,0,1,0],
    [1,0,0,0,0,0,0,0,0,0,0,1],
  ];
  const squidB = [
    [0,0,1,0,0,0,0,0,0,1,0,0],
    [0,0,1,1,0,0,0,0,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,0],
    [1,1,0,0,1,1,1,1,0,0,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [0,1,1,0,1,1,1,1,0,1,1,0],
    [1,0,0,0,0,1,1,0,0,0,0,1],
    [0,0,1,0,0,0,0,0,0,1,0,0],
  ];
  // Eye positions for squid: row 3, cols 4–5 and 6–7 (inside the filled zones)
  const squidEyes = [[3,4],[3,7]];

  // Crab (rows 1–2) — armored crab with big claws, yellow
  const crabA = [
    [1,0,0,0,0,0,0,0,0,0,0,1],
    [0,1,0,0,1,0,0,1,0,0,1,0],
    [0,0,1,1,1,1,1,1,1,1,0,0],
    [0,1,1,0,1,1,1,1,0,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [0,0,1,0,0,0,0,0,0,1,0,0],
    [0,1,0,0,0,0,0,0,0,0,1,0],
  ];
  const crabB = [
    [0,1,0,0,0,0,0,0,0,0,1,0],
    [1,0,0,1,0,0,0,0,1,0,0,1],
    [0,0,1,1,1,1,1,1,1,1,0,0],
    [0,1,1,0,1,1,1,1,0,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [0,1,0,0,0,0,0,0,0,0,1,0],
    [1,0,0,0,0,0,0,0,0,0,0,1],
  ];
  // Eye positions for crab: row 3, cols 4 and 7
  const crabEyes = [[3,4],[3,7]];

  // Octopus (rows 3–4) — fat dome blob with tentacles, hot orange-pink
  const octopusA = [
    [0,0,0,1,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,0,0],
    [0,1,1,0,0,1,1,0,0,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [0,1,1,0,1,1,1,1,0,1,1,0],
    [0,1,0,1,0,0,0,0,1,0,1,0],
    [1,0,1,0,0,0,0,0,0,1,0,1],
  ];
  const octopusB = [
    [0,0,0,1,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,0,0],
    [0,1,1,0,0,1,1,0,0,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [0,1,1,0,1,1,1,1,0,1,1,0],
    [1,0,0,1,0,0,0,0,1,0,0,1],
    [0,1,0,0,0,0,0,0,0,0,1,0],
  ];
  // Eye positions for octopus: row 2, cols 3 and 8
  const octopusEyes = [[2,3],[2,8]];

  for (const alien of aliens) {
    if (!alien.alive) continue;

    let sprite, color, eyes;
    if (alien.row === 0) {
      sprite = alien.animFrame === 0 ? squidA : squidB;
      color = '#00ffff';
      eyes = squidEyes;
    } else if (alien.row <= 2) {
      sprite = alien.animFrame === 0 ? crabA : crabB;
      color = '#ffee00';
      eyes = crabEyes;
    } else {
      sprite = alien.animFrame === 0 ? octopusA : octopusB;
      color = '#ff4499';
      eyes = octopusEyes;
    }

    // Neon glow — pulses slightly between animation frames
    ctx.shadowColor = color;
    ctx.shadowBlur = alien.animFrame === 0 ? 8 : 14;

    ctx.fillStyle = color;
    for (let r = 0; r < sprite.length; r++) {
      for (let c = 0; c < sprite[r].length; c++) {
        if (sprite[r][c]) ctx.fillRect(alien.x + c * S, alien.y + r * S, S, S);
      }
    }

    // Glowing white eyes
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#fff';
    for (const [er, ec] of eyes) {
      ctx.fillRect(alien.x + ec * S, alien.y + er * S, S, S);
    }

    ctx.shadowBlur = 0; // reset
  }
}
