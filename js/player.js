// js/player.js
// Player cannon — movement, bullet firing

const player = {
  x: PLAYER_START_X,
  y: PLAYER_START_Y,
  w: PLAYER_W,
  h: PLAYER_H,
  speed: PLAYER_SPEED,
  alive: true,
  invincible: false,
  invincibleTimer: 0,
  invincibleFlash: false  // toggles for visual flicker
};

let playerBullet = null;       // null when no bullet active; object when active
let prevSpaceDown = false;     // rising-edge detection: was Space held last frame?

function resetPlayer() {
  player.x = PLAYER_START_X;
  player.y = PLAYER_START_Y;
  player.alive = true;
  player.invincible = true;
  player.invincibleTimer = 2.0;  // 2 seconds of invincibility after respawn
  playerBullet = null;
}

function updatePlayer(dt) {
  // Movement (PLAY-01)
  if (keys['ArrowLeft'] || keys['KeyA']) {
    player.x -= player.speed * dt;
  }
  if (keys['ArrowRight'] || keys['KeyD']) {
    player.x += player.speed * dt;
  }
  // Clamp to screen bounds
  player.x = Math.max(0, Math.min(LOGICAL_WIDTH - player.w, player.x));

  // Invincibility timer
  if (player.invincible) {
    player.invincibleTimer -= dt;
    player.invincibleFlash = Math.floor(player.invincibleTimer * 8) % 2 === 0; // flicker at 8Hz
    if (player.invincibleTimer <= 0) {
      player.invincible = false;
      player.invincibleFlash = false;
    }
  }

  // Bullet — rising-edge spacebar detection (PLAY-02)
  const spaceDown = keys['Space'] === true;
  if (spaceDown && !prevSpaceDown && !playerBullet) {
    // Fire: only on key-down edge, only if no bullet active
    playerBullet = {
      x: player.x + player.w / 2 - PLAYER_BULLET_W / 2,
      y: player.y - PLAYER_BULLET_H,
      w: PLAYER_BULLET_W,
      h: PLAYER_BULLET_H,
      vy: -PLAYER_BULLET_SPEED
    };
  }
  prevSpaceDown = spaceDown;

  // Move bullet
  if (playerBullet) {
    playerBullet.y += playerBullet.vy * dt;
    if (playerBullet.y + playerBullet.h < 0) {
      playerBullet = null; // despawn when off-screen top
    }
  }
}

function renderPlayer(ctx) {
  // Skip render if invincible and flashing (flicker effect)
  if (player.invincible && player.invincibleFlash) return;

  // Player cannon — green rectangle (placeholder shape, sprites in Phase 4)
  ctx.fillStyle = '#0f0';
  ctx.fillRect(player.x, player.y, player.w, player.h);

  // Player bullet — white thin rectangle
  if (playerBullet) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(playerBullet.x, playerBullet.y, playerBullet.w, playerBullet.h);
  }
}
