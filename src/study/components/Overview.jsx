import React from "react";
import useStudyStore from "../store/useStudyStore";
import { ALL_DSA } from "../data/dsa";

export default function Overview() {
  const navigate = useStudyStore((s) => s.navigate);
  const progress = useStudyStore((s) => s.progress);
  const done = Object.values(progress).filter((p) => p?.done).length;

  return (
    <>
      <header className="sp-hero">
        <div className="sp-hero-tag">◆ Frontend &amp; Backend · Interview Prep</div>
        <h1 className="sp-hero-h1">
          One plan.<br />
          <em>Two tracks.</em><br />
          Zero wasted hours.
        </h1>
        <p className="sp-hero-sub">
          A combined study blueprint for Frontend and Backend SDE interviews at Indian startups and MNCs.
          DSA overlaps, divergent specializations, day-by-day schedules, and every problem worth solving — all in one place.
        </p>
      </header>

      <div className="sp-stats">
        <div className="sp-stat">
          <div className="sp-stat-num">{ALL_DSA.length}</div>
          <div className="sp-stat-label">Total DSA Problems</div>
        </div>
        <div className="sp-stat">
          <div className="sp-stat-num">29</div>
          <div className="sp-stat-label">FE/BE Overlap</div>
        </div>
        <div className="sp-stat">
          <div className="sp-stat-num">45</div>
          <div className="sp-stat-label">Machine Coding Kata</div>
        </div>
        <div className="sp-stat">
          <div className="sp-stat-num">{done}</div>
          <div className="sp-stat-label">Your Progress</div>
        </div>
      </div>

      <section className="sp-section">
        <div className="sp-section-head">
          <h2><span className="num">01</span>Overlap Analysis</h2>
          <p className="sp-section-desc">
            Where Frontend and Backend prep share ground — and where they don't. Study the common 29 DSA problems once; count them for both tracks.
          </p>
        </div>

        <div className="sp-overlap-grid">
          <div className="sp-overlap-card" onClick={() => navigate("dsa")}>
            <h3>DSA Problems</h3>
            <div className="sp-overlap-stats">
              <div className="sp-os"><strong>40</strong><span>Frontend</span></div>
              <div className="sp-os"><strong>100</strong><span>Backend</span></div>
              <div className="sp-os"><strong>29</strong><span>Common</span></div>
            </div>
          </div>
          <div className="sp-overlap-card" onClick={() => navigate("system-design")}>
            <h3>System Design</h3>
            <div className="sp-overlap-stats">
              <div className="sp-os"><strong>12</strong><span>FE Topics</span></div>
              <div className="sp-os"><strong>25</strong><span>BE Topics</span></div>
              <div className="sp-os"><strong>5</strong><span>Overlap</span></div>
            </div>
          </div>
          <div className="sp-overlap-card" onClick={() => navigate("machine-coding")}>
            <h3>Machine Coding</h3>
            <div className="sp-overlap-stats">
              <div className="sp-os"><strong>25</strong><span>FE UI</span></div>
              <div className="sp-os"><strong>20</strong><span>BE LLD</span></div>
              <div className="sp-os"><strong>0</strong><span>Overlap</span></div>
            </div>
          </div>
          <div className="sp-overlap-card" onClick={() => navigate("concepts")}>
            <h3>Core Concepts</h3>
            <div className="sp-overlap-stats">
              <div className="sp-os"><strong>30</strong><span>Frontend</span></div>
              <div className="sp-os"><strong>35</strong><span>Backend</span></div>
              <div className="sp-os"><strong>7</strong><span>Shared</span></div>
            </div>
          </div>
        </div>

        <div className="sp-insight">
          <h4>◆ Key Insight</h4>
          <p>DSA is the biggest common ground — 29 problems appear in both plans. Study these once, count them for both.</p>
          <p>
            System Design overlaps on 5 systems (Chat, Feed, E-commerce, Notifications, Collaborative Editor) but FE focuses on component architecture while BE focuses on distributed systems.
            Machine Coding is completely different: FE = UI components, BE = OOP / low-level design. Concepts barely overlap — FE covers JS/React internals, BE covers databases, caching, and microservices.
          </p>
        </div>
      </section>
    </>
  );
}
