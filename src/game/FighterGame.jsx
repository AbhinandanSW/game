import React, { useRef, useEffect, useMemo } from "react";
import useGameStore from "./store/gameStore";
import Canvas2D from "./engine/Canvas2D";
import CombatSystem from "./combat/CombatSystem";
import InputManager from "./controls/InputManager";
import SyncManager from "./multiplayer/SyncManager";
import Menu from "./components/Menu";
import Lobby from "./components/Lobby";
import CharacterSelect from "./components/CharacterSelect";
import HUD from "./components/HUD";
import ResultScreen from "./components/ResultScreen";
import {
  SCREENS,
  CHARACTERS,
  ROUND_TIME,
  COUNTDOWN_TIME,
  ROUNDS_TO_WIN,
  KO_SLOWMO_DURATION,
  FPS,
} from "./constants";

export default function FighterGame() {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const combatRef = useRef(null);
  const inputRef = useRef(null);
  const syncManagerRef = useRef(null);
  const gameLoopRef = useRef(null);
  const frameCountRef = useRef(0);
  const countdownRef = useRef(0);
  const koTimerRef = useRef(0);

  const screen = useGameStore((s) => s.screen);

  const syncManager = useMemo(() => {
    if (!syncManagerRef.current) {
      syncManagerRef.current = new SyncManager(useGameStore);
    }
    return syncManagerRef.current;
  }, []);

  // Game loop
  useEffect(() => {
    if (screen !== SCREENS.FIGHTING) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const store = useGameStore;
    const state = store.getState();
    const { myId, opponentId, myCharacter, opponentCharacter } = state;

    if (!myId || !opponentId || !myCharacter || !opponentCharacter) return;

    // Initialize systems
    const renderer = new Canvas2D(canvas);
    rendererRef.current = renderer;
    renderer.setFighters(myId, myCharacter, opponentId, opponentCharacter);

    const combat = new CombatSystem(store);
    combatRef.current = combat;

    const input = new InputManager();
    input.bind();
    inputRef.current = input;

    // Init player states
    store.getState().initPlayers(myId, opponentId, myCharacter, opponentCharacter);
    store.getState().setRoundState("countdown");
    store.getState().setRound(store.getState().round || 1);

    // Subscribe to opponent
    syncManager.subscribeGameState(state.roomCode, opponentId, () => {});

    syncManager.subscribeHitEvents(state.roomCode, myId, (events) => {
      if (!events) return;
      const latest = Array.isArray(events) ? events[events.length - 1] : events;
      if (latest && latest.timestamp > (state._lastHitTimestamp || 0)) {
        const me = store.getState().players[myId];
        if (me && !me.dead && !me.invincible) {
          store.getState().updatePlayer(myId, {
            hp: Math.max(0, me.hp - (latest.damage || 0)),
            hitstun: latest.hitstun || 15,
            vx: latest.knockbackX || 0,
            vy: latest.knockbackY || 0,
            dead: me.hp - (latest.damage || 0) <= 0,
          });
        }
      }
    });

    frameCountRef.current = 0;
    countdownRef.current = COUNTDOWN_TIME * FPS;
    koTimerRef.current = 0;

    store.getState().setCountdownValue(COUNTDOWN_TIME);
    store.getState().setRoundWins(store.getState().roundWins || {});

    let lastTime = performance.now();

    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      frameCountRef.current++;

      const currentState = store.getState();
      const roundState = currentState.roundState;
      const p1 = currentState.players[myId];
      const p2 = currentState.players[opponentId];

      if (!p1 || !p2) {
        renderer.render(currentState.players, myId, opponentId, combat, dt);
        gameLoopRef.current = requestAnimationFrame(loop);
        return;
      }

      input.update();

      // ─── COUNTDOWN ───
      if (roundState === "countdown") {
        countdownRef.current--;
        const secondsLeft = Math.ceil(countdownRef.current / FPS);
        if (secondsLeft !== currentState.countdownValue) {
          store.getState().setCountdownValue(secondsLeft);
        }
        if (countdownRef.current <= 0) {
          store.getState().setRoundState("fighting");
          store.getState().setAnnounceText("FIGHT!");
          setTimeout(() => store.getState().setAnnounceText(""), 1000);
          store.getState().setRoundTimer(ROUND_TIME);
        }
      }

      // ─── FIGHTING ───
      if (roundState === "fighting") {
        const newTimer = currentState.roundTimer - dt;
        store.getState().setRoundTimer(newTimer);

        // Input
        const moveX = input.getMovement();
        const attack = input.getAttack();
        const jump = input.isJustPressed("JUMP");
        const block = input.isDown("BLOCK");
        const crouch = input.isDown("CROUCH");
        const dash = input.isJustPressed("DASH");

        combat.processInput(myId, { moveX, attack, jump, block, crouch, dash }, frameCountRef.current);
        combat.updateAttackState(myId);
        combat.autoFace(myId, opponentId);
        combat.updatePhysics(myId);

        // Hit detection
        const hitResult = combat.checkHit(myId, opponentId);
        if (hitResult) {
          const char = CHARACTERS[p1.characterId];
          if (hitResult.isKO) {
            renderer.spawnSpecialEffect(hitResult.hitX, hitResult.hitY, char?.color || "#ffffff");
            renderer.triggerShake(0.5);
          } else if (hitResult.blocked) {
            renderer.spawnHitParticles(hitResult.hitX, hitResult.hitY, "#8888ff", 6);
            renderer.triggerShake(0.1);
          } else {
            renderer.spawnHitParticles(hitResult.hitX, hitResult.hitY, char?.color || "#ffffff");
            renderer.triggerShake(0.2);
          }

          syncManager.queueHitEvent({
            damage: hitResult.damage,
            hitstun: hitResult.blocked ? 5 : 15,
            knockbackX: p1.facing * 0.1,
            knockbackY: hitResult.attackKey === "uppercut" ? 0.15 : 0,
          });
        }

        // Remote player interpolation
        const remoteLerp = syncManager.interpolateRemote(opponentId);
        if (remoteLerp) {
          store.getState().updatePlayer(opponentId, remoteLerp);
        }

        // Check KO
        const us = store.getState();
        const up1 = us.players[myId];
        const up2 = us.players[opponentId];

        if (up1.dead || up2.dead) {
          store.getState().setRoundState("ko");
          koTimerRef.current = KO_SLOWMO_DURATION;
          renderer.setSlowmo(0.3);
          store.getState().setAnnounceText("K.O.!");
        }

        if (newTimer <= 0) {
          store.getState().setRoundState("ko");
          koTimerRef.current = KO_SLOWMO_DURATION;
          store.getState().setAnnounceText("TIME!");
        }

        // Sync
        const myData = store.getState().players[myId];
        const animState = combat.getAnimState(myId);
        syncManager.syncPlayerState(currentState.roomCode, myId, myData, animState);

        // Combo timer
        if (currentState.comboDisplay.timer > 0) {
          store.getState().setComboDisplay({
            ...currentState.comboDisplay,
            timer: currentState.comboDisplay.timer - 1,
          });
        }
      }

      // ─── KO ───
      if (roundState === "ko") {
        koTimerRef.current--;
        if (koTimerRef.current <= 0) {
          renderer.setSlowmo(1);
          store.getState().setAnnounceText("");

          const st = store.getState();
          const rp1 = st.players[myId];
          const rp2 = st.players[opponentId];
          const roundWinner = rp1.dead ? opponentId : rp1.hp >= rp2.hp ? myId : opponentId;

          const wins = { ...st.roundWins };
          wins[roundWinner] = (wins[roundWinner] || 0) + 1;
          store.getState().setRoundWins(wins);

          if (wins[roundWinner] >= ROUNDS_TO_WIN) {
            store.getState().setMatchWinner(roundWinner);
            store.getState().setRoundState("match_end");
            setTimeout(() => store.getState().setScreen(SCREENS.RESULT), 1500);
          } else {
            store.getState().setRound(st.round + 1);
            store.getState().setRoundState("round_end");
            const winChar = CHARACTERS[st.players[roundWinner]?.characterId];
            store.getState().setAnnounceText(`ROUND ${st.round} - ${winChar?.name || "???"} WINS`);

            setTimeout(() => {
              store.getState().resetRound();
              countdownRef.current = COUNTDOWN_TIME * FPS;
            }, 2000);
          }
        }
      }

      // ─── RENDER ───
      const finalState = store.getState();
      renderer.render(finalState.players, myId, opponentId, combat, dt);
      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      input.unbind();
      renderer.dispose();
      rendererRef.current = null;
      combatRef.current = null;
      inputRef.current = null;
    };
  }, [screen, syncManager]);

  return (
    <div className="fg-container">
      {screen === SCREENS.MENU && <Menu />}
      {screen === SCREENS.LOBBY && <Lobby syncManager={syncManager} />}
      {screen === SCREENS.CHARACTER_SELECT && (
        <CharacterSelect syncManager={syncManager} />
      )}
      {screen === SCREENS.FIGHTING && (
        <div className="fg-game-area">
          <canvas ref={canvasRef} className="fg-canvas" />
          <HUD />
        </div>
      )}
      {screen === SCREENS.RESULT && <ResultScreen syncManager={syncManager} />}
    </div>
  );
}
