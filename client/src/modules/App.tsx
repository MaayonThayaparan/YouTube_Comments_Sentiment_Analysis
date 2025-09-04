/**
 * App (v9 layout)
 * ---------------
 * WHAT: Top-level composition that emphasizes analytics first:
 *       - Combined AnalyzeBar at top (URL + Model + API key)
 *       - Video meta card
 *       - Compact TimeWindow
 *       - FRONT & CENTER: Metrics + Distribution + Pie + TimeSeries (responsive grid)
 *       - Below: Weights, CommentsTable, TopKeywords, Leaderboard, Export, Summary
 * WHY: Shows more high-signal information on one screen and scales down cleanly on mobile.
 */
import React, { useMemo, useState, useEffect } from 'react'
import { AnalyzeBar } from './components/AnalyzeBar'
import { WeightsPanel } from './components/WeightsPanel'
import { CommentsTable } from './components/CommentsTable'
import { MetricsPanel } from './components/MetricsPanel'
import { SentimentChart } from './components/SentimentChart'
import { SentimentPie } from './components/SentimentPie'
import { SummaryPanel } from './components/SummaryPanel'
import { ExportPanel } from './components/ExportPanel'
import { TimeSeriesChart } from './components/TimeSeriesChart'
import { VideoMetaCard } from './components/VideoMetaCard'
import { TimeWindow } from './components/TimeWindow'
import { TopKeywords } from './components/TopKeywords'
import { Leaderboard } from './components/Leaderboard'
import { EvidenceModal } from './components/EvidenceModal'
import { computeAdjustedScores, type ThreadItem } from '../utils/scoring'

type Weights = { wComment:number; wLikes:number; wReplies:number }

