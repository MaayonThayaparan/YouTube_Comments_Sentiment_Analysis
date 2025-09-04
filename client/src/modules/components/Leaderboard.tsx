import React, { useMemo, useState } from 'react'

function compactNumber(n:number){ if(n>=1_000_000) return (n/1_000_000).toFixed(1)+'M'; if(n>=1_000) return (n/1_000).toFixed(1)+'K'; return String(n) }

type Row = {
  authorDisplayName:string; likeCount:number; totalReplyCount:number;
  adjusted:number; textOriginal:string; replies?:Array<any>;
}

export function Leaderboard({ rows }:{rows:Row[]}){
  const [modal, setModal] = useState<{open:boolean,title:string,items:Row[]}>({open:false,title:'',items:[]})

  const boards = useMemo(()=>{
    const byAuthor = new Map<string, {likes:number,posReplies:number,negReplies:number, items:Row[]}>()
    for(const r of rows){
      const key=r.authorDisplayName||'Unknown'
      if(!byAuthor.has(key)) byAuthor.set(key,{likes:0,posReplies:0,negReplies:0,items:[]})
      const b=byAuthor.get(key)!
      b.likes += r.likeCount || 0
      if((r.replies||[]).length){
        for(const rp of r.replies||[]){
          if(typeof rp.adjusted==='number'){
            if(rp.adjusted>0.1) b.posReplies++
            else if(rp.adjusted<-0.1) b.negReplies++
          }
        }
      }
      b.items.push(r)
    }
    const arr = Array.from(byAuthor.entries()).map(([author,vals])=>({author,...vals}))
    return {
      mostLiked: arr.slice().sort((a,b)=>b.likes-a.likes).slice(0,10),
      mostPositiveReplies: arr.slice().sort((a,b)=>b.posReplies-a.posReplies).slice(0,10),
      mostNegativeReplies: arr.slice().sort((a,b)=>b.negReplies-a.negReplies).slice(0,10),
      authoredMap: byAuthor,
    }
  },[rows])

  function openExamples(kind:'pos'|'neg'){
    const list = kind==='pos'? boards.mostPositiveReplies : boards.mostNegativeReplies
    if(!list?.length) return
    const author=list[0].author
    const items=boards.authoredMap.get(author)?.items || []
    setModal({open:true,title:`Examples for ${author} (${kind==='pos'?'Positive':'Negative'})`,items})
  }

  const Table = ({data, colKey}:{data:any[], colKey:'likes'|'posReplies'|'negReplies'}) => (
    <div className="overflow-auto">
      <table className="min-w-full table-fixed text-sm">
        <colgroup>
          <col style={{width:'55%'}} /><col style={{width:'45%'}} />
        </colgroup>
        <thead>
          <tr><th className="text-left p-2">Author</th><th className="text-left p-2">Total</th></tr>
        </thead>
        <tbody>
          {data.length===0? <tr><td colSpan={2} className="p-3 text-center text-gray-500">No Data</td></tr> : data.map((r,i)=>(
            <tr key={i} className="border-t">
              <td className="p-2">{r.author}</td>
              <td className="p-2">{colKey==='posReplies'?<span className="text-green-600">{compactNumber(r[colKey]||0)}</span>:colKey==='negReplies'?<span className="text-red-600">{compactNumber(r[colKey]||0)}</span>:compactNumber(r[colKey]||0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold mb-3">Author Leaderboard</h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div>
          <div className="font-semibold mb-2 whitespace-pre-wrap">Most Liked
(Total)</div>
          <Table data={boards.mostLiked} colKey="likes" />
        </div>
        <div>
          <button className="font-semibold mb-2 underline" onClick={()=>openExamples('pos')}>Most Positive Replies (Total)</button>
          <Table data={boards.mostPositiveReplies} colKey="posReplies" />
        </div>
        <div>
          <button className="font-semibold mb-2 underline" onClick={()=>openExamples('neg')}>Most Negative Replies (Total)</button>
          <Table data={boards.mostNegativeReplies} colKey="negReplies" />
        </div>
      </div>

      {modal.open && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">{modal.title}</div>
              <button onClick={()=>setModal({open:false,title:'',items:[]})} className="rounded-lg px-3 py-1.5 border">Close</button>
            </div>
            <div className="max-h-[60vh] overflow-auto space-y-3 text-sm">
              {modal.items.length===0? <div className="text-gray-500">No Data</div> : modal.items.map((it,idx)=>(
                <div key={idx} className="border-b pb-2">
                  <div className="text-gray-500 mb-1">{it.authorDisplayName} • {it.publishedAt?.slice(0,10) || ''}</div>
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
