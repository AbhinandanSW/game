import storage from "../../firebase";
import { SYNC_INTERVAL } from "../constants";

export default class SyncManager {
  constructor(store) {
    this.store = store;
    this.unsubscribers = [];
    this.lastSyncTime = 0;
    this.remoteTargets = {}; // Interpolation targets for remote player
    this.pendingEvents = []; // Hit events to sync
  }

  // Create a new room
  async createRoom(roomCode, playerId) {
    await storage.set(roomCode, {
      state: "lobby",
      players: {
        [playerId]: { id: playerId, ready: false, character: null },
      },
      gameData: {},
      hitEvents: {},
      roundData: {},
    });
  }

  // Join existing room
  async joinRoom(roomCode, playerId) {
    const room = await storage.get(roomCode);
    if (!room) throw new Error("Room not found");

    const data = room.value;
    if (data.state !== "lobby") throw new Error("Game already in progress");

    const playerCount = data.players ? Object.keys(data.players).length : 0;
    if (playerCount >= 2) throw new Error("Room is full");

    data.players[playerId] = { id: playerId, ready: false, character: null };
    await storage.set(roomCode, data);
    return data;
  }

  // Subscribe to lobby updates (returns unsubscribe function)
  subscribeLobby(roomCode, callback) {
    const unsub = storage.subscribe(roomCode, (data) => {
      callback(data);
    });
    this.unsubscribers.push(unsub);
    return unsub;
  }

  // Set character selection
  async setCharacter(roomCode, playerId, characterId) {
    const room = await storage.get(roomCode);
    if (!room) return;
    const data = room.value;
    if (data.players[playerId]) {
      data.players[playerId].character = characterId;
      data.players[playerId].ready = true;
      await storage.set(roomCode, data);
    }
  }

  // Start the game
  async startGame(roomCode) {
    const room = await storage.get(roomCode);
    if (!room) return;
    const data = room.value;
    data.state = "playing";
    data.roundData = { round: 1, state: "countdown" };
    await storage.set(roomCode, data);
  }

  // Subscribe to game state updates (opponent's player data)
  subscribeGameState(roomCode, opponentId, callback) {
    const unsub = storage.subscribePath(
      roomCode,
      `gameData/players/${opponentId}`,
      (data) => {
        if (data) {
          this.remoteTargets[opponentId] = {
            x: data.x,
            y: data.y,
            vx: data.vx,
            vy: data.vy,
            hp: data.hp,
            stamina: data.stamina,
            facing: data.facing,
            animState: data.animState,
            attackState: data.attackState,
            blocking: data.blocking,
            hitstun: data.hitstun,
            dead: data.dead,
            grounded: data.grounded,
          };
          callback(data);
        }
      }
    );
    this.unsubscribers.push(unsub);
  }

  // Subscribe to hit events from opponent
  subscribeHitEvents(roomCode, myId, callback) {
    const unsub = storage.subscribePath(
      roomCode,
      `hitEvents/${myId}`,
      (events) => {
        if (events) callback(events);
      }
    );
    this.unsubscribers.push(unsub);
  }

  // Subscribe to round state changes
  subscribeRoundData(roomCode, callback) {
    const unsub = storage.subscribePath(roomCode, "roundData", (data) => {
      if (data) callback(data);
    });
    this.unsubscribers.push(unsub);
  }

  // Sync local player state to Firebase
  async syncPlayerState(roomCode, playerId, playerData, animState) {
    const now = Date.now();
    if (now - this.lastSyncTime < SYNC_INTERVAL) return;
    this.lastSyncTime = now;

    try {
      const base = `rooms/${roomCode}`;
      const updates = {};
      updates[`${base}/gameData/players/${playerId}`] = {
        x: Math.round(playerData.x * 100) / 100,
        y: Math.round(playerData.y * 100) / 100,
        vx: Math.round(playerData.vx * 1000) / 1000,
        vy: Math.round(playerData.vy * 1000) / 1000,
        hp: playerData.hp,
        stamina: Math.round(playerData.stamina),
        facing: playerData.facing,
        animState,
        attackState: playerData.attackState
          ? {
              attack: playerData.attackState.attack,
              phase: playerData.attackState.phase,
              frame: playerData.attackState.frame,
            }
          : null,
        blocking: playerData.blocking || false,
        hitstun: playerData.hitstun || 0,
        dead: playerData.dead || false,
        grounded: playerData.grounded,
        timestamp: Date.now(),
      };

      // Include pending hit events
      if (this.pendingEvents.length > 0) {
        const opponentId = this.store.getState().opponentId;
        updates[`${base}/hitEvents/${opponentId}`] = this.pendingEvents;
        this.pendingEvents = [];
      }

      // Use Firebase multi-path update via raw ref
      const { getDatabase, ref, update } = await import("firebase/database");
      const db = getDatabase();
      await update(ref(db), updates);
    } catch (e) {
      console.warn("Sync failed:", e);
    }
  }

  // Send a hit event to be applied to opponent
  queueHitEvent(event) {
    this.pendingEvents.push({
      ...event,
      timestamp: Date.now(),
    });
  }

  // Sync round data
  async syncRoundData(roomCode, roundData) {
    try {
      const room = await storage.get(roomCode);
      if (room) {
        const data = room.value;
        data.roundData = roundData;
        await storage.set(roomCode, data);
      }
    } catch (e) {
      console.warn("Round sync failed:", e);
    }
  }

  // Interpolate remote player toward target
  interpolateRemote(playerId, lerpFactor = 0.25) {
    const target = this.remoteTargets[playerId];
    if (!target) return null;

    const state = this.store.getState();
    const player = state.players[playerId];
    if (!player) return null;

    return {
      x: player.x + (target.x - player.x) * lerpFactor,
      y: player.y + (target.y - player.y) * lerpFactor,
      vx: target.vx,
      vy: target.vy,
      hp: target.hp,
      facing: target.facing,
      blocking: target.blocking,
      hitstun: target.hitstun,
      dead: target.dead,
      grounded: target.grounded,
      attackState: target.attackState,
    };
  }

  cleanup() {
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
    this.remoteTargets = {};
    this.pendingEvents = [];
  }
}
