/**
 * AnalyzeBar
 * ---------------------------------------------------------------------------
 * Top-level control bar for running a new video analysis.
 *
 * Features:
 *  - Paste in a YouTube URL or video ID (with header label "YouTube Video")
 *  - Select which sentiment model to run:
 *      • VADER (local, default)
 *      • Gemini 2.5 Flash
 *      • OpenAI GPT-4o-mini
 *  - Provide an API key when required (Gemini/OpenAI)
 *  - "Analyze" button to trigger upstream analysis
 *
 * Layout notes:
 *  - All controls share a uniform height (48px) for alignment
 *  - Labels appear above inputs for clarity (esp. "YouTube Video")
 *  - Responsive: stacks on mobile, grid on desktop
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

export function AnalyzeBar({
  model,
  onModelChange,
  apiKey,
  onApiKeyChange,
  onAnalyze,
  loading,
  modelDirty,
}: Props) {
  const [value, setValue] = useState('')
  const [showKey, setShowKey] = useState(false)

  // Derived flags
  const requiresKey = model === 'gemini' || model === 'openai-gpt-4o-mini'
  const keyMissing = requiresKey && !apiKey.trim()
  const isVader = model === 'vader'

  /** Handles form submit → runs upstream analysis if valid */
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim() || keyMissing) return
    onAnalyze(value.trim())
  }

  return (
    <form onSubmit={submit} className="card p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
        {/* YouTube video input */}
        <div className="md:col-span-2">
          <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">
            YouTube Video
          </label>
          <input
            placeholder="Paste YouTube URL or video ID…"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-xl px-4 border border-gray-200 dark:border-gray-700 
                       bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 
                       focus:ring-red-500 h-[48px]"
          />
        </div>

        {/* Model selector */}
        <div className="md:col-span-1">
          <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">
            Model{' '}
            {modelDirty && (
              <span
                title="Model changed. Click 'Analyze' to reprocess with new model."
                className="badge ml-1"
              >
                !
              </span>
            )}
          </label>
          <select
            className="w-full rounded-xl px-3 border border-gray-200 dark:border-gray-700 
                       bg-gray-50 dark:bg-gray-900 h-[48px]"
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
          >
            <option value="vader">VADER (default)</option>
            <option value="gemini">Gemini 2.5 Flash</option>
            <option value="openai-gpt-4o-mini">OpenAI GPT-4o-mini</option>
          </select>
        </div>

        {/* API key input */}
        <div className="md:col-span-2">
          <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">
            API Key{' '}
            {isVader ? (
              <span className="text-xs text-gray-400">(not required)</span>
            ) : requiresKey ? (
              <span className="text-xs text-red-500">Required</span>
            ) : (
              <span className="text-xs text-gray-500">Optional</span>
            )}
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              placeholder={
                isVader
                  ? 'Not used for VADER'
                  : requiresKey
                  ? 'Enter API key'
                  : 'Enter API key if required'
              }
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              readOnly={isVader}
              className={`w-full rounded-xl pl-10 pr-12 border bg-gray-50 dark:bg-gray-900 h-[48px]
                ${
                  isVader
                    ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
            />
            {/* Eye toggle (only if model ≠ VADER) */}
            {!isVader && (
              <button
                type="button"
                onClick={() => setShowKey((s) => !s)}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500"
                title={showKey ? 'Hide key' : 'Show key'}
              >
                👁️
              </button>
            )}
          </div>
        </div>

        {/* Analyze button */}
        <div className="md:col-span-1">
          <label className="text-sm text-transparent mb-1 block">Placeholder</label>
          <button
            type="submit"
            disabled={loading || keyMissing}
            className="btn btn-primary w-full h-[48px] disabled:opacity-50"
          >
            {loading
              ? 'Analyzing…'
              : keyMissing
              ? 'API Key Required'
              : 'Analyze'}
          </button>
        </div>
      </div>
    </form>
  )
}