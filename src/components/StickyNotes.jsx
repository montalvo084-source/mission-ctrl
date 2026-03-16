import React, { useState, useEffect, useRef, useCallback } from 'react';

const STORAGE_KEY = 'missionctrl_reminders';
const MAX_NOTES = 3;

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function save(notes) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); } catch {}
}

export function StickyNotes() {
  const [notes, setNotes]       = useState(() => load());
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft]         = useState('');
  const textareaRef               = useRef(null);

  // Auto-focus textarea when editing starts
  useEffect(() => {
    if (editingId !== null && textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [editingId]);

  const openEdit = useCallback((note) => {
    setDraft(note.text);
    setEditingId(note.id);
  }, []);

  const commitEdit = useCallback(() => {
    const trimmed = draft.trim();
    setNotes(prev => {
      const next = trimmed
        ? prev.map(n => n.id === editingId ? { ...n, text: trimmed } : n)
        : prev.filter(n => n.id !== editingId); // remove if emptied
      save(next);
      return next;
    });
    setEditingId(null);
    setDraft('');
  }, [draft, editingId]);

  const addNote = useCallback(() => {
    if (notes.length >= MAX_NOTES) return;
    const newNote = { id: Date.now(), text: '' };
    const next = [...notes, newNote];
    setNotes(next);
    save(next);
    setDraft('');
    setEditingId(newNote.id);
  }, [notes]);

  const deleteNote = useCallback((id, e) => {
    e.stopPropagation();
    if (editingId === id) { setEditingId(null); setDraft(''); }
    setNotes(prev => {
      const next = prev.filter(n => n.id !== id);
      save(next);
      return next;
    });
  }, [editingId]);

  // Dismiss on outside tap
  const containerRef = useRef(null);
  useEffect(() => {
    if (editingId === null) return;
    function handleOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        commitEdit();
      }
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [editingId, commitEdit]);

  if (notes.length === 0 && editingId === null) {
    return (
      <div className="sticky-notes-section" ref={containerRef}>
        <div className="sticky-notes-heading">
          <span className="dot" style={{ background: 'var(--gold)' }} />
          <h2>Reminders</h2>
          <button className="sticky-note-add-btn" onClick={addNote}>+ Add</button>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky-notes-section" ref={containerRef}>
      <div className="sticky-notes-heading">
        <span className="dot" style={{ background: 'var(--gold)' }} />
        <h2>Reminders</h2>
        {notes.length < MAX_NOTES && (
          <button className="sticky-note-add-btn" onClick={addNote}>+ Add</button>
        )}
      </div>

      <div className="sticky-notes-list">
        {notes.map(note => {
          const isEditing = editingId === note.id;
          return (
            <div
              key={note.id}
              className={`sticky-note-card${isEditing ? ' editing' : ''}`}
              onClick={() => !isEditing && openEdit(note)}
            >
              <button
                className="sticky-note-delete-btn"
                onClick={(e) => deleteNote(note.id, e)}
                aria-label="Delete reminder"
              >✕</button>

              {isEditing ? (
                <>
                  <textarea
                    ref={textareaRef}
                    className="sticky-note-textarea"
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    placeholder="Type your reminder…"
                    rows={3}
                  />
                  <button className="sticky-note-done-btn" onClick={commitEdit}>Done</button>
                </>
              ) : (
                <div className={`sticky-note-text${!note.text ? ' placeholder' : ''}`}>
                  {note.text || 'Tap to add a reminder…'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
