import React, { useState, useMemo } from "react";
import useStudyStore from "../store/useStudyStore";
import { JS_PROBLEMS } from "../data/jsProblems";
import { setProgress } from "../../firebase";

export default function JSProblems() {
  const [cat, setCat] = useState("all");
  const navigate = useStudyStore((s) => s.navigate);
  const progress = useStudyStore((s) => s.progress);
  const updateLocal = useStudyStore((s) => s.updateProgressLocal);
  const user = useStudyStore((s) => s.user);
  const setToast = useStudyStore((s) => s.setToast);

  const cats = ["all", ...Array.from(new Set(JS_PROBLEMS.map((p) => p.cat)))];
  const list = useMemo(
    () => (cat === "all" ? JS_PROBLEMS : JS_PROBLEMS.filter((p) => p.cat === cat)),
    [cat]
  );

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
        <h2><span className="num">07</span>JavaScript &amp; Prototype Problems</h2>
        <p className="sp-section-desc">Polyfills, closures, async, utilities, prototype mechanics. Click to open the IDE.</p>
      </div>

      <div className="sp-filters">
        <div className="sp-filter-group">
          <span className="sp-filter-label">Category</span>
          {cats.map((c) => (
            <button key={c} className={`sp-chip ${cat === c ? "active" : ""}`} onClick={() => setCat(c)}>
              {c === "all" ? "All" : c}
            </button>
          ))}
        </div>
      </div>

      <div className="sp-problem-grid">
        {list.map((p) => {
          const done = !!progress[p.id]?.done;
          const hasCode = !!progress[p.id]?.code;
          return (
            <div key={p.id} className={`sp-problem ${done ? "done" : ""}`} onClick={() => navigate("js-problems", p.id)}>
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
                  <span>{p.cat}</span>
                  <span>{p.concepts}</span>
                  <span>{p.c}</span>
                </div>
                <div className="sp-p-insight">{p.hint}</div>
              </div>
              <span className={`sp-badge ${p.d === "Easy" ? "sp-b-easy" : p.d === "Medium" ? "sp-b-med" : "sp-b-hard"}`}>{p.d}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
