'use client';

import React, { useState, useEffect, memo } from 'react';
import { Clock } from 'lucide-react';

/**
 * PosLiveClock - Komponen Jam Terisolasi Berperforma Tinggi
 * Menjalankan interval 1 detik secara lokal tanpa me-re-render PosPage root.
 */
function PosLiveClockComponent() {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dayStr = now.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      const timeStr = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setTimeStr(`${dayStr} • ${timeStr} WIB`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!timeStr) {
    return (
      <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-stone-50 border border-stone-200/80 text-xs font-semibold text-stone-400 animate-pulse">
        <Clock className="w-3.5 h-3.5 text-stone-300" />
        <span>Memuat jam...</span>
      </div>
    );
  }

  return (
    <div
      className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-stone-50/90 border border-stone-200/80 text-xs font-bold text-stone-700 shadow-2xs select-none"
      title="Waktu Lokal Sistem POS"
    >
      <Clock className="w-3.5 h-3.5 text-orange-500 shrink-0" />
      <span className="tabular-nums tracking-tight">{timeStr}</span>
    </div>
  );
}

export const PosLiveClock = memo(PosLiveClockComponent);
export default PosLiveClock;
