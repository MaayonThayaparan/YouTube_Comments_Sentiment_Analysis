import React from 'react'

type Row = { adjusted:number }

export function MetricsPanel({ rows }:{rows:Row[]}){
  if(!rows?.length) return <div className="card p-6 text-center text-gray-500">No Data</div>
  const n=rows.length
  const avg = rows.reduce((a,b)=>a+b.adjusted,0)/n
  const pos = rows.filter(r=>r.adjusted>0.1).length
  const neg = rows.filter(r=>r.adjusted<-0.1).length
  const neu = n - pos - neg

  return (
    <div className="card p-6 flex flex-col items-center">
      <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Average Score</div>
      <div className="text-5xl font-extrabold">{avg.toFixed(2)}</div>
      <div className="mt-4 grid grid-cols-3 gap-3 w-full">
        <div className="rounded-xl border p-3 text-center bg-green-50 border-green-200">
          <div className="text-xs text-green-700">Positive</div>
          <div className="text-lg font-semibold">{pos}</div>
        </div>
        <div className="rounded-xl border p-3 text-center bg-yellow-50 border-yellow-200">
          <div className="text-xs text-yellow-700">Neutral</div>
          <div className="text-lg font-semibold">{neu}</div>
        </div>
        <div className="rounded-xl border p-3 text-center bg-red-50 border-red-200">
          <div className="text-xs text-red-700">Negative</div>
          <div className="text-lg font-semibold">{neg}</div>
        </div>
      </div>
    </div>
  )
}
