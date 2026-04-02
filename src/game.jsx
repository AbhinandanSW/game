import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONSTANTS ───
const W = 860,
  H = 520;
const GRAVITY = 0.42;
const TICK_MS = 1000 / 30;
const SYNC_MS = 100;
const MAX_HP = 100;
const WIN_SCORE = 5;

const WEAPONS = {
  pistol: {
    name: "Pistol",
    color: "#fff",
    damage: 15,
    speed: 8,
    cooldown: 16,
    size: 4,
    life: 60,
    burst: 1,
    spread: 0,
  },
  shotgun: {
    name: "Shotgun",
    color: "#ffaa33",
    damage: 10,
    speed: 7,
    cooldown: 35,
    size: 3,
    life: 30,
    burst: 5,
    spread: 0.35,
  },
  sniper: {
    name: "Sniper",
    color: "#ff4444",
    damage: 45,
    speed: 14,
    cooldown: 55,
    size: 3,
    life: 90,
    burst: 1,
    spread: 0,
  },
  smg: {
    name: "SMG",
    color: "#44ffaa",
    damage: 8,
    speed: 9,
    cooldown: 6,
    size: 3,
    life: 40,
    burst: 1,
    spread: 0.15,
  },
  rocket: {
    name: "Rocket",
    color: "#ff6600",
    damage: 40,
    speed: 5,
    cooldown: 70,
    size: 7,
    life: 80,
    burst: 1,
    spread: 0,
    explode: true,
  },
};

const WEAPON_LIST = Object.keys(WEAPONS);

const PLAYER_COLORS = [
  { main: "#ff4d6a", glow: "#ff4d6a88", name: "Crimson" },
  { main: "#4de1ff", glow: "#4de1ff88", name: "Cyan" },
  { main: "#a855f7", glow: "#a855f788", name: "Violet" },
];

const PLATFORMS = [
  { x: 0, y: H - 28, w: W, h: 28 },
  { x: 180, y: 390, w: 140, h: 12 },
  { x: 370, y: 360, w: 120, h: 12 },
  { x: 560, y: 390, w: 140, h: 12 },
  { x: 60, y: 280, w: 130, h: 12 },
  { x: 340, y: 250, w: 180, h: 12 },
  { x: 670, y: 280, w: 130, h: 12 },
  { x: 160, y: 160, w: 120, h: 12 },
  { x: 400, y: 140, w: 100, h: 12 },
  { x: 580, y: 160, w: 120, h: 12 },
];

const SPAWNS = [
  { x: 80, y: 200 },
  { x: 700, y: 200 },
  { x: 400, y: 80 },
];

