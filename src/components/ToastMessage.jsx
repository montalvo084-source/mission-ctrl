import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const DISPLAY_MS = 2800;
const EXIT_MS   = 280;

export function ToastMessage({ toast, onDone }) {
  const [phase, setPhase] = useState('entering');

  useEffect(() => {
    if (!toast) return;
    setPhase('entering');
    const holdTimer = setTimeout(() => setPhase('exiting'), DISPLAY_MS);
    const doneTimer = setTimeout(() => onDone?.(), DISPLAY_MS + EXIT_MS);
    return () => {
      clearTimeout(holdTimer);
      clearTimeout(doneTimer);
    };
  }, [toast?.id]);

  if (!toast) return null;

  return createPortal(
    <div className={`toast-banner ${phase}`} style={toast.borderColor ? { borderColor: toast.borderColor } : {}}>
      <span className="toast-icon">{toast.icon}</span>
      <span className="toast-text">{toast.message}</span>
    </div>,
    document.body
  );
}
