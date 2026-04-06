import React, { useEffect, useRef } from "react";
import useGameStore from "../store/gameStore";
import { SCREENS } from "../constants";

export default function Lobby({ syncManager }) {
  const roomCode = useGameStore((s) => s.roomCode);
  const myId = useGameStore((s) => s.myId);
  const setScreen = useGameStore((s) => s.setScreen);
  const setOpponentId = useGameStore((s) => s.setOpponentId);
  const setError = useGameStore((s) => s.setError);
  const error = useGameStore((s) => s.error);
  const lobbyPlayers = useGameStore((s) => s.lobbyPlayers);
  const setLobbyPlayers = useGameStore((s) => s.setLobbyPlayers);

  useEffect(() => {
    let cancelled = false;
    let unsub = null;

    const init = async () => {
      try {
        // Try to join first (if room exists), fall back to create
        try {
          await syncManager.joinRoom(roomCode, myId);
        } catch {
          await syncManager.createRoom(roomCode, myId);
        }

        if (cancelled) return;

        // Subscribe to lobby
        unsub = syncManager.subscribeLobby(roomCode, (data) => {
          if (cancelled) return;
          if (!data.players) return;

          setLobbyPlayers(data.players);

          const playerIds = Object.keys(data.players);
          if (playerIds.length === 2) {
            const oppId = playerIds.find((id) => id !== myId);
            if (oppId) setOpponentId(oppId);

            // Move to character select
            cancelled = true;
            if (unsub) { unsub(); unsub = null; }
            setScreen(SCREENS.CHARACTER_SELECT);
          }
        });
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    };

    init();

    return () => {
      cancelled = true;
      if (unsub) { unsub(); unsub = null; }
    };
  }, [roomCode, myId, syncManager, setScreen, setOpponentId, setError, setLobbyPlayers]);

  const playerIds = Object.keys(lobbyPlayers);

  return (
    <div className="fg-lobby">
      <div className="fg-menu-bg" />
      <div className="fg-lobby-content">
        <h2>BATTLE LOBBY</h2>

        <div className="fg-room-code">
          <span className="fg-room-label">ROOM CODE</span>
          <span className="fg-room-value">{roomCode}</span>
          <button
            className="fg-btn-small"
            onClick={() => navigator.clipboard?.writeText(roomCode)}
          >
            COPY
          </button>
        </div>

        <div className="fg-player-slots">
          <div className={`fg-player-slot ${playerIds.length >= 1 ? "filled" : ""}`}>
            <div className="fg-slot-icon">P1</div>
            <div className="fg-slot-label">
              {playerIds.length >= 1
                ? playerIds[0] === myId
                  ? "YOU"
                  : "OPPONENT"
                : "WAITING..."}
            </div>
          </div>
          <div className="fg-vs-text">VS</div>
          <div className={`fg-player-slot ${playerIds.length >= 2 ? "filled" : ""}`}>
            <div className="fg-slot-icon">P2</div>
            <div className="fg-slot-label">
              {playerIds.length >= 2
                ? playerIds[1] === myId
                  ? "YOU"
                  : "OPPONENT"
                : "WAITING..."}
            </div>
          </div>
        </div>

        {playerIds.length < 2 && (
          <p className="fg-waiting-text">
            Waiting for opponent to join...
          </p>
        )}

        {error && <p className="fg-error">{error}</p>}

        <button
          className="fg-btn fg-btn-back"
          onClick={() => {
            syncManager.cleanup();
            useGameStore.getState().resetGame();
          }}
        >
          BACK
        </button>
      </div>
    </div>
  );
}
