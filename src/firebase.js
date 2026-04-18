import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";

// ─── Firebase Config from Environment Variables ────────────
// Values are injected at build time by Create React App.
// Set these in .env (local) or Vercel Dashboard (deployment).
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Validate config — surface clear error if env vars missing
export const configStatus = (() => {
  const missing = Object.entries(firebaseConfig)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  return {
    ok: missing.length === 0,
    missing,
  };
})();

if (!configStatus.ok) {
  // eslint-disable-next-line no-console
  console.warn(
    "[Firebase] Missing env vars:",
    configStatus.missing.join(", "),
    "— set them in .env (local) or Vercel environment variables."
  );
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// ─── Auth ──────────────────────────────────────────────────
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { ok: true, user: result.user };
  } catch (err) {
    // Friendly error messaging
    let message = err.message || "Sign-in failed.";
    if (err.code === "auth/unauthorized-domain") {
      const host = typeof window !== "undefined" ? window.location.hostname : "your-domain";
      message = `Domain "${host}" is not authorized for Google Sign-In. Add it in Firebase Console → Authentication → Settings → Authorized domains.`;
    } else if (err.code === "auth/configuration-not-found") {
      message = "Google Sign-In is not enabled. Go to Firebase Console → Authentication → Sign-in method → Google → Enable.";
    } else if (err.code === "auth/popup-blocked") {
      message = "Popup blocked. Allow popups for this site and try again.";
    } else if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
      message = "Sign-in cancelled.";
    }
    return { ok: false, error: err.code, message };
  }
}

export async function signOut() {
  await fbSignOut(auth);
}

export function subscribeAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

