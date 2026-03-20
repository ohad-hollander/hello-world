// js/game.js
// Game state machine and main update/render orchestration

let gameState = 'playing'; // 'playing' | 'game_over' | 'wave_clear'
let score = 0;
let lives = 3;

function initGame() {
  gameState = 'playing';
  score = 0;
  lives = 3;
  resetPlayer();
  initAliens();
  alienBullets.length = 0; // clear any leftover bullets
  initShields();            // SHLD-01: initialize 4 destructible shields
}

function update(dt) {
  if (gameState === 'playing') {
    updatePlaying(dt);
  }
  // game_over / wave_clear: freeze state (restart flow is Phase 4)
}

function updatePlaying(dt) {
  updatePlayer(dt);
  updateAliens(dt);
  updateBullets(dt);
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
