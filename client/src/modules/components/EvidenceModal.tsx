import React from 'react'
export function EvidenceModal({ open, onClose, title, items }:{ open:boolean, onClose:()=>void, title:string, items:Array<{author:string,text:string,score?:number}> }){
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="card max-w-3xl w-full p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">{title}</div>
          <button onClick={onClose} className="rounded-lg px-3 py-1.5 border">Close</button>
        </div>
        <div className="space-y-3 text-sm max-h-[60vh] overflow-auto">
          {items.map((it,i)=>(
            <div key={i} className="border-b border-gray-200 dark:border-gray-700 pb-2">
              <div className="text-gray-500 mb-1">{it.author} {typeof it.score==='number' ? `• ${it.score.toFixed(2)}` : ''}</div>
              <div className="whitespace-pre-wrap">{it.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
