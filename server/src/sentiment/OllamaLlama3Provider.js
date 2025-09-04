/**
 * -----------------------------------------------------------------------------
 * OllamaLlama3Provider (JSON-enforced)
 * -----------------------------------------------------------------------------
 * PURPOSE
 *   Sentiment scorer backed by a local LLaMA 3 model served via Ollama.
 *   This version **forces JSON output** from the model and strictly parses it
 *   to prevent the “0/1 only” collapse you observed with free-text prompts.
 *
 * CONTRACT
 *   Implements ISentimentProvider:
 *     analyzeBatch(texts: string[]) => Promise<number[]>
 *   Returns one score per input in [-1, 1] (order preserved).
 *
 * KEY BEHAVIORS / DESIGN
 *   - /api/generate is called with { format: "json" } so the model emits a JSON
 *     object only. We ask for: { "score": <float in [-1,1]> }.
 *   - Strict parsing: JSON.parse(data.response), verify type/finite, clamp.
 *   - Deadzone (optional): tiny magnitudes (< deadzone) coerced to 0 to reduce
 *     flicker. Default is 0.01 (much smaller than before); set to 0 to disable.
 *   - Sequential loop (simple & VRAM-friendly). If you later need throughput,
 *     wrap each iteration in a small concurrency limiter (p-limit 3–6).
 *   - Error isolation: per-item failure yields 0 (neutral); batch progresses.
 *
 * CONFIG (constructor opts)
 *   - host      : Ollama base URL (default: http://localhost:11434)
 *   - model     : Ollama model name (default: "llama3")
 *   - timeoutMs : per-item request timeout (default: 45000)
 *   - deadzone  : |score| < deadzone → 0  (default: 0.01)
 * -----------------------------------------------------------------------------
 */

import { ISentimentProvider } from "./ISentimentProvider.js";
import axios from "axios";

export class OllamaLlama3Provider extends ISentimentProvider {
  /**
   * @param {{host?: string, model?: string, timeoutMs?: number, deadzone?: number}} [opts]
   */
  constructor(opts = {}) {
    super();
    this.host = opts.host || "http://localhost:11434";
    this.model = opts.model || "llama3";
    this.timeoutMs = Number.isFinite(opts.timeoutMs) ? opts.timeoutMs : 45_000;
    this.deadzone = typeof opts.deadzone === "number" ? Math.max(0, opts.deadzone) : 0.01;
  }

  /**
   * Analyze an array of texts via Ollama. One request per text; on any
   * per-item error, push 0 so array lengths remain aligned.
   *
   * @param {string[]} texts
   * @returns {Promise<number[]>} scores aligned 1:1 with `texts`
   */
  async analyzeBatch(texts) {
    if (!Array.isArray(texts) || texts.length === 0) return [];
    const out = [];

    // NOTE: keep this sequential to be gentle on VRAM and avoid overwhelming
    // local servers. For throughput, add a small concurrency controller later.
    for (const text of texts) {
      const prompt = this.#buildPrompt(text || "");
      try {
        const { data } = await axios.post(
          `${this.host}/api/generate`,
          {
            model: this.model,
            prompt,
            stream: false,
            // Enforce machine-readable JSON output from the model:
            format: "json",
            // Optional low-variance generation (keeps outputs stable):
            options: { temperature: 0 }
          },
          { timeout: this.timeoutMs }
        );

        // data.response is a string containing ONLY the JSON object we asked for.
        const v = this.#parseScoreFromJsonResponse(data?.response);
        out.push(v);
      } catch {
        // Conservative failure policy: neutral instead of throwing.
        out.push(0);
      }
    }

    return out;
  }

  /**
   * Build a JSON-only instruction. We escape quotes to avoid breaking the
   * JSON payload that wraps the prompt text itself.
   *
   * We ask for:
   *   { "score": <float in [-1,1]> }
   * with exactly one field and nothing else.
   *
   * @param {string} text
   * @returns {string}
   */
  #buildPrompt(text) {
    const safe = (text || "").replace(/"/g, '\\"');
    return (
      `Return ONLY valid JSON with exactly this shape: {"score": <float in [-1,1]>}\n` +
      `- "score" MUST be a real number (decimals allowed), not a string.\n` +
      `- Do not include any other keys or any extra text.\n` +
      `- Use values near 0 for neutral, negative for negative sentiment, positive for positive sentiment.\n` +
      `Text: "${safe}"`
    );
  }

  /**
   * Safely parse a numeric score from Ollama's JSON-formatted response,
   * validate, clamp, and apply deadzone.
   *
   * @param {unknown} responseText
   * @returns {number}
   */
  #parseScoreFromJsonResponse(responseText) {
    try {
      const obj = JSON.parse(String(responseText || "{}"));
      let v = Number(obj?.score);

      // Validate numeric and clamp to [-1, 1]
      if (!Number.isFinite(v)) return 0;
      v = Math.max(-1, Math.min(1, v));

      // Optional deadzone to reduce tiny drift in UI
      if (Math.abs(v) < this.deadzone) return 0;

      return v;
    } catch {
      // If the model somehow violated JSON, fall back to 0 rather than guessing.
      return 0;
    }
  }
}
