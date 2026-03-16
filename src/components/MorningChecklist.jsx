import React, { useState, useRef, useCallback } from 'react';
import { FloatingXP } from './FloatingXP';

export function MorningChecklist({ tasks, checks, xpPerTask, onCheck, onUncheck, onEditTasks }) {
  const [editing, setEditing]     = useState(false);
  const [draftTasks, setDraftTasks] = useState([]);
  const [floatingXPs, setFloatingXPs] = useState([]);

  const doneCount = tasks.filter(t => checks[t.id]).length;
  const allDone   = doneCount === tasks.length && tasks.length > 0;

  // ── Normal tap handler ──────────────────────────────────────
  const handleTap = useCallback((e, task) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    if (checks[task.id]) {
      onUncheck(task.id);
    } else {
      onCheck(task.id);
      const id = Date.now() + Math.random();
      setFloatingXPs(prev => [...prev, { id, x, y: y - 8, amount: xpPerTask }]);
    }
  }, [checks, onCheck, onUncheck, xpPerTask]);

  const removeFloating = useCallback((id) => {
    setFloatingXPs(prev => prev.filter(f => f.id !== id));
  }, []);

  // ── Edit mode ───────────────────────────────────────────────
  function openEdit() {
    setDraftTasks(tasks.map(t => ({ ...t })));
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  function saveEdit() {
    const valid = draftTasks.filter(t => t.label.trim().length > 0);
    onEditTasks(valid);
    setEditing(false);
  }

  function updateLabel(id, label) {
    setDraftTasks(prev => prev.map(t => t.id === id ? { ...t, label } : t));
  }

  function deleteTask(id) {
    setDraftTasks(prev => prev.filter(t => t.id !== id));
  }

  function addTask() {
    if (draftTasks.length >= 10) return;
    setDraftTasks(prev => [...prev, { id: 'm' + Date.now(), label: '' }]);
  }

  // ── Edit view ───────────────────────────────────────────────
  if (editing) {
    return (
      <div className="morning-checklist">
        <div className="section-heading">
          <span className="dot" style={{ background: 'var(--accent)' }} />
          <h2>Startup Tasks</h2>
        </div>
        <div className="morning-edit-list">
          {draftTasks.map((task, i) => (
            <div key={task.id} className="morning-edit-row">
              <span className="morning-edit-num">{i + 1}</span>
              <input
                className="morning-edit-input"
                value={task.label}
                onChange={e => updateLabel(task.id, e.target.value)}
                placeholder="Task name…"
              />
              <button className="morning-edit-delete" onClick={() => deleteTask(task.id)}>✕</button>
            </div>
          ))}
          {draftTasks.length < 10 && (
            <button className="morning-add-btn" onClick={addTask}>+ Add Task</button>
          )}
        </div>
        <div className="morning-edit-actions">
          <button className="lunch-save-btn" onClick={saveEdit}>Save</button>
          <button className="lunch-cancel-btn" onClick={cancelEdit}>Cancel</button>
        </div>
      </div>
    );
  }

  // ── Normal view ─────────────────────────────────────────────
  return (
    <div className="morning-checklist">
      <div className="section-heading">
        <span className="dot" style={{ background: 'var(--accent)' }} />
        <h2 style={{ color: allDone ? 'var(--accent)' : undefined }}>
          {allDone ? '✅ Startup' : '🚀 Startup'}
        </h2>
        <button className="edit-pencil-btn" onClick={openEdit} aria-label="Edit startup tasks">✎</button>
      </div>

      {allDone && (
        <div className="morning-all-done">All systems go — let's get it! 💪</div>
      )}

      <div className="morning-task-list">
        {tasks.map(task => {
          const done = !!checks[task.id];
          return (
            <div
              key={task.id}
              className={`morning-task-row${done ? ' done' : ''}`}
              onClick={(e) => handleTap(e, task)}
              role="button"
              tabIndex={0}
            >
              <div className={`morning-task-circle${done ? ' done' : ''}`}>
                {done && <span>✓</span>}
              </div>
              <span className={`morning-task-label${done ? ' done' : ''}`}>{task.label}</span>
              {!done && (
                <span className="morning-task-xp">+{xpPerTask} XP</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="morning-progress-text">
        {doneCount} / {tasks.length} done
      </div>

      {floatingXPs.map(f => (
        <FloatingXP key={f.id} x={f.x} y={f.y} amount={f.amount} onDone={() => removeFloating(f.id)} />
      ))}
    </div>
  );
}
