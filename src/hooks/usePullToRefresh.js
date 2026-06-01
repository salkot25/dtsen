import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * usePullToRefresh – Hook untuk mendeteksi gestur tarik-ke-bawah (pull-to-refresh)
 * pada perangkat sentuh (mobile). Menggunakan event pointer/touch native
 * agar kompatibel dengan iOS Safari dan Android Chrome.
 *
 * @param {Function} onRefresh  – Fungsi async yang dipanggil saat refresh dipicu
 * @param {Object}   options
 *   @param {number} threshold      – Jarak tarik minimum (px) sebelum refresh dipicu (default: 72)
 *   @param {number} maxPull        – Batas maksimum tarikan yang ditampilkan (default: 120)
 *   @param {string} scrollContainerSelector – Selector elemen scroll utama (default: null → window)
 */
export function usePullToRefresh(onRefresh, {
  threshold = 72,
  maxPull = 120,
} = {}) {
  const [pullDistance, setPullDistance] = useState(0); // 0..maxPull
  const [refreshState, setRefreshState] = useState('idle'); // idle | pulling | ready | refreshing | done

  const startYRef = useRef(null);
  const currentYRef = useRef(0);
  const containerRef = useRef(null); // ref ke elemen scroll utama

  const isAtTop = useCallback(() => {
    const el = containerRef.current;
    if (el) return el.scrollTop <= 0;
    return window.scrollY <= 0;
  }, []);

  const handleTouchStart = useCallback((e) => {
    if (!isAtTop()) return;
    startYRef.current = e.touches[0].clientY;
    setRefreshState('pulling');
  }, [isAtTop]);

  const handleTouchMove = useCallback((e) => {
    if (startYRef.current === null) return;
    if (!isAtTop()) {
      startYRef.current = null;
      setPullDistance(0);
      setRefreshState('idle');
      return;
    }

    const delta = e.touches[0].clientY - startYRef.current;
    if (delta <= 0) {
      setPullDistance(0);
      setRefreshState('pulling');
      return;
    }

    // Resistance effect: jarak terasa semakin berat saat ditarik jauh
    const damped = Math.min(delta * 0.5, maxPull);
    currentYRef.current = damped;
    setPullDistance(damped);
    setRefreshState(damped >= threshold ? 'ready' : 'pulling');

    // Cegah scroll asli hanya saat menarik ke bawah
    if (delta > 8) {
      e.preventDefault();
    }
  }, [isAtTop, threshold, maxPull]);

  const handleTouchEnd = useCallback(async () => {
    if (startYRef.current === null) return;
    startYRef.current = null;

    if (currentYRef.current >= threshold) {
      setRefreshState('refreshing');
      setPullDistance(threshold * 0.75); // hold position while loading

      try {
        await onRefresh();
      } catch (e) {
        console.error('Pull to refresh error:', e);
      }

      setRefreshState('done');
      setTimeout(() => {
        setPullDistance(0);
        setRefreshState('idle');
      }, 600);
    } else {
      setPullDistance(0);
      setRefreshState('idle');
    }

    currentYRef.current = 0;
  }, [threshold, onRefresh]);

  // Pasang event listeners ke containerRef atau window
  useEffect(() => {
    const el = containerRef.current;
    const target = el || window;
    const opts = { passive: false };

    target.addEventListener('touchstart', handleTouchStart, { passive: true });
    target.addEventListener('touchmove', handleTouchMove, opts);
    target.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      target.removeEventListener('touchstart', handleTouchStart);
      target.removeEventListener('touchmove', handleTouchMove);
      target.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    containerRef,
    pullDistance,
    refreshState, // 'idle' | 'pulling' | 'ready' | 'refreshing' | 'done'
    isRefreshing: refreshState === 'refreshing',
    isReady: refreshState === 'ready',
  };
}
