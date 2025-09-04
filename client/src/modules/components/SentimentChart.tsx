import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts'
import { type ScoredRow } from '../../utils/scoring'
import { colorForScore } from '../../utils/colors'

/* ============================================================================
 * Utilities
 *  - shadeHex(): lighten/darken a hex color by +/-percentage.
 *  WHY: SVG <stop> requires real colors (no CSS color-mix). To get a
 *  modern depth effect we generate lighter/darker variants of the base color.
 * ========================================================================== */
function shadeHex(hex: string, percent: number) {
  // Normalize #abc -> #aabbcc
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const num = parseInt(h, 16)

  let r = (num >> 16) & 0xff
  let g = (num >> 8) & 0xff
  let b = num & 0xff

  const amt = Math.round(2.55 * percent) // +/- 0..255

  r = Math.min(255, Math.max(0, r + amt))
  g = Math.min(255, Math.max(0, g + amt))
  b = Math.min(255, Math.max(0, b + amt))

  const out = (r << 16) | (g << 8) | b
  return `#${out.toString(16).padStart(6, '0')}`
}

/* ============================================================================
 * Sentiment distribution (histogram-like). Each bucket gets:
 *   - A representative score (rep) used to pull a base color from colorForScore
 *   - A per-bar SVG gradient derived from that base color
 * ========================================================================== */
export function SentimentChart({ rows }: { rows: ScoredRow[] }) {
  if (!rows?.length) return <div className="card p-4 text-center text-gray-500">No Data</div>

  // Fixed buckets with a representative sentiment ("rep") for color mapping.
  const buckets = [
    { label: '≤ -0.8',    min: -1.0, max: -0.8, rep: -0.9 },
    { label: '-0.8 ~ -0.4', min: -0.8, max: -0.4, rep: -0.6 },
    { label: '-0.4 ~ 0.0',  min: -0.4, max:  0.0, rep: -0.2 },
    { label: '0.0 ~ 0.4',   min:  0.0, max:  0.4, rep:  0.2 },
    { label: '0.4 ~ 0.8',   min:  0.4, max:  0.8, rep:  0.6 },
    { label: '≥ 0.8',       min:  0.8, max:  1.01, rep:  0.9 },
  ]

  // Compute counts + base colors for each bucket.
  const data = buckets.map((b) => {
    const count = rows.filter((r) => r.adjusted > b.min && r.adjusted <= b.max).length
    const base = colorForScore(b.rep).hex // our palette source (already theme-aware)
    return {
      label: b.label,
      count,
      base,
      // Precompute gradient stops for this bar to keep render path simple.
      // Top is lighter for a glossy look, middle = base, bottom slightly darker.
      top: shadeHex(base, 18),
      mid: shadeHex(base, 0),
      bot: shadeHex(base, -12),
    }
  })

  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold mb-2">Distribution</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            {/* ----------------------------------------------------------------
             * Gradients: one per bar (id = grad-<i>).
             * Using vertical (y1=0 → y2=1) with light→base→dark stops.
             * This gives each bar modern depth while preserving bucket color.
             * ---------------------------------------------------------------- */}
            <defs>
              {data.map((d, i) => (
                <linearGradient key={i} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={d.top} stopOpacity={0.98} />
                  <stop offset="55%"  stopColor={d.mid} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={d.bot} stopOpacity={0.98} />
                </linearGradient>
              ))}
            </defs>

            {/* Light grid; uses subtle alpha so it looks good in light/dark */}
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />

            <XAxis dataKey="label" />
            <YAxis allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0,0,0,0.85)', // Dark background for tooltip
                borderRadius: '8px',
                border: 'none',
                padding: '6px 10px'
              }}
              itemStyle={{
                color: '#ffffff', // Force text (count value) to be white
                fontWeight: 500
              }}
              labelStyle={{
                color: '#ffffff', // Ensure label (range like 0.0 ~ 0.4) is also white
                fontWeight: 600
              }}
            />


            {/* IMPORTANT: do not set Bar.fill if Cells provide their own fill */}
            <Bar dataKey="count" radius={[8, 8, 0, 0]} isAnimationActive animationDuration={500}>
              {data.map((_, i) => (
                <Cell key={i} fill={`url(#grad-${i})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
