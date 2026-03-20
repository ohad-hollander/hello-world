// js/hud.js
// HUD — score and lives display (CMBT-04)

function renderHUD(ctx) {
  ctx.save();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  // Score label and value (top-left)
  ctx.fillText('SCORE', 24, 12);
  ctx.font = 'bold 24px monospace';
  ctx.fillText(String(score).padStart(4, '0'), 24, 34);

  // Wave number centered (FLOW-01: wave display)
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('WAVE', LOGICAL_WIDTH / 2, 12);
  ctx.font = 'bold 24px monospace';
  ctx.fillText(String(waveNumber), LOGICAL_WIDTH / 2, 34);

  // Lives label and value (top-right)
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('LIVES', LOGICAL_WIDTH - 24, 12);
  ctx.font = 'bold 24px monospace';
  ctx.fillText(String(lives), LOGICAL_WIDTH - 24, 34);

  // HUD separator line
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, HUD_HEIGHT);
  ctx.lineTo(LOGICAL_WIDTH, HUD_HEIGHT);
  ctx.stroke();

  ctx.restore();
}
