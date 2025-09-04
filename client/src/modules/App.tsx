import React, { useMemo, useState, useEffect } from 'react'
import { URLInput } from './components/URLInput'
import { WeightsPanel } from './components/WeightsPanel'
import { CommentsTable } from './components/CommentsTable'
import { MetricsPanel } from './components/MetricsPanel'
import { SentimentChart } from './components/SentimentChart'
import { SentimentPie } from './components/SentimentPie'
import { SummaryPanel } from './components/SummaryPanel'
import { ModelSelector } from './components/ModelSelector'
import { ExportPanel } from './components/ExportPanel'
import { TimeSeriesChart } from './components/TimeSeriesChart'
import { VideoMetaCard } from './components/VideoMetaCard'
import { computeAdjustedScores, type ThreadItem } from '../utils/scoring'

type Weights = { wComment:number; wLikes:number; wReplies:number }

export default function App() {
  const [items, setItems] = useState<ThreadItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [weights, setWeights] = useState<Weights>({ wComment: 1.0, wLikes: 0.7, wReplies: 1.0 })
  const [model, setModel] = useState<string>('llama3-free')
  const [apiKey, setApiKey] = useState<string>('')
  const [jobId, setJobId] = useState<string>('')
  const [progress, setProgress] = useState<{totalPages:number,fetchedPages:number,totalTexts:number,scoredTexts:number}|null>(null)
  const [lastQuery, setLastQuery] = useState<string>('')

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
    } catch (e: any) {
      setError(e.message || 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }

  const scored = useMemo(() => computeAdjustedScores(items, weights), [items, weights])
  const progressPct = progress && progress.totalTexts > 0 ? Math.floor((progress.scoredTexts / progress.totalTexts) * 100) : 0

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <header className="rounded-2xl p-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">YouTube Comment Sentiment</h1>
      </header>

      <div className="lg:col-span-2 space-y-4">
        <URLInput onSubmit={fetchComments} loading={loading} />
        <ModelSelector model={model} onModelChange={setModel} apiKey={apiKey} onApiKeyChange={setApiKey} />
      </div>

      <VideoMetaCard videoIdOrUrl={lastQuery} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <WeightsPanel weights={weights} onChange={setWeights} disabled={loading || !items.length} />
          {error && <div className="text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">{error}</div>}
          {loading && <div className="text-sm text-gray-500">Fetching… {progress ? `(pages: ${progress.fetchedPages}, scored: ${progress.scoredTexts}/${progress.totalTexts})` : ''}
            <div className="w-full h-2 bg-gray-200 rounded mt-2"><div className="h-2 bg-purple-600 rounded" style={{ width: `${progressPct}%` }} /></div>
          </div>}
          <CommentsTable rows={scored as any} loading={loading} />
          <ExportPanel rows={scored as any} />
        </div>
        <div className="lg:col-span-1 space-y-4">
          <MetricsPanel rows={scored as any} />
          <SentimentChart rows={scored as any} />
          <SentimentPie rows={scored as any} />
          <TimeSeriesChart rows={scored as any} />
          <SummaryPanel texts={[...items.map(i=>i.textOriginal), ...items.flatMap(i=>i.replies?.map(r=>r.textOriginal) || [])]} model={model} apiKey={apiKey} />
        </div>
      </div>
    </div>
  )
}
