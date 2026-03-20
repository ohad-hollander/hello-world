// js/sound.js
// Procedural sound effects via Web Audio API — no audio files needed

let _audioCtx = null;

function _getCtx() {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

function _tone(freq, type, dur, vol, freqEnd) {
  const ctx = _getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  const t = ctx.currentTime;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.start(t);
  osc.stop(t + dur);
}

function sfxShoot() {
  _tone(600, 'square', 0.08, 0.25, 150);
}

function sfxAlienHit() {
  _tone(180, 'sawtooth', 0.18, 0.35, 40);
}

function sfxUfoHit() {
  [300, 500, 800, 1200, 1800].forEach((f, i) =>
    setTimeout(() => _tone(f, 'square', 0.14, 0.4), i * 55)
  );
}

function sfxPlayerDeath() {
  _tone(350, 'sawtooth', 0.45, 0.5, 40);
}

function sfxWin() {
  [523, 659, 784, 1047].forEach((f, i) =>
    setTimeout(() => _tone(f, 'square', 0.22, 0.45), i * 110)
  );
}

function sfxLose() {
  [350, 250, 160, 80].forEach((f, i) =>
    setTimeout(() => _tone(f, 'sawtooth', 0.28, 0.5), i * 140)
  );
}

// Unlock audio context on first user gesture (required on mobile)
document.addEventListener('touchstart', _getCtx, { once: true });
document.addEventListener('keydown', _getCtx, { once: true });
