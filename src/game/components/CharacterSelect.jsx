import React, { useState, useEffect, useRef, useCallback } from "react";
import useGameStore from "../store/gameStore";
import { CHARACTERS, SCREENS } from "../constants";

const chars = Object.values(CHARACTERS);

// Draw a mini fighter preview on a canvas
function drawFighterPreview(canvas, char, selected, time) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Background glow
  const glow = ctx.createRadialGradient(w / 2, h * 0.55, 0, w / 2, h * 0.55, w * 0.45);
  glow.addColorStop(0, char.color + (selected ? "30" : "15"));
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // Floor line
  const floorY = h * 0.82;
  ctx.strokeStyle = char.color + "44";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w * 0.15, floorY);
  ctx.lineTo(w * 0.85, floorY);
  ctx.stroke();

  // Fighter
  const cx = w / 2;
  const bob = Math.sin(time * 2.5) * 2;
  const s = w * 0.013;
  const bodyColor = char.color;
  const accent = char.accentColor;
  const skin = "#ffccaa";

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.beginPath();
  ctx.ellipse(cx, floorY, s * 14, s * 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Selected glow under feet
  if (selected) {
    const fg = ctx.createRadialGradient(cx, floorY, 0, cx, floorY, s * 20);
    fg.addColorStop(0, char.color + "40");
    fg.addColorStop(1, "transparent");
    ctx.fillStyle = fg;
    ctx.fillRect(cx - s * 20, floorY - s * 5, s * 40, s * 10);
  }

  const baseY = floorY + bob;

  // Back leg
  ctx.strokeStyle = bodyColor;
  ctx.lineWidth = s * 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx - s * 3, baseY - s * 38);
  ctx.lineTo(cx - s * 6, baseY - s * 20);
  ctx.stroke();
  ctx.strokeStyle = skin;
  ctx.lineWidth = s * 4;
  ctx.beginPath();
  ctx.moveTo(cx - s * 6, baseY - s * 20);
  ctx.lineTo(cx - s * 4, baseY - s * 2);
  ctx.stroke();

  // Back arm
  ctx.strokeStyle = bodyColor;
  ctx.lineWidth = s * 4.5;
  ctx.beginPath();
  ctx.moveTo(cx - s * 4, baseY - s * 62);
  ctx.lineTo(cx - s * 10, baseY - s * 54);
  ctx.stroke();
  ctx.strokeStyle = skin;
  ctx.lineWidth = s * 3.5;
  ctx.beginPath();
  ctx.moveTo(cx - s * 10, baseY - s * 54);
  ctx.lineTo(cx - s * 6, baseY - s * 46);
  ctx.stroke();

  // Torso
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.roundRect(cx - s * 10, baseY - s * 68, s * 20, s * 30, s * 3);
  ctx.fill();

  // Belt
  ctx.fillStyle = accent;
  ctx.fillRect(cx - s * 11, baseY - s * 40, s * 22, s * 5);

  // Front leg
  ctx.strokeStyle = bodyColor;
  ctx.lineWidth = s * 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx + s * 4, baseY - s * 38);
  ctx.lineTo(cx + s * 8, baseY - s * 20);
  ctx.stroke();
  ctx.strokeStyle = skin;
  ctx.lineWidth = s * 5;
  ctx.beginPath();
  ctx.moveTo(cx + s * 8, baseY - s * 20);
  ctx.lineTo(cx + s * 6, baseY - s * 2);
  ctx.stroke();
  // Shoe
  ctx.fillStyle = "#222";
  ctx.fillRect(cx + s * 3, baseY - s * 4, s * 8, s * 3);

  // Front arm
  ctx.strokeStyle = bodyColor;
  ctx.lineWidth = s * 4.5;
  ctx.beginPath();
  ctx.moveTo(cx + s * 10, baseY - s * 62);
  ctx.lineTo(cx + s * 18, baseY - s * 54 + bob * 0.5);
  ctx.stroke();
  ctx.strokeStyle = accent;
  ctx.lineWidth = s * 3.5;
  ctx.beginPath();
  ctx.moveTo(cx + s * 18, baseY - s * 54 + bob * 0.5);
  ctx.lineTo(cx + s * 16, baseY - s * 44 + bob * 0.5);
  ctx.stroke();
  // Fist
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(cx + s * 16, baseY - s * 43 + bob * 0.5, s * 4, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(cx, baseY - s * 76 + bob * 0.3, s * 10, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = "#331111";
  ctx.beginPath();
  ctx.arc(cx, baseY - s * 79 + bob * 0.3, s * 11, Math.PI, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(cx + s * 3, baseY - s * 76 + bob * 0.3, s * 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(cx + s * 4, baseY - s * 76 + bob * 0.3, s * 1.5, 0, Math.PI * 2);
  ctx.fill();
}

export default function CharacterSelect({ syncManager }) {
  const [selected, setSelected] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [hovered, setHovered] = useState(null);
  const roomCode = useGameStore((s) => s.roomCode);
  const myId = useGameStore((s) => s.myId);
  const setMyCharacter = useGameStore((s) => s.setMyCharacter);
  const setScreen = useGameStore((s) => s.setScreen);
  const confirmedRef = useRef(false);
  const canvasRefs = useRef({});
  const animRef = useRef(null);
  const timeRef = useRef(0);

  // Animate fighter previews
  useEffect(() => {
    const loop = (now) => {
      timeRef.current = now * 0.001;
      chars.forEach((char) => {
        const canvas = canvasRefs.current[char.id];
        if (canvas) {
          drawFighterPreview(canvas, char, selected === char.id, timeRef.current);
        }
      });
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [selected]);

  // Firebase subscription
  useEffect(() => {
    if (!roomCode) return;
    let cancelled = false;
    let unsub = null;

    unsub = syncManager.subscribeLobby(roomCode, (data) => {
      if (cancelled) return;
      if (!data.players) return;

      const playerIds = Object.keys(data.players);
      if (playerIds.length !== 2) return;

      const oppId = playerIds.find((id) => id !== myId);
      if (oppId && !useGameStore.getState().opponentId) {
        useGameStore.getState().setOpponentId(oppId);
      }

      const allReady = playerIds.every(
        (id) => data.players[id]?.ready && data.players[id]?.character
      );

      if (allReady && confirmedRef.current) {
        if (oppId) {
          useGameStore.getState().setOpponentCharacter(data.players[oppId].character);
        }
        cancelled = true;
        if (unsub) { unsub(); unsub = null; }
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

  const activeChar = selected ? CHARACTERS[selected] : hovered ? CHARACTERS[hovered] : null;

  return (
    <div className="fg-charselect">
      <div className="fg-menu-bg" />

      {/* Colored background accent for selected character */}
      {activeChar && (
        <div
          className="fg-cs-bg-accent"
          style={{
            background: `radial-gradient(ellipse at 50% 60%, ${activeChar.color}12 0%, transparent 70%)`,
          }}
        />
      )}

      <div className="fg-cs-layout">
        {/* Header */}
        <div className="fg-cs-header">
          <h2>CHOOSE YOUR FIGHTER</h2>
          <div className="fg-cs-header-line" />
        </div>

        {/* Main area: roster + detail panel */}
        <div className="fg-cs-main">
          {/* Character roster */}
          <div className="fg-cs-roster">
            {chars.map((char) => (
              <div
                key={char.id}
                className={`fg-cs-slot ${selected === char.id ? "selected" : ""} ${confirmed ? "locked" : ""}`}
                onClick={() => !confirmed && setSelected(char.id)}
                onMouseEnter={() => setHovered(char.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ "--c": char.color, "--ca": char.accentColor }}
              >
                <canvas
                  ref={(el) => { canvasRefs.current[char.id] = el; }}
                  width={160}
                  height={200}
                  className="fg-cs-canvas"
                />
                <div className="fg-cs-slot-name">{char.name}</div>
                {selected === char.id && <div className="fg-cs-slot-check">&#10003;</div>}
              </div>
            ))}
          </div>

          {/* Detail panel */}
          <div className="fg-cs-detail" style={{ "--c": activeChar?.color || "#666", "--ca": activeChar?.accentColor || "#888" }}>
            {activeChar ? (
              <>
                <div className="fg-cs-detail-name" style={{ color: activeChar.color }}>
                  {activeChar.name}
                </div>
                <div className="fg-cs-detail-desc">{activeChar.description}</div>

                <div className="fg-cs-detail-special">
                  <span className="fg-cs-label">SPECIAL</span>
                  <span style={{ color: activeChar.accentColor }}>{activeChar.specialName}</span>
                </div>

                <div className="fg-cs-stats">
                  {[
                    { label: "POWER", val: activeChar.stats.power },
                    { label: "SPEED", val: activeChar.stats.speed },
                    { label: "DEFENSE", val: activeChar.stats.defense },
                  ].map((stat) => (
                    <div key={stat.label} className="fg-cs-stat-row">
                      <span className="fg-cs-stat-label">{stat.label}</span>
                      <div className="fg-cs-stat-track">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div
                            key={i}
                            className={`fg-cs-stat-pip ${i < stat.val ? "filled" : ""}`}
                            style={i < stat.val ? { background: activeChar.color, boxShadow: `0 0 4px ${activeChar.color}88` } : {}}
                          />
                        ))}
                      </div>
                      <span className="fg-cs-stat-val">{stat.val}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="fg-cs-detail-empty">
                Select a fighter
              </div>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="fg-cs-bottom">
          {!confirmed ? (
            <button
              className="fg-btn fg-btn-primary fg-cs-confirm"
              disabled={!selected}
              onClick={handleConfirm}
              style={selected ? { background: `linear-gradient(135deg, ${CHARACTERS[selected].color}, ${CHARACTERS[selected].color}bb)`, boxShadow: `0 4px 20px ${CHARACTERS[selected].color}44` } : {}}
            >
              {selected ? `LOCK IN ${CHARACTERS[selected].name.toUpperCase()}` : "SELECT A FIGHTER"}
            </button>
          ) : (
            <div className="fg-cs-locked-msg">
              <span style={{ color: CHARACTERS[selected]?.color }}>
                {CHARACTERS[selected]?.name}
              </span>
              {" "}locked in — waiting for opponent...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
