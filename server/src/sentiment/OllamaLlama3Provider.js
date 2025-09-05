/**
 * OllamaLlama3Provider
 * -----------------------------------------------------------------------------
 * WHAT:
 *   - Implements ISentimentProvider using a local Ollama instance (http://localhost:11434).
 *   - Wraps LLaMA3 free local inference into a strict sentiment scoring provider.
 *
 * WHY:
 *   - Provides a zero-cost, offline sentiment scoring alternative.
 *   - Useful for developers or deployments where OpenAI/Gemini API calls are not feasible.
 *
 * DESIGN DECISIONS:
 *   - Uses axios to call Ollama’s `/api/generate` endpoint.
 *   - Applies a "deadzone" for tiny values (|score| < 0.05 → coerced to 0).
 *     This helps reduce meaningless model drift around neutral.
 *   - Prompt engineering is strict: instructs model to return *only* a number in [-1, 1].
 *
 * LIMITATIONS:
 *   - Requires Ollama installed and model (`llama3`) pulled locally.
 *   - Sequential processing → slower on large batches.
 *   - Model output may still occasionally deviate from numeric; regex parsing mitigates.
 */

import { ISentimentProvider } from "./ISentimentProvider.js";
import axios from "axios";

/**
 * Concrete provider for local LLaMA3 sentiment scoring.
 */
export class OllamaLlama3Provider extends ISentimentProvider {
  constructor(opts = {}) {
    super();

    // Host and model configuration
    this.host = opts.host || "http://localhost:11434";
    this.model = opts.model || "llama3";
  }

  /**
   * Analyze a batch of texts with Ollama LLaMA3.
   * Returns sentiment scores in [-1, 1].
   *
   * @param texts - Array of comment strings
   * @returns Array<number> sentiment scores
   */
  async analyzeBatch(texts) {
    const out = [];

    for (const text of texts) {
      const prompt = this.#buildPrompt(text || "");

      try {
        // Call local Ollama server
        const { data } = await axios.post(
          `${this.host}/api/generate`,
          { model: this.model, prompt, stream: false },
          { timeout: 45000 }
        );

        // Parse score from raw response
        let v = this.#parseScore(data?.response);

        // Apply deadzone for near-zero noise
        if (Math.abs(v) < 0.05) v = 0;

        out.push(v);
      } catch {
        // On error, push neutral value
        out.push(0);
      }
    }

    return out;
  }

  /**
   * Build a strict scoring prompt for LLaMA3.
   *
   * @param text - Input text to analyze
   * @returns string prompt
   */
  #buildPrompt(text) {
    const safe = (text || "").replace(/"/g, '\\"');

    return `You are a STRICT sentiment scorer. Output ONLY a number in [-1,1].
Rules:
- Strong negative: -0.6 to -1.0
- Mild negative:   -0.2 to -0.6
- Neutral:         -0.1 to 0.1
- Mild positive:   0.2 to 0.6
- Strong positive:  0.6 to 1.0
Text: "${safe}"
Score:`;
  }

  /**
   * Extract numeric sentiment score from model response.
   *
   * @param resp - Raw Ollama response string
   * @returns number in [-1, 1] or 0 on failure
   */
  #parseScore(resp) {
    if (!resp) return 0;

    const m = String(resp).match(/-?\d+(?:\.\d+)?/);
    if (!m) return 0;

    const v = parseFloat(m[0]);
    if (!Number.isFinite(v)) return 0;

    return Math.max(-1, Math.min(1, v));
  }
}
