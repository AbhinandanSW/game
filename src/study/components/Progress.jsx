import React from "react";
import useStudyStore from "../store/useStudyStore";
import { ALL_DSA } from "../data/dsa";
import { JS_PROBLEMS } from "../data/jsProblems";

export default function Progress() {
  const progress = useStudyStore((s) => s.progress);
  const total = ALL_DSA.length + JS_PROBLEMS.length;
  const done = Object.values(progress).filter((p) => p?.done).length;
  const pct = total ? (done / total) * 100 : 0;

  return (
    <div className="sp-progress-wrap">
      <div className="sp-progress-bar">
        <div className="sp-progress-fill" style={{ width: pct + "%" }} />
      </div>
      <div className="sp-progress-text">
        {done} / {total} complete · {Math.round(pct)}%
      </div>
    </div>
  );
}
