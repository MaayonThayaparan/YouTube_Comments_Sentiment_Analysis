/**
 * Leaderboard (Authors) — modal drilldowns
 * -----------------------------------------------------------------------------
 * WHAT
 *   Renders three leaderboards derived from the currently filtered dataset:
 *     - Most Liked               → sums likeCount across an author's parents
 *     - Most Positive Replies    → counts this author's replies with base > 0.1
 *     - Most Negative Replies    → counts this author's replies with base < -0.1
 *
 *   Clicking an author opens a modal whose content depends on the column:
 *     - "Most Liked"            → show each parent they authored + ALL replies
 *     - "Most Positive Replies" → show only this author's positive replies,
 *                                 grouped by their parent thread
 *     - "Most Negative Replies" → same as above but negative replies
 *
 * WHY
 *   Makes it easy to pivot from aggregate “leaders” to contextual evidence
 *   (original parent + replies) without leaving the current view.
 *
 * DATA FLOW
 *   props.rows           : ScoredRow[] (parents) with embedded replies (server-enriched)
 *   boards.authoredMap   : author → array of items (parents or replies) used for modal
 *   threadsById          : parentId → { parent, replies } (full thread lookup for modal)
 *
 * UX / ACCESSIBILITY
 *   - Table rows use <button> for keyboard focus and clear affordance.
 *   - Modal locks body scroll (useScrollLock) and closes on ESC.
 *   - Parent in modal is emphasized (font size, soft background) and includes
 *     a per-thread “Show/Hide replies” toggle, matching RepliesModal styling.
 *
 * PERFORMANCE
 *   - All derived structures are memoized (useMemo) to avoid recomputation on
 *     incidental re-renders.
 *   - Author stats are calculated in a single pass over rows and replies.
 *
 * THEMING
 *   - Chips use theme-safe tints (light/dark) and avoid hard borders that clash
 *     with neon/dark variants.
 */

import React, { useMemo, useState, useEffect } from 'react';
import { type ScoredRow } from '../../utils/scoring';
import { compactNumber, colorForScore } from '../../utils/colors';
import { useScrollLock } from './useScrollLock';

/**
 * Chip
 * ----
 * Tiny numeric pill with theme-safe tints for leaderboard totals.
 * (Used in the leaderboard tables’ “Total” column.)
 */
function Chip({ children, variant = 'neutral' as 'neutral' | 'positive' | 'negative' }) {
  const bgByVariant: Record<string, string> = {
    neutral:  '!bg-gray-200 dark:!bg-gray-700',
    positive: '!bg-green-200 dark:!bg-green-800',
    negative: '!bg-red-200 dark:!bg-red-800',
  };
  return (
    <span
      className={[
        'inline-block px-2 py-0.5 rounded-lg text-xs',
        bgByVariant[variant],
        '!text-gray-900 dark:!text-gray-100',
        '!border-0 shadow-none outline-none align-middle',
      ].join(' ')}
    >
      {children}
    </span>
  );
}

/**
 * ScoreChip
 * ---------
 * Compact sentiment chip (number in [-1, 1]) styled like RepliesModal.
 * Shown next to the parent/reply metadata inside the modal.
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

/**
 * Leaderboard
 * -----------
 * Surfaces authors by likes / positive replies / negative replies.
 * Interaction: clicking an author opens a modal whose contents depend on the
 * list the author was clicked from (likes / positive / negative).
 */
