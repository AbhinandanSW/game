import React, { useState } from "react";
import useGameStore from "../store/gameStore";
import { SCREENS } from "../constants";

export default function Menu() {
  const [joinCode, setJoinCode] = useState("");
  const setScreen = useGameStore((s) => s.setScreen);
  const setRoomCode = useGameStore((s) => s.setRoomCode);
  const setMyId = useGameStore((s) => s.setMyId);
  const error = useGameStore((s) => s.error);
  const setError = useGameStore((s) => s.setError);

  const generateId = () => Math.random().toString(36).slice(2, 8);
  const generateRoom = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const handleCreate = () => {
    const code = generateRoom();
    const id = generateId();
    setRoomCode(code);
    setMyId(id);
    setError("");
    setScreen(SCREENS.LOBBY);
  };

  const handleJoin = () => {
    if (joinCode.length < 3) {
      setError("Enter a valid room code");
      return;
    }
    const id = generateId();
    setRoomCode(joinCode.toUpperCase());
    setMyId(id);
    setError("");
    setScreen(SCREENS.LOBBY);
  };

  return (
    <div className="fg-menu">
      <div className="fg-menu-bg" />
      <div className="fg-menu-content">
        <h1 className="fg-title">
          <span className="fg-title-icon">&#9876;</span>
          IRON FIST
          <span className="fg-title-icon">&#9876;</span>
        </h1>
        <p className="fg-subtitle">3D FIGHTING ARENA</p>

        <div className="fg-menu-panel">
          <button className="fg-btn fg-btn-primary" onClick={handleCreate}>
            CREATE ROOM
          </button>

          <div className="fg-divider">
            <span>OR</span>
          </div>

          <div className="fg-join-row">
            <input
              className="fg-input"
              placeholder="ROOM CODE"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={5}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />
            <button className="fg-btn fg-btn-secondary" onClick={handleJoin}>
              JOIN
            </button>
          </div>

          {error && <p className="fg-error">{error}</p>}
        </div>

        <div className="fg-controls-info">
          <h3>CONTROLS</h3>
          <div className="fg-controls-grid">
            <span>A/D</span><span>Move Left / Right</span>
            <span>W/SPACE</span><span>Jump</span>
            <span>S</span><span>Crouch</span>
            <span>J</span><span>Light Punch</span>
            <span>K</span><span>Light Kick</span>
            <span>U</span><span>Heavy Punch</span>
            <span>I</span><span>Heavy Kick</span>
            <span>L</span><span>Block</span>
            <span>Q</span><span>Special Attack</span>
            <span>SHIFT</span><span>Dash</span>
          </div>
        </div>
      </div>
    </div>
  );
}
