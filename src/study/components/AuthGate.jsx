import React, { useEffect, useState } from "react";
import useStudyStore from "../store/useStudyStore";
import {
  signInWithGoogle,
  signOut,
  configStatus,
  checkAllowlist,
  getAccessRequest,
  requestAccess,
  upsertUserProfile,
} from "../../firebase";
import { ALL_DSA } from "../data/dsa";
import { JS_PROBLEMS } from "../data/jsProblems";
import { SYSTEM_DESIGN } from "../data/systemDesign";
import { MACHINE_CODING } from "../data/machineCoding";
import { CONCEPTS_COMMON, CONCEPTS_FE, CONCEPTS_BE } from "../data/concepts";
import { BEHAVIORAL_PROMPTS } from "../data/behavioral";
import { getSection } from "../router";
import ThemeToggle from "./ThemeToggle";

const CONCEPT_COUNT = CONCEPTS_COMMON.length + CONCEPTS_FE.length + CONCEPTS_BE.length;

const PILLARS = [
  {
    icon: "⌘",
    title: `${ALL_DSA.length} DSA problems`,
    text: "Blind 75 → NeetCode 150 → Striver SDE, with patterns, company tiers, and built-in test cases.",
  },
  {
    icon: "◇",
    title: `${SYSTEM_DESIGN.length} design interviews`,
    text: "FE and BE prompts with reference approaches, trade-offs, and cross-questions.",
  },
  {
    icon: "⌬",
    title: `${MACHINE_CODING.length} machine coding katas`,
    text: "Inline IDE, runnable tests, and low-level design drills for both tracks.",
  },
  {
    icon: "✦",
    title: `${CONCEPT_COUNT} concept deep-dives`,
    text: `${JS_PROBLEMS.length} JS polyfills, ${BEHAVIORAL_PROMPTS.length} STAR prompts, and day-by-day plans.`,
  },
];

function Avatar({ user }) {
  if (user?.photoURL) {
    return <img className="sp-account-avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" />;
  }
  return (
    <div className="sp-account-avatar sp-account-avatar-ph" aria-hidden="true">
      {(user?.displayName || user?.email || "?")[0].toUpperCase()}
    </div>
  );
}

