import React from 'react'

type Props = { videoIdOrUrl: string }

/** Compact number formatter that guarantees ≤ 4 visible characters.
 *  Examples: 344K, 8.3K, 12M, 1.2B, 999, 1.0K → 1K, etc.
 */
function compact4(n: number | null | undefined): string {
  if (n === null || n === undefined || !isFinite(n)) return '—'
  const sign = n < 0 ? '-' : ''
  const abs = Math.abs(n)

  // helper that tries 1 decimal, then 0 decimals to keep len ≤ 4 including suffix
  const fmt = (val: number, suf: string) => {
    let s = val >= 10 ? Math.round(val).toString() : val.toFixed(1) // 0–9.9 -> 1 dp
    s = s.replace(/\.0$/, '')
    // if still too long with suffix, drop decimal
    if ((sign + s + suf).length > 4) {
      s = Math.round(val).toString()
    }
    // last resort trim
    while ((sign + s + suf).length > 4 && s.length > 1) s = s.slice(0, -1)
    return sign + s + suf
  }

  if (abs < 1000) {
    let s = Math.round(abs).toString()
    if ((sign + s).length > 4) s = s.slice(0, 4 - sign.length)
    return sign + s
  }
  if (abs < 1e6) return fmt(abs / 1e3, 'K')
  if (abs < 1e9) return fmt(abs / 1e6, 'M')
  return fmt(abs / 1e9, 'B')
}

/** Percentage with 1 decimal (e.g., "2.5%"). */
function pct(n: number | null | undefined) {
  if (n === null || n === undefined || !isFinite(n)) return '—'
  return `${(n * 100).toFixed(1)}%`
}

/** KPI cell: no truncate on the value to avoid clipping; tabular numerals keep widths stable. */
function Kpi({
  icon,
  value,
  label,
  title,
}: {
  icon: React.ReactNode
  value: React.ReactNode
  label?: string
  title?: string
}) {
  return (
    <div className="flex items-center gap-2 min-w-0" title={title || (typeof value === 'string' ? value : undefined)}>
      <span className="shrink-0 text-lg">{icon}</span>
      <div className="min-w-0">
        <div className="font-semibold leading-5 tabular-nums">{value}</div>
        {label ? <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div> : null}
      </div>
    </div>
  )
}

export function VideoMetaCard({ videoIdOrUrl }: Props) {
  const [meta, setMeta] = React.useState<any>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!videoIdOrUrl) return
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5177'
        const res = await fetch(`${API_BASE}/api/video_meta?videoId=${encodeURIComponent(videoIdOrUrl)}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Failed')
        if (!cancelled) setMeta(data)
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [videoIdOrUrl])

  if (!videoIdOrUrl) return <div className="card p-4 text-center text-gray-500">No Data</div>
  if (loading) return <div className="card card-ghost p-4 h-[176px]" />
  if (error) return <div className="card p-4 text-red-600">Video info error: {error}</div>
  if (!meta) return <div className="card p-4 text-center text-gray-500">No Data</div>

  const thumb = meta.thumbnails?.high?.url || meta.thumbnails?.medium?.url || meta.thumbnails?.default?.url

  const views = Number(meta.viewCount || 0)
  const likes = Number(meta.likeCount || 0)
  const comments = Number(meta.commentCount || 0)

  const subs = meta.channel?.subscriberCount ?? null

  const engagement = views > 0 ? (likes + comments) / views : null

  return (
    <a href={meta.url} target="_blank" rel="noreferrer" className="block card overflow-hidden hover:shadow-lg transition h-full">
      {/* top row */}
      <div className="p-4 flex gap-4 items-start">
        {thumb && (
          <img
            src={thumb}
            alt={meta.title}
            className="w-[180px] h-[100px] md:w-[220px] md:h-[124px] object-cover rounded-xl shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-[18px] md:text-[19px] font-semibold mb-1 leading-snug line-clamp-2">
            {meta.title}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{meta.channelTitle}</div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-5 gap-x-6 gap-y-3">
          <Kpi icon="👁️" value={compact4(views)} title="Views" />
          <Kpi icon="👍" value={compact4(likes)} title="Likes" />
          <Kpi icon="💬" value={compact4(comments)} title="Comments" />
          <Kpi icon="📈" value={pct(engagement)} title="Engagmement ([likes + comments] / views)" />
          <Kpi icon="👤" value={compact4(subs)} title="Channel subscribers" />
        </div>
      </div>
    </a>
  )
}
