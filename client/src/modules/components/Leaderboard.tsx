import React, { useMemo, useState } from 'react'
import { type ScoredRow } from '../../utils/scoring'
import { compactNumber } from '../../utils/colors'
import { RepliesModal } from './RepliesModal'

export function Leaderboard({ rows }:{rows:ScoredRow[]}){
  const [userOpen,setUserOpen]=useState<{open:boolean,author:string,items:any[]}>({open:false,author:'',items:[]})

  const boards = useMemo(()=>{
    const stats = new Map<string, {likes:number, posReplies:number, negReplies:number}>()
    const authoredMap = new Map<string, any[]>()

    for (const r of rows) {
      const pa = r.authorDisplayName
      const p = stats.get(pa) || {likes:0,posReplies:0,negReplies:0}
      p.likes += r.likeCount || 0
      stats.set(pa, p)
      if(!authoredMap.has(pa)) authoredMap.set(pa, [])
      authoredMap.get(pa)!.push({ ...r, isParent:true })

      for (const rp of (r as any).replies || []) {
        const a = rp.authorDisplayName
        const s = stats.get(a) || {likes:0,posReplies:0,negReplies:0}
        if (typeof rp.base === 'number') {
          if (rp.base > 0.1) s.posReplies += 1
          else if (rp.base < -0.1) s.negReplies += 1
        }
        stats.set(a, s)
        if(!authoredMap.has(a)) authoredMap.set(a, [])
        authoredMap.get(a)!.push({ ...rp, parentId:r.id, isParent:false })
      }
    }

    const arr = Array.from(stats.entries()).map(([author,v])=>({ author, likes:v.likes, posReplies:v.posReplies, negReplies:v.negReplies }))
    return {
      mostLiked: [...arr].sort((a,b)=>b.likes-a.likes).slice(0,10),
      mostPositiveReplies: [...arr].sort((a,b)=>b.posReplies-a.posReplies).slice(0,10),
      mostNegativeReplies: [...arr].sort((a,b)=>b.negReplies-a.negReplies).slice(0,10),
      authoredMap
    }
  }, [rows])

  const Table = ({data, colKey}:{data:any[], colKey:'likes'|'posReplies'|'negReplies'}) => (
    <table className="w-full text-sm table-fixed">
      <colgroup><col className="w-2/3"/><col className="w-1/3"/></colgroup>
      <thead><tr className="text-left"><th className="p-2">Author</th><th className="p-2">Total</th></tr></thead>
      <tbody>{(data||[]).length===0 ? <tr><td colSpan={2} className="p-3 text-center text-gray-500">No Data</td></tr> : data.map((r,i)=>(
        <tr key={i} className="border-t border-gray-200 dark:border-gray-700">
          <td className="p-2 truncate">
            <button className="underline" title="Show this author's comments & replies" onClick={()=>{
              const items = boards.authoredMap.get(r.author)||[]
              setUserOpen({open:true,author:r.author,items})
            }}>{r.author}</button>
          </td>
          <td className="p-2">{compactNumber(r[colKey]||0)}</td>
        </tr>
      ))}</tbody>
    </table>
  )

  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold mb-2">Author Leaderboard</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><div className="font-semibold mb-2">Most Liked (Total)</div><Table data={boards.mostLiked} colKey="likes" /></div>
        <div><div className="font-semibold mb-2">Most Positive Replies (Total)</div><Table data={boards.mostPositiveReplies} colKey="posReplies" /></div>
        <div><div className="font-semibold mb-2">Most Negative Replies (Total)</div><Table data={boards.mostNegativeReplies} colKey="negReplies" /></div>
      </div>

      {/* Simple modal for author's authored items */}
      {userOpen.open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-3xl w-full p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">Activity by {userOpen.author}</div>
              <button onClick={()=>setUserOpen({open:false,author:'',items:[]})} className="rounded-lg px-3 py-1.5 border">Close</button>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-auto text-sm">
              {userOpen.items.length===0 ? <div className="text-gray-500">No Data</div> : userOpen.items.map((it:any,idx:number)=>(
                <div key={idx} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                  <div className="text-gray-500 mb-1">{it.isParent?'Top-level comment':'Reply'} • {(it.publishedAt||'').slice(0,10)} • Likes {it.likeCount||0}</div>
                  <div className="whitespace-pre-wrap">{it.textOriginal}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
