import React, { useMemo } from 'react'
import { tfidfTopOverall } from '../../utils/text'
import { type ScoredRow } from '../../utils/scoring'
function Section({ title, words }:{title:string, words:{term:string, score:number}[]}){
  if(!words?.length) return <div className="text-gray-500">No Data</div>
  return (<div><div className="font-semibold mb-2">{title}</div><div className="flex flex-wrap gap-2 text-sm">{words.map(k => <span key={k.term} className="topword-chip px-2 py-1 rounded-lg border text-gray-800 dark:text-gray-200">{k.term}</span>)}</div></div>)
}
export function TopWords({ rows }:{ rows: ScoredRow[] }){
  const { all, pos, neg } = useMemo(()=>{
    const allTexts = rows.flatMap(r=>[r.textOriginal, ...(r as any).replies?.map((x:any)=>x.textOriginal)||[]])
    const posTexts = rows.flatMap(r=> (r.adjusted>0.1 ? [r.textOriginal] : []).concat(((r as any).replies||[]).filter((x:any)=>x.base>0.1).map((x:any)=>x.textOriginal)))
    const negTexts = rows.flatMap(r=> (r.adjusted<-0.1 ? [r.textOriginal] : []).concat(((r as any).replies||[]).filter((x:any)=>x.base<-0.1).map((x:any)=>x.textOriginal)))
    return { all: tfidfTopOverall(allTexts,20), pos: tfidfTopOverall(posTexts,20), neg: tfidfTopOverall(negTexts,20) }
  }, [rows])
  return (<div className="card p-4"><h3 className="text-lg font-semibold mb-3">Top 20 Words</h3><div className="grid grid-cols-1 lg:grid-cols-3 gap-4"><Section title="Overall" words={all} /><Section title="Positive Responses" words={pos} /><Section title="Negative Responses" words={neg} /></div></div>)
}
