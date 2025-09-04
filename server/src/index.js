/**
 * Express API
 * -----------
 * WHAT: Thin server exposing endpoints for scoring, metadata, and summarization.
 * WHY: Keeps tokens and API keys server-side, adds caching/throttling, and structures
 *      responses for the React client.
 */
import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { parseVideoId, fetchAllComments, fetchVideoMeta } from "./youtube.js"
import { buildProvider } from "./sentiment/factory.js"
import axios from "axios"

dotenv.config()
const app=express()

/** CORS: allow local dev by default, but keep it configurable. */
const ALLOWED_ORIGINS=(process.env.ALLOWED_ORIGINS||'*').split(',').map(s=>s.trim())
app.use(cors({origin:(origin,cb)=>(!origin||ALLOWED_ORIGINS.includes('*')||ALLOWED_ORIGINS.includes(origin))?cb(null,true):cb(new Error('Not allowed by CORS'))}))
app.use(express.json())

/** Extremely simple in-memory LRU cache to avoid rescoring same (video,model) within TTL. */
const CACHE_ENABLED=process.env.CACHE_ENABLED==='true'
const CACHE_MAX_ITEMS=Number(process.env.CACHE_MAX_ITEMS||50)
const CACHE_TTL_MS=Number(process.env.CACHE_TTL_MS||15*60*1000)
const cacheMap=new Map()
function cacheGet(key){
  if(!CACHE_ENABLED) return null
  const e=cacheMap.get(key); if(!e) return null
  if(Date.now()-e.ts>CACHE_TTL_MS){cacheMap.delete(key); return null}
  // move to back (MRU)
  cacheMap.delete(key); cacheMap.set(key,e); return e.value
}
function cacheSet(key,value){
  if(!CACHE_ENABLED) return
  if(cacheMap.has(key)) cacheMap.delete(key)
  cacheMap.set(key,{ts:Date.now(),value})
  while(cacheMap.size>CACHE_MAX_ITEMS){ const oldest=cacheMap.keys().next().value; cacheMap.delete(oldest) }
}

/** Progress map so client can show a progress bar while batches are scoring. */
const progress=new Map()
app.get("/api/progress",(req,res)=>{
  const jobId=String(req.query.jobId||"")
  res.json(progress.get(jobId)||{totalPages:0,fetchedPages:0,totalTexts:0,scoredTexts:0})
})

const PORT=process.env.PORT||5177
const API_KEY=process.env.YOUTUBE_API_KEY
if(!API_KEY) console.warn("[WARN] YOUTUBE_API_KEY missing — set it in server/.env")

app.get("/api/health",(_,res)=>res.json({ok:true}))

/**
 * GET /api/comments_scored
 * ------------------------
 * - Validates/normalizes video ID
 * - Streams all comments (w/ throttling)
 * - Batches sentiment scoring
 * - Caches results keyed by (videoId, model)
 */
app.get("/api/comments_scored",async(req,res)=>{
  try{
    const videoInput=String(req.query.videoId||"")
    const model=String(req.query.model||"vader")
    const perRequestApiKey=req.header("X-API-Key")||""
    const jobId=String(req.query.jobId||"")

    const videoId=parseVideoId(videoInput)
    if(!videoId) return res.status(400).json({error:"Invalid video URL or ID"})

    const cacheKey=`v:${videoId}|m:${model}`
    const cached=cacheGet(cacheKey)
    if(cached) return res.json({...cached,cached:true})

    // Track progress for client polling (lightweight — only approximate counts).
    if(jobId) progress.set(jobId,{totalPages:0,fetchedPages:0,totalTexts:0,scoredTexts:0})

    const items=await fetchAllComments(
      videoId, API_KEY, 200,
      (p)=>{ if(jobId){ const cur=progress.get(jobId)||{totalPages:0,fetchedPages:0,totalTexts:0,scoredTexts:0}; progress.set(jobId,{...cur,fetchedPages:p.fetchedPages||cur.fetchedPages}) } },
      Number(process.env.YT_THROTTLE_MS||200)
    )

    // Flatten texts for a single batch scoring pass (parent first, then replies per thread).
    const texts=[]
    items.forEach(it=>{
      texts.push(it.textOriginal||"")
      for(const rp of (it.replies||[])) texts.push(rp.textOriginal||"")
    })
    if(jobId){ const cur=progress.get(jobId)||{totalPages:0,fetchedPages:0,totalTexts:0,scoredTexts:0}; progress.set(jobId,{...cur,totalTexts:texts.length,scoredTexts:0}) }

    // Provider selection (strategy) with optional API key.
    const provider=buildProvider(model,{apiKey:perRequestApiKey})

    // Score in chunks to avoid huge payloads/timeouts.
    const scores=[]; const batchSize=50
    for(let i=0;i<texts.length;i+=batchSize){
      const partial=await provider.analyzeBatch(texts.slice(i,i+batchSize))
      scores.push(...partial)
      if(jobId){ const cur=progress.get(jobId)||{totalPages:0,fetchedPages:0,totalTexts:texts.length,scoredTexts:0}; progress.set(jobId,{...cur,scoredTexts:Math.min(texts.length,(cur.scoredTexts+partial.length))}) }
    }

    // Rehydrate scores back into each thread in order.
    let k=0
    const scored=items.map(it=>{
      const parentScore=Number(scores[k++]??0)
      const replies=(it.replies||[]).map(r=>{
        const s=Number(scores[k++]??0)
        return {...r, base:Number.isFinite(s)?s:0}
      })
      return {...it, base:Number.isFinite(parentScore)?parentScore:0, replies}
    })

    const payload={videoId,model,count:scored.length,items:scored}
    cacheSet(cacheKey,payload)
    res.json(payload)
  }catch(err){
    console.error("[comments_scored]",err?.response?.data||err?.message||err)
    res.status(500).json({error:"Failed to fetch or score comments"})
  }
})

