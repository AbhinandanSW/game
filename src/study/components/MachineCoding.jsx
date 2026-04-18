import React, { useState } from "react";
import useStudyStore from "../store/useStudyStore";
import { MACHINE_CODING } from "../data/machineCoding";

export default function MachineCoding() {
  const [track, setTrack] = useState("all");
  const navigate = useStudyStore((s) => s.navigate);

  const list = track === "all" ? MACHINE_CODING : MACHINE_CODING.filter((m) => m.track === track);

  return (
    <section className="sp-section">
      <div className="sp-section-head">
        <h2><span className="num">04</span>Machine Coding</h2>
        <p className="sp-section-desc">Low-level design & UI components. Click any to open the IDE.</p>
      </div>

      <div className="sp-filters">
        <div className="sp-filter-group">
          <span className="sp-filter-label">Track</span>
          {[["all", "All"], ["fe", "Frontend UI"], ["be", "Backend LLD"]].map(([v, l]) => (
            <button key={v} className={`sp-chip ${track === v ? "active" : ""}`} onClick={() => setTrack(v)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="sp-mc-grid">
        {list.map((m) => (
          <div key={m.id} className="sp-mc-card" onClick={() => navigate("machine-coding", m.id)}>
            <div className="sp-mc-head">
              <h4>{m.n}</h4>
              <span className="sp-mc-time">{m.t}</span>
            </div>
            <DiffBadge d={m.d} />
            {m.p && <div className="sp-mc-patterns">Patterns: {m.p}</div>}
            <div className="sp-mc-req">{m.r}</div>
            <div className="sp-mc-companies">{m.c}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DiffBadge({ d }) {
  if (!d) return null;
  const cls = d === "Easy" ? "sp-b-easy" : d === "Medium" ? "sp-b-med" : "sp-b-hard";
  return <span className={`sp-badge ${cls}`}>{d}</span>;
}
