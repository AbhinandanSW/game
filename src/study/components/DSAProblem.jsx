import React from "react";
import useStudyStore from "../store/useStudyStore";
import { ALL_DSA } from "../data/dsa";
import CodeEditor from "./CodeEditor";

export default function DSAProblem({ id }) {
  const navigate = useStudyStore((s) => s.navigate);
  const problem = ALL_DSA.find((p) => p.id === id);

  if (!problem) {
    return (
      <section className="sp-section">
        <button className="sp-btn sp-btn-ghost" onClick={() => navigate("dsa")}>← Back</button>
        <p>Problem not found.</p>
      </section>
    );
  }

  const hasTests = problem.testCases && problem.testCases.length > 0;

  return (
    <section className="sp-section">
      <button className="sp-btn sp-btn-ghost sp-back" onClick={() => navigate("dsa")}>← Back to DSA</button>

      <div className="sp-problem-layout">
        <div className="sp-problem-desc">
          <div className="sp-pd-head">
            <h2>{problem.n}</h2>
            <div className="sp-pd-badges">
              <DiffBadge d={problem.d} />
              <PrioBadge p={problem.p} />
              {problem.lc && <span className="sp-lc">LC {problem.lc}</span>}
            </div>
          </div>
          <div className="sp-pd-meta">
            <span>Topic: <strong>{problem.t}</strong></span>
            {problem.c && <span>Companies: {problem.c}</span>}
          </div>

          <div className="sp-pd-section">
            <h4>Description</h4>
            <p className="sp-pd-text">{problem.desc || problem.i}</p>
          </div>

          {problem.examples && problem.examples.length > 0 && (
            <div className="sp-pd-section">
              <h4>Examples</h4>
              {problem.examples.map((ex, i) => (
                <div key={i} className="sp-example">
                  <div><strong>Input:</strong> <code>{ex.input}</code></div>
                  <div><strong>Output:</strong> <code>{ex.output}</code></div>
                  {ex.explanation && <div><strong>Explanation:</strong> {ex.explanation}</div>}
                </div>
              ))}
            </div>
          )}

          {problem.constraints && problem.constraints.length > 0 && (
            <div className="sp-pd-section">
              <h4>Constraints</h4>
              <ul className="sp-pd-list">
                {problem.constraints.map((c, i) => <li key={i}><code>{c}</code></li>)}
              </ul>
            </div>
          )}

          {problem.i && (
            <div className="sp-pd-hint">
              <strong>💡 Hint:</strong> {problem.i}
            </div>
          )}

          {!hasTests && (
            <div className="sp-pd-note">
              <strong>Note:</strong> This problem doesn't have built-in test cases yet. Write your solution, test it locally, and mark as complete when done.
            </div>
          )}
        </div>

        <CodeEditor problem={problem} />
      </div>
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
