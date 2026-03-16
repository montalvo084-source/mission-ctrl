import React, { useState } from 'react';
import { formatMinutes } from '../hooks/useTimer';

const DEFAULTS = {
  break1Duration: 14 * 60,
  break2Duration: 14 * 60,
  lunchDuration: 58 * 60,
  ticketGoal: 5,
  xpPerTicket: 20,
  xpPerOnTimeBreak: 30,
  xpPerfectDayBonus: 100,
  xpPerLevel: 500,
};

function Stepper({ value, onChange, min = 1, max = 9999, step = 1, display }) {
  return (
    <div className="stepper">
      <button
        className="stepper-btn"
        onClick={() => onChange(Math.max(min, value - step))}
        aria-label="Decrease"
      >
        −
      </button>
      <span className="stepper-val">{display ?? value}</span>
      <button
        className="stepper-btn"
        onClick={() => onChange(Math.min(max, value + step))}
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}

export function SettingsPanel({ settings, onSave, onClose }) {
  const [draft, setDraft] = useState({ ...settings });

  function set(key, value) {
    setDraft(prev => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    onSave(draft);
    onClose();
  }

  function handleReset() {
    setDraft({ ...DEFAULTS });
  }

  return (
    <>
      <div className="settings-overlay" onClick={onClose} />
      <div className="settings-sheet" role="dialog" aria-label="Settings">
        <div className="settings-handle" />
        <div className="settings-title">⚙ SETTINGS</div>

        <div className="settings-body">
          {/* Timers */}
          <div className="settings-group">
            <div className="settings-group-title">Break Durations</div>

            <div className="settings-row">
              <span className="settings-row-label">Break 1</span>
              <Stepper
                value={draft.break1Duration}
                onChange={v => set('break1Duration', v)}
                min={60} max={3600} step={60}
                display={formatMinutes(draft.break1Duration)}
              />
            </div>

            <div className="settings-row">
              <span className="settings-row-label">Break 2</span>
              <Stepper
                value={draft.break2Duration}
                onChange={v => set('break2Duration', v)}
                min={60} max={3600} step={60}
                display={formatMinutes(draft.break2Duration)}
              />
            </div>

            <div className="settings-row">
              <span className="settings-row-label">Lunch</span>
              <Stepper
                value={draft.lunchDuration}
                onChange={v => set('lunchDuration', v)}
                min={60} max={7200} step={60}
                display={formatMinutes(draft.lunchDuration)}
              />
            </div>
          </div>

          {/* Tickets */}
          <div className="settings-group">
            <div className="settings-group-title">Tickets</div>

            <div className="settings-row">
              <span className="settings-row-label">Daily Ticket Goal</span>
              <Stepper
                value={draft.ticketGoal}
                onChange={v => set('ticketGoal', v)}
                min={1} max={20}
              />
            </div>
          </div>

          {/* XP */}
          <div className="settings-group">
            <div className="settings-group-title">XP Values</div>

            <div className="settings-row">
              <span className="settings-row-label">XP per Ticket</span>
              <Stepper
                value={draft.xpPerTicket}
                onChange={v => set('xpPerTicket', v)}
                min={5} max={500} step={5}
              />
            </div>

            <div className="settings-row">
              <span className="settings-row-label">XP On-Time Break</span>
              <Stepper
                value={draft.xpPerOnTimeBreak}
                onChange={v => set('xpPerOnTimeBreak', v)}
                min={5} max={500} step={5}
              />
            </div>

            <div className="settings-row">
              <span className="settings-row-label">Perfect Day Bonus</span>
              <Stepper
                value={draft.xpPerfectDayBonus}
                onChange={v => set('xpPerfectDayBonus', v)}
                min={0} max={1000} step={10}
              />
            </div>

            <div className="settings-row">
              <span className="settings-row-label">XP per Level</span>
              <Stepper
                value={draft.xpPerLevel}
                onChange={v => set('xpPerLevel', v)}
                min={100} max={5000} step={100}
              />
            </div>
          </div>
        </div>

        <div className="settings-actions">
          <button className="btn-save" onClick={handleSave}>Save</button>
          <button className="btn-reset" onClick={handleReset}>Reset Defaults</button>
        </div>
      </div>
    </>
  );
}
