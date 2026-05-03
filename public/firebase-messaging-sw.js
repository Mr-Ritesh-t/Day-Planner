// =============================================================
// Firebase Messaging Service Worker
// Handles: push notifications + offline app caching
// =============================================================

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDzGtKysMNBLdpTgCZILtnJ7ZIOt38sGQw",
  authDomain: "our-day-planner.firebaseapp.com",
  projectId: "our-day-planner",
  storageBucket: "our-day-planner.firebasestorage.app",
  messagingSenderId: "968742912386",
  appId: "1:968742912386:web:6e4f2984a5a179daac8f9b"
});

const messaging = firebase.messaging();

// ─── Offline Cache (Feature #14) ─────────────────────────────
const CACHE_NAME = 'hdp-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install: cache app shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Non-fatal: some assets may not exist yet during first install
      });
    })
  );
});

// Activate: purge old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: Network-first for API/Firebase, Cache-first for assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET, cross-origin non-CDN requests
  if (event.request.method !== 'GET') return;

  // Skip Firebase / Gemini API calls — always network
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('generativelanguage.googleapis.com') ||
    url.hostname.includes('fcm.googleapis.com')
  ) {
    return;
  }

  // For HTML/JS/CSS/images: network-first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response && response.status === 200) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        }
        return response;
      })
      .catch(() => {
        // Offline fallback: serve from cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Last resort: return cached index.html for navigation
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Offline — check your connection', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          });
        });
      })
  );
});

// ─── Background Push Notifications ───────────────────────────
messaging.onBackgroundMessage((payload) => {
  console.log('🔔 Background alarm received:', payload);
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || '⏰ Reminder', {
    body: body || 'Time for your task!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [300, 200, 300, 200, 300],
    requireInteraction: true,
    tag: 'alarm',
    data: { url: self.location.origin },
  });
});

// Notification click → open/focus app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || self.location.origin;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
