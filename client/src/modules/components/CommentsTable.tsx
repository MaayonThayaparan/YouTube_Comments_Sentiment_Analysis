import React from 'react'
import { type ScoredRow } from '../../utils/scoring'
import { colorForScore } from '../../utils/colors'
import { RepliesModal } from './RepliesModal'
import { SentimentChips, type SentimentBucket } from './SentimentChips'

type SortKey =
  | 'adjusted'
  | 'authorDisplayName'
  | 'likeCount'
  | 'totalReplyCount'
  | 'publishedAt'
  | 'authorCountry'
  | 'authorSubscriberCount'
type SortDir = 'asc' | 'desc'

/** Small “meta chip” used in the mobile cards. */
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs
                     bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      {children}
    </span>
  )
}

/** One comment card for mobile layout. */
function MobileCommentCard({
  r,
  onShowReplies,
}: {
  r: ScoredRow
  onShowReplies: () => void
}) {
  const [expanded, setExpanded] = React.useState(false)
  const c = colorForScore(r.adjusted)
  const date = (r.publishedAt || '').slice(0, 10)

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 p-3">
      {/* Top row: Score + Author + Date */}
      <div className="flex items-start justify-between gap-3">
        <span
          className={`inline-block px-2 py-1 rounded-lg border ${c.bg} ${c.text} ${c.border}`}
          title={`Base: ${r.base.toFixed(2)} | Adj: ${r.adjusted.toFixed(2)}`}
        >
          {r.adjusted.toFixed(2)}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{r.authorDisplayName}</div>
          <div className="text-xs text-gray-500">{date}</div>
        </div>
        <button
          type="button"
          onClick={onShowReplies}
          className="rounded-lg px-2 py-1 border text-xs"
        >
          Replies ({r.totalReplyCount})
        </button>
      </div>

      {/* Meta chips */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Chip>{r.authorCountry || '—'}</Chip>
        <Chip>Subs: {r.authorSubscriberCount ?? '—'}</Chip>
        <Chip>Likes: {(r as any).likeCount ?? 0}</Chip>
        <Chip>Replies: {r.totalReplyCount}</Chip>
      </div>

      {/* Text */}
      <div className={`mt-2 text-sm whitespace-pre-wrap ${expanded ? '' : 'line-clamp-3'}`}>
        {r.textOriginal}
      </div>
      {r.textOriginal && r.textOriginal.length > 160 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs text-blue-600 dark:text-blue-400"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  )
}

export function CommentsTable({ rows, loading }: { rows: ScoredRow[]; loading?: boolean }) {
  const [open, setOpen] = React.useState<{ show: boolean; parent: any; replies: any[] }>({
    show: false,
    parent: null,
    replies: [],
  })
  const [page, setPage] = React.useState(1)
  const pageSize = 30

  const [sortKey, setSortKey] = React.useState<SortKey>('adjusted')
  const [sortDir, setSortDir] = React.useState<SortDir>('desc')
  const [fText, setFText] = React.useState('')

  // Local-only sentiment chips
  const [bucket, setBucket] = React.useState<SentimentBucket>('all')

  React.useEffect(() => {
    setPage(1)
  }, [fText, sortKey, sortDir, bucket])

  // Filter by chips + search
  const filtered = rows
    .filter((r) => {
      const s = r.adjusted
      switch (bucket) {
        case 'neg':   return s <= -0.4
        case 'slneg': return s > -0.4 && s <= -0.1
        case 'neu':   return s > -0.1 && s < 0.1
        case 'slpos': return s >= 0.1 && s < 0.4
        case 'pos':   return s >= 0.4
        default:      return true
      }
    })
    .filter((r) => !fText || r.textOriginal.toLowerCase().includes(fText.toLowerCase()))

  // Sort
  const sorted = React.useMemo(() => {
    const out = [...filtered]
    out.sort((a, b) => {
      const va = (a as any)[sortKey], vb = (b as any)[sortKey]
      if (va == null && vb == null) return 0
      if (va == null) return sortDir === 'asc' ? -1 : 1
      if (vb == null) return sortDir === 'asc' ? 1 : -1
      if (sortKey === 'authorDisplayName' || sortKey === 'publishedAt' || sortKey === 'authorCountry') {
        return sortDir === 'asc'
          ? String(va).localeCompare(String(vb))
          : String(vb).localeCompare(String(va))
      }
      return sortDir === 'asc' ? va - vb : vb - va
    })
    return out
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const start = (page - 1) * pageSize
  const visible = sorted.slice(start, start + pageSize)

  function header(label: string, key: SortKey) {
    const active = sortKey === key
    const arrow = active ? (sortDir === 'asc' ? '▲' : '▼') : ''
    return (
      <button
        type="button"
        className="font-semibold"
        onClick={() => {
          if (active) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
          else { setSortKey(key); setSortDir('desc') }
        }}
      >
        {label} {arrow}
      </button>
    )
  }

  return (
    <div className="card p-4">
      {/* Header: title + INLINE chips + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
        <h3 className="text-lg font-semibold">
          Comments ({filtered.length}{filtered.length !== rows.length ? ` / ${rows.length}` : ''})
        </h3>

        <div className="flex flex-wrap items-center gap-2 justify-end">
          <SentimentChips value={bucket} onChange={setBucket} variant="inline" className="order-1" />
          <div className="flex items-center gap-2 order-2">
            <input
              placeholder="Search text…"
              value={fText}
              onChange={(e) => setFText(e.target.value)}
              className="rounded-xl px-2 py-1 border bg-gray-50 dark:bg-gray-900 w-[200px] md:w-[260px]"
            />
            <button
              type="button"
              onClick={() => setFText('')}
              className="rounded-lg px-3 py-1.5 border"
            >
              Clear
            </button>
            {loading && <div className="text-sm text-gray-500">Fetching…</div>}
          </div>
        </div>
      </div>

      {/* MOBILE LIST (stacked cards) */}
      <div className="md:hidden space-y-3">
        {visible.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No Data</div>
        ) : (
          visible.map((r) => (
            <MobileCommentCard
              key={r.id}
              r={r}
              onShowReplies={() =>
                setOpen({ show: true, parent: r, replies: (r as any).replies || [] })
              }
            />
          ))
        )}
      </div>

      {/* DESKTOP TABLE (hidden on mobile) */}
      <div className="hidden md:block table-wrap">
        <table className="min-w-full text-sm table-fixed">
          <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900">
            <tr className="text-left">
              <th className="p-2 w-24">{header('Score', 'adjusted')}</th>
              <th className="p-2 w-44">{header('Author', 'authorDisplayName')}</th>
              <th className="p-2 w-24">{header('Country', 'authorCountry')}</th>
              <th className="p-2 w-28">{header('Subs', 'authorSubscriberCount')}</th>
              <th className="p-2 w-24">{header('Likes', 'likeCount')}</th>
              <th className="p-2 w-28">{header('Replies', 'totalReplyCount')}</th>
              <th className="p-2 w-28">{header('Date', 'publishedAt')}</th>
              <th className="p-2 w-[45%]">Text</th>
              <th className="p-2 w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr><td colSpan={9} className="p-4 text-center text-gray-500">No Data</td></tr>
            ) : (
              visible.map((r) => {
                const c = colorForScore(r.adjusted)
                return (
                  <tr key={r.id} className="border-t border-gray-100 dark:border-gray-700 align-top">
                    <td className="p-2">
                      <span
                        className={`inline-block px-2 py-1 rounded-lg border ${c.bg} ${c.text} ${c.border}`}
                        title={`Base: ${r.base.toFixed(2)} | Adj: ${r.adjusted.toFixed(2)}`}
                      >
                        {r.adjusted.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-2">{r.authorDisplayName}</td>
                    <td className="p-2">{r.authorCountry || '—'}</td>
                    <td className="p-2">{r.authorSubscriberCount ?? '—'}</td>
                    <td className="p-2">{r.likeCount}</td>
                    <td className="p-2">{r.totalReplyCount}</td>
                    <td className="p-2" title={r.publishedAt}>
                      {(r.publishedAt || '').slice(0, 10).replace(/^(\d{2})(\d{2})/, '$1/$2')}
                    </td>
                    <td className="p-2 wrap-anywhere">{r.textOriginal}</td>
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() => setOpen({ show: true, parent: r, replies: (r as any).replies || [] })}
                        className="rounded-lg px-2 py-1 border"
                      >
                        Show Replies
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-3">
        <div className="text-xs text-gray-500">
          Page {page} / {totalPages}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg px-3 py-1.5 border disabled:opacity-50"
          >
            Prev Page
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg px-3 py-1.5 border disabled:opacity-50"
          >
            Next Page
          </button>
        </div>
      </div>

      <RepliesModal
        open={open.show}
        onClose={() => setOpen({ show: false, parent: null, replies: [] })}
        parent={open.parent}
        replies={open.replies}
      />
    </div>
  )
}
