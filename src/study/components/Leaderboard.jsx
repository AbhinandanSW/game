import React, { useEffect, useState, useMemo } from "react";
import useStudyStore from "../store/useStudyStore";
import { subscribeAllUsers, subscribeAllProgressSummary } from "../../firebase";
import { ALL_DSA } from "../data/dsa";
import { JS_PROBLEMS } from "../data/jsProblems";

const TOTAL_TRACKABLE = ALL_DSA.length + JS_PROBLEMS.length;

export default function Leaderboard() {
  const currentUser = useStudyStore((s) => s.user);
  const myProgress = useStudyStore((s) => s.progress);
  const [users, setUsers] = useState([]);
  const [summaries, setSummaries] = useState({});

  useEffect(() => {
    const unsubU = subscribeAllUsers(setUsers);
    const unsubS = subscribeAllProgressSummary(setSummaries);
    return () => { unsubU && unsubU(); unsubS && unsubS(); };
  }, []);

  const myDone = useMemo(
    () => Object.values(myProgress).filter((p) => p?.done).length,
    [myProgress]
  );

  // Merge users + summaries
  const rows = useMemo(() => {
    const base = users.map((u) => {
      const sum = summaries[u.uid];
      const isMe = currentUser?.uid === u.uid;
      const done = isMe ? myDone : (sum?.done || 0);
      return {
        uid: u.uid,
        name: u.name || u.email?.split("@")[0] || "User",
        email: u.email,
        photo: u.photo,
        done,
        total: TOTAL_TRACKABLE,
        lastSeen: u.lastSeen,
        isMe,
      };
    });
    // Add myself if missing (first login)
    if (currentUser && !base.find(r => r.uid === currentUser.uid)) {
      base.push({
        uid: currentUser.uid,
        name: currentUser.displayName || currentUser.email?.split("@")[0] || "You",
        email: currentUser.email,
        photo: currentUser.photoURL,
        done: myDone,
        total: TOTAL_TRACKABLE,
        isMe: true,
      });
    }
    return base.sort((a, b) => b.done - a.done);
  }, [users, summaries, currentUser, myDone]);

  const myRank = rows.findIndex((r) => r.isMe) + 1;
  const topDone = rows[0]?.done || 0;

  return (
    <section className="sp-section">
      <div className="sp-section-head">
        <h2><span className="num">00</span>Dashboard</h2>
        <p className="sp-section-desc">
          See how you and your friends are progressing. Only totals are visible — your solutions stay private.
        </p>
      </div>

      <div className="sp-lb-summary">
        <div className="sp-lb-summary-card">
          <div className="sp-lb-label">Your Rank</div>
          <div className="sp-lb-big">{myRank > 0 ? `#${myRank}` : "—"}</div>
          <div className="sp-lb-sub">of {rows.length} {rows.length === 1 ? "player" : "players"}</div>
        </div>
        <div className="sp-lb-summary-card">
          <div className="sp-lb-label">Your Progress</div>
          <div className="sp-lb-big">{myDone} / {TOTAL_TRACKABLE}</div>
          <div className="sp-lb-sub">{((myDone / TOTAL_TRACKABLE) * 100).toFixed(1)}% complete</div>
        </div>
        <div className="sp-lb-summary-card">
          <div className="sp-lb-label">Top Player</div>
          <div className="sp-lb-big">{topDone}</div>
          <div className="sp-lb-sub">problems solved</div>
        </div>
      </div>

      <div className="sp-lb-list">
        <div className="sp-lb-head">
          <div>Rank</div>
          <div>Player</div>
          <div>Progress</div>
          <div>Count</div>
        </div>
        {rows.length === 0 && <div className="sp-empty">No players yet. Invite friends!</div>}
        {rows.map((r, i) => {
          const pct = r.total ? (r.done / r.total) * 100 : 0;
          const relativeToTop = topDone ? (r.done / topDone) * 100 : 0;
          return (
            <div key={r.uid} className={`sp-lb-row ${r.isMe ? "me" : ""}`}>
              <div className="sp-lb-rank">
                {i === 0 && <span className="sp-lb-medal">🥇</span>}
                {i === 1 && <span className="sp-lb-medal">🥈</span>}
                {i === 2 && <span className="sp-lb-medal">🥉</span>}
                {i > 2 && <span>#{i + 1}</span>}
              </div>
              <div className="sp-lb-player">
                {r.photo ? <img src={r.photo} alt="" className="sp-lb-avatar" />
                  : <div className="sp-lb-avatar-ph">{r.name[0]?.toUpperCase()}</div>}
                <div>
                  <div className="sp-lb-name">
                    {r.name}
                    {r.isMe && <span className="sp-lb-you-tag">YOU</span>}
                  </div>
                  <div className="sp-lb-email">{r.email}</div>
                </div>
              </div>
              <div className="sp-lb-bar">
                <div className="sp-lb-bar-track">
                  <div className="sp-lb-bar-fill" style={{ width: pct + "%" }} />
                  {!r.isMe && topDone > 0 && (
                    <div
                      className="sp-lb-bar-marker"
                      style={{ left: `${Math.min(100, relativeToTop * (topDone / r.total) * 100 / 100)}%` }}
                    />
                  )}
                </div>
                <div className="sp-lb-pct">{pct.toFixed(0)}%</div>
              </div>
              <div className="sp-lb-count">
                <strong>{r.done}</strong>
                <span>/{r.total}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
