import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export function FloatingXP({ x, y, amount, onDone }) {
  useEffect(() => {
    const timer = setTimeout(() => onDone?.(), 1050);
    return () => clearTimeout(timer);
  }, [onDone]);

  return createPortal(
    <div
      className="floating-xp"
      style={{ left: x, top: y }}
    >
      +{amount} XP
    </div>,
    document.body
  );
}
