/**
 * TimeSeriesChart
 * -----------------------------------------------------------------------------
 * WHAT:
 *   - Displays average adjusted sentiment scores over time as a line chart.
 *
 * WHY:
 *   - Lets analysts detect sentiment trends (spikes/dips in positivity or
 *     negativity) correlated with publish dates or external events.
 *
 * HOW:
 *   - Groups comment/reply scores by publish date (YYYY-MM-DD).
 *   - Computes average sentiment per day.
 *   - Renders via Recharts with responsive sizing and gradient styling.
 *
 * DESIGN:
 *   - Y-axis domain fixed to [-1, 1] to match sentiment scoring scale.
 *   - Gradient stroke line ensures a modern branded look.
 *   - Tooltip style matches Pie/Bar charts for cross-component consistency.
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

/** Utility: Format YYYY-MM-DD → YY/MM/DD for compact axis labels. */
function fmtShort(dateStr: string) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${y.slice(2)}/${m}/${d}`
}

export function TimeSeriesChart({ rows }: { rows: ScoredRow[] }) {
  // ---------------------------------------------------------------------------
  // Data Transformation
  // ---------------------------------------------------------------------------
  // - Memoized to avoid recomputation unless `rows` changes.
  // - Groups scores by publish date (YYYY-MM-DD).
  // - Calculates average adjusted sentiment per day.
  const data = useMemo(() => {
    if (!rows?.length) return []

    const byDay = new Map<string, number[]>()

    // Aggregate adjusted scores under their respective publish dates
    for (const r of rows) {
      const d = (r.publishedAt || '').slice(0, 10) || 'unknown'
      if (!byDay.has(d)) byDay.set(d, [])
      byDay.get(d)!.push(r.adjusted)
    }

    // Convert aggregated map into sorted array of {date, avg}
    return Array.from(byDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, vals]) => ({
        date,
        avg: vals.reduce((a, b) => a + b, 0) / vals.length,
      }))
  }, [rows])

  // ---------------------------------------------------------------------------
  // Empty State
  // ---------------------------------------------------------------------------
  // - Ensures the chart doesn’t render when there’s no data.
  // - Provides a neutral “No Data” card to keep layout consistent.
  if (!data.length) {
    return <div className="card p-4 text-center text-gray-500">No Data</div>
  }

  // ---------------------------------------------------------------------------
  // Chart Rendering
  // ---------------------------------------------------------------------------
  // - ResponsiveContainer ensures the chart adapts to parent width/height.
  // - Gradient line stroke provides a vertical brand-colored transition.
  // - XAxis: uses compact date labels (YY/MM/DD) for clarity.
  // - YAxis: domain fixed to [-1, 1] to match sentiment scoring rules.
  // - CartesianGrid: light, dotted background grid for readability.
  // - Tooltip: styled with dark background, rounded corners, consistent
  //   with other chart components (Pie/Bar).
  // - Line: monotone interpolation for smooth trend; no dots to avoid clutter.
  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold mb-2">Average Sentiment Over Time</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            {/* Gradient definition for modern, smooth sentiment line */}
            <defs>
              <linearGradient id="sentGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="var(--chart-1)" />
                <stop offset="50%" stopColor="var(--chart-2)" />
                <stop offset="100%" stopColor="var(--chart-3)" />
              </linearGradient>
            </defs>

            {/* X-axis: compact date labels, no axis/tick lines */}
            <XAxis
              dataKey="date"
              tickFormatter={fmtShort}
              tick={{ fill: '#aaa' }}
              axisLine={false}
              tickLine={false}
            />

            {/* Y-axis: fixed [-1, 1] sentiment range, no axis/tick lines */}
            <YAxis
              domain={[-1, 1]}
              tick={{ fill: '#aaa' }}
              axisLine={false}
              tickLine={false}
            />

            {/* Grid: light dotted for subtle background context */}
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />

            {/* Tooltip: styled dark card, consistent with Pie/Bar charts */}
            <Tooltip
              formatter={(v: any) => [
                v.toFixed ? v.toFixed(2) : v,
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

            {/* Sentiment trend line: gradient stroke, no dots for clarity */}
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
