import React from 'react';
import { ArrowDown, RefreshCw, CheckCircle2 } from 'lucide-react';

/**
 * PullToRefreshIndicator – Indikator visual premium untuk fitur tarik-ke-bawah
 * 
 * @param {string} state     – Status refresh saat ini ('idle' | 'pulling' | 'ready' | 'refreshing' | 'done')
 * @param {number} distance  – Jarak penarikan aktual dalam piksel
 * @param {number} threshold – Batas penarikan untuk memicu refresh (default: 72)
 */
export default function PullToRefreshIndicator({ state, distance, threshold = 72 }) {
  if (state === 'idle') return null;

  const percentage = Math.min((distance / threshold) * 100, 100);
  // Rotasi panah dari 0 sampai 180 derajat sesuai tingkat penarikan
  const rotation = Math.min((distance / threshold) * 180, 180);

  return (
    <div 
      className="w-full flex justify-center items-center overflow-hidden transition-all duration-150 ease-out bg-slate-50 border-b border-slate-200/50 sticky top-0 z-40"
      style={{ 
        height: `${distance}px`,
        opacity: distance > 12 ? 1 : 0
      }}
    >
      <div className="flex items-center gap-2.5 py-2">
        {state === 'pulling' && (
          <div className="flex items-center gap-2 text-slate-500 animate-none">
            <div className="p-1 bg-slate-100 rounded-full border border-slate-200/80">
              <ArrowDown 
                size={14} 
                className="text-blue-600 transition-transform duration-75" 
                style={{ transform: `rotate(${rotation}deg)` }}
              />
            </div>
            <span className="text-[11px] font-bold tracking-tight">
              Tarik untuk memperbarui ({Math.round(percentage)}%)
            </span>
          </div>
        )}

        {state === 'ready' && (
          <div className="flex items-center gap-2 text-emerald-600">
            <div className="p-1 bg-emerald-50 rounded-full border border-emerald-200/80 animate-bounce">
              <ArrowDown 
                size={14} 
                className="text-emerald-600 rotate-180" 
              />
            </div>
            <span className="text-[11px] font-extrabold tracking-tight">
              Lepaskan untuk memperbarui
            </span>
          </div>
        )}

        {state === 'refreshing' && (
          <div className="flex items-center gap-2 text-blue-600">
            <RefreshCw 
              size={14} 
              className="animate-spin text-blue-600" 
            />
            <span className="text-[11px] font-extrabold tracking-tight animate-pulse">
              Memperbarui data dari server...
            </span>
          </div>
        )}

        {state === 'done' && (
          <div className="flex items-center gap-2 text-emerald-600 animate-fade-in">
            <div className="p-0.5 bg-emerald-50 rounded-full border border-emerald-200/80">
              <CheckCircle2 
                size={14} 
                className="text-emerald-500" 
              />
            </div>
            <span className="text-[11px] font-extrabold tracking-tight">
              Data berhasil diperbarui!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
