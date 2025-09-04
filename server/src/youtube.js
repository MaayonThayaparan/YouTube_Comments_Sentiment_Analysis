/**
 * -----------------------------------------------------------------------------
 * YouTube REST helpers — v12 (enriched)
 * -----------------------------------------------------------------------------
 * ROLE
 *   Centralized data access layer for the YouTube Data API v3. This module:
 *   - Fetches comment threads and FULL reply trees for a single video.
 *   - Enriches authors (parent + replies) with channel country + subscribers.
 *   - Fetches single-video metadata and derives UX-friendly KPIs.
 *
 * WHY CENTRALIZE
 *   Keeping API shape normalization and pagination/rate-limit concerns here
 *   prevents HTTP handlers and UI code from duplicating fragile logic.
 *
 * SHAPE GUARANTEES
 *   fetchAllComments(videoId, key) returns an array of normalized "parent"
 *   comment objects:
 *     {
 *       id, textOriginal, likeCount, authorDisplayName,
 *       authorChannelId, authorCountry, authorSubscriberCount,
 *       publishedAt, totalReplyCount,
 *       replies: Array<{
 *         id, textOriginal, likeCount, authorDisplayName,
 *         authorChannelId, authorCountry, authorSubscriberCount,
 *         publishedAt
 *       }>
 *     }
 *
 * NOTABLE DECISIONS
 *   - Replies: We DO NOT trust `commentThreads.list(..., part=replies)` alone;
 *     YouTube only returns a small preview (~5). We detect undercount and then
 *     page all replies via `comments.list(parentId, maxResults=100)` until
 *     nextPageToken is exhausted.
 *   - Enrichment: We batch unique author channel IDs in chunks of 50 (API max)
 *     and join country + subscriberCount. Subscriber counts may be hidden; we
 *     normalize to `null` in that case.
 *   - Throttling: Each page fetch optionally sleeps `throttleMs` to be a good
 *     API citizen and to make quota consumption predictable during dev.
 *
 * QUOTA / COST NOTES
 *   - commentThreads.list: 1 unit per call
 *   - comments.list:       1 unit per call
 *   - channels.list:       1 unit per call
 *   Tight loops include a small throttle and chunking to smooth usage.
 *
 * CAVEATS
 *   - Country is channel-level, not a per-comment geolocation, and is often
 *     unset by creators. Treat as a best-effort signal.
 *   - Video likeCount/commentCount may be missing when disabled; we emit null.
 * -----------------------------------------------------------------------------
 */

import axios from "axios";
const YT_API = "https://www.googleapis.com/youtube/v3";

/* ------------------------------------------------------------------------- */
/* Utilities                                                                 */
/* ------------------------------------------------------------------------- */

/**
 * Parse ISO8601 duration (PT#H#M#S) into total seconds.
 * @param {string | null | undefined} iso
 * @returns {number | null} total seconds or null if unknown/invalid
 * Implementation: simple regex capture; absent components default to 0.
 */
function isoDurationToSeconds(iso) {
  if (!iso) return null;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return null;
  const h = parseInt(m[1] || "0", 10);
  const mi = parseInt(m[2] || "0", 10);
  const s = parseInt(m[3] || "0", 10);
  return h * 3600 + mi * 60 + s;
}

/**
 * Normalize a YouTube input (URL or bare 11-char ID) to a canonical ID.
 * Accepts:
 *   - 11 char video IDs
 *   - https://www.youtube.com/watch?v=...
 *   - https://youtu.be/...
 *   - Embedded or other path variants where the last segment is an ID.
 * @param {string} input
 * @returns {string|null} normalized 11-char ID or null when unparseable
 */
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

/**
 * Batch-fetch channel metadata for author enrichment.
 * Input may contain duplicates and falsy values; we uniq + filter first.
 * Chunk size is 50 (YouTube API max).
 * @param {string[]} channelIds
 * @param {string} API_KEY
 * @returns {Map<string, {country: string|null, subscriberCount: number|null}>}
 */
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
/* Replies pagination (child comments under a parent)                        */
/* ------------------------------------------------------------------------- */

