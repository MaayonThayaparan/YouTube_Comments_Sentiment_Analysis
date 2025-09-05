/**
 * GeminiProvider — Google Gemini Sentiment Scoring
 * -----------------------------------------------------------------------------
 * WHAT:
 *   - Implements `ISentimentProvider` using Google's Gemini API.
 *   - Sends each input text through the Gemini LLM, prompting for a numeric
 *     sentiment score in [-1, 1].
 *
 * WHY:
 *   - Provides a cloud-based, LLM-powered alternative to local sentiment scoring
 *     (e.g., VADER) or other LLMs (OpenAI, Ollama).
 *   - Gemini models can capture more nuanced language compared to lexicon-based
 *     approaches, at the cost of API latency + quota usage.
 *
 * DEFAULTS:
 *   - Model: `"gemini-1.5-flash"`
 *   - Base URL: `"https://generativelanguage.googleapis.com/v1beta/models"`
 *   - Requires API key: must be passed via `opts.apiKey`.
 *
 * USAGE:
 *   ```js
 *   const provider = new GeminiProvider({ apiKey: process.env.GEMINI_KEY });
 *   const scores = await provider.analyzeBatch(["I love this!", "This is terrible."]);
 *   // scores → [0.8, -0.7]
 *   ```
 *
 * IMPLEMENTATION NOTES:
 *   - `analyzeBatch` processes texts sequentially (one by one).
 *   - Prompt enforces strict numeric output with clear rules for score ranges.
 *   - Response is parsed with regex to extract a float in [-1, 1].
 *   - API errors are logged and recovered with fallback score `0`.
 */

import { ISentimentProvider } from "./ISentimentProvider.js";
import axios from "axios";

export class GeminiProvider extends ISentimentProvider {
  constructor(opts = {}) {
    super();

    // Required API key for authentication with Google Gemini
    this.apiKey = opts.apiKey || "";

    // Model name — can be overridden by passing opts.model
    this.model = opts.model || "gemini-2.5-flash";

    // Gemini REST endpoint base URL (Google GenAI API)
    this.baseUrl =
      opts.baseUrl ||
      "https://generativelanguage.googleapis.com/v1beta/models";
  }

  /**
   * Analyze sentiment for an array of text strings.
   *
   * @param {string[]} texts - Input comments to score
   * @returns {Promise<number[]>} Sentiment scores in [-1, 1]
   *
   * @throws Error if API key is missing
   */
  async analyzeBatch(texts) {
    if (!this.apiKey) throw new Error("Gemini API key missing");
    const out = [];

    // Process each text one at a time
    for (const text of texts) {
      // Escape quotes to prevent prompt injection
      const safe = (text || "").replace(/"/g, '\\"');

      // Strict scoring prompt — instructs Gemini to return ONLY a number
      const prompt = `You are a STRICT sentiment scorer. Output ONLY a number in [-1,1].
Rules:
- Strong negative: -0.6 to -1.0
- Mild negative:   -0.2 to -0.6
- Neutral:         -0.1 to 0.1
- Mild positive:   0.2 to 0.6
- Strong positive:  0.6 to 1.0
Text: "${safe}"
Score:`;

      try {
        // Call Gemini API (generateContent endpoint)
        const { data } = await axios.post(
          `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`,
          {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
          },
          { timeout: 45000 }
        );

        // Extract response text safely
        const content =
          data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

        // Regex: extract first valid float from response
        const m = String(content).match(/-?\d+(?:\.\d+)?/);

        // Clamp result into [-1, 1], fallback to 0 if invalid
        const num = m ? Math.max(-1, Math.min(1, parseFloat(m[0]) || 0)) : 0;
        out.push(Number.isFinite(num) ? num : 0);
      } catch (err) {
        // Log error for debugging, but do not crash pipeline
        console.error("[GeminiProvider]", err?.response?.data || err.message);
        out.push(0);
      }
    }

    return out;
  }
}