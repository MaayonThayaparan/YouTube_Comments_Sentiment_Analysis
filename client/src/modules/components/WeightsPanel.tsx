import React from 'react'
type Weights = { wComment:number; wLikes:number; wReplies:number }
export function WeightsPanel({ weights, onChange, disabled }:{ weights:Weights, onChange:(w:Weights)=>void, disabled?:boolean }){
  const set = (key:keyof Weights) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...weights, [key]: parseFloat(e.target.value) })
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
      <h3 className="text-lg font-semibold mb-2">Weights</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Slider label="Comment Sentiment" value={weights.wComment} min={0} max={2} step={0.1} onChange={set('wComment')} disabled={disabled} />
        <Slider label="Likes Influence"   value={weights.wLikes}   min={0} max={2} step={0.1} onChange={set('wLikes')}   disabled={disabled} />
        <Slider label="Replies Influence" value={weights.wReplies} min={0} max={2} step={0.1} onChange={set('wReplies')} disabled={disabled} />
      </div>
    </div>
  )
}
function Slider({ label, value, min, max, step, onChange, disabled }:{label:string,value:number,min:number,max:number,step:number,onChange:(e:any)=>void,disabled?:boolean}){
  return (<div><div className="flex items-center justify-between mb-1"><span className="text-sm text-gray-600 dark:text-gray-300">{label}</span><span className="text-sm font-mono">{value.toFixed(1)}</span></div><input type="range" min={min} max={max} step={step} value={value} onChange={onChange} disabled={disabled} className="w-full" /></div>)
}