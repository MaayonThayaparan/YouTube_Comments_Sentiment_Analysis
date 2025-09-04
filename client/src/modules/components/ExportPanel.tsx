import React from 'react'
import { download, toCSV } from '../../utils/export'
import { type ScoredRow } from '../../utils/scoring'
export function ExportPanel({ rows }:{rows:ScoredRow[]}){
  const onCSV = () => download(`sentiment_${Date.now()}.csv`, toCSV(rows), 'text/csv')
  const onJSON = () => download(`sentiment_${Date.now()}.json`, JSON.stringify(rows, null, 2), 'application/json')
  return (<div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 flex gap-3"><button onClick={onCSV} className="rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-700">Export CSV</button><button onClick={onJSON} className="rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-700">Export JSON</button></div>)
}