/**
 * Sentiment Provider Factory
 * -----------------------------------------------------------------------------
 * WHAT:
 *   - Centralized factory function (`buildProvider`) for constructing sentiment
 *     analysis providers based on a string model identifier.
 *
 * WHY:
 *   - Encapsulates provider creation logic so the rest of the codebase does not
 *     need to know implementation details (e.g., which class maps to which model).
 *   - Makes it easy to swap providers or extend with new ones.
 *
 * SUPPORTED PROVIDERS:
 *   - "gemini" → Google Gemini (API key required)
 *   - "openai-gpt-4o-mini" → OpenAI GPT-4o-mini (API key required)
 *   - "vader" → VADER sentiment (lexicon-based, local, no API key)
 *   - default → falls back to VADER
 *
 * USAGE:
 *   ```js
 *   const provider = buildProvider("gemini", { apiKey: process.env.GEMINI_KEY });
 *   const scores = await provider.analyzeBatch(["I love this!", "This sucks."]);
 *   ```
 */

import { VaderProvider } from "./VaderProvider.js";
import { OpenAIProvider } from "./OpenAIProvider.js";
import { GeminiProvider } from "./GeminiProvider.js";

/**
 * Factory for constructing sentiment provider instances.
 *
 * @param {string} model - Model identifier string (e.g., "gemini", "openai-gpt-4o-mini", "vader")
 * @param {object} opts  - Provider-specific options (e.g., { apiKey, model, host })
 * @returns {ISentimentProvider} Provider instance
 */
export function buildProvider(model, opts = {}) {
  switch ((model || "").toLowerCase()) {
    case "gemini":
      // Google Gemini API (requires API key, default to 1.5 Flash model)
      return new GeminiProvider({
        apiKey: opts.apiKey,
        model: opts.model || "gemini-1.5-flash",
      });

    case "openai-gpt-4o-mini":
      // OpenAI GPT-4o-mini API (requires API key)
      return new OpenAIProvider({
        apiKey: opts.apiKey,
        model: "gpt-4o-mini",
      });

    case "vader":
      // VADER (lexicon-based, runs locally, no API calls needed)
      return new VaderProvider();

    default:
      // Default fallback ensures pipeline always returns a provider
      return new VaderProvider();
  }
}
