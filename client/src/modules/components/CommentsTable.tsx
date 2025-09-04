import React from 'react'
import { colorForScore } from '../../utils/colors'

type Row = {
  id:string; adjusted:number; base:number; textOriginal:string;
  authorDisplayName:string; authorCountry?:string|null; authorSubscriberCount?:number|null;
  likeCount:number; totalReplyCount:number; publishedAt?:string; replies?:Array<any>;
}

type SortKey = 'adjusted'|'authorDisplayName'|'authorCountry'|'authorSubscriberCount'|'likeCount'|'totalReplyCount'|'publishedAt'
type SortDir = 'asc'|'desc'
type Chip = 'all'|'neg'|'slneg'|'neu'|'slpos'|'pos'

/**
 * CommentsTable
 * - Local-only sentiment chips
 * - Score min/max numeric filter
 * - Prev/Next pagination
 * - Sort on all but text
 * - Replies open in opaque modal
 */
export function CommentsTable({ rows }:{ rows:Row[] }){
  const [open, setOpen] = React.useState<{show:boolean,row:any}>({show:false,row:null})
  const [page, setPage] = React.useState(1)
  const [fText, setFText] = React.useState('')
  const [chip, setChip] = React.useState<Chip>('all')
  const [smin, setSmin] = React.useState('')
  const [smax, setSmax] = React.useState('')
  const [sortKey, setSortKey] = React.useState<SortKey>('adjusted')
  const [sortDir, setSortDir] = React.useState<SortDir>('desc')
  const pageSize = 30

  React.useEffect(()=> setPage(1), [fText,chip,smin,smax,sortKey,sortDir])

  const filtered = rows.filter(r=>{
    if (fText && !r.textOriginal.toLowerCase().includes(fText.toLowerCase())) return false
    const s = r.adjusted
    switch(chip){
      case 'neg': if(!(s<=-0.4)) return false; break
      case 'slneg': if(!(s>-0.4 && s<=-0.1)) return false; break
      case 'neu': if(!(s>-0.1 && s<0.1)) return false; break
      case 'slpos': if(!(s>=0.1 && s<0.4)) return false; break
      case 'pos': if(!(s>=0.4)) return false; break
    }
    const mn = smin?parseFloat(smin):-Infinity
    const mx = smax?parseFloat(smax): Infinity
    if(!(s>=mn && s<=mx)) return false
    return true
  })

  const sorted = [...filtered].sort((a,b)=>{
    const va=(a as any)[sortKey], vb=(b as any)[sortKey]
    if(va==null && vb==null) return 0
    if(va==null) return sortDir==='asc'?-1:1
    if(vb==null) return sortDir==='asc'?1:-1
    if(['authorDisplayName','authorCountry','publishedAt'].includes(sortKey)){
      return sortDir==='asc'?String(va).localeCompare(String(vb)):String(vb).localeCompare(String(va))
    }
    return sortDir==='asc'?(va-vb):(vb-va)
  })

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const start = (page-1)*pageSize
  const visible = sorted.slice(start, start+pageSize)

  function header(label:string,key:SortKey){
    const active=sortKey===key
    const arrow=active?(sortDir==='asc'?'▲':'▼'):''
    return <button className="font-semibold" onClick={()=>{ if(active) setSortDir(d=>d==='asc'?'desc':'asc'); else { setSortKey(key); setSortDir('desc') }}}>{label} {arrow}</button>
  }

  const ChipBtn = ({k,label}:{k:Chip,label:string}) => (
    <button type="button" onClick={()=>setChip(k)} className={`px-3 py-1.5 rounded-full border text-sm ${chip===k?'bg-blue-600 text-white border-transparent':'bg-white/70 border-gray-300'}`}>{label}</button>
  )

  return (
    <div className="card p-4">
      <div className="flex flex-wrap gap-2 items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Comments ({filtered.length}{filtered.length!==rows.length?` / ${rows.length}`:''})</h3>
        <div className="flex flex-wrap gap-2 items-center">
          <input placeholder="Search text…" value={fText} onChange={e=>setFText(e.target.value)} className="rounded-xl px-2 py-1 border" />
          <input placeholder="Score min" type="number" step="0.01" value={smin} onChange={e=>setSmin(e.target.value)} className="w-28 rounded-xl px-2 py-1 border" />
          <input placeholder="Score max" type="number" step="0.01" value={smax} onChange={e=>setSmax(e.target.value)} className="w-28 rounded-xl px-2 py-1 border" />
          <button type="button" onClick={()=>{ setFText(''); setSmin(''); setSmax(''); setChip('all') }} className="rounded-lg px-3 py-1.5 border">Clear</button>
        </div>
      </div>

      <div className="mb-2 flex flex-wrap gap-2">
        <ChipBtn k="all" label="All" />
        <ChipBtn k="neg" label="Negative" />
        <ChipBtn k="slneg" label="Slight Neg" />
        <ChipBtn k="neu" label="Neutral" />
        <ChipBtn k="slpos" label="Slight Pos" />
        <ChipBtn k="pos" label="Positive" />
      </div>

      <div className="table-wrap">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-gray-50">
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
            {visible.length===0? <tr><td colSpan={9} className="p-4 text-center text-gray-500">No Data</td></tr> : visible.map(r=>{
              const c=colorForScore(r.adjusted)
              return (
                <tr key={r.id} className="border-t border-gray-100 align-top">
                  <td className="p-2"><span className={`inline-block px-2 py-1 rounded-lg border ${c.bg} ${c.text} ${c.border}`} title={`Base: ${r.base.toFixed(2)} | Adj: ${r.adjusted.toFixed(2)}`}>{r.adjusted.toFixed(2)}</span></td>
                  <td className="p-2">{r.authorDisplayName}</td>
                  <td className="p-2">{r.authorCountry||'—'}</td>
                  <td className="p-2">{r.authorSubscriberCount ?? '—'}</td>
                  <td className="p-2">{r.likeCount}</td>
                  <td className="p-2">{r.totalReplyCount}</td>
                  <td className="p-2" title={r.publishedAt}>{(r.publishedAt||'').slice(0,10)}</td>
                  <td className="p-2 wrap-anywhere">{r.textOriginal}</td>
                  <td className="p-2"><button type="button" onClick={()=>setOpen({show:true,row:r})} className="rounded-lg px-2 py-1 border">Show Replies</button></td>
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

      {open.show && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">Replies</div>
              <button onClick={()=>setOpen({show:false,row:null})} className="rounded-lg px-3 py-1.5 border">Close</button>
            </div>
            <div className="max-h-[60vh] overflow-auto space-y-3 text-sm">
              {(open.row?.replies||[]).length===0 ? <div className="text-gray-500">No replies</div> : (open.row.replies||[]).map((rp:any,idx:number)=>(
                <div key={idx} className="border-b border-gray-200 pb-2">
                  <div className="text-gray-500 mb-1">{rp.authorDisplayName}</div>
                  <div className="whitespace-pre-wrap">{rp.textOriginal}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
