// shots.js — deterministic screenshot setups. The game reads ?shot= from
// the URL: start (title screen), play (mid-run, farmer closing in),
// danger (kitchen oven + falling knives) and end (escaped screen).
// Each shot seeds the world and fast-forwards the simulation a fixed number
// of frames, so the same URL always renders the same picture. This is only
// a maker tool for screenshots; normal play never uses it.

import { ESCAPE_DISTANCE, GROUND_Y, TURKEY } from './config.js';
import { stageAt } from './world.js';

function stepGame(game, input, frames) {
  for (let i = 0; i < frames; i++) {
    game.update(1 / 60, input);
    input.endFrame();
  }
}

function idleInput() {
  return {
    jumpPressed: false,
    jumpHeld: false,
    slideHeld: false,
    dashPressed: false,
    restartPressed: false,
    mutePressed: false,
    pausePressed: false,
    anyPressed: false,
    endFrame() {},
  };
}

function jumpingInput() {
  const input = idleInput();
  // Hop every 40 frames so the turkey stays airborne over obstacles.
  let frame = 0;
  input.endFrame = function () {
    frame++;
    input.jumpPressed = frame % 40 === 0;
  };
  return input;
}

export function applyShot(game, shot, seed) {
  const input = idleInput();
  if (shot === 'start') {
    game.setState('title');
    game.scrollPx = 200;
    return;
  }

  game.startRun();
  // Shots are staged, not played: the turkey cannot die mid-setup.
  game.turkey.invulnerableTimer = 9999;

  if (shot === 'play') {
    // ~9 seconds in: farmyard, corn in the air, Jed closing after a stumble.
    const run = jumpingInput();
    stepGame(game, run, 540);
    game.turkey.invulnerableTimer = 0;
    game.farmer.gap = 70; // Jed right on the turkey's tail feathers
    game.farmer.mood = 'chasing';
    game.score = 1240;
    game.cornEaten = 14;
    game.world.pickups.push(
      { kind: 'corn', x: 700, y: GROUND_Y - 190, bob: 0 },
      { kind: 'corn', x: 746, y: GROUND_Y - 190, bob: 1 },
      { kind: 'golden', x: 792, y: GROUND_Y - 190, bob: 2 },
    );
    return;
  }

  if (shot === 'danger') {
    // Stage the kitchen directly: ovens, flames, falling knives, no
    // 95-second simulation to survive first.
    game.world.distancePx = 920 * 50;
    game.world.obstacles = [];
    game.world.pickups = [];
    game.world.knives = [];
    game.world.flames = [];
    game.world.nextSpawnX = 2000;
    game.score = 9870;
    game.cornEaten = 61;
    game.lives = 2;
    game.farmer.gap = 90;
    game.farmer.mood = 'chasing';
    const stage = stageAt(game.world.distanceMetres);
    game.showHint(`${stage.name} — ${stage.hint}`);
    game.hintAlpha = 1;
    game.hintTimer = 99;
    game.world.obstacles.push(
      { kind: 'oven', x: 760, y: GROUND_Y - 96, w: 110, h: 96, passed: false },
      { kind: 'pot', x: 980, y: GROUND_Y - 64, w: 90, h: 64, passed: false },
      { kind: 'fence', x: 1140, y: GROUND_Y - 70, w: 46, h: 70, passed: false },
    );
    game.world.flames.push({ x: 778, y: GROUND_Y - 150, w: 74, h: 60, timer: 0.3 });
    game.world.dropKnife(620);
    game.world.dropKnife(880);
    game.world.knives[0].y = 210;
    game.world.knives[1].y = 330;
    game.world.throwKnife(120, GROUND_Y - 40);
    game.turkey.y = GROUND_Y - TURKEY.height - 120; // mid-jump over the oven
    game.turkey.vy = -200;
    game.turkey.grounded = false;
    game.turkey.invulnerableTimer = 0;
    game.time = 1.2;
    return;
  }

  if (shot === 'end') {
    // The escape: reached the Freedom Gate, final tally on screen.
    game.turkey.invulnerableTimer = 0;
    game.world.distancePx = ESCAPE_DISTANCE * 50;
    game.score = 18420;
    game.cornEaten = 96;
    game.lives = 2;
    game.endRun('escaped');
    return;
  }

  // Unknown ?shot=: fall back to the title screen.
  game.setState('title');
  void seed;
}
