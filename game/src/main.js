// main.js — boots Turkey Run: wires the canvas, input, sound and game loop,
// reads ?shot= for the maker's screenshot setups, and owns the on-screen
// menu buttons (start, restart, mute) so the game itself never touches DOM.

import { VIEW } from './config.js';
import { SoundBank } from './audio.js';
import { Input } from './input.js';
import { Game } from './game.js';
import { seedFromUrl } from './rng.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const sounds = new SoundBank();
const input = new Input(canvas);
const seed = seedFromUrl();
const game = new Game(canvas, sounds, seed);

const startBtn = document.getElementById('btn-start');
const againBtn = document.getElementById('btn-again');
const muteBtn = document.getElementById('btn-mute');

function showOnly(button) {
  for (const b of [startBtn, againBtn]) b.classList.toggle('hidden', b !== button);
}

game.onStateChange = (state) => {
  if (state === 'title') showOnly(startBtn);
  else if (state === 'caught' || state === 'escaped') showOnly(againBtn);
  else showOnly(null);
};

startBtn.addEventListener('click', () => {
  sounds.unlock();
  sounds.click();
  game.startRun();
});
againBtn.addEventListener('click', () => {
  sounds.unlock();
  sounds.click();
  game.startRun();
});
muteBtn.addEventListener('click', () => {
  sounds.unlock();
  const muted = sounds.toggleMute();
  muteBtn.textContent = muted ? '🔇 Sound off' : '🔊 Sound on';
});

// First gesture anywhere also unlocks audio, so the gobble plays on start.
window.addEventListener('pointerdown', () => sounds.unlock(), { once: true });
window.addEventListener('keydown', () => sounds.unlock(), { once: true });

// Screenshot mode: stage one frozen frame and paint it once — no loop,
// no timers, so the picture is exactly the staged state.
// ?clean=1 hides the help line and stretches the stage to fill the
// window, so a 1280x720 capture is pure game, no page chrome.
const params = new URLSearchParams(location.search);
if (params.get('clean')) {
  document.body.style.padding = '0';
  document.body.style.gap = '0';
  document.getElementById('help').style.display = 'none';
  const stage = document.getElementById('stage');
  stage.style.width = '100%';
  stage.style.borderRadius = '0';
  stage.style.boxShadow = 'none';
}
const shot = params.get('shot');
if (shot) {
  applyShot(game, shot, seed);
  game.render();
  document.title = `Turkey Run — shot ${shot}`;
} else {
  // Normal play: fixed-step simulation, render every animation frame.
  let last = performance.now();
  let accumulator = 0;
  const STEP = 1 / 60;
  function loop(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    accumulator += dt;
    while (accumulator >= STEP) {
      game.frame(STEP, input);
      accumulator -= STEP;
    }
    requestAnimationFrame(loop);
  }
  showOnly(startBtn);
  game.render();
  requestAnimationFrame(loop);
}
