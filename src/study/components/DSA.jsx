import React, { useState, useMemo } from "react";
import useStudyStore from "../store/useStudyStore";
import { ALL_DSA, CURATED_LISTS, PATTERNS, TIERS } from "../data/dsa";
import { mergeWithOverrides } from "../services/contentService";
import { setProgress } from "../../firebase";

export default function DSA() {
  const [track, setTrack] = useState("all");
  const [diff, setDiff] = useState("all");
  const [level, setLevel] = useState("all");
  const [tier, setTier] = useState("all");
  const [curated, setCurated] = useState("all");
  const [pattern, setPattern] = useState("all");
  const [company, setCompany] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [showCompletedOnly, setShowCompletedOnly] = useState("all"); // all | todo | done

  const navigate = useStudyStore((s) => s.navigate);
  const progress = useStudyStore((s) => s.progress);
  const updateLocal = useStudyStore((s) => s.updateProgressLocal);
  const user = useStudyStore((s) => s.user);
  const setToast = useStudyStore((s) => s.setToast);
  const overrides = useStudyStore((s) => s.contentOverrides.dsa);

  // Live-merged list — hardcoded + Firestore overrides (if admin seeded)
  const mergedDSA = useMemo(
    () => mergeWithOverrides(ALL_DSA, overrides),
    [overrides]
  );

  const ALL_COMPANIES = useMemo(() => Array.from(new Set(
    mergedDSA.flatMap((p) => (p.companies || p.c || "").split(",").map((c) => c.trim()).filter(Boolean))
  )).sort(), [mergedDSA]);

  const filtered = useMemo(() => {
    let list = mergedDSA;

    if (track === "fullstack" || track === "all") {
      // show everything
    } else if (track === "fe") {
      // Frontend interviews = common + fe-specific problems
      list = list.filter((p) => p.track === "common" || p.track === "fe");
    } else if (track === "be") {
      // Backend interviews = common + be-specific problems
      list = list.filter((p) => p.track === "common" || p.track === "be");
    } else if (track === "common") {
      // Explicitly only the common set
      list = list.filter((p) => p.track === "common");
    }
    if (diff !== "all") list = list.filter((p) => p.d === diff);
    if (level !== "all") list = list.filter((p) => p.level === level);
    if (tier !== "all") list = list.filter((p) => p.tier === tier);
    if (curated !== "all") list = list.filter((p) => (p.lists || []).includes(curated));
    if (pattern !== "all") list = list.filter((p) => p.pattern === pattern);
    if (company !== "all") list = list.filter((p) => (p.companies || "").toLowerCase().includes(company.toLowerCase()));

    if (showCompletedOnly === "done") list = list.filter((p) => progress[p.id]?.done);
    else if (showCompletedOnly === "todo") list = list.filter((p) => !progress[p.id]?.done);

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.n.toLowerCase().includes(q) ||
        (p.t || "").toLowerCase().includes(q) ||
        (p.companies || "").toLowerCase().includes(q) ||
        (p.pattern || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [mergedDSA, track, diff, level, tier, curated, pattern, company, showCompletedOnly, search, progress]);

  const stats = useMemo(() => {
    const done = filtered.filter((p) => progress[p.id]?.done).length;
    return { total: filtered.length, done };
  }, [filtered, progress]);

  const toggleDone = async (p) => {
    const current = !!progress[p.id]?.done;
    updateLocal(p.id, { done: !current });
    if (user) {
      await setProgress(user.uid, p.id, { done: !current });
      setToast(!current ? "Marked complete" : "Marked incomplete");
    }
  };

  const clearFilters = () => {
    setTrack("all"); setDiff("all"); setLevel("all"); setTier("all");
    setCurated("all"); setPattern("all"); setCompany("all");
    setShowCompletedOnly("all"); setSearch("");
  };

  return (
    <section className="sp-section">
      <div className="sp-section-head">
        <h2><span className="num">02</span>DSA Problems</h2>
        <p className="sp-section-desc">
          {ALL_DSA.length} problems covering Blind 75, NeetCode 150, Grind 75, Striver SDE, and company-specific sets.
          Filter by role, tier, curated list, pattern, or company.
        </p>
      </div>

      {/* Primary filters — always visible */}
      <div className="sp-filters">
        <div className="sp-filter-group">
          <span className="sp-filter-label">Role</span>
          {[
            ["all", "All", "Every problem"],
            ["common", "Common", "Problems asked in both FE and BE interviews"],
            ["fe", "Frontend", "Common + FE-specific problems"],
            ["be", "Backend", "Common + BE-specific (harder DPs, distributed)"],
            ["fullstack", "Fullstack", "Everything — both worlds"],
          ].map(([v, l, desc]) => (
            <button key={v} className={`sp-chip ${track === v ? "active" : ""}`} onClick={() => setTrack(v)} title={desc}>{l}</button>
          ))}
        </div>

        <div className="sp-filter-group">
          <span className="sp-filter-label">Company Tier</span>
          <button className={`sp-chip ${tier === "all" ? "active" : ""}`} onClick={() => setTier("all")}>All Tiers</button>
          {TIERS.map((t) => (
            <button key={t.id} className={`sp-chip ${tier === t.id ? "active" : ""}`} onClick={() => setTier(t.id)} title={t.desc}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="sp-filter-group">
          <span className="sp-filter-label">Curated List</span>
          <button className={`sp-chip ${curated === "all" ? "active" : ""}`} onClick={() => setCurated("all")}>All</button>
          {CURATED_LISTS.map((l) => (
            <button key={l.id} className={`sp-chip ${curated === l.id ? "active" : ""}`} onClick={() => setCurated(l.id)} title={l.desc}>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Secondary filters */}
      <div className="sp-filters">
        <div className="sp-filter-group">
          <span className="sp-filter-label">Difficulty</span>
          {["all", "Easy", "Medium", "Hard"].map((v) => (
            <button key={v} className={`sp-chip ${diff === v ? "active" : ""}`} onClick={() => setDiff(v)}>{v === "all" ? "All" : v}</button>
          ))}
        </div>

        <div className="sp-filter-group">
          <span className="sp-filter-label">SDE Level</span>
          {["all", "L1", "L2", "L3"].map((v) => (
            <button key={v} className={`sp-chip ${level === v ? "active" : ""}`} onClick={() => setLevel(v)}>{v === "all" ? "All" : v}</button>
          ))}
        </div>

        <div className="sp-filter-group">
          <span className="sp-filter-label">Status</span>
          {[["all", "All"], ["todo", "Todo"], ["done", "Done"]].map(([v, l]) => (
            <button key={v} className={`sp-chip ${showCompletedOnly === v ? "active" : ""}`} onClick={() => setShowCompletedOnly(v)}>{l}</button>
          ))}
        </div>

        <button className="sp-chip" onClick={() => setShowFilters(!showFilters)}>
          {showFilters ? "Hide" : "More"} filters ▾
        </button>
      </div>

      {/* Advanced filters */}
      {showFilters && (
        <div className="sp-filters">
          <div className="sp-filter-group" style={{ flex: "1 1 100%" }}>
            <span className="sp-filter-label">Pattern</span>
            <select className="sp-lang-select" value={pattern} onChange={(e) => setPattern(e.target.value)} style={{ minWidth: "200px" }}>
              <option value="all">All Patterns</option>
              {PATTERNS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>

            <span className="sp-filter-label" style={{ marginLeft: "20px" }}>Company</span>
            <select className="sp-lang-select" value={company} onChange={(e) => setCompany(e.target.value)} style={{ minWidth: "160px" }}>
              <option value="all">All Companies</option>
              {ALL_COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <button className="sp-chip" onClick={clearFilters} style={{ marginLeft: "auto" }}>Clear all</button>
          </div>
        </div>
      )}

      {/* Search + stats */}
      <div className="sp-filters">
        <input
          className="sp-search"
          placeholder="Search by name, topic, pattern, or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="sp-filter-stats">
          <strong>{stats.done}</strong>/<strong>{stats.total}</strong> done in view
        </div>
      </div>

      <div className="sp-problem-grid">
        {filtered.map((p) => {
          const done = !!progress[p.id]?.done;
          const hasCode = !!progress[p.id]?.code;
          return (
            <div
              key={p.id}
              className={`sp-problem ${done ? "done" : ""}`}
              onClick={() => navigate("dsa", p.id)}
            >
              <div
                className={`sp-check ${done ? "checked" : ""}`}
                onClick={(e) => { e.stopPropagation(); toggleDone(p); }}
              />
              <div className="sp-p-main">
                <div className="sp-p-name">
                  {p.n}
                  {hasCode && <span className="sp-code-tag">Code saved</span>}
                </div>
                <div className="sp-p-meta">
                  <span>{p.t}</span>
                  {p.pattern && <span>◆ {p.pattern}</span>}
                  {p.companies && <span>{p.companies.slice(0, 40)}{p.companies.length > 40 ? "…" : ""}</span>}
                </div>
                {p.i && <div className="sp-p-insight">{p.i}</div>}
                {p.lists?.length > 0 && (
                  <div className="sp-p-lists">
                    {p.lists.map((lst) => (
                      <span key={lst} className={`sp-list-tag sp-list-${lst}`}>
                        {CURATED_LISTS.find(l => l.id === lst)?.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="sp-p-badges">
                <DiffBadge d={p.d} />
                <PrioBadge p={p.p} />
                {p.tier && <span className={`sp-badge sp-tier-${p.tier}`}>{p.tier.toUpperCase()}</span>}
                {p.level && <span className={`sp-badge sp-b-level-${p.level.toLowerCase()}`}>{p.level}</span>}
                {p.lc && <span className="sp-lc">LC {p.lc}</span>}
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && <div className="sp-empty">No problems match your filters. <button className="sp-btn sp-btn-ghost" onClick={clearFilters}>Clear filters</button></div>}
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
