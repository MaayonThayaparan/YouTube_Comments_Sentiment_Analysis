/* ============================================================================
 * SentimentChart
 * ----------------------------------------------------------------------------
 * Staff dev notes:
 * - WHAT: Histogram-style distribution of adjusted sentiment across 6 buckets.
 * - WHY : Quick visual read of polarity spread; pairs with SentimentPie.
 * - HOW : Groups rows into fixed ranges, colors bars via per-bar SVG gradients
 *         built from our sentiment palette (colorForScore).
 *
 * Key decisions:
 * - Fixed buckets (<=-0.8, -0.8~-0.4, -0.4~0.0, 0.0~0.4, 0.4~0.8, >=0.8) so
 *   comparisons remain stable between queries/filters.
 * - Depth via vertical gradients (light→base→dark) to keep bars modern without
 *   relying on CSS color-mix (SVG stops require concrete colors).
 * - Tooltip styling matches other charts (dark panel + white text).
 * ========================================================================== */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts';
import { type ScoredRow } from '../../utils/scoring';
import { colorForScore } from '../../utils/colors';

/* ============================================================================
 * Utilities
 *  - shadeHex(): lighten/darken a hex color by +/-percentage.
 *  WHY: SVG <stop> requires real colors (no CSS color-mix). To get a
 *       modern depth effect we generate lighter/darker variants of the base.
 * ========================================================================== */
function shadeHex(hex: string, percent: number) {
  // Normalize #abc -> #aabbcc
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const num = parseInt(h, 16);

  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;

  const amt = Math.round(2.55 * percent); // +/- 0..255

  r = Math.min(255, Math.max(0, r + amt));
  g = Math.min(255, Math.max(0, g + amt));
  b = Math.min(255, Math.max(0, b + amt));

  const out = (r << 16) | (g << 8) | b;
  return `#${out.toString(16).padStart(6, '0')}`;
}

/* ============================================================================
 * Sentiment distribution (histogram-like). Each bucket gets:
 *   - A representative score (rep) used to pull a base color from colorForScore
 *   - A per-bar SVG gradient derived from that base color
 * ========================================================================== */
export function SentimentChart({ rows }: { rows: ScoredRow[] }) {
  if (!rows?.length) return <div className="card p-4 text-center text-gray-500">No Data</div>;

  // Fixed buckets with a representative sentiment ("rep") for color mapping.
  const buckets = [
    { label: '≤ -0.8',      min: -1.0, max: -0.8, rep: -0.9 },
    { label: '-0.8 ~ -0.4', min: -0.8, max: -0.4, rep: -0.6 },
    { label: '-0.4 ~ 0.0',  min: -0.4, max:  0.0, rep: -0.2 },
    { label: '0.0 ~ 0.4',   min:  0.0, max:  0.4, rep:  0.2 },
    { label: '0.4 ~ 0.8',   min:  0.4, max:  0.8, rep:  0.6 },
    { label: '≥ 0.8',       min:  0.8, max:  1.01, rep:  0.9 },
  ];

  // Compute counts + base colors for each bucket.
  const data = buckets.map((b) => {
    const count = rows.filter((r) => r.adjusted > b.min && r.adjusted <= b.max).length;
    const base = colorForScore(b.rep).hex; // palette source
    return {
      label: b.label,
      count,
      base,
      // Precompute gradient stops for this bar to keep render path simple.
      // Top is lighter for a subtle depth, middle = base, bottom slightly darker.
      top: shadeHex(base, 18),
      mid: shadeHex(base, 0),
      bot: shadeHex(base, -12),
    };
  });

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

            {/* Light grid; subtle alpha looks good in light/dark themes */}
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />

            {/* Axis labels keep defaults; bins are already concise */}
            <XAxis dataKey="label" />
            <YAxis allowDecimals={false} />

            {/* Tooltip matches the dark tone used elsewhere for consistency */}
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0,0,0,0.85)',
                borderRadius: '8px',
                border: 'none',
                padding: '6px 10px',
              }}
              itemStyle={{ color: '#ffffff', fontWeight: 500 }}
              labelStyle={{ color: '#ffffff', fontWeight: 600 }}
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
  );
}
