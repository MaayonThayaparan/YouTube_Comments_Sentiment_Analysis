/**
 * YouTube REST helpers
 * --------------------
 * WHAT: Thin wrappers over YouTube Data API v3 endpoints for videos, commentThreads and comments.
 * WHY: We centralize HTTP flows + normalization here so other modules can be purely about scoring.
 * NOTES:
 *  - `fetchAllComments` paginates commentThreads and (if necessary) replies via the `comments` endpoint.
 *  - We expose `throttleMs` to respect API quotas and avoid accidental burst traffic.
 */
import axios from "axios"
const YT_API = "https://www.googleapis.com/youtube/v3"

/** Extract a canonical 11-char YouTube videoId from either a raw ID or any watch/share URL. */
export function parseVideoId(input){
  try{
    if(!input) return null
    // Raw 11-character ID
    if(/^[a-zA-Z0-9_-]{11}$/.test(input)) return input
    // URL cases (youtu.be short, youtube.com with v param, last path segment fallback)
    const url = new URL(input)
    if(url.hostname.includes("youtu.be")) return url.pathname.slice(1)
    if(url.searchParams.get("v")) return url.searchParams.get("v")
    const parts = url.pathname.split("/").filter(Boolean)
    const last = parts[parts.length-1]
    if(/^[a-zA-Z0-9_-]{11}$/.test(last)) return last
    return null
  }catch{ return null }
}

/**
 * Fetch all top-level comments + replies.
 * We first download commentThreads (includes some replies). If reported reply count
 * exceeds the embedded list, we paginate the remaining replies via the /comments endpoint.
 * We normalize each item to a stable shape the client expects.
 */
export async function fetchAllComments(videoId,API_KEY,maxPages=200,onProgress,throttleMs=Number(process.env.YT_THROTTLE_MS||200)){
  const allThreads=[]; let pageToken=undefined; let pages=0
  do{
    const {data}=await axios.get(`${YT_API}/commentThreads`,{params:{key:API_KEY,part:"snippet,replies",videoId,maxResults:100,pageToken}})
    pages++; onProgress && onProgress({ fetchedPages: pages })
    for(const item of (data.items||[])) allThreads.push(item)
    pageToken = data.nextPageToken || undefined
    if(throttleMs) await new Promise(r=>setTimeout(r,throttleMs))
  }while(pageToken && pages<maxPages)

  const normalized=[]
  for(const t of allThreads){
    const top=t.snippet.topLevelComment.snippet
    const totalReplyCount=t.snippet.totalReplyCount||0
    let replies=[]
    // replies that arrive embedded on commentThreads
    if(t.replies && Array.isArray(t.replies.comments)){
      replies=t.replies.comments.map(c=>({
        id:c.id,
        textOriginal:c.snippet.textOriginal,
        likeCount:c.snippet.likeCount||0,
        authorDisplayName:c.snippet.authorDisplayName,
        publishedAt:c.snippet.publishedAt
      }))
    }
    // if API reports more replies than embedded, paginate the rest
    if(totalReplyCount>replies.length){
      let replyPageToken=undefined
      do{
        const {data}=await axios.get(`${YT_API}/comments`,{params:{key:API_KEY,part:"snippet",parentId:t.snippet.topLevelComment.id,maxResults:100,pageToken:replyPageToken}})
        replyPageToken=data.nextPageToken||undefined
        for(const c of (data.items||[])){
          replies.push({
            id:c.id,
            textOriginal:c.snippet.textOriginal,
            likeCount:c.snippet.likeCount||0,
            authorDisplayName:c.snippet.authorDisplayName,
            publishedAt:c.snippet.publishedAt
          })
        }
        if(throttleMs) await new Promise(r=>setTimeout(r,throttleMs))
      }while(replyPageToken)
    }
    normalized.push({
      id:t.snippet.topLevelComment.id,
      textOriginal:top.textOriginal,
      likeCount:top.likeCount||0,
      authorDisplayName:top.authorDisplayName,
      publishedAt:top.publishedAt,
      totalReplyCount,
      replies
    })
  }
  return normalized
}

/** Lightweight metadata for the video card (thumbnail, channel, counts, link). */
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
