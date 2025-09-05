/**
 * VADER Provider
 * -----------------------------------------------------------------------------
 * WHAT:
 *   - Lightweight sentiment provider using the `vader-sentiment` library.
 *   - Runs fully locally, no external API calls required.
 *
 * WHY:
 *   - Provides a fast, zero-cost, always-available default sentiment model.
 *   - Good baseline for experiments before hitting external APIs (OpenAI, Gemini).
 *
 * DESIGN DECISIONS:
 *   - Implements the common ISentimentProvider interface so it can be swapped
 *     with other providers (OpenAI, Gemini, LLaMA3) without changing caller code.
 *   - Only the `.compound` score is returned from VADER, normalized into [-1, 1].
 *     This matches the API contract of other providers.
 *
 * LIMITATIONS:
 *   - VADER is rule/lexicon-based → may miss nuance, sarcasm, or context.
 *   - Performance is excellent for batches, but quality is lower than LLMs.
 */

import { ISentimentProvider } from "./ISentimentProvider.js"
import { SentimentIntensityAnalyzer } from "vader-sentiment"

/**
 * Concrete implementation of ISentimentProvider using VADER.
 */
export class VaderProvider extends ISentimentProvider {
  /**
   * Batch-analyze an array of texts and return their sentiment scores.
   * - Input: array of strings
   * - Output: array of numbers in [-1, 1]
   *
   * @param texts - List of comment strings to analyze.
   */
  async analyzeBatch(texts) {
    return texts.map(
      (t) => SentimentIntensityAnalyzer.polarity_scores(t || "").compound
    )
  }
}
