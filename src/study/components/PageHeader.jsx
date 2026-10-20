import React from "react";

/**
 * Shared page heading used by every top-level page so the UI stays
 * consistent no matter which route you land on.
 */
export default function PageHeader({ eyebrow, title, description, actions, children }) {
  return (
    <header className="sp-page-head">
      <div className="sp-page-head-main">
        {eyebrow && <div className="sp-page-eyebrow">{eyebrow}</div>}
        <h1 className="sp-page-title">{title}</h1>
        {description && <p className="sp-page-desc">{description}</p>}
      </div>
      {actions && <div className="sp-page-head-actions">{actions}</div>}
      {children}
    </header>
  );
}
