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
    const snapshot = await get(ref(db, `rooms/${safeKey(key)}`));
    if (snapshot.exists()) {
      return { value: snapshot.val() };
    }
    return null;
  },
  async set(key, value) {
    await set(ref(db, `rooms/${safeKey(key)}`), value);
  },
  // Write a player's game data + their bullets in one call
  async syncPlayer(roomKey, playerId, playerData, playerBullets) {
    const base = `rooms/${safeKey(roomKey)}`;
    await Promise.all([
      set(ref(db, `${base}/gameData/players/${playerId}`), playerData),
      set(ref(db, `${base}/bullets/${playerId}`), playerBullets || []),
    ]);
  },
  // Write scores
  async setScores(roomKey, scores) {
    await set(ref(db, `rooms/${safeKey(roomKey)}/scores`), scores);
  },
  // Subscribe to real-time updates
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
