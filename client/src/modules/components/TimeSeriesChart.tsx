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

// Utility: Format YYYY-MM-DD into YY/MM/DD for concise axis labels
function fmtShort(dateStr: string) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${y.slice(2)}/${m}/${d}`
}

export function TimeSeriesChart({ rows }: { rows: ScoredRow[] }) {
  // -------------------------------
  // Data Transformation
  // -------------------------------
  // Using useMemo to avoid recomputation unless `rows` changes.
  // - Groups scores by published date (truncated to YYYY-MM-DD).
  // - Calculates the average sentiment score per day.
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

  // -------------------------------
  // Empty State
  // -------------------------------
  if (!data.length) {
    return (
      <div className="card p-4 text-center text-gray-500">No Data</div>
    )
  }

  // -------------------------------
  // Chart Rendering
  // -------------------------------
  // - Renders a responsive line chart of average sentiment over time.
  // - Applies a vertical gradient stroke for the line to match branding.
  // - Uses consistent tooltip formatting shared with Pie/Bar charts.
  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold mb-2">
        Average Sentiment Over Time
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            {/* Gradient Definition for Modern Look */}
            <defs>
              <linearGradient id="sentGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="var(--chart-1)" />
                <stop offset="50%" stopColor="var(--chart-2)" />
                <stop offset="100%" stopColor="var(--chart-3)" />
              </linearGradient>
            </defs>

            {/* Axes */}
            <XAxis
              dataKey="date"
              tickFormatter={fmtShort}
              tick={{ fill: '#aaa' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[-1, 1]}
              tick={{ fill: '#aaa' }}
              axisLine={false}
              tickLine={false}
            />

            {/* Grid */}
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />

            {/* Tooltip (matches style of Pie/Bar tooltips) */}
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

            {/* Sentiment Line */}
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
