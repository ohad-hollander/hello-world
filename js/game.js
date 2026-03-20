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
  // Phase 2 plans 02 and 03 will add: initAliens(), clearBullets()
}

function update(dt) {
  if (gameState === 'playing') {
    updatePlaying(dt);
  }
  // game_over: freeze state (restart flow is Phase 4)
}

function updatePlaying(dt) {
  updatePlayer(dt);
  // Phase 2 plan 02 will add: updateAliens(dt)
  // Phase 2 plan 03 will add: updateBullets(dt), checkCollisions(), checkWinLose()
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
  renderPlayer(ctx);
  // Phase 2 plan 02 will add: renderAliens(ctx)
  // Phase 2 plan 04 will add: renderHUD(ctx)

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
