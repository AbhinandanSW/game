import React, { useState } from "react";
import { FE_PLAN, BE_PLAN } from "../data/plans";

export default function Plan() {
  const [track, setTrack] = useState("fe");
  const [openDay, setOpenDay] = useState(null);

  const plan = track === "fe" ? FE_PLAN : BE_PLAN;

  return (
    <section className="sp-section">
      <div className="sp-section-head">
        <h2><span className="num">06</span>30-Day Plan</h2>
        <p className="sp-section-desc">A day-by-day schedule balancing theory, DSA, and machine coding.</p>
      </div>

      <div className="sp-plan-tabs">
        <button className={`sp-plan-tab ${track === "fe" ? "active" : ""}`} onClick={() => setTrack("fe")}>Frontend Track</button>
        <button className={`sp-plan-tab ${track === "be" ? "active" : ""}`} onClick={() => setTrack("be")}>Backend Track</button>
      </div>

      <div className="sp-day-grid">
        {plan.map((day) => (
          <div
            key={day.d}
            className={`sp-day ${openDay === day.d ? "open" : ""}`}
            onClick={() => setOpenDay(openDay === day.d ? null : day.d)}
          >
            <div className="sp-day-num">{day.d}<small>Day</small></div>
            <div className="sp-day-main">
              <div className="sp-day-theme">
                {day.th}
                {day.phase && <span className="sp-day-phase"> · {day.phase}</span>}
              </div>
              <div className="sp-day-preview">{day.morn.slice(0, 80)}{day.morn.length > 80 ? "…" : ""}</div>
            </div>
            <div className="sp-day-arrow">▸</div>
            {openDay === day.d && (
              <div className="sp-day-detail">
                <div className="sp-day-block"><h5>Morning · Theory</h5><p>{day.morn}</p></div>
                <div className="sp-day-block"><h5>Afternoon · DSA/Coding</h5><p>{day.aft}</p></div>
                <div className="sp-day-block"><h5>Evening · {track === "fe" ? "Build / System Design" : "Target Companies"}</h5><p>{day.eve}</p></div>
                <div className="sp-day-block" style={{ gridColumn: "1 / -1" }}>
                  <div className="sp-day-deliverable">◆ Deliverable · {day.del}</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
