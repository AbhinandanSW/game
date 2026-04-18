import React from "react";
import useStudyStore from "../store/useStudyStore";
import { signOut } from "../../firebase";

const LINKS = [
  { id: "overview", label: "Overview" },
  { id: "dsa", label: "DSA" },
  { id: "system-design", label: "System Design" },
  { id: "machine-coding", label: "Machine Coding" },
  { id: "concepts", label: "Concepts" },
  { id: "plan", label: "30-Day Plan" },
  { id: "js-problems", label: "JS Problems" },
  { id: "resources", label: "Resources" },
  { id: "editor", label: "Editor" },
];

export default function Nav() {
  const user = useStudyStore((s) => s.user);
  const route = useStudyStore((s) => s.route);
  const navigate = useStudyStore((s) => s.navigate);

  return (
    <nav className="sp-nav">
      <div className="sp-nav-inner">
        <div className="sp-brand" onClick={() => navigate("overview")}>
          <span className="sp-brand-dot" />
          <span>Skill Development Plan</span>
        </div>
        <div className="sp-nav-links">
          {LINKS.map((l) => (
            <a
              key={l.id}
              className={route.section === l.id ? "active" : ""}
              onClick={() => navigate(l.id)}
            >
              {l.label}
            </a>
          ))}
        </div>
        <div className="sp-nav-user">
          {user?.photoURL && <img src={user.photoURL} alt="" className="sp-avatar" />}
          <div className="sp-user-name">{user?.displayName?.split(" ")[0] || "User"}</div>
          <button className="sp-btn-icon" onClick={signOut} title="Sign out">⎋</button>
        </div>
      </div>
    </nav>
  );
}
