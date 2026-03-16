import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

const COLORS = ['#00ff88', '#7b61ff', '#ffd700', '#ff3b30', '#00ccff', '#ff6bff', '#ff8844', '#ffffff'];
const SHAPES = ['50%', '2px', '0%'];

export function Confetti({ onDone }) {
  useEffect(() => {
    const timer = setTimeout(() => onDone?.(), 3500);
    return () => clearTimeout(timer);
  }, [onDone]);

  const pieces = Array.from({ length: 80 }, (_, i) => {
    const color = COLORS[i % COLORS.length];
    const left = Math.random() * 100;
    const rot0 = Math.random() * 360;
    const rot1 = rot0 + 360 + Math.random() * 360;
    const drift = (Math.random() - 0.5) * 80;
    const duration = 2.2 + Math.random() * 1.3;
    const delay = Math.random() * 0.8;
    const size = 6 + Math.random() * 6;
    const shape = SHAPES[i % SHAPES.length];

    return (
      <div
        key={i}
        className="confetti-piece"
        style={{
          left: `${left}vw`,
          top: '-10px',
          width: size,
          height: size,
          background: color,
          borderRadius: shape,
          '--rot0': `${rot0}deg`,
          '--rot1': `${rot1}deg`,
          '--drift': `${drift}px`,
          '--duration': `${duration}s`,
          animationDelay: `${delay}s`,
          boxShadow: `0 0 4px ${color}80`,
        }}
      />
    );
  });

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998, overflow: 'hidden' }}>
      {pieces}
    </div>,
    document.body
  );
}
