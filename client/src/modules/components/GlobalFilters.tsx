import React from 'react'
export type GlobalFilterState = { country: string; minSubs: string; maxSubs: string }
export function GlobalFilters({ countries, value, onChange }:{ countries:string[], value:GlobalFilterState, onChange:(v:GlobalFilterState)=>void }){
  const uniq = Array.from(new Set(countries.filter(Boolean))).sort()
  return (
    <div className="card p-3">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-300">Country</label>
          <select className="mt-1 w-full rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900" value={value.country} onChange={e=>onChange({...value, country:e.target.value})}>
            <option value="">Any</option>
            {uniq.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-300">Min subscribers</label>
          <input type="number" className="mt-1 w-full rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900" value={value.minSubs} onChange={e=>onChange({...value, minSubs:e.target.value})} placeholder="e.g., 1000" />
        </div>
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-300">Max subscribers</label>
          <input type="number" className="mt-1 w-full rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900" value={value.maxSubs} onChange={e=>onChange({...value, maxSubs:e.target.value})} placeholder="e.g., 100000" />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={()=>onChange({country:'',minSubs:'',maxSubs:''})} className="rounded-xl px-3 py-2 border">Clear</button>
        </div>
      </div>
    </div>
  )
}
