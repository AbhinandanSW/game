import React, { useEffect, useState } from "react";
import useStudyStore from "../store/useStudyStore";
import {
  subscribeAllowlist,
  subscribeAccessRequests,
  approveUser,
  revokeUser,
  denyRequest,
  isAdminEmail,
  checkAdminDoc,
} from "../../firebase";
import { seedAllContent } from "../services/contentService";

export default function Admin() {
  const user = useStudyStore((s) => s.user);
  const setToast = useStudyStore((s) => s.setToast);
  const [allowlist, setAllowlist] = useState([]);
  const [requests, setRequests] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [seedLog, setSeedLog] = useState("");
  const [seedResult, setSeedResult] = useState(null);

  const [adminCheck, setAdminCheck] = useState(null);

  useEffect(() => {
    const u1 = subscribeAllowlist(setAllowlist);
    const u2 = subscribeAccessRequests(setRequests);
    // Check admin doc status
    if (user?.uid) {
      checkAdminDoc(user.uid).then(setAdminCheck);
    }
    return () => { u1 && u1(); u2 && u2(); };
  }, [user?.uid]);

  // Guard: only admins can view this page
  if (!isAdminEmail(user?.email)) {
    return (
      <section className="sp-section">
        <div className="sp-admin-denied">
          <h2>Admin only</h2>
          <p>This page is restricted to admins. Add your email to <code>REACT_APP_ADMIN_EMAILS</code> in the environment variables.</p>
        </div>
      </section>
    );
  }

  const handleApproveRequest = async (req) => {
    try {
      await approveUser(req.email, user.email);
      setToast(`Approved ${req.email}`);
    } catch (e) {
      setToast("Error: " + e.message);
    }
  };

  const handleDenyRequest = async (req) => {
    if (!window.confirm(`Deny access request from ${req.email}?`)) return;
    await denyRequest(req.email);
    setToast(`Denied ${req.email}`);
  };

  const handleRevoke = async (entry) => {
    if (!window.confirm(`Revoke access for ${entry.email}? They'll be signed out on next check.`)) return;
    try {
      await revokeUser(entry.email);
      setToast(`Revoked ${entry.email}`);
    } catch (e) {
      setToast("Error: " + e.message);
    }
  };

  const [seedError, setSeedError] = useState(null);
  const handleSeedContent = async () => {
    if (!window.confirm("Seed all hardcoded content to Firestore? This uploads everything. Existing items with same IDs will be overwritten.")) return;
    setSeeding(true);
    setSeedLog("Starting...");
    setSeedResult(null);
    setSeedError(null);
    try {
      const result = await seedAllContent((msg) => setSeedLog(msg));
      setSeedResult(result);
      setSeedLog("Complete.");
      setToast("Content synced to Firestore");
    } catch (e) {
      const errMsg = e?.message || String(e);
      const code = e?.code || "";
      let helpful = "";
      if (code === "permission-denied" || errMsg.includes("permission")) {
        helpful = "\n\n→ Firestore rules are blocking the write. Add this rule: allow write on /content/{kind}/items/{id} for admins only. See instructions below.";
      } else if (errMsg.includes("invalid") || errMsg.includes("nested")) {
        helpful = "\n\n→ Data format issue. If you just updated the app, do a fresh build.";
      } else if (errMsg.includes("quota")) {
        helpful = "\n\n→ Firestore free tier quota exceeded. Wait 24h or upgrade to Blaze plan.";
      }
      setSeedError({ message: errMsg, code, helpful });
      setSeedLog("Failed.");
      setToast("Seed failed — see error below");
    } finally {
      setSeeding(false);
    }
  };

  const handleAddManual = async (e) => {
    e.preventDefault();
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) { setToast("Invalid email"); return; }
    try {
      await approveUser(email, user.email);
      setNewEmail("");
      setToast(`Added ${email}`);
    } catch (err) {
      setToast("Error: " + err.message);
    }
  };

  const sortedRequests = [...requests].sort((a, b) => {
    const ta = a.requestedAt?.seconds || 0;
    const tb = b.requestedAt?.seconds || 0;
    return tb - ta;
  });

  return (
    <section className="sp-section">
      <div className="sp-section-head">
        <h2><span className="num">★</span>Admin Panel</h2>
        <p className="sp-section-desc">
          Manage who can access the platform. Pending requests at the top.
        </p>
      </div>

      {/* Admin Identity Debug */}
      <div className="sp-admin-block">
        <div className="sp-admin-block-head">
          <h3>Admin Status</h3>
          <p>Verify your Firestore admin setup. Your UID must exist as a doc in the <code style={{ background: "var(--bg)", padding: "1px 5px", borderRadius: "3px", color: "var(--accent-2)" }}>admins</code> collection.</p>
        </div>
        <div style={{ background: "var(--bg)", padding: "14px 18px", borderRadius: "4px", fontFamily: "var(--mono)", fontSize: "12px", lineHeight: 1.8 }}>
          <div><span style={{ color: "var(--ink-faint)" }}>Email:</span> <strong>{user?.email}</strong></div>
          <div>
            <span style={{ color: "var(--ink-faint)" }}>Your UID:</span>{" "}
            <strong
              style={{ color: "var(--accent-3)", cursor: "pointer", userSelect: "all" }}
              onClick={() => { navigator.clipboard?.writeText(user?.uid); setToast("UID copied"); }}
              title="Click to copy"
            >
              {user?.uid}
            </strong>
          </div>
          <div>
            <span style={{ color: "var(--ink-faint)" }}>Env admin email:</span>{" "}
            <strong style={{ color: isAdminEmail(user?.email) ? "var(--easy)" : "var(--hard)" }}>
              {isAdminEmail(user?.email) ? "✓ YES" : "✗ NO"}
            </strong>
          </div>
          <div>
            <span style={{ color: "var(--ink-faint)" }}>Firestore admins/{user?.uid}:</span>{" "}
            {adminCheck === null ? (
              <span style={{ color: "var(--ink-faint)" }}>checking...</span>
            ) : adminCheck.exists ? (
              <strong style={{ color: "var(--easy)" }}>✓ EXISTS — writes will work</strong>
            ) : (
              <strong style={{ color: "var(--hard)" }}>✗ MISSING — writes will fail</strong>
            )}
          </div>
          {adminCheck && !adminCheck.exists && (
            <div style={{ marginTop: "12px", padding: "12px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)", borderLeft: "2px solid var(--hard)", borderRadius: "3px", fontSize: "12px", color: "var(--ink-dim)", lineHeight: 1.7 }}>
              <strong style={{ color: "var(--hard)" }}>Fix:</strong><br />
              1. Firebase Console → Firestore → Data<br />
              2. Click <strong>"Start collection"</strong><br />
              3. Collection ID: <code>admins</code><br />
              4. Document ID: paste your UID above (click to copy): <code>{user?.uid}</code><br />
              5. Add a field: <code>email</code> (string) = <code>{user?.email}</code><br />
              6. Save → refresh this page
            </div>
          )}
        </div>
      </div>

      {/* Access Requests */}
      <div className="sp-admin-block">
        <div className="sp-admin-block-head">
          <h3>Access Requests ({sortedRequests.length})</h3>
          <p>People who tried to sign in but aren't on the allowlist yet.</p>
        </div>
        {sortedRequests.length === 0 ? (
          <div className="sp-empty">No pending requests.</div>
        ) : (
          <div className="sp-admin-list">
            {sortedRequests.map((req) => (
              <div key={req.id} className="sp-admin-row">
                <div className="sp-admin-user">
                  {req.photo ? <img src={req.photo} alt="" className="sp-lb-avatar" />
                    : <div className="sp-lb-avatar-ph">{req.name?.[0]?.toUpperCase() || "?"}</div>}
                  <div>
                    <div className="sp-admin-name">{req.name || "Unknown"}</div>
                    <div className="sp-admin-email">{req.email}</div>
                  </div>
                </div>
                <div className="sp-admin-actions">
                  <button className="sp-btn sp-btn-primary" onClick={() => handleApproveRequest(req)}>Approve</button>
                  <button className="sp-btn sp-btn-ghost" onClick={() => handleDenyRequest(req)}>Deny</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual add */}
      <div className="sp-admin-block">
        <div className="sp-admin-block-head">
          <h3>Add Email Manually</h3>
          <p>Invite someone directly without them requesting first.</p>
        </div>
        <form className="sp-admin-add-form" onSubmit={handleAddManual}>
          <input
            type="email"
            className="sp-search"
            placeholder="friend@gmail.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <button type="submit" className="sp-btn sp-btn-primary">Add to Allowlist</button>
        </form>
      </div>

      {/* Content Sync */}
      <div className="sp-admin-block">
        <div className="sp-admin-block-head">
          <h3>Content Sync</h3>
          <p>Upload all hardcoded content (DSA, System Design, Concepts, Plans, etc.) to Firestore. Run once to seed, or re-run to update.</p>
        </div>
        <div className="sp-admin-add-form">
          <button className="sp-btn sp-btn-primary" onClick={handleSeedContent} disabled={seeding}>
            {seeding ? "Syncing..." : "Sync all content to Firestore"}
          </button>
          {seedLog && (
            <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--ink-dim)", alignSelf: "center" }}>
              {seedLog}
            </span>
          )}
        </div>
        {seedResult && (
          <div style={{ marginTop: "14px", padding: "12px", background: "var(--bg)", borderRadius: "4px", fontFamily: "var(--mono)", fontSize: "12px", color: "var(--ink-dim)" }}>
            <strong style={{ color: "var(--accent-3)" }}>Synced:</strong>{" "}
            DSA: {seedResult.dsa} · System Design: {seedResult.sd} · Machine Coding: {seedResult.mc} ·
            JS: {seedResult.js} · Concepts: {seedResult.concepts} · Plans: {seedResult.plans} ·
            Behavioral: {seedResult.behavioral} · Resources: {seedResult.resources}
          </div>
        )}
        {seedError && (
          <div style={{ marginTop: "14px", padding: "14px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)", borderLeft: "3px solid var(--hard)", borderRadius: "4px" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--hard)", letterSpacing: "0.1em", marginBottom: "6px", textTransform: "uppercase" }}>
              Error {seedError.code && `· ${seedError.code}`}
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--ink-dim)", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
              {seedError.message}
              {seedError.helpful}
            </div>
          </div>
        )}

        <div style={{ marginTop: "14px", padding: "12px", background: "var(--bg)", borderRadius: "4px", fontSize: "12px", color: "var(--ink-dim)", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--accent-2)" }}>Firestore rules required:</strong>{" "}
          Add this block to your rules (Firebase Console → Firestore → Rules):
          <pre style={{ marginTop: "8px", padding: "10px", background: "#0a0a0d", borderRadius: "3px", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent-3)", overflowX: "auto" }}>
{`match /content/{kind}/items/{id} {
  allow read: if isAuthed();
  allow write: if isAdmin();
}`}
          </pre>
        </div>
      </div>

      {/* Allowlist */}
      <div className="sp-admin-block">
        <div className="sp-admin-block-head">
          <h3>Allowlist ({allowlist.length})</h3>
          <p>Currently approved users. Click revoke to remove access.</p>
        </div>
        {allowlist.length === 0 ? (
          <div className="sp-empty">Allowlist is empty. Admins (you) bypass it via env var.</div>
        ) : (
          <div className="sp-admin-list">
            {allowlist.map((entry) => (
              <div key={entry.id} className="sp-admin-row">
                <div className="sp-admin-user">
                  <div className="sp-lb-avatar-ph">{entry.email?.[0]?.toUpperCase()}</div>
                  <div>
                    <div className="sp-admin-name">{entry.email}</div>
                    <div className="sp-admin-email">Added by {entry.addedBy || "admin"}</div>
                  </div>
                </div>
                <div className="sp-admin-actions">
                  <button className="sp-btn sp-btn-danger" onClick={() => handleRevoke(entry)}>Revoke</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