export default function AuthGate({ next = null }) {
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [note, setNote] = useState("");
  const [localErr, setLocalErr] = useState("");

  const accessUser = useStudyStore((s) => s.accessUser);
  const authStatus = useStudyStore((s) => s.authStatus);
  const authError = useStudyStore((s) => s.authError);
  const setAuthStatus = useStudyStore((s) => s.setAuthStatus);
  const setAccessUser = useStudyStore((s) => s.setAccessUser);
  const setUser = useStudyStore((s) => s.setUser);

  const nextSection = next ? getSection(String(next).replace(/^\//, "").split("/")[0]) : null;

  const handleSignIn = async () => {
    setLoading(true);
    setLocalErr("");
    setAuthStatus("idle");

    if (!configStatus.ok) {
      setLocalErr(`Firebase env vars not set: ${configStatus.missing.join(", ")}. Check .env or your host's env settings.`);
      setLoading(false);
      return;
    }

    const res = await signInWithGoogle();

    if (!res.ok) {
      setLocalErr(res.message);
      setLoading(false);
      return;
    }
    // StudyApp's subscribeAuth handler decides between "request access",
    // "pending approval", and letting the visitor in.
    setLoading(false);
  };

  const promote = async (u) => {
    try { await upsertUserProfile(u); } catch {}
    setAccessUser(null);
    setUser(u);
    setAuthStatus("idle");
  };

  const handleRequestAccess = async () => {
    if (!accessUser) return;
    setRequesting(true);
    setLocalErr("");
    try {
      await requestAccess(accessUser, note);
      setNote("");
      setAuthStatus("pending_approval");
    } catch (e) {
      setAuthStatus("error", e?.message || String(e));
    } finally {
      setRequesting(false);
    }
  };

  const handleCheckAgain = async () => {
    if (!accessUser) return;
    setChecking(true);
    setLocalErr("");
    const res = await checkAllowlist(accessUser.email);
    if (res.allowed) {
      await promote(accessUser);
      setChecking(false);
      return;
    }
    if (res.reason === "error") {
      setAuthStatus("error", res.message || "Allowlist check failed");
      setChecking(false);
      return;
    }
    if (res.reason === "pending") {
      setAuthStatus("pending_approval");
      setChecking(false);
      return;
    }
    const existing = await getAccessRequest(accessUser.email);
    if (existing?.error) {
      setAuthStatus("error", existing.error);
      setChecking(false);
      return;
    }
    setAuthStatus(existing ? "pending_approval" : "request_denied");
    setChecking(false);
  };

  const handleSwitchAccount = async () => {
    try { await signOut(); } catch {}
    setAccessUser(null);
    setAuthStatus("idle");
    setNote("");
    setLocalErr("");
  };

  // While waiting, re-check quietly so approval lands without a manual refresh.
  useEffect(() => {
    if (!accessUser || authStatus !== "pending_approval") return undefined;

    let stopped = false;
    const tick = async () => {
      const res = await checkAllowlist(accessUser.email);
      if (stopped) return;

      if (res.allowed) {
        try { await upsertUserProfile(accessUser); } catch {}
        if (stopped) return;
        setAccessUser(null);
        setUser(accessUser);
        setAuthStatus("idle");
        return;
      }

      if (res.reason === "not_listed") {
        const existing = await getAccessRequest(accessUser.email);
        if (stopped || existing?.error) return;
        if (!existing) setAuthStatus("request_denied");
      }
    };

    const id = setInterval(tick, 15000);
    const onFocus = () => tick();
    window.addEventListener("focus", onFocus);
    return () => {
      stopped = true;
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [accessUser, authStatus, setAccessUser, setUser, setAuthStatus]);

  const showRequest = !!accessUser && authStatus === "request_access";
  const showPending = !!accessUser && authStatus === "pending_approval";
  const showDeclined = !!accessUser && authStatus === "request_denied";
  const showError = authStatus === "error";
  const showChecking = !!accessUser && authStatus === "idle";
  const showSignIn = !showRequest && !showPending && !showDeclined && !showError && !showChecking;

  return (
    <div className="sp-login">
      <div className="sp-login-bg" aria-hidden="true" />

      <header className="sp-login-top">
        <span className="sp-brand">
          <span className="sp-brand-dot" aria-hidden="true" />
          <span className="sp-brand-text">
            <span className="sp-brand-title">Skill<em>Dev</em></span>
            <small>Interview Plan</small>
          </span>
        </span>
        <ThemeToggle />
      </header>

      <div className="sp-login-grid">
        <section className="sp-login-pitch">
          <div className="sp-hero-tag">◆ Frontend &amp; Backend · Invite-only</div>
          <h1 className="sp-login-h1">
            One plan.<br />
            <em>Two tracks.</em><br />
            Zero wasted hours.
          </h1>
          <p className="sp-login-sub">
            Sign in once and your whole prep travels with you — completed problems, saved code,
            design answers, and STAR stories synced across every device.
          </p>

          <ul className="sp-login-points">
            {PILLARS.map((p) => (
              <li key={p.title}>
                <span className="sp-login-ico" aria-hidden="true">{p.icon}</span>
                <span>
                  <strong>{p.title}</strong>
                  <span className="sp-login-point-text">{p.text}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="sp-login-stats">
            <div className="sp-login-stat">
              <strong>{ALL_DSA.length + JS_PROBLEMS.length}</strong>
              <span>tracked problems</span>
            </div>
            <div className="sp-login-stat">
              <strong>{SYSTEM_DESIGN.length + MACHINE_CODING.length}</strong>
              <span>design &amp; kata</span>
            </div>
            <div className="sp-login-stat">
              <strong>{CONCEPT_COUNT}</strong>
              <span>concepts</span>
            </div>
            <div className="sp-login-stat">
              <strong>30</strong>
              <span>day plan</span>
            </div>
          </div>
        </section>

        <section className="sp-login-panel">
          <div className="sp-login-card">
            {showSignIn && (
              <>
                <h2 className="sp-login-card-title">
                  {nextSection ? `Sign in to open ${nextSection.label}` : "Sign in to save your progress"}
                </h2>
                <p className="sp-login-card-sub">
                  Access is invite-only. Sign in with Google, then request access — an admin
                  approves each account. Your solutions stay private; the leaderboard only shows totals.
                </p>

                <button className="sp-btn-google" onClick={handleSignIn} disabled={loading}>
                  <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }} aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {loading ? "Signing in..." : "Continue with Google"}
                </button>

                {localErr && <p className="sp-auth-err">{localErr}</p>}

                {next && (
                  <p className="sp-login-next">
                    <span aria-hidden="true">→</span> After approval you'll land on
                    <code>{next}</code>
                  </p>
                )}

                <div className="sp-login-note">
                  <strong>Deploying to Vercel?</strong> Add <code>your-app.vercel.app</code> to
                  Firebase Console → Authentication → Settings → Authorized domains, and set the{" "}
                  <code>REACT_APP_FIREBASE_*</code> env vars in your host's dashboard.
                </div>
              </>
            )}

            {showChecking && (
              <>
                <div className="sp-login-state-icon" style={{ color: "var(--ink-faint)" }} aria-hidden="true">⧗</div>
                <h2 className="sp-login-card-title">Checking access…</h2>
                <p className="sp-login-card-sub">
                  One moment while we check whether <strong>{accessUser?.email}</strong> is approved.
                </p>
              </>
            )}

            {showRequest && (
              <>
                <h2 className="sp-login-card-title">Request access</h2>
                <p className="sp-login-card-sub">
                  This workspace is invite-only and your Google account isn't on the allowlist yet.
                  Send a request and an admin will review it.
                </p>

                <div className="sp-account">
                  <Avatar user={accessUser} />
                  <div className="sp-account-meta">
                    <strong>{accessUser?.displayName || "Signed in"}</strong>
                    <span>{accessUser?.email}</span>
                  </div>
                </div>

                <label className="sp-field-label" htmlFor="sp-request-note">
                  Why do you need access? <span>optional</span>
                </label>
                <textarea
                  id="sp-request-note"
                  className="sp-textarea"
                  rows={3}
                  maxLength={280}
                  placeholder="e.g. Preparing for a frontend interview — referred by ..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={requesting}
                />
                <div className="sp-field-count">{note.length}/280</div>

                <button className="sp-btn sp-btn-primary sp-btn-block" onClick={handleRequestAccess} disabled={requesting}>
                  {requesting ? "Sending request..." : "Request access"}
                </button>

                <button className="sp-login-link" onClick={handleSwitchAccount} type="button">
                  Use a different account
                </button>

                {localErr && <p className="sp-auth-err">{localErr}</p>}
              </>
            )}

            {showPending && (
              <>
                <div className="sp-login-state-icon" style={{ color: "var(--accent-2)" }} aria-hidden="true">⧗</div>
                <h2 className="sp-login-card-title">Access <em>pending</em></h2>
                <p className="sp-login-card-sub">
                  Request sent for <strong>{accessUser?.email}</strong>. An admin will review it —
                  this page checks automatically, so you can leave it open.
                </p>

                <div className="sp-account">
                  <Avatar user={accessUser} />
                  <div className="sp-account-meta">
                    <strong>{accessUser?.displayName || "Signed in"}</strong>
                    <span>{accessUser?.email}</span>
                  </div>
                </div>

                <button className="sp-btn sp-btn-ghost sp-btn-block" onClick={handleCheckAgain} disabled={checking}>
                  {checking ? "Checking..." : "Check again"}
                </button>

                <p className="sp-login-auto">
                  <span className="sp-login-dot" aria-hidden="true" /> Auto-checking every 15 seconds
                </p>

                <button className="sp-login-link" onClick={handleSwitchAccount} type="button">
                  Use a different account
                </button>
              </>
            )}

            {showDeclined && (
              <>
                <div className="sp-login-state-icon" style={{ color: "var(--hard)" }} aria-hidden="true">✕</div>
                <h2 className="sp-login-card-title">Request <em>declined</em></h2>
                <p className="sp-login-card-sub">
                  No pending request for <strong>{accessUser?.email}</strong>. An admin may have
                  declined it — you can ask again if you think that was a mistake.
                </p>

                <button className="sp-btn sp-btn-primary sp-btn-block" onClick={() => setAuthStatus("request_access")}>
                  Request access again
                </button>

                <button className="sp-login-link" onClick={handleSwitchAccount} type="button">
                  Use a different account
                </button>
              </>
            )}

            {showError && (
              <>
                <div className="sp-login-state-icon" style={{ color: "var(--hard)" }} aria-hidden="true">!</div>
                <h2 className="sp-login-card-title">Couldn't complete that</h2>
                <p className="sp-login-card-sub">
                  We couldn't verify your access or save the request. This is usually a Firestore
                  rules or network issue.
                  {authError && (
                    <>
                      <br />
                      <code style={{ color: "var(--hard)" }}>{authError}</code>
                    </>
                  )}
                </p>

                <button className="sp-btn sp-btn-primary sp-btn-block" onClick={handleCheckAgain} disabled={checking || !accessUser}>
                  {checking ? "Checking..." : "Try again"}
                </button>

                {accessUser && (
                  <button className="sp-login-link" onClick={() => setAuthStatus("request_access")} type="button">
                    Back to request form
                  </button>
                )}

                <button className="sp-login-link" onClick={handleSwitchAccount} type="button">
                  Sign out
                </button>
              </>
            )}
          </div>

          <p className="sp-login-fineprint">
            Progress is stored in your own Firestore documents · Sign out any time from the top bar.
          </p>
        </section>
      </div>
    </div>
  );
}
