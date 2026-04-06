// ─── Game Constants ────────────────────────────────────────────

export const FPS = 60;
export const TICK_MS = 1000 / FPS;
export const SYNC_INTERVAL = 100; // ms between Firebase syncs

// Arena
export const ARENA_WIDTH = 20;
export const ARENA_DEPTH = 12;
export const ARENA_BOUNDARY = 8; // max X distance from center

// Fighter
export const MAX_HP = 100;
export const MAX_STAMINA = 100;
export const STAMINA_REGEN = 0.3; // per frame
export const MOVE_SPEED = 0.08;
export const JUMP_FORCE = 0.18;
export const GRAVITY = 0.007;
export const GROUND_Y = 0;
export const KNOCKBACK_FRICTION = 0.92;

// Combat timing (in frames at 60fps)
export const HITSTUN_LIGHT = 15;
export const HITSTUN_HEAVY = 25;
export const HITSTUN_SPECIAL = 35;
export const COMBO_WINDOW = 20; // frames to chain next hit
export const BLOCK_DAMAGE_MULT = 0.2;
export const BLOCK_STAMINA_COST = 8;

// Round system
export const ROUNDS_TO_WIN = 2;
export const ROUND_TIME = 90; // seconds
export const COUNTDOWN_TIME = 3; // seconds before fight
export const KO_SLOWMO_DURATION = 60; // frames of slow-mo on KO

// Attacks
export const ATTACKS = {
  punch_light: {
    key: "punch_light",
    damage: 8,
    staminaCost: 5,
    startup: 4,
    active: 4,
    recovery: 8,
    hitstun: HITSTUN_LIGHT,
    knockback: 0.06,
    knockUp: 0,
    reach: 1.0,
    hitboxSize: { x: 0.6, y: 0.4, z: 0.4 },
    hitboxOffset: { x: 0.7, y: 1.2, z: 0 },
  },
  punch_heavy: {
    key: "punch_heavy",
    damage: 18,
    staminaCost: 12,
    startup: 10,
    active: 5,
    recovery: 15,
    hitstun: HITSTUN_HEAVY,
    knockback: 0.12,
    knockUp: 0.04,
    reach: 1.1,
    hitboxSize: { x: 0.7, y: 0.5, z: 0.5 },
    hitboxOffset: { x: 0.8, y: 1.2, z: 0 },
  },
  kick_light: {
    key: "kick_light",
    damage: 10,
    staminaCost: 6,
    startup: 5,
    active: 5,
    recovery: 10,
    hitstun: HITSTUN_LIGHT,
    knockback: 0.08,
    knockUp: 0,
    reach: 1.3,
    hitboxSize: { x: 0.7, y: 0.35, z: 0.4 },
    hitboxOffset: { x: 0.9, y: 0.6, z: 0 },
  },
  kick_heavy: {
    key: "kick_heavy",
    damage: 20,
    staminaCost: 15,
    startup: 12,
    active: 6,
    recovery: 18,
    hitstun: HITSTUN_HEAVY,
    knockback: 0.15,
    knockUp: 0.06,
    reach: 1.4,
    hitboxSize: { x: 0.8, y: 0.4, z: 0.5 },
    hitboxOffset: { x: 1.0, y: 0.5, z: 0 },
  },
  special: {
    key: "special",
    damage: 30,
    staminaCost: 40,
    startup: 15,
    active: 8,
    recovery: 25,
    hitstun: HITSTUN_SPECIAL,
    knockback: 0.2,
    knockUp: 0.1,
    reach: 1.6,
    hitboxSize: { x: 1.0, y: 0.8, z: 0.6 },
    hitboxOffset: { x: 1.0, y: 1.0, z: 0 },
  },
  uppercut: {
    key: "uppercut",
    damage: 22,
    staminaCost: 18,
    startup: 8,
    active: 5,
    recovery: 20,
    hitstun: HITSTUN_HEAVY,
    knockback: 0.05,
    knockUp: 0.18,
    reach: 0.9,
    hitboxSize: { x: 0.5, y: 0.8, z: 0.4 },
    hitboxOffset: { x: 0.5, y: 1.4, z: 0 },
    launcher: true,
  },
};

// Combo definitions: sequence → bonus
export const COMBOS = [
  {
    name: "Triple Jab",
    sequence: ["punch_light", "punch_light", "punch_light"],
    bonusDamage: 5,
    bonusKnockback: 0.05,
  },
  {
    name: "Rush Combo",
    sequence: ["punch_light", "punch_light", "kick_light"],
    bonusDamage: 8,
    bonusKnockback: 0.08,
  },
  {
    name: "Launcher",
    sequence: ["punch_light", "punch_light", "uppercut"],
    bonusDamage: 10,
    bonusKnockback: 0,
    bonusKnockUp: 0.12,
  },
  {
    name: "Devastator",
    sequence: ["kick_light", "kick_light", "kick_heavy"],
    bonusDamage: 12,
    bonusKnockback: 0.1,
  },
  {
    name: "Ultimate",
    sequence: ["punch_light", "kick_light", "punch_heavy", "special"],
    bonusDamage: 20,
    bonusKnockback: 0.15,
  },
];

// Characters
export const CHARACTERS = {
  dragon: {
    id: "dragon",
    name: "Dragon",
    color: "#ff4444",
    accentColor: "#ff8800",
    description: "Balanced fighter with powerful combos",
    stats: { power: 7, speed: 7, defense: 6 },
    damageMultiplier: 1.0,
    speedMultiplier: 1.0,
    defenseMultiplier: 1.0,
    specialName: "Dragon Fist",
  },
  shadow: {
    id: "shadow",
    name: "Shadow",
    color: "#8844ff",
    accentColor: "#cc44ff",
    description: "Lightning-fast strikes, elusive movement",
    stats: { power: 5, speed: 9, defense: 5 },
    damageMultiplier: 0.85,
    speedMultiplier: 1.3,
    defenseMultiplier: 0.9,
    specialName: "Shadow Strike",
  },
  titan: {
    id: "titan",
    name: "Titan",
    color: "#44aaff",
    accentColor: "#44ddff",
    description: "Devastating power, iron defense",
    stats: { power: 9, speed: 4, defense: 9 },
    damageMultiplier: 1.25,
    speedMultiplier: 0.75,
    defenseMultiplier: 1.3,
    specialName: "Titan Crush",
  },
  viper: {
    id: "viper",
    name: "Viper",
    color: "#44ff44",
    accentColor: "#aaff44",
    description: "Long-range kicks, strategic fighter",
    stats: { power: 6, speed: 8, defense: 6 },
    damageMultiplier: 0.95,
    speedMultiplier: 1.1,
    defenseMultiplier: 1.0,
    reachMultiplier: 1.2,
    specialName: "Venom Lash",
  },
};

// Screen states
export const SCREENS = {
  MENU: "menu",
  LOBBY: "lobby",
  CHARACTER_SELECT: "charselect",
  FIGHTING: "fighting",
  RESULT: "result",
};

// Key bindings
export const KEYS = {
  MOVE_LEFT: ["a", "arrowleft"],
  MOVE_RIGHT: ["d", "arrowright"],
  JUMP: ["w", "arrowup", " "],
  CROUCH: ["s", "arrowdown"],
  PUNCH_LIGHT: ["j"],
  KICK_LIGHT: ["k"],
  BLOCK: ["l"],
  PUNCH_HEAVY: ["u"],
  KICK_HEAVY: ["i"],
  SPECIAL: ["q"],
  DASH: ["shift", "e"],
};
