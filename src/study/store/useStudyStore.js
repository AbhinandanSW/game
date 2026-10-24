import { create } from "zustand";
import { parseHash, routeFor } from "../router";
import { applyTheme, persistTheme, readStoredTheme } from "../theme";

const initialTheme = readStoredTheme();

if (typeof document !== "undefined") applyTheme(initialTheme);

const useStudyStore = create((set, get) => ({
  // Auth
  user: null,
  authLoading: true,
  authStatus: "idle", // idle | request_access | pending_approval | request_denied | error
  authError: "",
  // Signed in with Google but not on the allowlist yet. Kept separate from `user`
  // so unapproved accounts never get access to progress/content subscriptions.
  accessUser: null,
  setUser: (user) => set({ user, authLoading: false }),
  setAccessUser: (accessUser) => set({ accessUser }),
  setAuthStatus: (authStatus, authError = "") => set({ authStatus, authError }),

  // Progress (map problemId → { done, code: {lang: code}, notes })
  progress: {},
  setProgress: (progress) => set({ progress }),
  updateProgressLocal: (id, data) =>
    set((s) => ({ progress: { ...s.progress, [id]: { ...(s.progress[id] || {}), ...data } } })),

  // Answers (for SD / concepts)
  answers: {},
  setAnswers: (answers) => set({ answers }),
  updateAnswerLocal: (id, text) =>
    set((s) => ({ answers: { ...s.answers, [id]: { ...(s.answers[id] || {}), text } } })),

  // Custom entries
  entries: [],
  setEntries: (entries) => set({ entries }),

  // Navigation — hash routes make every page shareable and back/forward friendly.
  route:
    typeof window !== "undefined"
      ? parseHash(window.location.hash)
      : routeFor("overview"),
  setRoute: (route) => set({ route }),
  navigate: (section, itemId = null) => {
    const next = routeFor(section, itemId);
    set({ route: next });
    if (typeof window !== "undefined") {
      const target = `#${next.path}`;
      if (window.location.hash !== target) {
        window.location.hash = target; // triggers the hashchange sync in StudyApp
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  },

  // Theme
  theme: initialTheme,
  setTheme: (theme) => {
    const next = theme === "light" ? "light" : "dark";
    applyTheme(next);
    persistTheme(next);
    set({ theme: next });
  },
  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    applyTheme(next);
    persistTheme(next);
    set({ theme: next });
  },

  // Content overrides from Firestore (keyed by kind → id → item)
  // Components merge these with hardcoded data at render time.
  contentOverrides: {
    dsa: {},
    systemDesign: {},
    machineCoding: {},
    jsProblems: {},
    concepts: {},
    plans: {},
    behavioral: {},
    resources: {},
  },
  setContentOverrides: (kind, items) =>
    set((s) => ({ contentOverrides: { ...s.contentOverrides, [kind]: items } })),

  // UI
  toast: "",
  setToast: (toast) => {
    set({ toast });
    if (toast) setTimeout(() => set({ toast: "" }), 2500);
  },
}));

export default useStudyStore;
