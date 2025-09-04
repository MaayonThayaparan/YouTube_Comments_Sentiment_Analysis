import React from 'react'
export function TimeWindow({ minDate, maxDate, value, onChange }:{ minDate:string, maxDate:string, value:{from:string,to:string}, onChange:(v:{from:string,to:string})=>void }){
  return (
    <div className="card p-3">
      <div className="flex gap-3 items-end flex-wrap">
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-300">From</label>
          <input type="date" min={minDate} max={maxDate} value={value.from} onChange={e=>onChange({ ...value, from: e.target.value })} className="ml-2 rounded-xl px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900" />
        </div>
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-300">To</label>
          <input type="date" min={minDate} max={maxDate} value={value.to} onChange={e=>onChange({ ...value, to: e.target.value })} className="ml-2 rounded-xl px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900" />
        </div>
        <div className="text-xs text-gray-500">Charts & tables reflect this window.</div>
      </div>
    </div>
  )
}
