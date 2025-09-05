// server/src/sentiment/GeminiProvider.js
import { ISentimentProvider } from "./ISentimentProvider.js";
import axios from "axios";

/**
 * GeminiProvider — Google Gemini sentiment scoring
 * Requires: API key via opts.apiKey
 * Default model: "gemini-1.5-flash-latest"
 */
export class GeminiProvider extends ISentimentProvider {
  constructor(opts = {}) {
    super();
    this.apiKey = opts.apiKey || "";
    this.model = opts.model || "gemini-1.5-flash";
    this.baseUrl =
      opts.baseUrl ||
      "https://generativelanguage.googleapis.com/v1beta/models";
  }

  async analyzeBatch(texts) {
    if (!this.apiKey) throw new Error("Gemini API key missing");
    const out = [];

    for (const text of texts) {
      const safe = (text || "").replace(/"/g, '\\"');
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
        const { data } = await axios.post(
          `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`,
          {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
          },
          { timeout: 45000 }
        );

        const content =
          data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        const m = String(content).match(/-?\d+(?:\.\d+)?/);
        const num = m ? Math.max(-1, Math.min(1, parseFloat(m[0]) || 0)) : 0;
        out.push(Number.isFinite(num) ? num : 0);
      } catch (err) {
        console.error("[GeminiProvider]", err?.response?.data || err.message);
        out.push(0);
      }
    }

    return out;
  }
}
