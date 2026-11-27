// config.js — every tunable number and stage of Turkey Run lives here,
// so the rest of the game reads like a recipe, not a pile of magic numbers.

export const VIEW = { width: 1280, height: 720 };

export const GROUND_Y = 620; // top edge of the ground line, in canvas pixels

export const TURKEY = {
  x: 300, // fixed screen position; the world scrolls past instead
  width: 74,
  height: 62,
  runSpeed: 430, // world scroll speed, px per second
  jumpVelocity: -920,
  gravity: 2600,
  doubleJumpVelocity: -760,
  slideTime: 0.55, // seconds a slide lasts
  slideHeight: 34,
  dashTime: 0.28,
  dashSpeed: 900,
  dashCooldown: 2.2,
  stumbleTime: 0.45, // brief loss of control after a hit
};

export const FARMER = {
  width: 86,
  height: 118,
  // How far behind the turkey the farmer starts, in world distance.
  startGap: 210,
  // The farmer closes in by this much (world px) every time the turkey stumbles.
  stumbleGain: 70,
  // Slowly drifts back when the turkey runs clean, so a perfect run escapes.
  driftBack: 14, // px per second
  // He throws a carving knife whenever the gap is under this value.
  throwRange: 220,
  throwCooldown: 4.5,
};

// Distance (in metres) where each stage of the escape begins.
export const STAGES = [
  {
    id: 'farmyard',
    name: 'FARMYARD',
    start: 0,
    sky: ['#ffd98a', '#ffb36b'],
    ground: '#8a5a2e',
    grass: '#7fae4c',
    hint: 'Run! Farmer Jed is right behind you!',
  },
  {
    id: 'barn',
    name: 'THE BARN',
    start: 420,
    sky: ['#e8a06a', '#c97e4e'],
    ground: '#6e4522',
    grass: '#8a7a3a',
    hint: 'Through the barn — watch the crates!',
  },
  {
    id: 'kitchen',
    name: 'THE KITCHEN',
    start: 900,
    sky: ['#f2c14e', '#d98a3d'],
    ground: '#5d3a24',
    grass: '#a8542e',
    hint: 'The oven is on! Dodge the knives!',
  },
  {
    id: 'forest',
    name: 'FREEDOM WOODS',
    start: 1350,
    sky: ['#a8d8a0', '#6fae6a'],
    ground: '#4e6e2e',
    grass: '#4e8a3a',
    hint: 'Almost free — reach the gate!',
  },
];

// Total escape distance. Reaching it wins the game.
export const ESCAPE_DISTANCE = 1500; // metres

export const DIFFICULTY = {
  baseSpawnGap: 460, // px between obstacle groups at the start
  minSpawnGap: 320, // tightest spacing late in the run: still wider than
  // one jump's travel, so two jumps in a row stay possible
  obstacleChance: 0.62,
  cornChance: 0.55,
  knifeRainChance: 0.0, // knives start falling in the kitchen stage
  knifeRainChanceKitchen: 0.35,
};

export const SCORE = {
  perMetre: 10,
  corn: 25,
  goldenCorn: 150,
  pie: 0, // pie gives a shield, not points
  stageBonus: 500,
};

export const PALETTE = {
  turkeyBody: '#8a5a2b',
  turkeyWing: '#6e4520',
  turkeyHead: '#c98a4b',
  turkeyWattle: '#d43d2a',
  turkeyBeak: '#f2a93b',
  tailFeather: ['#b5651d', '#d43d2a', '#f2a93b', '#7fae4c', '#8a5a2b'],
  farmerShirt: '#4a6fa5',
  farmerOveralls: '#3a5a8a',
  farmerHat: '#e8c96a',
  farmerSkin: '#e8b88a',
  ovenBody: '#3a3a3a',
  ovenGlow: '#ff7a1a',
  knifeBlade: '#d8dde2',
  knifeHandle: '#5a2e1a',
  cornYellow: '#ffd94a',
  cornGreen: '#6fae4c',
  hudPanel: 'rgba(40, 20, 8, 0.72)',
  hudText: '#fff3d6',
};
