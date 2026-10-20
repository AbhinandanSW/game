import React, { useState, useMemo, useRef, useEffect } from "react";
import useStudyStore from "../store/useStudyStore";
import { BEHAVIORAL_PROMPTS, STAR_TEMPLATE } from "../data/behavioral";
import { setAnswer } from "../../firebase";
import PageHeader from "./PageHeader";
import Breadcrumbs from "./Breadcrumbs";

export default function Behavioral({ id }) {
  const [level, setLevel] = useState("all");
  const [cat, setCat] = useState("all");
  const [answer, setAnswerLocal] = useState("");
  const navigate = useStudyStore((s) => s.navigate);
  const user = useStudyStore((s) => s.user);
  const answers = useStudyStore((s) => s.answers);
  const setToast = useStudyStore((s) => s.setToast);
  const updateAnswerLocal = useStudyStore((s) => s.updateAnswerLocal);
  const saveTimerRef = useRef(null);

  const levels = ["all", "L1", "L2", "L3"];
  const cats = ["all", ...Array.from(new Set(BEHAVIORAL_PROMPTS.map((p) => p.cat)))];

  // The selected prompt is part of the URL: #/behavioral/<id>
  const selected = useMemo(
    () => (id ? BEHAVIORAL_PROMPTS.find((p) => p.id === id) || null : null),
    [id]
  );

  const filtered = useMemo(() => {
    let list = BEHAVIORAL_PROMPTS;
    if (level !== "all") list = list.filter((p) => p.level === level);
    if (cat !== "all") list = list.filter((p) => p.cat === cat);
    return list;
  }, [level, cat]);

  useEffect(() => {
    if (selected) {
      setAnswerLocal(answers[selected.id]?.text || "");
    }
  }, [selected, answers]);

  const onAnswerChange = (e) => {
    if (!selected) return;
    const v = e.target.value;
    setAnswerLocal(v);
    updateAnswerLocal(selected.id, v);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (user) setAnswer(user.uid, selected.id, v);
    }, 800);
  };

  const answeredCount = BEHAVIORAL_PROMPTS.filter((p) => answers[p.id]?.text).length;

  return (
    <section className="sp-section">
      <PageHeader
        eyebrow="10 · Behavioral"
        title={selected ? selected.n : "Behavioral"}
        description="STAR-based interview prep. Pick a prompt, write your story. Save and refine — recall beats reinvention in the real interview."
        actions={
          <div className="sp-head-stat">
            <strong>{answeredCount}</strong>
            <span>of {BEHAVIORAL_PROMPTS.length} stories written</span>
          </div>
        }
      />

      {selected && <Breadcrumbs section="behavioral" current={selected.n} />}

      <div className="sp-bh-layout">
        <div className="sp-bh-list-wrap">
          <div className="sp-filters">
            <div className="sp-filter-group">
              <span className="sp-filter-label">Level</span>
              {levels.map((l) => (
                <button key={l} className={`sp-chip ${level === l ? "active" : ""}`} onClick={() => setLevel(l)}>
                  {l === "all" ? "All" : l}
                </button>
              ))}
            </div>
            <div className="sp-filter-group">
              <span className="sp-filter-label">Category</span>
              {cats.map((c) => (
                <button key={c} className={`sp-chip ${cat === c ? "active" : ""}`} onClick={() => setCat(c)}>
                  {c === "all" ? "All" : c}
                </button>
              ))}
            </div>
          </div>

          <div className="sp-bh-list">
            {filtered.map((p) => {
              const hasAnswer = !!answers[p.id]?.text;
              return (
                <div
                  key={p.id}
                  className={`sp-bh-item ${selected?.id === p.id ? "active" : ""}`}
                  onClick={() => navigate("behavioral", p.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate("behavioral", p.id);
                    }
                  }}
                >
                  <div className="sp-bh-item-head">
                    <span className={`sp-badge sp-b-level-${p.level.toLowerCase()}`}>{p.level}</span>
                    <span className="sp-bh-cat">{p.cat}</span>
                    {hasAnswer && <span className="sp-bh-saved">✓ Saved</span>}
                  </div>
                  <div className="sp-bh-name">{p.n}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="sp-bh-detail">
          {!selected ? (
            <div className="sp-bh-placeholder">
              <h3>Select a prompt to begin</h3>
              <pre className="sp-md-code">{STAR_TEMPLATE}</pre>
            </div>
          ) : (
            <>
              <div className="sp-bh-detail-head">
                <div className="sp-bh-meta">
                  <span className={`sp-badge sp-b-level-${selected.level.toLowerCase()}`}>{selected.level}</span>
                  <span className="sp-bh-cat">{selected.cat}</span>
                </div>
                <h3>{selected.n}</h3>
              </div>

              <div className="sp-pd-section">
                <h4>Prompt</h4>
                <p className="sp-pd-text">{selected.prompt}</p>
              </div>

              {selected.hints && (
                <div className="sp-pd-section">
                  <h4>What interviewers look for</h4>
                  <ul className="sp-pd-list">
                    {selected.hints.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                </div>
              )}

              <div className="sp-pd-section">
                <h4>Your Story (STAR format)</h4>
                <textarea
                  className="sp-sd-textarea"
                  value={answer}
                  onChange={onAnswerChange}
                  placeholder="Situation... Task... Action (the bulk)... Result (with numbers)..."
                  rows={14}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
