/**
 * RepliesModal
 * ---------------------------------------------------------------------------
 * A fullscreen modal that displays replies to a selected comment.
 *
 * Key features:
 * - Always foreground: rendered via React Portal directly into <body>.
 * - Centered panel: uses flexbox to pin to screen center.
 * - Backdrop: dark overlay behind the panel; closes on click.
 * - Scroll lock: disables background scroll (via useScrollLock hook).
 * - Escape key: closes modal with Escape.
 * - Replies: each reply shows sentiment chip, metadata, and text.
 *
 * Dev notes:
 * - Using a Portal avoids z-index wars with siblings like TopWords/Leaderboard.
 * - If replies are partial (YouTube didn’t return all), a note shows expected total.
 * - Parent/replies are loosely typed (`any`) — refine to ThreadItem/ReplyItem later.
 */

import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'
import { colorForScore } from '../../utils/colors'
import { useScrollLock } from './useScrollLock'

export function RepliesModal({
  open,
  onClose,
  parent,
  replies,
}: {
  open: boolean
  onClose: () => void
  parent: any
  replies: any[]
}) {
  useScrollLock(open)

  // Escape closes modal
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const loadedCount = replies?.length ?? 0
  const expectedTotal = parent?.replyCount ?? parent?.totalReplyCount

  const modal = (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="
          relative z-[1000000] w-full max-w-3xl rounded-2xl shadow-xl border
          bg-[var(--surface)] text-[var(--text)] border-[var(--border)]
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-3">
          <div className="text-lg font-semibold">
            Replies to {parent?.authorDisplayName}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 border border-[var(--border)] hover:bg-white/10"
          >
            Close
          </button>
        </div>

        {/* Parent comment */}
        <div className="px-4 mb-3">
          <div className="text-[13px] text-gray-500 mb-1">
            {(parent?.publishedAt || '').slice(0, 10)} • {parent?.likeCount ?? 0} likes
          </div>
          <div className="whitespace-pre-wrap text-base md:text-lg font-medium bg-white/[0.03] dark:bg-black/20 rounded-xl px-3 py-2">
            {parent?.textOriginal}
          </div>
        </div>

        {/* Replies list */}
        <div className="px-4 pb-4 max-h-[70vh] overflow-auto space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            {!!expectedTotal && expectedTotal > loadedCount && (
              <span>of {expectedTotal} (fetch more upstream to see all)</span>
            )}
          </div>

          {loadedCount === 0 ? (
            <div className="text-gray-500">No Replies</div>
          ) : (
            replies.map((r) => {
              const c = colorForScore(typeof r.base === 'number' ? r.base : 0)
              return (
                <div key={r.id} className="border-b border-[var(--border)] pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-block px-2 py-1 rounded-lg border ${c.bg} ${c.text} ${c.border}`}
                      title="Reply sentiment"
                    >
                      {typeof r.base === 'number' ? r.base.toFixed(2) : '—'}
                    </span>
                    <div className="text-gray-500 text-xs">
                      {(r.publishedAt || '').slice(0, 10)} • {r.likeCount ?? 0} likes • {r.authorDisplayName}
                    </div>
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{r.textOriginal}</div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )

  // Render into body so it's always foreground
  return ReactDOM.createPortal(modal, document.body)
}