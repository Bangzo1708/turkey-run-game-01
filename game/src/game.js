// game.js — the game itself: states (title / playing / paused / caught /
// escaped), the main loop, scoring, lives and the farmer-gap tension.
// It owns the turkey, the farmer and the world, and tells render.js what
// to draw each frame.

import { ESCAPE_DISTANCE, FARMER, GROUND_Y, SCORE, STAGES, TURKEY } from './config.js';
import { Turkey } from './turkey.js';
import { Farmer } from './farmer.js';
import { World, stageAt, stageIndexAt } from './world.js';
import { makeRng } from './rng.js';
import {
  drawBackground,
  drawDangerVignette,
  drawEnd,
  drawFarmer,
  drawFlame,
  drawHud,
  drawKnife,
  drawObstacle,
  drawPaused,
  drawPickup,
  drawTitle,
  drawTurkey,
} from './render.js';

export const BEST_KEY = 'turkey-run-best-score';

export function loadBest() {
  try {
    return Number.parseInt(localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(score) {
  try {
    localStorage.setItem(BEST_KEY, String(score));
  } catch {
    // Private mode or a host that blocks storage: the score still shows.
  }
}

export class Game {
  constructor(canvas, sounds, seed) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sounds = sounds;
    this.seed = seed;
    this.rng = makeRng(seed);
    this.turkey = new Turkey();
    this.farmer = new Farmer();
    this.world = new World(this.rng);
    this.state = 'title'; // title | playing | paused | caught | escaped
    this.score = 0;
    this.cornEaten = 0;
    this.lives = 3;
    this.maxLives = 3;
    this.time = 0;
    this.scrollPx = 0;
    this.speed = TURKEY.runSpeed;
    this.best = loadBest();
    this.result = null;
    this.hint = '';
    this.hintAlpha = 0;
    this.hintTimer = 0;
    this.stageIdx = 0;
    this.lastStageBonus = 0;
    this.alarmTimer = 0;
    this.paused = false;
    this.onStateChange = null; // (state) => void, wired by main.js for buttons
  }

  setState(state) {
    this.state = state;
    if (this.onStateChange) this.onStateChange(state);
  }

  startRun() {
    this.rng = makeRng(this.seed);
    this.turkey.reset();
    this.farmer.reset();
    this.world = new World(this.rng);
    this.score = 0;
    this.cornEaten = 0;
    this.lives = this.maxLives;
    this.time = 0;
    this.scrollPx = 0;
    this.speed = TURKEY.runSpeed;
    this.result = null;
    this.stageIdx = 0;
    this.lastStageBonus = 0;
    this.showHint(STAGES[0].hint);
    this.sounds.gobble();
    this.sounds.startMusic();
    this.setState('playing');
  }

  showHint(text) {
    this.hint = text;
    this.hintAlpha = 1;
    this.hintTimer = 3.2;
  }

  togglePause() {
    if (this.state === 'playing') {
      this.setState('paused');
      this.sounds.stopMusic();
    } else if (this.state === 'paused') {
      this.setState('playing');
      this.sounds.startMusic();
    }
  }

  endRun(result) {
    this.result = result;
    if (this.score > this.best) {
      this.best = this.score;
      saveBest(this.score);
    }
    this.sounds.stopMusic();
    if (result === 'escaped') this.sounds.escaped();
    else this.sounds.caught();
    this.setState(result);
  }

  update(dt, input) {
    this.time += dt;

    if (this.state === 'title' || this.state === 'caught' || this.state === 'escaped') {
      // The title screen idles with a slow pan; the end screens freeze.
      if (this.state === 'title') this.scrollPx += 24 * dt;
      return;
    }
    if (this.state === 'paused') return;

    // Difficulty: the run speeds up a little with distance.
    const dist = this.world.distanceMetres;
    this.speed = TURKEY.runSpeed + Math.min(120, dist * 0.08);
    if (this.world.isInMud(this.turkey.bounds)) this.speed *= 0.62;
    if (this.turkey.dashing) this.speed = TURKEY.dashSpeed;

    const stage = stageAt(dist);
    const idx = stageIndexAt(dist);
    if (idx !== this.stageIdx) {
      this.stageIdx = idx;
      this.score += SCORE.stageBonus;
      this.showHint(`${stage.name} — ${stage.hint}`);
      this.sounds.goldenCorn();
    }
    if (this.hintTimer > 0) {
      this.hintTimer -= dt;
      this.hintAlpha = Math.max(0, Math.min(1, this.hintTimer));
    }

    this.turkey.update(dt, input, this.sounds, this.speed);
    this.farmer.update(dt, this.speed, this.sounds, (x, y) => this.world.throwKnife(x, y));
    this.world.update(dt, this.speed, stage, this.sounds);
    this.scrollPx += this.speed * dt;

    // Farmer alarm when he is breathing down the turkey's neck.
    this.alarmTimer -= dt;
    if (this.farmer.closeness > 0.78 && this.alarmTimer <= 0) {
      this.alarmTimer = 1.4;
      this.sounds.farmerClose();
    }

    // Score ticks up with distance.
    this.score += SCORE.perMetre * (this.speed * dt) / 50;

    // Collisions: hits cost a heart and let the farmer close in.
    const outcome = this.world.resolveCollisions(this.turkey.bounds);
    this.score += outcome.score;
    for (const pickup of outcome.pickups) {
      this.cornEaten += pickup.kind === 'corn' || pickup.kind === 'golden' ? 1 : 0;
      if (pickup.kind === 'pie') {
        this.turkey.shielded = true;
        this.sounds.goldenCorn();
      } else if (pickup.kind === 'golden') {
        this.sounds.goldenCorn();
        this.turkey.tryDash(this.sounds);
      } else {
        this.sounds.corn();
      }
    }
    if (outcome.hits.length > 0) {
      const hurt = this.turkey.takeHit(this.sounds);
      if (hurt) {
        this.lives -= 1;
        this.farmer.onTurkeyStumble();
        if (this.lives <= 0 || this.farmer.gap <= 0) {
          this.endRun('caught');
          return;
        }
      }
    }
    // The farmer catching up is its own game over, even with hearts left.
    if (this.farmer.gap <= 0) {
      this.endRun('caught');
      return;
    }
    // Dash away cleanly and Jed loses the trail for a moment — once per dash.
    if (this.turkey.dashing && !this._dashHandled) {
      this._dashHandled = true;
      this.farmer.onTurkeyDash();
    }
    if (!this.turkey.dashing) this._dashHandled = false;

    // Freedom!
    if (dist >= ESCAPE_DISTANCE) {
      this.score += 1000;
      this.endRun('escaped');
    }
  }

  render() {
    const ctx = this.ctx;
    // The backdrop follows the run's stage even on the end screens, so the
    // escape finishes in the Freedom Woods, not back in the farmyard.
    const inRun = this.state === 'playing' || this.state === 'paused'
      || this.state === 'caught' || this.state === 'escaped';
    const playStage = inRun ? stageAt(this.world.distanceMetres) : stageAt(0);
    drawBackground(ctx, playStage, this.scrollPx, this.time);

    if (this.state === 'title') {
      // Title text first (it dims the scene), then the hero turkey and Jed
      // on top, so the cover shows them bright. (DOM start button: centre.)
      drawTitle(ctx, this.best);
      const idle = new Turkey();
      idle.x = 180;
      idle.y = GROUND_Y - TURKEY.height;
      idle.runCycle = Math.sin(this.time * 2) * 2;
      drawTurkey(ctx, idle, this.time);
      const jed = new Farmer();
      jed.gap = 180 - 86 - 1010; // places him at x = 1010
      jed.runCycle = this.time * 6;
      drawFarmer(ctx, jed, this.time);
      return;
    }

    // World entities, back to front.
    for (const p of this.world.pickups) drawPickup(ctx, p);
    for (const o of this.world.obstacles) drawObstacle(ctx, o, this.time);
    for (const f of this.world.flames) drawFlame(ctx, f);
    for (const k of this.world.knives) drawKnife(ctx, k);
    drawTurkey(ctx, this.turkey, this.time);
    drawFarmer(ctx, this.farmer, this.time);

    if (this.state === 'playing' || this.state === 'paused') {
      drawHud(ctx, {
        score: Math.floor(this.score),
        distance: this.world.distanceMetres,
        lives: this.lives,
        maxLives: this.maxLives,
        stage: stageAt(this.world.distanceMetres),
        gapRatio: this.farmer.gap / (FARMER.startGap + 60),
        shielded: this.turkey.shielded,
        dashReady: this.turkey.dashCooldown <= 0,
        hint: this.hint,
        hintAlpha: this.hintAlpha,
      });
      drawDangerVignette(ctx, this.farmer.closeness);
    }
    if (this.state === 'paused') drawPaused(ctx);
    if (this.state === 'caught' || this.state === 'escaped') {
      drawEnd(ctx, this.result, {
        score: Math.floor(this.score),
        distance: this.world.distanceMetres,
        corn: this.cornEaten,
        stage: stageAt(this.world.distanceMetres).name,
        best: this.best,
      });
    }
  }

  // One frame: advance the simulation, draw it, clear the edge flags.
  frame(dt, input) {
    if (input.mutePressed) {
      const muted = this.sounds.toggleMute();
      void muted;
    }
    if (input.restartPressed && (this.state === 'caught' || this.state === 'escaped')) {
      this.startRun();
    }
    if ((input.pausePressed || (input.anyPressed && this.state === 'paused')) &&
        (this.state === 'playing' || this.state === 'paused')) {
      this.togglePause();
    }
    this.update(dt, input);
    this.render();
    input.endFrame();
  }
}
