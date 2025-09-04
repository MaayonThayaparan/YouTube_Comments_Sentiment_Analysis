// src/components/hooks/useScrollLock.ts

/**
 * -----------------------------------------------------------------------------
 * useScrollLock — reference-counted document scroll lock hook
 * -----------------------------------------------------------------------------
 * PURPOSE
 *   Provide a tiny, framework-agnostic way to disable page scrolling while
 *   overlays (modals, sheets, popovers) are open — without components
 *   trampling over each other. Multiple callers can lock at once; the lock
 *   is only released when all callers have unlocked.
 *
 * API
 *   useScrollLock(active: boolean): void
 *     - Call with `true` when your overlay opens, `false` when it closes.
 *     - The hook automatically unlocks on unmount, guarding against leaks.
 *
 * DESIGN DECISIONS
 *   • Reference counting:
 *       A single module-level `lockCount` tracks concurrent locks. This avoids
 *       the common "last one wins" bug when multiple modals toggle `overflow`.
 *   • Simple CSS toggle:
 *       We set `overflow: hidden` on both <html> and <body> for robust scroll
 *       suppression across browsers (some only respect one or the other).
 *   • Minimal surface:
 *       No className toggling, no portals, no layout shifting logic — this
 *       hook is solely concerned with scroll prevention. Visual side-effects
 *       (e.g., dimming, neon film suppression) should be handled in CSS. For
 *       example, elsewhere we optionally add/remove `html.modal-open` to hide
 *       neon film layers while a modal is active.
 *   • HMR & multiple modals:
 *       The counter lives at module scope to share state across all hook
 *       instances. It is resilient to typical mount/unmount churn. (During
 *       hot-reload, the module can be re-evaluated — in practice this still
 *       behaves well because overlays also remount.)
 *
 * CAVEATS / FUTURE IMPROVEMENTS
 *   • iOS momentum/bounce:
 *       For fully bulletproof iOS behavior, consider also preventing touchmove
 *       on the document or using a body scroll lock that preserves scrollbar
 *       gap. We intentionally keep this hook minimal for bundle size and
 *       portability.
 *   • Restoring exact prior styles:
 *       We remove the `overflow` property instead of storing the previous
 *       value. If your app sets a custom overflow on <html>/<body>, you may
 *       want to capture and restore it explicitly.
 * -----------------------------------------------------------------------------
 */

import { useEffect } from 'react'

/** Global ref-count for concurrent locks across all hook instances. */
let lockCount = 0

/** Convenience accessors (kept as functions to delay DOM access until runtime). */
const html = () => document.documentElement
const body = () => document.body

/**
 * Apply scroll lock to <html> and <body>.
 * Idempotent with respect to multiple callers — only the first call
 * applies styles; subsequent calls only increment the counter.
 */
function lock() {
  if (lockCount === 0) {
    html().style.overflow = 'hidden'
    body().style.overflow = 'hidden'
  }
  lockCount++
}

/**
 * Remove scroll lock if and only if this is the last outstanding lock.
 * Defensive against extra unlocks (never dips below 0).
 */
function unlock() {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) {
    html().style.removeProperty('overflow')
    body().style.removeProperty('overflow')
  }
}

/**
 * React hook that acquires the lock when `active` is true and releases it
 * when `active` becomes false or the component unmounts.
 *
 * USAGE
 *   const [open, setOpen] = useState(false)
 *   useScrollLock(open)
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    lock()
    return () => unlock()
  }, [active])
}
