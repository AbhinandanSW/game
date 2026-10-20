import React from "react";
import { getSection, hashFor } from "../router";

export default function Breadcrumbs({ section, current }) {
  const def = getSection(section);

  return (
    <nav className="sp-crumbs" aria-label="Breadcrumb">
      <a href={hashFor("overview")}>Home</a>
      {def && def.id !== "overview" && (
        <>
          <span className="sp-crumb-sep" aria-hidden="true">/</span>
          <a href={hashFor(def.id)}>{def.label}</a>
        </>
      )}
      {current && (
        <>
          <span className="sp-crumb-sep" aria-hidden="true">/</span>
          <span className="sp-crumb-current" aria-current="page">{current}</span>
        </>
      )}
    </nav>
  );
}
