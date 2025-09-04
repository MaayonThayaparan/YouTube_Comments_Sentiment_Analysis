\
import { ISentimentProvider } from "./ISentimentProvider.js"
import axios from "axios"
export class OllamaLlama3Provider extends ISentimentProvider{
  constructor(opts={}){ super(); this.host=opts.host||"http://localhost:11434"; this.model=opts.model||"llama3" }
  async analyzeBatch(texts){
    const out=[]
    for(const text of texts){
      const prompt=this.#buildPrompt(text||"")
      try{
        const {data}=await axios.post(`${this.host}/api/generate`,{model:this.model,prompt,stream:false},{timeout:45000})
        let v=this.#parseScore(data?.response)
        if(Math.abs(v)<0.05) v=0
        out.push(v)
      }catch{ out.push(0) }
    }
    return out
  }
  #buildPrompt(text){
    const safe=(text||"").replace(/"/g,'\\"')
    return `You are a STRICT sentiment scorer. Output ONLY a number in [-1,1].
Rules:
- Strong negative: -0.6 to -1.0
- Mild negative:   -0.2 to -0.6
- Neutral:         -0.1 to 0.1
- Mild positive:    0.2 to 0.6
- Strong positive:  0.6 to 1.0
Text: "${safe}"
Score:`
  }
  #parseScore(resp){
    if(!resp) return 0
    const m=String(resp).match(/-?\d+(?:\.\d+)?/)
    if(!m) return 0
    const v=parseFloat(m[0])
    if(!Number.isFinite(v)) return 0
    return Math.max(-1,Math.min(1,v))
  }
}
