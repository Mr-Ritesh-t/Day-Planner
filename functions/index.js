const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Runs every minute.
 * Checks both Ritesh's and Albina's alarms in Firestore.
 * Sends FCM push notification to the matching device — rings like a real alarm.
 */
exports.checkAlarms = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async () => {
    const db = admin.firestore();

    // Get current time in IST (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const ist = new Date(now.getTime() + istOffset);
    const cur = `${String(ist.getUTCHours()).padStart(2, '0')}:${String(ist.getUTCMinutes()).padStart(2, '0')}`;

    console.log(`⏰ Alarm check running at IST ${cur}`);

    // Load planner data
    const snap = await db.doc('planner/sharedData').get();
    if (!snap.exists) return null;

    const profiles = snap.data().profiles || {};
    const updates = {}; // track Firestore updates needed

    for (const [userId, profile] of Object.entries(profiles)) {
      let triggered = false;
      let triggeredTitle = '';

      // Check task alarms
      const tasks = { ...(profile.tasks || {}) };
      let tasksUpdated = false;

      for (const period of Object.keys(tasks)) {
        tasks[period] = (tasks[period] || []).map(t => {
          const checkTime = t.startTime || t.time;
          if (checkTime === cur && !t.done && !t.af) {
            triggered = true;
            triggeredTitle = t.title;
            tasksUpdated = true;
            return { ...t, af: true }; // mark as already fired
          }
          return t;
        });
      }

      // Check custom alarms
      let customAlarms = [...(profile.customAlarms || [])];
      let alarmsUpdated = false;

      customAlarms = customAlarms.map(a => {
        if (a.time === cur && a.enabled && !a.triggeredToday) {
          triggered = true;
          triggeredTitle = a.title;
          alarmsUpdated = true;
          return { ...a, triggeredToday: true };
        }
        return a;
      });

      if (!triggered) continue;

      // Write updated alarm states back to Firestore
      if (tasksUpdated || alarmsUpdated) {
        const profileUpdate = {};
        if (tasksUpdated) profileUpdate[`profiles.${userId}.tasks`] = tasks;
        if (alarmsUpdated) profileUpdate[`profiles.${userId}.customAlarms`] = customAlarms;
        Object.assign(updates, profileUpdate);
      }

      // Get device FCM token
      const deviceSnap = await db.doc(`devices/${userId}`).get();
      if (!deviceSnap.exists) {
        console.log(`⚠️ No device token for ${userId}`);
        continue;
      }

      const fcmToken = deviceSnap.data()?.fcmToken;
      if (!fcmToken) continue;

      const msgs = [
        `Hey! Time for "${triggeredTitle}" 🌸`,
        `Your reminder is here: ${triggeredTitle} ✨`,
        `Don't forget: ${triggeredTitle} 💖`,
        `Time to do: ${triggeredTitle} 🌟`,
      ];
      const body = msgs[Math.floor(Math.random() * msgs.length)];

      // Send FCM push — rings the phone like an alarm
      try {
        await admin.messaging().send({
          token: fcmToken,
          notification: {
            title: `⏰ ${triggeredTitle}`,
            body,
          },
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              priority: 'max',
              channelId: 'alarm_channel',
              vibrateTimingsMillis: [0, 300, 200, 300, 200, 300],
            },
          },
          webpush: {
            headers: { Urgency: 'high' },
            notification: {
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              requireInteraction: true,
              vibrate: [300, 200, 300, 200, 300],
              tag: 'alarm',
            },
          },
        });
        console.log(`✅ Alarm sent to ${userId}: "${triggeredTitle}"`);
      } catch (err) {
        console.error(`❌ FCM send failed for ${userId}:`, err.message);
        // Token may be expired — clear it
        if (err.code === 'messaging/registration-token-not-registered') {
          await db.doc(`devices/${userId}`).delete();
        }
      }
    }

    // Write all alarm-state updates back to Firestore
    if (Object.keys(updates).length > 0) {
      await db.doc('planner/sharedData').update(updates);
    }

    return null;
  });
