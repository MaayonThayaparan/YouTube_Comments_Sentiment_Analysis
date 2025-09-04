import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { type ScoredRow } from '../../utils/scoring';

/**
 * SentimentPie
 * -----------------------------------------------------------------------------
 * A solid (non-donut) sentiment composition chart with a restrained linear
 * gradient per slice. The gradients mirror the palette used in Distribution:
 *
 *   Positive: emerald ramp   (#34d399 → #10b981 → #047857)
 *   Neutral : amber  ramp    (#fbbf24 → #f59e0b → #b45309)
 *   Negative: rose   ramp    (#f87171 → #ef4444 → #b91c1c)
 *
 * Implementation notes
 * - We generate gradients once and reference them by id in <Cell>.
 * - We avoid radial/light “gloss” effects; the gradient is rotated slightly to
 *   add depth while staying flat and modern.
 * - A subtle stroke provides visual separation between slices on all themes.
 * - Tooltip styling matches the Distribution chart (dark panel + white text).
 */
export function SentimentPie({ rows }: { rows: ScoredRow[] }) {
  // Guard: uniform "No Data" card for empty datasets.
  if (!rows?.length) {
    return <div className="card p-4 text-center text-gray-500">No Data</div>;
  }

  // Aggregate sentiment counts. The thresholding mirrors other dashboard panels.
  const { pos, neu, neg, total } = useMemo(() => {
    const p = rows.filter((r) => r.adjusted > 0.1).length;
    const n = rows.filter((r) => r.adjusted < -0.1).length;
    const z = rows.length - p - n;
    return { pos: p, neu: z, neg: n, total: Math.max(1, rows.length) };
  }, [rows]);

  // Prepare data records the chart consumes.
  const data = useMemo(
    () => [
      { name: 'Positive', value: pos, grad: 'piePosLinear' },
      { name: 'Neutral',  value: neu, grad: 'pieNeuLinear' },
      { name: 'Negative', value: neg, grad: 'pieNegLinear' },
    ],
    [pos, neu, neg]
  );

  const pct = (n: number) => `${((n / total) * 100).toFixed(1)}%`;

  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold mb-2">Sentiment Mix</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {/*
              Linear gradients per slice. A slight rotation prevents a "flat band"
              look while avoiding glossy highlights. The three stops give a soft
              in-slice contrast that reads well on both light/dark themes.
            */}
            <defs>
              {/* Positive (emerald ramp) */}
              <linearGradient id="piePosLinear" x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate(25)">
                <stop offset="0%"   stopColor="#67e9b9ff" stopOpacity={0.98} /> {/* emerald-400 */}
                <stop offset="55%"  stopColor="#10b981" stopOpacity={0.98} /> {/* emerald-500 */}
                <stop offset="100%" stopColor="#047857" stopOpacity={0.98} /> {/* emerald-700 */}
              </linearGradient>

              {/* Neutral (amber ramp) */}
              <linearGradient id="pieNeuLinear" x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate(25)">
                <stop offset="0%"   stopColor="#fbbf24" stopOpacity={0.98} /> {/* amber-400 */}
                <stop offset="55%"  stopColor="#f59e0b" stopOpacity={0.98} /> {/* amber-500 */}
                <stop offset="100%" stopColor="#b45309" stopOpacity={0.98} /> {/* amber-700 */}
              </linearGradient>

              {/* Negative (rose ramp) */}
              <linearGradient id="pieNegLinear" x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate(25)">
                <stop offset="0%"   stopColor="#f87171" stopOpacity={0.98} /> {/* rose-400 */}
                <stop offset="55%"  stopColor="#ef4444" stopOpacity={0.98} /> {/* rose-500 */}
                <stop offset="100%" stopColor="#b91c1c" stopOpacity={0.98} /> {/* rose-700 */}
              </linearGradient>
            </defs>

            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              // Solid pie (no innerRadius); outer radius sized to card height.
              outerRadius={108}
              innerRadius={0}
              // Thin stroke yields crisp separation between slices across themes.
              stroke="rgba(255,255,255,0.7)"
              strokeWidth={2}
              labelLine={false}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={`url(#${d.grad})`} />
              ))}
            </Pie>

            {/* Tooltip is identical in tone to Distribution: dark bg + white text. */}
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
