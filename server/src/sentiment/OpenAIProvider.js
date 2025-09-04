/** 
 * -----------------------------------------------------------------------------
 * OpenAIProvider — optional, BYO key
 * -----------------------------------------------------------------------------
 * PURPOSE
 *   Sentiment scorer backed by OpenAI’s Chat Completions API. This provider is
 *   opt-in: users supply their own API key and we issue one request per text,
 *   asking the model to return a single numeric score in [-1, 1].
 *
 * CONTRACT
 *   Implements ISentimentProvider:
 *     analyzeBatch(texts: string[]) => Promise<number[]>
 *   - Returns one real-valued score per input, clamped to [-1, 1].
 *   - Output order matches input order 1:1.
 *
 * DESIGN DECISIONS
 *   - **Simplicity over throughput:** we call the API sequentially (one prompt
 *     per comment) to keep memory usage and request concurrency predictable.
 *     If you need speed, consider wrapping the inner call with a small
 *     concurrency limiter (e.g., p-limit 3–6) while watching rate limits (429).
 *   - **Determinism:** temperature is fixed at 0.0; the prompt instructs the
 *     model to output only a number. We still defensively regex-parse the first
 *     numeric token and clamp to [-1, 1].
 *   - **Failure policy:** if an individual call fails or parsing yields no
 *     number, we push 0 (neutral) to keep array lengths aligned for the caller.
 *   - **Config surface:** baseUrl/model are overridable; apiKey must be present
 *     or we throw early. We don’t log secrets here.
 *
 * COST/LATENCY NOTES
 *   - Each text incurs a chat completion call. For large corpora this can be
 *     slow/expensive. Prefer local providers (VADER/Ollama) for bulk scoring
 *     and reserve OpenAI for higher precision or smaller batches.
 * -----------------------------------------------------------------------------
 */

/** OpenAI provider — JSON output + robust parsing */
import { ISentimentProvider } from "./ISentimentProvider.js"
import axios from "axios"

export class OpenAIProvider extends ISentimentProvider{
  /**
   * @param {{ apiKey?: string, model?: string, baseUrl?: string }} [opts]
   *   apiKey  : required
   *   model   : default 'gpt-4o-mini'
   *   baseUrl : default 'https://api.openai.com/v1'
   */
  constructor(opts={}) {
    super()
    this.apiKey  = opts.apiKey || ""
    this.model   = opts.model  || "gpt-4o-mini"
    this.baseUrl = opts.baseUrl|| "https://api.openai.com/v1"
  }

  async analyzeBatch(texts){
    if (!this.apiKey) throw new Error("OpenAI API key missing")
    const out = []

    for (const text of texts){
      // System: define contract + numeric range; JSON only
      const system = [
        "You are a strict sentiment scorer.",
        "Return ONLY a JSON object with a single key: score.",
        "The value is a real number in [-1, 1]. No extra fields, no prose.",
        "Example: {\"score\": -0.42}"
      ].join(" ")

      const user = [
        "Score the sentiment of this YouTube comment in [-1, 1].",
        "Definitions:",
        "- Strong negative: -0.6..-1.0",
        "- Mild negative:   -0.2..-0.6",
        "- Neutral:         -0.1..0.1",
        "- Mild positive:    0.2..0.6",
        "- Strong positive:  0.6..1.0",
        "Comment:",
        text
      ].join("\n")

      try{
        const { data } = await axios.post(
          `${this.baseUrl}/chat/completions`,
          {
            model: this.model,
            messages: [
              { role: "system", content: system },
              { role: "user",   content: user }
            ],
            temperature: 0.3,
            max_tokens: 10,
            // Enforce pure JSON object in the response
            response_format: { type: "json_object" }
          },
          { headers: { Authorization: `Bearer ${this.apiKey}` }, timeout: 45000 }
        )

        const raw = data?.choices?.[0]?.message?.content ?? ""
        let score = 0

        // Primary: parse strict JSON {"score": number}
        try{
          const obj = JSON.parse(raw)
          score = Number(obj?.score)
        }catch{
          // Fallback: robust numeric parse
          score = this.#fallbackParse(raw)
        }

        if (!Number.isFinite(score)) score = 0
        // Clamp + (optional) tiny deadzone if you like less jitter:
        // if (Math.abs(score) < 0.05) score = 0
        score = Math.max(-1, Math.min(1, score))

        out.push(score)
      }catch{
        out.push(0)
      }
    }
    return out
  }

  // Accept numeric-only strings and leading-dot floats, e.g. ".73"
  #fallbackParse(s){
    const t = String(s).trim()
    // If it's purely a number (possibly with whitespace), enforce full-string match
    const exact = t.match(/^\s*-?(?:\d+(?:\.\d+)?|\.\d+)\s*$/)
    if (exact) return parseFloat(exact[0])

    // Otherwise, find the first plausible float anywhere
    const loose = t.match(/-?(?:\d+(?:\.\d+)?|\.\d+)/)
    return loose ? parseFloat(loose[0]) : 0
  }
}

