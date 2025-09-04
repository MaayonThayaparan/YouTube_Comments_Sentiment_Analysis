import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

type Row={ adjusted:number; publishedAt?:string }

function fmtShort(ds:string){ if(!ds) return ''; const [y,m,d]=ds.split('-'); return `${y.slice(2)}/${m}/${d}` }

export function TimeSeriesChart({ rows }:{rows:Row[]}){
  const data = useMemo(()=>{
    if(!rows?.length) return []
    const byDay=new Map<string, number[]>()
    for(const r of rows){
      const d=(r.publishedAt||'').slice(0,10) || 'unknown'
      if(!byDay.has(d)) byDay.set(d,[])
      byDay.get(d)!.push(r.adjusted)
    }
    return Array.from(byDay.entries()).sort((a,b)=>a[0].localeCompare(b[0])).map(([date,vals])=>({date,avg:vals.reduce((a,b)=>a+b,0)/vals.length}))
  },[rows])
  if(!data.length) return <div className="card p-4 text-center text-gray-500">No Data</div>
  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold mb-2">Average Sentiment Over Time</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <defs>
              <linearGradient id="sentGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="rgba(239,68,68,0.95)" />
                <stop offset="50%" stopColor="rgba(245,158,11,0.95)" />
                <stop offset="100%" stopColor="rgba(16,185,129,0.95)" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)"/>
            <XAxis dataKey="date" tickFormatter={fmtShort} />
            <YAxis domain={[-1,1]} />
            <Tooltip labelFormatter={(v)=>v} formatter={(v:any)=>[v.toFixed?v.toFixed(2):v,'avg']} />
            <Line type="monotone" dataKey="avg" dot={false} activeDot={{r:4}} stroke="url(#sentGrad)" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
