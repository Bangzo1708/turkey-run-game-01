// turkey.js — the player: a plump Thanksgiving turkey called Tom.
// Runs in place on screen while the world scrolls; jumping, sliding and
// dashing are the only moves, and every hit makes him stumble.

import { GROUND_Y, TURKEY } from './config.js';

export class Turkey {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = TURKEY.x;
    this.y = GROUND_Y - TURKEY.height;
    this.vy = 0;
    this.width = TURKEY.width;
    this.height = TURKEY.height;
    this.grounded = true;
    this.jumpsUsed = 0; // 0 on the ground, 1 after the first jump: double jump
    this.sliding = false;
    this.slideTimer = 0;
    this.dashing = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.stumbleTimer = 0;
    this.invulnerableTimer = 0; // brief grace after a hit
    this.shielded = false; // pie shield eats one hit
    this.runCycle = 0; // drives the leg-flap animation
    this.facing = 1;
  }

  get bounds() {
    // Forgiving hitbox: 6 px off the feet and 4 px off each side, so a
    // jump that grazes a crate's top corner still counts as cleared.
    const h = this.sliding ? TURKEY.slideHeight : TURKEY.height;
    return {
      x: this.x + 12,
      y: this.y + (TURKEY.height - h) + 4,
      w: this.width - 24,
      h: h - 6,
    };
  }

  get isAirborne() {
    return !this.grounded;
  }

  tryJump(sounds) {
    if (this.stumbleTimer > 0) return;
    if (this.grounded) {
      this.vy = TURKEY.jumpVelocity;
      this.grounded = false;
      this.jumpsUsed = 1;
      this.sliding = false;
      sounds.jump();
    } else if (this.jumpsUsed < 2) {
      // A second, smaller flap mid-air: the double jump.
      this.vy = TURKEY.doubleJumpVelocity;
      this.jumpsUsed = 2;
      sounds.jump();
    }
  }

  trySlide(sounds) {
    if (this.stumbleTimer > 0 || !this.grounded) return;
    if (!this.sliding) {
      this.sliding = true;
      this.slideTimer = TURKEY.slideTime;
      sounds.slide();
    }
  }

  tryDash(sounds) {
    if (this.stumbleTimer > 0 || this.dashCooldown > 0) return;
    this.dashing = true;
    this.dashTimer = TURKEY.dashTime;
    this.dashCooldown = TURKEY.dashCooldown;
    sounds.dash();
  }

  // Returns true if the hit actually hurt (not shielded, not invulnerable).
  takeHit(sounds) {
    if (this.invulnerableTimer > 0) return false;
    if (this.shielded) {
      this.shielded = false;
      this.invulnerableTimer = 1.0;
      sounds.thud();
      return false;
    }
    this.stumbleTimer = TURKEY.stumbleTime;
    this.invulnerableTimer = 1.5;
    this.sliding = false;
    sounds.thud();
    return true;
  }

  update(dt, input, sounds, speed) {
    this.runCycle += dt * (this.grounded ? 11 : 4);
    if (this.stumbleTimer > 0) this.stumbleTimer -= dt;
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
    if (this.dashCooldown > 0) this.dashCooldown -= dt;

    if (input.jumpPressed) this.tryJump(sounds);
    if (input.slideHeld) this.trySlide(sounds);
    if (input.dashPressed) this.tryDash(sounds);

    if (this.sliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0 || !this.grounded) this.sliding = false;
    }
    if (this.dashing) {
      this.dashTimer -= dt;
      if (this.dashTimer <= 0) this.dashing = false;
    }

    // Gravity and landing. A held jump button gives a slightly higher hop.
    this.vy += TURKEY.gravity * dt;
    if (this.vy < 0 && !input.jumpHeld && this.jumpsUsed === 1) {
      this.vy += TURKEY.gravity * 0.9 * dt; // short hop when tapped
    }
    this.y += this.vy * dt;
    const floor = GROUND_Y - TURKEY.height;
    if (this.y >= floor) {
      this.y = floor;
      this.vy = 0;
      this.grounded = true;
      this.jumpsUsed = 0;
    } else {
      this.grounded = false;
    }
    void speed;
  }
}
