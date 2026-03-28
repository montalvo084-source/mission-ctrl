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

/**
 * Schedule a native local notification at a specific time.
 * @param {number} id        — unique integer ID (used to cancel later)
 * @param {string} title     — notification title
 * @param {string} body      — notification body
 * @param {Date}   triggerAt — exact Date when it should fire
 */
export async function scheduleNativeAlarm(id, title, body, triggerAt) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.schedule({
      notifications: [{ id, title, body, schedule: { at: triggerAt } }],
    });
  } catch (e) {
    console.error('[Notifications] Schedule failed:', e);
  }
}

/**
 * Cancel a previously scheduled notification by ID.
 * @param {number} id
 */
export async function cancelNativeAlarm(id) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id }] });
  } catch (e) {
    console.error('[Notifications] Cancel failed:', e);
  }
}
