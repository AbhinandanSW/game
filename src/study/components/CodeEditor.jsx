import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import useStudyStore from "../store/useStudyStore";
import { setProgress } from "../../firebase";
import { runJavaScript, runOtherLanguage } from "../services/codeRunner";

const LANGS = [
  { id: "javascript", label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "cpp", label: "C++" },
];

export default function CodeEditor({ problem }) {
  const user = useStudyStore((s) => s.user);
  const progress = useStudyStore((s) => s.progress);
  const updateLocal = useStudyStore((s) => s.updateProgressLocal);
  const setToast = useStudyStore((s) => s.setToast);

  const [lang, setLang] = useState("javascript");
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const saveTimerRef = useRef(null);

  // Load code for this language + problem
  useEffect(() => {
    const saved = progress[problem.id]?.code?.[lang];
    setCode(saved || problem.starterCode?.[lang] || "// Write your solution\n");
    setResult(null);
  }, [lang, problem.id]); // eslint-disable-line

  // Debounced save
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

  const handleRun = () => {
    setRunning(true);
    setTimeout(() => {
      try {
        if (lang === "javascript") {
          const r = runJavaScript(code, problem.testCases || [], problem.fnName);
          setResult(r);
          if (r.ok && r.allPass) setToast("All tests passed!");
        } else {
          setResult(runOtherLanguage(code, lang));
        }
      } catch (e) {
        setResult({ ok: false, message: e.message });
      }
      setRunning(false);
    }, 50);
  };

  const handleSubmit = async () => {
    handleRun();
    if (lang === "javascript") {
      const r = runJavaScript(code, problem.testCases || [], problem.fnName);
      if (r.ok && r.allPass) {
        updateLocal(problem.id, { done: true });
        if (user) await setProgress(user.uid, problem.id, { done: true });
        setToast("Problem marked complete!");
      }
    }
  };

  const resetCode = () => {
    if (window.confirm("Reset to starter code? Your current code will be lost.")) {
      setCode(problem.starterCode?.[lang] || "");
      onCodeChange(problem.starterCode?.[lang] || "");
    }
  };

  return (
    <div className="sp-editor-panel">
      <div className="sp-editor-bar">
        <select className="sp-lang-select" value={lang} onChange={(e) => setLang(e.target.value)}>
          {LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>
        <div className="sp-editor-actions">
          <button className="sp-btn sp-btn-ghost" onClick={resetCode}>Reset</button>
          <button className="sp-btn sp-btn-ghost" onClick={handleRun} disabled={running}>
            {running ? "Running..." : "▶ Run"}
          </button>
          <button className="sp-btn sp-btn-primary" onClick={handleSubmit} disabled={running}>Submit</button>
        </div>
      </div>

      <div className="sp-editor-wrap">
        <Editor
          height="420px"
          language={lang}
          value={code}
          onChange={onCodeChange}
          theme="vs-dark"
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            tabSize: 2,
            automaticLayout: true,
            fontFamily: "JetBrains Mono, Menlo, monospace",
          }}
        />
      </div>

      {result && (
        <div className="sp-results">
          {!result.ok && <div className="sp-result-msg">{result.message}</div>}
          {result.ok && (
            <>
              <div className={`sp-result-header ${result.allPass ? "pass" : "fail"}`}>
                {result.allPass ? "✓ All tests passed" : "✗ Some tests failed"} — {result.results.filter(r => r.pass).length} / {result.results.length}
              </div>
              <div className="sp-test-list">
                {result.results.map((r, i) => (
                  <div key={i} className={`sp-test-case ${r.pass ? "pass" : "fail"}`}>
                    <div className="sp-tc-head">
                      <span className="sp-tc-num">Test {i + 1}</span>
                      <span className={`sp-tc-status ${r.pass ? "pass" : "fail"}`}>
                        {r.pass ? "PASS" : "FAIL"}
                      </span>
                      {r.time && <span className="sp-tc-time">{r.time}</span>}
                    </div>
                    <div className="sp-tc-body">
                      <div><strong>Input:</strong> <code>{r.input}</code></div>
                      <div><strong>Expected:</strong> <code>{r.expected}</code></div>
                      {r.error ? <div className="sp-tc-err">Error: {r.error}</div>
                        : <div><strong>Got:</strong> <code>{r.actual}</code></div>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
