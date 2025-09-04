/**
 * -----------------------------------------------------------------------------
 * Server: Express API (v11)
 * -----------------------------------------------------------------------------
 * PURPOSE
 *   Thin HTTP layer for the YouTube sentiment explorer. Aggregates comment
 *   threads from YouTube, runs sentiment analysis via pluggable providers,
 *   exposes results to the React client, and offers a lightweight summarizer.
 *
 * ENDPOINTS (public)
 *   GET  /api/health
 *   GET  /api/progress?jobId=...
 *   GET  /api/comments_scored?videoId=...&model=...
 *   GET  /api/video_meta?videoId=...
 *   POST /api/summarize  { texts: string[], model?: string }
 *
 * DESIGN DECISIONS
 *   - Keep the server stateless relative to jobs: any per-request state lives
 *     in short-lived in-memory structures (LRU cache, progress map). This keeps
 *     the implementation simple for a single-instance dev deployment.
 *   - Sentiment analysis is delegated to a provider abstraction
 *     (see ./sentiment/factory.js). The server only coordinates batching and
 *     mapping scores back to comments.
 *   - YouTube fetch logic (thread pagination, author enrichment, replies paging)
 *     is centralized in youtube.js to keep this file focused on HTTP concerns.
 *   - CORS is allow-list driven (ALLOWED_ORIGINS) and defaults to "*"
 *     for local development ergonomics.
 *
 * ENV VARS (server/.env)
 *   PORT=5177                      // express listen port
 *   YOUTUBE_API_KEY=...            // required for YouTube Data API v3
 *   ALLOWED_ORIGINS=http://...     // CSV allow-list for CORS
 *   CACHE_ENABLED=true|false       // enable LRU response cache
 *   CACHE_MAX_ITEMS=50             // max entries in cache
 *   CACHE_TTL_MS=900000            // per-entry TTL (ms)
 *   YT_THROTTLE_MS=200             // polite delay between YT page fetches
 *
 * OPERATIONAL NOTES
 *   - The in-memory cache/progress map are fine for dev and single-node use.
 *     For multi-instance deployments, replace with a distributed store
 *     (e.g., Redis) and move job progress to a durable queue if needed.
 *   - This API returns plain JSON; streaming is not required for current UX.
 * -----------------------------------------------------------------------------
 */

import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { parseVideoId, fetchAllComments, fetchVideoMeta } from "./youtube.js"
import { buildProvider } from "./sentiment/factory.js"
import axios from "axios"

dotenv.config()
const app=express()

/**
 * CORS
 * ----
 * - Allow-list driven. If ALLOWED_ORIGINS contains "*" or the specific Origin,
 *   the request is allowed. Non-browser clients (no Origin) are permitted.
 */
const ALLOWED_ORIGINS=(process.env.ALLOWED_ORIGINS||'*').split(',').map(s=>s.trim())
app.use(cors({
  origin:(origin,cb)=>(!origin||ALLOWED_ORIGINS.includes('*')||ALLOWED_ORIGINS.includes(origin))
    ? cb(null,true)
    : cb(new Error('Not allowed by CORS'))
}))

/** JSON body parser for POST /api/summarize payloads */
app.use(express.json())

/**
 * Response Cache (LRU + TTL)
 * --------------------------
 * - Small in-memory LRU with TTL to avoid re-scoring the same video/model pair.
 * - Keys are "v:<videoId>|m:<model>".
 * - When TTL expires, entry is dropped. On get, we re-insert to update recency.
 * - For multi-node, swap with a shared store.
 */
const CACHE_ENABLED=process.env.CACHE_ENABLED==='true'
const CACHE_MAX_ITEMS=Number(process.env.CACHE_MAX_ITEMS||50)
const CACHE_TTL_MS=Number(process.env.CACHE_TTL_MS||15*60*1000)
const cacheMap=new Map()
function cacheGet(key){
  if(!CACHE_ENABLED) return null
  const e=cacheMap.get(key)
  if(!e) return null
  if(Date.now()-e.ts>CACHE_TTL_MS){ cacheMap.delete(key); return null }
  // LRU bump: delete+set to move to Map's end
  cacheMap.delete(key); cacheMap.set(key,e)
  return e.value
}
function cacheSet(key,value){
  if(!CACHE_ENABLED) return
  if(cacheMap.has(key)) cacheMap.delete(key)
  cacheMap.set(key,{ts:Date.now(),value})
  while(cacheMap.size>CACHE_MAX_ITEMS){
    const oldest=cacheMap.keys().next().value
    cacheMap.delete(oldest)
  }
}

/**
 * Job Progress
 * ------------
 * - Ephemeral map of jobId -> { totalPages, fetchedPages, totalTexts, scoredTexts }.
 * - /api/comments_scored updates this as it fetches and scores.
 * - Clients may poll /api/progress?jobId=... for coarse progress UI.
 * - Not persisted across restarts.
 */
