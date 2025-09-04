/**
 * ExportPanel
 * -----------
 * WHAT: CSV export of currently visible scored rows.
 * WHY: Provides a quick way to take the analysis elsewhere.
 */
import React from 'react'
import { toCSV, download } from '../../utils/export'
import { type ScoredRow } from '../../utils/scoring'

export function ExportPanel({ rows }:{ rows: ScoredRow[] }){
  const onCSV = () => { const csv = toCSV(rows); download('comments_scored.csv', csv, 'text/csv') }
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Export</div>
        <button onClick={onCSV} className="btn btn-primary">Download CSV</button>
      </div>
    </div>
  )
}
