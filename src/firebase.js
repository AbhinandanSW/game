import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, onValue, off } from "firebase/database";

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

  async syncPlayer(roomKey, playerId, data) {
    try {
      const base = `rooms/${safeKey(roomKey)}`;
      await set(ref(db, `${base}/gameData/players/${playerId}`), data);
    } catch (e) {
      console.warn("storage.syncPlayer failed:", e);
    }
  },

  async syncBullets(roomKey, playerId, bullets) {
    try {
      const base = `rooms/${safeKey(roomKey)}`;
      await set(ref(db, `${base}/shootEvents/${playerId}`), bullets || []);
    } catch (e) {
      console.warn("storage.syncBullets failed:", e);
    }
  },

  async setScores(roomKey, scores) {
    try {
      await set(ref(db, `rooms/${safeKey(roomKey)}/scores`), scores);
    } catch (e) {
      console.warn("storage.setScores failed:", e);
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
