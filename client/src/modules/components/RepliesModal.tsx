import React from 'react'
import { colorForScore } from '../../utils/colors'
export function RepliesModal({ open, onClose, parent, replies }:{ open:boolean, onClose:()=>void, parent:any, replies:any[] }){
  if(!open) return null
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-3xl w-full p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">Replies to {parent?.authorDisplayName}</div>
          <button onClick={onClose} className="rounded-lg px-3 py-1.5 border">Close</button>
        </div>
        <div className="text-sm mb-3 wrap-anywhere">{parent?.textOriginal}</div>
        <div className="max-h-[60vh] overflow-auto space-y-2">
          {replies.map(r=>{
            const c = colorForScore(typeof r.base === 'number' ? r.base : 0)
            return (
              <div key={r.id} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-block px-2 py-1 rounded-lg border ${c.bg} ${c.text} ${c.border}`} title="Reply sentiment">{typeof r.base === 'number' ? r.base.toFixed(2) : '—'}</span>
                  <div className="text-gray-500 text-xs">{(r.publishedAt||'').slice(0,10)} • {r.likeCount} likes • {r.authorDisplayName}</div>
                </div>
                <div className="text-sm wrap-anywhere">{r.textOriginal}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