const progress=new Map()
app.get("/api/progress",(req,res)=>{
  const jobId=String(req.query.jobId||"")
  res.json(progress.get(jobId)||{totalPages:0,fetchedPages:0,totalTexts:0,scoredTexts:0})
})

/** Boot diagnostics */
const PORT=process.env.PORT||5177
const API_KEY=process.env.YOUTUBE_API_KEY
if(!API_KEY) console.warn("[WARN] YOUTUBE_API_KEY missing — set it in server/.env")

/** Liveness probe for infra/testing */
app.get("/api/health",(_,res)=>res.json({ok:true}))

/**
 * GET /api/comments_scored
 * ------------------------
 * Query:
 *   - videoId: YouTube URL or ID (parseVideoId handles both)
 *   - model:   sentiment provider key (defaults to 'vader' in the UI)
 *   - jobId:   optional client-side id to track progress
 * Headers:
 *   - X-API-Key: optional per-request provider key (e.g., OpenAI)
 *
 * Flow:
 *   1) Validate/normalize videoId; return 400 on bad input.
 *   2) Cache lookup by (videoId, model) to skip recomputation.
 *   3) Fetch all threads + replies + author enrichment (youtube.js),
 *      reporting pagination progress via the provided callback.
 *   4) Flatten parent+reply texts; batch to provider.analyzeBatch for scoring.
 *   5) Map scores back to the original items (parent first, then each reply).
 *   6) Cache and return { videoId, model, count, items }.
 *
 * Notes:
 *   - Batch size is conservative (50) to play nicely with external APIs.
 *   - Progress map is updated during both fetch and scoring phases.
 */
app.get("/api/comments_scored",async(req,res)=>{
  try{
    const videoInput=String(req.query.videoId||""); const model=String(req.query.model||"vader"); const perRequestApiKey=req.header("X-API-Key")||""; const jobId=String(req.query.jobId||"")
    const videoId=parseVideoId(videoInput); if(!videoId) return res.status(400).json({error:"Invalid video URL or ID"})

    const cacheKey=`v:${videoId}|m:${model}`; const cached=cacheGet(cacheKey); if(cached) return res.json({...cached,cached:true})

    if(jobId) progress.set(jobId,{totalPages:0,fetchedPages:0,totalTexts:0,scoredTexts:0})

    const items=await fetchAllComments(
      videoId,
      API_KEY,
      200,
      (p)=>{ if(jobId){ const cur=progress.get(jobId)||{totalPages:0,fetchedPages:0,totalTexts:0,scoredTexts:0}; progress.set(jobId,{...cur,fetchedPages:p.fetchedPages||cur.fetchedPages,totalPages:p.totalPages||cur.totalPages}) } },
      Number(process.env.YT_THROTTLE_MS||200)
    )

    // Build the scoring corpus: parent first, then replies in order.
    const texts=[]; items.forEach(it=>{texts.push(it.textOriginal||""); for(let j=0;j<(it.replies?.length||0);j++) texts.push(it.replies[j].textOriginal||"") })
    if(jobId){ const cur=progress.get(jobId)||{totalPages:0,fetchedPages:0,totalTexts:0,scoredTexts:0}; progress.set(jobId,{...cur,totalTexts:texts.length,scoredTexts:0}) }

    // Resolve a provider implementation for the requested model.
    const provider=buildProvider(model,{apiKey:perRequestApiKey})

    // Score in chunks to respect provider limits and avoid timeouts.
    const scores=[]; const batchSize=50
    for(let i=0;i<texts.length;i+=batchSize){
      const partial=await provider.analyzeBatch(texts.slice(i,i+batchSize))
      scores.push(...partial)
      if(jobId){ const cur=progress.get(jobId)||{totalPages:0,fetchedPages:0,totalTexts:texts.length,scoredTexts:0}; progress.set(jobId,{...cur,scoredTexts:Math.min(texts.length,(cur.scoredTexts+partial.length))}) }
    }

    // Rehydrate results to original structure (parent score + each reply score).
    let k=0; const scored=items.map(it=>{
      const parentScore=Number(scores[k++]??0)
      const replies=(it.replies||[]).map(r=>{
        const s=Number(scores[k++]??0)
        return {...r,base:Number.isFinite(s)?s:0}
      })
      return {...it,base:Number.isFinite(parentScore)?parentScore:0,replies}
    })

    const payload={videoId,model,count:scored.length,items:scored}
    cacheSet(cacheKey,payload)
    res.json(payload)
  }catch(err){
    console.error("[comments_scored]",err?.response?.data||err?.message||err)
    res.status(500).json({error:"Failed to fetch or score comments"})
  }
})

/**
 * GET /api/video_meta
 * -------------------
 * Returns normalized video/channel metadata for client dashboards.
 * Delegates to youtube.js; responds 404 when the video is not found.
 */
app.get("/api/video_meta",async(req,res)=>{
  try{
    const videoId=parseVideoId(String(req.query.videoId||"")); if(!videoId) return res.status(400).json({error:"Invalid video URL or ID"})
    const meta=await fetchVideoMeta(videoId,API_KEY); if(!meta) return res.status(404).json({error:"Video not found"})
    res.json(meta)
  }catch(e){
    console.error("[/api/video_meta]",e?.message||e)
    res.status(500).json({error:"Failed to fetch metadata"})
  }
})

