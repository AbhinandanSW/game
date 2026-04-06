import React, { useState, useEffect, useRef } from "react";
import useGameStore from "../store/gameStore";
import { CHARACTERS, SCREENS } from "../constants";

export default function CharacterSelect({ syncManager }) {
  const [selected, setSelected] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const roomCode = useGameStore((s) => s.roomCode);
  const myId = useGameStore((s) => s.myId);
  const setMyCharacter = useGameStore((s) => s.setMyCharacter);
  const setScreen = useGameStore((s) => s.setScreen);
  const confirmedRef = useRef(false);

  // Single subscription — never re-created
  useEffect(() => {
    if (!roomCode) return;
    let cancelled = false;
    let unsub = null;

    unsub = syncManager.subscribeLobby(roomCode, (data) => {
      if (cancelled) return;
      if (!data.players) return;

      const playerIds = Object.keys(data.players);
      if (playerIds.length !== 2) return;

      // Keep opponent id in store
      const oppId = playerIds.find((id) => id !== myId);
      if (oppId && !useGameStore.getState().opponentId) {
        useGameStore.getState().setOpponentId(oppId);
      }

      // Check if both players selected characters
      const allReady = playerIds.every(
        (id) => data.players[id]?.ready && data.players[id]?.character
      );

      if (allReady && confirmedRef.current) {
        // Set opponent character
        if (oppId) {
          useGameStore.getState().setOpponentCharacter(data.players[oppId].character);
        }

        // Transition once
        cancelled = true;
        if (unsub) { unsub(); unsub = null; }

        // Start game in Firebase if needed
        if (data.state !== "playing") {
          syncManager.startGame(roomCode);
        }
        setTimeout(() => setScreen(SCREENS.FIGHTING), 400);
      }
    });

    return () => {
      cancelled = true;
      if (unsub) { unsub(); unsub = null; }
    };
  }, [roomCode, myId, syncManager, setScreen]);

  const handleConfirm = async () => {
    if (!selected) return;
    setMyCharacter(selected);
    setConfirmed(true);
    confirmedRef.current = true;
    await syncManager.setCharacter(roomCode, myId, selected);
  };

  return (
    <div className="fg-charselect">
      <div className="fg-menu-bg" />
      <div className="fg-charselect-content">
        <h2>SELECT YOUR FIGHTER</h2>

        <div className="fg-char-grid">
          {Object.values(CHARACTERS).map((char) => (
            <div
              key={char.id}
              className={`fg-char-card ${selected === char.id ? "selected" : ""} ${confirmed ? "locked" : ""}`}
              onClick={() => !confirmed && setSelected(char.id)}
              style={{ "--char-color": char.color, "--char-accent": char.accentColor }}
            >
              <div className="fg-char-portrait" style={{ background: `radial-gradient(circle, ${char.accentColor}33, ${char.color}11)` }}>
                <div className="fg-char-silhouette" style={{ color: char.color }}>
                  &#9876;
                </div>
              </div>
              <div className="fg-char-info">
                <h3 style={{ color: char.color }}>{char.name}</h3>
                <p>{char.description}</p>
                <div className="fg-char-stats">
                  <div className="fg-stat">
                    <span>PWR</span>
                    <div className="fg-stat-bar">
                      <div style={{ width: `${char.stats.power * 10}%`, background: char.color }} />
                    </div>
                  </div>
                  <div className="fg-stat">
                    <span>SPD</span>
                    <div className="fg-stat-bar">
                      <div style={{ width: `${char.stats.speed * 10}%`, background: char.color }} />
                    </div>
                  </div>
                  <div className="fg-stat">
                    <span>DEF</span>
                    <div className="fg-stat-bar">
                      <div style={{ width: `${char.stats.defense * 10}%`, background: char.color }} />
                    </div>
                  </div>
                </div>
                <p className="fg-special-name">Special: {char.specialName}</p>
              </div>
            </div>
          ))}
        </div>

        {!confirmed ? (
          <button
            className="fg-btn fg-btn-primary"
            disabled={!selected}
            onClick={handleConfirm}
          >
            {selected ? `CHOOSE ${CHARACTERS[selected]?.name.toUpperCase()}` : "SELECT A FIGHTER"}
          </button>
        ) : (
          <p className="fg-waiting-text">
            Waiting for opponent...
          </p>
        )}
      </div>
    </div>
  );
}