/**
 * Fetch *all* replies for a given parent comment using comments.list.
 * We request 100 per page (API max) and follow nextPageToken to completion.
 * A small sleep between pages (throttleMs) reduces burstiness/quota spikes.
 *
 * @param {string} parentId
 * @param {string} API_KEY
 * @param {number} throttleMs polite delay between page fetches (default 200)
 * @returns {Array<{
 *   id:string, textOriginal:string, likeCount:number,
 *   authorDisplayName:string, authorChannelId:string|null, publishedAt:string
 * }>}
 */
async function fetchAllRepliesForParent(parentId, API_KEY, throttleMs = 200) {
  const out = [];
  let pageToken = undefined;
  do {
    const { data } = await axios.get(`${YT_API}/comments`, {
      params: {
        key: API_KEY,
        part: "snippet",
        parentId,
        maxResults: 100,
        pageToken,
      },
    });
    for (const it of data.items || []) {
      const sn = it.snippet;
      out.push({
        id: it.id,
        textOriginal: sn.textOriginal,
        likeCount: sn.likeCount || 0,
        authorDisplayName: sn.authorDisplayName,
        authorChannelId: sn.authorChannelId?.value || null,
        publishedAt: sn.publishedAt,
      });
    }
    pageToken = data.nextPageToken || undefined;
    if (throttleMs) await new Promise((r) => setTimeout(r, throttleMs));
  } while (pageToken);
  return out;
}

/* ------------------------------------------------------------------------- */
/* Comments pipeline                                                         */
/* ------------------------------------------------------------------------- */

/**
 * Pull all comment threads and attach FULL reply sets.
 * We also collect unique author channel IDs for enrichment in one pass.
 *
 * Pagination:
 *   - commentThreads.list(videoId, maxResults=100)
 *   - Continue while nextPageToken exists and pages < maxPages.
 *
 * Reply hydration:
 *   - Start from any preview replies included on the thread object.
 *   - If preview length < totalReplyCount, page all replies via comments.list
 *     and replace the preview with the full array (simplifies dedup logic).
 *
 * Progress:
 *   - Optional callback receives { fetchedPages, totalPages } so the client can
 *     render "page X / Y". totalPages is estimated from pageInfo on the first
 *     response; it may be 0 if not exposed.
 *
 * @param {string} videoId
 * @param {string} API_KEY
 * @param {number} maxPages hard safety cap to avoid infinite loops
 * @param {(p:{fetchedPages:number,totalPages:number})=>void} [onProgress]
 * @param {number} throttleMs polite delay between page fetches
 * @returns {Array<Object>} normalized parents with enriched replies (see header)
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

  // Normalize and pre-collect unique channel IDs for downstream enrichment.
  const normalized = [];
  const channelIds = new Set();

  for (const t of allThreads) {
    const top = t.snippet.topLevelComment.snippet;
    const topId = t.snippet.topLevelComment.id;
    const topChan = top.authorChannelId?.value || null;
    if (topChan) channelIds.add(topChan);

    // Seed with any preview replies YouTube embedded on the thread…
    let replies = Array.isArray(t.replies?.comments)
      ? t.replies.comments.map((c) => {
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
        })
      : [];

    // …then hydrate fully if totalReplyCount suggests we are truncated.
    if ((t.snippet.totalReplyCount || 0) > replies.length) {
      replies = await fetchAllRepliesForParent(topId, API_KEY, throttleMs);
      for (const r of replies) if (r.authorChannelId) channelIds.add(r.authorChannelId);
    }

    normalized.push({
      id: topId,
      textOriginal: top.textOriginal,
      likeCount: top.likeCount || 0,
      authorDisplayName: top.authorDisplayName,
      authorChannelId: topChan,
      publishedAt: top.publishedAt,
      totalReplyCount: t.snippet.totalReplyCount || 0,
      replies,
    });
  }

  // Enrich authors with country + subscriberCount (for parents and replies).
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

/**
 * Fetch a video's core metadata, channel stats, and derive UX KPIs.
 * This powers the "Video Meta" card (duration, age, engagement rates, etc.).
 *
 * Rates computed:
 *   engagementRate = (likes + comments) / views     (null if views = 0)
 *   likeRate       = likes / views                  (null if missing)
 *   commentRate    = comments / views               (null if missing)
 *
 * @param {string} videoId
 * @param {string} API_KEY
 * @returns {object|null} normalized metadata object or null if not found
 */
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
