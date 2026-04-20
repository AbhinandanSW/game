import { create } from "zustand";

const useStudyStore = create((set, get) => ({
  // Auth
  user: null,
  authLoading: true,
  authStatus: "idle", // idle | pending_approval | denied | error
  authError: "",
  setUser: (user) => set({ user, authLoading: false }),
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

  // Navigation
  route: { section: "overview", itemId: null },
  navigate: (section, itemId = null) => {
    set({ route: { section, itemId } });
    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: "smooth" });
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
