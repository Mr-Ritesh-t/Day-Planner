import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDzGtKysMNBLdpTgCZILtnJ7ZIOt38sGQw",
  authDomain: "our-day-planner.firebaseapp.com",
  databaseURL: "https://our-day-planner-default-rtdb.firebaseio.com",
  projectId: "our-day-planner",
  storageBucket: "our-day-planner.firebasestorage.app",
  messagingSenderId: "968742912386",
  appId: "1:968742912386:web:6e4f2984a5a179daac8f9b",
  measurementId: "G-G8D3YRN2DS"
};

export const hasFirebaseConfig = true;

let app;
let db = null;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log("🔥 Firebase initialized successfully!");
} catch (e) {
  console.error("Firebase init error", e);
}

export { db };
