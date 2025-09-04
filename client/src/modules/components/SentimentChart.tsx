import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'
import { type ScoredRow } from '../../utils/scoring'
import { colorForScore } from '../../utils/colors'
export function SentimentChart({ rows }:{rows:ScoredRow[]}){
  if(!rows?.length) return <div className="card p-4 text-center text-gray-500">No Data</div>
  const buckets=[{label:'≤ -0.8',min:-1,max:-0.8,rep:-0.9},{label:'-0.8 ~ -0.4',min:-0.8,max:-0.4,rep:-0.6},{label:'-0.4 ~ 0.0',min:-0.4,max:0.0,rep:-0.2},{label:'0.0 ~ 0.4',min:0.0,max:0.4,rep:0.2},{label:'0.4 ~ 0.8',min:0.4,max:0.8,rep:0.6},{label:'≥ 0.8',min:0.8,max:1.01,rep:0.9}]
  const data=buckets.map(b=>({label:b.label,count:rows.filter(r=>r.adjusted>b.min && r.adjusted<=b.max).length,color:colorForScore(b.rep).hex}))
  return (<div className="card p-4"><h3 className="text-lg font-semibold mb-2">Distribution</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={data}>
            <defs>
              {/* Using CSS variables so gradients adapt to theme */}
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.95}/>
                <stop offset="55%" stopColor="var(--chart-2)" stopOpacity={0.85}/>
                <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0.95}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)"/><XAxis dataKey="label"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="count" fill="url(#barGrad)" radius={[8,8,0,0]}>{data.map((d,i)=><Cell key={i} fill={d.color}/>)}</Bar></BarChart></ResponsiveContainer></div></div>)
}
