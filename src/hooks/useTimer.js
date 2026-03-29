import { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { scheduleNativeAlarm, cancelNativeAlarm } from '../utils/nativeNotifications';

/**
 * useTimer — tracks elapsed/remaining time from a startedAt timestamp.
 * On native iOS, schedules a local notification when the timer ends.
 * Forces a display refresh when the app resumes from background.
 *
 * @param {number|null} startedAt  — Date.now() when timer was started, or null
 * @param {number}      duration   — target duration in seconds
 * @param {object}      [notify]   — optional { id, title, body } for native alarm
 * @returns {{ elapsed, remaining, percentage, isOvertime, isWarning, isRunning }}
 */
export function useTimer(startedAt, duration, notify = null) {
  const [tick, setTick] = useState(0);
  const alarmScheduled = useRef(false);
  const lastStartedAt = useRef(null);

  // Keep notifyRef current on every render without triggering the alarm effect
  const notifyRef = useRef(notify);
  useEffect(() => { notifyRef.current = notify; });

  // Interval tick for UI updates while app is in foreground
  useEffect(() => {
    if (!startedAt) return;
    const id = setInterval(() => setTick(t => t + 1), 250);
    return () => clearInterval(id);
  }, [startedAt]);

  // Force display refresh when app comes back from background (iOS suspends JS)
  useEffect(() => {
    if (!startedAt) return;

    // Web: use visibilitychange
    function onVisible() {
      if (document.visibilityState === 'visible') setTick(t => t + 1);
    }
    document.addEventListener('visibilitychange', onVisible);

    // Native iOS: use Capacitor App plugin resume event
    let removeListener = null;
    if (Capacitor.isNativePlatform()) {
      import('@capacitor/app').then(({ App }) => {
        App.addListener('resume', () => setTick(t => t + 1)).then(handle => {
          removeListener = () => handle.remove();
        });
      }).catch(() => {});
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      if (removeListener) removeListener();
    };
  }, [startedAt]);

  // Schedule / cancel native alarm — only re-runs when startedAt or duration changes
  useEffect(() => {
    const n = notifyRef.current;
    if (!n) return;

    if (startedAt && startedAt !== lastStartedAt.current) {
      lastStartedAt.current = startedAt;
      alarmScheduled.current = true;
      scheduleNativeAlarm(n.id, n.title, n.body, new Date(startedAt + duration * 1000));
    }

    if (!startedAt && alarmScheduled.current) {
      alarmScheduled.current = false;
      lastStartedAt.current = null;
      cancelNativeAlarm(n.id);
    }
  }, [startedAt, duration]); // notify intentionally omitted — accessed via ref

  if (!startedAt) {
    return {
      elapsed: 0,
      remaining: duration,
      percentage: 1,
      isOvertime: false,
      isWarning: false,
      isRunning: false,
    };
  }

  const elapsed = (Date.now() - startedAt) / 1000;
  const remaining = Math.max(0, duration - elapsed);
  const percentage = Math.max(0, Math.min(1, remaining / duration));
  const isOvertime = elapsed > duration;
  const isWarning = !isOvertime && remaining <= 60;

  return {
    elapsed,
    remaining,
    percentage,
    isOvertime,
    isWarning,
    isRunning: true,
  };
}

/** Format seconds → MM:SS */
export function formatTime(seconds) {
  const abs = Math.abs(Math.round(seconds));
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Format seconds → "14m" or "58m" */
export function formatMinutes(seconds) {
  return `${Math.round(seconds / 60)}m`;
}
