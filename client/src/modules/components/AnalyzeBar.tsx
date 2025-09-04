/**
 * AnalyzeBar
 * -----------------------------------------------------------------------------
 * PURPOSE
 *   Lets the user:
 *     1) Paste a YouTube URL/ID and run analysis
 *     2) Choose the sentiment model (VADER / LLaMA 3 / OpenAI)
 *     3) Optionally supply an API key (only required for OpenAI)
 *
 * UPDATES
 *   - Adds input validation + inline error messaging.
 *   - For LLaMA3 + VADER, the API key field is read-only (not needed).
 *   - For OpenAI, the API key field shows a REQUIRED badge + tooltip and
 *     the Analyze button is disabled until a key is provided.
 *   - All controls are normalized to the same height (h-12).
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
  // Local input and lightweight UI validation state
  const [value, setValue] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Convenience flags derived from selected model
  const needsKey = model === 'openai-gpt-4o-mini'
  const keyReadOnly = !needsKey // VADER / LLaMA3 do not use an API key

  // Simple, client-side submit guardrails
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    // Reset error display on each attempt
    setError(null)

    if (!value.trim()) {
      setError('Please paste a YouTube URL or video ID.')
      return
    }
    if (needsKey && !apiKey.trim()) {
      setError('OpenAI requires an API key.')
      return
    }
    onAnalyze(value.trim())
  }

  return (
    <form onSubmit={submit} className="card p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
        {/* YouTube URL/ID */}
        <div className="md:col-span-2">
          <label className="text-sm text-gray-600 dark:text-gray-300">
            YouTube Video
          </label>
          <input
            placeholder="Paste YouTube URL or video ID…"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-invalid={!!error && /YouTube/.test(error)}
            className="mt-1 h-12 w-full rounded-xl px-4 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        {/* Model selector */}
        <div className="md:col-span-1">
          <label className="text-sm text-gray-600 dark:text-gray-300">
            Model{' '}
            {modelDirty && (
              <span
                title="Model changed. Click 'Analyze' to reprocess with the new model."
                className="badge ml-1"
              >
                !
              </span>
            )}
          </label>
          <select
            className="mt-1 h-12 w-full rounded-xl px-3 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
          >
            <option value="vader">VADER (default)</option>
            <option value="llama3-free">LLaMA 3 (free)</option>
            <option value="openai-gpt-4o-mini">OpenAI GPT-4o-mini</option>
          </select>
        </div>

        {/* API key (read-only for VADER / LLaMA3; required for OpenAI) */}
        <div className="md:col-span-2">
          <label className="text-sm text-gray-600 dark:text-gray-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              API Key
              {needsKey && (
                <span
                  className="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold bg-red-100 text-red-700 border border-red-200"
                  title="OpenAI model requires an API key"
                >
                  Required
                </span>
              )}
            </span>
            <span className="text-xs text-gray-500">Memory only</span>
          </label>

          <div className="mt-1 relative">
            <input
              type={showKey ? 'text' : 'password'}
              placeholder={
                keyReadOnly
                  ? 'Not required for this model'
                  : 'Enter OpenAI API key (sk-...)'
              }
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              readOnly={keyReadOnly}
              aria-readonly={keyReadOnly}
              aria-required={needsKey}
              aria-invalid={!!error && /OpenAI/.test(error)}
              title={keyReadOnly ? 'This model does not require an API key' : 'API key is required for OpenAI'}
              className={[
                'h-12 w-full rounded-xl pl-10 pr-12 border',
                'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900',
                keyReadOnly ? 'opacity-60 cursor-not-allowed select-none' : '',
              ].join(' ')}
            />
            {/* Eye toggle (visibility only, still read-only for non-OpenAI) */}
            <button
              type="button"
              onClick={() => setShowKey((s) => !s)}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500"
              title={showKey ? 'Hide key' : 'Show key'}
              tabIndex={-1}
            >
              👁️
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="md:col-span-1">
          <button
            type="submit"
            // Disabled while loading, when OpenAI requires a key but it's empty,
            // or when URL/ID is blank
            disabled={
              !!loading ||
              (needsKey && !apiKey.trim()) ||
              !value.trim()
            }
            title={
              needsKey && !apiKey.trim()
                ? 'Enter your OpenAI API key to analyze with this model'
                : !value.trim()
                ? 'Paste a YouTube URL or video ID'
                : undefined
            }
            className="btn btn-primary w-full h-12 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? 'Analyzing…' : 'Analyze'}
          </button>
        </div>
      </div>

      {/* Inline error message (subtle, consistent with the rest of the UI) */}
      {error && (
        <div
          className="text-sm mt-1 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}
    </form>
  )
}
