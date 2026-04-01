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

// 1 notification at end time + 5 follow-ups every 2 minutes = up to 10 min of reminders
// 2-minute spacing is reliably delivered by iOS without suppression
const FOLLOW_UPS = 5;
const FOLLOW_UP_INTERVAL_SEC = 120; // 2 minutes

function allIds(baseId) {
  return Array.from({ length: FOLLOW_UPS + 1 }, (_, i) => ({ id: baseId * 10 + i }));
}

/**
 * Schedule alarm at triggerAt, then repeat every 2 min for up to 10 min.
 * Cancels any stale notifications for this timer first.
 */
export async function scheduleNativeAlarm(id, title, body, triggerAt) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    // Clear any stale notifications for this timer
    await LocalNotifications.cancel({ notifications: allIds(id) });

    const notifications = Array.from({ length: FOLLOW_UPS + 1 }, (_, i) => ({
      id: id * 10 + i,
      title,
      body: i === 0 ? body : `Still waiting — tap to open Mission Ctrl`,
      sound: 'default',
      schedule: { at: new Date(triggerAt.getTime() + i * FOLLOW_UP_INTERVAL_SEC * 1000) },
      // Play sound + show banner even when app is in foreground
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
    await LocalNotifications.cancel({ notifications: allIds(id) });
  } catch (e) {
    console.error('[Notifications] Cancel failed:', e);
  }
}
