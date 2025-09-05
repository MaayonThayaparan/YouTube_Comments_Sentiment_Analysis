/**
 * ExportPanel
 * ---------------------------------------------------------------------------
 * Provides a single action to export the currently scored rows as a CSV file.
 *
 * Behavior:
 *  - If there are rows: enables a "Download CSV" button that generates a file
 *    with a fixed filename (`comments_scored.csv`).
 *  - If no rows are present: disables the button and shows a "No Data" message.
 *
 * Why:
 *  - Keeps export functionality isolated in one panel so it can be reused or
 *    swapped out later (e.g., add JSON, XLSX, or API push).
 *  - Uses utility functions `toCSV` and `download` from `utils/export` for
 *    separation of concerns (logic vs. UI).
 */

import React from 'react'
import { toCSV, download } from '../../utils/export'
import { type ScoredRow } from '../../utils/scoring'


export function ExportPanel({ rows }: { rows: ScoredRow[] }) {
  /** Handles the CSV export action. Converts rows → CSV string → triggers download. */
  const onCSV = () => {
    const csv = toCSV(rows)
    download('comments_scored.csv', csv, 'text/csv')
  }

  return (
    <div className="card p-4">
      {/* Header row: title + action button */}
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Export</div>

        <button
          onClick={onCSV}
          className="btn btn-primary disabled:opacity-50"
          disabled={!rows?.length}
        >
          Download CSV
        </button>
      </div>

      {/* Empty state (only visible when rows array is empty) */}
      {!rows?.length && (
        <div className="text-sm text-gray-500 mt-2">No Data</div>
      )}
    </div>
  )
}
