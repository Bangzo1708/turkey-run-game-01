// render.js — every pixel of Turkey Run is drawn here, by hand, on canvas:
// the turkey, Farmer Jed, the farmyard, the barn, the kitchen, the HUD and
// the menus. No image files, no fonts from the network — just shapes.

import { GROUND_Y, PALETTE, VIEW } from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// ---------------------------------------------------------------- turkey
export function drawTurkey(ctx, t, time) {
  const b = t.bounds;
  const blink = t.invulnerableTimer > 0 && Math.floor(time * 14) % 2 === 0;
  if (blink) ctx.globalAlpha = 0.35;
  const runBob = t.grounded && !t.sliding ? Math.sin(t.runCycle) * 3 : 0;
  const cx = t.x + t.width / 2;
  const cy = t.y + t.height + runBob;

  // Tail feathers, fanned behind.
  const feathers = PALETTE.tailFeather;
  for (let i = 0; i < 5; i++) {
    const ang = -0.9 + i * 0.45;
    const fx = cx - 26 + Math.cos(ang) * 4;
    const fy = cy - 26 + Math.sin(ang) * 26;
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(ang + Math.PI / 2);
    ctx.fillStyle = feathers[i];
    ctx.beginPath();
    ctx.ellipse(0, -16, 9, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (t.sliding) {
    // Low slide: body flat, beak first.
    ctx.fillStyle = PALETTE.turkeyBody;
    ellipse(ctx, cx, cy - 14, 34, 15);
    ctx.fillStyle = PALETTE.turkeyHead;
    ellipse(ctx, cx + 30, cy - 18, 13, 12);
    ctx.fillStyle = PALETTE.turkeyBeak;
    ctx.beginPath();
    ctx.moveTo(cx + 40, cy - 20);
    ctx.lineTo(cx + 54, cy - 15);
    ctx.lineTo(cx + 40, cy - 11);
    ctx.closePath();
    ctx.fill();
  } else {
    // Body.
    ctx.fillStyle = PALETTE.turkeyBody;
    ellipse(ctx, cx, cy - 26, 30, 26);
    // Wing, flapping with the run cycle.
    const flap = Math.sin(t.runCycle) * 6;
    ctx.fillStyle = PALETTE.turkeyWing;
    ctx.beginPath();
    ctx.ellipse(cx - 6, cy - 26 + flap * 0.4, 18, 12, -0.4 + flap * 0.02, 0, Math.PI * 2);
    ctx.fill();
    // Legs, alternating while running.
    const legSwing = t.grounded ? Math.sin(t.runCycle) * 8 : 4;
    ctx.strokeStyle = '#f2a93b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 4);
    ctx.lineTo(cx - 8 + legSwing, cy + 2);
    ctx.moveTo(cx + 8, cy - 4);
    ctx.lineTo(cx + 8 - legSwing, cy + 2);
    ctx.stroke();
    // Head.
    ctx.fillStyle = PALETTE.turkeyHead;
    ellipse(ctx, cx + 24, cy - 52, 14, 13);
    // Beak + wattle.
    ctx.fillStyle = PALETTE.turkeyBeak;
    ctx.beginPath();
    ctx.moveTo(cx + 34, cy - 55);
    ctx.lineTo(cx + 48, cy - 50);
    ctx.lineTo(cx + 34, cy - 45);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.turkeyWattle;
    ellipse(ctx, cx + 30, cy - 42, 4, 7);
    // Eye, wide with panic.
    ctx.fillStyle = '#fff';
    ellipse(ctx, cx + 28, cy - 56, 4.5, 5);
    ctx.fillStyle = '#222';
    ellipse(ctx, cx + 30, cy - 56, 2.2, 2.6);
    // Shield ring when the pie protects him.
    if (t.shielded) {
      ctx.strokeStyle = 'rgba(255, 217, 74, 0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy - 28, 46, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------- farmer
export function drawFarmer(ctx, f, time) {
  const bob = Math.abs(Math.sin(f.runCycle)) * 4;
  const x = f.x;
  const y = f.y - bob;
  const searching = f.mood === 'searching';
  const throwing = f.throwAnim > 0;

  // Legs pumping.
  const swing = Math.sin(f.runCycle) * 12;
  ctx.strokeStyle = '#2e2e2e';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(x + 30, y + 78);
  ctx.lineTo(x + 30 + swing, y + 112);
  ctx.moveTo(x + 52, y + 78);
  ctx.lineTo(x + 52 - swing, y + 112);
  ctx.stroke();

  // Overalls + shirt.
  ctx.fillStyle = PALETTE.farmerOveralls;
  roundRect(ctx, x + 18, y + 46, 48, 38, 8);
  ctx.fill();
  ctx.fillStyle = PALETTE.farmerShirt;
  roundRect(ctx, x + 14, y + 34, 56, 22, 8);
  ctx.fill();
  // Raised arm when throwing, otherwise pumping.
  const armUp = throwing ? -50 : Math.sin(f.runCycle) * 10;
  ctx.strokeStyle = PALETTE.farmerShirt;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(x + 62, y + 40);
  ctx.lineTo(x + 78, y + 40 + armUp);
  ctx.stroke();

  // Head, red with effort, moustache bristling.
  ctx.fillStyle = PALETTE.farmerSkin;
  ellipse(ctx, x + 42, y + 20, 17, 16);
  ctx.fillStyle = '#7a4a21';
  ctx.beginPath();
  ctx.ellipse(x + 42, y + 28, 12, 4, 0, 0, Math.PI);
  ctx.fill();
  // Angry eyes.
  ctx.fillStyle = '#222';
  ellipse(ctx, x + 48, y + 16, 2.5, 3);
  ellipse(ctx, x + 58, y + 16, 2.5, 3);
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 44, y + 10);
  ctx.lineTo(x + 52, y + 13);
  ctx.moveTo(x + 62, y + 10);
  ctx.lineTo(x + 54, y + 13);
  ctx.stroke();
  // Straw hat.
  ctx.fillStyle = PALETTE.farmerHat;
  ctx.beginPath();
  ctx.ellipse(x + 42, y + 6, 26, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  roundRect(ctx, x + 28, y - 8, 28, 14, 6);
  ctx.fill();

  // Searching: a "?" above his head. Chasing: a "!" when he is close.
  if (searching) text(ctx, '?', x + 42, y - 34, 30, '#fff3d6');
  else if (f.closeness > 0.75) text(ctx, '!', x + 42, y - 34, 34, '#ff5a3c');
  void time;
}

// ---------------------------------------------------------------- obstacles
export function drawObstacle(ctx, o, time) {
  switch (o.kind) {
    case 'fence': {
      ctx.fillStyle = '#a8763e';
      ctx.fillRect(o.x, o.y + 8, o.w, 12);
      ctx.fillRect(o.x, o.y + 34, o.w, 12);
      ctx.fillStyle = '#8a5a2e';
      ctx.fillRect(o.x + 4, o.y, 8, o.h);
      ctx.fillRect(o.x + o.w - 12, o.y, 8, o.h);
      break;
    }
    case 'hay': {
      ctx.fillStyle = '#e8c96a';
      ctx.beginPath();
      ctx.ellipse(o.x + o.w / 2, o.y + o.h, o.w / 2, o.h, 0, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = '#c9a13b';
      ctx.lineWidth = 3;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(o.x + 14 + i * 24, o.y + o.h - 8);
        ctx.lineTo(o.x + 20 + i * 24, o.y + 12);
        ctx.stroke();
      }
      break;
    }
    case 'crate': {
      ctx.fillStyle = '#b07a3e';
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.strokeStyle = '#7a4a21';
      ctx.lineWidth = 4;
      ctx.strokeRect(o.x + 2, o.y + 2, o.w - 4, o.h - 4);
      ctx.beginPath();
      ctx.moveTo(o.x, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.moveTo(o.x + o.w, o.y);
      ctx.lineTo(o.x, o.y + o.h);
      ctx.stroke();
      text(ctx, 'CORN', o.x + o.w / 2, o.y + o.h / 2, 15, '#fff3d6');
      break;
    }
    case 'beam': {
      ctx.fillStyle = '#6e4522';
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.fillStyle = '#8a5a2e';
      ctx.fillRect(o.x, o.y + o.h - 6, o.w, 6);
      text(ctx, '▼ SLIDE ▼', o.x + o.w / 2, o.y - 14, 13, '#fff3d6');
      break;
    }
    case 'mud': {
      ctx.fillStyle = '#5a3a1a';
      ctx.beginPath();
      ctx.ellipse(o.x + o.w / 2, o.y + 7, o.w / 2, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7a5230';
      ctx.beginPath();
      ctx.ellipse(o.x + o.w / 2 - 20, o.y + 6, 22, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'pot': {
      ctx.fillStyle = '#3a3a3a';
      roundRect(ctx, o.x, o.y + 10, o.w, o.h - 10, 10);
      ctx.fill();
      ctx.fillStyle = '#ff7a1a';
      ctx.beginPath();
      ctx.ellipse(o.x + o.w / 2, o.y + 12, o.w / 2 - 6, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'oven': {
      // The dreaded Thanksgiving oven, door glowing, ready for a turkey.
      ctx.fillStyle = PALETTE.ovenBody;
      roundRect(ctx, o.x, o.y, o.w, o.h, 8);
      ctx.fill();
      const flicker = 0.7 + 0.3 * Math.sin(time * 9 + o.x);
      ctx.fillStyle = `rgba(255, 122, 26, ${flicker})`;
      roundRect(ctx, o.x + 14, o.y + 16, o.w - 28, 44, 6);
      ctx.fill();
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(o.x + 14, o.y + 68, o.w - 28, 6);
      text(ctx, 'OVEN', o.x + o.w / 2, o.y + 86, 13, '#fff3d6');
      break;
    }
    default:
      break;
  }
}

export function drawFlame(ctx, f) {
  const flare = 0.5 + 0.5 * Math.sin(f.timer * 5);
  if (flare <= 0.55) return;
  const h = f.h * flare;
  ctx.fillStyle = 'rgba(255, 122, 26, 0.9)';
  ctx.beginPath();
  ctx.moveTo(f.x, f.y + f.h);
  ctx.quadraticCurveTo(f.x + f.w * 0.3, f.y + f.h - h, f.x + f.w * 0.5, f.y + f.h - h - 14);
  ctx.quadraticCurveTo(f.x + f.w * 0.7, f.y + f.h - h, f.x + f.w, f.y + f.h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 220, 80, 0.9)';
  ctx.beginPath();
  ctx.ellipse(f.x + f.w / 2, f.y + f.h - h * 0.4, f.w * 0.22, h * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function drawKnife(ctx, k) {
  ctx.save();
  ctx.translate(k.x, k.y);
  ctx.rotate(k.angle);
  ctx.fillStyle = PALETTE.knifeBlade;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(10, 4);
  ctx.lineTo(0, 10);
  ctx.lineTo(-10, 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.knifeHandle;
  ctx.fillRect(-4, 10, 8, 14);
  ctx.restore();
}

export function drawPickup(ctx, p) {
  const bobY = Math.sin(p.bob) * 4;
  if (p.kind === 'corn') {
    ctx.fillStyle = PALETTE.cornYellow;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + bobY, 10, 16, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d9a92e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x - 5, p.y - 8 + bobY);
    ctx.lineTo(p.x - 5, p.y + 8 + bobY);
    ctx.moveTo(p.x + 5, p.y - 8 + bobY);
    ctx.lineTo(p.x + 5, p.y + 8 + bobY);
    ctx.stroke();
    ctx.fillStyle = PALETTE.cornGreen;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y + 14 + bobY);
    ctx.lineTo(p.x - 8, p.y + 24 + bobY);
    ctx.lineTo(p.x + 8, p.y + 24 + bobY);
    ctx.closePath();
    ctx.fill();
  } else if (p.kind === 'golden') {
    ctx.save();
    ctx.shadowColor = '#ffd94a';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#ffe98a';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + bobY, 13, 20, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    text(ctx, '★', p.x, p.y + bobY, 16, '#b8860b');
  } else {
    // Pumpkin pie slice: the shield pickup.
    ctx.fillStyle = '#e8862e';
    ctx.beginPath();
    ctx.moveTo(p.x - 16, p.y + 8 + bobY);
    ctx.lineTo(p.x + 16, p.y + 8 + bobY);
    ctx.lineTo(p.x, p.y - 14 + bobY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f7c873';
    ctx.fillRect(p.x - 16, p.y + 8 + bobY, 32, 6);
    text(ctx, 'PIE', p.x, p.y - 22 + bobY, 11, '#fff3d6');
  }
}

// ---------------------------------------------------------------- background
export function drawBackground(ctx, stage, scrollPx, time) {
  const [top, bottom] = stage.sky;
  const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW.width, GROUND_Y);

  // Sun, low and autumn-gold.
  ctx.fillStyle = 'rgba(255, 240, 180, 0.95)';
  ellipse(ctx, 1080, 110, 52, 52);
  ctx.fillStyle = 'rgba(255, 240, 180, 0.35)';
  ellipse(ctx, 1080, 110, 72, 72);

  // Drifting clouds.
  ctx.fillStyle = 'rgba(255, 250, 235, 0.85)';
  for (let i = 0; i < 4; i++) {
    const cx = ((i * 340 - scrollPx * 0.15) % 1400 + 1400) % 1400 - 60;
    const cy = 70 + i * 38;
    ellipse(ctx, cx, cy, 52, 18);
    ellipse(ctx, cx + 36, cy + 6, 38, 14);
  }

  if (stage.id === 'kitchen') {
    // Kitchen walls, a window and hanging pans behind the run.
    ctx.fillStyle = '#c98a4b';
    ctx.fillRect(0, 0, VIEW.width, GROUND_Y);
    ctx.fillStyle = '#f2d8a0';
    ctx.fillRect(90, 90, 200, 180);
    ctx.strokeStyle = '#8a5a2e';
    ctx.lineWidth = 8;
    ctx.strokeRect(90, 90, 200, 180);
    ctx.beginPath();
    ctx.moveTo(190, 90);
    ctx.lineTo(190, 270);
    ctx.moveTo(90, 180);
    ctx.lineTo(290, 180);
    ctx.stroke();
    ctx.fillStyle = '#3a3a3a';
    for (let i = 0; i < 3; i++) {
      const px = 1020 + i * 78; // kept clear of the centre hint banner
      ellipse(ctx, px, 150, 26, 34);
      ctx.fillRect(px - 3, 110, 6, 14);
    }
    text(ctx, 'THANKSGIVING DAY', 640, 60, 26, '#fff3d6');
  } else if (stage.id === 'barn') {
    ctx.fillStyle = '#7a4a21';
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(i * 170 - (scrollPx * 0.4 % 170), 0, 12, GROUND_Y);
    }
    ctx.fillStyle = 'rgba(255, 220, 140, 0.25)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(420, 0);
    ctx.lineTo(180, GROUND_Y);
    ctx.lineTo(0, GROUND_Y);
    ctx.closePath();
    ctx.fill();
  } else {
    // Rolling hills, a red barn and a fence line in the distance.
    ctx.fillStyle = '#6fae4c';
    ctx.beginPath();
    ctx.moveTo(0, 470);
    for (let x = 0; x <= VIEW.width; x += 40) {
      ctx.lineTo(x, 470 + Math.sin((x + scrollPx * 0.3) * 0.008) * 26);
    }
    ctx.lineTo(VIEW.width, GROUND_Y);
    ctx.lineTo(0, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    const barnX = 900 - (scrollPx * 0.25 % 1500);
    ctx.fillStyle = '#b03a2e';
    ctx.fillRect(barnX, 380, 150, 110);
    ctx.fillStyle = '#7a241a';
    ctx.beginPath();
    ctx.moveTo(barnX - 10, 380);
    ctx.lineTo(barnX + 75, 320);
    ctx.lineTo(barnX + 160, 380);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff3d6';
    ctx.fillRect(barnX + 60, 430, 30, 60);
    // Falling leaves.
    ctx.fillStyle = 'rgba(217, 122, 26, 0.8)';
    for (let i = 0; i < 10; i++) {
      const lx = ((i * 173 + time * 30 - scrollPx * 0.5) % 1400 + 1400) % 1400 - 60;
      const ly = 90 + ((i * 97 + time * 45) % 380);
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(time * 2 + i);
      ctx.fillRect(-5, -3, 10, 6);
      ctx.restore();
    }
  }

  // Ground.
  ctx.fillStyle = stage.ground;
  ctx.fillRect(0, GROUND_Y, VIEW.width, VIEW.height - GROUND_Y);
  ctx.fillStyle = stage.grass;
  ctx.fillRect(0, GROUND_Y, VIEW.width, 14);
  // Speed lines on the ground.
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    const gx = ((i * 260 - scrollPx) % 1400 + 1400) % 1400 - 60;
    ctx.beginPath();
    ctx.moveTo(gx, GROUND_Y + 46);
    ctx.lineTo(gx + 60, GROUND_Y + 46);
    ctx.stroke();
  }
  void time;
}

// ---------------------------------------------------------------- HUD
export function drawHud(ctx, hud) {
  const { score, distance, lives, maxLives, stage, gapRatio, shielded, dashReady } = hud;
  ctx.fillStyle = PALETTE.hudPanel;
  roundRect(ctx, 16, 14, 330, 122, 12);
  ctx.fill();

  text(ctx, `SCORE ${score}`, 32, 36, 24, PALETTE.hudText, 'left');
  text(ctx, `${Math.floor(distance)} m  ·  ${stage.name}`, 32, 66, 17, '#ffd98a', 'left');
  // Hearts.
  for (let i = 0; i < maxLives; i++) {
    const hx = 36 + i * 30;
    ctx.fillStyle = i < lives ? '#ff5a6e' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.moveTo(hx, 96);
    ctx.bezierCurveTo(hx - 12, 84, hx - 18, 94, hx, 104);
    ctx.bezierCurveTo(hx + 18, 94, hx + 12, 84, hx, 96);
    ctx.fill();
  }
  // One status line of its own, under the hearts, so it never collides
  // with them or runs past the panel.
  const status = [
    shielded ? '🛡 PIE SHIELD' : '',
    dashReady ? 'DASH READY [SHIFT]' : '',
  ].filter(Boolean).join('  ·  ');
  if (status) text(ctx, status, 32, 122, 14, shielded ? '#ffe98a' : '#9fe8ff', 'left');

  // Escape progress bar across the top.
  const barW = 560;
  const bx = (VIEW.width - barW) / 2;
  ctx.fillStyle = 'rgba(40, 20, 8, 0.72)';
  roundRect(ctx, bx - 8, 14, barW + 16, 30, 10);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, bx, 20, barW, 18, 8);
  ctx.fill();
  ctx.fillStyle = '#7fae4c';
  const filled = Math.min(1, distance / 1500);
  roundRect(ctx, bx, 20, barW * filled, 18, 8);
  ctx.fill();
  text(ctx, 'ESCAPE → 🌲 FREEDOM GATE', bx + barW / 2, 29, 13, '#fff3d6');

  // Farmer gap meter: how close Jed is. Red when he is on your tail.
  const gw = 220;
  const gx = VIEW.width - gw - 24;
  ctx.fillStyle = PALETTE.hudPanel;
  roundRect(ctx, gx - 8, 14, gw + 16, 66, 12);
  ctx.fill();
  text(ctx, 'FARMER JED', gx + gw / 2, 32, 14, '#ffb36b');
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, gx, 44, gw, 14, 7);
  ctx.fill();
  const danger = 1 - gapRatio;
  ctx.fillStyle = danger > 0.7 ? '#ff3b2f' : danger > 0.4 ? '#ff9a1a' : '#7fae4c';
  roundRect(ctx, gx, 44, gw * danger, 14, 7);
  ctx.fill();
  text(ctx, danger > 0.7 ? 'HE IS RIGHT BEHIND YOU!' : 'gap to the farmer', gx + gw / 2, 70, 12, '#fff3d6');

  // Stage hint banner, fading.
  if (hud.hint && hud.hintAlpha > 0) {
    ctx.globalAlpha = hud.hintAlpha;
    ctx.fillStyle = 'rgba(40, 20, 8, 0.75)';
    roundRect(ctx, VIEW.width / 2 - 260, 130, 520, 44, 12);
    ctx.fill();
    text(ctx, hud.hint, VIEW.width / 2, 152, 20, '#fff3d6');
    ctx.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------- screens
export function drawTitle(ctx, best) {
  ctx.fillStyle = 'rgba(60, 30, 5, 0.45)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  text(ctx, '🦃  TURKEY RUN  🦃', VIEW.width / 2, 130, 72, '#fff3d6');
  text(ctx, 'Escape Thanksgiving dinner!', VIEW.width / 2, 196, 30, '#ffd98a');
  text(ctx, 'Farmer Jed wants you in the oven. Run, jump, slide — and do NOT get caught.',
    VIEW.width / 2, 236, 20, '#fff3d6');

  // Feature strip: everything the game has, at a glance.
  const features = [
    ['🏃', 'RUN & JUMP', 'Space / ↑ / Click'],
    ['🛝', 'SLIDE', 'Down / S'],
    ['💨', 'DASH', 'Shift / X'],
    ['🌽', 'CORN +25', 'Golden corn +150'],
    ['🥧', 'PIE SHIELD', 'Eats one hit'],
    ['🔪', 'KNIVES & OVEN', 'Dodge them all'],
  ];
  const fw = 180;
  const gap = 16;
  const total = features.length * fw + (features.length - 1) * gap;
  let fx = (VIEW.width - total) / 2;
  for (const [icon, name, desc] of features) {
    ctx.fillStyle = 'rgba(40, 20, 8, 0.72)';
    roundRect(ctx, fx, 290, fw, 110, 12);
    ctx.fill();
    text(ctx, icon, fx + fw / 2, 326, 34, '#fff3d6');
    text(ctx, name, fx + fw / 2, 360, 16, '#ffd98a');
    text(ctx, desc, fx + fw / 2, 384, 13, '#fff3d6');
    fx += fw + gap;
  }

  text(ctx, 'Farmyard → Barn → Kitchen → Freedom Gate (1500 m)',
    VIEW.width / 2, 440, 20, '#fff3d6');
  text(ctx, '3 hearts. Stumble and Jed closes in — if he touches you, dinner is served.',
    VIEW.width / 2, 472, 18, '#ffd98a');
  if (best > 0) text(ctx, `BEST SCORE: ${best}`, VIEW.width / 2, 512, 22, '#ffe98a');

  text(ctx, 'Click START RUNNING below, or press SPACE  ·  M mutes sound',
    VIEW.width / 2, 640, 15, '#fff3d6');
}

export function drawEnd(ctx, result, stats) {
  const won = result === 'escaped';
  ctx.fillStyle = won ? 'rgba(30, 80, 30, 0.55)' : 'rgba(80, 20, 5, 0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  text(ctx, won ? '🎉  YOU ESCAPED!  🎉' : '😱  CAUGHT!  😱', VIEW.width / 2, 170, 64,
    won ? '#b8ff9e' : '#ffb36b');
  text(ctx,
    won
      ? 'Tom the turkey made it to the Freedom Woods. No oven today!'
      : 'Farmer Jed got you... dinner is served. Gobble gobble, rest in peas.',
    VIEW.width / 2, 240, 22, '#fff3d6');

  ctx.fillStyle = 'rgba(40, 20, 8, 0.72)';
  roundRect(ctx, VIEW.width / 2 - 250, 290, 500, 150, 14);
  ctx.fill();
  text(ctx, `SCORE  ${stats.score}`, VIEW.width / 2, 330, 30, '#fff3d6');
  text(ctx, `Distance  ${Math.floor(stats.distance)} m   ·   Corn  ${stats.corn}`,
    VIEW.width / 2, 372, 20, '#ffd98a');
  text(ctx, `Stage reached: ${stats.stage}   ·   Best: ${stats.best}`,
    VIEW.width / 2, 406, 18, '#fff3d6');

  text(ctx, 'Click RUN AGAIN below, or press R.',
    VIEW.width / 2, 640, 16, '#fff3d6');
  text(ctx, 'Tip: golden corn gives a dash boost — grab it before the kitchen!',
    VIEW.width / 2, 672, 16, '#fff3d6');
}

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(20, 10, 4, 0.5)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  text(ctx, 'PAUSED', VIEW.width / 2, VIEW.height / 2 - 10, 56, '#fff3d6');
  text(ctx, 'Press P or click to resume', VIEW.width / 2, VIEW.height / 2 + 44, 20, '#ffd98a');
}

// Red pulsing edge when the farmer is about to catch the turkey.
export function drawDangerVignette(ctx, closeness) {
  if (closeness < 0.6) return;
  const a = (closeness - 0.6) / 0.4 * (0.35 + 0.15 * Math.sin(Date.now() / 120));
  const grad = ctx.createRadialGradient(
    VIEW.width / 2, VIEW.height / 2, VIEW.height * 0.42,
    VIEW.width / 2, VIEW.height / 2, VIEW.height * 0.75,
  );
  grad.addColorStop(0, 'rgba(255, 40, 20, 0)');
  grad.addColorStop(1, `rgba(255, 40, 20, ${a})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
}
