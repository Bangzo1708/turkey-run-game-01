// world.js — the scrolling world: fences, hay bales, crates, ovens, knives,
// corn and pie. Spawns obstacle groups ahead of the turkey, moves them left
// with the scroll, and reports the first thing the turkey touches.

import { DIFFICULTY, GROUND_Y, SCORE, STAGES } from './config.js';

export function stageAt(distanceMetres) {
  let current = STAGES[0];
  for (const stage of STAGES) {
    if (distanceMetres >= stage.start) current = stage;
  }
  return current;
}

export function stageIndexAt(distanceMetres) {
  let idx = 0;
  STAGES.forEach((s, i) => {
    if (distanceMetres >= s.start) idx = i;
  });
  return idx;
}

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export class World {
  constructor(rng) {
    this.rng = rng;
    this.reset();
  }

  reset() {
    this.obstacles = []; // {kind, x, y, w, h, passed}
    this.pickups = []; // {kind: corn|golden|pie, x, y, bob}
    this.knives = []; // {x, y, vy, angle, fromFarmer}
    this.flames = []; // oven flame jets {x, y, w, h, timer}
    this.nextSpawnX = 1400;
    this.distancePx = 0;
    this.spawnedStageBonus = new Set();
  }

  get distanceMetres() {
    return this.distancePx / 50;
  }

  // Spacing tightens and knives start falling as the run goes on.
  _spawnGap(distanceMetres) {
    const t = Math.min(1, distanceMetres / 1500);
    return DIFFICULTY.baseSpawnGap - (DIFFICULTY.baseSpawnGap - DIFFICULTY.minSpawnGap) * t;
  }

  _spawnGroup(x, stage) {
    const r = this.rng;
    const roll = r.next();
    if (stage.id === 'kitchen') {
      if (roll < 0.4) {
        // A hot oven on the floor: jump over it, or time the flame jet.
        this.obstacles.push({ kind: 'oven', x, y: GROUND_Y - 96, w: 110, h: 96, passed: false });
        this.flames.push({ x: x + 18, y: GROUND_Y - 150, w: 74, h: 60, timer: r.next() * 2 });
      } else if (roll < 0.7) {
        this.obstacles.push({ kind: 'pot', x, y: GROUND_Y - 64, w: 90, h: 64, passed: false });
      } else {
        this.obstacles.push({ kind: 'fence', x, y: GROUND_Y - 70, w: 46, h: 70, passed: false });
        this.obstacles.push({ kind: 'fence', x: x + 130, y: GROUND_Y - 70, w: 46, h: 70, passed: false });
      }
    } else if (stage.id === 'barn') {
      if (roll < 0.45) {
        this.obstacles.push({ kind: 'crate', x, y: GROUND_Y - 78, w: 84, h: 78, passed: false });
      } else if (roll < 0.75) {
        // A low beam: slide under it, don't jump into it.
        this.obstacles.push({ kind: 'beam', x, y: GROUND_Y - 150, w: 120, h: 26, passed: false });
      } else {
        this.obstacles.push({ kind: 'hay', x, y: GROUND_Y - 58, w: 110, h: 58, passed: false });
      }
    } else {
      if (roll < 0.4) {
        this.obstacles.push({ kind: 'fence', x, y: GROUND_Y - 70, w: 46, h: 70, passed: false });
      } else if (roll < 0.7) {
        this.obstacles.push({ kind: 'hay', x, y: GROUND_Y - 58, w: 110, h: 58, passed: false });
      } else {
        // A mud puddle: running through it slows the turkey and lets the
        // farmer close in — jump it if you can.
        this.obstacles.push({ kind: 'mud', x, y: GROUND_Y - 14, w: 150, h: 14, passed: false });
      }
    }

    // Corn trails reward a clean line over or under the obstacle.
    if (r.chance(DIFFICULTY.cornChance)) {
      const kind = r.chance(0.12) ? 'golden' : 'corn';
      const high = r.chance(0.5);
      for (let i = 0; i < 3; i++) {
        this.pickups.push({
          kind,
          x: x + 30 + i * 46,
          y: high ? GROUND_Y - 190 : GROUND_Y - 90,
          bob: r.next() * Math.PI * 2,
        });
      }
    }
    if (r.chance(0.08)) {
      // A slice of pumpkin pie: a shield that eats one hit.
      this.pickups.push({ kind: 'pie', x: x + 60, y: GROUND_Y - 120, bob: 0 });
    }
  }

  throwKnife(x, y) {
    this.knives.push({ x, y, vy: -60, vx: 520, angle: 0, spin: 9, fromFarmer: true });
  }

  dropKnife(x) {
    // A knife rains from the kitchen ceiling, spinning.
    this.knives.push({ x, y: -40, vy: 420, vx: 0, angle: 0, spin: 11, fromFarmer: false });
  }

  update(dt, speed, stage, sounds) {
    this.distancePx += speed * dt;
    const dist = this.distanceMetres;

    // Spawn ahead as the world scrolls.
    while (this.nextSpawnX < 1280 + 400) {
      if (this.rng.chance(DIFFICULTY.obstacleChance)) {
        this._spawnGroup(this.nextSpawnX, stage);
      }
      this.nextSpawnX += this._spawnGap(dist);
    }

    // Knives rain from above once the kitchen stage begins.
    if (stage.id === 'kitchen' && this.rng.chance(DIFFICULTY.knifeRainChanceKitchen * dt * 2)) {
      this.dropKnife(700 + this.rng.next() * 500);
      sounds.knifeWhizz();
    }

    const dx = speed * dt;
    for (const o of this.obstacles) o.x -= dx;
    for (const p of this.pickups) {
      p.x -= dx;
      p.bob += dt * 3;
    }
    for (const k of this.knives) {
      k.x += (k.vx ?? 0) * dt;
      k.y += k.vy * dt;
      k.angle += k.spin * dt;
      if (!k.fromFarmer) k.vy += 900 * dt;
    }
    for (const f of this.flames) {
      f.timer += dt;
      f.x -= dx;
    }
    this.nextSpawnX -= dx;

    // Drop anything far behind the screen.
    const keep = (e) => e.x > -260;
    this.obstacles = this.obstacles.filter(keep);
    this.pickups = this.pickups.filter(keep);
    this.knives = this.knives.filter((k) => k.x > -120 && k.y < 760);
    this.flames = this.flames.filter(keep);
  }

  // Score for obstacles cleanly passed, pickups eaten, and hits taken.
  // Returns { score, hits: [obstacle...], pickups: [...] }.
  resolveCollisions(turkeyBounds, inMud) {
    const result = { score: 0, hits: [], pickups: [] };
    for (const o of this.obstacles) {
      if (!o.passed && o.x + o.w < turkeyBounds.x) {
        o.passed = true;
        result.score += 15; // cleared it cleanly
      }
      if (o.kind === 'mud') continue; // mud only slows, it never hurts
      if (overlap(turkeyBounds, o)) result.hits.push(o);
    }
    // Oven flames hurt only while they flare up.
    for (const f of this.flames) {
      const flare = 0.5 + 0.5 * Math.sin(f.timer * 5);
      if (flare > 0.55 && overlap(turkeyBounds, { x: f.x, y: f.y, w: f.w, h: f.h * flare })) {
        result.hits.push({ kind: 'flame', x: f.x, y: f.y, w: f.w, h: f.h });
      }
    }
    for (const k of this.knives) {
      if (overlap(turkeyBounds, { x: k.x - 14, y: k.y - 14, w: 28, h: 28 })) {
        result.hits.push({ kind: 'knife', x: k.x, y: k.y, w: 28, h: 28 });
        k.y = 9999; // spent knife
      }
    }
    for (const p of this.pickups) {
      if (overlap(turkeyBounds, { x: p.x - 18, y: p.y - 18, w: 36, h: 36 })) {
        result.pickups.push(p);
        p.x = -9999;
        result.score += p.kind === 'golden' ? SCORE.goldenCorn : p.kind === 'pie' ? 0 : SCORE.corn;
      }
    }
    this.pickups = this.pickups.filter((p) => p.x > -9990);
    void inMud;
    return result;
  }

  isInMud(turkeyBounds) {
    return this.obstacles.some(
      (o) => o.kind === 'mud' && overlap(turkeyBounds, { x: o.x, y: o.y - 6, w: o.w, h: 20 }),
    );
  }
}
