import React, { useEffect } from "react";
import useStudyStore from "./store/useStudyStore";
import {
  subscribeAuth,
  subscribeProgress,
  subscribeAnswers,
  subscribeEntries,
} from "../firebase";
import AuthGate from "./components/AuthGate";
import Nav from "./components/Nav";
import Overview from "./components/Overview";
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

export default function StudyApp() {
  const user = useStudyStore((s) => s.user);
  const authLoading = useStudyStore((s) => s.authLoading);
  const setUser = useStudyStore((s) => s.setUser);
  const setProgress = useStudyStore((s) => s.setProgress);
  const setAnswers = useStudyStore((s) => s.setAnswers);
  const setEntries = useStudyStore((s) => s.setEntries);
  const route = useStudyStore((s) => s.route);

  // Auth subscription
  useEffect(() => {
    const unsub = subscribeAuth((u) => setUser(u || null));
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

  if (authLoading) {
    return (
      <div className="sp-loading">
        <div className="sp-loading-inner">Loading...</div>
      </div>
    );
  }

  if (!user) return <AuthGate />;

  return (
    <div className="sp-app">
      <Nav />
      <main className="sp-main">
        {route.section === "overview" && <Overview />}
        {route.section === "dsa" && !route.itemId && <DSA />}
        {route.section === "dsa" && route.itemId && <DSAProblem id={route.itemId} />}
        {route.section === "system-design" && !route.itemId && <SystemDesign />}
        {route.section === "system-design" && route.itemId && <SystemDesignDetail id={route.itemId} />}
        {route.section === "machine-coding" && !route.itemId && <MachineCoding />}
        {route.section === "machine-coding" && route.itemId && <MachineCodingDetail id={route.itemId} />}
        {route.section === "concepts" && !route.itemId && <Concepts />}
        {route.section === "concepts" && route.itemId && <ConceptDetail id={route.itemId} />}
        {route.section === "plan" && <Plan />}
        {route.section === "js-problems" && !route.itemId && <JSProblems />}
        {route.section === "js-problems" && route.itemId && <JSProblemDetail id={route.itemId} />}
        {route.section === "resources" && <Resources />}
        {route.section === "editor" && <Editor />}
      </main>
      <Progress />
      <Toast />
    </div>
  );
}
