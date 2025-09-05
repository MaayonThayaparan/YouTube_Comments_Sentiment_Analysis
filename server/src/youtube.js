/**
 * youtube.js — YouTube REST Helpers (v12, enriched)
 * ----------------------------------------------------------------------------
 * PURPOSE:
 *   - Encapsulates YouTube Data API v3 access patterns.
 *   - Provides helper functions for:
 *       1. Parsing YouTube video IDs from multiple input formats.
 *       2. Fetching all comments + nested replies for a given video.
 *       3. Enriching comment authors with metadata (country, subscriber count).
 *       4. Fetching + enriching video-level metadata (stats, content details).
 *
 * WHY:
 *   - Normalize YouTube’s complex, inconsistent JSON responses into a simpler,
 *     predictable structure for frontend consumers (charts, tables, dashboards).
 *   - Reduce duplication by centralizing API handling + enrichment logic.
 *
 * DESIGN CONSIDERATIONS:
 *   - Built-in throttling to avoid API quota abuse (`throttleMs`).
 *   - Defensive null-checks since fields can be missing or hidden.
 *   - Uses Maps for efficient channel metadata lookups.
 *   - Default safe fallbacks (nulls for hidden subs/country, 0 counts if absent).
 *
 * NOTES:
 *   - Country is channel-level, not per-comment, and is often missing.
 *   - subscriberCount may be hidden; returned as `null` in that case.
 *   - All functions return normalized JS objects — never raw API payloads.
 */

import axios from "axios";
const YT_API = "https://www.googleapis.com/youtube/v3";

/* ------------------------------------------------------------------------- */
/* Utilities                                                                 */
/* ------------------------------------------------------------------------- */

/**
 * Converts an ISO8601 duration string (e.g. "PT1H2M3S") into total seconds.
 * Returns null if input is falsy or does not match expected format.
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
 * Attempts to extract a valid YouTube videoId from a string input.
 * Supported inputs:
 *   - Raw 11-char videoId.
 *   - https://youtu.be/{id}
 *   - https://www.youtube.com/watch?v={id}
 *   - /embed/{id} or other URL paths ending with an id.
 *
 * Returns:
 *   - videoId string (11 chars) if successfully parsed.
 *   - null if input is invalid or cannot be parsed.
 */
export function parseVideoId(input) {
  try {
    if (!input) return null;

    // Case: raw 11-character YouTube ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;

    // Case: parse as URL and attempt extraction
    const url = new URL(input);
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1);
    if (url.searchParams.get("v")) return url.searchParams.get("v");

    // Case: check last path segment
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
 * Fetches metadata for a batch of channel IDs.
 * Adds enrichment fields:
 *   - country: string | null
 *   - subscriberCount: number | null
 *
 * Behavior:
 *   - Deduplicates channelIds before requesting.
 *   - Splits into batches of 50 (YouTube API limit).
 *   - Returns a Map keyed by channelId.
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
/* Replies pagination (child comments under a parent)                         */
/* ------------------------------------------------------------------------- */

/**
 * Fetches *all* replies for a given parent comment ID using comments.list.
 * - Automatically paginates until all replies are retrieved.
 * - Normalizes replies to a consistent object shape.
 * - Includes throttle delay between pages to avoid API rate issues.
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

    // Normalize reply structure
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

    // Pause briefly if throttle is configured
    if (throttleMs) await new Promise((r) => setTimeout(r, throttleMs));
  } while (pageToken);

  return out;
}

/* ------------------------------------------------------------------------- */
/* Comments pipeline                                                          */
/* ------------------------------------------------------------------------- */

/**
 * Fetches *all* comments (threads + replies) for a videoId.
 *
 * Behavior:
 *   - Iterates through commentThreads pages (maxPages cap).
 *   - Normalizes each comment + reply into a consistent schema.
 *   - Tracks progress via onProgress callback (page counters).
 *   - Enriches authors with channel-level metadata.
 *
 * Returns:
 *   - Array of normalized comment objects, each with nested replies.
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

  // Fetch paginated commentThreads
  do {
    const { data } = await axios.get(`${YT_API}/commentThreads`, {
      params: { key: API_KEY, part: "snippet,replies", videoId, maxResults: 100, pageToken },
    });

    // Calculate total pages on first response
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

  // Normalize top-level threads + collect channelIds for enrichment
  const normalized = [];
  const channelIds = new Set();

  for (const t of allThreads) {
    const top = t.snippet.topLevelComment.snippet;
    const topId = t.snippet.topLevelComment.id;
    const topChan = top.authorChannelId?.value || null;
    if (topChan) channelIds.add(topChan);

    // Inline preview replies (may be partial)
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

    // If YouTube reports more replies than included inline → fetch all
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

  // Batch-enrich authors with channel metadata
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
 * Fetches metadata for a single video and enriches it with:
 *   - Raw statistics (views, likes, comments).
 *   - Channel info (subscribers, country, totals).
 *   - Derived engagement metrics (engagementRate, likeRate, commentRate).
 *   - Duration parsing and video definition (HD/SD).
 *
 * Returns null if video not found.
 */
export async function fetchVideoMeta(videoId, API_KEY) {
  // Step 1: core video fields
  const { data: vData } = await axios.get(`${YT_API}/videos`, {
    params: { key: API_KEY, id: videoId, part: "snippet,statistics,contentDetails" },
  });

  const item = (vData.items && vData.items[0]) || null;
  if (!item) return null;

  const sn = item.snippet || {};
  const st = item.statistics || {};
  const cd = item.contentDetails || {};

  const viewCount = st.viewCount ? Number(st.viewCount) : 0;
  const likeCount = st.likeCount !== undefined ? Number(st.likeCount) : null;
  const commentCount = st.commentCount !== undefined ? Number(st.commentCount) : null;

  // Step 2: channel enrichment
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

  // Step 3: derived metrics
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

  // Step 4: normalized return payload
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

    // raw stats
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