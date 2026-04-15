import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

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

// ⚠️ VAPID Key: Get this from Firebase Console →
// Project Settings → Cloud Messaging → Web Push certificates → Generate key pair
export const VAPID_KEY = 'YOUR_VAPID_KEY_HERE';

let app;
let db = null;
let messaging = null;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  messaging = getMessaging(app);
  console.log("🔥 Firebase initialized successfully!");
} catch (e) {
  console.error("Firebase init error", e);
}

/**
 * Requests notification permission and gets the FCM push token.
 * Returns the token string, or null if permission denied.
 */
export async function requestFCMToken() {
  if (!messaging || !VAPID_KEY || VAPID_KEY === 'YOUR_VAPID_KEY_HERE') {
    console.warn('FCM: VAPID key not set yet. Skipping push registration.');
    return null;
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('FCM: Notification permission denied.');
      return null;
    }
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js'),
    });
    console.log('✅ FCM Token obtained:', token?.substring(0, 20) + '...');
    return token;
  } catch (err) {
    console.error('FCM token error:', err);
    return null;
  }
}

/**
 * Listen for foreground push messages (app is open).
 * The alarm modal + chime in App.jsx handle in-app alerts,
 * so this is just for logging/safety.
 */
export function onForegroundMessage(callback) {
  if (!messaging) return;
  return onMessage(messaging, callback);
}

export { db, messaging };
