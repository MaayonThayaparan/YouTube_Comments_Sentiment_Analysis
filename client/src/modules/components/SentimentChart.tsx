import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { type ScoredRow } from '../../utils/scoring'
export function SentimentChart({ rows }:{rows:ScoredRow[]}){
  const data = [
    { label: '≤ -0.6', count: rows.filter(r=>r.adjusted <= -0.6).length },
    { label: '-0.6 ~ -0.2', count: rows.filter(r=>r.adjusted > -0.6 && r.adjusted <= -0.2).length },
    { label: '-0.2 ~ 0.2', count: rows.filter(r=>r.adjusted > -0.2 && r.adjusted <= 0.2).length },
    { label: '0.2 ~ 0.6', count: rows.filter(r=>r.adjusted > 0.2 && r.adjusted <= 0.6).length },
    { label: '≥ 0.6', count: rows.filter(r=>r.adjusted > 0.6).length },
  ]
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
      <h3 className="text-lg font-semibold mb-2">Distribution</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}><XAxis dataKey="label" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" /></BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}