/**
 * SentimentChart
 * -----------------------------------------------------------------------------
 * A histogram-like distribution chart that groups comments into sentiment
 * buckets and visualizes the counts as bars. Each bar uses a vertical gradient
 * (light → base → dark) derived from its bucket’s representative score.
 *
 * Buckets (fixed ranges):
 *   - ≤ -0.8
 *   - -0.8 ~ -0.4
 *   - -0.4 ~ 0.0
 *   - 0.0 ~ 0.4
 *   - 0.4 ~ 0.8
 *   - ≥ 0.8
 *
 * Implementation notes:
 *   - Colors are sourced from `colorForScore()` to stay consistent with the app’s
 *     sentiment palette. Each bar’s gradient is generated dynamically using
 *     `shadeHex()` to lighten/darken the base.
 *   - Tooltips are styled with a dark background and white text to ensure
 *     consistency with the Pie/Line charts.
 *   - Gridlines are subtle and semi-transparent to look good on both themes.
 *
 * Usage:
 *   <SentimentChart rows={scoredRows} />
 */

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";
import { type ScoredRow } from "../../utils/scoring";
import { colorForScore } from "../../utils/colors";

/**
 * shadeHex()
 * Utility to lighten/darken a hex color by a percentage.
 * WHY: SVG gradients can’t use CSS color-mix, so we manually create
 * lighter/darker variants for depth effects.
 */
function shadeHex(hex: string, percent: number) {
  // Normalize shorthand (#abc → #aabbcc)
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const num = parseInt(h, 16);

  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;

  const amt = Math.round(2.55 * percent);

  r = Math.min(255, Math.max(0, r + amt));
  g = Math.min(255, Math.max(0, g + amt));
  b = Math.min(255, Math.max(0, b + amt));

  const out = (r << 16) | (g << 8) | b;
  return `#${out.toString(16).padStart(6, "0")}`;
}

export function SentimentChart({ rows }: { rows: ScoredRow[] }) {
  if (!rows?.length)
    return <div className="card p-4 text-center text-gray-500">No Data</div>;

  // Fixed sentiment buckets with representative "rep" scores for coloring.
  const buckets = [
    { label: "≤ -0.8", min: -1.0, max: -0.8, rep: -0.9 },
    { label: "-0.8 ~ -0.4", min: -0.8, max: -0.4, rep: -0.6 },
    { label: "-0.4 ~ 0.0", min: -0.4, max: 0.0, rep: -0.2 },
    { label: "0.0 ~ 0.4", min: 0.0, max: 0.4, rep: 0.2 },
    { label: "0.4 ~ 0.8", min: 0.4, max: 0.8, rep: 0.6 },
    { label: "≥ 0.8", min: 0.8, max: 1.01, rep: 0.9 },
  ];

  // Compute counts and per-bucket gradient colors.
  const data = buckets.map((b) => {
    const count = rows.filter((r) => r.adjusted > b.min && r.adjusted <= b.max)
      .length;
    const base = colorForScore(b.rep).hex;
    return {
      label: b.label,
      count,
      base,
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
            {/* Gradient definitions: one per bar */}
            <defs>
              {data.map((d, i) => (
                <linearGradient
                  key={i}
                  id={`grad-${i}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={d.top} stopOpacity={0.98} />
                  <stop offset="55%" stopColor={d.mid} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={d.bot} stopOpacity={0.98} />
                </linearGradient>
              ))}
            </defs>

            {/* Subtle grid that works in light/dark themes */}
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(148,163,184,0.25)"
            />

            <XAxis dataKey="label" />
            <YAxis allowDecimals={false} />

            {/* Dark tooltip with white text for readability */}
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0,0,0,0.85)",
                borderRadius: "8px",
                border: "none",
                padding: "6px 10px",
              }}
              itemStyle={{ color: "#ffffff", fontWeight: 500 }}
              labelStyle={{ color: "#ffffff", fontWeight: 600 }}
            />

            {/* Bar series, each cell filled with its gradient */}
            <Bar
              dataKey="count"
              radius={[8, 8, 0, 0]}
              isAnimationActive
              animationDuration={500}
            >
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
