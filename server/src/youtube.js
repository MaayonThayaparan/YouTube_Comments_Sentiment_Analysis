/**
 * YouTube REST helpers — v12 (enriched)
 * WHAT:
 *   - Extracts comments & replies
 *   - Enriches unique authors via channels.list to get country + subscriberCount
 *   - Enriched single video metadata with contentDetails + channel stats + derived metrics
 * WHY:
 *   - Enables country/subs filters across charts & tables
 *   - Exposes richer VideoMetaCard KPIs (duration, age, engagement, channel totals)
 * NOTES:
 *   - Country is channel-level, not per-comment location. It's often blank.
 *   - subscriberCount may be hidden; we emit null in that case.
 */
import axios from "axios";
const YT_API = "https://www.googleapis.com/youtube/v3";

/* ------------------------------------------------------------------------- */
/* Utilities                                                                 */
/* ------------------------------------------------------------------------- */

/** Parse ISO8601 duration (PT#H#M#S) into total seconds; returns null if unknown. */
function isoDurationToSeconds(iso) {
  if (!iso) return null;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return null;
  const h = parseInt(m[1] || "0", 10);
  const mi = parseInt(m[2] || "0", 10);
  const s = parseInt(m[3] || "0", 10);
  return h * 3600 + mi * 60 + s;
}

