import React from 'react'
import { type ScoredRow } from '../../utils/scoring'
function badgeColor(score:number){ if (score >= 0.4) return 'bg-green-100 text-green-800 border-green-300'; if (score >= 0.1) return 'bg-lime-100 text-lime-800 border-lime-300'; if (score > -0.1) return 'bg-gray-100 text-gray-800 border-gray-300'; if (score > -0.4) return 'bg-amber-100 text-amber-800 border-amber-300'; return 'bg-red-100 text-red-800 border-red-300' }
export function CommentsTable({ rows, loading }:{ rows:ScoredRow[], loading?:boolean }){
  const [open, setOpen] = React.useState<Record<string, boolean>>({})
  const toggle = (id:string) => setOpen(o=>({ ...o, [id]: !o[id] }))
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Comments ({rows.length})</h3>
        {loading && <div className="text-sm text-gray-500">Fetching…</div>}
      </div>
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900">
            <tr className="text-left">
              <th className="p-2">Score</th>
              <th className="p-2">Likes</th>
              <th className="p-2">Replies</th>
              <th className="p-2">Text</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <React.Fragment key={r.id}>
              <tr className="border-t border-gray-100 dark:border-gray-700">
                <td className="p-2 align-top">
                  <span className={'inline-block px-2 py-1 rounded-lg border ' + badgeColor(r.adjusted)} title={`Base: ${r.base.toFixed(2)} | Adj: ${r.adjusted.toFixed(2)}`}>{r.adjusted.toFixed(2)}</span>
                </td>
                <td className="p-2 align-top">{r.likeCount}</td>
                <td className="p-2 align-top">{r.totalReplyCount}</td>
                <td className="p-2 whitespace-pre-wrap">{r.textOriginal}</td>
                <td className="p-2 align-top"><button onClick={()=>toggle(r.id)} className="rounded-lg px-2 py-1 border">{open[r.id] ? 'Hide' : 'Show'} replies</button></td>
              </tr>
              {open[r.id] && r.totalReplyCount > 0 && (
                <tr className="bg-gray-50 dark:bg-gray-900"><td colSpan={5} className="p-3">
                  <div className="space-y-2">
                    {(r as any).replies?.map((rp:any)=> (
                      <div key={rp.id} className="flex gap-2 items-start border-b border-gray-200 dark:border-gray-700 pb-2">
                        <span className={'inline-block px-2 py-1 rounded-lg border ' + (rp.base >= 0.4 ? 'bg-green-100 text-green-800 border-green-300' : rp.base >= 0.1 ? 'bg-lime-100 text-lime-800 border-lime-300' : rp.base > -0.1 ? 'bg-gray-100 text-gray-800 border-gray-300' : rp.base > -0.4 ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-red-100 text-red-800 border-red-300')}>{typeof rp.base === 'number' ? rp.base.toFixed(2) : '—'}</span>
                        <div className="text-sm"><span className="text-gray-500">({rp.likeCount} likes)</span> {rp.textOriginal}</div>
                      </div>
                    ))}
                  </div>
                </td></tr>
              )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}