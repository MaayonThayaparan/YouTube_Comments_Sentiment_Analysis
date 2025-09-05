/**
 * EvidenceModal
 * ---------------------------------------------------------------------------
 * A reusable modal for showing supporting evidence (sample comments).
 *
 * Features:
 *  - Centered modal with opaque backdrop.
 *  - Locks background scroll when open (via useScrollLock).
 *  - Closes on:
 *      • Backdrop click
 *      • "Close" button
 *      • Escape key
 *  - Displays items in a list with sentiment score chips (consistent with
 *    RepliesModal + Leaderboard).
 *
 * Props:
 *  - open   : boolean flag controlling visibility
 *  - onClose: callback when the modal should close
 *  - title  : string heading for the modal
 *  - items  : array of evidence records (author, text, optional score)
 *
 * Accessibility:
 *  - Uses `role="dialog"` + `aria-modal="true"`
 *  - Overlay is marked `aria-hidden` so only the modal content is announced
 */

import React, { useEffect } from 'react'
import { useScrollLock } from './useScrollLock'
import { colorForScore } from '../../utils/colors'

type Item = { author: string; text: string; score?: number }

/**
 * ScoreChip
 * ---------
 * Visualizes a sentiment score using the shared color scale.
 * Keeps styling consistent with RepliesModal / Leaderboard modal.
 */
function ScoreChip({ score }: { score?: number }) {
  const s = typeof score === 'number' ? score : 0
  const c = colorForScore(s)
  return (
    <span
      className={`inline-block px-2 py-1 rounded-lg border ${c.bg} ${c.text} ${c.border}`}
      title="Sentiment score"
    >
      {typeof score === 'number' ? score.toFixed(2) : '—'}
    </span>
  )
}

export function EvidenceModal({
  open,
  onClose,
  title,
  items,
}: {
  open: boolean
  onClose: () => void
  title: string
  items: Item[]
}) {
  // Lock body scroll while the modal is open; unlock automatically when closed
  useScrollLock(open)

  // Close modal on Escape key
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[2147483647] isolate" role="dialog" aria-modal="true">
      {/* Backdrop overlay (opaque, click-to-close) */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel centered in viewport */}
      <div className="relative z-10 flex min-h-full items-center justify-center p-4">
        <div
          className="
            w-full max-w-3xl rounded-2xl shadow-xl border
            bg-[var(--surface)] text-[var(--text)] border-[var(--border)]
          "
        >
          {/* Header row with title + close button */}
          <div className="flex items-center justify-between p-4 pb-3">
            <div className="text-lg font-semibold">{title || 'Evidence'}</div>
            <button
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 border border-[var(--border)] hover:bg-white/10"
            >
              Close
            </button>
          </div>

          {/* Scrollable body containing evidence items */}
          <div className="px-4 pb-4 max-h-[70vh] overflow-auto space-y-3 text-sm">
            {!items?.length ? (
              <div className="text-gray-500">No Data</div>
            ) : (
              items.map((it, idx) => (
                <div key={idx} className="border-b border-[var(--border)] pb-2">
                  {/* Row header: score chip + author */}
                  <div className="flex items-center gap-2 mb-1">
                    <ScoreChip score={it.score} />
                    <div className="text-gray-500">{it.author}</div>
                  </div>
                  {/* Evidence text */}
                  <div className="whitespace-pre-wrap">{it.text}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}