/**
 * ExportPanel — CSV export of the currently filtered/weighted dataset
 * -----------------------------------------------------------------------------
 * WHAT
 *   Minimal panel that exposes a single "Download CSV" action. It exports the
 *   *exact* rows passed in (typically the globally filtered + scored set) using
 *   utils/export.{toCSV,download}.
 *
 * KEY DECISIONS
 *   - Keep CSV shape stable: the export helper owns headers/escaping so this
 *     component stays dumb/presentational.
 *   - Disable the button when there are no rows; show a small "No Data" hint.
 *   - No async state here (export is synchronous in-browser).
 *
 * CONTRACT
 *   props.rows : ScoredRow[]
 *     The array to export. Caller should pass whatever slice is visible /
 *     relevant (e.g., post-filters). This component will not mutate/sort it.
 */

import React from 'react'
import { toCSV, download } from '../../utils/export'
import { type ScoredRow } from '../../utils/scoring'

export function ExportPanel({ rows }:{ rows: ScoredRow[] }){
  // Click handler: stringify rows → Blob → trigger a client-side download.
  // - toCSV returns a headered, properly escaped CSV string.
  // - download creates an object URL and clicks a temporary <a>.
  const onCSV = () => {
    const csv = toCSV(rows)            // stable column order + quote escaping
    download('comments_scored.csv', csv, 'text/csv')
  }

  return (
    <div className="card p-4">
      {/* Header row: title + primary action */}
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Export</div>
        <button
          onClick={onCSV}
          className="btn btn-primary disabled:opacity-50"
          disabled={!rows?.length}     // UX: avoid exporting an empty file
        >
          Download CSV
        </button>
      </div>

      {/* Empty state hint (kept subtle) */}
      {!rows?.length && (
        <div className="text-sm text-gray-500 mt-2">No Data</div>
      )}
    </div>
  )
}
