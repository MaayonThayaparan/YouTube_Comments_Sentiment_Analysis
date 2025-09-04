import React from 'react'
import { type ScoredRow } from '../../utils/scoring'
import { colorForScore } from '../../utils/colors'
import { RepliesModal } from './RepliesModal'

type SortKey = 'adjusted'|'authorDisplayName'|'likeCount'|'totalReplyCount'|'publishedAt'
type SortDir = 'asc'|'desc'

export function CommentsTable({ rows, loading }:{ rows:ScoredRow[], loading?:boolean }){
  const [open, setOpen] = React.useState<{show:boolean,parent:any,replies:any[]}>({show:false,parent:null,replies:[]})
  const [page, setPage] = React.useState(1)
  const pageSize = 30

  const [sortKey, setSortKey] = React.useState<SortKey>('adjusted')
  const [sortDir, setSortDir] = React.useState<SortDir>('desc')
  const [fAuthor, setFAuthor] = React.useState('')
  const [fDateFrom, setFDateFrom] = React.useState('')
  const [fDateTo, setFDateTo] = React.useState('')
  const [fLikesMin, setFLikesMin] = React.useState('')
  const [fLikesMax, setFLikesMax] = React.useState('')
  const [fRepliesMin, setFRepliesMin] = React.useState('')
  const [fRepliesMax, setFRepliesMax] = React.useState('')
  const [fText, setFText] = React.useState('')

  const filtered = rows.filter(r=>{
    if (fAuthor && !r.authorDisplayName.toLowerCase().includes(fAuthor.toLowerCase())) return false
    const d = (r.publishedAt || '').slice(0,10)
    if (fDateFrom && d < fDateFrom) return false
    if (fDateTo && d > fDateTo) return false
    const likes = r.likeCount || 0, reps = r.totalReplyCount || 0
    if (fLikesMin && likes < Number(fLikesMin)) return false
    if (fLikesMax && likes > Number(fLikesMax)) return false
    if (fRepliesMin && reps < Number(fRepliesMin)) return false
    if (fRepliesMax && reps > Number(fRepliesMax)) return false
    if (fText && !r.textOriginal.toLowerCase().includes(fText.toLowerCase())) return false
    return true
  })

  const sorted = [...filtered].sort((a,b)=>{
    const va = (a as any)[sortKey], vb = (b as any)[sortKey]
    if (va == null && vb == null) return 0
    if (va == null) return sortDir === 'asc' ? -1 : 1
    if (vb == null) return sortDir === 'asc' ? 1 : -1
    if (sortKey === 'authorDisplayName' || sortKey === 'publishedAt') {
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
    }
    return sortDir === 'asc' ? (va - vb) : (vb - va)
  })

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const visible = sorted.slice((page-1)*pageSize, page*pageSize)

  function header(label:string, key:SortKey){
    const active = sortKey === key
    const arrow = active ? (sortDir === 'asc' ? '▲' : '▼') : ''
    return <button type="button" className="font-semibold" onClick={()=>{ if(active) setSortDir(d=>d==='asc'?'desc':'asc'); else { setSortKey(key); setSortDir('desc') } }}>{label} {arrow}</button>
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Comments ({filtered.length}{filtered.length!==rows.length?` / ${rows.length}`:''})</h3>
        {loading && <div className="text-sm text-gray-500">Fetching…</div>}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-2">
        <input placeholder="Filter author" value={fAuthor} onChange={e=>setFAuthor(e.target.value)} className="rounded-xl px-2 py-1 border bg-gray-50 dark:bg-gray-900" />
        <input type="date" value={fDateFrom} onChange={e=>setFDateFrom(e.target.value)} className="rounded-xl px-2 py-1 border bg-gray-50 dark:bg-gray-900" />
        <input type="date" value={fDateTo} onChange={e=>setFDateTo(e.target.value)} className="rounded-xl px-2 py-1 border bg-gray-50 dark:bg-gray-900" />
        <input placeholder="Min likes" value={fLikesMin} onChange={e=>setFLikesMin(e.target.value)} className="rounded-xl px-2 py-1 border bg-gray-50 dark:bg-gray-900" />
        <input placeholder="Max likes" value={fLikesMax} onChange={e=>setFLikesMax(e.target.value)} className="rounded-xl px-2 py-1 border bg-gray-50 dark:bg-gray-900" />
        <input placeholder="Min replies" value={fRepliesMin} onChange={e=>setFRepliesMin(e.target.value)} className="rounded-xl px-2 py-1 border bg-gray-50 dark:bg-gray-900" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
        <input placeholder="Max replies" value={fRepliesMax} onChange={e=>setFRepliesMax(e.target.value)} className="rounded-xl px-2 py-1 border bg-gray-50 dark:bg-gray-900" />
        <input placeholder="Search text…" value={fText} onChange={e=>setFText(e.target.value)} className="rounded-xl px-2 py-1 border bg-gray-50 dark:bg-gray-900" />
      </div>

      <div className="table-wrap">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900">
            <tr className="text-left">
              <th className="p-2">{header('Score','adjusted')}</th>
              <th className="p-2">{header('Author','authorDisplayName')}</th>
              <th className="p-2">{header('Likes','likeCount')}</th>
              <th className="p-2">{header('Replies','totalReplyCount')}</th>
              <th className="p-2">{header('Date','publishedAt')}</th>
              <th className="p-2">Text</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => {
              const c = colorForScore(r.adjusted)
              return (
                <tr key={r.id} className="border-t border-gray-100 dark:border-gray-700 align-top">
                  <td className="p-2"><span className={`inline-block px-2 py-1 rounded-lg border ${c.bg} ${c.text} ${c.border}`} title={`Base: ${r.base.toFixed(2)} | Adj: ${r.adjusted.toFixed(2)}`}>{r.adjusted.toFixed(2)}</span></td>
                  <td className="p-2">{r.authorDisplayName}</td>
                  <td className="p-2">{r.likeCount}</td>
                  <td className="p-2">{r.totalReplyCount}</td>
                  <td className="p-2">{(r.publishedAt||'').slice(0,10)}</td>
                  <td className="p-2 wrap-anywhere">{r.textOriginal}</td>
                  <td className="p-2">
                    <button type="button" onClick={()=>setOpen({show:true,parent:r,replies:(r as any).replies||[]})} className="rounded-lg px-2 py-1 border">Show Replies</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="text-xs text-gray-500">Page {page} / {totalPages}</div>
        <input type="range" min={1} max={totalPages} step={1} value={page} onChange={e=>setPage(parseInt(e.target.value))} className="w-64" />
      </div>

      <RepliesModal open={open.show} onClose={()=>setOpen({show:false,parent:null,replies:[]})} parent={open.parent} replies={open.replies} />
    </div>
  )
}
