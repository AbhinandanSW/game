import React, { useState } from "react";
import { FE_PLAN, BE_PLAN } from "../data/plans";
import { FE_PLAN_DETAIL, BE_PLAN_DETAIL } from "../data/plans-detail";

// Simple markdown renderer for theory text
function renderMD(md) {
  if (!md) return null;
  const lines = md.split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) {
      const code = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { code.push(lines[i]); i++; }
      blocks.push({ type: "code", content: code.join("\n") });
      i++;
    } else if (line.startsWith("### ")) { blocks.push({ type: "h3", content: line.slice(4) }); i++; }
    else if (line.startsWith("## ")) { blocks.push({ type: "h2", content: line.slice(3) }); i++; }
    else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(lines[i].slice(2)); i++;
      }
      blocks.push({ type: "ul", items });
    } else if (line.startsWith("|")) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith("|")) { rows.push(lines[i]); i++; }
      blocks.push({ type: "table", content: rows });
    } else if (line.trim() === "") { i++; }
    else { blocks.push({ type: "p", content: line }); i++; }
  }

  const fmt = (s) => s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  return blocks.map((b, idx) => {
    if (b.type === "code") return <pre key={idx} className="sp-md-code"><code>{b.content}</code></pre>;
    if (b.type === "h2") return <h3 key={idx} className="sp-md-h2">{b.content}</h3>;
    if (b.type === "h3") return <h4 key={idx} className="sp-md-h3">{b.content}</h4>;
    if (b.type === "ul") return <ul key={idx} className="sp-md-ul">{b.items.map((it, j) => <li key={j} dangerouslySetInnerHTML={{ __html: fmt(it) }} />)}</ul>;
    if (b.type === "table") {
      const rows = b.content.map(r => r.split("|").filter(c => c !== "").map(c => c.trim()));
      const header = rows[0]; const body = rows.slice(2);
      return <table key={idx} className="sp-md-table"><thead><tr>{header.map((h, j) => <th key={j}>{h}</th>)}</tr></thead><tbody>{body.map((r, k) => <tr key={k}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table>;
    }
    return <p key={idx} className="sp-md-p" dangerouslySetInnerHTML={{ __html: fmt(b.content) }} />;
  });
}

export default function Plan() {
  const [track, setTrack] = useState("fe");
  const [openDay, setOpenDay] = useState(null);

  const plan = track === "fe" ? FE_PLAN : BE_PLAN;
  const detail = track === "fe" ? FE_PLAN_DETAIL : BE_PLAN_DETAIL;

  return (
    <section className="sp-section">
      <div className="sp-section-head">
        <h2><span className="num">06</span>30-Day Plan</h2>
        <p className="sp-section-desc">Day-by-day schedule with full theory, specific problems, detailed tasks, resources, and success criteria.</p>
      </div>

      <div className="sp-plan-tabs">
        <button className={`sp-plan-tab ${track === "fe" ? "active" : ""}`} onClick={() => { setTrack("fe"); setOpenDay(null); }}>Frontend Track</button>
        <button className={`sp-plan-tab ${track === "be" ? "active" : ""}`} onClick={() => { setTrack("be"); setOpenDay(null); }}>Backend Track</button>
      </div>

      <div className="sp-day-grid">
        {plan.map((day) => {
          const d = detail[day.d] || {};
          const isOpen = openDay === day.d;
          return (
            <div key={day.d} className={`sp-day ${isOpen ? "open" : ""}`}>
              <div className="sp-day-head" onClick={() => setOpenDay(isOpen ? null : day.d)}>
                <div className="sp-day-num">{day.d}<small>Day</small></div>
                <div className="sp-day-main">
                  <div className="sp-day-theme">
                    {day.th}
                    {day.phase && <span className="sp-day-phase"> · {day.phase}</span>}
                  </div>
                  <div className="sp-day-preview">{day.morn.slice(0, 80)}{day.morn.length > 80 ? "…" : ""}</div>
                </div>
                <div className="sp-day-arrow">▸</div>
              </div>

              {isOpen && (
                <div className="sp-day-full">
                  {/* Morning theory */}
                  <div className="sp-day-section">
                    <div className="sp-day-section-tag">◆ Morning Theory</div>
                    <div className="sp-day-summary">{day.morn}</div>
                    {d.fullTheory ? (
                      <div className="sp-day-content">{renderMD(d.fullTheory)}</div>
                    ) : (
                      <div className="sp-day-empty">Detailed content not yet added. Use summary above + search MDN / React docs for the topics listed.</div>
                    )}
                  </div>

                  {/* Afternoon — DSA problems */}
                  <div className="sp-day-section">
                    <div className="sp-day-section-tag">◆ Afternoon · DSA Practice</div>
                    <div className="sp-day-summary">{day.aft}</div>
                    {d.problems && d.problems.length > 0 && (
                      <div className="sp-day-problems">
                        {d.problems.map((p, i) => (
                          <a
                            key={i}
                            className={`sp-day-problem sp-b-${p.diff === "Easy" ? "easy" : p.diff === "Medium" ? "med" : "hard"}`}
                            href={`https://leetcode.com/problems/${p.n.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <span className="sp-day-problem-lc">LC {p.lc}</span>
                            <span className="sp-day-problem-name">{p.n}</span>
                            <span className={`sp-badge sp-b-${p.diff === "Easy" ? "easy" : p.diff === "Medium" ? "med" : "hard"}`}>{p.diff}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Evening — task/build */}
                  <div className="sp-day-section">
                    <div className="sp-day-section-tag">◆ Evening · {track === "fe" ? "Build / System Design" : "Target"}</div>
                    <div className="sp-day-summary">{day.eve}</div>
                    {d.eveningSpec && <div className="sp-day-content">{renderMD(d.eveningSpec)}</div>}
                  </div>

                  {/* Resources */}
                  {d.resources && d.resources.length > 0 && (
                    <div className="sp-day-section">
                      <div className="sp-day-section-tag">◆ Resources</div>
                      <div className="sp-day-resources">
                        {d.resources.map((r, i) => (
                          <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="sp-day-resource">
                            → {r.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Success criteria */}
                  {d.successCriteria && d.successCriteria.length > 0 && (
                    <div className="sp-day-section">
                      <div className="sp-day-section-tag">◆ Success Criteria</div>
                      <ul className="sp-day-criteria">
                        {d.successCriteria.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Deliverable */}
                  <div className="sp-day-deliverable">◆ Deliverable · {day.del}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