/** Video metadata for the top card. */
app.get("/api/video_meta",async(req,res)=>{
  try{
    const videoId=parseVideoId(String(req.query.videoId||""))
    if(!videoId) return res.status(400).json({error:"Invalid video URL or ID"})
    const meta=await fetchVideoMeta(videoId,API_KEY)
    if(!meta) return res.status(404).json({error:"Video not found"})
    res.json(meta)
  }catch(e){
    console.error("[/api/video_meta]",e?.message||e)
    res.status(500).json({error:"Failed to fetch metadata"})
  }
})

/**
 * POST /api/summarize
 * -------------------
 * Summarizes comment themes. For LLaMA/OpenAI we chunk + merge to prevent long-context failures.
 * For VADER (no model), we return a small lexicon-based fallback so users always get something.
 */
app.post("/api/summarize",async(req,res)=>{
  try{
    const {texts=[], model="vader"}=req.body||{}
    const perRequestApiKey=req.header("X-API-Key")||""
    const provider=buildProvider(model,{apiKey:perRequestApiKey})
    const ctor=provider?.constructor?.name||""

    async function llamaSumm(textsArr){
      const chunkSize=120
      const chunks=[]; for(let i=0;i<textsArr.length;i+=chunkSize) chunks.push(textsArr.slice(i,i+chunkSize))
      const partials=[]
      for(const c of chunks){
        // IMPORTANT: use \n inside template literals to avoid syntax errors on Windows/Node.
        const prompt = `Summarize key sentiment themes (positive/negative/mixed) across these comments in 3 short bullets. No preamble.\n- ${c.join('\n- ')}`
        const {data}=await axios.post(`${provider.host}/api/generate`,{model:provider.model,prompt,stream:false},{timeout:45000})
        partials.push(String(data?.response||"").trim())
      }
      const finalPrompt = `Merge these bullet summaries into 3-6 concise bullets (no preamble):\n${partials.map(p=>"- "+p).join("\n")}`
      const {data:final}=await axios.post(`${provider.host}/api/generate`,{model:provider.model,prompt:finalPrompt,stream:false},{timeout:45000})
      return String(final?.response||"").trim()
    }

    async function openaiSumm(textsArr){
      const chunkSize=200
      const chunks=[]; for(let i=0;i<textsArr.length;i+=chunkSize) chunks.push(textsArr.slice(i,i+chunkSize))
      const partials=[]
      for(const c of chunks){
        const prompt = `Return ONLY 3 bullets summarizing comment sentiment (positive/negative/mixed). Keep terse.\n- ${c.join('\n- ')}`
        const {data}=await axios.post(`${provider.baseUrl}/chat/completions`,{model:provider.model,messages:[{role:"user",content:prompt}],temperature:0.2},{headers:{Authorization:`Bearer ${provider.apiKey}`},timeout:45000})
        partials.push(String(data?.choices?.[0]?.message?.content||"").trim())
      }
      const mergePrompt = `Merge these bullets into 3-6 concise bullets (no preamble):\n${partials.map(p=>"- "+p).join("\n")}`
      const {data:merged}=await axios.post(`${provider.baseUrl}/chat/completions`,{model:provider.model,messages:[{role:"user",content:mergePrompt}],temperature:0.2},{headers:{Authorization:`Bearer ${provider.apiKey}`},timeout:45000})
      return String(merged?.choices?.[0]?.message?.content||"").trim()
    }

    if(ctor==="OllamaLlama3Provider") return res.json({summary:await llamaSumm(texts), model})
    if(ctor==="OpenAIProvider") return res.json({summary:await openaiSumm(texts), model})

    // VADER fallback — ensure users always get a short summary even without LLM access.
    const sample=texts.slice(0,500).join(" ")
    const posWords=(sample.match(/\b(good|great|love|amazing|nice|awesome|excellent|helpful|cool)\b/gi)||[]).length
    const negWords=(sample.match(/\b(bad|terrible|hate|awful|worse|worst|boring|lame|stupid|annoying|fake|trash)\b/gi)||[]).length
    const tilt=posWords-negWords
    const tone=tilt>5?"mostly positive":tilt<-5?"mostly negative":"mixed/neutral"
    return res.json({ summary: `• Overall tone is ${tone}.\n• Lexicon suggests key emotional tilt.\n• Use OpenAI/Ollama for richer summaries.`, model })
  }catch(err){
    console.error("[/api/summarize]",err?.message||err)
    res.status(500).json({error:"Failed to summarize"})
  }
})

app.get("/",(_,res)=>res.type("text/plain").send("API up. Use the React client on http://localhost:5173"))
app.listen(PORT,()=>console.log(`[server] Listening on http://localhost:${PORT}`))
