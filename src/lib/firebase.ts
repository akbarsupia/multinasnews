import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, getFirestore, Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCQCUnOnO7ylrijksWqd6i0L226jMvU0jg",
  authDomain: "multi-nasional.firebaseapp.com",
  projectId: "multi-nasional",
  storageBucket: "multi-nasional.firebasestorage.app",
  messagingSenderId: "939767685860",
  appId: "1:939767685860:web:2ef9902ca235bf821a02f1"
};

// Mencegah *Double Initialization* ketika pengembangan Hot-Reload Next.js
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Mengekspor layanan turunan utama untuk dipakai di halaman manapun
const auth = getAuth(app);

// Inisialisasi Firestore dengan opsi experimentalForceLongPolling untuk menghindari kegagalan koneksi
// akibat pembatasan jaringan / proxy / ISP yang memblokir WebSockets / gRPC.
let db: Firestore;
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} catch (e) {
  db = getFirestore(app);
}

const storage = getStorage(app);

export { app, auth, db, storage };

