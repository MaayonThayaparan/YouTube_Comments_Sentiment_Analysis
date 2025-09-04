import React from 'react'

export type GlobalFilterState = {
  country:string
  minSubs:string; maxSubs:string
  minLikes:string; maxLikes:string
  minReplies:string; maxReplies:string
}

export function FiltersPanel({
  countries, dates, value, onChange
}:{countries:string[], dates:{min:string,max:string}, value:GlobalFilterState, onChange:(v:GlobalFilterState)=>void}){
  const set = (k:keyof GlobalFilterState)=>(e:any)=> onChange({...value,[k]:e.target.value})
  const uniq = Array.from(new Set(countries.filter(Boolean))).sort()
  const setDate=(k:'from'|'to')=>(e:any)=>{
    const evt=new CustomEvent('global-date-change',{detail:{key:k,value:e.target.value}})
    window.dispatchEvent(evt)
  }
  return (
    <div className="card p-3">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
        <div>
          <label className="text-xs">From</label>
          <input type="date" min={dates.min} max={dates.max} onChange={setDate('from')} className="mt-1 w-full rounded-xl px-3 py-2 border" />
        </div>
        <div>
          <label className="text-xs">To</label>
          <input type="date" min={dates.min} max={dates.max} onChange={setDate('to')} className="mt-1 w-full rounded-xl px-3 py-2 border" />
        </div>
        <div>
          <label className="text-xs">Country</label>
          <select className="mt-1 w-full rounded-xl px-3 py-2 border" value={value.country} onChange={set('country')}>
            <option value="">Any</option>
            {uniq.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <Stack label="Subscribers" a={{label:'Min', val:value.minSubs, onChange:set('minSubs')}} b={{label:'Max', val:value.maxSubs, onChange:set('maxSubs')}}/>
        <Stack label="Likes" a={{label:'Min', val:value.minLikes, onChange:set('minLikes')}} b={{label:'Max', val:value.maxLikes, onChange:set('maxLikes')}}/>
        <Stack label="Replies" a={{label:'Min', val:value.minReplies, onChange:set('minReplies')}} b={{label:'Max', val:value.maxReplies, onChange:set('maxReplies')}}/>
      </div>
    </div>
  )
}

function Stack({label,a,b}:{label:string,a:{label:string,val:string,onChange:(e:any)=>void},b:{label:string,val:string,onChange:(e:any)=>void}}){
  return (
    <div>
      <label className="text-xs">{label}</label>
      <div className="mt-1 grid grid-rows-2 gap-1">
        <input placeholder={a.label} value={a.val} onChange={a.onChange} type="number" className="rounded-xl px-3 py-2 border" />
        <input placeholder={b.label} value={b.val} onChange={b.onChange} type="number" className="rounded-xl px-3 py-2 border" />
      </div>
    </div>
  )
}
