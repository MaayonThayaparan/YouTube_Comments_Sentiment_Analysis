/**
 * OpenAI Provider
 * -----------------------------------------------------------------------------
 * WHAT:
 *   - Implements ISentimentProvider using OpenAI's Chat Completions API.
 *   - Wraps text sentiment scoring into a simple [-1, 1] range output.
 *
 * WHY:
 *   - Provides a more context-aware sentiment analysis compared to VADER.
 *   - Uses strict prompting to enforce numeric-only outputs for stability.
 *
 * DESIGN DECISIONS:
 *   - API key is injected via constructor; required for all calls.
 *   - Default model is set to `gpt-4o-mini` for cost/speed trade-offs.
 *   - `temperature` is forced to 0.0 → ensures deterministic scoring.
 *   - Each text is processed sequentially for simplicity. 
 *     (Could be parallelized with Promise.all, but sequential reduces
 *     concurrency issues and makes rate-limiting easier to manage.)
 *
 * LIMITATIONS:
 *   - Cost: Each sentiment call consumes tokens → expensive at scale.
 *   - Latency: Sequential requests can be slow on large batches.
 *   - Model compliance: Occasionally the model may emit explanations
 *     instead of numbers; regex parsing safeguards against this.
 */

import { ISentimentProvider } from "./ISentimentProvider.js";
import axios from "axios";

/**
 * Concrete sentiment provider backed by OpenAI's GPT models.
 */
export class OpenAIProvider extends ISentimentProvider {
  constructor(opts = {}) {
    super();

    // API configuration
    this.apiKey = opts.apiKey || "";
    this.model = opts.model || "gpt-4o-mini";
    this.baseUrl = opts.baseUrl || "https://api.openai.com/v1";
  }

  /**
   * Analyze a batch of texts using OpenAI.
   * Returns a numeric sentiment score per text in [-1, 1].
   *
   * @param texts - Array of comment strings
   * @returns Array<number> sentiment scores
   */
  async analyzeBatch(texts) {
    if (!this.apiKey) throw new Error("OpenAI API key missing");

    const out = [];

    for (const text of texts) {
      // Escape quotes to avoid prompt injection issues
      const safe = (text || "").replace(/"/g, '\\"');

      // Strict prompt: forces numeric-only output
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
        // OpenAI Chat Completion call
        const { data } = await axios.post(
          `${this.baseUrl}/chat/completions`,
          {
            model: this.model,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.0, // deterministic output
          },
          {
            headers: { Authorization: `Bearer ${this.apiKey}` },
            timeout: 45000, // long timeout for large batches
          }
        );

        // Extract model response and sanitize to numeric value
        const content = data?.choices?.[0]?.message?.content || "";
        const m = String(content).match(/-?\d+(?:\.\d+)?/);
        const num = m ? Math.max(-1, Math.min(1, parseFloat(m[0]) || 0)) : 0;

        // Ensure valid number fallback
        out.push(Number.isFinite(num) ? num : 0);
      } catch {
        // On failure → push neutral (0) to preserve alignment
        out.push(0);
      }
    }

    return out;
  }
}
