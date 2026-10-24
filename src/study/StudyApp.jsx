import React, { useEffect } from "react";
import useStudyStore from "./store/useStudyStore";
import {
  subscribeAuth,
  subscribeProgress,
  subscribeAnswers,
  subscribeEntries,
  checkAllowlist,
  getAccessRequest,
  upsertUserProfile,
  updateProgressSummary,
} from "../firebase";
import { fetchContent } from "./services/contentService";
import { ALL_DSA } from "./data/dsa";
import { JS_PROBLEMS } from "./data/jsProblems";
import { getSection, parseHash, hashForLogin } from "./router";
import { applyTheme } from "./theme";
import AuthGate from "./components/AuthGate";
import Nav from "./components/Nav";
import Overview from "./components/Overview";
import Leaderboard from "./components/Leaderboard";
import Admin from "./components/Admin";
import Behavioral from "./components/Behavioral";
import DSA from "./components/DSA";
import DSAProblem from "./components/DSAProblem";
import SystemDesign from "./components/SystemDesign";
import SystemDesignDetail from "./components/SystemDesignDetail";
import MachineCoding from "./components/MachineCoding";
import MachineCodingDetail from "./components/MachineCodingDetail";
import Concepts from "./components/Concepts";
import ConceptDetail from "./components/ConceptDetail";
import Plan from "./components/Plan";
import JSProblems from "./components/JSProblems";
import JSProblemDetail from "./components/JSProblemDetail";
import Resources from "./components/Resources";
import Editor from "./components/Editor";
import Progress from "./components/Progress";
import Toast from "./components/Toast";
import NotFound from "./components/NotFound";

