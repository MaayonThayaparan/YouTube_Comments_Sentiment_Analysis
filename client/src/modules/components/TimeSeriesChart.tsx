import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { type ScoredRow } from '../../utils/scoring'
export function TimeSeriesChart({ rows }:{rows:ScoredRow[]}){
  const data = useMemo(() => {
    const byDay = new Map<string, number[]>()
    for (const r of rows) { const d = (r.publishedAt || '').slice(0,10) || 'unknown'; if (!byDay.has(d)) byDay.set(d, []); byDay.get(d)!.push(r.adjusted) }
    return Array.from(byDay.entries()).sort((a,b)=>a[0].localeCompare(b[0])).map(([date, vals])=> ({ date, avg: vals.reduce((a,b)=>a+b,0)/vals.length }))
  }, [rows])
  return (<div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4"><h3 className="text-lg font-semibold mb-2">Average Sentiment Over Time</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={data}><XAxis dataKey="date" /><YAxis domain={[-1,1]} /><Tooltip /><Line type="monotone" dataKey="avg" dot={false} /></LineChart></ResponsiveContainer></div></div>)
}