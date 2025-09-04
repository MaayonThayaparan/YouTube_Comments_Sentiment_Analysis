/**
 * AnalyzeBar (combined input)
 * ---------------------------
 * WHAT: Single compact component that holds the YouTube URL/ID, model selector, and API key field.
 * WHY: Saves vertical space and makes the primary action obvious on mobile.
 * UX:
 *  - If user changes model after data is loaded, we show a "!" badge with tooltip to re-analyze.
 *  - API key is optional and never persisted (just kept in memory in App state).
 */
import React, { useState } from 'react'

type Props = {
  model: string
  onModelChange: (m: string) => void
  apiKey: string
  onApiKeyChange: (k: string) => void
  onAnalyze: (input: string) => void
  loading?: boolean
  modelDirty?: boolean
}

export function AnalyzeBar({ model, onModelChange, apiKey, onApiKeyChange, onAnalyze, loading, modelDirty }: Props){
  const [value, setValue] = useState('')
  const [showKey, setShowKey] = useState(false)

  const submit = (e: React.FormEvent) => { e.preventDefault(); if (!value.trim()) return; onAnalyze(value.trim()) }

  return (
    <form onSubmit={submit} className="card p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {/* URL / ID input */}
        <input placeholder="Paste YouTube URL or video ID…" value={value} onChange={e=>setValue(e.target.value)} className="md:col-span-2 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500" />

        {/* Model select with '!' when dirty */}
        <div className="flex items-end md:col-span-1">
          <div className="w-full">
            <label className="text-sm text-gray-600 dark:text-gray-300">Model {modelDirty && <span title="Model changed. Click 'Analyze' to reprocess with new model." className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-400 text-black font-bold ml-1">!</span>}</label>
            <select className="mt-1 w-full rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900" value={model} onChange={e => onModelChange(e.target.value)}>
              <option value="vader">VADER (default)</option>
              <option value="llama3-free">LLaMA 3 (free)</option>
              <option value="openai-gpt-4o-mini">OpenAI GPT-4o-mini</option>
            </select>
          </div>
        </div>

        {/* API Key (optional) */}
        <div className="md:col-span-1">
          <label className="text-sm text-gray-600 dark:text-gray-300 flex items-center justify-between">API Key (optional)<span className="text-xs text-gray-500">Memory only</span></label>
          <div className="mt-1 flex gap-2">
            <input type={showKey ? 'text' : 'password'} placeholder="Enter API key if required" value={apiKey} onChange={e => onApiKeyChange(e.target.value)} className="flex-1 rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900" />
            <button type="button" onClick={() => setShowKey(s => !s)} className="rounded-xl px-3 py-2 border border-gray-300 dark:border-gray-700">{showKey ? 'Hide' : 'Show'}</button>
          </div>
        </div>

        {/* Primary CTA */}
        <button type="submit" disabled={loading} className="btn btn-primary h-[48px] self-end disabled:opacity-50">{loading?'Analyzing…':'Analyze'}</button>
      </div>
    </form>
  )
}