export default function StudyApp() {
  const user = useStudyStore((s) => s.user);
  const authLoading = useStudyStore((s) => s.authLoading);
  const setUser = useStudyStore((s) => s.setUser);
  const setProgress = useStudyStore((s) => s.setProgress);
  const setAnswers = useStudyStore((s) => s.setAnswers);
  const setEntries = useStudyStore((s) => s.setEntries);
  const route = useStudyStore((s) => s.route);
  const setRoute = useStudyStore((s) => s.setRoute);
  const theme = useStudyStore((s) => s.theme);

  // Hash router — keeps the URL in sync with the active page so every route is
  // shareable, bookmarkable, and works with the browser back/forward buttons.
  useEffect(() => {
    const sync = () => setRoute(parseHash(window.location.hash));

    if (!window.location.hash) {
      window.history.replaceState(null, "", "#/overview");
    } else {
      sync();
    }

    const onStorage = (e) => {
      if (e.key !== "sdp-theme") return;
      const next = e.newValue === "light" ? "light" : e.newValue === "dark" ? "dark" : null;
      if (next) useStudyStore.getState().setTheme(next);
    };

    window.addEventListener("hashchange", sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("storage", onStorage);
    };
  }, [setRoute]);

  // Keep the <html data-theme> attribute + document title in sync.
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Signed out: send protected routes to the login screen, remembering the target.
  useEffect(() => {
    if (authLoading || user) return;
    if (route.section === "login") return;
    const next = route.path && route.path !== "/overview" ? route.path : null;
    const target = hashForLogin(next);
    window.history.replaceState(null, "", target);
    setRoute(parseHash(target));
  }, [authLoading, user, route.section, route.path, setRoute]);

  // Signed in: the login screen is never a destination.
  const nextTarget = route.query?.next || "";
  useEffect(() => {
    if (authLoading || !user || route.section !== "login") return;
    const target = nextTarget || "/overview";
    window.history.replaceState(null, "", `#${target}`);
    setRoute(parseHash(target));
  }, [authLoading, user, route.section, nextTarget, setRoute]);

  useEffect(() => {
    const def = getSection(route.section);
    const routeTitle = def
      ? `${def.label} · Skill Development Plan`
      : "Page not found · Skill Development Plan";
    document.title = user ? routeTitle : "Sign in · Skill Development Plan";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [route.section, route.itemId, user]);

  // Auth subscription — check allowlist on every auth state change
  // Handles: fresh sign-in, stale session (admin revoked), sign-out
  useEffect(() => {
    const setAuthStatus = useStudyStore.getState().setAuthStatus;
    const setAccessUser = useStudyStore.getState().setAccessUser;
    const unsub = subscribeAuth(async (u) => {
      if (!u) {
        setUser(null);
        setAccessUser(null);
        setAuthStatus("idle");
        return;
      }

      const check = await checkAllowlist(u.email);

      if (check.allowed) {
        // Approved — upsert profile + set user.
        try { await upsertUserProfile(u); } catch {}
        setAccessUser(null);
        setUser(u);
        setAuthStatus("idle");
        return;
      }

      // Not approved. Keep the Firebase session alive (so the visitor can file an
      // access request) but withhold app access by leaving `user` empty.
      setUser(null);
      setAccessUser(u);

      if (check.reason === "error") {
        setAuthStatus("error", check.message || "Allowlist check failed");
        return;
      }

      // Someone added them with approved:false, or an admin hasn't looked yet.
      if (check.reason === "pending") {
        setAuthStatus("pending_approval");
        return;
      }

      // First visit: has this account already asked for access?
      const existing = await getAccessRequest(u.email);
      if (existing?.error) {
        setAuthStatus("error", existing.error);
        return;
      }
      setAuthStatus(existing ? "pending_approval" : "request_access");
    });
    return () => unsub && unsub();
  }, [setUser]);

  // User data subscriptions
  useEffect(() => {
    if (!user) {
      setProgress({});
      setAnswers({});
      setEntries([]);
      return;
    }
    const unsubP = subscribeProgress(user.uid, setProgress);
    const unsubA = subscribeAnswers(user.uid, setAnswers);
    const unsubE = subscribeEntries(user.uid, setEntries);
    return () => {
      unsubP && unsubP();
      unsubA && unsubA();
      unsubE && unsubE();
    };
  }, [user, setProgress, setAnswers, setEntries]);

  // Load content overrides from Firestore (once, on first signed-in render)
  useEffect(() => {
    if (!user) return;
    const setContentOverrides = useStudyStore.getState().setContentOverrides;
    const kinds = ["dsa", "systemDesign", "machineCoding", "jsProblems", "concepts", "plans", "behavioral", "resources"];
    kinds.forEach(async (kind) => {
      const items = await fetchContent(kind);
      if (items && Object.keys(items).length > 0) setContentOverrides(kind, items);
    });
  }, [user]);

  // Publish progress summary whenever progress changes (debounced)
  const progress = useStudyStore((s) => s.progress);
  useEffect(() => {
    if (!user) return;
    const done = Object.values(progress).filter((p) => p?.done).length;
    const total = ALL_DSA.length + JS_PROBLEMS.length;
    const t = setTimeout(() => updateProgressSummary(user.uid, done, total), 1500);
    return () => clearTimeout(t);
  }, [progress, user]);

  if (authLoading) {
    return (
      <div className="sp-loading">
        <div className="sp-loading-inner">Loading...</div>
      </div>
    );
  }

  if (!user) {
    // While the redirect effect catches up, still show the login screen with the
    // destination the visitor originally asked for.
    const loginNext =
      route.query?.next ||
      (route.section !== "login" && route.path && route.path !== "/overview" ? route.path : null);
    return <AuthGate next={loginNext} />;
  }

  if (route.section === "login") {
    return (
      <div className="sp-loading">
        <div className="sp-loading-inner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="sp-app">
      <Nav />
      <main className="sp-main">
        <div className="sp-route" key={route.section}>
          {route.section === "overview" && <Overview />}
          {route.section === "dashboard" && <Leaderboard />}
          {route.section === "admin" && <Admin />}
          {route.section === "behavioral" && <Behavioral id={route.itemId} />}
          {route.section === "dsa" && !route.itemId && <DSA />}
          {route.section === "dsa" && route.itemId && <DSAProblem id={route.itemId} />}
          {route.section === "system-design" && !route.itemId && <SystemDesign />}
          {route.section === "system-design" && route.itemId && <SystemDesignDetail id={route.itemId} />}
          {route.section === "machine-coding" && !route.itemId && <MachineCoding />}
          {route.section === "machine-coding" && route.itemId && <MachineCodingDetail id={route.itemId} />}
          {route.section === "concepts" && !route.itemId && <Concepts />}
          {route.section === "concepts" && route.itemId && <ConceptDetail id={route.itemId} />}
          {route.section === "plan" && <Plan track={route.itemId} />}
          {route.section === "js-problems" && !route.itemId && <JSProblems />}
          {route.section === "js-problems" && route.itemId && <JSProblemDetail id={route.itemId} />}
          {route.section === "resources" && <Resources />}
          {route.section === "editor" && <Editor />}
          {route.section === "not-found" && <NotFound path={route.path} />}
        </div>
      </main>
      <Progress />
      <Toast />
    </div>
  );
}
