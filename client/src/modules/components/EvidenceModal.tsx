/**
 * EvidenceModal — read-only list of exemplar comments (with sentiment chips)
 * -----------------------------------------------------------------------------
 * PURPOSE
 *   Show a simple, scrollable list of (author, text, score) items that back up
 *   a metric (e.g., “near average”, “most positive”, etc.). This mirrors the
 *   visual language used in RepliesModal/Leaderboard (score chip + byline).
 *
 * UX/ACCESSIBILITY
 *   - Locks background scroll while open (useScrollLock) and restores on close.
 *   - Closes on overlay click or Escape key.
 *   - Uses semantic dialog roles/aria-modal for assistive tech.
 *
 * STYLING
 *   - Reads CSS variables (--surface, --text, --border) so themes (light/dark/
 *     neon) stay consistent across the app.
 *   - ScoreChip uses shared colorForScore mapping for consistent sentiment tints.
 *
 * CONTRACT
 *   props.open      Controls visibility.
 *   props.onClose   Required close handler.
 *   props.title     Title text (“Evidence”, “Positive sample comments”, …).
 *   props.items     Array of { author, text, score? } to render.
 */

import React, { useEffect } from 'react';
import { useScrollLock } from './useScrollLock';
import { colorForScore } from '../../utils/colors';

type Item = { author: string; text: string; score?: number };

/**
 * ScoreChip
 * ---------
 * Render a small, theme-friendly sentiment badge. We intentionally keep layout
 * identical to other modals so chips feel consistent everywhere.
 */
function ScoreChip({ score }: { score?: number }) {
  const s = typeof score === 'number' ? score : 0;
  const c = colorForScore(s);
  return (
    <span
      className={`inline-block px-2 py-1 rounded-lg border ${c.bg} ${c.text} ${c.border}`}
      title="Sentiment score"
    >
      {typeof score === 'number' ? score.toFixed(2) : '—'}
    </span>
  );
}

export function EvidenceModal({
  open,
  onClose,
  title,
  items,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  items: Item[];
}) {
  // Lock body scroll while the modal is open; auto-unlock on unmount.
  useScrollLock(open);

  // Close on Escape for quick-dismiss accessibility.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2147483647] isolate" role="dialog" aria-modal="true">
      {/* Overlay: click to close */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 flex min-h-full items-center justify-center p-4">
        <div
          className="
            w-full max-w-3xl rounded-2xl shadow-xl border
            bg-[var(--surface)] text-[var(--text)] border-[var(--border)]
          "
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 pb-3">
            <div className="text-lg font-semibold">{title || 'Evidence'}</div>
            <button
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 border border-[var(--border)] hover:bg-white/10"
            >
              Close
            </button>
          </div>

          {/* Body: list of exemplar items (author/byline + text) */}
          <div className="px-4 pb-4 max-h-[70vh] overflow-auto space-y-3 text-sm">
            {!items?.length ? (
              <div className="text-gray-500">No Data</div>
            ) : (
              items.map((it, idx) => (
                <div key={idx} className="border-b border-[var(--border)] pb-2">
                  {/* Row header: score chip + author (match RepliesModal layout) */}
                  <div className="flex items-center gap-2 mb-1">
                    <ScoreChip score={it.score} />
                    <div className="text-gray-500">{it.author}</div>
                  </div>
                  {/* Comment text */}
                  <div className="whitespace-pre-wrap">{it.text}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
