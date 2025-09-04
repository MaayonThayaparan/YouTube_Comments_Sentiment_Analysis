import React from 'react'

/**
 * SentimentChips
 * - Quick sentiment range filter applied globally to views
 * Buckets:
 *  - 'all': no filter
 *  - 'neg': <= -0.4
 *  - 'slneg': (-0.4, -0.1]
 *  - 'neu': (-0.1, 0.1)
 *  - 'slpos': [0.1, 0.4)
 *  - 'pos': >= 0.4
 */
export type SentimentBucket = 'all'|'neg'|'slneg'|'neu'|'slpos'|'pos'

export function SentimentChips({ value, onChange }:{ value:SentimentBucket, onChange:(v:SentimentBucket)=>void }){
  const chips: Array<{key:SentimentBucket,label:string}> = [
    {key:'all', label:'All'},
    {key:'neg', label:'Negative'},
    {key:'slneg', label:'Slight Neg'},
    {key:'neu', label:'Neutral'},
    {key:'slpos', label:'Slight Pos'},
    {key:'pos', label:'Positive'}
  ]
  return (
    <div className="card p-3">
      <div className="flex flex-wrap gap-2">
        {chips.map(c=>(
          <button key={c.key} type="button"
            onClick={()=>onChange(c.key)}
            className={`px-3 py-1.5 rounded-full border text-sm ${value===c.key ? 'bg-cta text-white border-transparent' : 'bg-white/70 dark:bg-gray-800/70 border-gray-200 dark:border-gray-700'}`}>
            {c.label}
          </button>
        ))}
      </div>
    </div>
  )
}
