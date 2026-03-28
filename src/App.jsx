import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useGameState } from './hooks/useGameState';
import { XPHeader } from './components/XPHeader';
import { BreakTimers } from './components/BreakTimers';
import { TicketTracker } from './components/TicketTracker';
import { WeeklyTab } from './components/WeeklyTab';
import { SettingsPanel } from './components/SettingsPanel';
import { Confetti } from './components/Confetti';
import { ToastMessage } from './components/ToastMessage';
import { NotesTab } from './components/NotesTab';
import { WorkTimer } from './components/WorkTimer';
import { LunchBanner } from './components/LunchBanner';
import { StickyNotes } from './components/StickyNotes';
import { MorningChecklist } from './components/MorningChecklist';
import { requestPermissionEagerly } from './utils/nativeNotifications';

// ─── Message Pools ───────────────────────────────────────────
const MESSAGES = {
  ticket:    ['Keep it up! 🚀', 'Ticket crushed! 💥', 'One down! 🎯', "You're on a roll! ⚡", 'Making moves! 💪'],
  allTickets:["ALL DONE! You absolute legend! 🏆", "Goal smashed! 🔥", "Tickets closed — own it! ⭐", "BOOM! All tickets in! 🎯"],
  onTime:    ['Back on time! 💚', 'Nailed the break! ✅', 'Discipline = gains 💪', 'Right on the clock! ⏱️'],
  late:      ['A little overtime — shake it off 💪', 'Next break, aim earlier! ⏱️', 'You got this, keep pushing 🔥', "Don't sweat it, refocus! 🧘"],
  perfectDay:['PERFECT DAY! You\'re unstoppable! ⭐🔥', 'Absolutely flawless today! 🏆', 'PERFECT! You set the bar! 🌟'],
  levelUp:   ['LEVEL UP! The grind pays off! 🚀', 'You leveled up! Keep climbing! ⚡', 'New level unlocked! 🎮'],
  streak3:   ["3-day streak! You're building habits! 🔥"],
  streak7:   ['7 days straight! One full week! 🔥🔥'],
  streak14:  ['14-day streak! Two weeks of excellence! 🔥🔥🔥'],
  streak30:  ['30 DAYS! Absolute machine! 🏆🔥'],
  morningTask:     ['Nice! One more checked off! ✅', 'Getting set up! 💪', 'On it! 🎯'],
  morningComplete: ['Startup complete! Let\'s get it! 🚀', 'All systems go! Time to crush it! 💪', 'Locked and loaded! 🔥'],
};

const TOAST_COLORS = {
  ticket:    'rgba(0, 255, 136, 0.3)',
  allTickets:'rgba(255, 215, 0, 0.4)',
  onTime:    'rgba(0, 255, 136, 0.3)',
  late:      'rgba(255, 59, 48, 0.3)',
  perfectDay:'rgba(255, 215, 0, 0.5)',
  levelUp:   'rgba(123, 97, 255, 0.4)',
  streak3:   'rgba(255, 165, 0, 0.3)',
  streak7:   'rgba(255, 165, 0, 0.4)',
  streak14:  'rgba(255, 165, 0, 0.5)',
  streak30:       'rgba(255, 215, 0, 0.5)',
  morningTask:    'rgba(0, 255, 136, 0.25)',
  morningComplete:'rgba(0, 255, 136, 0.45)',
};

