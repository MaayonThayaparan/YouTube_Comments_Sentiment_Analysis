import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { type ScoredRow } from '../../utils/scoring'
import { colorForScore } from '../../utils/colors'
export function SentimentChart({ rows }:{rows:ScoredRow[]}){
  const buckets=[{label:'≤ -0.8',min:-1,max:-0.8,rep:-0.9},{label:'-0.8 ~ -0.4',min:-0.8,max:-0.4,rep:-0.6},{label:'-0.4 ~ 0.0',min:-0.4,max:0.0,rep:-0.2},{label:'0.0 ~ 0.4',min:0.0,max:0.4,rep:0.2},{label:'0.4 ~ 0.8',min:0.4,max:0.8,rep:0.6},{label:'≥ 0.8',min:0.8,max:1.01,rep:0.9}]
  const data=buckets.map(b=>({label:b.label,count:rows.filter(r=>r.adjusted>b.min && r.adjusted<=b.max).length,color:colorForScore(b.rep).hex}))
  return (<div className="card p-4"><h3 className="text-lg font-semibold mb-2">Distribution</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={data}><XAxis dataKey="label"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="count">{data.map((d,i)=><Cell key={i} fill={d.color}/>)}</Bar></BarChart></ResponsiveContainer></div></div>)
}
