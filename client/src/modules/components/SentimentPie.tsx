import React from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { type ScoredRow } from '../../utils/scoring'
import { colorForScore } from '../../utils/colors'
export function SentimentPie({ rows }:{rows:ScoredRow[]}){
  if(!rows?.length) return <div className="card p-4 text-center text-gray-500">No Data</div>
  const pos=rows.filter(r=>r.adjusted>0.1).length, neu=rows.filter(r=>r.adjusted>=-0.1 && r.adjusted<=0.1).length, neg=rows.filter(r=>r.adjusted<-0.1).length
  const data=[{name:'Positive',value:pos,color:colorForScore(0.8).hex},{name:'Neutral',value:neu,color:colorForScore(0.0).hex},{name:'Negative',value:neg,color:colorForScore(-0.8).hex}]
  return (<div className="card p-4"><h3 className="text-lg font-semibold mb-2">Sentiment Mix</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" outerRadius={100} label>{data.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div></div>)
}
