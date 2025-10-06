"use client";

import { useEffect, useState } from 'react';
import { POINTS_EVENT, getPoints } from '../utils/points';

export default function ScoreBadge() {
  const [points, setPoints] = useState(0);

  useEffect(() => {
    // Load from storage on mount
    setPoints(getPoints());

    const handleUpdate = (e) => {
      // Update when points change anywhere
      if (e && typeof e.detail === 'number') {
        setPoints(e.detail);
      } else {
        setPoints(getPoints());
      }
    };

    // Listen to custom and storage events
    window.addEventListener(POINTS_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(POINTS_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm select-none"
      style={{
        background:
          'linear-gradient(135deg, rgba(255,200,0,0.18) 0%, rgba(28,176,246,0.18) 100%)',
        border: '1px solid rgba(255,200,0,0.35)'
      }}
      title="Sua pontuação total"
    >
      <span className="text-xl">🏆</span>
      <span className="text-sm font-semibold text-[var(--text-primary)]">Pontos</span>
      <span className="text-base font-bold text-[var(--blue)]">{points}</span>
    </div>
  );
}

