import React, { useEffect, useState } from "react";
import useStudyStore from "../store/useStudyStore";
import { signOut, isAdminEmail } from "../../firebase";
import { SECTIONS, hashFor } from "../router";
import ThemeToggle from "./ThemeToggle";

export default function Nav() {
  const user = useStudyStore((s) => s.user);
  const route = useStudyStore((s) => s.route);
  const navigate = useStudyStore((s) => s.navigate);
  const [menuOpen, setMenuOpen] = useState(false);

  const links = SECTIONS.filter(
    (s) => !s.public && (!s.adminOnly || isAdminEmail(user?.email))
  );

  const handleSignOut = async () => {
    await signOut();
    navigate("login");
  };

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [route.section, route.itemId]);

  return (
    <header className="sp-nav">
      <div className="sp-nav-inner">
        <a className="sp-brand" href={hashFor("overview")}>
          <span className="sp-brand-dot" aria-hidden="true" />
          <span className="sp-brand-text">
            <span className="sp-brand-title">Skill<em>Dev</em></span>
            <small>Interview Plan</small>
          </span>
        </a>

        <nav
          className={`sp-nav-links ${menuOpen ? "open" : ""}`}
          aria-label="Main navigation"
        >
          {links.map((l) => {
            const active = route.section === l.id;
            return (
              <a
                key={l.id}
                href={hashFor(l.id)}
                className={active ? "active" : ""}
                aria-current={active ? "page" : undefined}
              >
                <span className="sp-nav-icon" aria-hidden="true">{l.icon}</span>
                {l.label}
              </a>
            );
          })}
        </nav>

        <div className="sp-nav-actions">
          <ThemeToggle />
          <div className="sp-nav-user">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="sp-avatar" referrerPolicy="no-referrer" />
            ) : (
              <span className="sp-avatar sp-avatar-ph" aria-hidden="true">
                {(user?.displayName || user?.email || "U")[0].toUpperCase()}
              </span>
            )}
            <span className="sp-user-name">{user?.displayName?.split(" ")[0] || "User"}</span>
            <button className="sp-btn-icon" onClick={handleSignOut} title="Sign out" aria-label="Sign out">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
          <button
            type="button"
            className={`sp-nav-burger ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {menuOpen && <button className="sp-nav-scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
    </header>
  );
}
