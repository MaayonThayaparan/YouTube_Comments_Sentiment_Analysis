import React from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { type ScoredRow } from '../../utils/scoring'
export function SentimentPie({ rows }:{rows:ScoredRow[]}){
  const data = [
    { name: 'Positive', value: rows.filter(r=>r.adjusted > 0.1).length },
    { name: 'Neutral', value: rows.filter(r=>r.adjusted >= -0.1 && r.adjusted <= 0.1).length },
    { name: 'Negative', value: rows.filter(r=>r.adjusted < -0.1).length },
  ]
  const COLORS = ['#10b981', '#9ca3af', '#ef4444']
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
      <h3 className="text-lg font-semibold mb-2">Sentiment Mix</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart><Pie data={data} dataKey="value" nameKey="name" outerRadius={100} label>{data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}