import { useState, useEffect } from 'react';

/**
 * useTimer — tracks elapsed/remaining time from a startedAt timestamp.
 * @param {number|null} startedAt  — Date.now() when timer was started, or null
 * @param {number}      duration   — target duration in seconds
 * @returns {{ elapsed, remaining, percentage, isOvertime, isWarning, isRunning }}
 */
export function useTimer(startedAt, duration) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!startedAt) return;
    const id = setInterval(() => setTick(t => t + 1), 250);
    return () => clearInterval(id);
  }, [startedAt]);

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
