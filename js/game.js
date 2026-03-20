// js/game.js
// Game state machine and main update/render orchestration

let gameState = 'playing'; // 'playing' | 'game_over'
let score = 0;
let lives = 3;

function initGame() {
  gameState = 'playing';
  score = 0;
  lives = 3;
  resetPlayer();
  initAliens();
}

function update(dt) {
  if (gameState === 'playing') {
    updatePlaying(dt);
  }
  // game_over: freeze state (restart flow is Phase 4)
}

function updatePlaying(dt) {
  updatePlayer(dt);
  updateAliens(dt);

  // Check: alien reached ground line (ALIN-05) — immediate game over
  for (const alien of aliens) {
    if (alien.alive && alien.y + alien.h >= GROUND_LINE) {
      gameState = 'game_over';
      return;
    }
  }
  // Plan 03 will add: updateBullets(dt), checkCollisions(), checkLivesAndScore()
}

function render() {
  // Clear canvas each frame
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  if (gameState === 'playing') {
    renderPlaying();
  } else if (gameState === 'game_over') {
    renderGameOver();
  }
}

function renderPlaying() {
  renderAliens(ctx);
  renderPlayer(ctx);
  // Plan 04 will add: renderHUD(ctx)

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
  ctx.fillStyle = '#fff';
  ctx.font = '48px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GAME OVER', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2);
  ctx.font = '24px monospace';
  ctx.fillText('Score: ' + score, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 + 60);
}
