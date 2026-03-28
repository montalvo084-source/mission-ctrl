import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTimer, formatTime, formatMinutes } from '../hooks/useTimer';

const BREAKS = [
  { id: 'break1', label: 'Break 1' },
  { id: 'break2', label: 'Break 2' },
  { id: 'lunch',  label: 'Lunch'   },
];

const DURATION_KEYS = {
  break1: 'break1Duration',
  break2: 'break2Duration',
  lunch:  'lunchDuration',
};

// ─── Inline Stepper (shared with SettingsPanel pattern) ──────
function Stepper({ value, onChange, min = 60, max = 7200, step = 60, display }) {
  return (
    <div className="stepper">
      <button className="stepper-btn" onClick={() => onChange(Math.max(min, value - step))}>−</button>
      <span className="stepper-val">{display ?? value}</span>
      <button className="stepper-btn" onClick={() => onChange(Math.min(max, value + step))}>+</button>
    </div>
  );
}

// ─── Inline Edit Overlay ─────────────────────────────────────
function InlineEditOverlay({ breakId, currentDuration, onSave, onClose }) {
  const [draft, setDraft] = useState(currentDuration);
  const ref = useRef(null);

  // Dismiss on outside click
  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handle);
    document.addEventListener('touchstart', handle);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('touchstart', handle);
    };
  }, [onClose]);

  function handleDone() {
    onSave(breakId, draft);
    onClose();
  }

  return (
    <div className="inline-edit-overlay" ref={ref}>
      <span className="inline-edit-label">Duration</span>
      <Stepper
        value={draft}
        onChange={setDraft}
        min={60} max={7200} step={60}
        display={formatMinutes(draft)}
      />
      <button className="inline-edit-done" onClick={handleDone}>Done</button>
    </div>
  );
}

// Unique numeric IDs for native notification scheduling
const NOTIFY_IDS = { break1: 1001, break2: 1002, lunch: 1003 };

// ─── Individual Timer Card ────────────────────────────────────
function TimerCard({ id, label, duration, breakData, xpPerOnTimeBreak, onStart, onReturn, onReset, onEditDuration }) {
  const [editing, setEditing] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const { startedAt, returnedAt, onTime, overtimeSeconds } = breakData;

  const GRACE_SECONDS = 45;
  const activeDuration = testMode ? 10 : duration;

  const notify = useMemo(() => ({
    id: NOTIFY_IDS[id], title: `${label} Over`, body: "Time's up — tap I'm Back!"
  }), [id, label]);

  const { elapsed, remaining, percentage, isOvertime, isWarning, isRunning } = useTimer(
    returnedAt ? null : startedAt,
    activeDuration,
    notify
  );

  const isGrace    = isOvertime && (elapsed - duration) <= GRACE_SECONDS;
  const isHardOver = isOvertime && (elapsed - duration) > GRACE_SECONDS;

  const isDone = returnedAt !== null;
  let cardState = 'idle';
  if (isDone) {
    cardState = onTime ? 'state-done-good' : 'state-done-late';
  } else if (isRunning) {
    if (isHardOver)     cardState = 'state-overtime';
    else if (isGrace)   cardState = 'state-grace';
    else if (isWarning) cardState = 'state-warning';
    else                cardState = 'state-running';
  }

  let displayTime;
  let displayClass = '';
  if (isDone) {
    displayTime = formatMinutes(duration);
  } else if (isRunning) {
    if (isOvertime) {
      const over = (Date.now() - startedAt) / 1000 - duration;
      displayTime = '+' + formatTime(over);
      displayClass = isGrace ? 'grace' : 'overtime';
    } else {
      displayTime = formatTime(remaining);
      if (isWarning) displayClass = 'warning';
    }
  } else {
    displayTime = formatTime(duration);
  }

  let progressClass = 'normal';
  if (isHardOver)     progressClass = 'overtime';
  else if (isOvertime) progressClass = 'warning'; // grace period uses amber bar
  else if (isWarning)  progressClass = 'warning';

  const isIdle = !isRunning && !isDone;

  return (
    <div className={`timer-card ${cardState}`}>
      <div className="timer-card-header">
        <span className="timer-name">{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="timer-duration-default">{formatMinutes(duration)}</span>
          {isIdle && (
            <button
              className="edit-pencil-btn"
              onClick={() => setEditing(e => !e)}
              aria-label={`Edit ${label} duration`}
            >
              ✎
            </button>
          )}
        </div>
      </div>

      {/* Inline edit overlay */}
      {editing && (
        <InlineEditOverlay
          breakId={id}
          currentDuration={duration}
          onSave={onEditDuration}
          onClose={() => setEditing(false)}
        />
      )}

      {!isDone && (
        <>
          <div className={`timer-display ${displayClass}`}>{displayTime}</div>
          {isGrace && (
            <div className="timer-grace-label">45s grace — tap I'm Back</div>
          )}

          {isRunning && (
            <div className="timer-progress-track">
              <div
                className={`timer-progress-fill ${progressClass}`}
                style={{ width: isOvertime ? '100%' : `${Math.round(percentage * 100)}%` }}
              />
            </div>
          )}

          {!isRunning && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="timer-btn start" style={{ flex: 1 }} onClick={() => onStart(id)}>
                Start {label}
              </button>
              <button
                className="timer-reset-btn"
                style={{ fontSize: 11, padding: '0 10px' }}
                onClick={() => { setTestMode(true); onStart(id); }}
                title="Test with 10 second timer"
              >
                ⚡ 10s
              </button>
            </div>
          )}

          {isRunning && (
            <button className="timer-btn back" onClick={() => onReturn(id)}>
              I'm Back
            </button>
          )}
        </>
      )}

      {isDone && (
        <div className="timer-result">
          <span className="timer-result-icon">{onTime ? '✅' : '❌'}</span>
          <span className={`timer-result-text ${onTime ? 'good' : 'late'}`}>
            {onTime ? 'On Time' : `Late by ${formatTime(overtimeSeconds || 0)}`}
          </span>
          {onTime && (
            <span className="timer-result-xp">+{xpPerOnTimeBreak} XP</span>
          )}
        </div>
      )}

      {(isRunning || isDone) && (
        <button className="timer-reset-btn" onClick={() => { setTestMode(false); onReset(id); }}>
          ↺ Reset
        </button>
      )}
    </div>
  );
}

// ─── Break Timers Container ───────────────────────────────────
export function BreakTimers({ settings, todayData, onStart, onReturn, onReset, onEditDuration }) {
  const durationMap = {
    break1: settings.break1Duration,
    break2: settings.break2Duration,
    lunch:  settings.lunchDuration,
  };

  return (
    <div className="break-timers">
      {BREAKS.map(({ id, label }) => (
        <TimerCard
          key={id}
          id={id}
          label={label}
          duration={durationMap[id]}
          breakData={todayData.breaks[id] || { startedAt: null, returnedAt: null, onTime: null, overtimeSeconds: 0 }}
          xpPerOnTimeBreak={settings.xpPerOnTimeBreak}
          onStart={onStart}
          onReturn={onReturn}
          onReset={onReset}
          onEditDuration={onEditDuration}
        />
      ))}
    </div>
  );
}
