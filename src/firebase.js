import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, update, onValue, off } from "firebase/database";

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
const db = getDatabase(app);

function safeKey(key) {
  return key.replace(/[.#$[\]]/g, "_");
}

const storage = {
  async get(key) {
    try {
      const snapshot = await get(ref(db, `rooms/${safeKey(key)}`));
      if (snapshot.exists()) {
        return { value: snapshot.val() };
      }
      return null;
    } catch (e) {
      console.warn("storage.get failed:", e);
      return null;
    }
  },

  async set(key, value) {
    try {
      await set(ref(db, `rooms/${safeKey(key)}`), value);
    } catch (e) {
      console.warn("storage.set failed:", e);
    }
  },

  // Single batched write for all game sync data (1 write instead of 3)
  async syncAll(roomKey, playerId, playerData, shootEvents, scoreData) {
    try {
      const base = `rooms/${safeKey(roomKey)}`;
      const updates = {};
      updates[`${base}/gameData/players/${playerId}`] = playerData;
      updates[`${base}/shootEvents/${playerId}`] = shootEvents || [];
      if (scoreData) {
        updates[`${base}/scores/${playerId}`] = scoreData;
      }
      await update(ref(db), updates);
    } catch (e) {
      console.warn("storage.syncAll failed:", e);
    }
  },

  subscribe(key, callback) {
    const dbRef = ref(db, `rooms/${safeKey(key)}`);
    onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      }
    });
    return () => off(dbRef);
  },
};

export default storage;
