import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBlBETYBCdsYkk0nluitALQH9Q0gGoU_bI",
  authDomain: "sansara-data.firebaseapp.com",
  projectId: "sansara-data",
  storageBucket: "sansara-data.firebasestorage.app",
  messagingSenderId: "951389320456",
  appId: "1:951389320456:web:4d8f82641becc5f45d68bd",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
