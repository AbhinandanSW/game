import { useState, useEffect, useRef, useCallback } from "react";
import storage from "./firebase";

// ─── CONSTANTS ───
const W = 860,
  H = 520;
const GRAVITY = 0.42;
const TICK_MS = 1000 / 30;
const SYNC_MS = 150;
const MAX_HP = 100;
const MATCH_TIME = 5 * 60 * 30; // 5 minutes in ticks (30fps)
const WIN_KILLS = 15;
const MAX_PLAYERS = 8;
const HEALTH_KIT_HP = 30;
const HEALTH_KIT_INTERVAL_MIN = 450; // ~15s at 30fps
const HEALTH_KIT_INTERVAL_MAX = 600; // ~20s at 30fps
const RESPAWN_TICKS = 90; // 3 seconds at 30fps
const INVINCIBLE_ON_SPAWN = 60; // 2 seconds at 30fps
const KILL_FEED_DURATION = 120; // 4 seconds

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
  { main: "#ffd700", glow: "#ffd70088", name: "Gold" },
  { main: "#44ff88", glow: "#44ff8888", name: "Emerald" },
  { main: "#ff8844", glow: "#ff884488", name: "Amber" },
  { main: "#ff44cc", glow: "#ff44cc88", name: "Magenta" },
  { main: "#44ccff", glow: "#44ccff88", name: "Sky" },
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
  { x: 200, y: 340 },
  { x: 600, y: 340 },
  { x: 120, y: 120 },
  { x: 650, y: 120 },
  { x: 380, y: 210 },
];

// ─── HELPERS ───
const uid = () => Math.random().toString(36).slice(2, 10);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
// Firebase may return arrays as objects with numeric keys — normalize
const toArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return Object.values(val);
};

function randomSpawn() {
  const sp = SPAWNS[Math.floor(Math.random() * SPAWNS.length)];
  return { x: sp.x, y: sp.y };
}

