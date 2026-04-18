import React, { useState } from "react";
import useStudyStore from "../store/useStudyStore";
import { signInWithGoogle, configStatus } from "../../firebase";

export default function AuthGate() {
  const [loading, setLoading] = useState(false);
  const [localErr, setLocalErr] = useState("");
  const authStatus = useStudyStore((s) => s.authStatus);
  const authError = useStudyStore((s) => s.authError);
  const setAuthStatus = useStudyStore((s) => s.setAuthStatus);

  const handleSignIn = async () => {
    setLoading(true);
    setLocalErr("");
    setAuthStatus("idle");

    if (!configStatus.ok) {
      setLocalErr(`Firebase env vars not set: ${configStatus.missing.join(", ")}. Check .env or Vercel env settings.`);
      setLoading(false);
      return;
    }

    const res = await signInWithGoogle();

    if (!res.ok) {
      setLocalErr(res.message);
      setLoading(false);
      return;
    }
    // The rest — allowlist check, access request logging, sign-out if denied —
    // is handled centrally in StudyApp's subscribeAuth handler.
    setLoading(false);
  };

  // Show states based on store authStatus after sign-in attempt
  const showPending = authStatus === "pending_approval";
  const showDenied = authStatus === "denied";

  return (
    <div className="sp-auth">
      <div className="sp-auth-bg" />
      <div className="sp-auth-card">
        <div className="sp-auth-brand">
          <span className="sp-auth-dot" />
          <span>Skill Development Plan</span>
        </div>

        {!showPending && !showDenied && (
          <>
            <h1 className="sp-auth-title">
              Sign in to <em>save your progress</em>
            </h1>
            <p className="sp-auth-sub">
              Track every problem, store your code, save answers, and sync across devices with your friends.
              Access is invite-only — your email must be on the allowlist.
            </p>

            <button className="sp-btn-google" onClick={handleSignIn} disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? "Signing in..." : "Continue with Google"}
            </button>

            {localErr && <p className="sp-auth-err">{localErr}</p>}

            <div className="sp-auth-note">
              <strong>Deploying to Vercel?</strong> Add <code>your-app.vercel.app</code> to
              Firebase Console → Authentication → Settings → Authorized domains.
              Also set <code>REACT_APP_FIREBASE_*</code> env vars in Vercel dashboard.
            </div>
          </>
        )}

        {showPending && (
          <>
            <div className="sp-auth-state-icon" style={{ color: "var(--accent-2)" }}>⧗</div>
            <h1 className="sp-auth-title">Access <em>pending</em></h1>
            <p className="sp-auth-sub">
              Your request has been logged. An admin will review and approve your account. You can try signing in again in a few minutes.
            </p>
            <button className="sp-btn sp-btn-ghost" onClick={() => setAuthStatus("idle")}>Back</button>
          </>
        )}

        {showDenied && (
          <>
            <div className="sp-auth-state-icon" style={{ color: "var(--hard)" }}>✕</div>
            <h1 className="sp-auth-title">Access <em>denied</em></h1>
            <p className="sp-auth-sub">
              Could not log your request. Firestore rules may be blocking the write.
              {authError && <><br /><code style={{ color: "var(--hard)" }}>{authError}</code></>}
            </p>
            <button className="sp-btn sp-btn-ghost" onClick={() => setAuthStatus("idle")}>Back</button>
          </>
        )}
      </div>
    </div>
  );
}
