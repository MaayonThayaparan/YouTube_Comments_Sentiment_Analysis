/**
 * =============================================================================
 * TimeSeriesChart — average sentiment by publish date
 * =============================================================================
 * PURPOSE
 *   Plot how sentiment moves over time. We aggregate `adjusted` scores by day
 *   (YYYY-MM-DD) and render a single line in the fixed range [-1, 1].
 *
 * KEY DECISIONS
 *   • Use `adjusted` (weights + replies baked in) instead of raw `base`.
 *   • Group by day via string slicing; keeps perf simple and charts legible.
 *   • CSS-var gradient (var(--chart-*)): themes can reskin without code changes.
 * =============================================================================
 */

import React, { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { type ScoredRow } from '../../utils/scoring'

/**
 * fmtShort
 * -------
 * Render compact axis labels (YY/MM/DD) from ISO dates (YYYY-MM-DD).
 * This keeps dense timelines readable without rotating ticks.
 */
function fmtShort(dateStr: string) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${y.slice(2)}/${m}/${d}`
}

export function TimeSeriesChart({ rows }: { rows: ScoredRow[] }) {
  /**
   * Build [{ date, avg }] for the chart.
   * - We memoize so we only recompute if `rows` changes.
   * - Group by day using a Map<date, number[]> for cheap aggregation.
   */
  const data = useMemo(() => {
    if (!rows?.length) return []

    // Accumulator: date -> list of adjusted scores for that day
    const byDay = new Map<string, number[]>()

    for (const r of rows) {
      // Truncate publishedAt to YYYY-MM-DD; fallback guards malformed data
      const d = (r.publishedAt || '').slice(0, 10) || 'unknown'
      if (!byDay.has(d)) byDay.set(d, [])
      byDay.get(d)!.push(r.adjusted) // store adjusted (not base)
    }

    // Project map to a sorted array with averages per day
    return Array.from(byDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0])) // chronological ascending
      .map(([date, vals]) => ({
        date,
        avg: vals.reduce((a, b) => a + b, 0) / vals.length, // arithmetic mean
      }))
  }, [rows])

  // Simple empty state so layout is stable and accessible
  if (!data.length) {
    return <div className="card p-4 text-center text-gray-500">No Data</div>
  }

  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold mb-2">Average Sentiment Over Time</h3>

      {/* The parent sets a fixed height; the chart then fills 100% of it. */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            {/* 
              Gradient used as a stroke for the line.
              We lean on CSS variables (--chart-1..3) so theme switches recolor this automatically.
            */}
            <defs>
              <linearGradient id="sentGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="var(--chart-1)" />
                <stop offset="50%" stopColor="var(--chart-2)" />
                <stop offset="100%" stopColor="var(--chart-3)" />
              </linearGradient>
            </defs>

            {/* X axis: dates as strings; short formatter for density */}
            <XAxis
              dataKey="date"
              tickFormatter={fmtShort}
              tick={{ fill: '#aaa' }}   // neutral tick color (works on light/dark cards)
              axisLine={false}          // cleaner look
              tickLine={false}
            />

            {/* Y axis: fixed sentiment range so users build intuition across videos */}
            <YAxis
              domain={[-1, 1]}
              tick={{ fill: '#aaa' }}
              axisLine={false}
              tickLine={false}
            />

            {/* Light grid to aid reading values without overpowering the line */}
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />

            {/* 
              Tooltip: show (avg) with 2 decimals.
              - `formatter` returns [value, name] tuple for Recharts.
              - Background reads as a dark card overlay; border is subtle.
            */}
            <Tooltip
              formatter={(v: any) => [
                v?.toFixed ? v.toFixed(2) : v,
                'Average Sentiment',
              ]}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{
                backgroundColor: 'rgba(20,20,40,0.9)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
              }}
            />

            {/* The line itself: monotone smoothing, gradient stroke, no point dots for clarity */}
            <Line
              type="monotone"
              dataKey="avg"
              stroke="url(#sentGrad)"
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
