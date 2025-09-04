/**
 * -----------------------------------------------------------------------------
 * Sentiment Provider Strategy (interface)
 * -----------------------------------------------------------------------------
 * PURPOSE
 *   Defines the minimal contract that all sentiment engines must implement to be
 *   pluggable in this codebase. Concrete providers (Vader, Ollama/Llama, OpenAI)
 *   subclass this and implement `analyzeBatch(texts)` to return numeric scores.
 *
 * CONTRACT
 *   analyzeBatch(texts: string[]) => Promise<number[]>
 *   - Input and output arrays MUST be the same length.
 *   - Output ordering MUST align with input ordering (index i maps 1:1).
 *   - Return finite numbers for every item (no NaN/Infinity). If a score cannot
 *     be computed, the implementation should decide whether to coerce to 0 or
 *     throw—callers (server) expect a thrown error for hard failures.
 *   - Score range convention is [-1, 1] where negative = negative sentiment,
 *     positive = positive sentiment. If an engine uses a different scale,
 *     normalize before returning to keep downstream UI consistent.
 *
 * DESIGN NOTES
 *   - JavaScript has no native interfaces; we use an abstract base class that
 *     throws by default. Concrete providers MUST override `analyzeBatch`.
 *   - Providers should be stateless w.r.t. input (safe for reuse). Runtime
 *     configuration (e.g., API keys, base URLs, model names) lives on the
 *     instance, set during construction by the factory.
 *   - Chunking, rate limiting, and retry policies can be implemented either
 *     here (inside a provider) or in the caller. The server currently chunks
 *     to batches of 50; providers should still be robust to larger inputs.
 *
 * EXTENDING
 *   - Create a subclass, wire it in `sentiment/factory.js`, and ensure it
 *     fulfills the contract above. Keep temperature low/deterministic for LLMs.
 *
 * ERROR SEMANTICS
 *   - Throw an Error with a provider-identifying message on irrecoverable
 *     failures (e.g., 401/429/5xx after retries). The HTTP layer logs and
 *     converts to a 500 with a generic message.
 * -----------------------------------------------------------------------------
 */

/** Strategy interface for sentiment engines. */
export class ISentimentProvider {
  /**
   * Analyze an array of texts and return a parallel array of numeric scores.
   * @param {string[]} texts - Corpus to score, order is significant.
   * @returns {Promise<number[]>} - Scores aligned 1:1 with the input.
   * @throws {Error} - If the provider cannot process the batch.
   */
  async analyzeBatch(texts) {
    throw new Error('analyzeBatch not implemented')
  }
}
