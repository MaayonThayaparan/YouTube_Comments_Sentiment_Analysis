/**
 * useScrollLock.ts
 * -----------------------------------------------------------------------------
 * WHAT:
 *   - React hook to conditionally lock the document scroll.
 *   - Uses a reference counter to support multiple modals simultaneously.
 *   - Automatically releases the lock when the component unmounts.
 *
 * WHY:
 *   - Prevents scroll bleed when modals, drawers, or overlays are open.
 *   - Handles nested modal cases safely (only unlocks when all locks are gone).
 *   - Works with React Fast Refresh / HMR without leaving document locked.
 *
 * NOTES:
 *   - Directly manipulates `document.documentElement` and `document.body`.
 *   - Removes `overflow` styles instead of hardcoding to restore defaults.
 *   - Centralized lock counter avoids race conditions across multiple hooks.
 */

import { useEffect } from "react";

/** Global reference counter for scroll locks (shared across hook instances). */
let lockCount = 0;

/** Convenience accessors for document root/body. */
const html = () => document.documentElement;
const body = () => document.body;

/**
 * Apply scroll lock globally.
 * - Sets overflow:hidden on both `<html>` and `<body>`.
 * - Only applies on first lock request.
 */
function lock() {
  if (lockCount === 0) {
    html().style.overflow = "hidden";
    body().style.overflow = "hidden";
  }
  lockCount++;
}

/**
 * Release scroll lock globally.
 * - Decrements reference counter.
 * - Removes overflow restrictions once all locks are released.
 */
function unlock() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    html().style.removeProperty("overflow");
    body().style.removeProperty("overflow");
  }
}

/**
 * useScrollLock hook
 * -----------------------------------------------------------------------------
 * Locks scroll when `active` is true, and auto-unlocks when:
 *   - `active` becomes false, or
 *   - the component unmounts.
 *
 * Example:
 *   useScrollLock(isModalOpen)
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    lock();
    return () => unlock(); // cleanup ensures balanced unlock
  }, [active]);
}