const TOAST_ICONS = {
  ticket:    '🎯',
  allTickets:'🏆',
  onTime:    '💚',
  late:      '⏱️',
  perfectDay:'⭐',
  levelUp:   '🚀',
  streak3:   '🔥',
  streak7:   '🔥',
  streak14:  '🔥',
  streak30:       '🏆',
  morningTask:    '✅',
  morningComplete:'🚀',
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function App() {
  const [activeTab, setActiveTab] = useState('today');
  const [showSettings, setShowSettings] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Toast queue
  const [toastQueue, setToastQueue] = useState([]);
  const currentToast = toastQueue[0] || null;

  const fireToast = useCallback((type, extra = {}) => {
    const pool = MESSAGES[type];
    if (!pool) return;
    let message = pick(pool);
    if (extra.level) message = message.replace('{n}', extra.level);
    const id = Date.now() + Math.random();
    setToastQueue(prev => [...prev, {
      id,
      icon: TOAST_ICONS[type] || '✨',
      message,
      borderColor: TOAST_COLORS[type],
    }]);
  }, []);

  const dismissToast = useCallback(() => {
    setToastQueue(prev => prev.slice(1));
  }, []);

  const {
    settings,
    cumulative,
    todayData,
    level,
    xpIntoLevel,
    xpProgress,
    logTicket,
    undoTickets,
    checkMorningTask,
    uncheckMorningTask,
    startWorkSession,
    resetWorkSession,
    startBreak,
    returnFromBreak,
    resetBreak,
    tryAwardPerfectDay,
    updateSettings,
    getWeekData,
  } = useGameState();

  // ─── Handle ticket tap ──────────────────────────────────
  const handleTicket = useCallback(() => {
    const { isLast } = logTicket();
    fireToast(isLast ? 'allTickets' : 'ticket');
    setTimeout(() => tryAwardPerfectDay(), 50);
  }, [logTicket, tryAwardPerfectDay, fireToast]);

  // ─── Handle break return ────────────────────────────────
  const handleReturn = useCallback((breakId) => {
    const result = returnFromBreak(breakId);
    fireToast(result.onTime ? 'onTime' : 'late');
    setTimeout(() => tryAwardPerfectDay(), 50);
  }, [returnFromBreak, tryAwardPerfectDay, fireToast]);

  // ─── Handle morning task check ──────────────────────────
  const handleMorningCheck = useCallback((taskId) => {
    const { allDone } = checkMorningTask(taskId);
    fireToast(allDone ? 'morningComplete' : 'morningTask');
  }, [checkMorningTask, fireToast]);

  // ─── Handle work session duration edit ─────────────────
  const handleEditWorkDuration = useCallback((newDuration) => {
    updateSettings({ ...settings, workSessionDuration: newDuration });
  }, [settings, updateSettings]);

  // ─── Request notification permission on first launch ────
  useEffect(() => { requestPermissionEagerly(); }, []);

  // ─── Level-up detection ─────────────────────────────────
  const prevLevel = useRef(level);
  useEffect(() => {
    if (level > prevLevel.current) {
      fireToast('levelUp', { level });
    }
    prevLevel.current = level;
  }, [level, fireToast]);

  // ─── Perfect day detection ──────────────────────────────
  const wasPerfect = useRef(todayData.perfectDay);
  useEffect(() => {
    if (!wasPerfect.current && todayData.perfectDay) {
      setShowConfetti(true);
      fireToast('perfectDay');
    }
    wasPerfect.current = todayData.perfectDay;
  }, [todayData.perfectDay, fireToast]);

  // ─── Streak milestone detection ─────────────────────────
  const prevStreak = useRef(cumulative.currentStreak);
  useEffect(() => {
    const s = cumulative.currentStreak;
    const prev = prevStreak.current;
    if (s > prev) {
      if (s === 30) fireToast('streak30');
      else if (s === 14) fireToast('streak14');
      else if (s === 7) fireToast('streak7');
      else if (s === 3) fireToast('streak3');
    }
    prevStreak.current = s;
  }, [cumulative.currentStreak, fireToast]);

  // ─── Inline edit callbacks ──────────────────────────────
  const handleEditDuration = useCallback((breakId, newSeconds) => {
    const keyMap = { break1: 'break1Duration', break2: 'break2Duration', lunch: 'lunchDuration' };
    updateSettings({ ...settings, [keyMap[breakId]]: newSeconds });
  }, [settings, updateSettings]);

  const handleEditTicketGoal = useCallback((newGoal) => {
    updateSettings({ ...settings, ticketGoal: newGoal });
  }, [settings, updateSettings]);

  return (
    <div className="app-shell">
      <XPHeader
        level={level}
        xpIntoLevel={xpIntoLevel}
        xpProgress={xpProgress}
        totalXP={cumulative.totalXP}
        xpPerLevel={settings.xpPerLevel}
        onGearClick={() => setShowSettings(true)}
      />

      {/* Tab Content */}
      <div className="app-content" key={activeTab}>
        {activeTab === 'today' ? (
          <>
            {/* Lunch Schedule Banner */}
            <LunchBanner settings={settings} onSave={updateSettings} />

            {/* Streak Row */}
            <div className="streak-bar">
              <div className="streak-card">
                <span className="streak-card-label">🔥 Streak</span>
                <span className={`streak-card-value ${cumulative.currentStreak === 0 ? 'zero' : ''}`}>
                  {cumulative.currentStreak}
                </span>
              </div>
              <div className="streak-card">
                <span className="streak-card-label">Best</span>
                <span className={`streak-card-value ${cumulative.bestStreak === 0 ? 'zero' : ''}`}>
                  {cumulative.bestStreak}
                </span>
              </div>
            </div>

            {/* Morning Startup Checklist */}
            <MorningChecklist
              tasks={settings.morningTasks || []}
              checks={todayData.morningChecks || {}}
              xpPerTask={settings.xpPerMorningTask}
              onCheck={handleMorningCheck}
              onUncheck={uncheckMorningTask}
              onEditTasks={(newTasks) => updateSettings({ ...settings, morningTasks: newTasks })}
            />

            {/* Sticky Note Reminders */}
            <StickyNotes />

            {/* Tickets */}
            <div className="section-heading">
              <span className="dot" />
              <h2>Tickets</h2>
            </div>
            <WorkTimer
              startedAt={todayData.workSession?.startedAt ?? null}
              duration={settings.workSessionDuration}
              onStart={startWorkSession}
              onReset={resetWorkSession}
              onEditDuration={handleEditWorkDuration}
            />
            <TicketTracker
              tickets={todayData.tickets}
              ticketGoal={settings.ticketGoal}
              xpPerTicket={settings.xpPerTicket}
              onTicket={handleTicket}
              onUndo={undoTickets}
              onEditGoal={handleEditTicketGoal}
            />

            {/* Breaks */}
            <div className="section-heading">
              <span className="dot" style={{ background: 'var(--purple)' }} />
              <h2>Breaks</h2>
            </div>
            <BreakTimers
              settings={settings}
              todayData={todayData}
              onStart={startBreak}
              onReturn={handleReturn}
              onReset={resetBreak}
              onEditDuration={handleEditDuration}
            />

            {/* Perfect Day Badge */}
            {todayData.perfectDay && (
              <div style={{
                textAlign: 'center',
                marginTop: 24,
                padding: '16px',
                background: 'rgba(255,215,0,0.08)',
                border: '1px solid rgba(255,215,0,0.25)',
                borderRadius: 16,
                animation: 'slide-up 0.4s ease',
              }}>
                <div style={{ fontSize: 32 }}>⭐</div>
                <div style={{
                  fontFamily: 'var(--font-data)',
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--gold)',
                  letterSpacing: '0.08em',
                  marginTop: 6,
                }}>PERFECT DAY</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  +{settings.xpPerfectDayBonus} XP bonus earned
                </div>
              </div>
            )}
          </>
        ) : activeTab === 'week' ? (
          <WeeklyTab
            getWeekData={getWeekData}
            ticketGoal={settings.ticketGoal}
          />
        ) : (
          <NotesTab />
        )}
      </div>

      {/* Tab Bar */}
      <nav className="tab-bar">
        <button
          className={`tab-btn ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          <svg viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Today
        </button>
        <button
          className={`tab-btn ${activeTab === 'week' ? 'active' : ''}`}
          onClick={() => setActiveTab('week')}
        >
          <svg viewBox="0 0 24 24">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Week
        </button>
        <button
          className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          <svg viewBox="0 0 24 24">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          Notes
        </button>
      </nav>

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel
          settings={settings}
          onSave={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Confetti */}
      {showConfetti && (
        <Confetti onDone={() => setShowConfetti(false)} />
      )}

      {/* Toast */}
      <ToastMessage toast={currentToast} onDone={dismissToast} />
    </div>
  );
}
