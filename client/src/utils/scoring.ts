/**
 * scoring.ts — Sentiment scoring + adjustment pipeline
 * -----------------------------------------------------------------------------
 * WHAT:
 *   - Defines data types for YouTube comments & replies.
 *   - Provides utilities to compute "adjusted" sentiment scores that combine:
 *       • Base sentiment (VADER or LLM-derived)
 *       • Influence of likes (popularity weighting)
 *       • Influence of reply sentiment (conversation context)
 *
 * WHY:
 *   - Raw sentiment alone can be misleading — highly liked comments carry more
 *     weight, and replies can shift overall perception.
 *   - This adjustment produces a more holistic sentiment signal for dashboards
 *     and analytics (e.g., charts, leaderboards).
 *
 * NOTES:
 *   - All final scores are clamped to [-1, 1].
 *   - Like influence is log-scaled (to prevent viral comments from skewing too hard).
 *   - Replies are averaged to smooth variance across threads.
 */

import { SentimentIntensityAnalyzer } from "vader-sentiment";

/* -------------------------------------------------------------------------- */
/* Type definitions                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Reply item — a single reply under a top-level comment.
 */
export type ReplyItem = {
  id: string;
  textOriginal: string;
  likeCount: number;
  authorDisplayName: string;
  authorChannelId?: string | null;
  authorCountry?: string | null;
  authorSubscriberCount?: number | null;
  publishedAt: string;
  base?: number; // optional pre-computed sentiment score
};

/**
 * Thread item — a top-level comment plus its replies.
 */
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
  base?: number; // optional pre-computed sentiment score
};

/**
 * Scored row — thread item enriched with final sentiment scores.
 */
export type ScoredRow = ThreadItem & {
  base: number;     // raw sentiment
  adjusted: number; // weighted, normalized sentiment
};

/**
 * Weight multipliers for combining sentiment, likes, and replies.
 */
type Weights = {
  wComment: number;
  wLikes: number;
  wReplies: number;
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Clamp value `x` into [a, b]. */
function clamp(x: number, a: number, b: number) {
  return Math.max(a, Math.min(b, x));
}

/** Get raw compound sentiment score using VADER. */
function compound(text: string) {
  const r = SentimentIntensityAnalyzer.polarity_scores(text || "");
  return r.compound;
}

/**
 * Normalize like count to [0,1] using log-scaling.
 * - Prevents extreme skew from viral comments.
 * - Denominator uses max likes observed in dataset.
 */
function normalizeLikes(likes: number, maxLikes: number) {
  const ln = Math.log10(1 + likes);
  const denom = Math.log10(1 + Math.max(1, maxLikes));
  return denom === 0 ? 0 : ln / denom;
}

/* -------------------------------------------------------------------------- */
/* Core scoring                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Compute adjusted sentiment scores for all threads.
 *
 * @param items   Array of thread items (comments + replies).
 * @param weights Weight multipliers for base, likes, and replies.
 * @returns       Array of ScoredRow with both base & adjusted scores.
 *
 * HOW:
 *   - For each top-level comment:
 *     1. Get base sentiment (VADER/LLM).
 *     2. Weight by likes (positive comments boosted if liked).
 *     3. Aggregate replies sentiment (averaged, weighted by reply likes).
 *     4. Combine all with weights; clamp final to [-1,1].
 */
export function computeAdjustedScores(
  items: ThreadItem[],
  weights: Weights
): ScoredRow[] {
  // Determine normalization denominators (max likes for scaling)
  const maxTopLikes = Math.max(1, ...items.map((i) => i.likeCount || 0));
  const maxReplyLikes = Math.max(
    1,
    ...items.flatMap((i) => i.replies?.map((r) => r.likeCount || 0) || [0])
  );

  return items.map((i) => {
    // Base score: use pre-computed if present, otherwise run VADER
    const base =
      typeof (i as any).base === "number"
        ? (i as any).base
        : compound(i.textOriginal);

    // Like influence: log-normalized, sign matches base sentiment direction
    const Lc = normalizeLikes(i.likeCount || 0, maxTopLikes);
    const likeAdj = (0.5 + 0.5 * Lc) * (base >= 0 ? 1 : -1);

    // Reply sentiment aggregate: average weighted by likes
    const replyAggregate = (() => {
      if (!i.replies?.length) return 0;
      const vals = i.replies.map((r) => {
        const Sr =
          typeof (r as any).base === "number"
            ? (r as any).base
            : compound(r.textOriginal);
        const Lr = normalizeLikes(r.likeCount || 0, maxReplyLikes);
        return Sr * (0.5 + 0.5 * Lr);
      });
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    })();

    // Combine weighted contributions & clamp to [-1, 1]
    const adjusted = clamp(
      weights.wComment * base +
        weights.wLikes * likeAdj +
        weights.wReplies * replyAggregate,
      -1,
      1
    );

    return { ...i, base, adjusted };
  });
}