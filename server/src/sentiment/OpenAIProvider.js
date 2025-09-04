import { ISentimentProvider } from "./ISentimentProvider.js"
import axios from "axios"
export class OpenAIProvider extends ISentimentProvider {
  constructor(opts = {}){ super(); this.apiKey = opts.apiKey || ""; this.model = opts.model || "gpt-4o-mini"; this.baseUrl = opts.baseUrl || "https://api.openai.com/v1" }
  async analyzeBatch(texts){
    if(!this.apiKey) throw new Error("OpenAI API key missing")
    const out = []
    for(const text of texts){
      const prompt = `Return only a number in [-1,1] indicating sentiment (negative..positive). No explanation.\nComment: ${text}\nScore:`
      try{
        const { data } = await axios.post(`${this.baseUrl}/chat/completions`, { model: this.model, messages: [{ role: "user", content: prompt }], temperature: 0.0 }, { headers: { Authorization: `Bearer ${this.apiKey}` }, timeout: 30000 })
        const content = data?.choices?.[0]?.message?.content || ""
        const m = content.match(/-?\d+(?:\.\d+)?/); out.push(m ? Math.max(-1, Math.min(1, parseFloat(m[0])||0)) : 0)
      }catch{ out.push(0) }
    }
    return out
  }
}
