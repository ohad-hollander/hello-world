// js/game.js
// Game state machine and main update/render orchestration

let gameState = 'playing'; // 'playing' | 'game_over' | 'wave_clear'
let score = 0;
let lives = 3;
let waveNumber = 1;         // current wave (increments on each wave clear)
let waveClearTimer = 0;     // seconds elapsed in wave_clear state

function initGame() {
  gameState = 'playing';
  score = 0;
  lives = 3;
  waveNumber = 1;           // FLOW-03: reset wave counter
  waveClearTimer = 0;       // FLOW-03: clear wave transition timer
  resetPlayer();
  initAliens();
  alienBullets.length = 0; // clear any leftover bullets
  playerBullet = null;      // ensure no stale bullet on restart
  initShields();            // SHLD-01: reset shields on full restart
  initUFO();                // UFO-01: reset UFO spawn timer
}

function updateWaveClear(dt) {
  // FLOW-01: count down, then start next wave
  waveClearTimer += dt;
  if (waveClearTimer >= WAVE_CLEAR_DELAY) {
    startNextWave();
  }
}

function startNextWave() {
  waveNumber++;
  waveClearTimer = 0;

  // Reset aliens to full 55-alien formation
  initAliens();

  // Apply wave speed bonus: each wave, march step interval is WAVE_SPEED_FACTOR faster
  // initAliens() resets march.stepInterval to base (1.0s for 55 aliens)
  // Override it with the wave multiplier (clamp to minimum 0.05s)
  march.stepInterval = Math.max(0.05, calcStepInterval(55) * Math.pow(WAVE_SPEED_FACTOR, waveNumber - 1));

  // Reset UFO timer for the new wave
  initUFO();

  // Clear alien bullets — no stale projectiles carried over
  alienBullets.length = 0;

  // NOTE: Shields are intentionally NOT reset — authentic behavior: shield damage persists across waves
  // NOTE: Player position and lives are intentionally NOT reset between waves

  gameState = 'playing';
}

function updateGameOver(dt) {
  // FLOW-02/03: listen for restart key — Enter or R
  if (keys['Enter'] || keys['KeyR']) {
    initGame(); // full clean restart — all timers and state reset
  }
}

function update(dt) {
  if (gameState === 'playing') {
    updatePlaying(dt);
  } else if (gameState === 'wave_clear') {
    updateWaveClear(dt);   // FLOW-01: wave transition countdown
  } else if (gameState === 'game_over') {
    updateGameOver(dt);    // FLOW-02/03: restart key listener
  }
}

function updatePlaying(dt) {
  updatePlayer(dt);
  updateAliens(dt);
  updateBullets(dt);
  updateUFO(dt);       // UFO-01: advance UFO spawn timer or movement
  checkCollisions();

  // Check: alien reached ground line (ALIN-05) — immediate game over
  for (const alien of aliens) {
    if (alien.alive && alien.y + alien.h >= GROUND_LINE) {
      gameState = 'game_over';
      return;
    }
  }

  // Check: all aliens destroyed — Phase 4 adds wave restart
  if (getAliveCount() === 0) {
    // Wave clear — Phase 4 handles full wave progression
    gameState = 'wave_clear';
  }
}

function render() {
  // Clear canvas each frame
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  if (gameState === 'playing') {
    renderPlaying();
  } else if (gameState === 'game_over') {
    renderPlaying(); // render final frame behind text
    renderGameOver();
  } else if (gameState === 'wave_clear') {
    renderPlaying();
    renderWaveClear();
  }
}

function renderPlaying() {
  renderShields(ctx);  // SHLD-01: shields render behind aliens
  renderAliens(ctx);
  renderUFO(ctx);      // UFO-01: render above aliens (top of screen)
  renderPlayer(ctx);
  renderHUD(ctx);  // renders on top of game elements

  // Render alien bullets
  if (typeof alienBullets !== 'undefined') {
    ctx.fillStyle = '#f00';
    for (const b of alienBullets) {
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
  }

  // Ground line
  ctx.strokeStyle = '#0f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_LINE);
  ctx.lineTo(LOGICAL_WIDTH, GROUND_LINE);
  ctx.stroke();
}

function renderGameOver() {
  renderHUD(ctx);  // show final score in HUD

  // Dim overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GAME OVER', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 - 30);

  ctx.font = '24px monospace';
  ctx.fillText('Final Score: ' + String(score).padStart(4, '0'), LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 + 30);
  ctx.font = '18px monospace';
  ctx.fillStyle = '#aaa';
  ctx.fillText('(full restart in Phase 4)', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 + 70);
}

function renderWaveClear() {
  renderHUD(ctx);  // show score on wave clear

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  ctx.fillStyle = '#0f0';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('WAVE CLEAR!', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 - 30);

  ctx.font = '24px monospace';
  ctx.fillStyle = '#fff';
  ctx.fillText('Score: ' + String(score).padStart(4, '0'), LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 + 30);
  ctx.font = '18px monospace';
  ctx.fillStyle = '#aaa';
  ctx.fillText('(wave progression in Phase 4)', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 + 70);
}
