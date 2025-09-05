/**
 * export.ts — Data export utilities
 * -----------------------------------------------------------------------------
 * WHAT:
 *   - Converts sentiment-scored rows into CSV format.
 *   - Triggers client-side file downloads (CSV, JSON, etc.).
 *
 * WHY:
 *   - Enables end-users to extract analyzed data for offline processing,
 *     reporting, or sharing with external tools (Excel, Google Sheets).
 *
 * NOTES:
 *   - CSV escaping handles quotes by doubling (per RFC 4180).
 *   - Export is synchronous — large datasets may freeze the browser tab.
 *   - Consider streaming or worker-based CSV generation for >100k rows.
 */

/* -------------------------------------------------------------------------- */
/* CSV Conversion                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Convert an array of objects (rows) into CSV format.
 *
 * @param rows - Array of row objects, expected to match ThreadItem/ScoredRow shape.
 * @returns    - CSV string with headers + escaped values.
 *
 * HOW:
 *   - Defines explicit column order in `headers`.
 *   - Escapes fields by wrapping in quotes and doubling any internal quotes.
 *   - Serializes all rows consistently, including null/undefined as empty string.
 */
export function toCSV(rows: any[]): string {
  if (!rows?.length) return "";

  const headers = [
    "id",
    "authorDisplayName",
    "authorCountry",
    "authorSubscriberCount",
    "likeCount",
    "totalReplyCount",
    "base",
    "adjusted",
    "textOriginal",
    "publishedAt",
  ];

  // Escape CSV field: wrap in quotes, double-escape inner quotes
  const escape = (v: any) => {
    if (v == null) return "";
    const s = String(v).replace(/"/g, '""');
    return `"${s}"`;
  };

  const lines = [headers.join(",")];

  for (const r of rows) {
    const vals = [
      r.id,
      r.authorDisplayName,
      r.authorCountry ?? "",
      r.authorSubscriberCount ?? "",
      r.likeCount,
      r.totalReplyCount,
      r.base?.toFixed?.(4) ?? "",
      r.adjusted?.toFixed?.(4) ?? "",
      r.textOriginal,
      r.publishedAt,
    ];
    lines.push(vals.map(escape).join(","));
  }

  return lines.join("\n");
}

/* -------------------------------------------------------------------------- */
/* Download Helper                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Trigger a client-side file download (any text-based content).
 *
 * @param filename - File name to save (e.g., "export.csv").
 * @param content  - File content (string).
 * @param type     - MIME type (default: "text/plain").
 *
 * HOW:
 *   - Uses Blob + ObjectURL to create temporary file handle.
 *   - Programmatically clicks an anchor to trigger download.
 *   - Immediately revokes URL to free memory.
 */
export function download(
  filename: string,
  content: string,
  type = "text/plain"
) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}