export function parseVideoId(input) {
  try {
    if (!input) return null;
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
    const url = new URL(input);
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1);
    if (url.searchParams.get("v")) return url.searchParams.get("v");
    const parts = url.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    if (/^[a-zA-Z0-9_-]{11}$/.test(last)) return last;
    return null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------------- */
/* Channel enrichment for authors (used by comments)                         */
/* ------------------------------------------------------------------------- */

/** Batch-fetch channel metadata for author enrichment. */
async function fetchChannelsMeta(channelIds, API_KEY) {
  const uniq = Array.from(new Set(channelIds)).filter(Boolean);
  const meta = new Map();
  for (let i = 0; i < uniq.length; i += 50) {
    const batch = uniq.slice(i, i + 50);
    const { data } = await axios.get(`${YT_API}/channels`, {
      params: { key: API_KEY, id: batch.join(","), part: "snippet,statistics" },
    });
    for (const c of data.items || []) {
      const id = c.id;
      const sn = c.snippet || {};
      const st = c.statistics || {};
      meta.set(id, {
        country: sn.country || null,
        subscriberCount: st.hiddenSubscriberCount
          ? null
          : st.subscriberCount
          ? Number(st.subscriberCount)
          : null,
      });
    }
  }
  return meta;
}

/* ------------------------------------------------------------------------- */
/* Comments pipeline                                                         */
/* ------------------------------------------------------------------------- */

/**
 * Pull all commentThreads (+remaining replies via /comments when needed).
 * onProgress gets page counters so UI can render "page x/y".
 */
export async function fetchAllComments(
  videoId,
  API_KEY,
  maxPages = 200,
  onProgress,
  throttleMs = Number(process.env.YT_THROTTLE_MS || 200)
) {
  const allThreads = [];
  let pageToken = undefined;
  let pages = 0;
  let totalPages = 0;
  do {
    const { data } = await axios.get(`${YT_API}/commentThreads`, {
      params: { key: API_KEY, part: "snippet,replies", videoId, maxResults: 100, pageToken },
    });
    if (!totalPages) {
      const totalResults = Number(data?.pageInfo?.totalResults || 0);
      const per = Number(data?.pageInfo?.resultsPerPage || 100) || 100;
      totalPages = totalResults ? Math.ceil(totalResults / per) : 0;
    }
    pages++;
    onProgress && onProgress({ fetchedPages: pages, totalPages });
    for (const item of data.items || []) allThreads.push(item);
    pageToken = data.nextPageToken || undefined;
    if (throttleMs) await new Promise((r) => setTimeout(r, throttleMs));
  } while (pageToken && pages < maxPages);

  // Normalize and collect channelIds for enrichment
  const normalized = [];
  const channelIds = new Set();
  for (const t of allThreads) {
    const top = t.snippet.topLevelComment.snippet;
    const topChan = top.authorChannelId?.value || null;
    if (topChan) channelIds.add(topChan);
    let replies = [];
    if (t.replies && Array.isArray(t.replies.comments)) {
      replies = t.replies.comments.map((c) => {
        const sn = c.snippet;
        const ch = sn.authorChannelId?.value || null;
        if (ch) channelIds.add(ch);
        return {
          id: c.id,
          textOriginal: sn.textOriginal,
          likeCount: sn.likeCount || 0,
          authorDisplayName: sn.authorDisplayName,
          authorChannelId: ch,
          publishedAt: sn.publishedAt,
        };
      });
    }
    normalized.push({
      id: t.snippet.topLevelComment.id,
      textOriginal: top.textOriginal,
      likeCount: top.likeCount || 0,
      authorDisplayName: top.authorDisplayName,
      authorChannelId: topChan,
      publishedAt: top.publishedAt,
      totalReplyCount: t.snippet.totalReplyCount || 0,
      replies,
    });
  }

  // Enrich authors with country + subscriberCount
  const metaMap = await fetchChannelsMeta(Array.from(channelIds), API_KEY);
  for (const item of normalized) {
    const m = item.authorChannelId ? metaMap.get(item.authorChannelId) : null;
    item.authorCountry = m?.country || null;
    item.authorSubscriberCount = m?.subscriberCount ?? null;
    for (const r of item.replies) {
      const rm = r.authorChannelId ? metaMap.get(r.authorChannelId) : null;
      r.authorCountry = rm?.country || null;
      r.authorSubscriberCount = rm?.subscriberCount ?? null;
    }
  }
  return normalized;
}

/* ------------------------------------------------------------------------- */
/* Enriched single-video metadata                                            */
/* ------------------------------------------------------------------------- */

export async function fetchVideoMeta(videoId, API_KEY) {
  // 1) Fetch video core fields + content details
  const { data: vData } = await axios.get(`${YT_API}/videos`, {
    params: { key: API_KEY, id: videoId, part: "snippet,statistics,contentDetails" },
  });
  const item = (vData.items && vData.items[0]) || null;
  if (!item) return null;

  const sn = item.snippet || {};
  const st = item.statistics || {};
  const cd = item.contentDetails || {};

  const viewCount = st.viewCount ? Number(st.viewCount) : 0;
  // Like / comment may be missing if disabled; keep them as null
  const likeCount = st.likeCount !== undefined ? Number(st.likeCount) : null;
  const commentCount = st.commentCount !== undefined ? Number(st.commentCount) : null;

  // 2) Enrich with channel record
  let channel = null;
  if (sn.channelId) {
    const { data: cData } = await axios.get(`${YT_API}/channels`, {
      params: { key: API_KEY, id: sn.channelId, part: "snippet,statistics" },
    });
    const c = (cData.items && cData.items[0]) || null;
    if (c) {
      const csn = c.snippet || {};
      const cst = c.statistics || {};
      channel = {
        id: c.id,
        title: csn.title || null,
        customUrl: csn.customUrl || null,
        country: csn.country || null,
        publishedAt: csn.publishedAt || null,
        subscriberCount: cst.hiddenSubscriberCount
          ? null
          : cst.subscriberCount
          ? Number(cst.subscriberCount)
          : null,
        channelViewCount: cst.viewCount ? Number(cst.viewCount) : null,
        channelVideoCount: cst.videoCount ? Number(cst.videoCount) : null,
      };
    }
  }

  // 3) Derived metrics
  const publishedAt = sn.publishedAt ? new Date(sn.publishedAt) : null;
  const ageDays = publishedAt
    ? Math.max(0, Math.floor((Date.now() - publishedAt.getTime()) / 86_400_000))
    : null;

  const likesSafe = likeCount ?? 0;
  const commentsSafe = commentCount ?? 0;
  const engagementRate = viewCount > 0 ? (likesSafe + commentsSafe) / viewCount : null;
  const likeRate = viewCount > 0 && likeCount != null ? likeCount / viewCount : null;
  const commentRate = viewCount > 0 && commentCount != null ? commentCount / viewCount : null;

  const durationISO = cd.duration || null;
  const durationSec = isoDurationToSeconds(durationISO);
  const definition = cd.definition || null;

  return {
    // identifiers
    videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,

    // snippet
    title: sn.title,
    description: sn.description || null,
    channelId: sn.channelId || null,
    channelTitle: sn.channelTitle || null,
    thumbnails: sn.thumbnails || {},
    publishedAt: sn.publishedAt || null,
    categoryId: sn.categoryId || null,

    // content details
    durationISO,
    durationSec,
    definition,

    // raw stats (likes/comments can be null if disabled/hidden)
    viewCount,
    likeCount,
    commentCount,

    // derived
    engagementRate, // (likes+comments)/views
    likeRate,       // likes/views
    commentRate,    // comments/views
    ageDays,        // days since publish

    // channel enrichment
    channel,        // {id,title,customUrl,country,publishedAt,subscriberCount,channelViewCount,channelVideoCount}
  };
}
