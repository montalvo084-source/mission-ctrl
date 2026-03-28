import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTimer, formatTime, formatMinutes } from '../hooks/useTimer';

// ─── Inline Stepper ───────────────────────────────────────────
function Stepper({ value, onChange, min, max, step, display }) {
  return (
    <div className="stepper">
      <button className="stepper-btn" onClick={() => onChange(Math.max(min, value - step))}>−</button>
      <span className="stepper-val">{display ?? value}</span>
      <button className="stepper-btn" onClick={() => onChange(Math.min(max, value + step))}>+</button>
    </div>
  );
}

// ─── Inline Edit Overlay ──────────────────────────────────────
function InlineEditOverlay({ currentDuration, onSave, onClose }) {
  const [draft, setDraft] = useState(currentDuration);
  const ref = useRef(null);

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

  return (
    <div className="inline-edit-overlay" ref={ref}>
      <span className="inline-edit-label">Target</span>
      <Stepper
        value={draft}
        onChange={setDraft}
        min={300} max={7200} step={300}
        display={formatMinutes(draft)}
      />
      <button className="inline-edit-done" onClick={() => { onSave(draft); onClose(); }}>Done</button>
    </div>
  );
}

// ─── Work Timer ───────────────────────────────────────────────
export function WorkTimer({ startedAt, duration, onStart, onReset, onEditDuration }) {
  const [editing, setEditing] = useState(false);
  const [testMode, setTestMode] = useState(false);

  const activeDuration = testMode ? 10 : duration;
  const notify = useMemo(() => ({
    id: 1000, title: 'Focus Session', body: 'Target reached — great work!'
  }), []);
  const { elapsed, remaining, isOvertime, isRunning } = useTimer(startedAt, activeDuration, notify);

  // Warning at 5 min remaining (more useful than 60s for a 35-min session)
  const isWarning = isRunning && !isOvertime && remaining <= 300;

  let cardState = 'idle';
  if (isRunning) {
    if (isOvertime)   cardState = 'state-overtime';
    else if (isWarning) cardState = 'state-warning';
    else              cardState = 'state-running';
  }

  // Progress: fills from 0 → 100% as elapsed grows (inverse of break timer)
  const fillPct = isRunning
    ? Math.min(100, Math.round((elapsed / duration) * 100))
    : 0;

  let progressClass = 'normal';
  if (isOvertime)    progressClass = 'overtime';
  else if (isWarning) progressClass = 'warning';

  const elapsedDisplay = formatTime(elapsed);
  const overDisplay = '+' + formatTime(elapsed - duration);

  return (
    <div className={`work-timer timer-card ${cardState}`} style={{ position: 'relative' }}>
      <div className="timer-card-header">
        <span className="timer-name">Focus Session</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="timer-duration-default">{formatMinutes(duration)}</span>
          {!isRunning && (
            <button
              className="edit-pencil-btn"
              onClick={() => setEditing(e => !e)}
              aria-label="Edit session duration"
            >
              ✎
            </button>
          )}
        </div>
      </div>

      {editing && (
        <InlineEditOverlay
          currentDuration={duration}
          onSave={onEditDuration}
          onClose={() => setEditing(false)}
        />
      )}

      {/* Elapsed — the main number the user cares about */}
      <div className={`work-timer-elapsed${isOvertime ? ' overtime' : isWarning ? ' warning' : ''}`}>
        {isOvertime ? overDisplay : elapsedDisplay}
      </div>

      {/* Sub-label */}
      <div className="work-timer-sub">
        {!isRunning && 'tap to start tracking'}
        {isRunning && !isOvertime && !isWarning && `${formatTime(remaining)} remaining`}
        {isRunning && isWarning && !isOvertime && `${formatTime(remaining)} left — wrap up soon`}
        {isOvertime && `past ${formatMinutes(duration)} target`}
      </div>

      {/* Fill bar */}
      {isRunning && (
        <div className="timer-progress-track" style={{ marginTop: 10 }}>
          <div
            className={`work-timer-fill ${progressClass}`}
            style={{ width: `${fillPct}%` }}
          />
        </div>
      )}

      {/* Action buttons */}
      {!isRunning ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="timer-btn start" style={{ flex: 1 }} onClick={onStart}>
            ▶ Start Session
          </button>
          <button
            className="timer-reset-btn"
            style={{ fontSize: 11, padding: '0 10px' }}
            onClick={() => { setTestMode(true); onStart(); }}
            title="Test with 10 second timer"
          >
            ⚡ 10s
          </button>
        </div>
      ) : (
        <button className="timer-reset-btn" onClick={() => { setTestMode(false); onReset(); }}>
          ↺ Reset
        </button>
      )}
    </div>
  );
}
