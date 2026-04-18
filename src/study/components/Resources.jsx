import React from "react";
import { RESOURCES } from "../data/resources";

export default function Resources() {
  return (
    <section className="sp-section">
      <div className="sp-section-head">
        <h2><span className="num">08</span>Resources &amp; Tips</h2>
        <p className="sp-section-desc">Books, channels, and strategies that work for Indian startup & MNC interview loops.</p>
      </div>

      <div className="sp-resource-grid">
        {RESOURCES.map((r, i) => (
          <div key={i} className="sp-resource">
            <div className="sp-resource-cat">{r.cat} · {r.p}</div>
            <div className="sp-resource-name">{r.n}</div>
            <div className="sp-resource-desc">{r.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
