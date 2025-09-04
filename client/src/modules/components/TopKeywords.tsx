import React, { useMemo } from 'react'
import { tfidfTopOverall } from '../../utils/text'
export function TopKeywords({ texts }:{texts:string[]}){
  const top = useMemo(() => tfidfTopOverall(texts, 20), [texts])
  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold mb-2">Top 20 Keywords</h3>
      <div className="flex flex-wrap gap-2 text-sm">
        {top.map(k => <span key={k.term} className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">{k.term}</span>)}
      </div>
    </div>
  )
}
