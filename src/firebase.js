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
  updateDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";

// NOTE: To enable Google Auth + Firestore, the Firebase console needs:
//   - Authentication → Sign-in method → Google enabled
//   - Firestore Database created (test/production mode)
const firebaseConfig = {
  apiKey: "AIzaSyCN0wn2rwDc2GwNanZJrFQxEzPSvbcXFQs",
  authDomain: "testgame9328479.firebaseapp.com",
  databaseURL: "https://testgame9328479-default-rtdb.firebaseio.com",
  projectId: "testgame9328479",
  storageBucket: "testgame9328479.firebasestorage.app",
  messagingSenderId: "250228830610",
  appId: "1:250228830610:web:a84f20e5645428b5cf114b",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// ─── Auth ──────────────────────────────────────────────────
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOut() {
  await fbSignOut(auth);
}

export function subscribeAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

// ─── Progress ──────────────────────────────────────────────
// Structure: users/{uid}/progress/{problemId} = { done: boolean, code: {lang: string}, notes: string }
export async function setProgress(uid, problemId, data) {
  try {
    const ref = doc(db, "users", uid, "progress", problemId);
    await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
  } catch (e) {
    console.warn("setProgress failed:", e);
  }
}

export async function getProgress(uid, problemId) {
  try {
    const ref = doc(db, "users", uid, "progress", problemId);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.warn("getProgress failed:", e);
    return null;
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
    console.warn("subscribeProgress failed:", e);
    return () => {};
  }
}

// ─── Answers (for System Design, Concepts) ─────────────────
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
