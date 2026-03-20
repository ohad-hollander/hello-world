// js/input.js
// Keyboard state map — flags set in event handlers, read per-frame in game loop

const keys = {};

window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'Space') e.preventDefault(); // prevent page scroll
});

window.addEventListener('keyup', e => {
  keys[e.code] = false;
});
