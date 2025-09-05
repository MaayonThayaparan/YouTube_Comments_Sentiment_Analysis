/**
 * SentimentPie
 * -----------------------------------------------------------------------------
 * A solid (non-donut) pie chart that visualizes the distribution of
 * positive/neutral/negative sentiment across all comments.
 *
 * Features:
 * - Uses carefully tuned linear gradients for each slice:
 *     • Positive → emerald ramp (#34d399 → #10b981 → #047857)
 *     • Neutral  → amber ramp   (#fbbf24 → #f59e0b → #b45309)
 *     • Negative → rose ramp    (#f87171 → #ef4444 → #b91c1c)
 * - Gradients are rotated slightly to avoid “flat band” appearance while
 *   keeping a modern flat aesthetic (no gloss).
 * - A subtle white stroke separates slices for clarity on all themes.
 * - Tooltip shows both raw counts and percentages.
 *
 * Implementation notes:
 * - Thresholding mirrors other panels (> 0.1 = positive, < -0.1 = negative).
 * - Uses Recharts <PieChart> inside <ResponsiveContainer> for responsiveness.
 * - Falls back to a uniform “No Data” card when rows are empty.
 *
 * Usage:
 *   <SentimentPie rows={scoredRows} />
 */

import React, { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { type ScoredRow } from "../../utils/scoring";

export function SentimentPie({ rows }: { rows: ScoredRow[] }) {
  // -------------------------------
  // Empty State
  // -------------------------------
  if (!rows?.length) {
    return <div className="card p-4 text-center text-gray-500">No Data</div>;
  }

  // -------------------------------
  // Aggregate Sentiment Counts
  // -------------------------------
  const { pos, neu, neg, total } = useMemo(() => {
    const p = rows.filter((r) => r.adjusted > 0.1).length;
    const n = rows.filter((r) => r.adjusted < -0.1).length;
    const z = rows.length - p - n;
    return { pos: p, neu: z, neg: n, total: Math.max(1, rows.length) };
  }, [rows]);

  // -------------------------------
  // Chart Data Records
  // -------------------------------
  const data = useMemo(
    () => [
      { name: "Positive", value: pos, grad: "piePosLinear" },
      { name: "Neutral", value: neu, grad: "pieNeuLinear" },
      { name: "Negative", value: neg, grad: "pieNegLinear" },
    ],
    [pos, neu, neg]
  );

  const pct = (n: number) => `${((n / total) * 100).toFixed(1)}%`;

  // -------------------------------
  // Chart Rendering
  // -------------------------------
  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold mb-2">Sentiment Mix</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {/* Gradient Definitions (emerald/amber/rose ramps) */}
            <defs>
              <linearGradient
                id="piePosLinear"
                x1="0"
                y1="0"
                x2="1"
                y2="1"
                gradientTransform="rotate(25)"
              >
                <stop offset="0%" stopColor="#67e9b9ff" stopOpacity={0.98} />{" "}
                {/* emerald-400 */}
                <stop offset="55%" stopColor="#10b981" stopOpacity={0.98} />{" "}
                {/* emerald-500 */}
                <stop offset="100%" stopColor="#047857" stopOpacity={0.98} />{" "}
                {/* emerald-700 */}
              </linearGradient>

              <linearGradient
                id="pieNeuLinear"
                x1="0"
                y1="0"
                x2="1"
                y2="1"
                gradientTransform="rotate(25)"
              >
                <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.98} />{" "}
                {/* amber-400 */}
                <stop offset="55%" stopColor="#f59e0b" stopOpacity={0.98} />{" "}
                {/* amber-500 */}
                <stop offset="100%" stopColor="#b45309" stopOpacity={0.98} />{" "}
                {/* amber-700 */}
              </linearGradient>

              <linearGradient
                id="pieNegLinear"
                x1="0"
                y1="0"
                x2="1"
                y2="1"
                gradientTransform="rotate(25)"
              >
                <stop offset="0%" stopColor="#f87171" stopOpacity={0.98} />{" "}
                {/* rose-400 */}
                <stop offset="55%" stopColor="#ef4444" stopOpacity={0.98} />{" "}
                {/* rose-500 */}
                <stop offset="100%" stopColor="#b91c1c" stopOpacity={0.98} />{" "}
                {/* rose-700 */}
              </linearGradient>
            </defs>

            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius={108}
              innerRadius={0}
              stroke="rgba(255,255,255,0.7)"
              strokeWidth={2}
              labelLine={false}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={`url(#${d.grad})`} />
              ))}
            </Pie>

            {/* Tooltip with counts + percentages */}
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0,0,0,0.85)",
                borderRadius: 8,
                border: "none",
                padding: "8px 10px",
              }}
              itemStyle={{ color: "#ffffff", fontWeight: 500 }}
              labelStyle={{ color: "#ffffff", fontWeight: 600 }}
              formatter={(value: any, name: any) => {
                const count = Number(value) || 0;
                return [`${count} (${pct(count)})`, name];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
