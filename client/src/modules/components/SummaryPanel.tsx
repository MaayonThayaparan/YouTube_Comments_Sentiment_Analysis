import React, { useState } from 'react'
export function SummaryPanel({ texts, model, apiKey }:{ texts:string[], model:string, apiKey?:string }){
  const [loading, setLoading] = useState(false); const [summary, setSummary] = useState('')
  async function run(){
    setLoading(true)
    try{
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5177'
      const res = await fetch(`${API_BASE}/api/summarize`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'X-API-Key': apiKey } : {}) }, body: JSON.stringify({ texts, model }) })
      const data = await res.json(); if (!res.ok) throw new Error(data?.error || 'Failed'); setSummary(data.summary || '')
    }catch{ setSummary('Failed to summarize. Try a different model.') } finally { setLoading(false) }
  }
  return (<div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4"><div className="flex items-center justify-between"><h3 className="text-lg font-semibold">AI Summary</h3><button onClick={run} disabled={loading || !texts.length} className="rounded-xl px-3 py-2 bg-purple-600 text-white disabled:opacity-50">{loading ? 'Summarizing…' : 'Summarize'}</button></div><div className="mt-3 text-sm whitespace-pre-wrap">{summary || 'Click Summarize to generate a short overview.'}</div></div>)
}