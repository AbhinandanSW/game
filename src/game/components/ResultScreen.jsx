import React from "react";
import useGameStore from "../store/gameStore";
import { CHARACTERS, SCREENS } from "../constants";

export default function ResultScreen({ syncManager }) {
  const matchWinner = useGameStore((s) => s.matchWinner);
  const myId = useGameStore((s) => s.myId);
  const players = useGameStore((s) => s.players);
  const roundWins = useGameStore((s) => s.roundWins);

  const isWinner = matchWinner === myId;
  const winnerPlayer = players[matchWinner];
  const winnerChar = winnerPlayer ? CHARACTERS[winnerPlayer.characterId] : null;

  const handleRematch = () => {
    const state = useGameStore.getState();
    state.setRound(1);
    state.setRoundWins({});
    state.setMatchWinner(null);
    state.resetRound();
    state.setScreen(SCREENS.FIGHTING);
  };

  const handleQuit = () => {
    syncManager.cleanup();
    useGameStore.getState().resetGame();
  };

  return (
    <div className="fg-result">
      <div className="fg-menu-bg" />
      <div className="fg-result-content">
        <div
          className="fg-result-banner"
          style={{ color: winnerChar?.color || "#ffd700" }}
        >
          {isWinner ? "VICTORY" : "DEFEAT"}
        </div>

        <div className="fg-result-character">
          <div
            className="fg-result-icon"
            style={{ color: winnerChar?.color }}
          >
            &#9876;
          </div>
          <div
            className="fg-result-name"
            style={{ color: winnerChar?.color }}
          >
            {winnerChar?.name || "???"} WINS
          </div>
        </div>

        <div className="fg-result-scores">
          {Object.keys(roundWins).map((pid) => {
            const p = players[pid];
            const c = p ? CHARACTERS[p.characterId] : null;
            return (
              <div key={pid} className="fg-result-player">
                <span style={{ color: c?.color }}>{c?.name || "???"}</span>
                <span>{roundWins[pid]} rounds won</span>
              </div>
            );
          })}
        </div>

        <div className="fg-result-buttons">
          <button className="fg-btn fg-btn-primary" onClick={handleRematch}>
            REMATCH
          </button>
          <button className="fg-btn fg-btn-secondary" onClick={handleQuit}>
            QUIT
          </button>
        </div>
      </div>
    </div>
  );
}
