import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get } from "firebase/database";

// TODO: Replace with your Firebase project config
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project (free)
// 3. Go to Project Settings > General > Your apps > Add web app
// 4. Copy the firebaseConfig object and paste it here
// 5. Go to Realtime Database > Create Database > Start in test mode
const firebaseConfig = {
  apiKey: "AIzaSyCN0wn2rwDc2GwNanZJrFQxEzPSvbcXFQs",
  authDomain: "testgame9328479.firebaseapp.com",
  databaseURL: "https://testgame9328479-default-rtdb.firebaseio.com",
  projectId: "testgame9328479",
  storageBucket: "testgame9328479.firebasestorage.app",
  messagingSenderId: "250228830610",
  appId: "1:250228830610:web:a84f20e5645428b5cf114b"
};


const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const storage = {
  async get(key) {
    const safeKey = key.replace(/[.#$[\]]/g, "_");
    const snapshot = await get(ref(db, `rooms/${safeKey}`));
    if (snapshot.exists()) {
      return { value: snapshot.val() };
    }
    return null;
  },
  async set(key, value) {
    const safeKey = key.replace(/[.#$[\]]/g, "_");
    await set(ref(db, `rooms/${safeKey}`), value);
  },
};

export default storage;
