/**
 * ISentimentProvider — Strategy Interface
 * -----------------------------------------------------------------------------
 * WHAT:
 *   - Defines a common contract for all sentiment providers (VADER, OpenAI, Gemini, Ollama).
 *   - Ensures each provider implements a batch sentiment analysis method.
 *
 * WHY:
 *   - Standardizes the shape of provider classes.
 *   - Allows `factory.js` and downstream code to dynamically switch between providers
 *     without worrying about implementation details.
 *   - Follows the "Strategy Pattern": interchangeable algorithms behind a shared interface.
 *
 * USAGE:
 *   - Extend this class and implement `analyzeBatch`.
 *   - Example: `class VaderProvider extends ISentimentProvider { async analyzeBatch(...) {...} }`
 *
 * NOTES:
 *   - `analyzeBatch` is async to support remote API calls (e.g., OpenAI, Gemini).
 *   - Always return an array of numbers in [-1, 1] (one score per input text).
 *   - This class is abstract by convention only — JS/TS cannot enforce abstract methods directly.
 */
export class ISentimentProvider {
  /**
   * Analyze a batch of text strings and return sentiment scores.
   *
   * @param texts - Array of input strings to score
   * @returns Promise<number[]> sentiment scores in [-1, 1]
   *
   * @throws Error if not implemented by subclass
   */
  async analyzeBatch(texts) {
    throw new Error("analyzeBatch not implemented");
  }
}
