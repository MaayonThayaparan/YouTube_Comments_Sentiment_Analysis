/**
 * RepliesModal
 * -----------------------------------------------------------------------------
 * WHAT
 *   A modal that displays a highlighted parent (top-level) comment and a
 *   scrollable list of its replies. Each reply shows a compact sentiment chip,
 *   metadata (date / likes / author), and the reply text.
 *
 * WHY
 *   Gives reviewers a focused, drill-down view without losing the context of
 *   the original comment. Sentiment chips align with the rest of the app.
 *
 * BEHAVIOR & UX
 *   - Opens when `open` is true; closes on backdrop click or Escape.
 *   - Locks background scroll while open (shared hook is ref-counted).
 *   - Emphasizes the parent comment (larger font, subtle panel).
 *   - If we didn’t fetch all replies upstream, shows a gentle hint.
 *
 * ACCESSIBILITY
 *   - Uses `role="dialog"` and `aria-modal="true"`.
 *   - Escape key to close; backdrop click to close.
 *
 * DATA NOTES
 *   - `parent.totalReplyCount` (or `parent.replyCount`) indicates how many
 *     replies exist in total; we compare that to `replies.length` (loaded).
 *   - Each reply can optionally include a precomputed `base` sentiment score;
 *     if missing, the chip falls back to neutral (0).
 */

import React, { useEffect } from 'react';
import { colorForScore } from '../../utils/colors';
import { useScrollLock } from './useScrollLock';

export function RepliesModal({
  open,
  onClose,
  parent,
  replies,
}: {
  open: boolean;
  onClose: () => void;
  parent: any;          // TODO: replace with a ThreadItem type from utils/scoring
  replies: any[];       // TODO: replace with a ReplyItem[] type from utils/scoring
}) {
  // Lock document scrolling while the modal is open; unlock on unmount or close.
  useScrollLock(open);

  // Close on Escape for keyboard accessibility.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  // How many replies we’ve actually rendered vs. how many exist on the thread.
  const loadedCount = replies?.length ?? 0;
  const expectedTotal = parent?.replyCount ?? parent?.totalReplyCount; // use whichever field is provided

  return (
    <div className="fixed inset-0 z-[2147483647] isolate" role="dialog" aria-modal="true">
      {/* Backdrop (solid, non-blended so it works across all themes) */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centered panel */}
      <div className="relative z-10 flex min-h-full items-center justify-center p-4">
        <div
          className="
            w-full max-w-3xl rounded-2xl shadow-xl border
            bg-[var(--surface)] text-[var(--text)] border-[var(--border)]
          "
        >
          {/* Title + Close */}
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

          {/* Emphasized parent comment */}
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
            {/* Soft hint if upstream didn’t load all replies */}
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              {!!expectedTotal && expectedTotal > loadedCount && (
                <span>Showing {loadedCount} of {expectedTotal} (fetch more upstream to see all)</span>
              )}
            </div>

            {loadedCount === 0 ? (
              <div className="text-gray-500">No Replies</div>
            ) : (
              replies.map((r) => {
                // Color chip reflects reply sentiment (falls back to 0 if missing)
                const c = colorForScore(typeof r.base === 'number' ? r.base : 0);
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
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
