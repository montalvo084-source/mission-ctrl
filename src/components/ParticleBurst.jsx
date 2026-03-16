import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const COLORS = ['#00ff88', '#7b61ff', '#ffd700', '#00ccff', '#ff6bff', '#ff8844'];

export function ParticleBurst({ x, y, onDone }) {
  const ref = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => onDone?.(), 650);
    return () => clearTimeout(timer);
  }, [onDone]);

  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 360;
    const dist = 40 + Math.random() * 30;
    const rad = (angle * Math.PI) / 180;
    const tx = Math.cos(rad) * dist;
    const ty = Math.sin(rad) * dist;
    const color = COLORS[i % COLORS.length];
    const size = 5 + Math.random() * 5;
    const delay = Math.random() * 80;

    return (
      <div
        key={i}
        className="particle"
        style={{
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          background: color,
          boxShadow: `0 0 6px ${color}`,
          '--tx': `${tx}px`,
          '--ty': `${ty}px`,
          animationDelay: `${delay}ms`,
          animationDuration: '0.55s',
        }}
      />
    );
  });

  return createPortal(
    <div ref={ref} style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 9999 }}>
      {particles}
      {/* Ring */}
      <div
        className="burst-ring"
        style={{
          left: x - 20,
          top: y - 20,
          borderColor: '#00ff88',
          boxShadow: '0 0 8px rgba(0,255,136,0.6)',
        }}
      />
    </div>,
    document.body
  );
}
