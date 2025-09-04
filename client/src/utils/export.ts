/**
 * -----------------------------------------------------------------------------
 * CSV & Client-Side Download Utilities
 * -----------------------------------------------------------------------------
 * PURPOSE
 *   - `toCSV(rows)`: Convert an array of scored comment rows into a CSV string
 *     with a stable, documented column order.
 *   - `download(filename, content, type)`: Trigger a browser download for an
 *     in-memory string (e.g., the CSV produced by `toCSV`).
 *
 * DATA SHAPE EXPECTATIONS
 *   Each `row` is expected to look like the scored comment records we render in
 *   tables:
 *     {
 *       id: string,
 *       authorDisplayName: string,
 *       authorCountry?: string | null,
 *       authorSubscriberCount?: number | null,
 *       likeCount: number,
 *       totalReplyCount: number,
 *       base?: number,       // sentiment on parent
 *       adjusted?: number,   // sentiment with weighting
 *       textOriginal: string,
 *       publishedAt: string  // ISO
 *     }
 *
 * DESIGN DECISIONS
 *   - **Stable header order**: Consumers (Sheets, BI tools) rely on consistent
 *     column positions. Any additions should be appended to avoid breaking
 *     parsers that use positional mapping.
 *   - **Excel-safe quoting**: Every field is wrapped in double quotes and any
 *     internal quotes are escaped (`""`). This also preserves commas and
 *     newlines found inside text bodies.
 *   - **Number formatting**: `base`/`adjusted` use `.toFixed(4)` when present
 *     to keep column width stable and avoid scientific notation in CSV
 *     consumers. Other numeric fields are left as-is.
 *   - **Newlines**: We join with `\n` (LF). Most tools accept LF; if your
 *     downstream requires CRLF, swap joiner at call-site.
 *
 * SCALING / LIMITATIONS
 *   - For very large datasets, this builds the entire CSV in memory. If you
 *     need streaming, move CSV emission to the server or use a streaming
 *     writer in the client with `ReadableStream`.
 *   - **CSV injection**: This utility does not sanitize formula injection
 *     (fields beginning with `=`, `+`, `-`, `@`). If exporting to Excel and
 *     untrusted content is included, consider prefixing such fields with a
 *     single quote `'` at the call-site.
 * -----------------------------------------------------------------------------
 */
export function toCSV(rows: any[]) {
  if (!rows?.length) return ''

  // The canonical column order for exports.
  const headers = [
    'id',
    'authorDisplayName',
    'authorCountry',
    'authorSubscriberCount',
    'likeCount',
    'totalReplyCount',
    'base',
    'adjusted',
    'textOriginal',
    'publishedAt',
  ]

  // RFC-4180–style quoting:
  // - Wrap every field in double quotes
  // - Escape any internal quotes by doubling them
  const escape = (v: any) => {
    if (v == null) return ''
    const s = String(v).replace(/"/g, '""')
    return `"${s}"`
  }

  const lines = [headers.join(',')]

  for (const r of rows) {
    // Keep values aligned with headers above.
    const vals = [
      r.id,
      r.authorDisplayName,
      r.authorCountry ?? '',
      r.authorSubscriberCount ?? '',
      r.likeCount,
      r.totalReplyCount,
      r.base?.toFixed?.(4) ?? '',
      r.adjusted?.toFixed?.(4) ?? '',
      r.textOriginal,
      r.publishedAt,
    ]
    lines.push(vals.map(escape).join(','))
  }

  return lines.join('\n')
}

/**
 * -----------------------------------------------------------------------------
 * download(filename, content, type)
 * -----------------------------------------------------------------------------
 * PURPOSE
 *   Trigger a browser download for string content (e.g., CSV) without hitting
 *   the network.
 *
 * USAGE
 *   const csv = toCSV(rows)
 *   download(`comments-${videoId}.csv`, csv, 'text/csv')
 *
 * DESIGN NOTES
 *   - Uses a temporary ObjectURL and revokes it immediately after `click()`
 *     to avoid leaking Blob URLs in long-lived sessions.
 *   - `type` defaults to `text/plain`. For CSV, pass `'text/csv'`.
 *   - For best Excel compatibility (especially on Windows), callers may choose
 *     to prepend a BOM: `const content = '\\uFEFF' + csv` before calling.
 *
 * CAVEATS
 *   - Some older Safari versions may require the anchor to be attached to the
 *     DOM before clicking; if you see issues, append `a` to `document.body`,
 *     click, then remove. We keep the simple approach here for modern browsers.
 * -----------------------------------------------------------------------------
 */
export function download(filename: string, content: string, type = 'text/plain') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
