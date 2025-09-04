/**
 * -----------------------------------------------------------------------------
 * VADER provider — fast, no external calls, a great default baseline.
 * -----------------------------------------------------------------------------
 * PURPOSE
 *   Local, zero-egress sentiment engine using the VADER lexicon. Ideal as the
 *   default provider for development and bulk scoring where cost/latency matter.
 *
 * CONTRACT
 *   Implements ISentimentProvider:
 *     analyzeBatch(texts: string[]) => Promise<number[]>
 *   - Returns VADER's `compound` score for each input (range [-1, 1]).
 *   - Output order matches input order 1:1.
 *
 * WHAT IS RETURNED
 *   VADER’s `compound` score is a normalized, weighted composite of the
 *   valence scores for each token (including punctuation, capitalization,
 *   degree modifiers, and simple negation handling). It is already scaled to
 *   [-1, 1], so no further normalization is required for downstream UI.
 *
 * DESIGN DECISIONS
 *   - Batch shape: we keep the implementation purely functional (single `.map`)
 *     to minimize overhead. It’s synchronous per item but wrapped in an async
 *     signature to satisfy the provider interface.
 *   - Fallbacks: empty/undefined texts are coerced to '' to avoid exceptions;
 *     VADER then yields a deterministic neutral score for those items.
 *   - No caching: VADER is CPU-light; repeated calls are inexpensive compared
 *     to networked providers. If you process extremely large corpora, consider
 *     chunking in the caller to keep event loop snappy.
 *
 * LIMITATIONS / NOTES
 *   - Language: strongest on social English; non-English content and domain
 *     specific jargon may be under-scored or misclassified.
 *   - Sarcasm & complex pragmatics: not captured (lexicon-based).
 *   - Very long inputs: VADER is token-level; extremely long strings may blur
 *     polarity. Upstream chunking can improve fidelity for paragraphs.
 *
 * EXTENSION POINTS
 *   - If you need phrase-level or domain-specific tuning, consider augmenting
 *     the lexicon before scoring or switch to an LLM provider for precision.
 * -----------------------------------------------------------------------------
 */

import { ISentimentProvider } from "./ISentimentProvider.js"
import { SentimentIntensityAnalyzer } from "vader-sentiment"

export class VaderProvider extends ISentimentProvider{
  /**
   * Score an array of texts using VADER's compound metric.
   * @param {string[]} texts - Corpus to score; falsy entries are treated as ''.
   * @returns {Promise<number[]>} [-1,1] compound scores aligned with input.
   */
  async analyzeBatch(texts){
    return texts.map(t => SentimentIntensityAnalyzer.polarity_scores(t || '').compound)
  }
}
