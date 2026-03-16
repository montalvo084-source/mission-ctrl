import React from 'react';

export function WeeklyTab({ getWeekData, ticketGoal }) {
  const { days, weeklyXP, perfectDays, totalTickets, breakRate, totalOvertimeMins } = getWeekData();

  return (
    <div className="weekly-tab">
      {/* Day Pills */}
      <div className="section-week-title">This Week</div>

      <div className="week-days-row">
        {days.map(day => (
          <div
            key={day.dateStr}
            className={`day-pill ${day.isToday ? 'today' : ''} ${day.perfectDay ? 'perfect' : ''}`}
          >
            <span className="day-pill-name">{day.dayName}</span>
            <span className="day-pill-star">
              {day.perfectDay ? '⭐' : day.tickets > 0 ? '📋' : '·'}
            </span>
            <span className={`day-pill-tickets ${day.tickets === 0 ? 'empty' : ''}`}>
              {day.tickets}/{ticketGoal}
            </span>
          </div>
        ))}
      </div>

      {/* Stat Cards */}
      <div className="section-week-title">Stats</div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-card-label">Weekly XP</span>
          <span className="stat-card-value xp">{weeklyXP.toLocaleString()}</span>
          <span className="stat-card-sub">this week</span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Perfect Days</span>
          <span className="stat-card-value days">{perfectDays}</span>
          <span className="stat-card-sub">out of 7</span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Tickets Closed</span>
          <span className="stat-card-value tix">{totalTickets}</span>
          <span className="stat-card-sub">this week</span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Break Rate</span>
          <span className="stat-card-value rate">
            {breakRate !== null ? `${breakRate}%` : '—'}
          </span>
          <span className="stat-card-sub">on-time returns</span>
        </div>

        <div className="stat-card" style={{ gridColumn: '1 / -1' }}>
          <span className="stat-card-label">Time Over</span>
          <span className="stat-card-value" style={{ color: totalOvertimeMins > 0 ? 'var(--danger)' : 'var(--text-dim)' }}>
            {totalOvertimeMins > 0 ? `${totalOvertimeMins}m` : '0m'}
          </span>
          <span className="stat-card-sub">overtime across all breaks</span>
        </div>
      </div>
    </div>
  );
}
