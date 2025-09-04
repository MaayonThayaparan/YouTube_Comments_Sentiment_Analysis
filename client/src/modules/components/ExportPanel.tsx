import React from 'react'
import { toCSV, download } from '../../utils/export'
import { type ScoredRow } from '../../utils/scoring'
export function ExportPanel({ rows }:{ rows: ScoredRow[] }){
  const onCSV = () => { const csv = toCSV(rows); download('comments_scored.csv', csv, 'text/csv') }
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Export</div>
        <button onClick={onCSV} className="btn btn-primary disabled:opacity-50" disabled={!rows?.length}>Download CSV</button>
      </div>
      {!rows?.length && <div className="text-sm text-gray-500 mt-2">No Data</div>}
    </div>
  )
}
