import React from "react";
import useStudyStore from "../store/useStudyStore";

export default function Toast() {
  const toast = useStudyStore((s) => s.toast);
  return <div className={`sp-toast ${toast ? "show" : ""}`}>{toast}</div>;
}
