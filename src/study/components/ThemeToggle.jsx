import React from "react";
import useStudyStore from "../store/useStudyStore";

export default function ThemeToggle({ compact = false }) {
  const theme = useStudyStore((s) => s.theme);
  const toggleTheme = useStudyStore((s) => s.toggleTheme);
  const isDark = theme === "dark";
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      className={`sp-theme-toggle ${compact ? "compact" : ""}`}
      onClick={toggleTheme}
      title={label}
      aria-label={label}
      aria-pressed={isDark}
    >
      <span className="sp-theme-track" aria-hidden="true">
        <span className="sp-theme-icon sun">☀</span>
        <span className="sp-theme-icon moon">☾</span>
        <span className="sp-theme-thumb" />
      </span>
      {!compact && <span className="sp-theme-label">{isDark ? "Dark" : "Light"}</span>}
    </button>
  );
}
