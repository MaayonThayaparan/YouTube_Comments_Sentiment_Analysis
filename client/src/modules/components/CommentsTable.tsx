import React from 'react'
import { type ScoredRow } from '../../utils/scoring'
import { colorForScore } from '../../utils/colors'
import { RepliesModal } from './RepliesModal'

type SortKey = 'adjusted'|'authorDisplayName'|'likeCount'|'totalReplyCount'|'publishedAt'|'authorCountry'|'authorSubscriberCount'
type SortDir = 'asc'|'desc'

export function CommentsTable({ rows, loading }:{ rows:ScoredRow[], loading?:boolean }){
  const [open, setOpen] = React.useState<{show:boolean,parent:any,replies:any[]}>({show:false,parent:null,replies:[]})
  const [page, setPage] = React.useState(1)
  const pageSize = 30

  const [sortKey, setSortKey] = React.useState<SortKey>('adjusted')
  const [sortDir, setSortDir] = React.useState<SortDir>('desc')
  const [fText, setFText] = React.useState('')

  React.useEffect(()=>{ setPage(1) }, [fText,sortKey,sortDir])

  const filtered = rows.filter(r=>!fText || r.textOriginal.toLowerCase().includes(fText.toLowerCase()))

  const sorted = [...filtered].sort((a,b)=>{
    const va = (a as any)[sortKey], vb = (b as any)[sortKey]
    if (va == null && vb == null) return 0
    if (va == null) return sortDir === 'asc' ? -1 : 1
    if (vb == null) return sortDir === 'asc' ? 1 : -1
    if (sortKey === 'authorDisplayName' || sortKey === 'publishedAt' || sortKey==='authorCountry') {
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
    }
    return sortDir === 'asc' ? (va - vb) : (vb - va)
  })

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const start = (page-1)*pageSize
  const visible = sorted.slice(start, start+pageSize)

  function header(label:string, key:SortKey){
    const active = sortKey === key
    const arrow = active ? (sortDir === 'asc' ? '▲' : '▼') : ''
    return <button type="button" className="font-semibold" onClick={()=>{ if(active) setSortDir(d=>d==='asc'?'desc':'asc'); else { setSortKey(key); setSortDir('desc') } }}>{label} {arrow}</button>
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Comments ({filtered.length}{filtered.length!==rows.length?` / ${rows.length}`:''})</h3>
        <div className="flex gap-2">
          <input placeholder="Search text…" value={fText} onChange={e=>setFText(e.target.value)} className="rounded-xl px-2 py-1 border bg-gray-50 dark:bg-gray-900" />
          <button type="button" onClick={()=>{ setFText('') }} className="rounded-lg px-3 py-1.5 border">Clear</button>
          {loading && <div className="text-sm text-gray-500">Fetching…</div>}
        </div>
      </div>

      <div className="table-wrap">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900">
            <tr className="text-left">
              <th className="p-2">{header('Score','adjusted')}</th>
              <th className="p-2">{header('Author','authorDisplayName')}</th>
              <th className="p-2">{header('Country','authorCountry')}</th>
              <th className="p-2">{header('Subs','authorSubscriberCount')}</th>
              <th className="p-2">{header('Likes','likeCount')}</th>
              <th className="p-2">{header('Replies','totalReplyCount')}</th>
              <th className="p-2">{header('Date','publishedAt')}</th>
              <th className="p-2">Text</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr><td colSpan={9} className="p-4 text-center text-gray-500">No Data</td></tr>
            ) : visible.map((r) => {
              const c = colorForScore(r.adjusted)
              return (
                <tr key={r.id} className="border-t border-gray-100 dark:border-gray-700 align-top">
                  <td className="p-2"><span className={`inline-block px-2 py-1 rounded-lg border ${c.bg} ${c.text} ${c.border}`} title={`Base: ${r.base.toFixed(2)} | Adj: ${r.adjusted.toFixed(2)}`}>{r.adjusted.toFixed(2)}</span></td>
                  <td className="p-2">{r.authorDisplayName}</td>
                  <td className="p-2">{r.authorCountry||'—'}</td>
                  <td className="p-2">{r.authorSubscriberCount ?? '—'}</td>
                  <td className="p-2">{r.likeCount}</td>
                  <td className="p-2">{r.totalReplyCount}</td>
                  <td className="p-2" title={r.publishedAt}>{(r.publishedAt||'').slice(0,10).replace(/^(\d{2})(\d{2})/,'$1/$2')}</td>
                  <td className="p-2 wrap-anywhere">{r.textOriginal}</td>
                  <td className="p-2"><button type="button" onClick={()=>setOpen({show:true,parent:r,replies:(r as any).replies||[]})} className="rounded-lg px-2 py-1 border">Show Replies</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="text-xs text-gray-500">Page {page} / {totalPages}</div>
        <div className="flex gap-2">
          <button type="button" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="rounded-lg px-3 py-1.5 border disabled:opacity-50">Prev Page</button>
          <button type="button" disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))} className="rounded-lg px-3 py-1.5 border disabled:opacity-50">Next Page</button>
        </div>
      </div>

      <RepliesModal open={open.show} onClose={()=>setOpen({show:false,parent:null,replies:[]})} parent={open.parent} replies={open.replies} />
    </div>
  )
}
