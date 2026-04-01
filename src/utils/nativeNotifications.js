import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export async function requestPermissionEagerly() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display !== 'granted') await LocalNotifications.requestPermissions();
  } catch (e) {
    console.error('[Notifications] Permission request failed:', e);
  }
}

// --- Scheduled alarm (fires at end of timer, repeats every 2 min for 10 min) ---
const FOLLOW_UPS = 5;
const FOLLOW_UP_INTERVAL_SEC = 120;

function scheduledIds(baseId) {
  return Array.from({ length: FOLLOW_UPS + 1 }, (_, i) => ({ id: baseId * 10 + i }));
}

export async function scheduleNativeAlarm(id, title, body, triggerAt) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({ notifications: scheduledIds(id) });
    const notifications = Array.from({ length: FOLLOW_UPS + 1 }, (_, i) => ({
      id: id * 10 + i,
      title,
      body: i === 0 ? body : `Still waiting — tap to open Mission Ctrl`,
      sound: 'default',
      schedule: { at: new Date(triggerAt.getTime() + i * FOLLOW_UP_INTERVAL_SEC * 1000) },
      foregroundPresentationOptions: { sound: true, banner: true, badge: false },
    }));
    await LocalNotifications.schedule({ notifications });
  } catch (e) {
    console.error('[Notifications] Schedule failed:', e);
  }
}

export async function cancelNativeAlarm(id) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({ notifications: scheduledIds(id) });
  } catch (e) {
    console.error('[Notifications] Cancel failed:', e);
  }
}

// --- Incessant alarm (fires immediately when timer hits 0, every 30s) ---
// Uses ID range 9000-9099 — separate from timer IDs
const INCESSANT_BASE = 9000;
const INCESSANT_COUNT = 20;   // 20 × 30s = 10 minutes of repeating
const INCESSANT_INTERVAL = 30; // seconds

function incessantIds() {
  return Array.from({ length: INCESSANT_COUNT }, (_, i) => ({ id: INCESSANT_BASE + i }));
}

/**
 * Start firing notifications every 30 seconds immediately.
 * Use this when timer hits 0 and app is open — iOS notification sound
 * bypasses the AudioSession interruption problem.
 */
export async function startIncessantAlarm(title, body) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    // Clear any leftover incessant notifications first
    await LocalNotifications.cancel({ notifications: incessantIds() });

    const now = Date.now();
    const notifications = Array.from({ length: INCESSANT_COUNT }, (_, i) => ({
      id: INCESSANT_BASE + i,
      title,
      body,
      sound: 'default',
      schedule: { at: new Date(now + (i + 1) * INCESSANT_INTERVAL * 1000) },
      foregroundPresentationOptions: { sound: true, banner: true, badge: false },
    }));
    await LocalNotifications.schedule({ notifications });
  } catch (e) {
    console.error('[Notifications] Incessant alarm failed:', e);
  }
}

export async function stopIncessantAlarm() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({ notifications: incessantIds() });
  } catch (e) {
    console.error('[Notifications] Stop incessant failed:', e);
  }
}

/**
 * Cancel every pending notification — call on I'm Back and Reset.
 */
export async function cancelAllAlarms() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { notifications } = await LocalNotifications.getPending();
    if (notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: notifications.map(n => ({ id: n.id })) });
    }
  } catch (e) {
    console.error('[Notifications] Cancel all failed:', e);
  }
}
