import React from "react";
import useGameStore from "../store/gameStore";
import { CHARACTERS, MAX_HP, MAX_STAMINA, ROUNDS_TO_WIN } from "../constants";

export default function HUD() {
  const players = useGameStore((s) => s.players);
  const myId = useGameStore((s) => s.myId);
  const opponentId = useGameStore((s) => s.opponentId);
  const round = useGameStore((s) => s.round);
  const roundTimer = useGameStore((s) => s.roundTimer);
  const roundWins = useGameStore((s) => s.roundWins);
  const comboDisplay = useGameStore((s) => s.comboDisplay);
  const announceText = useGameStore((s) => s.announceText);
  const countdownValue = useGameStore((s) => s.countdownValue);
  const roundState = useGameStore((s) => s.roundState);

  const p1 = players[myId];
  const p2 = players[opponentId];

  if (!p1 || !p2) return null;

  const char1 = CHARACTERS[p1.characterId];
  const char2 = CHARACTERS[p2.characterId];

  const timerSeconds = Math.max(0, Math.ceil(roundTimer));
  const p1Wins = roundWins[myId] || 0;
  const p2Wins = roundWins[opponentId] || 0;

  return (
    <div className="fg-hud">
      {/* Health Bars */}
      <div className="fg-hud-top">
        {/* P1 Health */}
        <div className="fg-health-section fg-health-left">
          <div className="fg-player-name" style={{ color: char1?.color }}>
            {char1?.name || "P1"}
          </div>
          <div className="fg-health-bar-container">
            <div
              className="fg-health-bar"
              style={{
                width: `${(p1.hp / MAX_HP) * 100}%`,
                background: `linear-gradient(90deg, ${char1?.color}, ${char1?.accentColor})`,
              }}
            />
            <div className="fg-health-text">{Math.ceil(p1.hp)}</div>
          </div>
          <div className="fg-stamina-bar-container">
            <div
              className="fg-stamina-bar"
              style={{ width: `${(p1.stamina / MAX_STAMINA) * 100}%` }}
            />
          </div>
          {/* Round wins */}
          <div className="fg-round-dots">
            {Array.from({ length: ROUNDS_TO_WIN }).map((_, i) => (
              <div
                key={i}
                className={`fg-round-dot ${i < p1Wins ? "won" : ""}`}
                style={{ borderColor: char1?.color }}
              />
            ))}
          </div>
        </div>

        {/* Timer & Round */}
        <div className="fg-timer-section">
          <div className="fg-round-label">ROUND {round}</div>
          <div className="fg-timer">{timerSeconds}</div>
        </div>

        {/* P2 Health */}
        <div className="fg-health-section fg-health-right">
          <div className="fg-player-name" style={{ color: char2?.color }}>
            {char2?.name || "P2"}
          </div>
          <div className="fg-health-bar-container">
            <div
              className="fg-health-bar fg-health-bar-right"
              style={{
                width: `${(p2.hp / MAX_HP) * 100}%`,
                background: `linear-gradient(270deg, ${char2?.color}, ${char2?.accentColor})`,
              }}
            />
            <div className="fg-health-text">{Math.ceil(p2.hp)}</div>
          </div>
          <div className="fg-stamina-bar-container">
            <div
              className="fg-stamina-bar fg-stamina-right"
              style={{ width: `${(p2.stamina / MAX_STAMINA) * 100}%` }}
            />
          </div>
          <div className="fg-round-dots fg-round-dots-right">
            {Array.from({ length: ROUNDS_TO_WIN }).map((_, i) => (
              <div
                key={i}
                className={`fg-round-dot ${i < p2Wins ? "won" : ""}`}
                style={{ borderColor: char2?.color }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Combo Display */}
      {comboDisplay.timer > 0 && comboDisplay.count > 1 && (
        <div className="fg-combo-display">
          <div className="fg-combo-count">{comboDisplay.count}</div>
          <div className="fg-combo-label">
            {comboDisplay.text || `${comboDisplay.count} HIT COMBO`}
          </div>
        </div>
      )}

      {/* Countdown */}
      {roundState === "countdown" && countdownValue > 0 && (
        <div className="fg-announcement fg-countdown">
          {countdownValue}
        </div>
      )}

      {/* Fight announcement */}
      {announceText && (
        <div className="fg-announcement">
          {announceText}
        </div>
      )}
    </div>
  );
}
