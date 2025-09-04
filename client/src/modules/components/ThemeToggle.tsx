/**
 * =============================================================================
 * ThemeToggle — runtime theme mode switcher (staff developer notes)
 * =============================================================================
 * PURPOSE
 *   Allow users to switch the app theme at runtime among:
 *     - 'light' (default palette from :root; no special class)
 *     - 'dark'  (adds `dark` class on <html>; Tailwind dark: variants apply)
 *     - 'neon'  (adds `theme-neon` class on <html>; custom neon tokens apply)
 *     - 'auto'  (mirrors OS preference; applies/removes `dark` based on media)
 *
 * STORAGE & BOOT
 *   • Persist selection to localStorage('theme').
 *   • On mount + whenever `mode` changes, re-apply classes on <html>.
 *   • For 'auto', listen to `(prefers-color-scheme: dark)` and re-apply if the
 *     OS setting changes while the app is open.
 *
 * CLASS STRATEGY
 *   • Light = baseline: **no class** (so Tailwind light styles remain the default)
 *   • Dark  = add 'dark' on <html>
 *   • Neon  = add 'theme-neon' on <html> (and explicitly remove 'dark')
 *
 * NOTES / TRADEOFFS
 *   • We keep the type `Mode` inside the component to avoid polluting exports.
 *   • We clear both 'dark' and 'theme-neon' before applying the new mode to
 *     prevent class accumulation during toggles and HMR.
 *   • The <select> currently exposes Light/Dark/Neon; 'auto' is supported in
 *     logic but intentionally omitted from the UI here (matches prior design).
 *     If you want users to choose 'auto', add `<option value="auto">Auto</option>`.
 * =============================================================================
 */

import React from 'react'

export function ThemeToggle() {
  // Keep the union type local; it documents the state machine clearly.
  type Mode = 'auto' | 'light' | 'dark' | 'neon'

  // Initialize from localStorage; fall back to 'auto' to respect OS by default.
  const [mode, setMode] = React.useState<Mode>(
    () => (localStorage.getItem('theme') as Mode) || 'auto'
  )

  /**
   * applyTheme
   * ----------
   * Centralized side-effect that ensures the <html> element has the correct
   * class list for the selected mode. We always start by removing both classes
   * to avoid drift across toggles/HMR.
   */
  const applyTheme = React.useCallback((m: Mode) => {
    const html = document.documentElement
    html.classList.remove('dark', 'theme-neon')

    if (m === 'auto') {
      // Mirror OS preference: add 'dark' only when the media query matches.
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
      if (prefersDark) html.classList.add('dark')
      return
    }

    if (m === 'dark') html.classList.add('dark')
    if (m === 'neon') html.classList.add('theme-neon')
    // 'light' => no class; base tokens from :root apply.
  }, [])

  /**
   * Persist and (re)apply whenever mode changes.
   * We keep these two side-effects together so the stored value always
   * reflects the effective class state.
   */
  React.useEffect(() => {
    applyTheme(mode)
    localStorage.setItem('theme', mode)
  }, [mode, applyTheme])

  /**
   * Live-update when OS theme changes *and* we're in 'auto' mode.
   * We attach both modern and legacy listeners for broad browser support,
   * and clean up either one that was attached.
   */
  React.useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return

    const handler = () => {
      if (mode === 'auto') applyTheme('auto')
    }

    mq.addEventListener?.('change', handler)
    // @ts-ignore: legacy Safari
    mq.addListener?.(handler)

    return () => {
      mq.removeEventListener?.('change', handler)
      // @ts-ignore: legacy Safari
      mq.removeListener?.(handler)
    }
  }, [mode, applyTheme])

  return (
    <div className="inline-flex items-center gap-2">
      {/* Small label; keep contrast stable across themes */}
      <label className="text-xs opacity-80 text-slate-300 dark:text-slate-300">
        Theme
      </label>

      {/* 
        Selector:
        - Exposes Light/Dark/Neon per current UX.
        - If you want 'Auto' visible, add <option value="auto">Auto</option>.
        - The container styles read from our tokenized card theme.
      */}
      <select
        className="rounded-lg px-2 py-1 bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700"
        value={mode}
        onChange={(e) => setMode(e.target.value as Mode)}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="neon">Neon</option>
        {/* <option value="auto">Auto</option> */}
      </select>
    </div>
  )
}
