import React, { useState } from "react";
import useStudyStore from "../store/useStudyStore";
import { SYSTEM_DESIGN } from "../data/systemDesign";

export default function SystemDesign() {
  const [track, setTrack] = useState("all");
  const navigate = useStudyStore((s) => s.navigate);
  const answers = useStudyStore((s) => s.answers);

  const list = track === "all" ? SYSTEM_DESIGN : SYSTEM_DESIGN.filter((s) => s.track === track);

  return (
    <section className="sp-section">
      <div className="sp-section-head">
        <h2><span className="num">03</span>System Design</h2>
        <p className="sp-section-desc">
          Click a topic to see the full problem, write your answer, and compare with the reference approach.
        </p>
      </div>

      <div className="sp-filters">
        <div className="sp-filter-group">
          <span className="sp-filter-label">Focus</span>
          {[["all", "All"], ["both", "Overlap"], ["fe", "FE Only"], ["be", "BE Only"]].map(([v, l]) => (
            <button key={v} className={`sp-chip ${track === v ? "active" : ""}`} onClick={() => setTrack(v)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="sp-sd-grid">
        {list.map((s) => {
          const hasAnswer = !!answers[s.id]?.text;
          const tagLabel = s.track === "both" ? "Both Tracks" : s.track === "fe" ? "Frontend Focus" : "Backend Focus";
          return (
            <div key={s.id} className="sp-sd-card" onClick={() => navigate("system-design", s.id)}>
              <span className={`sp-sd-tag ${s.track}`}>◆ {tagLabel}</span>
              <h3>{s.title}</h3>
              <p className="sp-sd-excerpt">{s.prompt?.slice(0, 140)}...</p>
              {s.scale && <div className="sp-sd-scale">⚡ {s.scale}</div>}
              {hasAnswer && <div className="sp-sd-answered">✓ Answer saved</div>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
