import { create } from "zustand";
import { SCREENS, MAX_HP, MAX_STAMINA, ROUNDS_TO_WIN } from "../constants";

const createPlayerState = (id, characterId, facing) => ({
  id,
  characterId,
  x: facing === 1 ? -3 : 3,
  y: 0,
  vx: 0,
  vy: 0,
  facing, // 1 = right, -1 = left
  hp: MAX_HP,
  stamina: MAX_STAMINA,
  grounded: true,
  blocking: false,
  crouching: false,
  attackState: null, // { attack, frame, phase: 'startup'|'active'|'recovery', hitConnected }
  hitstun: 0,
  comboCount: 0,
  comboHits: [],
  lastHitTime: 0,
  dashCooldown: 0,
  invincible: 0,
  dead: false,
});

const useGameStore = create((set, get) => ({
  // Screen
  screen: SCREENS.MENU,
  setScreen: (screen) => set({ screen }),

  // Room
  roomCode: "",
  setRoomCode: (roomCode) => set({ roomCode }),
  myId: "",
  setMyId: (myId) => set({ myId }),
  opponentId: "",
  setOpponentId: (opponentId) => set({ opponentId }),

  // Lobby
  lobbyPlayers: {},
  setLobbyPlayers: (lobbyPlayers) => set({ lobbyPlayers }),

  // Characters
  myCharacter: null,
  setMyCharacter: (myCharacter) => set({ myCharacter }),
  opponentCharacter: null,
  setOpponentCharacter: (opponentCharacter) => set({ opponentCharacter }),
  characterSelections: {},
  setCharacterSelections: (characterSelections) => set({ characterSelections }),

  // Game state
  players: {},
  setPlayers: (players) => set({ players }),
  initPlayers: (myId, oppId, myChar, oppChar) => {
    set({
      players: {
        [myId]: createPlayerState(myId, myChar, -1),
        [oppId]: createPlayerState(oppId, oppChar, 1),
      },
    });
  },
  updatePlayer: (id, updates) =>
    set((state) => ({
      players: {
        ...state.players,
        [id]: { ...state.players[id], ...updates },
      },
    })),

  // Round
  round: 1,
  roundWins: {}, // { playerId: wins }
  roundState: "waiting", // waiting, countdown, fighting, ko, round_end
  roundTimer: 0,
  countdownValue: 0,
  koSlowmo: 0,
  setRound: (round) => set({ round }),
  setRoundWins: (roundWins) => set({ roundWins }),
  setRoundState: (roundState) => set({ roundState }),
  setRoundTimer: (roundTimer) => set({ roundTimer }),
  setCountdownValue: (v) => set({ countdownValue: v }),
  setKoSlowmo: (v) => set({ koSlowmo: v }),

  // HUD
  comboDisplay: { count: 0, timer: 0, text: "" },
  setComboDisplay: (comboDisplay) => set({ comboDisplay }),
  hitEffects: [],
  addHitEffect: (effect) =>
    set((state) => ({ hitEffects: [...state.hitEffects, effect] })),
  clearHitEffects: () => set({ hitEffects: [] }),
  announceText: "",
  setAnnounceText: (announceText) => set({ announceText }),

  // Match result
  matchWinner: null,
  setMatchWinner: (matchWinner) => set({ matchWinner }),

  // Error
  error: "",
  setError: (error) => set({ error }),

  // Reset for new round
  resetRound: () => {
    const state = get();
    const myId = state.myId;
    const oppId = state.opponentId;
    set({
      players: {
        [myId]: createPlayerState(myId, state.myCharacter, -1),
        [oppId]: createPlayerState(oppId, state.opponentCharacter, 1),
      },
      roundState: "countdown",
      roundTimer: 0,
      comboDisplay: { count: 0, timer: 0, text: "" },
      hitEffects: [],
      announceText: "",
      koSlowmo: 0,
    });
  },

  // Full reset
  resetGame: () =>
    set({
      screen: SCREENS.MENU,
      roomCode: "",
      myId: "",
      opponentId: "",
      lobbyPlayers: {},
      myCharacter: null,
      opponentCharacter: null,
      characterSelections: {},
      players: {},
      round: 1,
      roundWins: {},
      roundState: "waiting",
      roundTimer: 0,
      countdownValue: 0,
      koSlowmo: 0,
      comboDisplay: { count: 0, timer: 0, text: "" },
      hitEffects: [],
      announceText: "",
      matchWinner: null,
      error: "",
    }),
}));

export default useGameStore;
