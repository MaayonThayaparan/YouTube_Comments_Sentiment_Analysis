import React from 'react'
type Weights = { wComment:number; wLikes:number; wReplies:number }
export function WeightsPanel({ weights, onChange, disabled }:{ weights:Weights, onChange:(w:Weights)=>void, disabled?:boolean }){
  const set = (key:keyof Weights) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...weights, [key]: parseFloat(e.target.value) })
  const Info = ({text}:{text:string}) => <span title={text} className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 text-xs">i</span>
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Weights</h3>
        <button type="button" onClick={()=>onChange({ wComment:1.0, wLikes:0.7, wReplies:1.0 })} className="rounded-lg px-3 py-1.5 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900">Default</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Slider label={<span>Comment Sentiment<Info text="How much the raw model score matters in the final adjusted score." /></span>} value={weights.wComment} min={0} max={2} step={0.1} onChange={set('wComment')} disabled={disabled} />
        <Slider label={<span>Likes Influence<Info text="Amplifies the direction of the comment based on its likes (log-scaled)." /></span>} value={weights.wLikes} min={0} max={2} step={0.1} onChange={set('wLikes')} disabled={disabled} />
        <Slider label={<span>Replies Influence<Info text="Incorporates the average reply sentiment (weighted by reply likes)." /></span>} value={weights.wReplies} min={0} max={2} step={0.1} onChange={set('wReplies')} disabled={disabled} />
      </div>
    </div>
  )
}
function Slider({ label, value, min, max, step, onChange, disabled }:{label:React.ReactNode,value:number,min:number,max:number,step:number,onChange:(e:any)=>void,disabled?:boolean}){
  return (<div><div className="flex items-center justify-between mb-1"><span className="text-sm text-gray-600 dark:text-gray-300">{label}</span><span className="text-sm font-mono">{value.toFixed(1)}</span></div><input type="range" min={min} max={max} step={step} value={value} onChange={onChange} disabled={disabled} className="w-full" /></div>)
}
