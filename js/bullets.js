// js/bullets.js
// Bullet lifecycle management and AABB collision detection

function overlaps(a, b) {
  // AABB (Axis-Aligned Bounding Box) collision check
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

function updateBullets(dt) {
  // Alien bullets are stored in alienBullets global (declared in aliens.js)
  // Player bullet is moved in player.js updatePlayer()
  // This function handles alien bullet movement and despawn
  for (let i = alienBullets.length - 1; i >= 0; i--) {
    const b = alienBullets[i];
    b.y += b.vy * dt;
    // Despawn alien bullets that go past the ground line
    if (b.y > GROUND_LINE + 20) {
      alienBullets.splice(i, 1);
    }
  }
}

function checkCollisions() {
  checkPlayerBulletVsShields();    // shields checked first — bullet consumed stops alien check
  checkPlayerBulletVsAliens();
  checkAlienBulletsVsShields();    // alien bullets vs shields before player check
  checkAlienBulletsVsPlayer();
}

function checkPlayerBulletVsAliens() {
  if (!playerBullet) return; // no bullet to check

  for (const alien of aliens) {
    if (!alien.alive) continue;
    if (overlaps(playerBullet, alien)) {
      // Hit! Kill alien and award score
      killAlien(alien);
      score += ROW_POINTS[alien.row];
      playerBullet = null; // bullet consumed
      return; // stop checking — bullet is gone
    }
  }
}

function checkAlienBulletsVsPlayer() {
  if (player.invincible) return; // player is invincible during respawn

  for (let i = alienBullets.length - 1; i >= 0; i--) {
    const bullet = alienBullets[i];
    if (overlaps(bullet, player)) {
      alienBullets.splice(i, 1); // remove bullet

      lives--;
      if (lives <= 0) {
        // All lives gone — game over (PLAY-04)
        gameState = 'game_over';
      } else {
        // Respawn with invincibility (PLAY-03)
        resetPlayer();
      }
      return; // only one hit per frame
    }
  }
}