function formatTime(ticks) {
  const totalSec = Math.max(0, Math.ceil(ticks / 30));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

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
  const keysRef = useRef({});

  // ─── ROOM CREATION / JOIN ───
  const createRoom = useCallback(async () => {
    const code = uid().slice(0, 5).toUpperCase();
    const id = uid();
    setMyId(id);
    setRoomCode(code);
    setPlayerSlot(0);
    const roomData = {
      players: { [id]: { id, name: "P1", slot: 0, weapon: "pistol", ready: false } },
      state: "lobby",
      scores: {},
    };
    try {
      await storage.set(`room:${code}`, roomData);
      setScreen("lobby");
      setError("");
    } catch (e) {
      console.warn("Failed to create room:", e);
      setError("Failed to create room. Try again.");
    }
  }, []);

  const joinRoom = useCallback(async () => {
    const code = roomInput.toUpperCase().trim();
    if (!code) return;
    try {
      const res = await storage.get(`room:${code}`);
      if (!res) {
        setError("Room not found!");
        return;
      }
      const room = res.value;
      const playersObj = room.players || {};
      const playersArr = toArray(playersObj);
      if (playersArr.length >= MAX_PLAYERS) {
        setError("Room is full!");
        return;
      }
      const id = uid();
      const slot = playersArr.length;
      playersObj[id] = {
        id,
        name: `P${slot + 1}`,
        slot,
        weapon: "pistol",
        ready: false,
      };
      room.players = playersObj;
      await storage.set(`room:${code}`, room);
      setMyId(id);
      setRoomCode(code);
      setPlayerSlot(slot);
      setScreen("lobby");
      setError("");
    } catch (e) {
      console.warn("Failed to join room:", e);
      setError("Failed to join room.");
    }
  }, [roomInput]);

  // ─── LOBBY POLLING (real-time) ───
  useEffect(() => {
    if (screen !== "lobby" && screen !== "weapon") return;
    const unsub = storage.subscribe(`room:${roomCode}`, (room) => {
      const playersArr = toArray(room.players);
      setLobbyPlayers(playersArr);
      if (room.state === "playing" && screen === "weapon") {
        setScreen("game");
      }
    });
    return unsub;
  }, [screen, roomCode]);

  // ─── WEAPON SELECT & READY ───
  const selectWeaponAndReady = useCallback(
    async (weapon) => {
      setMyWeapon(weapon);
      try {
        const res = await storage.get(`room:${roomCode}`);
        if (!res) return;
        const room = res.value;
        const playersObj = room.players || {};
        if (playersObj[myId]) {
          playersObj[myId].weapon = weapon;
          playersObj[myId].ready = true;
        }
        room.players = playersObj;
        // If all ready (at least 2 players), start game
        const playersArr = toArray(playersObj);
        const allReady =
          playersArr.length >= 2 && playersArr.every((p) => p.ready);
        if (allReady) {
          room.state = "playing";
          room.gameData = createInitialGameData(playersArr);
          room.matchStartTick = 0;
        }
        await storage.set(`room:${roomCode}`, room);
        setScreen("weapon");
      } catch (e) {
        console.warn("selectWeaponAndReady failed:", e);
      }
    },
    [roomCode, myId]
  );

  function createInitialGameData(playersArr) {
    const gd = { players: {} };
    playersArr.forEach((p, i) => {
      const sp = i < SPAWNS.length ? SPAWNS[i] : randomSpawn();
      gd.players[p.id] = {
        x: sp.x,
        y: sp.y,
        vx: 0,
        vy: 0,
        hp: MAX_HP,
        slot: i,
        weapon: p.weapon,
        facing: i % 2 === 0 ? 1 : -1,
        shootCd: 0,
        dashCd: 0,
        dashTimer: 0,
        invincible: INVINCIBLE_ON_SPAWN,
        grounded: false,
        dead: false,
        respawnTimer: 0,
        kills: 0,
        deaths: 0,
        score: 0,
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

    let localState = null; // { [playerId]: playerData }
    let allBullets = []; // ALL bullets (mine + remote) - all simulated locally
    let seenShootIds = new Set(); // track which remote shoot events we already spawned
    let myShootEvents = []; // shoot events to sync to Firebase
    let particles = [];
    let weaponDrops = [];
    let healthKits = [];
    let shake = { t: 0, i: 0 };
    let running = true;
    let dropTimer = 300;
    let healthKitTimer = HEALTH_KIT_INTERVAL_MIN;
    let matchTick = 0;
    let killFeed = []; // { text, color, timer }
    let lastHitBy = null; // playerId of last player whose bullet hit me
    let showLeaderboard = false;

    // Real-time subscription - pulls other players' state + bullets
    const unsub = storage.subscribe(`room:${roomCode}`, (room) => {
      if (!room || !room.gameData || !room.gameData.players) return;
      const remotePlayers = room.gameData.players;

      if (!localState) {
        // First load: clone all players
        localState = {};
        for (const pid of Object.keys(remotePlayers)) {
          localState[pid] = { ...remotePlayers[pid] };
        }
      } else {
        // Update remote players only (never overwrite our own state)
        for (const pid of Object.keys(remotePlayers)) {
          if (pid !== myId) {
            localState[pid] = remotePlayers[pid];
          }
        }
        // Add any new players that joined
        for (const pid of Object.keys(remotePlayers)) {
          if (!localState[pid]) {
            localState[pid] = remotePlayers[pid];
          }
        }
      }

      // Process remote shoot events — spawn local bullets for each new event
      if (room.shootEvents) {
        for (const pid of Object.keys(room.shootEvents)) {
          if (pid === myId) continue;
          const events = toArray(room.shootEvents[pid]);
          for (const ev of events) {
            if (!ev || !ev.id) continue;
            if (seenShootIds.has(ev.id)) continue;
            seenShootIds.add(ev.id);
            // Create local bullet from shoot event
            allBullets.push({
              x: ev.x, y: ev.y,
              vx: ev.vx, vy: ev.vy,
              owner: ev.owner,
              color: ev.color,
              damage: ev.damage,
              life: ev.life,
              size: ev.size,
              explode: ev.explode || false,
              weapon: ev.weapon,
            });
          }
        }
      }

      // Prune old seen IDs to prevent memory growth
      if (seenShootIds.size > 500) {
        const arr = [...seenShootIds];
        seenShootIds = new Set(arr.slice(-100));
      }

      // Pull health kit pickups from firebase if synced
      if (room.healthKits) {
        healthKits = toArray(room.healthKits).filter((k) => k);
      }
    });

    // Single batched sync — 1 Firebase write instead of 3
    let syncPending = false;
    async function syncState() {
      if (!localState || !localState[myId] || syncPending) return;
      syncPending = true;
      try {
        const me = localState[myId];
        const recentEvents = myShootEvents.slice(-10);
        const scoreData = {
          kills: me.kills || 0,
          deaths: me.deaths || 0,
          score: me.score || 0,
          slot: me.slot,
        };
        await storage.syncAll(`room:${roomCode}`, myId, me, recentEvents, scoreData);
      } catch (e) {
        console.warn("syncState failed:", e);
      }
      syncPending = false;
    }

    const syncInterval = setInterval(syncState, SYNC_MS);

    // Keys
    const onKeyDown = (e) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key === "Tab") {
        e.preventDefault();
        showLeaderboard = true;
      }
      // Prevent default for game keys
      if (
        ["w", "a", "s", "d", " ", "shift", "e", "f", "j", "enter", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(
          e.key.toLowerCase()
        )
      ) {
        e.preventDefault();
      }
    };
    const onKeyUp = (e) => {
      keysRef.current[e.key.toLowerCase()] = false;
      if (e.key === "Tab") {
        showLeaderboard = false;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    function addKillFeed(text, color) {
      killFeed.push({ text, color, timer: KILL_FEED_DURATION });
    }

    function spawnParticles(x, y, color, count, speed) {
      // Cap total particles to prevent lag
      const maxParticles = 200;
      const toSpawn = particles.length > maxParticles ? Math.min(count, 3) : count;
      for (let i = 0; i < toSpawn; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = Math.random() * speed;
        particles.push({
          x,
          y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - 1,
          color,
          life: 15 + Math.random() * 10,
          maxLife: 25,
          size: 2 + Math.random() * 2,
        });
      }
    }

    function getPlayerName(pid) {
      if (!localState || !localState[pid]) return "???";
      const p = localState[pid];
      const c = PLAYER_COLORS[p.slot] || PLAYER_COLORS[0];
      return pid === myId ? "YOU" : c.name;
    }

    function getPlayerColor(pid) {
      if (!localState || !localState[pid]) return "#fff";
      return (PLAYER_COLORS[localState[pid].slot] || PLAYER_COLORS[0]).main;
    }

    function handleDeath(me) {
      me.dead = true;
      me.hp = 0;
      me.respawnTimer = RESPAWN_TICKS;
      me.deaths = (me.deaths || 0) + 1;
      spawnParticles(me.x + 14, me.y + 17, PLAYER_COLORS[me.slot].main, 20, 5);
      spawnParticles(me.x + 14, me.y + 17, "#fff", 10, 3);

      // Credit the kill to lastHitBy
      if (lastHitBy && localState[lastHitBy]) {
        const killer = localState[lastHitBy];
        killer.kills = (killer.kills || 0) + 1;
        killer.score = (killer.score || 0) + 100;
        addKillFeed(
          `${getPlayerName(lastHitBy)} eliminated ${getPlayerName(myId)}`,
          getPlayerColor(lastHitBy)
        );
      } else {
        addKillFeed(`${getPlayerName(myId)} was eliminated`, "#888");
      }
      lastHitBy = null;
    }

    function handleRespawn(me) {
      const sp = randomSpawn();
      me.x = sp.x;
      me.y = sp.y;
      me.vx = 0;
      me.vy = 0;
      me.hp = MAX_HP;
      me.dead = false;
      me.respawnTimer = 0;
      me.invincible = INVINCIBLE_ON_SPAWN;
      me.shootCd = 0;
      me.dashCd = 0;
      me.dashTimer = 0;
    }

    function updatePlayer(p) {
      // Handle respawn timer
      if (p.dead) {
        if (p.respawnTimer > 0) {
          p.respawnTimer--;
        }
        if (p.respawnTimer <= 0) {
          handleRespawn(p);
        }
        return;
      }

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
            (p.facing === 1 ? 0 : Math.PI) +
            (Math.random() - 0.5) * wep.spread;
          const bulletData = {
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
          };
          // Add to local simulation
          allBullets.push({ ...bulletData });
          // Add shoot event for Firebase sync (with unique id)
          const shootId = myId + "_" + Date.now() + "_" + b + "_" + Math.random().toString(36).slice(2, 6);
          seenShootIds.add(shootId); // mark as seen so we don't double-spawn
          myShootEvents.push({ ...bulletData, id: shootId });
        }
        // Keep only recent shoot events to prevent memory growth
        if (myShootEvents.length > 20) myShootEvents = myShootEvents.slice(-10);
        p.shootCd = wep.cooldown;
        spawnParticles(
          p.x + 14 + p.facing * 16,
          p.y + 16,
          wep.color,
          3,
          2
        );
      }

      if (p.shootCd > 0) p.shootCd--;
      if (p.dashCd > 0) p.dashCd--;
      if (p.invincible > 0) p.invincible--;
    }

    // Process ALL bullets — full physics, hit detection for all players
    function updateAllBullets() {
      if (!localState) return;
      const me = localState[myId];

      for (let i = allBullets.length - 1; i >= 0; i--) {
        const b = allBullets[i];
        b.x += b.vx;
        b.y += b.vy;
        if (b.weapon === "rocket") b.vy += 0.08;
        b.life--;

        if (particles.length < 150 && Math.random() < 0.15)
          particles.push({
            x: b.x, y: b.y, vx: 0, vy: 0,
            color: b.color, life: 6, maxLife: 6, size: 1.5,
          });

        // Out of bounds or expired
        if (b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20 || b.life <= 0) {
          if (b.explode) {
            spawnParticles(b.x, b.y, "#ff6600", 20, 5);
            spawnParticles(b.x, b.y, "#ffaa00", 15, 4);
          }
          allBullets.splice(i, 1);
          continue;
        }

        // Platform collision
        let hitPlat = false;
        for (const plat of PLATFORMS) {
          if (b.x > plat.x && b.x < plat.x + plat.w && b.y > plat.y && b.y < plat.y + plat.h) {
            hitPlat = true;
            break;
          }
        }
        if (hitPlat) {
          // Explosion splash damage on ME from platform hit
          if (b.explode && b.owner !== myId && me && !me.dead && me.hp > 0 && me.invincible <= 0) {
            const d = dist({ x: b.x, y: b.y }, { x: me.x + 14, y: me.y + 17 });
            if (d < 55) {
              me.hp -= (b.damage || 10) * 0.6;
              me.vy -= 4;
              me.invincible = 10;
              lastHitBy = b.owner || null;
              if (me.hp <= 0) handleDeath(me);
            }
          }
          if (b.explode) spawnParticles(b.x, b.y, "#ff6600", 25, 6);
          spawnParticles(b.x, b.y, b.color, 5, 2);
          allBullets.splice(i, 1);
          continue;
        }

        // Hit detection against all players
        let bulletRemoved = false;
        for (const pid of Object.keys(localState)) {
          if (pid === b.owner) continue; // can't hit yourself
          const t = localState[pid];
          if (t.dead || t.hp <= 0) continue;
          if (b.x > t.x && b.x < t.x + 28 && b.y > t.y && b.y < t.y + 34) {
            // Visual effects for all hits
            if (b.explode) spawnParticles(b.x, b.y, "#ff6600", 20, 5);
            spawnParticles(b.x, b.y, "#fff", 8, 4);
            const tc = PLAYER_COLORS[t.slot] || PLAYER_COLORS[0];
            spawnParticles(b.x, b.y, tc.main, 6, 3);
            shake = { t: 6, i: b.explode ? 8 : 4 };

            // Only apply damage if the hit player is ME
            if (pid === myId && me.invincible <= 0) {
              const dmg = b.damage || 10;
              me.hp -= dmg;
              me.vx += (b.vx || 0) * 0.4;
              me.vy -= 3.5;
              me.invincible = 12;
              lastHitBy = b.owner || null;
              if (me.hp <= 0) handleDeath(me);
            }

            // Award hit score if MY bullet hit someone
            if (b.owner === myId && me) {
              me.score = (me.score || 0) + 10;
            }

            // Explosion splash on ME from direct hit
            if (b.explode && pid !== myId && me && !me.dead && me.hp > 0 && me.invincible <= 0) {
              const d = dist({ x: b.x, y: b.y }, { x: me.x + 14, y: me.y + 17 });
              if (d < 55) {
                me.hp -= (b.damage || 10) * 0.6;
                me.vy -= 4;
                me.invincible = 10;
                lastHitBy = b.owner || null;
                if (me.hp <= 0) handleDeath(me);
              }
            }

            allBullets.splice(i, 1);
            bulletRemoved = true;
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
        if (localState && localState[myId] && !localState[myId].dead && localState[myId].hp > 0) {
          const p = localState[myId];
          if (
            dist({ x: wd.x, y: wd.y }, { x: p.x + 14, y: p.y + 17 }) < 28
          ) {
            p.weapon = wd.weapon;
            spawnParticles(wd.x, wd.y, WEAPONS[wd.weapon].color, 10, 3);
            weaponDrops.splice(i, 1);
          }
        }
      }
    }

    function updateHealthKits() {
      healthKitTimer--;
      if (healthKitTimer <= 0 && healthKits.length < 3) {
        const hx = 80 + Math.random() * (W - 160);
        const hy = 60 + Math.random() * 250;
        healthKits.push({
          x: hx,
          y: hy,
          life: 600,
          bob: Math.random() * 6.28,
        });
        healthKitTimer =
          HEALTH_KIT_INTERVAL_MIN +
          Math.random() * (HEALTH_KIT_INTERVAL_MAX - HEALTH_KIT_INTERVAL_MIN);
      }
      for (let i = healthKits.length - 1; i >= 0; i--) {
        const hk = healthKits[i];
        hk.life--;
        hk.bob += 0.05;
        if (hk.life <= 0) {
          healthKits.splice(i, 1);
          continue;
        }
        // Pickup by local player
        if (localState && localState[myId] && !localState[myId].dead && localState[myId].hp > 0) {
          const p = localState[myId];
          if (p.hp < MAX_HP) {
            if (
              dist({ x: hk.x, y: hk.y }, { x: p.x + 14, y: p.y + 17 }) < 24
            ) {
              p.hp = Math.min(MAX_HP, p.hp + HEALTH_KIT_HP);
              spawnParticles(hk.x, hk.y, "#44ff88", 12, 3);
              healthKits.splice(i, 1);
            }
          }
        }
      }
    }

    function checkMatchEnd() {
      if (!localState) return false;
      // Check kill limit
      for (const pid of Object.keys(localState)) {
        if ((localState[pid].kills || 0) >= WIN_KILLS) {
          const winner = localState[pid];
          const c = PLAYER_COLORS[winner.slot] || PLAYER_COLORS[0];
          setResultMsg(
            `${c.name} wins with ${winner.kills} kills!`
          );
          running = false;
          setScreen("result");
          return true;
        }
      }
      // Check time limit
      if (matchTick >= MATCH_TIME) {
        let bestPid = null;
        let bestScore = -1;
        for (const pid of Object.keys(localState)) {
          const s = localState[pid].score || 0;
          if (s > bestScore) {
            bestScore = s;
            bestPid = pid;
          }
        }
        if (bestPid) {
          const winner = localState[bestPid];
          const c = PLAYER_COLORS[winner.slot] || PLAYER_COLORS[0];
          setResultMsg(
            `Time's up! ${c.name} wins with ${bestScore} points!`
          );
        } else {
          setResultMsg("Time's up! It's a draw!");
        }
        running = false;
        setScreen("result");
        return true;
      }
      return false;
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

    function updateKillFeed() {
      for (let i = killFeed.length - 1; i >= 0; i--) {
        killFeed[i].timer--;
        if (killFeed[i].timer <= 0) killFeed.splice(i, 1);
      }
      // Cap at 5 entries
      if (killFeed.length > 5) killFeed.splice(0, killFeed.length - 5);
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
      if (p.dead || p.hp <= 0) {
        ctx.restore();
        return;
      }
      if (p.invincible > 0 && Math.floor(p.invincible / 3) % 2 === 0)
        ctx.globalAlpha = 0.35;
      const c = PLAYER_COLORS[p.slot] || PLAYER_COLORS[0];
      ctx.shadowColor = c.glow;
      ctx.shadowBlur = 14;
      ctx.fillStyle = c.main;
      // Body
      ctx.fillRect(p.x + 4, p.y + 10, 20, 22);
      // Head
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
      const lo =
        Math.abs(p.vx) > 0.5 ? Math.sin(Date.now() * 0.01) * 4 : 0;
      ctx.fillStyle = c.main;
      ctx.fillRect(p.x + 6, p.y + 30, 5, 4 + lo);
      ctx.fillRect(p.x + 17, p.y + 30, 5, 4 - lo);
      // Weapon indicator on character
      const wep = WEAPONS[p.weapon];
      ctx.fillStyle = wep ? wep.color : "#fff";
      const gx = p.facing === 1 ? p.x + 24 : p.x - 10;
      ctx.fillRect(gx, p.y + 14, 10, 3);

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // Health bar above player
      const hpBarW = 30;
      const hpBarH = 3;
      const hpBarX = p.x + 14 - hpBarW / 2;
      const hpBarY = p.y - 20;
      ctx.fillStyle = "#0e0e1e";
      ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);
      const hpFrac = Math.max(0, (p.hp || 0)) / MAX_HP;
      const hpColor = hpFrac > 0.5 ? "#44ff88" : hpFrac > 0.25 ? "#ffaa33" : "#ff4444";
      ctx.fillStyle = hpColor;
      ctx.fillRect(hpBarX, hpBarY, hpBarW * hpFrac, hpBarH);

      // Name tag
      ctx.font = "bold 8px monospace";
      ctx.fillStyle = c.main;
      ctx.textAlign = "center";
      ctx.fillText(
        pid === myId ? "YOU" : c.name,
        p.x + 14,
        p.y - 24
      );
      // Weapon name
      ctx.font = "7px monospace";
      ctx.fillStyle = wep ? wep.color : "#888";
      ctx.fillText(wep ? wep.name : "", p.x + 14, p.y - 32);
      ctx.restore();
    }

    function drawBullets() {
      for (const b of allBullets) {
        if (!b) continue;
        ctx.save();
        ctx.shadowColor = b.color || "#fff";
        ctx.shadowBlur = 8;
        ctx.fillStyle = b.color || "#fff";
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size || 3, 0, Math.PI * 2);
        ctx.fill();
        if (b.explode) {
          ctx.strokeStyle = "#ff880066";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(b.x, b.y, (b.size || 3) + 3, 0, Math.PI * 2);
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

    function drawHealthKits() {
      for (const hk of healthKits) {
        ctx.save();
        const by = hk.y + Math.sin(hk.bob) * 4;
        if (hk.life < 100)
          ctx.globalAlpha = 0.4 + Math.sin(hk.life * 0.2) * 0.4;
        ctx.shadowColor = "#44ff88";
        ctx.shadowBlur = 10;
        // Box
        ctx.fillStyle = "#0e2e1a";
        ctx.fillRect(hk.x - 10, by - 10, 20, 20);
        ctx.strokeStyle = "#44ff88";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(hk.x - 10, by - 10, 20, 20);
        // Green cross
        ctx.fillStyle = "#44ff88";
        ctx.fillRect(hk.x - 2, by - 7, 4, 14);
        ctx.fillRect(hk.x - 7, by - 2, 14, 4);
        ctx.restore();
      }
    }

    function drawParticles() {
      for (const p of particles) {
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.fillRect(
          p.x - p.size / 2,
          p.y - p.size / 2,
          p.size,
          p.size
        );
      }
      ctx.globalAlpha = 1;
    }

    function drawHUD() {
      if (!localState) return;

      // Timer at top center
      ctx.save();
      ctx.font = "bold 14px monospace";
      ctx.fillStyle = "#ffd700";
      ctx.textAlign = "center";
      ctx.shadowColor = "#ffd70044";
      ctx.shadowBlur = 10;
      const timeLeft = MATCH_TIME - matchTick;
      ctx.fillText(formatTime(timeLeft), W / 2, 20);
      ctx.shadowBlur = 0;
      ctx.restore();

      // My HP bar + info at bottom left
      if (localState[myId]) {
        const me = localState[myId];
        const c = PLAYER_COLORS[me.slot] || PLAYER_COLORS[0];

        ctx.save();
        // HP bar
        ctx.fillStyle = "#0e0e1e";
        ctx.fillRect(10, H - 50, 160, 14);
        const hpFrac = Math.max(0, me.hp) / MAX_HP;
        const hpColor = hpFrac > 0.5 ? "#44ff88" : hpFrac > 0.25 ? "#ffaa33" : "#ff4444";
        ctx.fillStyle = hpColor;
        ctx.fillRect(10, H - 50, 160 * hpFrac, 14);
        ctx.strokeStyle = "#333";
        ctx.strokeRect(10, H - 50, 160, 14);
        ctx.font = "bold 9px monospace";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.fillText(`${Math.max(0, Math.ceil(me.hp))} HP`, 90, H - 40);

        // Weapon indicator
        const wep = WEAPONS[me.weapon];
        ctx.font = "bold 10px monospace";
        ctx.fillStyle = wep ? wep.color : "#fff";
        ctx.textAlign = "left";
        ctx.fillText(wep ? wep.name : "???", 10, H - 28);

        // Stats
        ctx.font = "8px monospace";
        ctx.fillStyle = "#888";
        ctx.fillText(
          `K:${me.kills || 0}  D:${me.deaths || 0}  Score:${me.score || 0}`,
          10,
          H - 18
        );

        // Dead overlay
        if (me.dead) {
          ctx.font = "bold 20px monospace";
          ctx.fillStyle = "#ff4444";
          ctx.textAlign = "center";
          ctx.fillText("ELIMINATED", W / 2, H / 2 - 10);
          ctx.font = "12px monospace";
          ctx.fillStyle = "#aaa";
          ctx.fillText(
            `Respawning in ${Math.ceil((me.respawnTimer || 0) / 30)}s...`,
            W / 2,
            H / 2 + 15
          );
        }

        ctx.restore();
      }

      // Kill feed - top right
      ctx.save();
      ctx.textAlign = "right";
      ctx.font = "8px monospace";
      for (let i = 0; i < killFeed.length; i++) {
        const kf = killFeed[i];
        ctx.globalAlpha = Math.min(1, kf.timer / 30);
        ctx.fillStyle = kf.color || "#aaa";
        ctx.fillText(kf.text, W - 10, 36 + i * 12);
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // Leaderboard (hold TAB or always show mini version)
      drawLeaderboard();
    }

    function drawLeaderboard() {
      if (!localState) return;
      const pids = Object.keys(localState);
      // Sort by score descending
      pids.sort(
        (a, b) => (localState[b].score || 0) - (localState[a].score || 0)
      );

      if (showLeaderboard) {
        // Full leaderboard overlay
        ctx.save();
        ctx.fillStyle = "rgba(11, 11, 20, 0.85)";
        ctx.fillRect(W / 2 - 170, 40, 340, 30 + pids.length * 22);
        ctx.strokeStyle = "#ffd700";
        ctx.lineWidth = 1;
        ctx.strokeRect(W / 2 - 170, 40, 340, 30 + pids.length * 22);

        ctx.font = "bold 11px monospace";
        ctx.fillStyle = "#ffd700";
        ctx.textAlign = "center";
        ctx.fillText("LEADERBOARD", W / 2, 58);

        // Header
        ctx.font = "bold 8px monospace";
        ctx.fillStyle = "#666";
        ctx.textAlign = "left";
        ctx.fillText("PLAYER", W / 2 - 150, 72);
        ctx.textAlign = "center";
        ctx.fillText("K", W / 2 + 30, 72);
        ctx.fillText("D", W / 2 + 70, 72);
        ctx.fillText("SCORE", W / 2 + 120, 72);

        pids.forEach((pid, i) => {
          const p = localState[pid];
          const c = PLAYER_COLORS[p.slot] || PLAYER_COLORS[0];
          const yy = 86 + i * 22;

          // Highlight my row
          if (pid === myId) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
            ctx.fillRect(W / 2 - 165, yy - 10, 330, 20);
          }

          ctx.font = "bold 9px monospace";
          ctx.fillStyle = c.main;
          ctx.textAlign = "left";
          ctx.fillText(
            pid === myId ? `${c.name} (YOU)` : c.name,
            W / 2 - 150,
            yy
          );
          ctx.textAlign = "center";
          ctx.fillStyle = "#ddd";
          ctx.fillText(`${p.kills || 0}`, W / 2 + 30, yy);
          ctx.fillText(`${p.deaths || 0}`, W / 2 + 70, yy);
          ctx.fillStyle = "#ffd700";
          ctx.fillText(`${p.score || 0}`, W / 2 + 120, yy);
        });
        ctx.restore();
      } else {
        // Mini scoreboard at top-left
        ctx.save();
        ctx.font = "7px monospace";
        ctx.textAlign = "left";
        const top3 = pids.slice(0, 3);
        top3.forEach((pid, i) => {
          const p = localState[pid];
          const c = PLAYER_COLORS[p.slot] || PLAYER_COLORS[0];
          ctx.fillStyle = c.main;
          ctx.fillText(
            `${pid === myId ? "YOU" : c.name}: ${p.score || 0}`,
            10,
            16 + i * 10
          );
        });
        ctx.restore();
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
      matchTick++;

      if (localState && localState[myId]) {
        updatePlayer(localState[myId]);
      }
      updateAllBullets();
      updateWeaponDrops();
      updateHealthKits();
      updateParticles();
      updateKillFeed();

      if (checkMatchEnd()) return;

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
      drawHealthKits();
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
      unsub();
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
          UP TO 8-PLAYER ONLINE BATTLE
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
            -- OR JOIN --
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
          <p>Share the room code with friends</p>
          <p>WASD/Arrows to move | F/J/Enter to shoot | Shift/E to dash</p>
          <p>Pick up weapon crates to switch weapons!</p>
          <p>Hold TAB for leaderboard | 5-min match or first to 15 kills</p>
        </div>
      </div>
    );
  }

  // ─── LOBBY ───
  if (screen === "lobby") {
    const slots = [];
    for (let i = 0; i < MAX_PLAYERS; i++) {
      slots.push(lobbyPlayers[i] || null);
    }
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

        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 30,
            flexWrap: "wrap",
            justifyContent: "center",
            maxWidth: 700,
          }}
        >
          {slots.map((p, i) => {
            const c = PLAYER_COLORS[i];
            return (
              <div
                key={i}
                style={{
                  width: 110,
                  padding: "14px 8px",
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
                    width: 32,
                    height: 32,
                    margin: "0 auto 8px",
                    background: p ? c.main : "#1a1a2e",
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
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
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {p
                    ? p.id === myId
                      ? "YOU"
                      : c.name
                    : "Empty"}
                </p>
                {p?.ready && (
                  <p style={{ color: "#44ff88", fontSize: 8, marginTop: 3 }}>
                    READY
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
                        x{w.burst} pellets
                      </div>
                    )}
                    {w.explode && (
                      <div style={{ color: "#ff6600", fontSize: 8 }}>
                        Explosive
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
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {lobbyPlayers.map((p, i) => (
            <div
              key={i}
              style={{
                padding: "8px 16px",
                background: "#14142a",
                border: `1px solid ${(PLAYER_COLORS[i] || PLAYER_COLORS[0]).main}`,
                borderRadius: 6,
                fontSize: 11,
                color: (PLAYER_COLORS[i] || PLAYER_COLORS[0]).main,
              }}
            >
              {p.id === myId ? "YOU" : `P${i + 1}`}{" "}
              {p.ready ? "READY" : "..."}
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
          GAME OVER
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
        ROOM: {roomCode} &nbsp;|&nbsp; WASD/Arrows: Move &nbsp; F/J/Enter:
        Shoot &nbsp; Shift/E: Dash &nbsp; TAB: Leaderboard
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
        Pick up weapon crates + health kits on the map | First to 15 kills or
        highest score in 5 min wins!
      </div>
    </div>
  );
}
