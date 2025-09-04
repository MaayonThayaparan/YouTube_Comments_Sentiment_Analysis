import { ISentimentProvider } from "./ISentimentProvider.js"
import axios from "axios"
export class OllamaLlama3Provider extends ISentimentProvider {
  constructor(opts = {}){ super(); this.host = opts.host || "http://localhost:11434"; this.model = opts.model || "llama3" }
  async analyzeBatch(texts){
    const out = []
    for(const text of texts){
      const prompt = this.#buildPrompt(text || "")
      try{
        const { data } = await axios.post(`${this.host}/api/generate`, { model: this.model, prompt, stream: false }, { timeout: 30000 })
        out.push(this.#parseScore(data?.response))
      }catch{ out.push(0) }
    }
    return out
  }
  #buildPrompt(text){ const safe = (text||"").replace(/"/g,'\\"'); return "You are a sentiment scorer. Return a number between -1 and 1 only.\\nComment: \\\"" + safe + "\\\"\\nScore:" }
  #parseScore(resp){ if(!resp) return 0; const m = resp.match(/-?\d+(?:\.\d+)?/); if(!m) return 0; let v = parseFloat(m[0]); if(!Number.isFinite(v)) return 0; return Math.max(-1, Math.min(1, v)) }
}
