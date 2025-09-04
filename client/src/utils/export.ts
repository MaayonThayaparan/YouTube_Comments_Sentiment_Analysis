export function toCSV(rows: any[]) {
  if (!rows?.length) return ''
  const headers = ['id','authorDisplayName','authorCountry','authorSubscriberCount','likeCount','totalReplyCount','base','adjusted','textOriginal','publishedAt']
  const escape = (v:any) => { if (v == null) return ''; const s = String(v).replace(/"/g, '""'); return `"${s}"` }
  const lines = [headers.join(',')]
  for (const r of rows) {
    const vals = [ r.id, r.authorDisplayName, r.authorCountry ?? '', r.authorSubscriberCount ?? '', r.likeCount, r.totalReplyCount, r.base?.toFixed?.(4) ?? '', r.adjusted?.toFixed?.(4) ?? '', r.textOriginal, r.publishedAt ]
    lines.push(vals.map(escape).join(','))
  }
  return lines.join('\n')
}
export function download(filename: string, content: string, type='text/plain') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url)
}
