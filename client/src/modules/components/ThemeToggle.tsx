/**
 * ThemeToggle Component
 * ---------------------------------------------------------------------------
 * A small UI control for switching between app-wide themes.
 *
 * Features:
 * - Modes: 'auto' | 'light' | 'dark' | 'neon'
 * - Persists user choice in localStorage('theme')
 * - 'auto' follows OS preference and updates live if system theme changes
 * - Applies/removes CSS classes on <html>:
 *     - (default) light → no class (baseline Tailwind styles)
 *     - dark → adds 'dark'
 *     - neon → adds 'theme-neon' (removes 'dark')
 *
 * Notes for new developers:
 * - This is a self-contained component; just render <ThemeToggle /> anywhere in the UI.
 * - The theme state is stored globally via <html> classes, not React context.
 * - Light is kept as baseline so Tailwind defaults look correct.
 */

import React from 'react'

export function ThemeToggle() {
  type Mode = 'auto' | 'light' | 'dark' | 'neon'
  const [mode, setMode] = React.useState<Mode>(
    () => (localStorage.getItem('theme') as Mode) || 'auto'
  )

  /** Apply the theme by toggling classes on <html> */
  const applyTheme = React.useCallback((m: Mode) => {
    const html = document.documentElement
    html.classList.remove('dark', 'theme-neon')
    if (m === 'auto') {
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
      if (prefersDark) html.classList.add('dark')
      return
    }
    if (m === 'dark') html.classList.add('dark')
    if (m === 'neon') html.classList.add('theme-neon')
  }, [])

  React.useEffect(() => {
    applyTheme(mode)
    localStorage.setItem('theme', mode)
  }, [mode, applyTheme])

  React.useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return
    const handler = () => {
      if (mode === 'auto') applyTheme('auto')
    }
    mq.addEventListener?.('change', handler)
    // Legacy Safari / old browsers
    // @ts-ignore
    mq.addListener?.(handler)
    return () => {
      mq.removeEventListener?.('change', handler)
      // @ts-ignore
      mq.removeListener?.(handler)
    }
  }, [mode, applyTheme])

  return (
    <div className="inline-flex items-center gap-2">
      <label className="text-xs opacity-80 text-slate-300 dark:text-slate-300">Theme</label>
      <select
        className="rounded-lg px-2 py-1 bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700"
        value={mode}
        onChange={(e) => setMode(e.target.value as Mode)}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="neon">Neon</option>
      </select>
    </div>
  )
}