// ─── HELPER ───
const uid = () => Math.random().toString(36).slice(2, 10);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// ─── MAIN COMPONENT ───
export default function PixelArena() {
  const [screen, setScreen] = useState("menu"); // menu | lobby | weapon | game | result
  const [myId, setMyId] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [playerSlot, setPlayerSlot] = useState(0);
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [myWeapon, setMyWeapon] = useState("pistol");
  const [resultMsg, setResultMsg] = useState("");
  const [error, setError] = useState("");
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const keysRef = useRef({});

  // ─── ROOM CREATION / JOIN ───
  const createRoom = useCallback(async () => {
    const code = uid().slice(0, 5).toUpperCase();
    const id = uid();
    setMyId(id);
    setRoomCode(code);
    setPlayerSlot(0);
    const roomData = {
      players: [{ id, name: "P1", slot: 0, weapon: "pistol", ready: false }],
      state: "lobby",
      scores: [0, 0, 0],
    };
    try {
      await window.storage.set(`room:${code}`, JSON.stringify(roomData), true);
      setScreen("lobby");
      setError("");
    } catch (e) {
      setError("Failed to create room. Try again.");
    }
  }, []);

  const joinRoom = useCallback(async () => {
    const code = roomInput.toUpperCase().trim();
    if (!code) return;
    try {
      const res = await window.storage.get(`room:${code}`, true);
      if (!res) {
        setError("Room not found!");
        return;
      }
      const room = JSON.parse(res.value);
      if (room.players.length >= 3) {
        setError("Room is full!");
        return;
      }
      const id = uid();
      const slot = room.players.length;
      room.players.push({
        id,
        name: `P${slot + 1}`,
        slot,
        weapon: "pistol",
        ready: false,
      });
      await window.storage.set(`room:${code}`, JSON.stringify(room), true);
      setMyId(id);
      setRoomCode(code);
      setPlayerSlot(slot);
      setScreen("lobby");
      setError("");
    } catch (e) {
      setError("Failed to join room.");
    }
  }, [roomInput]);

  // ─── LOBBY POLLING ───
  useEffect(() => {
    if (screen !== "lobby" && screen !== "weapon") return;
    const interval = setInterval(async () => {
      try {
        const res = await window.storage.get(`room:${roomCode}`, true);
        if (!res) return;
        const room = JSON.parse(res.value);
        setLobbyPlayers(room.players);
        if (room.state === "playing" && screen === "weapon") {
          setScreen("game");
        }
      } catch {}
    }, 800);
    return () => clearInterval(interval);
  }, [screen, roomCode]);

  // ─── WEAPON SELECT & READY ───
  const selectWeaponAndReady = useCallback(
    async (weapon) => {
      setMyWeapon(weapon);
      try {
        const res = await window.storage.get(`room:${roomCode}`, true);
        if (!res) return;
        const room = JSON.parse(res.value);
        const me = room.players.find((p) => p.id === myId);
        if (me) {
          me.weapon = weapon;
          me.ready = true;
        }
        // If all ready (at least 2 players), start game
        const allReady =
          room.players.length >= 2 && room.players.every((p) => p.ready);
        if (allReady) {
          room.state = "playing";
          room.gameData = createInitialGameData(room.players);
        }
        await window.storage.set(
          `room:${roomCode}`,
          JSON.stringify(room),
          true
        );
        setScreen("weapon");
      } catch {}
    },
    [roomCode, myId]
  );

  function createInitialGameData(players) {
    const gd = {
      players: {},
      bullets: [],
      particles: [],
      weaponDrops: [],
      tick: 0,
    };
    players.forEach((p, i) => {
      gd.players[p.id] = {
        x: SPAWNS[i].x,
        y: SPAWNS[i].y,
        vx: 0,
        vy: 0,
        hp: MAX_HP,
        slot: i,
        weapon: p.weapon,
        facing: i === 0 ? 1 : -1,
        shootCd: 0,
        dashCd: 0,
        dashTimer: 0,
        invincible: 90,
        grounded: false,
      };
    });
    return gd;
  }

  // ─── GAME LOOP ───
  useEffect(() => {
    if (screen !== "game") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let localState = null;
    let bullets = [];
    let particles = [];
    let weaponDrops = [];
    let scores = [0, 0, 0];
    let shake = { t: 0, i: 0 };
    let roundMsg = { text: "", timer: 0 };
    let running = true;
    let dropTimer = 300;
    let numPlayers = 2;

    // Fetch initial state
    async function fetchState() {
      try {
        const res = await window.storage.get(`room:${roomCode}`, true);
        if (!res) return;
        const room = JSON.parse(res.value);
        if (room.gameData) {
          localState = room.gameData.players;
          numPlayers = room.players.length;
          scores = room.scores || [0, 0, 0];
        }
      } catch {}
    }

    fetchState();

    // Sync my state to server
    async function syncState() {
      if (!localState || !localState[myId]) return;
      try {
        const res = await window.storage.get(`room:${roomCode}`, true);
        if (!res) return;
        const room = JSON.parse(res.value);
        if (!room.gameData) return;
        // Update my player in shared state
        room.gameData.players[myId] = localState[myId];
        room.scores = scores;
        await window.storage.set(
          `room:${roomCode}`,
          JSON.stringify(room),
          true
        );

        // Pull other players
        for (const pid of Object.keys(room.gameData.players)) {
          if (pid !== myId) {
            localState[pid] = room.gameData.players[pid];
          }
        }
      } catch {}
    }

    const syncInterval = setInterval(syncState, SYNC_MS);

    // Keys
    const onKeyDown = (e) => {
      keysRef.current[e.key.toLowerCase()] = true;
      e.preventDefault();
    };
    const onKeyUp = (e) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    function spawnParticles(x, y, color, count, speed) {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = Math.random() * speed;
        particles.push({
          x,
          y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - 1,
          color,
          life: 18 + Math.random() * 15,
          maxLife: 33,
          size: 2 + Math.random() * 3,
        });
      }
    }

    function updatePlayer(p) {
      const keys = keysRef.current;
      const spd = 3.2;
      const jump = -9.5;

      if (keys["a"] || keys["arrowleft"]) {
        p.vx -= spd * 0.4;
        p.facing = -1;
      }
      if (keys["d"] || keys["arrowright"]) {
        p.vx += spd * 0.4;
        p.facing = 1;
      }
      p.vx *= 0.85;

      if ((keys["w"] || keys["arrowup"] || keys[" "]) && p.grounded) {
        p.vy = jump;
        p.grounded = false;
      }

      p.vy += GRAVITY;

      // Dash
      if (p.dashTimer > 0) {
        p.dashTimer--;
        p.vx = p.facing * 13;
        p.vy = 0;
      }
      if ((keys["shift"] || keys["e"]) && p.dashCd <= 0 && p.dashTimer <= 0) {
        p.dashTimer = 7;
        p.dashCd = 50;
        p.invincible = Math.max(p.invincible, 7);
      }

      p.x += p.vx;
      p.y += p.vy;

      // Platforms
      p.grounded = false;
      for (const plat of PLATFORMS) {
        if (
          p.x + 26 > plat.x &&
          p.x + 2 < plat.x + plat.w &&
          p.y + 34 > plat.y &&
          p.y + 34 < plat.y + plat.h + 10 &&
          p.vy >= 0
        ) {
          p.y = plat.y - 34;
          p.vy = 0;
          p.grounded = true;
        }
      }

      p.x = clamp(p.x, 0, W - 28);
      if (p.y > H) {
        p.y = 0;
        p.vy = 0;
      }
      if (p.y < -40) {
        p.y = -40;
      }

      // Shoot
      if (
        (keys["f"] || keys["j"] || keys["."] || keys["enter"]) &&
        p.shootCd <= 0 &&
        p.hp > 0
      ) {
        const wep = WEAPONS[p.weapon] || WEAPONS.pistol;
        for (let b = 0; b < wep.burst; b++) {
          const angle =
            (p.facing === 1 ? 0 : Math.PI) + (Math.random() - 0.5) * wep.spread;
          bullets.push({
            x: p.x + 14 + p.facing * 16,
            y: p.y + 16,
            vx: Math.cos(angle) * wep.speed,
            vy: Math.sin(angle) * wep.speed,
            owner: myId,
            color: wep.color,
            damage: wep.damage,
            life: wep.life,
            size: wep.size,
            explode: wep.explode || false,
            weapon: p.weapon,
          });
        }
        p.shootCd = wep.cooldown;
        spawnParticles(p.x + 14 + p.facing * 16, p.y + 16, wep.color, 3, 2);
      }

      if (p.shootCd > 0) p.shootCd--;
      if (p.dashCd > 0) p.dashCd--;
      if (p.invincible > 0) p.invincible--;
    }

    function updateBullets() {
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        if (b.weapon === "rocket") b.vy += 0.08;
        b.life--;

        if (Math.random() < 0.3)
          particles.push({
            x: b.x,
            y: b.y,
            vx: 0,
            vy: 0,
            color: b.color,
            life: 8,
            maxLife: 8,
            size: 1.5,
          });

        if (
          b.x < -20 ||
          b.x > W + 20 ||
          b.y < -20 ||
          b.y > H + 20 ||
          b.life <= 0
        ) {
          if (b.explode) {
            spawnParticles(b.x, b.y, "#ff6600", 20, 5);
            spawnParticles(b.x, b.y, "#ffaa00", 15, 4);
          }
          bullets.splice(i, 1);
          continue;
        }

        let hitPlat = false;
        for (const plat of PLATFORMS) {
          if (
            b.x > plat.x &&
            b.x < plat.x + plat.w &&
            b.y > plat.y &&
            b.y < plat.y + plat.h
          ) {
            hitPlat = true;
            break;
          }
        }
        if (hitPlat) {
          if (b.explode) {
            spawnParticles(b.x, b.y, "#ff6600", 25, 6);
            // Explosion damage radius
            for (const pid of Object.keys(localState)) {
              const t = localState[pid];
              if (
                dist({ x: b.x, y: b.y }, { x: t.x + 14, y: t.y + 17 }) < 55 &&
                t.invincible <= 0
              ) {
                t.hp -= b.damage * 0.6;
                t.vy -= 4;
                t.invincible = 10;
              }
            }
          }
          spawnParticles(b.x, b.y, b.color, 5, 2);
          bullets.splice(i, 1);
          continue;
        }

        // Hit players
        for (const pid of Object.keys(localState)) {
          if (pid === b.owner) continue;
          const t = localState[pid];
          if (t.invincible > 0 || t.hp <= 0) continue;
          if (b.x > t.x && b.x < t.x + 28 && b.y > t.y && b.y < t.y + 34) {
            let dmg = b.damage;
            if (b.explode) {
              spawnParticles(b.x, b.y, "#ff6600", 20, 5);
              // Splash
              for (const pid2 of Object.keys(localState)) {
                if (pid2 === b.owner) continue;
                const t2 = localState[pid2];
                if (
                  pid2 !== pid &&
                  dist({ x: b.x, y: b.y }, { x: t2.x + 14, y: t2.y + 17 }) < 50
                ) {
                  t2.hp -= dmg * 0.5;
                  t2.vy -= 3;
                  t2.invincible = 10;
                }
              }
            }
            t.hp -= dmg;
            t.vx += b.vx * 0.4;
            t.vy -= 3.5;
            t.invincible = 12;
            spawnParticles(b.x, b.y, "#fff", 8, 4);
            spawnParticles(b.x, b.y, PLAYER_COLORS[t.slot].main, 6, 3);
            shake = { t: 6, i: b.explode ? 8 : 4 };
            bullets.splice(i, 1);
            break;
          }
        }
      }
    }

    function updateWeaponDrops() {
      dropTimer--;
      if (dropTimer <= 0 && weaponDrops.length < 3) {
        const wx = 80 + Math.random() * (W - 160);
        const wy = 60 + Math.random() * 250;
        const wtype =
          WEAPON_LIST[Math.floor(Math.random() * WEAPON_LIST.length)];
        weaponDrops.push({
          x: wx,
          y: wy,
          weapon: wtype,
          life: 500,
          bob: Math.random() * 6.28,
        });
        dropTimer = 250 + Math.random() * 250;
      }
      for (let i = weaponDrops.length - 1; i >= 0; i--) {
        const wd = weaponDrops[i];
        wd.life--;
        wd.bob += 0.04;
        if (wd.life <= 0) {
          weaponDrops.splice(i, 1);
          continue;
        }
        // Pickup by local player
        if (localState[myId] && localState[myId].hp > 0) {
          const p = localState[myId];
          if (dist({ x: wd.x, y: wd.y }, { x: p.x + 14, y: p.y + 17 }) < 28) {
            p.weapon = wd.weapon;
            spawnParticles(wd.x, wd.y, WEAPONS[wd.weapon].color, 10, 3);
            weaponDrops.splice(i, 1);
          }
        }
      }
    }

    function checkRoundEnd() {
      if (!localState) return;
      const alive = Object.entries(localState).filter(([_, p]) => p.hp > 0);
      const allPlayers = Object.keys(localState);
      if (allPlayers.length < 2) return;
      if (alive.length <= 1) {
        if (alive.length === 1) {
          const winnerSlot = alive[0][1].slot;
          scores[winnerSlot]++;
          roundMsg = {
            text: `${PLAYER_COLORS[winnerSlot].name} scores!`,
            timer: 80,
          };
        } else {
          roundMsg = { text: "Draw!", timer: 80 };
        }
        // Check game over
        if (scores.some((s) => s >= WIN_SCORE)) {
          const winSlot = scores.indexOf(Math.max(...scores));
          setResultMsg(
            `${PLAYER_COLORS[winSlot].name} wins ${scores.join(" - ")}!`
          );
          running = false;
          setScreen("result");
          return;
        }
        // Reset round
        bullets = [];
        weaponDrops = [];
        Object.entries(localState).forEach(([id, p]) => {
          const sp = SPAWNS[p.slot];
          p.x = sp.x;
          p.y = sp.y;
          p.vx = 0;
          p.vy = 0;
          p.hp = MAX_HP;
          p.invincible = 90;
          p.shootCd = 0;
          p.dashCd = 0;
        });
      }
    }

    function updateParticles() {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
      }
    }

    // ─── DRAWING ───
    function drawBg() {
      ctx.fillStyle = "#0b0b14";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#14142a";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 28) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 28) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
    }

    function drawPlatforms() {
      for (const p of PLATFORMS) {
        ctx.fillStyle = "#1a1a34";
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = "#28284f";
        ctx.fillRect(p.x, p.y, p.w, 3);
        ctx.strokeStyle = "#20203e";
        for (let gx = p.x; gx < p.x + p.w; gx += 14) {
          ctx.beginPath();
          ctx.moveTo(gx, p.y);
          ctx.lineTo(gx, p.y + p.h);
          ctx.stroke();
        }
      }
    }

    function drawPlayer(p, pid) {
      ctx.save();
      if (p.hp <= 0) {
        ctx.restore();
        return;
      }
      if (p.invincible > 0 && Math.floor(p.invincible / 3) % 2 === 0)
        ctx.globalAlpha = 0.35;
      const c = PLAYER_COLORS[p.slot];
      ctx.shadowColor = c.glow;
      ctx.shadowBlur = 14;
      ctx.fillStyle = c.main;
      ctx.fillRect(p.x + 4, p.y + 10, 20, 22);
      ctx.fillRect(p.x + 6, p.y, 16, 13);
      // Eyes
      ctx.fillStyle = "#fff";
      const ex = p.facing === 1 ? p.x + 12 : p.x + 8;
      ctx.fillRect(ex, p.y + 4, 3, 3);
      ctx.fillRect(ex + 5, p.y + 4, 3, 3);
      ctx.fillStyle = "#111";
      const po = p.facing === 1 ? 1 : 0;
      ctx.fillRect(ex + po, p.y + 5, 2, 2);
      ctx.fillRect(ex + 5 + po, p.y + 5, 2, 2);
      // Legs
      const lo = Math.abs(p.vx) > 0.5 ? Math.sin(Date.now() * 0.01) * 4 : 0;
      ctx.fillStyle = c.main;
      ctx.fillRect(p.x + 6, p.y + 30, 5, 4 + lo);
      ctx.fillRect(p.x + 17, p.y + 30, 5, 4 - lo);
      // Weapon indicator
      const wep = WEAPONS[p.weapon];
      ctx.fillStyle = wep ? wep.color : "#fff";
      const gx = p.facing === 1 ? p.x + 24 : p.x - 10;
      ctx.fillRect(gx, p.y + 14, 10, 3);
      // Name tag
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      ctx.font = "bold 8px monospace";
      ctx.fillStyle = c.main;
      ctx.textAlign = "center";
      ctx.fillText(pid === myId ? "YOU" : `P${p.slot + 1}`, p.x + 14, p.y - 6);
      // Weapon name
      ctx.font = "7px monospace";
      ctx.fillStyle = wep ? wep.color : "#888";
      ctx.fillText(wep ? wep.name : "", p.x + 14, p.y - 14);
      ctx.restore();
    }

    function drawBullets() {
      for (const b of bullets) {
        ctx.save();
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
        if (b.explode) {
          ctx.strokeStyle = "#ff880066";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.size + 3, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    function drawWeaponDrops() {
      for (const wd of weaponDrops) {
        ctx.save();
        const by = wd.y + Math.sin(wd.bob) * 4;
        const wep = WEAPONS[wd.weapon];
        if (wd.life < 100)
          ctx.globalAlpha = 0.4 + Math.sin(wd.life * 0.2) * 0.4;
        ctx.shadowColor = wep.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = "#1a1a34";
        ctx.fillRect(wd.x - 14, by - 10, 28, 20);
        ctx.strokeStyle = wep.color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(wd.x - 14, by - 10, 28, 20);
        ctx.fillStyle = wep.color;
        ctx.font = "bold 7px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(wep.name, wd.x, by);
        ctx.restore();
      }
    }

    function drawParticles() {
      for (const p of particles) {
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
      ctx.globalAlpha = 1;
    }

    function drawHUD() {
      if (!localState) return;
      const pids = Object.keys(localState);
      pids.sort((a, b) => localState[a].slot - localState[b].slot);
      pids.forEach((pid, i) => {
        const p = localState[pid];
        const c = PLAYER_COLORS[p.slot];
        const bx = 15 + i * 290;
        // HP bar
        ctx.fillStyle = "#0e0e1e";
        ctx.fillRect(bx, 8, 150, 12);
        ctx.fillStyle = c.main;
        ctx.fillRect(bx, 8, (150 * Math.max(0, p.hp)) / MAX_HP, 12);
        ctx.strokeStyle = "#333";
        ctx.strokeRect(bx, 8, 150, 12);
        // Labels
        ctx.font = "bold 9px monospace";
        ctx.fillStyle = c.main;
        ctx.textAlign = "left";
        const label = pid === myId ? "YOU" : `P${p.slot + 1}`;
        ctx.fillText(`${label} [${scores[p.slot]}]`, bx, 34);
        ctx.fillStyle = "#888";
        ctx.font = "8px monospace";
        const wname = WEAPONS[p.weapon] ? WEAPONS[p.weapon].name : "?";
        ctx.fillText(wname, bx + 80, 34);
      });

      // Round message
      if (roundMsg.timer > 0) {
        roundMsg.timer--;
        ctx.globalAlpha = Math.min(1, roundMsg.timer / 25);
        ctx.font = "bold 16px monospace";
        ctx.fillStyle = "#ffd700";
        ctx.textAlign = "center";
        ctx.shadowColor = "#ffd70066";
        ctx.shadowBlur = 15;
        ctx.fillText(roundMsg.text, W / 2, H / 2 - 30);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    }

    // ─── GAME TICK ───
    let lastTick = 0;
    function tick(ts) {
      if (!running) return;
      if (ts - lastTick < TICK_MS) {
        requestAnimationFrame(tick);
        return;
      }
      lastTick = ts;

      if (localState && localState[myId]) {
        updatePlayer(localState[myId]);
      }
      updateBullets();
      updateWeaponDrops();
      updateParticles();
      checkRoundEnd();

      // Draw
      let sx = 0,
        sy = 0;
      if (shake.t > 0) {
        sx = (Math.random() - 0.5) * shake.i;
        sy = (Math.random() - 0.5) * shake.i;
        shake.t--;
      }
      ctx.save();
      ctx.translate(sx, sy);
      drawBg();
      drawPlatforms();
      drawWeaponDrops();
      drawParticles();
      drawBullets();
      if (localState) {
        for (const pid of Object.keys(localState))
          drawPlayer(localState[pid], pid);
      }
      drawHUD();
      ctx.restore();

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);

    return () => {
      running = false;
      clearInterval(syncInterval);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [screen, roomCode, myId, playerSlot]);

  // ─── UI SCREENS ───
  const panelStyle = {
    background: "#0b0b14",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Courier New', monospace",
    color: "#e8e8f0",
    padding: 20,
  };

  const btnStyle = (color) => ({
    fontFamily: "'Courier New', monospace",
    fontWeight: "bold",
    fontSize: 14,
    padding: "12px 32px",
    background: `linear-gradient(135deg, ${color}, ${color}99)`,
    border: "none",
    borderRadius: 6,
    color: "#fff",
    cursor: "pointer",
    letterSpacing: 2,
    boxShadow: `0 4px 20px ${color}44`,
    marginTop: 10,
    transition: "transform 0.15s",
  });

  const inputStyle = {
    fontFamily: "'Courier New', monospace",
    fontSize: 16,
    padding: "10px 16px",
    background: "#14142a",
    border: "2px solid #28284f",
    borderRadius: 6,
    color: "#e8e8f0",
    textAlign: "center",
    letterSpacing: 4,
    width: 180,
    outline: "none",
  };

  // ─── MENU ───
  if (screen === "menu") {
    return (
      <div style={panelStyle}>
        <h1
          style={{
            fontSize: 38,
            letterSpacing: 6,
            marginBottom: 4,
            background:
              "linear-gradient(90deg, #ff4d6a, #ffd700, #4de1ff, #a855f7)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: 900,
          }}
        >
          PIXEL ARENA
        </h1>
        <p
          style={{
            color: "#555570",
            fontSize: 12,
            letterSpacing: 3,
            marginBottom: 30,
          }}
        >
          3-PLAYER ONLINE BATTLE
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            alignItems: "center",
          }}
        >
          <button style={btnStyle("#ff4d6a")} onClick={createRoom}>
            CREATE ROOM
          </button>

          <p
            style={{
              color: "#555570",
              fontSize: 11,
              marginTop: 15,
              marginBottom: 5,
            }}
          >
            — OR JOIN —
          </p>
          <input
            style={inputStyle}
            placeholder="ROOM CODE"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
            maxLength={5}
            onKeyDown={(e) => e.key === "Enter" && joinRoom()}
          />
          <button style={btnStyle("#4de1ff")} onClick={joinRoom}>
            JOIN ROOM
          </button>
        </div>

        {error && (
          <p style={{ color: "#ff4d6a", marginTop: 15, fontSize: 12 }}>
            {error}
          </p>
        )}

        <div
          style={{
            marginTop: 40,
            color: "#444",
            fontSize: 10,
            textAlign: "center",
            lineHeight: 1.8,
          }}
        >
          <p>🎮 Share the room code with friends</p>
          <p>⌨️ WASD/Arrows to move • F/J/Enter to shoot • Shift/E to dash</p>
          <p>📦 Pick up weapon crates to switch weapons!</p>
        </div>
      </div>
    );
  }

  // ─── LOBBY ───
  if (screen === "lobby") {
    return (
      <div style={panelStyle}>
        <h2
          style={{
            fontSize: 22,
            letterSpacing: 4,
            color: "#ffd700",
            marginBottom: 6,
          }}
        >
          ROOM: {roomCode}
        </h2>
        <p style={{ color: "#888", fontSize: 11, marginBottom: 25 }}>
          Share this code with friends to join!
        </p>

        <div style={{ display: "flex", gap: 20, marginBottom: 30 }}>
          {[0, 1, 2].map((i) => {
            const p = lobbyPlayers[i];
            const c = PLAYER_COLORS[i];
            return (
              <div
                key={i}
                style={{
                  width: 140,
                  padding: "18px 12px",
                  background: p ? "#14142a" : "#0e0e1a",
                  border: `2px solid ${p ? c.main : "#222"}`,
                  borderRadius: 10,
                  textAlign: "center",
                  boxShadow: p ? `0 0 20px ${c.glow}` : "none",
                  transition: "all 0.3s",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    margin: "0 auto 10px",
                    background: p ? c.main : "#1a1a2e",
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    fontWeight: 900,
                    color: p ? "#fff" : "#333",
                    boxShadow: p ? `0 0 15px ${c.glow}` : "none",
                  }}
                >
                  {p ? `P${i + 1}` : "?"}
                </div>
                <p
                  style={{
                    color: p ? c.main : "#333",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {p
                    ? p.id === myId
                      ? "YOU"
                      : `Player ${i + 1}`
                    : "Waiting..."}
                </p>
                {p?.ready && (
                  <p style={{ color: "#44ff88", fontSize: 9, marginTop: 4 }}>
                    ✓ READY
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <p style={{ color: "#666", fontSize: 10, marginBottom: 15 }}>
          {lobbyPlayers.length >= 2
            ? "Choose your weapon to ready up!"
            : "Need at least 2 players..."}
        </p>

        {lobbyPlayers.length >= 2 && (
          <div>
            <p
              style={{
                color: "#aaa",
                fontSize: 11,
                marginBottom: 12,
                textAlign: "center",
                letterSpacing: 2,
              }}
            >
              SELECT WEAPON
            </p>
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {WEAPON_LIST.map((wk) => {
                const w = WEAPONS[wk];
                return (
                  <button
                    key={wk}
                    onClick={() => selectWeaponAndReady(wk)}
                    style={{
                      fontFamily: "'Courier New', monospace",
                      fontSize: 10,
                      padding: "10px 14px",
                      background: myWeapon === wk ? "#28284f" : "#14142a",
                      border: `2px solid ${myWeapon === wk ? w.color : "#222"}`,
                      borderRadius: 8,
                      color: w.color,
                      cursor: "pointer",
                      minWidth: 90,
                      textAlign: "center",
                      boxShadow:
                        myWeapon === wk ? `0 0 12px ${w.color}44` : "none",
                    }}
                  >
                    <div style={{ fontWeight: 900, fontSize: 12 }}>
                      {w.name}
                    </div>
                    <div style={{ color: "#666", fontSize: 8, marginTop: 3 }}>
                      DMG:{w.damage} SPD:{w.speed}
                    </div>
                    {w.burst > 1 && (
                      <div style={{ color: "#ffaa33", fontSize: 8 }}>
                        ×{w.burst} pellets
                      </div>
                    )}
                    {w.explode && (
                      <div style={{ color: "#ff6600", fontSize: 8 }}>
                        💥 Explosive
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── WEAPON SELECT / WAITING ───
  if (screen === "weapon") {
    return (
      <div style={panelStyle}>
        <h2
          style={{
            fontSize: 18,
            color: "#ffd700",
            letterSpacing: 3,
            marginBottom: 10,
          }}
        >
          WAITING FOR PLAYERS...
        </h2>
        <p style={{ color: "#888", fontSize: 11, marginBottom: 20 }}>
          You selected:{" "}
          <span style={{ color: WEAPONS[myWeapon].color, fontWeight: 900 }}>
            {WEAPONS[myWeapon].name}
          </span>
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          {lobbyPlayers.map((p, i) => (
            <div
              key={i}
              style={{
                padding: "8px 16px",
                background: "#14142a",
                border: `1px solid ${PLAYER_COLORS[i].main}`,
                borderRadius: 6,
                fontSize: 11,
                color: PLAYER_COLORS[i].main,
              }}
            >
              {p.id === myId ? "YOU" : `P${i + 1}`} {p.ready ? "✓" : "..."}
            </div>
          ))}
        </div>
        <div
          className="loader"
          style={{
            width: 30,
            height: 30,
            marginTop: 25,
            border: "3px solid #222",
            borderTop: "3px solid #ffd700",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ─── RESULT ───
  if (screen === "result") {
    return (
      <div style={panelStyle}>
        <h2
          style={{
            fontSize: 28,
            color: "#ffd700",
            letterSpacing: 4,
            marginBottom: 15,
            textShadow: "0 0 20px #ffd70044",
          }}
        >
          🏆 GAME OVER 🏆
        </h2>
        <p style={{ fontSize: 16, color: "#e8e8f0", marginBottom: 20 }}>
          {resultMsg}
        </p>
        <button
          style={btnStyle("#ff4d6a")}
          onClick={() => {
            setScreen("menu");
            setError("");
          }}
        >
          BACK TO MENU
        </button>
      </div>
    );
  }

  // ─── GAME ───
  return (
    <div
      style={{
        background: "#0b0b14",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          color: "#555",
          fontSize: 9,
          fontFamily: "monospace",
          marginBottom: 6,
          letterSpacing: 2,
        }}
      >
        ROOM: {roomCode} &nbsp;|&nbsp; WASD/Arrows: Move &nbsp; F/J/Enter: Shoot
        &nbsp; Shift/E: Dash &nbsp; First to {WIN_SCORE} wins!
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{
          border: "2px solid #1e1e30",
          borderRadius: 6,
          boxShadow: "0 0 40px rgba(0,0,0,0.6)",
          imageRendering: "pixelated",
          cursor: "crosshair",
          maxWidth: "100%",
        }}
      />
      <div
        style={{
          color: "#333",
          fontSize: 8,
          fontFamily: "monospace",
          marginTop: 6,
        }}
      >
        📦 Pick up weapon crates on the map to switch weapons mid-game!
      </div>
    </div>
  );
}
