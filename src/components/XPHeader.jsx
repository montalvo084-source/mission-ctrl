import React from 'react';

export function XPHeader({ level, xpIntoLevel, xpProgress, totalXP, xpPerLevel, onGearClick }) {
  const pct = Math.round(xpProgress * 100);

  return (
    <header className="xp-header">
      <div className="level-badge">LVL {level}</div>

      <div className="xp-section">
        <div className="xp-label-row">
          <span className="xp-label">XP Progress</span>
          <span className="xp-total">{totalXP.toLocaleString()} XP</span>
        </div>
        <div className="xp-bar-track">
          <div
            className="xp-bar-fill"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
            {xpIntoLevel} / {xpPerLevel}
          </span>
          <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
            {pct}%
          </span>
        </div>
      </div>

      <button className="gear-btn" onClick={onGearClick} aria-label="Settings">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path
            d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
            strokeWidth="2" stroke="currentColor" fill="none"
            strokeLinecap="round" strokeLinejoin="round"
          />
          <path
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
            strokeWidth="2" stroke="currentColor" fill="none"
            strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      </button>
    </header>
  );
}
