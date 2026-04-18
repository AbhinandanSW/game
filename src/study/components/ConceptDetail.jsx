import React, { useState, useEffect, useRef } from "react";
import useStudyStore from "../store/useStudyStore";
import { CONCEPTS_COMMON, CONCEPTS_FE, CONCEPTS_BE } from "../data/concepts";
import { setAnswer } from "../../firebase";

const ALL_CONCEPTS = [...CONCEPTS_COMMON, ...CONCEPTS_FE, ...CONCEPTS_BE];

// Markdown-ish renderer with images, blockquotes, code fences, tables, lists
function renderMD(md) {
  if (!md) return null;
  const lines = md.split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) {
      const lang = line.slice(3);
      const code = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        code.push(lines[i]);
        i++;
      }
      blocks.push({ type: "code", lang, content: code.join("\n") });
      i++;
    } else if (line.startsWith("### ")) {
      blocks.push({ type: "h3", content: line.slice(4) });
      i++;
    } else if (line.startsWith("## ")) {
      blocks.push({ type: "h2", content: line.slice(3) });
      i++;
    } else if (line.startsWith("> ")) {
      const parts = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        parts.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ type: "quote", content: parts.join(" ") });
    } else if (/^!\[[^\]]*\]\([^)]+\)/.test(line)) {
      const m = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
      if (m) blocks.push({ type: "img", alt: m[1], src: m[2] });
      i++;
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ type: "ul", items });
    } else if (/^\d+\. /.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
    } else if (line.startsWith("|")) {
      const table = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        table.push(lines[i]);
        i++;
      }
      blocks.push({ type: "table", content: table });
    } else if (line.trim() === "") {
      i++;
    } else {
      blocks.push({ type: "p", content: line });
      i++;
    }
  }

  return blocks.map((b, idx) => {
    if (b.type === "code") return <pre key={idx} className="sp-md-code"><code>{b.content}</code></pre>;
    if (b.type === "h2") return <h3 key={idx} className="sp-md-h2">{b.content}</h3>;
    if (b.type === "h3") return <h4 key={idx} className="sp-md-h3">{b.content}</h4>;
    if (b.type === "quote") return <blockquote key={idx} className="sp-md-quote" dangerouslySetInnerHTML={{ __html: formatInline(b.content) }} />;
    if (b.type === "img") return (
      <figure key={idx} className="sp-md-figure">
        <img src={b.src} alt={b.alt} loading="lazy" onError={(e) => { e.target.style.display = "none"; }} />
        {b.alt && <figcaption>{b.alt}</figcaption>}
      </figure>
    );
    if (b.type === "ul") return (
      <ul key={idx} className="sp-md-ul">
        {b.items.map((it, j) => <li key={j} dangerouslySetInnerHTML={{ __html: formatInline(it) }} />)}
      </ul>
    );
    if (b.type === "ol") return (
      <ol key={idx} className="sp-md-ol">
        {b.items.map((it, j) => <li key={j} dangerouslySetInnerHTML={{ __html: formatInline(it) }} />)}
      </ol>
    );
    if (b.type === "table") {
      const rows = b.content.map((row) => row.split("|").filter(c => c !== "").map(c => c.trim()));
      const header = rows[0];
      const body = rows.slice(2);
      return (
        <table key={idx} className="sp-md-table">
          <thead><tr>{header.map((h, j) => <th key={j}>{h}</th>)}</tr></thead>
          <tbody>{body.map((r, k) => <tr key={k}>{r.map((c, j) => <td key={j} dangerouslySetInnerHTML={{ __html: formatInline(c) }} />)}</tr>)}</tbody>
        </table>
      );
    }
    return <p key={idx} className="sp-md-p" dangerouslySetInnerHTML={{ __html: formatInline(b.content) }} />;
  });
}

function formatInline(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

export default function ConceptDetail({ id }) {
  const navigate = useStudyStore((s) => s.navigate);
  const answers = useStudyStore((s) => s.answers);
  const user = useStudyStore((s) => s.user);
  const setToast = useStudyStore((s) => s.setToast);
  const updateAnswerLocal = useStudyStore((s) => s.updateAnswerLocal);
  const [notes, setNotes] = useState("");
  const saveTimerRef = useRef(null);

  const concept = ALL_CONCEPTS.find((c) => c.id === id);

  useEffect(() => {
    setNotes(answers[id]?.text || "");
  }, [id]); // eslint-disable-line

  const onChange = (e) => {
    const v = e.target.value;
    setNotes(v);
    updateAnswerLocal(id, v);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (user) setAnswer(user.uid, id, v);
    }, 800);
  };

  if (!concept) return (
    <section className="sp-section">
      <button className="sp-btn sp-btn-ghost" onClick={() => navigate("concepts")}>← Back</button>
      <p>Not found.</p>
    </section>
  );

  return (
    <section className="sp-section">
      <button className="sp-btn sp-btn-ghost sp-back" onClick={() => navigate("concepts")}>← Back to Concepts</button>

      <div className="sp-concept-detail">
        <h2>{concept.n}</h2>
        {concept.cat && <div className="sp-concept-cat-label">{concept.cat}</div>}

        <div className="sp-concept-content">
          {concept.detail ? renderMD(concept.detail) : (
            <p className="sp-pd-text">{concept.s}</p>
          )}
        </div>

        <div className="sp-pd-section">
          <h4>Your Notes</h4>
          <textarea
            className="sp-sd-textarea"
            value={notes}
            onChange={onChange}
            placeholder="Your own notes, questions, examples..."
            rows={8}
          />
        </div>
      </div>
    </section>
  );
}
