import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'

type Row={ adjusted:number }

export function SentimentChart({ rows }:{rows:Row[]}){
  if(!rows?.length) return <div className="card p-4 text-center text-gray-500">No Data</div>
  const buckets=[{label:'≤ -0.8',min:-1,max:-0.8,rep:-0.9},{label:'-0.8 ~ -0.4',min:-0.8,max:-0.4,rep:-0.6},{label:'-0.4 ~ 0.0',min:-0.4,max:0.0,rep:-0.2},{label:'0.0 ~ 0.4',min:0.0,max:0.4,rep:0.2},{label:'0.4 ~ 0.8',min:0.4,max:0.8,rep:0.6},{label:'≥ 0.8',min:0.8,max:1.01,rep:0.9}]
  const data=buckets.map(b=>({label:b.label,count:rows.filter(r=>r.adjusted>b.min && r.adjusted<=b.max).length,color:b.rep>0.4?'#10b981':b.rep>0?'#f59e0b':'#ef4444'}))
  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold mb-2">Distribution</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(99,102,241,0.9)"/>
                <stop offset="50%" stopColor="rgba(236,72,153,0.7)"/>
                <stop offset="100%" stopColor="rgba(16,185,129,0.85)"/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)"/>
            <XAxis dataKey="label" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="url(#barGrad)" radius={[8,8,0,0]}>
              {data.map((d,i)=>(<Cell key={i} stroke={d.color} strokeWidth={1}/>))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
