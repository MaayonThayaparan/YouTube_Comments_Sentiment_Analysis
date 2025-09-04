/**
 * -----------------------------------------------------------------------------
 * Scoring & Normalization Utilities (client-side)
 * -----------------------------------------------------------------------------
 * PURPOSE
 *   Vote-weighted sentiment aggregation for YouTube comment threads **plus an
 *   explicit like-count term**. For each top-level thread we compute an
 *   "adjusted" sentiment by treating the parent + replies as votes and then
 *   blending with a linear likes term:
 *
 *     • Parent vote weight  = 1 + parent.likeCount
 *     • Each reply weight   = 1  (optionally 1 + reply.likeCount)
 *     • Each vote’s value   = sentiment in [-1, 1]
 *     • Vote aggregate      = (Σ weightᵢ × scoreᵢ) / (Σ weightᵢ)
 *     • Like-count term     = sign(base) × parent.likeCount
 *     • Adjusted            = clamp(wComment*base
 *                                   + wReplies*voteAggregate
 *                                   + wLikes*likeTerm, [-1,1])
 *
 *   The explicit `wLikes * likeTerm` keeps a tunable, **linear** likes
 *   influence separate from the vote aggregation (which already bakes likes
 *   into parent weight). Use a small `wLikes` (e.g., 0.001–0.01) if you pass
 *   raw counts, or normalize counts at call-site if preferred.
 *
 * DATA MODEL
 *   - ReplyItem   : normalized reply as returned by the server (may include `base`)
 *   - ThreadItem  : normalized top-level comment with embedded replies
 *   - ScoredRow   : ThreadItem + computed `base` (if missing) and `adjusted`
 *
 * PIPELINE (per ThreadItem)
 *   1) base (parent sentiment):
 *      • Use server-provided numeric `base` if present; else VADER compound.
 *
 *   2) vote weights:
 *      • Parent: `parentWeight = 1 + likeCount` (linear influence).
 *      • Replies: weight = 1 each (switch to 1 + likeCount to include reply likes).
 *
 *   3) vote aggregate:
 *      • Weighted average of parent + replies → [-1, 1].
 *
 *   4) like term (explicit):
 *      • `likeTerm = sign(base) × likeCount` (likes reinforce the parent’s polarity).
 *        - If you prefer likes to be polarity-agnostic, drop the sign().
 *
 *   5) adjusted:
 *      • `clamp(wComment*base + wReplies*voteAggregate + wLikes*likeTerm, -1, 1)`.
 *
 * KEY DECISIONS
 *   - **Sign-aligned likes**: Likes boost positivity for positive parents and
 *     deepen negativity for negative parents. This avoids a positive bump on a
 *     widely-liked negative comment.
 *   - **Linear counts**: Matches the “more likes/replies ⇒ more influence”
 *     intuition. Keep `wLikes` small or normalize counts to avoid saturation.
 *   - **Determinism**: Prefer server `base` when available for consistency with
 *     exports and pagination.
 *
 * VARIANTS
 *   - Exact “4×” parent (without +1): use `parentWeight = Math.max(1, likeCount)`.
 *   - Include reply likes: set replyWeights to `1 + reply.likeCount`.
 *   - Normalized likes term: replace `likeCount` with a normalized value if you
 *     want `wLikes` to be on a similar scale across videos.
 *
 * COMPLEXITY
 *   O(P + R) where P = parents, R = total replies. VADER is local/fast.
 * -----------------------------------------------------------------------------
 */

import { SentimentIntensityAnalyzer } from 'vader-sentiment'

/** One reply item in a thread (optionally with precomputed `base`). */
export type ReplyItem = {
  id: string;
  textOriginal: string;
  likeCount: number;
  authorDisplayName: string;
  authorChannelId?: string | null;
  authorCountry?: string | null;
  authorSubscriberCount?: number | null;
  publishedAt: string;
  base?: number;
}

/** Top-level comment thread with replies (optionally with precomputed `base`). */
export type ThreadItem = {
  id: string;
  textOriginal: string;
  likeCount: number;
  authorDisplayName: string;
  authorChannelId?: string | null;
  authorCountry?: string | null;
  authorSubscriberCount?: number | null;
  publishedAt: string;
  totalReplyCount: number;
  replies: ReplyItem[];
  base?: number;
}

/** Final row shape used by UI after scoring. */
export type ScoredRow = ThreadItem & { base: number; adjusted: number }

/** Blend weights selected by caller (kept external for tuning). */
type Weights = { wComment: number, wLikes: number, wReplies: number }

/** Clamp helper to keep numeric outputs in a safe display range. */
function clamp(x:number, a:number, b:number){ return Math.max(a, Math.min(b, x)) }

/** VADER compound sentiment in [-1,1]; deterministic, no network. */
function compound(text:string){
  const r = SentimentIntensityAnalyzer.polarity_scores(text || '');
  return r.compound
}

/**
 * Legacy helper from the previous log-scaled scheme (kept for reference/rollback).
 * Not used by default in the vote+likes model.
 */
function normalizeLikes(likes:number, maxLikes:number){
  const ln = Math.log10(1 + likes);
  const denom = Math.log10(1 + Math.max(1, maxLikes));
  return denom === 0 ? 0 : ln / denom
}

/**
 * Compute adjusted sentiment for each thread using the vote-weighted model,
 * plus an explicit like-count term scaled by `weights.wLikes`.
 *
 * @param items   Normalized threads (may contain server-provided `base`s)
 * @param weights Caller-chosen blend weights
 * @returns       Array of ScoredRow with `base` and `adjusted`
 */
export function computeAdjustedScores(items: ThreadItem[], weights: Weights): ScoredRow[] {
  return items.map((i) => {
    // 1) Parent sentiment (use server base if present)
    const base = typeof (i as any).base === 'number'
      ? (i as any).base
      : SentimentIntensityAnalyzer.polarity_scores(i.textOriginal || '').compound

    // 2) Vote-style weights
    const parentWeight = 1 + (i.likeCount || 0)
    const replyWeights = (i.replies || []).map(() => 1)
    const replyScores  = (i.replies || []).map(r =>
      typeof (r as any).base === 'number'
        ? (r as any).base
        : SentimentIntensityAnalyzer.polarity_scores(r.textOriginal || '').compound
    )

    // 3) Vote aggregate
    let weightedSum = parentWeight * base
    let totalWeight = parentWeight
    for (let k = 0; k < replyScores.length; k++) {
      weightedSum += replyWeights[k] * replyScores[k]
      totalWeight += replyWeights[k]
    }
    const voteAggregate = totalWeight > 0 ? (weightedSum / totalWeight) : 0

    // 4) Explicit likes term (sign-aligned with parent polarity)
    const likeCount = i.likeCount || 0
    const likeTerm  = (base >= 0 ? 1 : -1) * likeCount

    // 5) Blend + clamp
    const adjusted = clamp(
      weights.wComment * base +
      weights.wReplies * voteAggregate +
      weights.wLikes   * likeTerm,
      -1, 1
    )

    return { ...i, base, adjusted }
  })
}
