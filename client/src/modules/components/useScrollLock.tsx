// src/components/hooks/useScrollLock.ts
import { useEffect } from 'react';

/** Reference-counted scroll lock (safe for multiple modals + HMR). */
let lockCount = 0;
const html = () => document.documentElement;
const body = () => document.body;

function lock() {
  if (lockCount === 0) {
    html().style.overflow = 'hidden';
    body().style.overflow = 'hidden';
  }
  lockCount++;
}
function unlock() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    html().style.removeProperty('overflow');
    body().style.removeProperty('overflow');
  }
}

/** Locks scroll when `active` is true; auto-unlocks on unmount. */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    lock();
    return () => unlock();
  }, [active]);
}
