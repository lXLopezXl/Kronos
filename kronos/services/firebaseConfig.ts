import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // 1. Importa Storage

const firebaseConfig = {
  apiKey: "AIzaSyAoDocQWjL8KDtZO08hudU7mgphwpHboWA",
  authDomain: "kronosstorebd.firebaseapp.com",
  projectId: "kronosstorebd",
  storageBucket: "kronosstorebd.firebasestorage.app",
  messagingSenderId: "1072018161005",
  appId: "1:1072018161005:web:9a68fd16e31c7633322e64",
  measurementId: "G-6QVTC5MPKC"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // 2. Exporta el servicio