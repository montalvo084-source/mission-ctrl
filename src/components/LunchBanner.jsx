import React, { useState } from 'react';

function to12h(hhmm) {
  if (!hhmm) return '—';
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatDate(d) {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function LunchBanner({ settings, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draftEarly, setDraftEarly] = useState(settings.lunchTimeEarlyWeek);
  const [draftLate,  setDraftLate]  = useState(settings.lunchTimeLateWeek);

  const now  = new Date();
  const dow  = now.getDay(); // 0=Sun … 6=Sat
  const isEarlyGroup = dow === 1 || dow === 2;
  const isLateGroup  = dow >= 3 && dow <= 5;
  const isWeekend    = dow === 0 || dow === 6;

  const lunchTime  = isEarlyGroup ? settings.lunchTimeEarlyWeek : settings.lunchTimeLateWeek;
  const groupLabel = isEarlyGroup ? 'Mon – Tue schedule' : isLateGroup ? 'Wed – Fri schedule' : null;
  const bannerClass = isEarlyGroup ? 'early-week' : isLateGroup ? 'late-week' : 'weekend';

  function handleSave() {
    onSave({ ...settings, lunchTimeEarlyWeek: draftEarly, lunchTimeLateWeek: draftLate });
    setEditing(false);
  }

  function handleEdit() {
    setDraftEarly(settings.lunchTimeEarlyWeek);
    setDraftLate(settings.lunchTimeLateWeek);
    setEditing(true);
  }

  return (
    <div className={`lunch-banner ${bannerClass}`}>
      <div className="lunch-banner-header">
        <span className="lunch-banner-label">TODAY'S LUNCH</span>
        {!editing && (
          <button className="edit-pencil-btn" onClick={handleEdit} aria-label="Edit lunch times">
            ✎
          </button>
        )}
      </div>

      <div className="lunch-banner-date">{formatDate(now)}</div>

      {isWeekend ? (
        <div className="lunch-weekend">
          No scheduled lunch — enjoy your weekend 🙌
        </div>
      ) : (
        <>
          <div className="lunch-time">{to12h(lunchTime)}</div>
          <div className="lunch-reason">{groupLabel}</div>
        </>
      )}

      {editing && (
        <div className="lunch-edit-overlay">
          <div className="lunch-edit-row">
            <span className="lunch-edit-label">Mon – Tue</span>
            <input
              type="time"
              className="lunch-time-input"
              value={draftEarly}
              onChange={e => setDraftEarly(e.target.value)}
            />
          </div>
          <div className="lunch-edit-row">
            <span className="lunch-edit-label">Wed – Fri</span>
            <input
              type="time"
              className="lunch-time-input"
              value={draftLate}
              onChange={e => setDraftLate(e.target.value)}
            />
          </div>
          <div className="lunch-edit-actions">
            <button className="lunch-save-btn" onClick={handleSave}>Save</button>
            <button className="lunch-cancel-btn" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
