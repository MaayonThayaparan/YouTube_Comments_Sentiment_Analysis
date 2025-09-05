/**
 * SummaryPanel
 * ---------------------------------------------------------------------------
 * Displays the AI-generated summary of comment sentiment.
 *
 * Features:
 * - Header row with "AI Summary" title and a button:
 *     - Button label switches between "Summarize" and "Re-summarize"
 *     - Disabled while a summary request is in progress
 * - Body states:
 *     - Loading ........ shows "Summarizing…"
 *     - No data ........ shows "No data yet."
 *     - Error .......... shows error message (only if there is data)
 *     - Success ........ shows the AI summary (preserves line breaks)
 *
 * Usage:
 * <SummaryPanel
 *   summary={summary}
 *   loading={summaryLoading}
 *   error={summaryError}
 *   hasData={items.length > 0}
 *   onResummarize={() => fetchSummary(allTexts)}
 * />
 */

import React from "react";

type Props = {
  summary: string | null;
  loading: boolean;
  error: string | null;
  hasData: boolean;
  onResummarize: () => void;
};

export function SummaryPanel({
  summary,
  loading,
  error,
  hasData,
  onResummarize,
}: Props) {
  return (
    <div className="card p-4">
      {/* Header row with title + button */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">AI Summary</h3>

        {hasData && (
          <button
            className="btn btn-primary text-sm px-3 py-1.5"
            onClick={onResummarize}
            disabled={loading}
          >
            {summary ? "Re-summarize" : "Summarize"}
          </button>
        )}
      </div>

      {/* Body */}
      {loading && <div className="text-sm text-gray-500">Summarizing…</div>}

      {!loading && !hasData && (
        <div className="text-sm text-gray-500">No data yet.</div>
      )}

      {!loading && error && hasData && (
        <div className="text-red-600 mb-2">{error}</div>
      )}

      {!loading && summary && hasData && (
        <p className="whitespace-pre-wrap">{summary}</p>
      )}
    </div>
  );
}
