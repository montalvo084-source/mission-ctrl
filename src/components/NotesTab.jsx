import React, { useState, useEffect, useRef, useCallback } from 'react';

const STORAGE_KEY = 'missionctrl_notes';

function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveNotes(notes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {}
}

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// ─── Edit View ────────────────────────────────────────────────
function NoteEditor({ note, onBack, onChange }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, []);

  return (
    <div className="note-editor-view">
      <div className="note-editor-header">
        <button className="note-back-btn" onClick={onBack}>
          ← Back
        </button>
        <div className="note-editor-meta">
          <span className="note-date">{formatDate(note.createdAt)}</span>
          <span className="note-time">{formatTime(note.updatedAt)}</span>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        className="note-textarea"
        value={note.content}
        onChange={(e) => onChange(note.id, e.target.value)}
        placeholder="Write something..."
      />
    </div>
  );
}

// ─── Notes Tab ────────────────────────────────────────────────
export function NotesTab() {
  const [notes, setNotes] = useState(() => loadNotes());
  const [activeNoteId, setActiveNoteId] = useState(null);

  const activeNote = notes.find(n => n.id === activeNoteId) || null;

  const updateNote = useCallback((id, content) => {
    setNotes(prev => {
      const next = prev.map(n =>
        n.id === id ? { ...n, content, updatedAt: Date.now() } : n
      );
      saveNotes(next);
      return next;
    });
  }, []);

  const createNote = useCallback(() => {
    const now = Date.now();
    const newNote = { id: now, content: '', createdAt: now, updatedAt: now };
    setNotes(prev => {
      const next = [newNote, ...prev];
      saveNotes(next);
      return next;
    });
    setActiveNoteId(now);
  }, []);

  const deleteNote = useCallback((id, e) => {
    e.stopPropagation();
    setNotes(prev => {
      const next = prev.filter(n => n.id !== id);
      saveNotes(next);
      return next;
    });
  }, []);

  const handleBack = useCallback(() => {
    // Remove empty notes on exit
    setNotes(prev => {
      const next = prev.filter(n => n.content.trim().length > 0 || n.id !== activeNoteId);
      saveNotes(next);
      return next;
    });
    setActiveNoteId(null);
  }, [activeNoteId]);

  // Sort newest-updated first
  const sortedNotes = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);

  if (activeNote) {
    return (
      <NoteEditor
        note={activeNote}
        onBack={handleBack}
        onChange={updateNote}
      />
    );
  }

  return (
    <div className="notes-tab">
      <div className="notes-header">
        <span className="notes-title">Notes</span>
        <button className="note-new-btn" onClick={createNote}>+ New</button>
      </div>

      {sortedNotes.length === 0 ? (
        <div className="notes-empty">
          <div className="notes-empty-icon">📝</div>
          <div className="notes-empty-text">No notes yet</div>
          <div className="notes-empty-sub">Tap + New to write something down</div>
        </div>
      ) : (
        <div className="notes-list">
          {sortedNotes.map(note => {
            const preview = note.content.trim().slice(0, 100) || 'Empty note';
            const firstLine = note.content.split('\n')[0].trim() || 'Untitled';
            return (
              <div
                key={note.id}
                className="note-card"
                onClick={() => setActiveNoteId(note.id)}
                role="button"
                tabIndex={0}
              >
                <div className="note-card-body">
                  <div className="note-card-title">{firstLine}</div>
                  <div className="note-card-meta">
                    <span className="note-date">{formatDate(note.updatedAt)}</span>
                    <span className="note-time">{formatTime(note.updatedAt)}</span>
                  </div>
                  {note.content.split('\n')[0].trim() !== note.content.trim() && (
                    <div className="note-preview">{preview}</div>
                  )}
                </div>
                <button
                  className="note-delete-btn"
                  onClick={(e) => deleteNote(note.id, e)}
                  aria-label="Delete note"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
