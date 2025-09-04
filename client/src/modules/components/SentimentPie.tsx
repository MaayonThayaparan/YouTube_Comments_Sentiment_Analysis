/**
 * =============================================================================
 * SentimentPie — composition of adjusted sentiment (staff developer notes)
 * =============================================================================
 * WHAT
 *   A solid (non-donut) pie that visualizes the mix of adjusted sentiment
 *   classes across the currently filtered dataset.
 *
 * WHY
 *   • “At a glance” read of audience mood distribution
 *   • Mirrors the thresholds used elsewhere in the app to avoid mismatch
 *
 * VISUAL DECISIONS
 *   • Solid pie (innerRadius=0) to maximize area perception differences
 *   • Per-slice linear gradients (3 stops) for depth without gloss
 *   • Thin light stroke to ensure separation on dark / neon themes
 *   • Tooltip matches dark panel styling used by other charts
 *
 * DATA POLICY
 *   • Thresholds: > +0.1 (Positive), < −0.1 (Negative), else Neutral
 *   • Percentages are derived from the same windowed + filtered rows the rest
 *     of the dashboard uses, so everything remains consistent.
 * =============================================================================
 */

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { type ScoredRow } from '../../utils/scoring';

export function SentimentPie({ rows }: { rows: ScoredRow[] }) {
  // Uniform empty state across dashboard cards
  if (!rows?.length) {
    return <div className="card p-4 text-center text-gray-500">No Data</div>;
  }

  /**
   * Bucket counts by sentiment class.
   * - We compute once per `rows` change via useMemo to avoid re-work.
   * - `total` is guarded (≥1) so downstream divisions are safe.
   */
  const { pos, neu, neg, total } = useMemo(() => {
    const p = rows.filter((r) => r.adjusted > 0.1).length;   // strictly positive
    const n = rows.filter((r) => r.adjusted < -0.1).length;  // strictly negative
    const z = rows.length - p - n;                           // remainder → neutral
    return { pos: p, neu: z, neg: n, total: Math.max(1, rows.length) };
  }, [rows]);

  /**
   * Chart data model consumed by recharts <Pie>.
   * - We attach a gradient id per segment so <Cell> can reference it.
   */
  const data = useMemo(
    () => [
      { name: 'Positive', value: pos, grad: 'piePosLinear' },
      { name: 'Neutral',  value: neu, grad: 'pieNeuLinear' },
      { name: 'Negative', value: neg, grad: 'pieNegLinear' },
    ],
    [pos, neu, neg]
  );

  // Format helper for percentages (single decimal)
  const pct = (n: number) => `${((n / total) * 100).toFixed(1)}%`;

  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold mb-2">Sentiment Mix</h3>

      {/* Fixed-height container so the responsive chart has a stable box */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {/**
             * Gradient definitions
             * --------------------
             * A slight rotation prevents “flat band” visuals; three stops give
             * subtle in-slice contrast that holds on light/dark/neon themes.
             * NOTE: We pair stopOpacity with opaque/8-digit hex to keep colors
             * stable across browsers.
             */}
            <defs>
              {/* Positive (emerald ramp) */}
              <linearGradient id="piePosLinear" x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate(25)">
                <stop offset="0%"   stopColor="#67e9b9ff" stopOpacity={0.98} /> {/* emerald-400 */}
                <stop offset="55%"  stopColor="#10b981"   stopOpacity={0.98} /> {/* emerald-500 */}
                <stop offset="100%" stopColor="#047857"   stopOpacity={0.98} /> {/* emerald-700 */}
              </linearGradient>

              {/* Neutral (amber ramp) */}
              <linearGradient id="pieNeuLinear" x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate(25)">
                <stop offset="0%"   stopColor="#fbbf24"   stopOpacity={0.98} /> {/* amber-400 */}
                <stop offset="55%"  stopColor="#f59e0b"   stopOpacity={0.98} /> {/* amber-500 */}
                <stop offset="100%" stopColor="#b45309"   stopOpacity={0.98} /> {/* amber-700 */}
              </linearGradient>

              {/* Negative (rose ramp) */}
              <linearGradient id="pieNegLinear" x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate(25)">
                <stop offset="0%"   stopColor="#f87171"   stopOpacity={0.98} /> {/* rose-400 */}
                <stop offset="55%"  stopColor="#ef4444"   stopOpacity={0.98} /> {/* rose-500 */}
                <stop offset="100%" stopColor="#b91c1c"   stopOpacity={0.98} /> {/* rose-700 */}
              </linearGradient>
            </defs>

            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              // Solid pie (no innerRadius) emphasizes composition over “hole” UI.
              outerRadius={108}
              innerRadius={0}
              // Thin high-contrast stroke ensures slice separation in all themes.
              stroke="rgba(255,255,255,0.7)"
              strokeWidth={2}
              labelLine={false}
            >
              {/* Each slice references its gradient by id */}
              {data.map((d, i) => (
                <Cell key={i} fill={`url(#${d.grad})`} />
              ))}
            </Pie>

            {/* Dark-toned tooltip to match other charts; shows count + percent */}
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0,0,0,0.85)',
                borderRadius: 8,
                border: 'none',
                padding: '8px 10px',
              }}
              itemStyle={{ color: '#ffffff', fontWeight: 500 }}
              labelStyle={{ color: '#ffffff', fontWeight: 600 }}
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
