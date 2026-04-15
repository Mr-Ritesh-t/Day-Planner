// Firebase Messaging Service Worker
// This file handles push notifications when the app is CLOSED or in the background.
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

// Handle background push notifications (app is closed/minimized)
messaging.onBackgroundMessage((payload) => {
  console.log('🔔 Background alarm received:', payload);

  const { title, body } = payload.notification || {};

  self.registration.showNotification(title || '⏰ Reminder', {
    body: body || 'Time for your task!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [300, 200, 300, 200, 300, 200, 300],
    requireInteraction: true, // keeps notification visible until dismissed
    tag: 'alarm',
    data: { url: self.location.origin },
  });
});

// Clicking the notification opens the app
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
