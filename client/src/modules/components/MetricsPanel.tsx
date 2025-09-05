/**
 * MetricsPanel
 * ---------------------------------------------------------------------------
 * Displays aggregate sentiment statistics in three rows:
 *   1. Primary avg score card (clickable, evidence-enabled).
 *   2. Positive / Neutral / Negative gradient cards (clickable).
 *   3. Secondary metrics (% positive, avg likes, avg replies).
 *
 * Integration notes:
 * - Provide `onEvidence` callback to hook into EvidenceModal.
 *   e.g. onEvidence={(type) => setEvidence({ open: true, title: type, items: ... })}
 * - Rows are computed from ScoredRow[] using thresholds consistent with charts.
 * - Cards use consistent layout: label top, value center, info icon top-right.
 */

import React from 'react'
import { type ScoredRow } from '../../utils/scoring'

/** Classic circled "i" icon with tooltip/title support. */
function InfoIcon({ title }: { title: string }) {
  return (
    <span
      className="text-gray-700 dark:text-gray-100 cursor-help"
      title={title}
      aria-label={title}
      role="img"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
        <circle cx="12" cy="8" r="1.6" fill="currentColor" stroke="none" />
        <rect x="11.2" y="10" width="1.6" height="8" rx="0.8" fill="currentColor" stroke="none" />
      </svg>
    </span>
  )
}

export function MetricsPanel({
  rows,
  onEvidence,
}: {
  rows: ScoredRow[]
  onEvidence?: (type: 'avg' | 'pos' | 'neu' | 'neg') => void
}) {
  if (!rows?.length) {
    return <div className="card p-4 text-center text-gray-500">No Data</div>
  }

  // -------------------- Aggregates --------------------
  const n = Math.max(rows.length, 1)
  const avg = rows.reduce((a, b) => a + b.adjusted, 0) / n
  const pos = rows.filter((r) => r.adjusted > 0.1).length
  const neg = rows.filter((r) => r.adjusted < -0.1).length
  const neu = n - pos - neg

  const pctPositive = (pos / n) * 100
  const avgLikes = rows.reduce((a, b) => a + ((b as any).likeCount ?? 0), 0) / n
  const avgReplies = rows.reduce((a, b) => a + ((b as any).totalReplyCount ?? 0), 0) / n

  const fmt2 = (x: number) => x.toFixed(2)
  const pct1 = (x: number) => `${x.toFixed(1)}%`

  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold mb-3">Metrics</h3>

      {/* Row 1: Avg Score */}
      <div className="grid grid-cols-1 gap-4 mb-2">
        <PrimaryCard
          label="Avg Score"
          value={fmt2(avg)}
          onClick={() => onEvidence?.('avg')}
          tooltip="Click for sample comments that drive this field"
        />
      </div>

      {/* Row 2: Positive / Neutral / Negative */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
        <ColorCard
          label="Positive"
          value={String(pos)}
          gradient="from-emerald-400 via-emerald-500 to-emerald-700"
          ring="ring-emerald-300/60"
          border="border-emerald-400"
          onClick={() => onEvidence?.('pos')}
          tooltip="Click for sample comments that drive this field"
        />
        <ColorCard
          label="Neutral"
          value={String(neu)}
          gradient="from-amber-300 via-amber-400 to-amber-600"
          ring="ring-amber-300/60"
          border="border-amber-300"
          onClick={() => onEvidence?.('neu')}
          tooltip="Click for sample comments that drive this field"
        />
        <ColorCard
          label="Negative"
          value={String(neg)}
          gradient="from-rose-400 via-rose-500 to-rose-700"
          ring="ring-rose-300/60"
          border="border-rose-400"
          onClick={() => onEvidence?.('neg')}
          tooltip="Click for sample comments that drive this field"
        />
      </div>

      {/* Row 3: Secondary metrics (not clickable) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SecondaryCard label="% Positive" value={pct1(pctPositive)} />
        <SecondaryCard label="Avg Likes / Comment" value={fmt2(avgLikes)} />
        <SecondaryCard label="Avg Replies / Comment" value={fmt2(avgReplies)} />
      </div>
    </div>
  )
}

/* Primary card (Avg Score) */
function PrimaryCard({
  label,
  value,
  onClick,
  tooltip,
}: {
  label: string
  value: string
  onClick?: () => void
  tooltip?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        relative w-full rounded-xl border border-gray-300 bg-gray-100 shadow-sm
        px-4 py-4 transition hover:shadow-lg hover:-translate-y-[1px]
        hover:ring-2 hover:ring-indigo-300/50
      "
      title={tooltip}
    >
      <div className="absolute top-2 right-2">
        <InfoIcon title={tooltip || ''} />
      </div>
      <div className="flex flex-col items-center justify-center text-center text-gray-900 dark:text-gray-900">
        <div className="text-xs font-medium opacity-80">{label}</div>
        <div className="text-3xl font-extrabold leading-tight">{value}</div>
      </div>
    </button>
  )
}

/* Gradient cards (Positive / Neutral / Negative) */
function ColorCard({
  label,
  value,
  gradient,
  border,
  ring,
  onClick,
  tooltip,
}: {
  label: string
  value: string
  gradient: string
  border: string
  ring: string
  onClick?: () => void
  tooltip?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative w-full rounded-xl p-4
        bg-gradient-to-br ${gradient}
        text-white border ${border} shadow
        transition hover:shadow-lg hover:-translate-y-[1px] hover:ring-2 ${ring}
      `}
      title={tooltip}
    >
      <div className="absolute top-2 right-2">
        <InfoIcon title={tooltip || ''} />
      </div>
      <div className="flex flex-col items-center justify-center text-center">
        <div className="text-xs font-semibold opacity-95">{label}</div>
        <div className="text-2xl font-extrabold leading-tight">{value}</div>
      </div>
    </button>
  )
}

/* Secondary neutral cards (non-clickable) */
function SecondaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="
        rounded-xl px-4 py-3 bg-gray-100 border border-gray-300
        text-gray-900 dark:text-gray-900 shadow-sm
        text-center flex flex-col items-center justify-center
      "
    >
      <div className="text-xs font-medium opacity-80">{label}</div>
      <div className="text-xl font-semibold leading-6">{value}</div>
    </div>
  )
}
