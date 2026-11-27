// farmer.js — Farmer Jed, the chaser. He never stops: he runs behind the
// turkey, closes in whenever it stumbles, drifts back when it runs clean,
// and throws a carving knife when he gets close enough. His mood (chasing,
// searching, throwing) is what the player reads on screen.

import { FARMER, GROUND_Y, TURKEY } from './config.js';

export class Farmer {
  constructor() {
    this.reset();
  }

  reset() {
    this.gap = FARMER.startGap; // world px behind the turkey
    this.throwTimer = 1.5;
    this.runCycle = 0;
    this.mood = 'chasing'; // chasing | searching | throwing | celebrating
    this.moodTimer = 0;
    this.throwAnim = 0;
    this.searchTimer = 0;
  }

  get x() {
    return TURKEY.x - FARMER.width - this.gap;
  }

  get y() {
    return GROUND_Y - FARMER.height;
  }

  get bounds() {
    return { x: this.x + 10, y: this.y + 6, w: FARMER.width - 20, h: FARMER.height - 6 };
  }

  // Called when the turkey stumbles: Jed lunges forward with a shout.
  onTurkeyStumble() {
    this.gap = Math.max(0, this.gap - FARMER.stumbleGain);
    this.mood = 'chasing';
    this.moodTimer = 0.6;
  }

  // The turkey dashed away cleanly: Jed falls back, confused, and looks
  // around for a moment before resuming the chase.
  onTurkeyDash() {
    this.gap = Math.min(420, this.gap + 70);
    if (this.gap > 300) {
      this.mood = 'searching';
      this.searchTimer = 1.1;
    }
  }

  update(dt, speed, sounds, onThrowKnife) {
    this.runCycle += dt * 12;
    if (this.throwAnim > 0) this.throwAnim -= dt;
    if (this.moodTimer > 0) this.moodTimer -= dt;

    // A clean run slowly opens the gap again — but never beyond the start,
    // and never back from zero: once he touches the turkey, it is over.
    if (this.mood === 'chasing' && this.gap > 0) {
      this.gap = Math.min(FARMER.startGap + 60, this.gap + FARMER.driftBack * dt);
    }
    if (this.mood === 'searching') {
      this.searchTimer -= dt;
      this.gap = Math.min(FARMER.startGap + 60, this.gap + 40 * dt);
      if (this.searchTimer <= 0) this.mood = 'chasing';
    }

    // Close enough? Wind up and hurl a carving knife at the turkey.
    this.throwTimer -= dt;
    if (this.throwTimer <= 0 && this.gap < FARMER.throwRange && this.mood !== 'searching') {
      this.throwTimer = FARMER.throwCooldown;
      this.throwAnim = 0.5;
      this.mood = 'throwing';
      this.moodTimer = 0.5;
      sounds.knifeWhizz();
      onThrowKnife(this.x + FARMER.width - 10, this.y + 78);
    }
    if (this.mood === 'throwing' && this.moodTimer <= 0) this.mood = 'chasing';
    void speed;
  }

  // How close is he, 0 = caught, 1 = far behind. Drives the HUD bar and
  // the warning vignette.
  get closeness() {
    return 1 - Math.min(1, this.gap / (FARMER.startGap + 60));
  }
}
