import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import useStudyStore from "../store/useStudyStore";
import { MACHINE_CODING } from "../data/machineCoding";
import { setProgress } from "../../firebase";

const LANGS = [
  { id: "javascript", label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "cpp", label: "C++" },
];

export default function MachineCodingDetail({ id }) {
  const navigate = useStudyStore((s) => s.navigate);
  const progress = useStudyStore((s) => s.progress);
  const updateLocal = useStudyStore((s) => s.updateProgressLocal);
  const user = useStudyStore((s) => s.user);
  const setToast = useStudyStore((s) => s.setToast);

  const problem = MACHINE_CODING.find((m) => m.id === id);
  const [lang, setLang] = useState("javascript");
  const [code, setCode] = useState("");
  const saveTimerRef = useRef(null);

  useEffect(() => {
    if (!problem) return;
    const saved = progress[problem.id]?.code?.[lang];
    setCode(saved || problem.starter || `// ${problem.n}\n// Start your implementation here\n\n`);
  }, [id, lang]); // eslint-disable-line

  const onCodeChange = (val) => {
    const value = val || "";
    setCode(value);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const existing = progress[problem.id]?.code || {};
      const newCode = { ...existing, [lang]: value };
      updateLocal(problem.id, { code: newCode });
      if (user) setProgress(user.uid, problem.id, { code: newCode });
    }, 800);
  };

  const markDone = async () => {
    updateLocal(problem.id, { done: true });
    if (user) await setProgress(user.uid, problem.id, { done: true });
    setToast("Marked complete");
  };

  if (!problem) return (
    <section className="sp-section">
      <button className="sp-btn sp-btn-ghost" onClick={() => navigate("machine-coding")}>← Back</button>
      <p>Not found.</p>
    </section>
  );

  const done = !!progress[problem.id]?.done;

  return (
    <section className="sp-section">
      <button className="sp-btn sp-btn-ghost sp-back" onClick={() => navigate("machine-coding")}>← Back to Machine Coding</button>

      <div className="sp-problem-layout">
        <div className="sp-problem-desc">
          <div className="sp-pd-head">
            <h2>{problem.n}</h2>
            <div className="sp-pd-badges">
              <span className={`sp-badge ${problem.d === "Easy" ? "sp-b-easy" : problem.d === "Medium" ? "sp-b-med" : "sp-b-hard"}`}>{problem.d}</span>
              <span className="sp-mc-time-big">{problem.t}</span>
            </div>
          </div>
          <div className="sp-pd-meta"><span>Companies: {problem.c}</span></div>

          <div className="sp-pd-section">
            <h4>Description</h4>
            <p className="sp-pd-text">{problem.desc || problem.r}</p>
          </div>

          {problem.requirements && (
            <div className="sp-pd-section">
              <h4>Requirements</h4>
              <ul className="sp-pd-list">{problem.requirements.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </div>
          )}

          {problem.classes && (
            <div className="sp-pd-section">
              <h4>Class Design</h4>
              <pre className="sp-sd-approach">{problem.classes}</pre>
            </div>
          )}

          {problem.p && (
            <div className="sp-pd-hint">
              <strong>Design Patterns:</strong> {problem.p}
            </div>
          )}

          <button
            className={`sp-btn ${done ? "sp-btn-ghost" : "sp-btn-primary"}`}
            onClick={markDone}
            style={{ marginTop: "16px" }}
          >
            {done ? "✓ Completed" : "Mark Complete"}
          </button>
        </div>

        <div className="sp-editor-panel">
          <div className="sp-editor-bar">
            <select className="sp-lang-select" value={lang} onChange={(e) => setLang(e.target.value)}>
              {LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
          </div>
          <div className="sp-editor-wrap">
            <Editor
              height="560px"
              language={lang}
              value={code}
              onChange={onCodeChange}
              theme="vs-dark"
              options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, tabSize: 2, automaticLayout: true }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
