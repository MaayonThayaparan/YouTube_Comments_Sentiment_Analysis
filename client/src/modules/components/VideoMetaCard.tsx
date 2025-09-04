import React from 'react'
type Props = { videoIdOrUrl: string }
function compact(n:number){ return new Intl.NumberFormat(undefined, { notation: 'compact' }).format(n) }
export function VideoMetaCard({ videoIdOrUrl }: Props){
  const [meta, setMeta] = React.useState<any>(null); const [error, setError] = React.useState<string|null>(null); const [loading, setLoading] = React.useState(false)
  React.useEffect(()=>{
    if(!videoIdOrUrl) return
    let cancelled=false
    ;(async()=>{
      try{
        setLoading(true); setError(null)
        const API_BASE=import.meta.env.VITE_API_BASE||'http://localhost:5177'
        const res=await fetch(`${API_BASE}/api/video_meta?videoId=${encodeURIComponent(videoIdOrUrl)}`)
        const data=await res.json()
        if(!res.ok) throw new Error(data?.error||'Failed')
        if(!cancelled) setMeta(data)
      }catch(e:any){
        if(!cancelled) setError(e.message||'Failed to load')
      }finally{
        if(!cancelled) setLoading(false)
      }
    })()
    return ()=>{ cancelled=true }
  }, [videoIdOrUrl])

  if (loading) return <div className="card card-ghost p-4 h-28"></div>
  if (error) return <div className="card p-4 text-red-600">Video info error: {error}</div>
  if (!meta) return null
  const thumb = meta.thumbnails?.high?.url || meta.thumbnails?.medium?.url || meta.thumbnails?.default?.url
  return (
    <a href={meta.url} target="_blank" rel="noreferrer" className="block card overflow-hidden hover:shadow-lg transition">
      <div className="flex gap-4 p-4">
        {thumb && <img src={thumb} alt={meta.title} className="w-40 h-24 object-cover rounded-xl" />}
        <div className="flex-1">
          <div className="text-lg font-semibold mb-1 line-clamp-2">{meta.title}</div>
          <div className="text-sm text-gray-500 mb-2">{meta.channelTitle}</div>
          <div className="flex gap-4 text-sm">
            <span title={`${meta.viewCount} views`}>👁️ {compact(meta.viewCount)} views</span>
            <span title={`${meta.likeCount} likes`}>👍 {compact(meta.likeCount)} likes</span>
            <span title={`${meta.commentCount} comments`}>💬 {compact(meta.commentCount)} comments</span>
          </div>
        </div>
      </div>
    </a>
  )
}