/**
 * POST /api/summarize
 * -------------------
 * Body: { texts: string[], model?: 'vader'|'openai'|'ollama'... }
 * Header: X-API-Key for provider auth (when applicable).
 *
 * Strategy:
 *   - Chunk the corpus and ask the model for terse bullets per chunk.
 *   - Merge the partials into a final, concise set of bullets.
 *
 * Providers:
 *   - Ollama (local llama): /api/generate
 *   - OpenAI (Chat Completions): /chat/completions
 *   - Fallback: naive lexicon tilt (fast, coarse).
 *
 * Notes:
 *   - Maintains the "newline fix" (use '\n') to keep prompt formatting stable.
 *   - Temperature is low for determinism; timeouts are capped at 45s per call.
 */
app.post("/api/summarize",async(req,res)=>{
  try{
    const {texts=[], model="vader"}=req.body||{}; const perRequestApiKey=req.header("X-API-Key")||""; const provider=buildProvider(model,{apiKey:perRequestApiKey}); const ctor=provider?.constructor?.name||""

    // Provider-specific chunked summarization for local llama (Ollama)
    async function llamaSumm(textsArr){
      const chunkSize=120; const chunks=[]; for(let i=0;i<textsArr.length;i+=chunkSize) chunks.push(textsArr.slice(i,i+chunkSize))
      const partials=[]; for(const c of chunks){
        const prompt = `Summarize key sentiment themes (positive/negative/mixed) across these comments in 3 short bullets. No preamble.\n- ${c.join('\n- ')}`
        const {data}=await axios.post(`${provider.host}/api/generate`,{model:provider.model,prompt,stream:false},{timeout:45000})
        partials.push(String(data?.response||"").trim())
      }
      const finalPrompt = `Merge these bullet summaries into 3-6 concise bullets (no preamble):\n${partials.map(p=>"- "+p).join("\n")}`
      const {data:final}=await axios.post(`${provider.host}/api/generate`,{model:provider.model,prompt:finalPrompt,stream:false},{timeout:45000})
      return String(final?.response||"").trim()
    }

    // Provider-specific chunked summarization for OpenAI
    async function openaiSumm(textsArr){
      const chunkSize=200; const chunks=[]; for(let i=0;i<textsArr.length;i+=chunkSize) chunks.push(textsArr.slice(i,i+chunkSize))
      const partials=[]; for(const c of chunks){
        const prompt = `Return ONLY 3 bullets summarizing comment sentiment (positive/negative/mixed). Keep terse.\n- ${c.join('\n- ')}`
        const {data}=await axios.post(`${provider.baseUrl}/chat/completions`,{model:provider.model,messages:[{role:"user",content:prompt}],temperature:0.2},{headers:{Authorization:`Bearer ${provider.apiKey}`},timeout:45000})
        partials.push(String(data?.choices?.[0]?.message?.content||"").trim())
      }
      const mergePrompt = `Merge these bullets into 3-6 concise bullets (no preamble):\n${partials.map(p=>"- "+p).join("\n")}`
      const {data:merged}=await axios.post(`${provider.baseUrl}/chat/completions`,{model:provider.model,messages:[{role:"user",content:mergePrompt}],temperature:0.2},{headers:{Authorization:`Bearer ${provider.apiKey}`},timeout:45000})
      return String(merged?.choices?.[0]?.message?.content||"").trim()
    }

    // Dispatch based on provider type
    if(ctor==="OllamaLlama3Provider") return res.json({summary:await llamaSumm(texts), model})
    if(ctor==="OpenAIProvider") return res.json({summary:await openaiSumm(texts), model})

    // Fallback: ultra-fast heuristic when no LLM provider is configured.
    const sample=texts.slice(0,500).join(" "); const posWords=(sample.match(/\b(good|great|love|amazing|nice|awesome|excellent|helpful|cool)\b/gi)||[]).length; const negWords=(sample.match(/\b(bad|terrible|hate|awful|worse|worst|boring|lame|stupid|annoying|fake|trash)\b/gi)||[]).length
    const tilt=posWords-negWords; const tone=tilt>5?"mostly positive":tilt<-5?"mostly negative":"mixed/neutral"
    return res.json({ summary: `• Overall tone is ${tone}.\n• Lexicon suggests key emotional tilt.\n• Use OpenAI/Ollama for richer summaries.`, model })
  }catch(err){
    console.error("[/api/summarize]",err?.message||err)
    res.status(500).json({error:"Failed to summarize"})
  }
})

/** Dev root: quick sanity response. */
app.get("/",(_,res)=>res.type("text/plain").send("API up. Use the React client on http://localhost:5173"))

/** Startup */
app.listen(PORT,()=>console.log(`[server] Listening on http://localhost:${PORT}`))
