import React from "react";
import useStudyStore from "../store/useStudyStore";
import { hashFor } from "../router";

export default function NotFound({ path }) {
  const navigate = useStudyStore((s) => s.navigate);

  return (
    <section className="sp-section sp-notfound">
      <div className="sp-notfound-card">
        <div className="sp-notfound-code">404</div>
        <h1>This route doesn’t exist</h1>
        <p>
          {path ? <code>#{path}</code> : "That page"} isn’t part of the study plan yet.
          Head back to the overview or jump straight into a topic.
        </p>
        <div className="sp-notfound-actions">
          <button className="sp-btn sp-btn-primary" onClick={() => navigate("overview")}>
            Back to overview
          </button>
          <a className="sp-btn sp-btn-ghost" href={hashFor("dsa")}>Browse DSA</a>
        </div>
      </div>
    </section>
  );
}
