import { useState, useCallback, useEffect } from 'react';

// ─── Default Settings ────────────────────────────────────────
const DEFAULT_SETTINGS = {
  break1Duration: 14 * 60,   // seconds
  break2Duration: 14 * 60,
  lunchDuration: 58 * 60,
  ticketGoal: 5,
  xpPerTicket: 20,
  xpPerOnTimeBreak: 30,
  xpPerfectDayBonus: 100,
  xpPerLevel: 500,
};

const DEFAULT_CUMULATIVE = {
  totalXP: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastPerfectDate: null,
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function makeDayEntry() {
  return {
    tickets: 0,
    breaks: {
      break1: { startedAt: null, returnedAt: null, onTime: null, overtimeSeconds: 0 },
      break2: { startedAt: null, returnedAt: null, onTime: null, overtimeSeconds: 0 },
      lunch:  { startedAt: null, returnedAt: null, onTime: null, overtimeSeconds: 0 },
    },
    perfectDay: false,
    xpEarned: 0,
  };
}

// ─── localStorage helpers ────────────────────────────────────
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// ─── Hook ────────────────────────────────────────────────────
export function useGameState() {
  const [settings, setSettings] = useState(() =>
    ({ ...DEFAULT_SETTINGS, ...load('missionctrl_settings', {}) })
  );

  const [cumulative, setCumulative] = useState(() =>
    ({ ...DEFAULT_CUMULATIVE, ...load('missionctrl_cumulative', {}) })
  );

  const [dailyLogs, setDailyLogs] = useState(() =>
    load('missionctrl_daily', {})
  );

  const today = todayStr();

  // ─── Daily reset detection ───────────────────────────────
  useEffect(() => {
    const lastDay = load('missionctrl_activeday', null);
    if (lastDay !== today) {
      // New day: ensure today's entry exists (but don't wipe cumulative)
      save('missionctrl_activeday', today);
      setDailyLogs(prev => {
        if (!prev[today]) {
          const next = { ...prev, [today]: makeDayEntry() };
          save('missionctrl_daily', next);
          return next;
        }
        return prev;
      });
    }
  }, [today]);

  // Ensure today's entry always exists
  const todayData = dailyLogs[today] || makeDayEntry();

  // ─── Derived: XP / Level ────────────────────────────────
  const { totalXP } = cumulative;
  const { xpPerLevel } = settings;
  const level = Math.floor(totalXP / xpPerLevel) + 1;
  const xpIntoLevel = totalXP % xpPerLevel;
  const xpProgress = xpIntoLevel / xpPerLevel; // 0–1

  // ─── Helpers ─────────────────────────────────────────────
  function updateDailyLogs(updater) {
    setDailyLogs(prev => {
      const entry = prev[today] || makeDayEntry();
      const next = { ...prev, [today]: updater(entry) };
      save('missionctrl_daily', next);
      return next;
    });
  }

  function addXP(amount) {
    setCumulative(prev => {
      const next = { ...prev, totalXP: prev.totalXP + amount };
      save('missionctrl_cumulative', next);
      return next;
    });
    updateDailyLogs(entry => ({
      ...entry,
      xpEarned: entry.xpEarned + amount,
    }));
  }

  // ─── Check + award perfect day ──────────────────────────
  function checkPerfectDay(entry, currentSettings) {
    const { ticketGoal } = currentSettings;
    const allTicketsDone = entry.tickets >= ticketGoal;
    const allBreaksReturned = Object.values(entry.breaks).every(b => b.returnedAt !== null);
    const allBreaksOnTime = Object.values(entry.breaks).every(b => b.onTime === true);
    return allTicketsDone && allBreaksReturned && allBreaksOnTime;
  }

  function awardPerfectDay(xpBonus) {
    setCumulative(prev => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().slice(0, 10);
      const wasYesterday = prev.lastPerfectDate === yStr;
      const wasToday = prev.lastPerfectDate === today;
      if (wasToday) return prev; // already awarded

      const newStreak = wasYesterday ? prev.currentStreak + 1 : 1;
      const next = {
        ...prev,
        totalXP: prev.totalXP + xpBonus,
        currentStreak: newStreak,
        bestStreak: Math.max(prev.bestStreak, newStreak),
        lastPerfectDate: today,
      };
      save('missionctrl_cumulative', next);
      return next;
    });
    updateDailyLogs(entry => ({ ...entry, perfectDay: true, xpEarned: entry.xpEarned + xpBonus }));
  }

  // ─── Actions ─────────────────────────────────────────────

  /** Log a completed ticket. Returns true if this was the last ticket. */
  const logTicket = useCallback(() => {
    let isLast = false;
    let isPerfect = false;
    setDailyLogs(prev => {
      const entry = prev[today] || makeDayEntry();
      if (entry.tickets >= settings.ticketGoal) return prev; // already done

      const newTickets = entry.tickets + 1;
      isLast = newTickets >= settings.ticketGoal;
      const updatedEntry = { ...entry, tickets: newTickets };

      if (isLast && checkPerfectDay({ ...updatedEntry }, settings)) {
        isPerfect = true;
      }

      const next = { ...prev, [today]: updatedEntry };
      save('missionctrl_daily', next);
      return next;
    });

    // XP for the ticket
    setCumulative(prev => {
      const next = { ...prev, totalXP: prev.totalXP + settings.xpPerTicket };
      save('missionctrl_cumulative', next);
      return next;
    });

    // We defer perfect day check after state settles via separate effect
    return { isLast };
  }, [today, settings]);

  /** Start a break timer. */
  const startBreak = useCallback((breakId) => {
    updateDailyLogs(entry => ({
      ...entry,
      breaks: {
        ...entry.breaks,
        [breakId]: { startedAt: Date.now(), returnedAt: null, onTime: null },
      },
    }));
  }, [today]);

  /** Return from a break. Returns { onTime, xpEarned }. */
  const returnFromBreak = useCallback((breakId) => {
    let result = { onTime: false, xpEarned: 0 };
    setDailyLogs(prev => {
      const entry = prev[today] || makeDayEntry();
      const brk = entry.breaks[breakId];
      if (!brk || !brk.startedAt) return prev;

      const durationMap = {
        break1: settings.break1Duration,
        break2: settings.break2Duration,
        lunch: settings.lunchDuration,
      };
      const elapsed = (Date.now() - brk.startedAt) / 1000;
      const onTime = elapsed <= durationMap[breakId] + 5; // 5s grace
      const overtimeSeconds = onTime ? 0 : Math.round(elapsed - durationMap[breakId]);
      result.onTime = onTime;
      result.overtimeSeconds = overtimeSeconds;
      result.xpEarned = onTime ? settings.xpPerOnTimeBreak : 0;

      const updatedBreak = { ...brk, returnedAt: Date.now(), onTime, overtimeSeconds };
      const updatedEntry = {
        ...entry,
        breaks: { ...entry.breaks, [breakId]: updatedBreak },
      };

      // Check perfect day after this return
      if (onTime && checkPerfectDay(updatedEntry, settings)) {
        // Will be handled after state update
        result.triggerPerfect = true;
      }

      const next = { ...prev, [today]: updatedEntry };
      save('missionctrl_daily', next);
      return next;
    });

    // XP for on-time return
    if (result.onTime) {
      setCumulative(prev => {
        const next = { ...prev, totalXP: prev.totalXP + settings.xpPerOnTimeBreak };
        save('missionctrl_cumulative', next);
        return next;
      });
      setDailyLogs(prev => {
        const entry = prev[today] || makeDayEntry();
        const next = { ...prev, [today]: { ...entry, xpEarned: entry.xpEarned + settings.xpPerOnTimeBreak } };
        save('missionctrl_daily', next);
        return next;
      });
    }

    return result;
  }, [today, settings]);

  /** Reset a break timer back to idle. Deducts XP if it was previously returned on-time. */
  const resetBreak = useCallback((breakId) => {
    setDailyLogs(prev => {
      const entry = prev[today] || makeDayEntry();
      const oldBreak = entry.breaks[breakId];

      if (oldBreak?.onTime) {
        setCumulative(c => {
          const next = { ...c, totalXP: Math.max(0, c.totalXP - settings.xpPerOnTimeBreak) };
          save('missionctrl_cumulative', next);
          return next;
        });
      }

      const updatedEntry = {
        ...entry,
        breaks: {
          ...entry.breaks,
          [breakId]: { startedAt: null, returnedAt: null, onTime: null, overtimeSeconds: 0 },
        },
      };
      const next = { ...prev, [today]: updatedEntry };
      save('missionctrl_daily', next);
      return next;
    });
  }, [today, settings]);

  /** Check if today should be marked perfect (call after ticket/break updates). */
  const tryAwardPerfectDay = useCallback(() => {
    setDailyLogs(prev => {
      const entry = prev[today] || makeDayEntry();
      if (!entry.perfectDay && checkPerfectDay(entry, settings)) {
        // Award it
        setCumulative(c => {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yStr = yesterday.toISOString().slice(0, 10);
          if (c.lastPerfectDate === today) return c; // already awarded
          const wasYesterday = c.lastPerfectDate === yStr;
          const newStreak = wasYesterday ? c.currentStreak + 1 : 1;
          const next = {
            ...c,
            totalXP: c.totalXP + settings.xpPerfectDayBonus,
            currentStreak: newStreak,
            bestStreak: Math.max(c.bestStreak, newStreak),
            lastPerfectDate: today,
          };
          save('missionctrl_cumulative', next);
          return next;
        });
        const updated = { ...entry, perfectDay: true, xpEarned: entry.xpEarned + settings.xpPerfectDayBonus };
        const next = { ...prev, [today]: updated };
        save('missionctrl_daily', next);
        return next;
      }
      return prev;
    });
  }, [today, settings]);

  /** Undo tickets back to a given count (e.g. tapping orb 2 → set count to 2). */
  const undoTickets = useCallback((newCount) => {
    let xpToDeduct = 0;
    setDailyLogs(prev => {
      const entry = prev[today] || makeDayEntry();
      if (newCount >= entry.tickets) return prev; // nothing to undo
      xpToDeduct = (entry.tickets - newCount) * settings.xpPerTicket;
      const updatedEntry = { ...entry, tickets: newCount, perfectDay: false };
      const next = { ...prev, [today]: updatedEntry };
      save('missionctrl_daily', next);
      return next;
    });
    if (xpToDeduct > 0) {
      setCumulative(prev => {
        const next = { ...prev, totalXP: Math.max(0, prev.totalXP - xpToDeduct) };
        save('missionctrl_cumulative', next);
        return next;
      });
    }
  }, [today, settings]);

  /** Update settings. */
  const updateSettings = useCallback((newSettings) => {
    const merged = { ...DEFAULT_SETTINGS, ...newSettings };
    setSettings(merged);
    save('missionctrl_settings', merged);
  }, []);

  // ─── Week data ──────────────────────────────────────────
  function getWeekData() {
    const days = [];
    const now = new Date();
    // Get Mon–Sun of current week
    const dayOfWeek = now.getDay(); // 0=Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const log = dailyLogs[dateStr] || null;
      days.push({
        dateStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        tickets: log?.tickets || 0,
        perfectDay: log?.perfectDay || false,
        isToday: dateStr === today,
        xpEarned: log?.xpEarned || 0,
        breaks: log?.breaks || null,
      });
    }

    // Compute stats
    const weeklyXP = days.reduce((s, d) => s + d.xpEarned, 0);
    const perfectDays = days.filter(d => d.perfectDay).length;
    const totalTickets = days.reduce((s, d) => s + d.tickets, 0);

    let totalBreaks = 0;
    let onTimeBreaks = 0;
    let totalOvertimeSeconds = 0;
    days.forEach(d => {
      if (d.breaks) {
        Object.values(d.breaks).forEach(b => {
          if (b.returnedAt !== null) {
            totalBreaks++;
            if (b.onTime) onTimeBreaks++;
            if (!b.onTime && b.overtimeSeconds) totalOvertimeSeconds += b.overtimeSeconds;
          }
        });
      }
    });
    const breakRate = totalBreaks > 0 ? Math.round((onTimeBreaks / totalBreaks) * 100) : null;
    const totalOvertimeMins = Math.round(totalOvertimeSeconds / 60);

    return { days, weeklyXP, perfectDays, totalTickets, breakRate, totalOvertimeMins };
  }

  return {
    // State
    settings,
    cumulative,
    todayData,
    today,
    // Derived
    level,
    xpIntoLevel,
    xpProgress,
    // Actions
    logTicket,
    undoTickets,
    startBreak,
    returnFromBreak,
    resetBreak,
    tryAwardPerfectDay,
    updateSettings,
    // Week data
    getWeekData,
  };
}