// ─── Admin Emails (from env var) ───────────────────────────
const ADMIN_EMAILS = (process.env.REACT_APP_ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// ─── Allowlist ─────────────────────────────────────────────
// Admins (from env) always allowed. Others must be in the Firestore
// allowlist/{email-lowercased} = { approved: true, addedBy, addedAt }
export async function checkAllowlist(email) {
  if (isAdminEmail(email)) {
    return { allowed: true, data: { role: "admin" } };
  }
  try {
    const id = email.toLowerCase();
    const snap = await getDoc(doc(db, "allowlist", id));
    if (!snap.exists()) return { allowed: false, reason: "not_listed" };
    const data = snap.data();
    if (data.approved === false) return { allowed: false, reason: "pending" };
    return { allowed: true, data };
  } catch (e) {
    console.warn("checkAllowlist failed:", e);
    return { allowed: false, reason: "error", message: e.message };
  }
}

// ─── Admin actions on allowlist & access requests ─────────
// Throws on permission failure so UI can surface the actual error.
export async function approveUser(email, byEmail) {
  const id = email.toLowerCase();
  await setDoc(doc(db, "allowlist", id), {
    email: id,
    approved: true,
    addedBy: byEmail || "admin",
    addedAt: serverTimestamp(),
  });
  // Remove from access requests (silent fail if rule blocks delete)
  try { await deleteDoc(doc(db, "accessRequests", id)); } catch {}
}

export async function revokeUser(email) {
  try {
    const id = email.toLowerCase();
    await deleteDoc(doc(db, "allowlist", id));
  } catch (e) {
    console.warn("revokeUser failed:", e);
    throw e;
  }
}

export async function denyRequest(email) {
  try {
    const id = email.toLowerCase();
    await deleteDoc(doc(db, "accessRequests", id));
  } catch (e) {
    console.warn("denyRequest failed:", e);
  }
}

export function subscribeAllowlist(callback) {
  try {
    return onSnapshot(collection(db, "allowlist"), (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      callback(list);
    }, (err) => console.warn("subscribeAllowlist error:", err));
  } catch (e) {
    return () => {};
  }
}

export function subscribeAccessRequests(callback) {
  try {
    return onSnapshot(collection(db, "accessRequests"), (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      callback(list);
    }, (err) => console.warn("subscribeAccessRequests error:", err));
  } catch (e) {
    return () => {};
  }
}

// Log a request to join (so admin sees who wants access).
// Uses setDoc without merge — clean create-or-replace semantics.
// Throws on failure so caller can distinguish success/failure.
export async function requestAccess(user) {
  const id = user.email.toLowerCase();
  await setDoc(doc(db, "accessRequests", id), {
    email: user.email,
    name: user.displayName || "",
    photo: user.photoURL || "",
    uid: user.uid,
    requestedAt: serverTimestamp(),
  });
}

// ─── User Profile ──────────────────────────────────────────
// users/{uid} = { email, name, photo, lastSeen }
export async function upsertUserProfile(user) {
  try {
    await setDoc(
      doc(db, "users", user.uid),
      {
        email: user.email,
        name: user.displayName || "",
        photo: user.photoURL || "",
        lastSeen: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (e) {
    console.warn("upsertUserProfile failed:", e);
  }
}

// Subscribe to all users (for leaderboard)
export function subscribeAllUsers(callback) {
  try {
    return onSnapshot(collection(db, "users"), (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ uid: d.id, ...d.data() }));
      callback(list);
    }, (err) => console.warn("subscribeAllUsers error:", err));
  } catch (e) {
    return () => {};
  }
}

// ─── Public Progress Summary ───────────────────────────────
// progressSummary/{uid} = { done: count, total: count, updatedAt }
// Only aggregate counts, no problem details. Safe for leaderboard.
export async function updateProgressSummary(uid, done, total) {
  try {
    await setDoc(
      doc(db, "progressSummary", uid),
      { done, total, updatedAt: serverTimestamp() },
      { merge: true }
    );
  } catch (e) {
    console.warn("updateProgressSummary failed:", e);
  }
}

export function subscribeAllProgressSummary(callback) {
  try {
    return onSnapshot(collection(db, "progressSummary"), (snap) => {
      const data = {};
      snap.forEach((d) => { data[d.id] = d.data(); });
      callback(data);
    }, (err) => console.warn("subscribeAllProgressSummary error:", err));
  } catch (e) {
    return () => {};
  }
}

// ─── Progress (per-user detail, private) ───────────────────
export async function setProgress(uid, problemId, data) {
  try {
    const ref = doc(db, "users", uid, "progress", problemId);
    await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
  } catch (e) {
    console.warn("setProgress failed:", e);
  }
}

export function subscribeProgress(uid, callback) {
  try {
    const colRef = collection(db, "users", uid, "progress");
    return onSnapshot(colRef, (snap) => {
      const data = {};
      snap.forEach((doc) => { data[doc.id] = doc.data(); });
      callback(data);
    }, (err) => console.warn("subscribeProgress error:", err));
  } catch (e) {
    return () => {};
  }
}

// ─── Answers (System Design, Concept notes) ────────────────
export async function setAnswer(uid, itemId, answer) {
  try {
    const ref = doc(db, "users", uid, "answers", itemId);
    await setDoc(ref, { text: answer, updatedAt: serverTimestamp() }, { merge: true });
  } catch (e) {
    console.warn("setAnswer failed:", e);
  }
}

export function subscribeAnswers(uid, callback) {
  try {
    const colRef = collection(db, "users", uid, "answers");
    return onSnapshot(colRef, (snap) => {
      const data = {};
      snap.forEach((doc) => { data[doc.id] = doc.data(); });
      callback(data);
    }, (err) => console.warn("subscribeAnswers error:", err));
  } catch (e) {
    return () => {};
  }
}

// ─── Custom Entries ────────────────────────────────────────
export async function addEntry(uid, entry) {
  const id = "entry_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  try {
    const ref = doc(db, "users", uid, "entries", id);
    await setDoc(ref, { ...entry, id, createdAt: serverTimestamp() });
    return id;
  } catch (e) {
    console.warn("addEntry failed:", e);
  }
}

export async function deleteEntry(uid, id) {
  try {
    const ref = doc(db, "users", uid, "entries", id);
    await deleteDoc(ref);
  } catch (e) {
    console.warn("deleteEntry failed:", e);
  }
}

export function subscribeEntries(uid, callback) {
  try {
    const colRef = collection(db, "users", uid, "entries");
    return onSnapshot(colRef, (snap) => {
      const list = [];
      snap.forEach((doc) => list.push(doc.data()));
      callback(list);
    }, (err) => console.warn("subscribeEntries error:", err));
  } catch (e) {
    return () => {};
  }
}
