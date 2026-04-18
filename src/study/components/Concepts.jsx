import React from "react";
import useStudyStore from "../store/useStudyStore";
import { CONCEPTS_COMMON, CONCEPTS_FE, CONCEPTS_BE, CONCEPTS_ARCHITECTURE } from "../data/concepts";

export default function Concepts() {
  const navigate = useStudyStore((s) => s.navigate);

  const groups = {};
  CONCEPTS_ARCHITECTURE.forEach((c) => {
    const k = `ARCHITECTURE · ${c.cat}`;
    groups[k] = groups[k] || [];
    groups[k].push(c);
  });
  CONCEPTS_FE.forEach((c) => {
    const k = `FE · ${c.cat}`;
    groups[k] = groups[k] || [];
    groups[k].push(c);
  });
  CONCEPTS_BE.forEach((c) => {
    const k = `BE · ${c.cat}`;
    groups[k] = groups[k] || [];
    groups[k].push(c);
  });

  return (
    <section className="sp-section">
      <div className="sp-section-head">
        <h2><span className="num">05</span>Concepts</h2>
        <p className="sp-section-desc">Deep explanations on demand. Click any card to expand the full write-up.</p>
      </div>

      <div className="sp-concept-cat">
        <h3>Shared Concepts (Study Once, Use Both)</h3>
        <div className="sp-concept-list">
          {CONCEPTS_COMMON.map((c) => (
            <div key={c.id} className="sp-concept" onClick={() => navigate("concepts", c.id)}>
              <div className="sp-concept-name">
                {c.n}
                {c.depth && <span className={`sp-depth depth-${c.depth}`}>{c.depth}</span>}
              </div>
              <div className="sp-concept-summary">{c.s}</div>
              {c.detail && <div className="sp-concept-read">Read deep-dive →</div>}
            </div>
          ))}
        </div>
      </div>

      {Object.keys(groups).sort().map((cat) => (
        <div key={cat} className="sp-concept-cat">
          <h3>{cat}</h3>
          <div className="sp-concept-list">
            {groups[cat].map((c) => (
              <div key={c.id} className="sp-concept" onClick={() => navigate("concepts", c.id)}>
                <div className="sp-concept-name">
                  {c.n}
                  {c.depth && <span className={`sp-depth depth-${c.depth}`}>{c.depth}</span>}
                </div>
                <div className="sp-concept-summary">{c.s}</div>
                {c.detail && <div className="sp-concept-read">Read deep-dive →</div>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
