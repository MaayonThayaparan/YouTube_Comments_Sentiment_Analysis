import React, { useMemo } from 'react'
import { type ScoredRow } from '../../utils/scoring'
export function Leaderboard({ rows }:{rows:ScoredRow[]}){
  const boards = useMemo(()=>{
    const byAuthor = new Map<string, {likes:number, count:number, avg:number}>()
    for (const r of rows) {
      const e = byAuthor.get(r.authorDisplayName) || { likes:0, count:0, avg:0 }
      e.likes += r.likeCount || 0; e.count += 1; e.avg += r.adjusted; byAuthor.set(r.authorDisplayName, e)
      for (const rp of (r as any).replies || []) {
        const er = byAuthor.get(rp.authorDisplayName) || { likes:0, count:0, avg:0 }
        er.likes += rp.likeCount || 0; er.count += 1; er.avg += (typeof rp.base==='number'?rp.base:0); byAuthor.set(rp.authorDisplayName, er)
      }
    }
    const arr = Array.from(byAuthor.entries()).map(([author,v])=>({ author, likes:v.likes, count:v.count, avg:v.count? v.avg/v.count : 0 }))
    return {
      mostLiked: [...arr].sort((a,b)=>b.likes-a.likes).slice(0,10),
      mostPositive: [...arr].sort((a,b)=>b.avg-a.avg).slice(0,10),
      mostNegative: [...arr].sort((a,b)=>a.avg-b.avg).slice(0,10),
    }
  }, [rows])
  const Table = ({data}:{data:any[]}) => (
    <table className="w-full text-sm table-fixed">
      <colgroup><col className="w-2/3"/><col className="w-1/6"/><col className="w-1/6"/></colgroup>
      <thead><tr className="text-left"><th className="p-2">Author</th><th className="p-2">Avg</th><th className="p-2">Likes</th></tr></thead>
      <tbody>{data.map((r,i)=>(<tr key={i} className="border-t border-gray-200 dark:border-gray-700"><td className="p-2 truncate" title={r.author}>{r.author}</td><td className="p-2">{r.avg.toFixed(2)}</td><td className="p-2">{r.likes}</td></tr>))}</tbody>
    </table>
  )
  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold mb-2">Author Leaderboard</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><div className="font-semibold mb-2">Most Liked</div><Table data={boards.mostLiked} /></div>
        <div><div className="font-semibold mb-2">Most Positive (avg)</div><Table data={boards.mostPositive} /></div>
        <div><div className="font-semibold mb-2">Most Negative (avg)</div><Table data={boards.mostNegative} /></div>
      </div>
    </div>
  )
}
