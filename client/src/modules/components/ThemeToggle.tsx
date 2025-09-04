import React from 'react'

/**
 * ThemeToggle
 * - Persists preferred theme in localStorage('theme')
 * - Adds/removes 'dark' class on <html>
 * Rationale: keep styling in Tailwind dark: variants already built in.
 */
export function ThemeToggle(){
  const [mode,setMode]=React.useState<'auto'|'light'|'dark'>(()=> (localStorage.getItem('theme') as any) || 'auto')

  React.useEffect(()=>{
    const html=document.documentElement
    if(mode==='auto'){
      const prefersDark=window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      html.classList.toggle('dark', prefersDark)
    }else{
      html.classList.toggle('dark', mode==='dark')
    }
    localStorage.setItem('theme', mode)
  },[mode])

  return (
    <div className="inline-flex items-center gap-2">
      <label className="text-xs opacity-80">Theme</label>
      <select className="rounded-lg px-2 py-1 bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700"
        value={mode} onChange={e=>setMode(e.target.value as any)}>
        <option value="auto">Auto</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  )
}
