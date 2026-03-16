import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ParticleBurst } from './ParticleBurst';
import { FloatingXP } from './FloatingXP';

// ─── Inline Stepper ──────────────────────────────────────────
function Stepper({ value, onChange, min = 1, max = 20 }) {
  return (
    <div className="stepper">
      <button className="stepper-btn" onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <span className="stepper-val">{value}</span>
      <button className="stepper-btn" onClick={() => onChange(Math.min(max, value + 1))}>+</button>
    </div>
  );
}

// ─── Inline Goal Edit Overlay ────────────────────────────────
function GoalEditOverlay({ currentGoal, onSave, onClose }) {
  const [draft, setDraft] = useState(currentGoal);
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
    <div className="inline-edit-overlay" ref={ref} style={{ top: 'calc(100% + 8px)', left: 'auto', right: 0 }}>
      <span className="inline-edit-label">Goal</span>
      <Stepper value={draft} onChange={setDraft} min={1} max={20} />
      <button className="inline-edit-done" onClick={() => { onSave(draft); onClose(); }}>Done</button>
    </div>
  );
}

// ─── Ticket Tracker ──────────────────────────────────────────
export function TicketTracker({ tickets, ticketGoal, xpPerTicket, onTicket, onUndo, onEditGoal }) {
  const [particles, setParticles] = useState([]);
  const [floatingXPs, setFloatingXPs] = useState([]);
  const [poppedOrb, setPoppedOrb] = useState(null);
  const [editingGoal, setEditingGoal] = useState(false);

  const handleOrbTap = useCallback((e, index) => {
    const filled = index < tickets;

    // Tap a filled orb → undo back to that index
    if (filled) {
      onUndo(index);
      return;
    }

    // Tap the next empty orb → log a ticket
    if (index !== tickets || tickets >= ticketGoal) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const id = Date.now() + Math.random();

    setParticles(prev => [...prev, { id, x: cx, y: cy }]);
    setFloatingXPs(prev => [...prev, { id: id + 1, x: cx, y: cy - 10, amount: xpPerTicket }]);
    setPoppedOrb(index);
    setTimeout(() => setPoppedOrb(null), 400);

    onTicket();
  }, [tickets, ticketGoal, xpPerTicket, onTicket, onUndo]);

  const removeParticle = useCallback((id) => {
    setParticles(prev => prev.filter(p => p.id !== id));
  }, []);

  const removeFloating = useCallback((id) => {
    setFloatingXPs(prev => prev.filter(f => f.id !== id));
  }, []);

  const progressPct = ticketGoal > 0 ? (tickets / ticketGoal) * 100 : 0;
  const allDone = tickets >= ticketGoal;

  return (
    <div className="ticket-tracker">
      <div className="ticket-header">
        <div className="ticket-count">
          {tickets}<span>/{ticketGoal}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
          <div className="ticket-goal-label">TICKETS</div>
          {!allDone && (
            <button
              className="edit-pencil-btn"
              onClick={() => setEditingGoal(e => !e)}
              aria-label="Edit ticket goal"
            >
              ✎
            </button>
          )}
          {editingGoal && (
            <GoalEditOverlay
              currentGoal={ticketGoal}
              onSave={onEditGoal}
              onClose={() => setEditingGoal(false)}
            />
          )}
        </div>
      </div>

      <div className="orbs-row">
        {Array.from({ length: ticketGoal }, (_, i) => {
          const filled = i < tickets;
          const isNext = i === tickets && !allDone;
          const isPopping = poppedOrb === i;

          return (
            <div
              key={i}
              className={`orb ${filled ? 'filled' : ''} ${isNext ? 'next' : ''} ${isPopping ? 'pop' : ''}`}
              onClick={(e) => handleOrbTap(e, i)}
              role="button"
              tabIndex={filled || isNext ? 0 : -1}
              aria-label={filled ? `Undo ticket ${i + 1}` : isNext ? `Log ticket ${i + 1}` : `Ticket ${i + 1}`}
            >
              {filled
                ? <span className="orb-check">✓</span>
                : <span className="orb-num">{i + 1}</span>
              }
            </div>
          );
        })}
      </div>

      <div className="ticket-progress-track">
        <div
          className="ticket-progress-fill"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="trophy-area">
        {allDone && (
          <div className="trophy-display" key={tickets}>🏆</div>
        )}
      </div>

      {/* Animation overlays */}
      {particles.map(p => (
        <ParticleBurst
          key={p.id}
          x={p.x}
          y={p.y}
          onDone={() => removeParticle(p.id)}
        />
      ))}
      {floatingXPs.map(f => (
        <FloatingXP
          key={f.id}
          x={f.x}
          y={f.y}
          amount={f.amount}
          onDone={() => removeFloating(f.id)}
        />
      ))}
    </div>
  );
}