export function Leaderboard({ rows }: { rows: ScoredRow[] }) {
  /** Modal open state + which view initiated it (drives how we build groups). */
  type OpenCtx = { open: boolean; author: string; items: any[]; view: 'likes'|'pos'|'neg' };
  const [userOpen, setUserOpen] = useState<OpenCtx>({ open: false, author: '', items: [], view: 'likes' });

  /** Per-parent replies visibility in the modal. */
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  /**
   * Fast lookup for complete threads by parent id.
   * - lets us show ALL replies for "Most Liked" parents
   * - and resolve parent metadata when grouping replies by parent for pos/neg views
   */
  const threadsById = useMemo(() => {
    const m = new Map<string, { parent: any; replies: any[] }>();
    for (const r of rows) m.set(r.id, { parent: r, replies: (r as any).replies || [] });
    return m;
  }, [rows]);

  /**
   * Build author boards + author→items map
   * - stats (author → {likes, posReplies, negReplies})
   * - authoredMap (author → array of items they authored: parents or replies)
   */
  const boards = useMemo(() => {
    const stats = new Map<string, { likes: number; posReplies: number; negReplies: number }>();
    const authoredMap = new Map<string, any[]>();

    for (const r of rows) {
      // Parent authored by r.authorDisplayName contributes to like sums; also store it
      const pa = r.authorDisplayName;
      const p = stats.get(pa) || { likes: 0, posReplies: 0, negReplies: 0 };
      p.likes += r.likeCount || 0;
      stats.set(pa, p);
      if (!authoredMap.has(pa)) authoredMap.set(pa, []);
      authoredMap.get(pa)!.push({ ...r, isParent: true });

      // Each reply contributes to its own author's pos/neg counts and authoredMap
      for (const rp of (r as any).replies || []) {
        const a = rp.authorDisplayName;
        const s = stats.get(a) || { likes: 0, posReplies: 0, negReplies: 0 };
        if (typeof rp.base === 'number') {
          if (rp.base > 0.1) s.posReplies += 1;
          else if (rp.base < -0.1) s.negReplies += 1;
        }
        stats.set(a, s);
        if (!authoredMap.has(a)) authoredMap.set(a, []);
        authoredMap.get(a)!.push({ ...rp, parentId: r.id, isParent: false });
      }
    }

    const arr = Array.from(stats.entries()).map(([author, v]) => ({
      author,
      likes: v.likes,
      posReplies: v.posReplies,
      negReplies: v.negReplies,
    }));

    return {
      mostLiked: [...arr].sort((a, b) => b.likes - a.likes).slice(0, 10),
      mostPositiveReplies: [...arr].sort((a, b) => b.posReplies - a.posReplies).slice(0, 10),
      mostNegativeReplies: [...arr].sort((a, b) => b.negReplies - a.negReplies).slice(0, 10),
      authoredMap,
    };
  }, [rows]);

  /**
   * Table
   * -----
   * Click handler opens modal with the correct view context:
   *  - likes: show each parent authored by this user + ALL replies to those parents
   *  - pos:   show this user's positive replies (grouped by parent)
   *  - neg:   show this user's negative replies (grouped by parent)
   */
  const Table = ({
    data,
    colKey,
    variant,
    view,
  }: {
    data: any[];
    colKey: 'likes' | 'posReplies' | 'negReplies';
    variant: 'neutral' | 'positive' | 'negative';
    view: 'likes' | 'pos' | 'neg';
  }) => (
    <table className="w-full text-sm table-fixed">
      <colgroup>
        <col className="w-2/3" />
        <col className="w-1/3" />
      </colgroup>
      <thead>
        <tr className="text-left">
          <th className="p-2">Author</th>
          <th className="p-2">Total</th>
        </tr>
      </thead>
      <tbody>
        {(data || []).length === 0 ? (
          <tr>
            <td colSpan={2} className="p-3 text-center text-gray-500">No Data</td>
          </tr>
        ) : (
          data.map((r, i) => (
            <tr key={i} className="border-t border-gray-200 dark:border-gray-700">
              <td className="p-2 truncate">
                <button
                  className="underline"
                  title="Show this author's comments & replies"
                  onClick={() => {
                    const items = boards.authoredMap.get(r.author) || [];
                    setExpanded({});
                    setUserOpen({ open: true, author: r.author, items, view });
                  }}
                >
                  {r.author}
                </button>
              </td>
              <td className="p-2">
                <Chip variant={variant}>{compactNumber(r[colKey] || 0)}</Chip>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );

  // Lock body scroll while modal is open, and support ESC to close.
  useScrollLock(userOpen.open);
  useEffect(() => {
    if (!userOpen.open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setUserOpen((s) => ({ ...s, open: false }));
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [userOpen.open]);

  /**
   * Build modal groups based on the initiating view:
   *  - 'likes': include ALL replies for each parent authored by this user
   *  - 'pos'/'neg': only this author's replies matching the polarity, grouped by parent
   */
  const groups = useMemo(() => {
    if (!userOpen.open) return [];

    if (userOpen.view === 'likes') {
      // Parents authored by this person; include ALL replies to those parents.
      const parents = (userOpen.items || []).filter((x: any) => x.isParent);
      return parents.map((p: any) => {
        const thread = threadsById.get(p.id) || { parent: p, replies: [] };
        return { parent: thread.parent, replies: thread.replies };
      });
    }

    // pos/neg views: pick this author's replies with the requested polarity, group by parentId
    const wantPos = userOpen.view === 'pos';
    const myReplies = (userOpen.items || [])
      .filter((x: any) => !x.isParent && typeof x.base === 'number')
      .filter((x: any) => (wantPos ? x.base > 0.1 : x.base < -0.1));

    const byParent = new Map<string, any[]>();
    for (const r of myReplies) {
      if (!r.parentId) continue;
      if (!byParent.has(r.parentId)) byParent.set(r.parentId, []);
      byParent.get(r.parentId)!.push(r);
    }

    const out: { parent: any; replies: any[] }[] = [];
    for (const [pid, replies] of byParent) {
      const thread = threadsById.get(pid);
      if (thread) out.push({ parent: thread.parent, replies });
      else out.push({ parent: { id: pid, textOriginal: '(parent not found)', likeCount: 0, authorDisplayName: '', publishedAt: '' }, replies });
    }
    return out;
  }, [userOpen, threadsById]);

  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold mb-2">Author Leaderboard</h3>

      {/* Three boards side-by-side on md+, stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <div className="min-h font-semibold mb-2 text-gray-500 dark:text-gray-200">Most Liked</div>
          <Table data={boards.mostLiked} colKey="likes" variant="neutral" view="likes" />
        </div>
        <div>
          <div className="min-h font-semibold mb-2 text-green-600 dark:text-green-400">Most Positive Replies</div>
          <Table data={boards.mostPositiveReplies} colKey="posReplies" variant="positive" view="pos" />
        </div>
        <div>
          <div className="min-h font-semibold mb-2 text-red-600 dark:text-red-400">Most Negative Replies</div>
          <Table data={boards.mostNegativeReplies} colKey="negReplies" variant="negative" view="neg" />
        </div>
      </div>

      {/* Author activity modal */}
      {userOpen.open && (
        <div className="fixed inset-0 z-[2147483647] isolate">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setUserOpen({ open: false, author: '', items: [], view: 'likes' })}
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
              <div className="flex items-center justify-between p-4 pb-3">
                <div className="text-lg font-semibold">
                  Activity by {userOpen.author}
                </div>
                <button
                  onClick={() => setUserOpen({ open: false, author: '', items: [], view: 'likes' })}
                  className="rounded-lg px-3 py-1.5 border border-[var(--border)] hover:bg-white/10"
                >
                  Close
                </button>
              </div>

              {/* Grouped by parent; each shows emphasized parent + toggleable replies */}
              <div className="px-4 pb-4 space-y-4 max-h-[70vh] overflow-auto text-sm">
                {groups.length === 0 ? (
                  <div className="text-gray-500">No Data</div>
                ) : (
                  groups.map(({ parent, replies }, idx) => {
                    const pid = parent?.id || String(idx);
                    const isOpen = !!expanded[pid];
                    return (
                      <div key={pid} className="border-b border-[var(--border)] pb-3">
                        {/* Parent meta + score chip (emphasized) */}
                        <div className="flex items-center gap-2 mb-1">
                          <ScoreChip score={parent?.base ?? parent?.adjusted} />
                          <div className="text-gray-500 text-xs">
                            {(parent?.publishedAt || '').slice(0, 10)} • {parent?.likeCount ?? 0} likes • {parent?.authorDisplayName}
                          </div>
                        </div>
                        <div className="whitespace-pre-wrap text-base md:text-lg font-medium bg-white/[0.03] dark:bg-black/20 rounded-xl px-3 py-2">
                          {parent?.textOriginal}
                        </div>

                        {/* Replies toggle */}
                        <div className="mt-2">
                          <button
                            onClick={() => setExpanded((prev) => ({ ...prev, [pid]: !isOpen }))}
                            className="rounded-lg px-3 py-1.5 border text-xs"
                          >
                            {isOpen ? 'Hide replies' : `Show replies (${replies.length})`}
                          </button>
                        </div>

                        {/* Replies list (when open) */}
                        {isOpen && (
                          <div className="mt-2 space-y-2">
                            {replies.length === 0 ? (
                              <div className="text-gray-500 text-xs">No replies</div>
                            ) : (
                              replies.map((r: any) => (
                                <div key={r.id} className="border-t border-[var(--border)] pt-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <ScoreChip score={typeof r.base === 'number' ? r.base : undefined} />
                                    <div className="text-gray-500 text-xs">
                                      {(r.publishedAt || '').slice(0, 10)} • {r.likeCount ?? 0} likes • {r.authorDisplayName}
                                    </div>
                                  </div>
                                  <div className="whitespace-pre-wrap">{r.textOriginal}</div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
