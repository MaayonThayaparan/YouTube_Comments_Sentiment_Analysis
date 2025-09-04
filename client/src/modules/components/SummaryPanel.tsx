/**
 * =============================================================================
 * SummaryPanel — trigger server-side summarization and display the result
 * =============================================================================
 * PURPOSE
 *   Provide a compact UI to request an AI-generated summary for the currently
 *   loaded comments. The heavy lifting (model invocation + chunking/merging)
 *   is performed by the server route `/api/summarize`.
 *
 * PROPS (data contract with caller)
 *   • texts : string[]   → the raw comment texts to summarize (already filtered)
 *   • model : string     → sentiment/LLM provider id (e.g., 'vader', 'llama3-free',
 *                          'openai-gpt-4o-mini'); forwarded to the server
 *   • apiKey?: string    → optional per-request key (forwarded as 'X-API-Key')
 *
 * UX / STATES
 *   • "Summarize" button:
 *       - disabled while loading
 *       - disabled when there is no input `texts.length === 0`
 *   • Empty state:
 *       - If no texts → "No Data"
 *       - Otherwise a small instruction until the first run
 *   • Errors:
 *       - Render a short, actionable message in the summary area (no toasts)
 *
 * KEY DECISIONS
 *   • Keep the panel dumb: the server chooses chunking and prompt styles.
 *   • Do not mutate `texts`; only forward as-is so the server is the single
 *     source of truth for summarization behavior.
 *   • Avoid retry/backoff here; let the caller re-click after resolving infra.
 * =============================================================================
 */

import React, { useState } from 'react'

export function SummaryPanel({
  texts,
  model,
  apiKey,
}: {
  texts: string[]
  model: string
  apiKey?: string
}) {
  // UI state: network in-flight + the last returned summary text
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState('')

  /**
   * run
   * ---
   * Fire-and-forget POST to the API. We:
   *  • set a loading guard
   *  • forward model + texts; attach X-API-Key when present
   *  • surface a concise error in the same summary area on failure
   *
   * NOTE: We intentionally keep this function minimal; validation,
   * chunking, and model-specific prompting live on the server.
   */
  async function run() {
    setLoading(true)
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5177'

      // Build headers; keep auth optional (OpenAI/Ollama can be self-hosted/private)
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (apiKey) headers['X-API-Key'] = apiKey

      const res = await fetch(`${API_BASE}/api/summarize`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ texts, model }),
      })

      // Server always returns JSON with either {summary} or {error}
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed')

      setSummary(data.summary || '')
    } catch {
      // Keep the message terse and actionable for non-LLM failures too
      setSummary(
        'Failed to summarize. Ensure Ollama/OpenAI is reachable, or switch models.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-4">
      {/* Header row: title + action */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">AI Sentiment Summary</h3>

        {/* Primary CTA; disabled during in-flight or when there is no input */}
        <button
          onClick={run}
          disabled={loading || !texts.length}
          className="btn btn-primary disabled:opacity-50"
        >
          {loading ? 'Summarizing…' : 'Summarize'}
        </button>
      </div>

      {/* Body: summary text or empty-state guidance */}
      <div className="mt-3 text-sm whitespace-pre-wrap">
        {summary ||
          (!texts.length
            ? 'No Data'
            : 'Click Summarize to generate a short overview of the comments.')}
      </div>
    </div>
  )
}
