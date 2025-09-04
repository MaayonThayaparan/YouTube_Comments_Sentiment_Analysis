
import React from 'react'

/**
 * ThemeToggle (reliable + theme tokens)
 * ---------------------------------------------------------------------------
 * - Modes: 'auto' | 'light' | 'dark' | 'neon'
 * - Applies classes on <html>:
 *     - 'dark'        : activates dark palette and dark backgrounds via CSS
 *     - 'theme-neon'  : activates neon palette and glass cards (removes 'dark')
 *   Light uses no class (base palette defined in :root).
 * - Persists selection in localStorage('theme').
 * - 'auto' mirrors OS preference and live-updates.
 *
 * Why not add a 'theme-light' class?
 * We keep light as the baseline so all Tailwind utilities and default styles
 * look natural. Only 'dark' and 'theme-neon' are additive.
 */
export function ThemeToggle(){
  type Mode = 'auto'|'light'|'dark'|'neon'
  const [mode,setMode] = React.useState<Mode>(() => (localStorage.getItem('theme') as Mode) || 'auto')

  /** Clear all theme classes and apply the chosen one. */
  const applyTheme = React.useCallback((m:Mode) => {
    const html = document.documentElement
    html.classList.remove('dark','theme-neon')
    if (m === 'auto') {
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
      if (prefersDark) html.classList.add('dark')
      return
    }
    if (m === 'dark') html.classList.add('dark')
    if (m === 'neon') html.classList.add('theme-neon')
  }, [])

  React.useEffect(() => { applyTheme(mode); localStorage.setItem('theme', mode) }, [mode, applyTheme])

  React.useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return
    const handler = () => { if (mode === 'auto') applyTheme('auto') }
    mq.addEventListener?.('change', handler)
    // @ts-ignore legacy
    mq.addListener?.(handler)
    return () => {
      mq.removeEventListener?.('change', handler)
      // @ts-ignore legacy
      mq.removeListener?.(handler)
    }
  }, [mode, applyTheme])

  return (
    <div className="inline-flex items-center gap-2">
      <label className="text-xs opacity-80 text-slate-300 dark:text-slate-300">Theme</label>
      <select
        className="rounded-lg px-2 py-1 bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700"
        value={mode} onChange={(e)=> setMode(e.target.value as Mode)}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="neon">Neon</option>
      </select>
    </div>
  )
}
