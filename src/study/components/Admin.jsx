import React, { useEffect, useState } from "react";
import useStudyStore from "../store/useStudyStore";
import {
  subscribeAllowlist,
  subscribeAccessRequests,
  approveUser,
  revokeUser,
  denyRequest,
  isAdminEmail,
} from "../../firebase";

export default function Admin() {
  const user = useStudyStore((s) => s.user);
  const setToast = useStudyStore((s) => s.setToast);
  const [allowlist, setAllowlist] = useState([]);
  const [requests, setRequests] = useState([]);
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    const u1 = subscribeAllowlist(setAllowlist);
    const u2 = subscribeAccessRequests(setRequests);
    return () => { u1 && u1(); u2 && u2(); };
  }, []);

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
