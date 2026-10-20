import React from "react";
import { RESOURCES } from "../data/resources";
import PageHeader from "./PageHeader";

export default function Resources() {
  return (
    <section className="sp-section">
      <PageHeader
        eyebrow="08 · Library"
        title="Resources & Tips"
        description="Books, channels, and strategies that work for Indian startup & MNC interview loops."
        actions={
          <div className="sp-head-stat">
            <strong>{RESOURCES.length}</strong>
            <span>handpicked resources</span>
          </div>
        }
      />

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
