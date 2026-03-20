// js/shields.js
// Destructible shields — offscreen canvas storage, rendering, and erosion

let shields = [];

function initShields() {
  shields = [];
  for (let i = 0; i < SHIELD_POSITIONS.length; i++) {
    shields.push(createShield(SHIELD_POSITIONS[i], SHIELD_Y));
  }
}

function createShield(x, y) {
  // Create an offscreen canvas at logical pixel dimensions (NO DPR — offscreen is logical px)
  const offscreen = document.createElement('canvas');
  offscreen.width  = SHIELD_W;
  offscreen.height = SHIELD_H;
  const sCtx = offscreen.getContext('2d');
  drawShieldShape(sCtx, SHIELD_W, SHIELD_H);
  return { x, y, w: SHIELD_W, h: SHIELD_H, canvas: offscreen, ctx: sCtx };
}

function drawShieldShape(sCtx, w, h) {
  // Classic Space Invaders bunker shape — solid upper block + two pillars with notch
  sCtx.fillStyle = '#0f0';

  // Upper solid block: rows 0 to 62.5% of height (rows 0-9 of 16 = 30/48 px)
  const notchStartY = 30; // pixel row where notch begins
  sCtx.fillRect(0, 0, w, notchStartY);

  // Left pillar (below notch): 18px wide
  sCtx.fillRect(0, notchStartY, 18, h - notchStartY);

  // Right pillar (below notch): 18px wide, aligned to right edge
  sCtx.fillRect(w - 18, notchStartY, 18, h - notchStartY);

  // Center gap (notch) is 66 - 18 - 18 = 30px wide — left empty by construction
}

function renderShields(ctx) {
  for (const shield of shields) {
    // drawImage to main canvas at logical coords — DPR scaling applied by ctx.scale() handles device pixels
    ctx.drawImage(shield.canvas, shield.x, shield.y, shield.w, shield.h);
  }
}

// --- Bullet vs Shield Collision ---

function checkPlayerBulletVsShields() {
  if (!playerBullet) return;

  for (const shield of shields) {
    // AABB fast reject
    if (!bulletOverlapsShield(playerBullet, shield)) continue;

    // Player bullet travels upward (vy < 0) — tip is the top edge (bullet.y)
    const localX = Math.floor(playerBullet.x + playerBullet.w / 2 - shield.x);
    const localY = Math.floor(playerBullet.y - shield.y);  // top of bullet

    if (shieldPixelLive(shield, localX, localY)) {
      erodeShield(shield, localX, localY);
      playerBullet = null; // bullet consumed
      return; // stop checking — bullet is gone
    }
  }
}

function checkAlienBulletsVsShields() {
  for (let i = alienBullets.length - 1; i >= 0; i--) {
    const bullet = alienBullets[i];

    for (const shield of shields) {
      // AABB fast reject
      if (!bulletOverlapsShield(bullet, shield)) continue;

      // Alien bullet travels downward (vy > 0) — tip is the bottom edge (bullet.y + bullet.h)
      const localX = Math.floor(bullet.x + bullet.w / 2 - shield.x);
      const localY = Math.floor(bullet.y + bullet.h - shield.y);  // bottom of bullet

      if (shieldPixelLive(shield, localX, localY)) {
        erodeShield(shield, localX, localY);
        alienBullets.splice(i, 1); // bullet consumed
        break; // this bullet is gone — move to next bullet
      }
    }
  }
}

function bulletOverlapsShield(bullet, shield) {
  return bullet.x < shield.x + shield.w &&
         bullet.x + bullet.w > shield.x &&
         bullet.y < shield.y + shield.h &&
         bullet.y + bullet.h > shield.y;
}

function shieldPixelLive(shield, localX, localY) {
  // Clamp to offscreen canvas bounds — getImageData throws if out of range
  const px = Math.max(0, Math.min(shield.w - 1, localX));
  const py = Math.max(0, Math.min(shield.h - 1, localY));
  const imgData = shield.ctx.getImageData(px, py, 1, 1);
  return imgData.data[3] > 0; // alpha > 0 means pixel is live (not eroded)
}

function erodeShield(shield, localX, localY) {
  // Erase a circular crater using destination-out composite operation
  shield.ctx.save();
  shield.ctx.globalCompositeOperation = 'destination-out';
  shield.ctx.beginPath();
  shield.ctx.arc(localX, localY, SHIELD_CRATER_RADIUS, 0, Math.PI * 2);
  shield.ctx.fill();
  shield.ctx.restore();
  // After restore, globalCompositeOperation is back to 'source-over'
}

// --- Alien Overflight Erosion (SHLD-03) ---

function checkAlienOverflightVsShields() {
  // Called once per march step from doMarchStep() in aliens.js
  // Erodes a horizontal strip from each shield where an alive alien overlaps it
  for (const alien of aliens) {
    if (!alien.alive) continue;

    for (const shield of shields) {
      // AABB check: does this alien overlap this shield?
      if (!overlaps(alien, shield)) continue;

      // Translate alien bottom-center to shield local coordinates
      const localX = Math.floor(alien.x + alien.w / 2 - shield.x);
      const localY = Math.floor(alien.y + alien.h - shield.y); // alien bottom edge in shield space

      // Erase a rectangular horizontal strip at the alien contact line
      const stripX = Math.max(0, localX - Math.floor(alien.w / 2));
      const stripW = Math.min(shield.w - stripX, alien.w);
      const stripY = Math.max(0, localY - SHIELD_OVERFLIGHT_H);
      const stripH = Math.min(shield.h - stripY, SHIELD_OVERFLIGHT_H);

      if (stripW > 0 && stripH > 0) {
        shield.ctx.clearRect(stripX, stripY, stripW, stripH);
      }
    }
  }
}
