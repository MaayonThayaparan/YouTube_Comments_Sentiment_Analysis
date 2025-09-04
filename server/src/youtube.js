/**
 * YouTube REST helpers — v11
 * WHAT:
 *   - Extracts comments & replies
 *   - Enriches unique authors via channels.list to get country + subscriberCount
 * WHY:
 *   - Enables country/subs filters across charts & tables
 * NOTES:
 *   - Country is channel-level, not per-comment location. It's often blank.
 *   - subscriberCount may be hidden; we emit null in that case.
 */
import axios from "axios"
const YT_API = "https://www.googleapis.com/youtube/v3"

export function parseVideoId(input){
  try{
    if(!input) return null
    if(/^[a-zA-Z0-9_-]{11}$/.test(input)) return input
    const url = new URL(input)
    if(url.hostname.includes("youtu.be")) return url.pathname.slice(1)
    if(url.searchParams.get("v")) return url.searchParams.get("v")
    const parts = url.pathname.split("/").filter(Boolean)
    const last = parts[parts.length-1]
    if(/^[a-zA-Z0-9_-]{11}$/.test(last)) return last
    return null
  }catch{ return null }
}

/** Batch-fetch channel metadata for author enrichment. */
async function fetchChannelsMeta(channelIds, API_KEY){
  const uniq = Array.from(new Set(channelIds)).filter(Boolean)
  const meta = new Map()
  for (let i=0;i<uniq.length;i+=50){
    const batch = uniq.slice(i, i+50)
    const {data} = await axios.get(`${YT_API}/channels`, {
      params: { key: API_KEY, id: batch.join(','), part: 'snippet,statistics' }
    })
    for (const c of (data.items||[])){
      const id = c.id
      const sn = c.snippet || {}
      const st = c.statistics || {}
      meta.set(id, {
        country: sn.country || null,
        subscriberCount: st.hiddenSubscriberCount ? null : (st.subscriberCount ? Number(st.subscriberCount) : null)
      })
    }
  }
  return meta
}

/**
 * Pull all commentThreads (+remaining replies via /comments when needed).
 * onProgress gets page counters so UI can render "page x/y".
 */
export async function fetchAllComments(videoId,API_KEY,maxPages=200,onProgress,throttleMs=Number(process.env.YT_THROTTLE_MS||200)){
  const allThreads=[]; let pageToken=undefined; let pages=0; let totalPages=0
  do{
    const {data}=await axios.get(`${YT_API}/commentThreads`,{params:{key:API_KEY,part:"snippet,replies",videoId,maxResults:100,pageToken}})
    if(!totalPages){
      const totalResults = Number(data?.pageInfo?.totalResults||0)
      const per = Number(data?.pageInfo?.resultsPerPage||100) || 100
      totalPages = totalResults ? Math.ceil(totalResults / per) : 0
    }
    pages++; onProgress && onProgress({ fetchedPages: pages, totalPages })
    for(const item of (data.items||[])) allThreads.push(item)
    pageToken = data.nextPageToken || undefined
    if(throttleMs) await new Promise(r=>setTimeout(r,throttleMs))
  }while(pageToken && pages<maxPages)

  // Normalize and collect channelIds for enrichment
  const normalized=[]; const channelIds=new Set()
  for(const t of allThreads){
    const top=t.snippet.topLevelComment.snippet
    const topChan = top.authorChannelId?.value || null
    if (topChan) channelIds.add(topChan)
    let replies=[]
    if(t.replies && Array.isArray(t.replies.comments)){
      replies=t.replies.comments.map(c=>{
        const sn=c.snippet
        const ch=sn.authorChannelId?.value || null
        if (ch) channelIds.add(ch)
        return { id:c.id, textOriginal:sn.textOriginal, likeCount:sn.likeCount||0, authorDisplayName:sn.authorDisplayName, authorChannelId: ch, publishedAt:sn.publishedAt }
      })
    }
    normalized.push({
      id:t.snippet.topLevelComment.id,
      textOriginal:top.textOriginal,
      likeCount:top.likeCount||0,
      authorDisplayName:top.authorDisplayName,
      authorChannelId: topChan,
      publishedAt:top.publishedAt,
      totalReplyCount:t.snippet.totalReplyCount||0,
      replies
    })
  }

  // Enrich authors with country + subscriberCount
  const metaMap = await fetchChannelsMeta(Array.from(channelIds), API_KEY)
  for (const item of normalized){
    const m = item.authorChannelId ? metaMap.get(item.authorChannelId) : null
    item.authorCountry = m?.country || null
    item.authorSubscriberCount = (m?.subscriberCount ?? null)
    for (const r of item.replies){
      const rm = r.authorChannelId ? metaMap.get(r.authorChannelId) : null
      r.authorCountry = rm?.country || null
      r.authorSubscriberCount = (rm?.subscriberCount ?? null)
    }
  }
  return normalized
}

export async function fetchVideoMeta(videoId,API_KEY){
  const{data}=await axios.get(`${YT_API}/videos`,{params:{key:API_KEY,id:videoId,part:"snippet,statistics"}})
  const item=(data.items&&data.items[0])||null
  if(!item) return null
  const sn=item.snippet||{}, st=item.statistics||{}
  return {
    videoId,
    title: sn.title,
    channelTitle: sn.channelTitle,
    thumbnails: sn.thumbnails||{},
    viewCount: Number(st.viewCount||0),
    likeCount: Number(st.likeCount||0),
    commentCount: Number(st.commentCount||0),
    url: `https://www.youtube.com/watch?v=${videoId}`
  }
}
