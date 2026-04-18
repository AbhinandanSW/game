import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import useStudyStore from "../store/useStudyStore";
import { JS_PROBLEMS } from "../data/jsProblems";
import { setProgress } from "../../firebase";

export default function JSProblemDetail({ id }) {
  const navigate = useStudyStore((s) => s.navigate);
  const progress = useStudyStore((s) => s.progress);
  const updateLocal = useStudyStore((s) => s.updateProgressLocal);
  const user = useStudyStore((s) => s.user);
  const setToast = useStudyStore((s) => s.setToast);

  const problem = JS_PROBLEMS.find((p) => p.id === id);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const saveTimerRef = useRef(null);

  useEffect(() => {
    if (!problem) return;
    const saved = progress[problem.id]?.code?.javascript;
    setCode(saved || problem.starter || "");
  }, [id]); // eslint-disable-line

  const onCodeChange = (val) => {
    const value = val || "";
    setCode(value);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const existing = progress[problem.id]?.code || {};
      const newCode = { ...existing, javascript: value };
      updateLocal(problem.id, { code: newCode });
      if (user) setProgress(user.uid, problem.id, { code: newCode });
    }, 800);
  };

  const handleRun = () => {
    const logs = [];
    const origLog = console.log;
    console.log = (...args) => {
      logs.push(args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" "));
      origLog(...args);
    };
    try {
      // eslint-disable-next-line no-new-func
      new Function(code)();
      setOutput(logs.join("\n") || "(no output)");
    } catch (e) {
      setOutput("Error: " + e.message);
    } finally {
      console.log = origLog;
    }
  };

  const markDone = async () => {
    updateLocal(problem.id, { done: true });
    if (user) await setProgress(user.uid, problem.id, { done: true });
    setToast("Marked complete");
  };

  if (!problem) return (
    <section className="sp-section">
      <button className="sp-btn sp-btn-ghost" onClick={() => navigate("js-problems")}>← Back</button>
      <p>Not found.</p>
    </section>
  );

  const done = !!progress[problem.id]?.done;

  return (
    <section className="sp-section">
      <button className="sp-btn sp-btn-ghost sp-back" onClick={() => navigate("js-problems")}>← Back to JS Problems</button>

      <div className="sp-problem-layout">
        <div className="sp-problem-desc">
          <div className="sp-pd-head">
            <h2>{problem.n}</h2>
            <div className="sp-pd-badges">
              <span className={`sp-badge ${problem.d === "Easy" ? "sp-b-easy" : problem.d === "Medium" ? "sp-b-med" : "sp-b-hard"}`}>{problem.d}</span>
            </div>
          </div>
          <div className="sp-pd-meta">
            <span>Category: <strong>{problem.cat}</strong></span>
            <span>Concepts: {problem.concepts}</span>
          </div>

          <div className="sp-pd-section">
            <h4>Description</h4>
            <p className="sp-pd-text">{problem.desc || problem.hint}</p>
          </div>

          <div className="sp-pd-hint">
            <strong>💡 Hint:</strong> {problem.hint}
          </div>

          <button className={`sp-btn ${done ? "sp-btn-ghost" : "sp-btn-primary"}`} onClick={markDone} style={{ marginTop: "16px" }}>
            {done ? "✓ Completed" : "Mark Complete"}
          </button>
        </div>

        <div className="sp-editor-panel">
          <div className="sp-editor-bar">
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "12px", color: "#888" }}>JavaScript</span>
            <div className="sp-editor-actions">
              <button className="sp-btn sp-btn-primary" onClick={handleRun}>▶ Run</button>
            </div>
          </div>
          <div className="sp-editor-wrap">
            <Editor
              height="440px"
              language="javascript"
              value={code}
              onChange={onCodeChange}
              theme="vs-dark"
              options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, tabSize: 2, automaticLayout: true }}
            />
          </div>
          {output && (
            <div className="sp-js-output">
              <div className="sp-js-output-label">Console Output</div>
              <pre>{output}</pre>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
