import { CHARACTERS, ARENA_BOUNDARY, GROUND_Y, MAX_HP, MAX_STAMINA } from "../constants";

const WORLD_W = 20; // visible world width in units
const WORLD_H = 11; // visible world height in units
const FLOOR_Y_RATIO = 0.78; // floor position as ratio of canvas height

export default class Canvas2D {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.fighters = {};
    this.particles = [];
    this.shake = { intensity: 0, decay: 0.9, x: 0, y: 0 };
    this.slowmo = 1;
    this.time = 0;
    this.animFrames = {};

    this._resize();
    this._resizeHandler = () => this._resize();
    window.addEventListener("resize", this._resizeHandler);
  }

  _resize() {
    const parent = this.canvas.parentElement;
    const w = parent?.clientWidth || window.innerWidth;
    const h = parent?.clientHeight || window.innerHeight;
    this.canvas.width = w * window.devicePixelRatio;
    this.canvas.height = h * window.devicePixelRatio;
    this.canvas.style.width = w + "px";
    this.canvas.style.height = h + "px";
    this.W = this.canvas.width;
    this.H = this.canvas.height;
    this.scale = this.W / WORLD_W;
    this.floorY = this.H * FLOOR_Y_RATIO;
  }

  setFighters(id1, char1, id2, char2) {
    this.fighters = {
      [id1]: { charId: char1 },
      [id2]: { charId: char2 },
    };
    this.animFrames[id1] = 0;
    this.animFrames[id2] = 0;
  }

  // Convert world X to canvas X (camera-relative)
  wx(x) {
    return (x - this.camX) * this.scale + this.W / 2 + this.shake.x;
  }

  // Convert world Y to canvas Y (Y=0 is ground, positive = up)
  wy(y) {
    return this.floorY - y * this.scale + this.shake.y;
  }

  // Scale a world distance to pixels
  ws(d) {
    return d * this.scale;
  }

  updateCamera(p1, p2) {
    if (!p1 || !p2) { this.camX = 0; this.camZoom = 1; return; }
    const midX = (p1.x + p2.x) / 2;
    const dist = Math.abs(p1.x - p2.x);
    // Smooth camera
    this.camX = this.camX || 0;
    this.camX += (midX - this.camX) * 0.08;

    // Dynamic zoom based on distance
    const targetZoom = Math.max(0.65, Math.min(1.0, 8 / (dist + 4)));
    this.camZoom = this.camZoom || 1;
    this.camZoom += (targetZoom - this.camZoom) * 0.05;
    this.scale = (this.W / WORLD_W) * this.camZoom;
  }

  updateShake() {
    if (this.shake.intensity > 0.5) {
      this.shake.x = (Math.random() - 0.5) * this.shake.intensity;
      this.shake.y = (Math.random() - 0.5) * this.shake.intensity;
      this.shake.intensity *= this.shake.decay;
    } else {
      this.shake.x = 0;
      this.shake.y = 0;
      this.shake.intensity = 0;
    }
  }

  triggerShake(intensity) {
    this.shake.intensity = Math.max(this.shake.intensity, intensity * this.scale * 0.5);
  }

  setSlowmo(v) { this.slowmo = v; }

  // ─── Particle System ────────────────────────────────
  spawnHitParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: -Math.sin(angle) * speed - 1,
        size: 2 + Math.random() * 4,
        color,
        life: 1,
        decay: 0.02 + Math.random() * 0.02,
        type: "square",
      });
    }
  }

  spawnSpecialEffect(x, y, color) {
    // Ring
    this.particles.push({
      x, y, vx: 0, vy: 0,
      size: 5, color, life: 1, decay: 0.025,
      type: "ring", growSpeed: 3,
    });
    this.spawnHitParticles(x, y, color, 18);
  }

  _updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.type === "square") p.vy += 8 * dt; // gravity
      if (p.growSpeed) p.size += p.growSpeed * dt * 60;
      p.life -= p.decay * dt * 60;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  _drawParticles() {
    const ctx = this.ctx;
    for (const p of this.particles) {
      const px = this.wx(p.x);
      const py = this.wy(p.y);
      ctx.globalAlpha = Math.max(0, p.life);
      if (p.type === "ring") {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, this.ws(p.size * 0.1), 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        const s = this.ws(p.size * 0.02);
        ctx.fillRect(px - s / 2, py - s / 2, s, s);
      }
    }
    ctx.globalAlpha = 1;
  }

  // ─── Arena Drawing ──────────────────────────────────
  _drawArena() {
    const ctx = this.ctx;

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.floorY);
    skyGrad.addColorStop(0, "#060612");
    skyGrad.addColorStop(0.5, "#0c0c24");
    skyGrad.addColorStop(1, "#12122e");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.W, this.floorY);

    // Floor
    const floorGrad = ctx.createLinearGradient(0, this.floorY, 0, this.H);
    floorGrad.addColorStop(0, "#1a1a3a");
    floorGrad.addColorStop(1, "#0a0a1e");
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, this.floorY, this.W, this.H - this.floorY);

    // Floor line
    ctx.strokeStyle = "#ff444488";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.floorY);
    ctx.lineTo(this.W, this.floorY);
    ctx.stroke();

    // Grid lines on floor
    ctx.strokeStyle = "#ffffff08";
    ctx.lineWidth = 1;
    for (let x = -ARENA_BOUNDARY; x <= ARENA_BOUNDARY; x += 1) {
      const px = this.wx(x);
      if (px > -10 && px < this.W + 10) {
        ctx.beginPath();
        ctx.moveTo(px, this.floorY);
        ctx.lineTo(px, this.H);
        ctx.stroke();
      }
    }
    for (let i = 0; i < 5; i++) {
      const py = this.floorY + i * this.ws(0.5);
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(this.W, py);
      ctx.stroke();
    }

    // Arena boundary markers
    [-ARENA_BOUNDARY, ARENA_BOUNDARY].forEach((bx) => {
      const px = this.wx(bx);
      ctx.strokeStyle = "#ff444466";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(px, this.floorY - this.ws(4));
      ctx.lineTo(px, this.floorY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Glow
      const glow = ctx.createRadialGradient(px, this.floorY, 0, px, this.floorY, this.ws(0.5));
      glow.addColorStop(0, "#ff444422");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(px - this.ws(0.5), this.floorY - this.ws(0.5), this.ws(1), this.ws(1));
    });

    // Ambient pillars in background
    ctx.fillStyle = "#0e0e28";
    [[-6, 0.4], [6, 0.4], [-9, 0.3], [9, 0.3]].forEach(([bx, w]) => {
      const px = this.wx(bx);
      const pw = this.ws(w);
      ctx.fillRect(px - pw / 2, this.floorY - this.ws(5), pw, this.ws(5));
      // Pillar top glow
      const tg = ctx.createRadialGradient(px, this.floorY - this.ws(5), 0, px, this.floorY - this.ws(5), this.ws(1));
      tg.addColorStop(0, "#4444aa15");
      tg.addColorStop(1, "transparent");
      ctx.fillStyle = tg;
      ctx.fillRect(px - this.ws(1), this.floorY - this.ws(6), this.ws(2), this.ws(2));
      ctx.fillStyle = "#0e0e28";
    });

    // Center glow on floor
    const cg = ctx.createRadialGradient(this.wx(0), this.floorY, 0, this.wx(0), this.floorY, this.ws(3));
    cg.addColorStop(0, `rgba(255,68,68,${0.04 + Math.sin(this.time * 2) * 0.02})`);
    cg.addColorStop(1, "transparent");
    ctx.fillStyle = cg;
    ctx.fillRect(this.wx(0) - this.ws(3), this.floorY - this.ws(0.5), this.ws(6), this.ws(1));
  }

  // ─── Fighter Drawing ───────────────────────────────
  _drawFighter(player, charId, animState, dt) {
    if (!player) return;
    const ctx = this.ctx;
    const char = CHARACTERS[charId];
    if (!char) return;

    const id = player.id;
    this.animFrames[id] = (this.animFrames[id] || 0) + dt * 60 * this.slowmo;
    const t = this.animFrames[id] * 0.05;
    const facing = player.facing;
    const px = this.wx(player.x);
    const groundY = this.wy(player.y);

    // Invincibility flash
    if (player.invincible > 0 && Math.sin(this.animFrames[id] * 0.5) > 0) return;

    ctx.save();
    ctx.translate(px, groundY);
    ctx.scale(facing, 1); // Flip for facing

    const s = this.ws(1) * 0.018; // Base scale

    const bodyColor = char.color;
    const accentColor = char.accentColor;
    const skinColor = "#ffccaa";

    // Get pose from animation state
    const pose = this._getPose(animState, t, player);

    // Shadow on ground
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 14, s * 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Character glow
    const glowR = s * 40;
    const glow = ctx.createRadialGradient(0, -s * 40, 0, 0, -s * 40, glowR);
    glow.addColorStop(0, bodyColor + "18");
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.fillRect(-glowR, -s * 40 - glowR, glowR * 2, glowR * 2);

    // ─── Draw limbs (back to front) ───

    // Back leg
    this._drawLimb(ctx, s, pose.backLeg, bodyColor, skinColor, "leg");
    // Back arm
    this._drawLimb(ctx, s, pose.backArm, bodyColor, skinColor, "arm");

    // Torso
    ctx.fillStyle = bodyColor;
    const torsoX = pose.torsoLean * s;
    ctx.beginPath();
    ctx.roundRect(torsoX - s * 10, -s * 70 + pose.bodyY * s, s * 20, s * 30, s * 3);
    ctx.fill();

    // Belt
    ctx.fillStyle = accentColor;
    ctx.fillRect(torsoX - s * 11, -s * 42 + pose.bodyY * s, s * 22, s * 5);

    // Front leg
    this._drawLimb(ctx, s, pose.frontLeg, bodyColor, skinColor, "leg");
    // Front arm
    this._drawLimb(ctx, s, pose.frontArm, bodyColor, accentColor, "arm");

    // Head
    ctx.fillStyle = skinColor;
    const headY = -s * 78 + pose.bodyY * s + pose.headBob * s;
    ctx.beginPath();
    ctx.arc(torsoX, headY, s * 10, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = "#331111";
    ctx.beginPath();
    ctx.arc(torsoX, headY - s * 3, s * 11, Math.PI, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(torsoX + s * 3, headY - s * 1, s * 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(torsoX + s * 4, headY - s * 1, s * 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Health bar above head (in screen space, not flipped)
    this._drawHealthBar(ctx, px, this.wy(player.y) - this.ws(1.7), player, char);
  }

  _drawLimb(ctx, s, limb, mainColor, endColor, type) {
    // limb: { x1, y1, x2, y2, x3, y3 } — upper joint, elbow/knee, hand/foot
    const thickness = type === "arm" ? s * 5 : s * 6;
    const endSize = type === "arm" ? s * 5 : s * 7;

    // Upper segment
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = thickness;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(limb.x1 * s, limb.y1 * s);
    ctx.lineTo(limb.x2 * s, limb.y2 * s);
    ctx.stroke();

    // Lower segment
    ctx.strokeStyle = endColor;
    ctx.lineWidth = thickness * 0.85;
    ctx.beginPath();
    ctx.moveTo(limb.x2 * s, limb.y2 * s);
    ctx.lineTo(limb.x3 * s, limb.y3 * s);
    ctx.stroke();

    // End (fist/foot)
    ctx.fillStyle = endColor;
    if (type === "arm") {
      ctx.beginPath();
      ctx.arc(limb.x3 * s, limb.y3 * s, endSize * 0.7, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(limb.x3 * s - endSize * 0.5, limb.y3 * s - endSize * 0.2, endSize * 1.2, endSize * 0.5);
    }
  }

  _drawHealthBar(ctx, px, py, player, char) {
    const w = this.ws(1.2);
    const h = 4;
    const x = px - w / 2;

    // BG
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(x - 1, py - 1, w + 2, h + 2);

    // HP
    const hpRatio = player.hp / MAX_HP;
    const hpColor = hpRatio > 0.5 ? char.color : hpRatio > 0.25 ? "#ffaa00" : "#ff2222";
    ctx.fillStyle = hpColor;
    ctx.fillRect(x, py, w * hpRatio, h);

    // Stamina (thin bar below)
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(x, py + h + 2, w, 2);
    ctx.fillStyle = "#44aaff";
    ctx.fillRect(x, py + h + 2, w * (player.stamina / MAX_STAMINA), 2);
  }

  // ─── Pose system ────────────────────────────────────
  _getPose(animState, t, player) {
    // Default idle pose
    const pose = {
      bodyY: 0, torsoLean: 0, headBob: 0,
      // Arm: shoulder → elbow → hand (relative coords in "s" units)
      frontArm: { x1: 10, y1: -62, x2: 16, y2: -48, x3: 14, y3: -38 },
      backArm:  { x1: -6, y1: -62, x2: -12, y2: -50, x3: -8, y3: -40 },
      // Leg: hip → knee → foot
      frontLeg: { x1: 5, y1: -38, x2: 8, y2: -20, x3: 6, y3: -2 },
      backLeg:  { x1: -3, y1: -38, x2: -5, y2: -20, x3: -3, y3: -2 },
    };

    const bob = Math.sin(t * 2) * 2;

    switch (animState) {
      case "idle": {
        pose.bodyY = bob;
        // Fighting stance
        pose.frontArm = { x1: 12, y1: -64 + bob, x2: 20, y2: -56 + bob, x3: 18, y3: -48 + bob };
        pose.backArm  = { x1: -4, y1: -64 + bob, x2: -10, y2: -58 + bob, x3: -6, y3: -50 + bob };
        pose.frontLeg = { x1: 6, y1: -40 + bob, x2: 10, y2: -22, x3: 8, y3: -2 };
        pose.backLeg  = { x1: -4, y1: -40 + bob, x2: -8, y2: -22, x3: -6, y3: -2 };
        break;
      }
      case "walk_forward":
      case "walk_backward": {
        const swing = Math.sin(t * 6) * 12;
        pose.frontLeg = { x1: 6, y1: -40, x2: 6 + swing * 0.5, y2: -20 + Math.abs(swing) * 0.3, x3: 6 + swing, y3: -2 };
        pose.backLeg  = { x1: -4, y1: -40, x2: -4 - swing * 0.5, y2: -20 + Math.abs(swing) * 0.3, x3: -4 - swing, y3: -2 };
        pose.frontArm = { x1: 12, y1: -64, x2: 12 - swing * 0.3, y2: -52, x3: 12 - swing * 0.5, y3: -44 };
        pose.backArm  = { x1: -4, y1: -64, x2: -4 + swing * 0.3, y2: -52, x3: -4 + swing * 0.5, y3: -44 };
        pose.bodyY = Math.abs(Math.sin(t * 6)) * 2;
        break;
      }
      case "jump": {
        pose.frontArm = { x1: 12, y1: -64, x2: 18, y2: -72, x3: 12, y3: -78 };
        pose.backArm  = { x1: -4, y1: -64, x2: -10, y2: -72, x3: -4, y3: -78 };
        pose.frontLeg = { x1: 6, y1: -40, x2: 12, y2: -30, x3: 8, y3: -18 };
        pose.backLeg  = { x1: -4, y1: -40, x2: -10, y2: -28, x3: -8, y3: -16 };
        break;
      }
      case "block": {
        pose.bodyY = -4;
        pose.frontArm = { x1: 12, y1: -66, x2: 14, y2: -72, x3: 6, y3: -70 };
        pose.backArm  = { x1: -4, y1: -66, x2: -2, y2: -72, x3: 4, y3: -68 };
        pose.frontLeg = { x1: 6, y1: -38, x2: 10, y2: -22, x3: 10, y3: -2 };
        pose.backLeg  = { x1: -4, y1: -38, x2: -8, y2: -22, x3: -8, y3: -2 };
        break;
      }
      case "crouch": {
        pose.bodyY = 16;
        pose.frontArm = { x1: 12, y1: -50, x2: 16, y2: -42, x3: 14, y3: -34 };
        pose.backArm  = { x1: -4, y1: -50, x2: -8, y2: -44, x3: -6, y3: -36 };
        pose.frontLeg = { x1: 6, y1: -24, x2: 14, y2: -14, x3: 10, y3: -2 };
        pose.backLeg  = { x1: -4, y1: -24, x2: -12, y2: -14, x3: -8, y3: -2 };
        break;
      }
      case "punch_light": {
        // Quick jab
        const f = (this.animFrames[player.id] || 0) % 16;
        const ext = f < 6 ? f / 6 : Math.max(0, 1 - (f - 6) / 10);
        pose.frontArm = { x1: 12, y1: -64, x2: 12 + ext * 18, y2: -60, x3: 12 + ext * 30, y3: -58 };
        pose.backArm  = { x1: -4, y1: -64, x2: -10, y2: -58, x3: -6, y3: -50 };
        pose.torsoLean = ext * 3;
        break;
      }
      case "punch_heavy": {
        const f = (this.animFrames[player.id] || 0) % 30;
        const wind = Math.min(1, f / 10);
        const ext = f < 10 ? 0 : Math.min(1, (f - 10) / 8);
        const rec = f < 18 ? 0 : (f - 18) / 12;
        const armExt = -wind * 8 + ext * 38 - rec * 20;
        pose.frontArm = { x1: 12, y1: -64, x2: 12 + armExt * 0.5, y2: -62, x3: 12 + armExt, y3: -60 };
        pose.backArm  = { x1: -4, y1: -64, x2: -10, y2: -58, x3: -6, y3: -50 };
        pose.torsoLean = (-wind * 3 + ext * 6 - rec * 3);
        pose.bodyY = wind * 3 - ext * 2;
        break;
      }
      case "kick_light": {
        const f = (this.animFrames[player.id] || 0) % 20;
        const ext = f < 8 ? f / 8 : Math.max(0, 1 - (f - 8) / 12);
        pose.frontLeg = { x1: 6, y1: -40, x2: 6 + ext * 14, y2: -30 + ext * 8, x3: 6 + ext * 28, y3: -22 + ext * 6 };
        pose.backLeg  = { x1: -4, y1: -40, x2: -6, y2: -22, x3: -4, y3: -2 };
        pose.bodyY = ext * 3;
        break;
      }
      case "kick_heavy": {
        const f = (this.animFrames[player.id] || 0) % 36;
        const wind = Math.min(1, f / 12);
        const ext = f < 12 ? 0 : Math.min(1, (f - 12) / 10);
        const rec = f < 22 ? 0 : (f - 22) / 14;
        const legExt = -wind * 6 + ext * 34 - rec * 20;
        pose.frontLeg = { x1: 6, y1: -40, x2: 6 + legExt * 0.4, y2: -28, x3: 6 + legExt, y3: -20 + ext * 10 };
        pose.backLeg  = { x1: -4, y1: -40, x2: -8, y2: -22, x3: -6, y3: -2 };
        pose.torsoLean = -ext * 4 + rec * 2;
        pose.bodyY = ext * 5;
        break;
      }
      case "special": {
        const f = (this.animFrames[player.id] || 0) % 48;
        const charge = Math.min(1, f / 15);
        const release = f < 15 ? 0 : Math.min(1, (f - 15) / 10);
        const rec = f < 25 ? 0 : (f - 25) / 23;
        pose.frontArm = { x1: 12, y1: -64, x2: 12 + (-charge * 6 + release * 30) * (1 - rec), y2: -62, x3: 12 + (-charge * 10 + release * 40) * (1 - rec), y3: -58 };
        pose.backArm  = { x1: -4, y1: -64, x2: -4 + (-charge * 4 + release * 24) * (1 - rec), y2: -60, x3: -4 + (-charge * 6 + release * 34) * (1 - rec), y3: -56 };
        pose.torsoLean = (-charge * 5 + release * 8) * (1 - rec);
        pose.bodyY = charge * 6 - release * 3;
        break;
      }
      case "uppercut": {
        const f = (this.animFrames[player.id] || 0) % 33;
        const crouch = Math.min(1, f / 8);
        const rise = f < 8 ? 0 : Math.min(1, (f - 8) / 8);
        const rec = f < 16 ? 0 : (f - 16) / 17;
        pose.frontArm = { x1: 12, y1: -64, x2: 12 + rise * 6, y2: -64 - rise * 18 + rec * 10, x3: 12 + rise * 4, y3: -64 - rise * 30 + rec * 20 };
        pose.backArm  = { x1: -4, y1: -64, x2: -10, y2: -58, x3: -6, y3: -50 };
        pose.bodyY = crouch * 10 - rise * 14 + rec * 4;
        break;
      }
      case "hit": {
        const f = (this.animFrames[player.id] || 0) % 20;
        const recoil = f < 5 ? f / 5 : Math.max(0, 1 - (f - 5) / 15);
        pose.torsoLean = -recoil * 8;
        pose.bodyY = recoil * 4;
        pose.headBob = -recoil * 5;
        pose.frontArm = { x1: 12, y1: -64, x2: 8, y2: -52, x3: 4 - recoil * 6, y3: -44 };
        pose.backArm  = { x1: -4, y1: -64, x2: -10, y2: -52, x3: -14 - recoil * 4, y3: -44 };
        break;
      }
      case "knockout": {
        const f = Math.min(30, (this.animFrames[player.id] || 0) % 60);
        const fall = Math.min(1, f / 20);
        pose.bodyY = fall * 50;
        pose.torsoLean = -fall * 20;
        pose.headBob = fall * 10;
        pose.frontArm = { x1: 12, y1: -64 + fall * 50, x2: 20, y2: -52 + fall * 50, x3: 24, y3: -40 + fall * 50 };
        pose.backArm  = { x1: -4, y1: -64 + fall * 50, x2: -12, y2: -52 + fall * 50, x3: -16, y3: -40 + fall * 50 };
        pose.frontLeg = { x1: 6, y1: -40 + fall * 36, x2: 14, y2: -22 + fall * 20, x3: 18, y3: -2 };
        pose.backLeg  = { x1: -4, y1: -40 + fall * 36, x2: -12, y2: -22 + fall * 20, x3: -16, y3: -2 };
        break;
      }
      default: {
        // idle fallback
        pose.bodyY = bob;
        pose.frontArm = { x1: 12, y1: -64 + bob, x2: 20, y2: -56 + bob, x3: 18, y3: -48 + bob };
        pose.backArm  = { x1: -4, y1: -64 + bob, x2: -10, y2: -58 + bob, x3: -6, y3: -50 + bob };
      }
    }

    return pose;
  }

  // ─── Main render ────────────────────────────────────
  render(players, myId, opponentId, combatSystem, dt) {
    this.time += dt;
    const ctx = this.ctx;

    const p1 = players[myId];
    const p2 = players[opponentId];

    // Camera
    this.updateCamera(p1, p2);
    this.updateShake();
    this._updateParticles(dt * this.slowmo);

    // Clear
    ctx.clearRect(0, 0, this.W, this.H);

    // Arena
    this._drawArena();

    // Determine draw order (further back drawn first — higher Y is further for 2D)
    const fightersToDraw = [
      { id: myId, player: p1, charId: this.fighters[myId]?.charId },
      { id: opponentId, player: p2, charId: this.fighters[opponentId]?.charId },
    ].filter(f => f.player);

    // Draw fighters
    for (const f of fightersToDraw) {
      const anim = combatSystem ? combatSystem.getAnimState(f.id) : "idle";
      this._drawFighter(f.player, f.charId, anim, dt);
    }

    // Particles on top
    this._drawParticles();
  }

  dispose() {
    window.removeEventListener("resize", this._resizeHandler);
    this.particles = [];
  }
}
