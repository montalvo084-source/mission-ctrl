import { Capacitor } from '@capacitor/core';

let LocalNotifications = null;
let permissionGranted = false;

async function getPlugin() {
  if (!Capacitor.isNativePlatform()) return null;
  if (!LocalNotifications) {
    const mod = await import('@capacitor/local-notifications');
    LocalNotifications = mod.LocalNotifications;
  }
  return LocalNotifications;
}

async function ensurePermission(plugin) {
  if (permissionGranted) return true;
  const { display } = await plugin.checkPermissions();
  if (display === 'granted') {
    permissionGranted = true;
    return true;
  }
  const { display: result } = await plugin.requestPermissions();
  permissionGranted = result === 'granted';
  return permissionGranted;
}

/**
 * Schedule a native local notification at a specific time.
 * @param {number} id          — unique integer ID (used to cancel later)
 * @param {string} title       — notification title
 * @param {string} body        — notification body
 * @param {Date}   triggerAt   — exact Date when notification should fire
 */
export async function scheduleNativeAlarm(id, title, body, triggerAt) {
  const plugin = await getPlugin();
  if (!plugin) return; // browser fallback — no-op

  const ok = await ensurePermission(plugin);
  if (!ok) return;

  await plugin.schedule({
    notifications: [
      {
        id,
        title,
        body,
        schedule: { at: triggerAt, allowWhileIdle: true },
        sound: 'default',
        smallIcon: 'ic_stat_icon_config_sample',
        actionTypeId: '',
        extra: null,
      },
    ],
  });
}

/**
 * Cancel a previously scheduled notification by ID.
 * @param {number} id
 */
export async function cancelNativeAlarm(id) {
  const plugin = await getPlugin();
  if (!plugin) return;
  await plugin.cancel({ notifications: [{ id }] });
}

/**
 * Cancel all pending notifications scheduled by this app.
 */
export async function cancelAllAlarms() {
  const plugin = await getPlugin();
  if (!plugin) return;
  const { notifications } = await plugin.getPending();
  if (notifications.length > 0) {
    await plugin.cancel({ notifications: notifications.map(n => ({ id: n.id })) });
  }
}
