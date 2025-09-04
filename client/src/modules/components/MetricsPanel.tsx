import React from 'react'
import { type ScoredRow } from '../../utils/scoring'
export function MetricsPanel({ rows }:{rows:ScoredRow[]}){
  const n = rows.length || 1
  const avg = rows.reduce((a,b)=>a+b.adjusted,0)/n
  const pos = rows.filter(r=>r.adjusted > 0.1).length
  const neg = rows.filter(r=>r.adjusted < -0.1).length
  const neu = rows.length - pos - neg
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
      <h3 className="text-lg font-semibold mb-2">Metrics</h3>
      <div className="grid grid-cols-3 gap-3">
        <Card label="Avg Score" value={avg.toFixed(2)} />
        <Card label="Positive" value={String(pos)} />
        <Card label="Neutral" value={String(neu)} />
        <Card label="Negative" value={String(neg)} />
      </div>
    </div>
  )
}
function Card({label, value}:{label:string, value:string}){
  return (<div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center"><div className="text-xs text-gray-500">{label}</div><div className="text-xl font-semibold">{value}</div></div>)
}