export default function App() {
  const [items, setItems] = useState<ThreadItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [weights, setWeights] = useState<Weights>({ wComment: 1.0, wLikes: 0.7, wReplies: 1.0 })
  const [model, setModel] = useState<string>('vader') // default = VADER
  const [lastModelUsed, setLastModelUsed] = useState<string>('vader')
  const [apiKey, setApiKey] = useState<string>('')
  const [jobId, setJobId] = useState<string>('')
  const [progress, setProgress] = useState<{totalPages:number,fetchedPages:number,totalTexts:number,scoredTexts:number}|null>(null)
  const [lastQuery, setLastQuery] = useState<string>('')
  const [evidence, setEvidence] = useState<{ open:boolean, title:string, items:Array<{author:string,text:string,score?:number}> }>({ open:false, title:'', items:[] })

  const modelDirty = !!items.length && model !== lastModelUsed

  // Window state: re-derived when new data is loaded
  const allDates = useMemo(()=> items.map(i=>(i.publishedAt||'').slice(0,10)).filter(Boolean).sort(), [items])
  const minDate = allDates[0] || '2006-01-01'
  const maxDate = allDates[allDates.length-1] || new Date().toISOString().slice(0,10)
  const [window, setWindow] = useState<{from:string,to:string}>({ from: minDate, to: maxDate })
  useEffect(()=>{ setWindow({ from: minDate, to: maxDate }) }, [minDate, maxDate])

  // Poll progress while loading to animate progress bar
  useEffect(() => {
    if (!loading || !jobId) return
    const t = setInterval(async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5177'
        const r = await fetch(`${API_BASE}/api/progress?jobId=${encodeURIComponent(jobId)}`)
        const p = await r.json()
        setProgress(p)
      } catch {}
    }, 500)
    return () => clearInterval(t)
  }, [loading, jobId])

  async function fetchComments(videoIdOrUrl: string) {
    setLoading(true); setError(null)
    try {
      setLastQuery(videoIdOrUrl)
      const jid = Math.random().toString(36).slice(2)
      setJobId(jid)
      setProgress({ totalPages: 0, fetchedPages: 0, totalTexts: 0, scoredTexts: 0 })
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5177'
      const url = `${API_BASE}/api/comments_scored?videoId=${encodeURIComponent(videoIdOrUrl)}&model=${encodeURIComponent(model)}&jobId=${encodeURIComponent(jid)}`
      const res = await fetch(url, { headers: apiKey ? { 'X-API-Key': apiKey } : undefined })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed")
      setItems(data.items)
      setLastModelUsed(model)
    } catch (e: any) {
      setError(e.message || 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }

  // Derivations
  const scoredAll = useMemo(() => computeAdjustedScores(items, weights), [items, weights])
  const scored = useMemo(() => {
    return scoredAll.filter(r => {
      const d = (r.publishedAt || '').slice(0,10)
      return (!window.from || d >= window.from) && (!window.to || d <= window.to)
    })
  }, [scoredAll, window])

  const progressPct = progress && progress.totalTexts > 0 ? Math.floor((progress.scoredTexts / progress.totalTexts) * 100) : 0

  function openEvidence(type:string){
    let title = 'Evidence'
    let itemsX: Array<{author:string,text:string,score?:number}> = []
    if (type === 'pos') {
      title = 'Positive sample comments'
      itemsX = scored.filter(r=>r.adjusted>0.4).slice(0,20).map(r=>({author:r.authorDisplayName,text:r.textOriginal,score:r.adjusted}))
    } else if (type === 'neg') {
      title = 'Negative sample comments'
      itemsX = scored.filter(r=>r.adjusted<-0.4).slice(0,20).map(r=>({author:r.authorDisplayName,text:r.textOriginal,score:r.adjusted}))
    } else if (type === 'neu') {
      title = 'Neutral sample comments'
      itemsX = scored.filter(r=>Math.abs(r.adjusted)<=0.1).slice(0,20).map(r=>({author:r.authorDisplayName,text:r.textOriginal,score:r.adjusted}))
    } else if (type === 'avg') {
      title = 'Comments near average sentiment'
      const avg = scored.reduce((a,b)=>a+b.adjusted,0)/(scored.length||1)
      itemsX = scored.sort((a,b)=>Math.abs(a.adjusted-avg)-Math.abs(b.adjusted-avg)).slice(0,20).map(r=>({author:r.authorDisplayName,text:r.textOriginal,score:r.adjusted}))
    }
    setEvidence({ open:true, title, items: itemsX })
  }

  const allTexts = useMemo(()=>[...items.map(i=>i.textOriginal), ...items.flatMap(i=>i.replies?.map(r=>r.textOriginal) || [])], [items])

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <header className="rounded-2xl p-6 header-grad text-white shadow flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">YouTube Comment Sentiment</h1>
      </header>

      {/* Combined bar: URL + Model + Key + Analyze */}
      <AnalyzeBar model={model} onModelChange={setModel} apiKey={apiKey} onApiKeyChange={setApiKey} onAnalyze={fetchComments} loading={loading} modelDirty={modelDirty} />

      {/* Video meta card */}
      <VideoMetaCard videoIdOrUrl={lastQuery} />

      {/* When loading, we turn the main analytics area into skeletons and show progress */}
      {loading ? (
        <>
          <div className="card card-ghost h-16"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card card-ghost h-40"></div>
            <div className="card card-ghost h-40"></div>
            <div className="card card-ghost h-40"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card card-ghost h-64"></div>
            <div className="card card-ghost h-64"></div>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded"><div className="h-2 bg-gradient-to-r from-red-500 via-fuchsia-500 to-indigo-600 rounded" style={{ width: `${progressPct}%` }} /></div>
        </>
      ) : (
        <>
          {/* Compact time window above charts */}
          <TimeWindow minDate={minDate} maxDate={maxDate} value={window} onChange={setWindow} />

          {/* FRONT & CENTER analytics grid — responsive */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <MetricsPanel rows={scored as any} onEvidence={openEvidence} />
            <SentimentPie rows={scored as any} />
            <SentimentChart rows={scored as any} />
          </div>
          <div className="grid grid-cols-1 gap-6">
            <TimeSeriesChart rows={scored as any} />
          </div>

          {/* Below analytics: controls + deep data */}
          <WeightsPanel weights={weights} onChange={setWeights} disabled={!items.length} />
          {error && <div className="text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">{error}</div>}
          <CommentsTable rows={scored as any} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopKeywords texts={allTexts} />
            <Leaderboard rows={scored as any} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExportPanel rows={scored as any} />
            <SummaryPanel texts={allTexts} model={model} apiKey={apiKey} />
          </div>
        </>
      )}

      <EvidenceModal open={evidence.open} onClose={()=>setEvidence({...evidence, open:false})} title={evidence.title} items={evidence.items} />
    </div>
  )
}
