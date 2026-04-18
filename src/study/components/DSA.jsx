import React, { useState, useMemo } from "react";
import useStudyStore from "../store/useStudyStore";
import { ALL_DSA } from "../data/dsa";
import { setProgress } from "../../firebase";

export default function DSA() {
  const [track, setTrack] = useState("all");
  const [diff, setDiff] = useState("all");
  const [search, setSearch] = useState("");
  const navigate = useStudyStore((s) => s.navigate);
  const progress = useStudyStore((s) => s.progress);
  const updateLocal = useStudyStore((s) => s.updateProgressLocal);
  const user = useStudyStore((s) => s.user);
  const setToast = useStudyStore((s) => s.setToast);

  const filtered = useMemo(() => {
    let list = ALL_DSA;
    if (track !== "all") list = list.filter((p) => p.track === track);
    if (diff !== "all") list = list.filter((p) => p.d === diff);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.n.toLowerCase().includes(q) ||
        (p.t || "").toLowerCase().includes(q) ||
        (p.c || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [track, diff, search]);

  const toggleDone = async (p) => {
    const current = !!progress[p.id]?.done;
    updateLocal(p.id, { done: !current });
    if (user) {
      await setProgress(user.uid, p.id, { done: !current });
      setToast(!current ? "Marked complete" : "Marked incomplete");
    }
  };

  return (
    <section className="sp-section">
      <div className="sp-section-head">
        <h2><span className="num">02</span>DSA Problems</h2>
        <p className="sp-section-desc">
          The {ALL_DSA.length} problems that define interview prep. Click a problem to open the IDE and solve it.
        </p>
      </div>

      <div className="sp-filters">
        <div className="sp-filter-group">
          <span className="sp-filter-label">Track</span>
          {[["all", "All"], ["common", "Common"], ["fe", "FE Only"], ["be", "BE Only"]].map(([v, l]) => (
            <button key={v} className={`sp-chip ${track === v ? "active" : ""}`} onClick={() => setTrack(v)}>{l}</button>
          ))}
        </div>
        <div className="sp-filter-group">
          <span className="sp-filter-label">Difficulty</span>
          {["all", "Easy", "Medium", "Hard"].map((v) => (
            <button key={v} className={`sp-chip ${diff === v ? "active" : ""}`} onClick={() => setDiff(v)}>{v === "all" ? "All" : v}</button>
          ))}
        </div>
        <input
          className="sp-search"
          placeholder="Search by name or topic..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="sp-problem-grid">
        {filtered.map((p) => {
          const done = !!progress[p.id]?.done;
          const hasCode = !!progress[p.id]?.code;
          return (
            <div
              key={p.id}
              className={`sp-problem ${done ? "done" : ""}`}
              onClick={() => navigate("dsa", p.id)}
            >
              <div
                className={`sp-check ${done ? "checked" : ""}`}
                onClick={(e) => { e.stopPropagation(); toggleDone(p); }}
              />
              <div className="sp-p-main">
                <div className="sp-p-name">
                  {p.n}
                  {hasCode && <span className="sp-code-tag">Code saved</span>}
                </div>
                <div className="sp-p-meta">
                  <span>{p.t}</span>
                  {p.c && <span>{p.c}</span>}
                </div>
                {p.i && <div className="sp-p-insight">{p.i}</div>}
              </div>
              <DiffBadge d={p.d} />
              <PrioBadge p={p.p} />
              {p.lc && <span className="sp-lc">LC {p.lc}</span>}
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && <div className="sp-empty">No problems match your filters.</div>}
    </section>
  );
}

function DiffBadge({ d }) {
  if (!d) return null;
  const cls = d === "Easy" ? "sp-b-easy" : d === "Medium" ? "sp-b-med" : "sp-b-hard";
  return <span className={`sp-badge ${cls}`}>{d}</span>;
}
function PrioBadge({ p }) {
  if (!p) return null;
  const cls = p === "P0" ? "sp-b-p0" : p === "P1" ? "sp-b-p1" : "sp-b-p2";
  return <span className={`sp-badge ${cls}`}>{p}</span>;
}
