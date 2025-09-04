import React from 'react'

/**
 * ThemeToggle
 * - Modes: auto, light, dark, neon (multicolor glass), cosmic (deep-space)
 * - Applies classes on <html>: 'dark', 'theme-neon', 'theme-cosmic'
 * - Persists to localStorage('theme'). Auto listens to OS changes.
 */
export function ThemeToggle(){
  const [mode,setMode]=React.useState<'auto'|'light'|'dark'|'neon'|'cosmic'>(()=> (localStorage.getItem('theme') as any) || 'auto')

  const apply = React.useCallback((m:'auto'|'light'|'dark'|'neon'|'cosmic')=>{
    const html=document.documentElement
    html.classList.remove('dark','theme-neon','theme-cosmic')
    if(m==='auto'){
      const prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches
      if(prefersDark) html.classList.add('dark')
    }else if(m==='dark'){
      html.classList.add('dark')
    }else if(m==='neon'){
      html.classList.add('theme-neon')
    }else if(m==='cosmic'){
      html.classList.add('theme-cosmic')
    }
  },[])

  React.useEffect(()=>{ apply(mode); localStorage.setItem('theme',mode) },[mode,apply])

  React.useEffect(()=>{
    if(mode!=='auto') return
    const mq=window.matchMedia('(prefers-color-scheme: dark)')
    const handler=()=>apply('auto')
    mq.addEventListener ? mq.addEventListener('change',handler) : mq.addListener(handler as any)
    return ()=> mq.removeEventListener ? mq.removeEventListener('change',handler) : mq.removeListener(handler as any)
  },[mode,apply])

  return (
    <div className="inline-flex items-center gap-2">
      <label className="text-xs opacity-80">Theme</label>
      <select
        className="rounded-lg px-2 py-1 border"
        value={mode} onChange={e=>setMode(e.target.value as any)}
      >
        <option value="auto">Auto</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="neon">Neon</option>
        <option value="cosmic">Cosmic</option>
      </select>
    </div>
  )
}
