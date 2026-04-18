import React, { useState, useEffect, useRef } from "react";
import useStudyStore from "../store/useStudyStore";
import { SYSTEM_DESIGN } from "../data/systemDesign";
import { setAnswer } from "../../firebase";

export default function SystemDesignDetail({ id }) {
  const navigate = useStudyStore((s) => s.navigate);
  const answers = useStudyStore((s) => s.answers);
  const user = useStudyStore((s) => s.user);
  const setToast = useStudyStore((s) => s.setToast);
  const updateAnswerLocal = useStudyStore((s) => s.updateAnswerLocal);

  const problem = SYSTEM_DESIGN.find((s) => s.id === id);
  const [answer, setAnswerText] = useState("");
  const [showSolution, setShowSolution] = useState(false);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    setAnswerText(answers[id]?.text || "");
  }, [id]); // eslint-disable-line

  const onChange = (e) => {
    const v = e.target.value;
    setAnswerText(v);
    updateAnswerLocal(id, v);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (user) setAnswer(user.uid, id, v);
    }, 800);
  };

  const handleSave = async () => {
    if (user) {
      await setAnswer(user.uid, id, answer);
      setToast("Answer saved");
    }
  };

  if (!problem) return (
    <section className="sp-section">
      <button className="sp-btn sp-btn-ghost" onClick={() => navigate("system-design")}>← Back</button>
      <p>Not found.</p>
    </section>
  );

  return (
    <section className="sp-section">
      <button className="sp-btn sp-btn-ghost sp-back" onClick={() => navigate("system-design")}>← Back to System Design</button>

      <div className="sp-sd-detail">
        <div className="sp-sd-detail-header">
          <h2>{problem.title}</h2>
          {problem.scale && <div className="sp-sd-scale-big">⚡ Scale · {problem.scale}</div>}
        </div>

        <div className="sp-sd-section">
          <h4>Problem</h4>
          <p>{problem.prompt}</p>
        </div>

        {problem.requirements && (
          <div className="sp-sd-section">
            <h4>Requirements</h4>
            <ul className="sp-pd-list">
              {problem.requirements.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}

        {problem.scope && (
          <div className="sp-sd-section">
            <h4>Scope &amp; Estimation</h4>
            <ul className="sp-pd-list">
              {problem.scope.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}

        <div className="sp-sd-section">
          <h4>Your Answer</h4>
          <p className="sp-sd-hint-text">Write your architecture, components, data flow, trade-offs. Markdown supported (preserved as text).</p>
          <textarea
            className="sp-sd-textarea"
            value={answer}
            onChange={onChange}
            placeholder="Start with high-level architecture, then deep-dive into components..."
            rows={18}
          />
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <button className="sp-btn sp-btn-primary" onClick={handleSave}>Save Answer</button>
            <button className="sp-btn sp-btn-ghost" onClick={() => setShowSolution(!showSolution)}>
              {showSolution ? "Hide" : "Show"} Reference Solution
            </button>
          </div>
        </div>

        {showSolution && (
          <div className="sp-sd-solution">
            {problem.approach && (
              <div className="sp-sd-section">
                <h4>Reference Approach</h4>
                <pre className="sp-sd-approach">{problem.approach}</pre>
              </div>
            )}
            {problem.components && (
              <div className="sp-sd-section">
                <h4>Key Components</h4>
                <p>{problem.components}</p>
              </div>
            )}
            {problem.tradeoffs && (
              <div className="sp-sd-section">
                <h4>Trade-offs</h4>
                <ul className="sp-pd-list">
                  {problem.tradeoffs.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
