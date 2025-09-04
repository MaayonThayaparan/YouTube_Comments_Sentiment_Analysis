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
import { ThemeToggle } from './components/ThemeToggle'
import { SentimentChips, type SentimentBucket } from './components/SentimentChips'
import { TopWords } from './components/TopWords'
import { Leaderboard } from './components/Leaderboard'
import { EvidenceModal } from './components/EvidenceModal'
import { GlobalFilters, type GlobalFilterState } from './components/GlobalFilters'
import { computeAdjustedScores, type ThreadItem } from '../utils/scoring'

type Weights = { wComment:number; wLikes:number; wReplies:number }

export default function App() {
  const [items, setItems] = useState<ThreadItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [weights, setWeights] = useState<Weights>({ wComment: 1.0, wLikes: 0.7, wReplies: 1.0 })
  const [model, setModel] = useState<string>('vader')
  const [lastModelUsed, setLastModelUsed] = useState<string>('vader')
  const [apiKey, setApiKey] = useState<string>('')
  const [jobId, setJobId] = useState<string>('')
  const [progress, setProgress] = useState<{totalPages:number,fetchedPages:number,totalTexts:number,scoredTexts:number}|null>(null)
  const [lastQuery, setLastQuery] = useState<string>('')
  const [evidence, setEvidence] = useState<{ open:boolean, title:string, items:Array<{author:string,text:string,score?:number}> }>({ open:false, title:'', items:[] })

  const modelDirty = !!items.length && model !== lastModelUsed

  const allDates = useMemo(()=> items.map(i=>(i.publishedAt||'').slice(0,10)).filter(Boolean).sort(), [items])
  const minDate = allDates[0] || '2006-01-01'
  const maxDate = allDates[allDates.length-1] || new Date().toISOString().slice(0,10)
  const [window, setWindow] = useState<{from:string,to:string}>({ from: minDate, to: maxDate })
  useEffect(()=>{ setWindow({ from: minDate, to: maxDate }) }, [minDate, maxDate])

  const [globalFilters, setGlobalFilters] = useState<GlobalFilterState>({country:'',minSubs:'',maxSubs:''})
  const [sentimentBucket, setSentimentBucket] = useState<SentimentBucket>('all')

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

  const scoredAll = useMemo(() => computeAdjustedScores(items, weights), [items, weights])
  const scoredWindowed = useMemo(() => {
    const dateFiltered = scoredAll.filter(r => {
      const d = (r.publishedAt || '').slice(0,10)
      return (!window.from || d >= window.from) && (!window.to || d <= window.to)
    })
    const minS = globalFilters.minSubs ? Number(globalFilters.minSubs) : -Infinity
    const maxS = globalFilters.maxSubs ? Number(globalFilters.maxSubs) : Infinity
    const sentimentFiltered = dateFiltered.filter(r=>{
      const s = r.adjusted
      switch(sentimentBucket){
        case 'neg': if(!(s <= -0.4)) return false; break
        case 'slneg': if(!(s > -0.4 && s <= -0.1)) return false; break
        case 'neu': if(!(s > -0.1 && s < 0.1)) return false; break
        case 'slpos': if(!(s >= 0.1 && s < 0.4)) return false; break
        case 'pos': if(!(s >= 0.4)) return false; break
      }
      return true
    })
    return sentimentFiltered.filter(r=>{
      const passCountry = !globalFilters.country || r.authorCountry === globalFilters.country
      const subs = r.authorSubscriberCount ?? -1
      const passSubs = (subs===-1 && (!globalFilters.minSubs && !globalFilters.maxSubs)) || (subs>=minS && subs<=maxS)
      return passCountry && passSubs
    })
  }, [scoredAll, window, globalFilters])

  const progressPct = progress && progress.totalTexts > 0 ? Math.floor((progress.scoredTexts / progress.totalTexts) * 100) : 0
  const pageMsg = progress?.totalPages ? `page ${Math.min(progress.fetchedPages||0, progress.totalPages)}/${progress.totalPages}` : (progress?.fetchedPages ? `page ${progress.fetchedPages}` : '')

  function openEvidence(type:string){
    let title = 'Evidence'
    let itemsX: Array<{author:string,text:string,score?:number}> = []
    if (type === 'pos') {
      title = 'Positive sample comments'
      itemsX = scoredWindowed.filter(r=>r.adjusted>0.4).slice(0,20).map(r=>({author:r.authorDisplayName,text:r.textOriginal,score:r.adjusted}))
    } else if (type === 'neg') {
      title = 'Negative sample comments'
      itemsX = scoredWindowed.filter(r=>r.adjusted<-0.4).slice(0,20).map(r=>({author:r.authorDisplayName,text:r.textOriginal,score:r.adjusted}))
    } else if (type === 'neu') {
      title = 'Neutral sample comments'
      itemsX = scoredWindowed.filter(r=>Math.abs(r.adjusted)<=0.1).slice(0,20).map(r=>({author:r.authorDisplayName,text:r.textOriginal,score:r.adjusted}))
    } else if (type === 'avg') {
      title = 'Comments near average sentiment'
      const avg = scoredWindowed.reduce((a,b)=>a+b.adjusted,0)/(scoredWindowed.length||1)
      itemsX = scoredWindowed.sort((a,b)=>Math.abs(a.adjusted-avg)-Math.abs(b.adjusted-avg)).slice(0,20).map(r=>({author:r.authorDisplayName,text:r.textOriginal,score:r.adjusted}))
    }
    setEvidence({ open:true, title, items: itemsX })
  }

  const allTexts = useMemo(()=>[...items.map(i=>i.textOriginal), ...items.flatMap(i=>i.replies?.map(r=>r.textOriginal) || [])], [items])
  const countries = useMemo(()=> Array.from(new Set(items.flatMap(i=>[i.authorCountry, ...(i.replies||[]).map(r=>r.authorCountry)]).filter(Boolean) as string[])), [items])

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <header className="rounded-2xl p-6 header-grad text-white shadow flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">YouTube Comment Sentiment</h1>
      <div className="opacity-90"><ThemeToggle/></div>
      </header>

      <AnalyzeBar model={model} onModelChange={setModel} apiKey={apiKey} onApiKeyChange={setApiKey} onAnalyze={fetchComments} loading={loading} modelDirty={!!items.length && model!==lastModelUsed} />
      <VideoMetaCard videoIdOrUrl={lastQuery} />

      {loading ? (
        <>
          <div className="card card-ghost h-16 flex items-center px-4">{pageMsg ? <span className="text-sm text-gray-200">Fetching {pageMsg}…</span> : null}</div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card card-ghost h-40"></div><div className="card card-ghost h-40"></div><div className="card card-ghost h-40"></div>
          </div>
          <div className="grid grid-cols-1 gap-6"><div className="card card-ghost h-64"></div></div>
          <div className="w-full h-2 bg-gray-800/40 rounded"><div className="h-2 bg-gradient-to-r from-red-500 via-fuchsia-500 to-indigo-600 rounded" style={{ width: `${progressPct}%` }} /></div>
        </>
      ) : (
        <>
          <TimeWindow minDate={minDate} maxDate={maxDate} value={window} onChange={setWindow} />
          <SentimentChips value={sentimentBucket} onChange={setSentimentBucket} />
          <GlobalFilters countries={countries} value={globalFilters} onChange={setGlobalFilters} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <MetricsPanel rows={scoredWindowed as any} onEvidence={openEvidence} />
            <SentimentPie rows={scoredWindowed as any} />
            <SentimentChart rows={scoredWindowed as any} />
          </div>
          <div className="grid grid-cols-1 gap-6">
            <TimeSeriesChart rows={scoredWindowed as any} />
          </div>

          <WeightsPanel weights={weights} onChange={setWeights} disabled={!items.length} />
          {error && <div className="text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">{error}</div>}
          <CommentsTable rows={scoredWindowed as any} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopWords rows={scoredWindowed as any} />
            <Leaderboard rows={scoredWindowed as any} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExportPanel rows={scoredWindowed as any} />
            <SummaryPanel texts={allTexts} model={model} apiKey={apiKey} />
          </div>
        </>
      )}

      <EvidenceModal open={evidence.open} onClose={()=>setEvidence({...evidence, open:false})} title={evidence.title} items={evidence.items} />
    </div>
  )
}
