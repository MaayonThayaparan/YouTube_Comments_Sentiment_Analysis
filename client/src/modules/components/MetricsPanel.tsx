import React from 'react'
import { type ScoredRow } from '../../utils/scoring'
export function MetricsPanel({ rows, onEvidence }:{rows:ScoredRow[], onEvidence?:(type:string)=>void}){
  const n = rows.length || 1
  const avg = rows.reduce((a,b)=>a+b.adjusted,0)/n
  const pos = rows.filter(r=>r.adjusted > 0.1).length
  const neg = rows.filter(r=>r.adjusted < -0.1).length
  const neu = rows.length - pos - neg
  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold mb-2">Metrics</h3>
      <div className="grid grid-cols-3 gap-3">
        <Card label="Avg Score" value={avg.toFixed(2)} onClick={()=>onEvidence?.('avg')} />
        <Card label="Positive" value={String(pos)} onClick={()=>onEvidence?.('pos')} />
        <Card label="Neutral" value={String(neu)} onClick={()=>onEvidence?.('neu')} />
        <Card label="Negative" value={String(neg)} onClick={()=>onEvidence?.('neg')} />
      </div>
      <div className="text-xs text-gray-500 mt-2">Click any metric to see sample comments that drive it.</div>
    </div>
  )
}
function Card({label, value, onClick}:{label:string, value:string, onClick?:()=>void}){
  return (
    <button onClick={onClick} className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center bg-white/70 dark:bg-gray-800/60 hover:shadow">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </button>
  )
}
