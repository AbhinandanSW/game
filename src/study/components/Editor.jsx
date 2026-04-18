import React, { useState } from "react";
import useStudyStore from "../store/useStudyStore";
import { addEntry, deleteEntry } from "../../firebase";

export default function Editor() {
  const entries = useStudyStore((s) => s.entries);
  const user = useStudyStore((s) => s.user);
  const setToast = useStudyStore((s) => s.setToast);

  const [form, setForm] = useState({
    title: "",
    category: "DSA",
    difficulty: "",
    topic: "",
    companies: "",
    notes: "",
  });

  const onChange = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (user) {
      await addEntry(user.uid, form);
      setToast("Entry saved");
      setForm({ title: "", category: "DSA", difficulty: "", topic: "", companies: "", notes: "" });
    }
  };

  const handleDelete = async (id) => {
    if (user) {
      await deleteEntry(user.uid, id);
      setToast("Entry deleted");
    }
  };

  const handleClearAll = async () => {
    if (!entries.length) return;
    if (!window.confirm("Delete ALL your custom entries? This cannot be undone.")) return;
    if (user) {
      for (const e of entries) await deleteEntry(user.uid, e.id);
      setToast("All entries deleted");
    }
  };

  const sorted = [...entries].sort((a, b) => {
    const ta = a.createdAt?.seconds || 0;
    const tb = b.createdAt?.seconds || 0;
    return tb - ta;
  });

  return (
    <section className="sp-section">
      <div className="sp-section-head">
        <h2><span className="num">09</span>Editor — Add Your Own</h2>
        <p className="sp-section-desc">Add custom problems, concepts, notes. Saved to Firestore, synced across devices.</p>
      </div>

      <div className="sp-editor-layout">
        <form className="sp-entry-form" onSubmit={handleSubmit}>
          <h3>New Entry</h3>

          <div className="sp-field">
            <label>Title</label>
            <input type="text" value={form.title} onChange={onChange("title")} placeholder="e.g. Median of Two Sorted Arrays" required />
          </div>

          <div className="sp-field-row">
            <div className="sp-field">
              <label>Category</label>
              <select value={form.category} onChange={onChange("category")}>
                <option>DSA</option>
                <option>System Design</option>
                <option>Machine Coding</option>
                <option>Concept</option>
                <option>JS Problem</option>
                <option>Other</option>
              </select>
            </div>
            <div className="sp-field">
              <label>Difficulty / Priority</label>
              <select value={form.difficulty} onChange={onChange("difficulty")}>
                <option value="">—</option>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
                <option>P0</option>
                <option>P1</option>
                <option>P2</option>
              </select>
            </div>
          </div>

          <div className="sp-field-row">
            <div className="sp-field">
              <label>Topic / Pattern</label>
              <input type="text" value={form.topic} onChange={onChange("topic")} placeholder="e.g. Binary Search" />
            </div>
            <div className="sp-field">
              <label>Companies</label>
              <input type="text" value={form.companies} onChange={onChange("companies")} placeholder="e.g. Google" />
            </div>
          </div>

          <div className="sp-field">
            <label>Notes / Insight</label>
            <textarea rows={4} value={form.notes} onChange={onChange("notes")} placeholder="Your insights, tricks, edge cases..." />
          </div>

          <div className="sp-btn-group">
            <button type="submit" className="sp-btn sp-btn-primary">Save Entry</button>
            <button type="button" className="sp-btn sp-btn-ghost" onClick={() => setForm({ title: "", category: "DSA", difficulty: "", topic: "", companies: "", notes: "" })}>Clear</button>
            <button type="button" className="sp-btn sp-btn-danger" onClick={handleClearAll}>Delete All</button>
          </div>
        </form>

        <div className="sp-my-entries-wrap">
          <h3>Your Entries <span className="sp-count">({sorted.length})</span></h3>
          <div className="sp-my-entries">
            {sorted.length === 0 && <div className="sp-empty">No entries yet. Add your first one!</div>}
            {sorted.map((e) => (
              <div key={e.id} className="sp-my-entry">
                <div className="sp-my-entry-head">
                  <div>
                    <div className="sp-my-entry-name">{e.title}</div>
                    <div className="sp-my-entry-meta">
                      {e.category}
                      {e.difficulty && ` · ${e.difficulty}`}
                      {e.topic && ` · ${e.topic}`}
                      {e.companies && ` · ${e.companies}`}
                    </div>
                  </div>
                  <button className="sp-del-btn" onClick={() => handleDelete(e.id)} title="Delete">×</button>
                </div>
                {e.notes && <div className="sp-my-entry-notes">{e.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
