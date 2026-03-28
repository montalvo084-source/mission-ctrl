import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Call once on app mount to prompt the iOS notification permission dialog.
 */
export async function requestPermissionEagerly() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }
  } catch (e) {
    console.error('[Notifications] Permission request failed:', e);
  }
}

// Repeat alarm every 30 seconds for 4 minutes (8 total notifications)
// 30s spacing ensures iOS plays the full sound on each one — 5s was too fast and got suppressed
const REPEAT_COUNT = 8;
const REPEAT_INTERVAL_SEC = 30;

// Each alarm occupies a block of IDs: base * 100 + 0..REPEAT_COUNT
function burstIds(baseId) {
  return Array.from({ length: REPEAT_COUNT }, (_, i) => ({ id: baseId * 100 + i }));
}

/**
 * Schedule a repeating alarm — fires every 5 seconds for 2 minutes until cancelled.
 * @param {number} id        — unique base ID (used to cancel later)
 * @param {string} title     — notification title
 * @param {string} body      — notification body
 * @param {Date}   triggerAt — exact Date when first notification fires
 */
export async function scheduleNativeAlarm(id, title, body, triggerAt) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const notifications = Array.from({ length: REPEAT_COUNT }, (_, i) => ({
      id: id * 100 + i,
      title,
      body,
      sound: 'alarm.wav',
      schedule: { at: new Date(triggerAt.getTime() + i * REPEAT_INTERVAL_SEC * 1000) },
    }));
    await LocalNotifications.schedule({ notifications });
  } catch (e) {
    console.error('[Notifications] Schedule failed:', e);
  }
}

/**
 * Cancel all repeating notifications for a given alarm.
 * @param {number} id — the base ID passed to scheduleNativeAlarm
 */
export async function cancelNativeAlarm(id) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({ notifications: burstIds(id) });
  } catch (e) {
    console.error('[Notifications] Cancel failed:', e);
  }
}
