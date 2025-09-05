/**
 * Express API v11
 * - Keeps summarize newline fix (uses \n)
 * - Adds author enrichment in /api/comments_scored via youtube.js
 */
import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { parseVideoId, fetchAllComments, fetchVideoMeta } from "./youtube.js"
import { buildProvider } from "./sentiment/factory.js"
import axios from "axios"

dotenv.config()
const app=express()
const ALLOWED_ORIGINS=(process.env.ALLOWED_ORIGINS||'*').split(',').map(s=>s.trim())
app.use(cors({origin:(origin,cb)=>(!origin||ALLOWED_ORIGINS.includes('*')||ALLOWED_ORIGINS.includes(origin))?cb(null,true):cb(new Error('Not allowed by CORS'))}))
app.use(express.json())

const CACHE_ENABLED=process.env.CACHE_ENABLED==='true'
const CACHE_MAX_ITEMS=Number(process.env.CACHE_MAX_ITEMS||50)
const CACHE_TTL_MS=Number(process.env.CACHE_TTL_MS||15*60*1000)
const cacheMap=new Map()
function cacheGet(key){ if(!CACHE_ENABLED) return null; const e=cacheMap.get(key); if(!e) return null; if(Date.now()-e.ts>CACHE_TTL_MS){cacheMap.delete(key); return null} cacheMap.delete(key); cacheMap.set(key,e); return e.value}
function cacheSet(key,value){ if(!CACHE_ENABLED) return; if(cacheMap.has(key)) cacheMap.delete(key); cacheMap.set(key,{ts:Date.now(),value}); while(cacheMap.size>CACHE_MAX_ITEMS){ const oldest=cacheMap.keys().next().value; cacheMap.delete(oldest) }}

const progress=new Map()
app.get("/api/progress",(req,res)=>{const jobId=String(req.query.jobId||""); res.json(progress.get(jobId)||{totalPages:0,fetchedPages:0,totalTexts:0,scoredTexts:0})})

const PORT=process.env.PORT||5177
const API_KEY=process.env.YOUTUBE_API_KEY
if(!API_KEY) console.warn("[WARN] YOUTUBE_API_KEY missing — set it in server/.env")

app.get("/api/health",(_,res)=>res.json({ok:true}))

app.get("/api/comments_scored",async(req,res)=>{
  try{
    const videoInput=String(req.query.videoId||""); const model=String(req.query.model||"vader"); const perRequestApiKey=req.header("X-API-Key")||""; const jobId=String(req.query.jobId||"")
    const videoId=parseVideoId(videoInput); if(!videoId) return res.status(400).json({error:"Invalid video URL or ID"})
    const cacheKey=`v:${videoId}|m:${model}`; const cached=cacheGet(cacheKey); if(cached) return res.json({...cached,cached:true})
    if(jobId) progress.set(jobId,{totalPages:0,fetchedPages:0,totalTexts:0,scoredTexts:0})
    const items=await fetchAllComments(videoId,API_KEY,200,(p)=>{ if(jobId){ const cur=progress.get(jobId)||{totalPages:0,fetchedPages:0,totalTexts:0,scoredTexts:0}; progress.set(jobId,{...cur,fetchedPages:p.fetchedPages||cur.fetchedPages,totalPages:p.totalPages||cur.totalPages}) } }, Number(process.env.YT_THROTTLE_MS||200))
    const texts=[]; items.forEach(it=>{texts.push(it.textOriginal||""); for(let j=0;j<(it.replies?.length||0);j++) texts.push(it.replies[j].textOriginal||"") })
    if(jobId){ const cur=progress.get(jobId)||{totalPages:0,fetchedPages:0,totalTexts:0,scoredTexts:0}; progress.set(jobId,{...cur,totalTexts:texts.length,scoredTexts:0}) }
    const provider=buildProvider(model,{apiKey:perRequestApiKey})
    const scores=[]; const batchSize=50
    for(let i=0;i<texts.length;i+=batchSize){ const partial=await provider.analyzeBatch(texts.slice(i,i+batchSize)); scores.push(...partial); if(jobId){ const cur=progress.get(jobId)||{totalPages:0,fetchedPages:0,totalTexts:texts.length,scoredTexts:0}; progress.set(jobId,{...cur,scoredTexts:Math.min(texts.length,(cur.scoredTexts+partial.length))}) } }
    let k=0; const scored=items.map(it=>{const parentScore=Number(scores[k++]??0); const replies=(it.replies||[]).map(r=>{const s=Number(scores[k++]??0); return {...r,base:Number.isFinite(s)?s:0}}); return {...it,base:Number.isFinite(parentScore)?parentScore:0,replies} })
    const payload={videoId,model,count:scored.length,items:scored}; cacheSet(cacheKey,payload); res.json(payload)
  }catch(err){ console.error("[comments_scored]",err?.response?.data||err?.message||err); res.status(500).json({error:"Failed to fetch or score comments"}) }
})

app.get("/api/video_meta",async(req,res)=>{
  try{
    const videoId=parseVideoId(String(req.query.videoId||"")); if(!videoId) return res.status(400).json({error:"Invalid video URL or ID"})
    const meta=await fetchVideoMeta(videoId,API_KEY); if(!meta) return res.status(404).json({error:"Video not found"})
    res.json(meta)
  }catch(e){ console.error("[/api/video_meta]",e?.message||e); res.status(500).json({error:"Failed to fetch metadata"}) }
})

app.post("/api/summarize",async(req,res)=>{
  try{
    const {texts=[], model="vader"}=req.body||{}; const perRequestApiKey=req.header("X-API-Key")||""; const provider=buildProvider(model,{apiKey:perRequestApiKey}); const ctor=provider?.constructor?.name||""
    async function llamaSumm(textsArr){
      const chunkSize=120; const chunks=[]; for(let i=0;i<textsArr.length;i+=chunkSize) chunks.push(textsArr.slice(i,i+chunkSize))
      const partials=[]; for(const c of chunks){ const prompt = `Summarize key sentiment themes (positive/negative/mixed) across these comments in 3 short bullets. No preamble.\n- ${c.join('\n- ')}`; const {data}=await axios.post(`${provider.host}/api/generate`,{model:provider.model,prompt,stream:false},{timeout:45000}); partials.push(String(data?.response||"").trim()) }
      const finalPrompt = `Merge these bullet summaries into 3-6 concise bullets (no preamble):\n${partials.map(p=>"- "+p).join("\n")}`
      const {data:final}=await axios.post(`${provider.host}/api/generate`,{model:provider.model,prompt:finalPrompt,stream:false},{timeout:45000})
      return String(final?.response||"").trim()
    }
    async function openaiSumm(textsArr){
      const chunkSize=200; const chunks=[]; for(let i=0;i<textsArr.length;i+=chunkSize) chunks.push(textsArr.slice(i,i+chunkSize))
      const partials=[]; for(const c of chunks){ const prompt = `Return ONLY 3 bullets summarizing comment sentiment (positive/negative/mixed). Keep terse.\n- ${c.join('\n- ')}`; const {data}=await axios.post(`${provider.baseUrl}/chat/completions`,{model:provider.model,messages:[{role:"user",content:prompt}],temperature:0.2},{headers:{Authorization:`Bearer ${provider.apiKey}`},timeout:45000}); partials.push(String(data?.choices?.[0]?.message?.content||"").trim()) }
      const mergePrompt = `Merge these bullets into 3-6 concise bullets (no preamble):\n${partials.map(p=>"- "+p).join("\n")}`
      const {data:merged}=await axios.post(`${provider.baseUrl}/chat/completions`,{model:provider.model,messages:[{role:"user",content:mergePrompt}],temperature:0.2},{headers:{Authorization:`Bearer ${provider.apiKey}`},timeout:45000})
      return String(merged?.choices?.[0]?.message?.content||"").trim()
    }
    async function geminiSumm(textsArr) {
      const chunkSize = 200;
      const chunks = [];
      for (let i = 0; i < textsArr.length; i += chunkSize)
        chunks.push(textsArr.slice(i, i + chunkSize));

      const partials = [];
      for (const c of chunks) {
        const prompt = `Return ONLY 3 bullets summarizing comment sentiment (positive/negative/mixed). Keep terse.\n- ${c.join(
          "\n- "
        )}`;
        const { data } = await axios.post(
          `${provider.baseUrl}/${provider.model}:generateContent?key=${provider.apiKey}`,
          { contents: [{ parts: [{ text: prompt }] }] },
          { timeout: 45000 }
        );
        partials.push(
          String(
            data?.candidates?.[0]?.content?.parts?.[0]?.text || ""
          ).trim()
        );
      }

      const mergePrompt = `Merge these bullets into 3-6 concise bullets (no preamble):\n${partials
        .map((p) => "- " + p)
        .join("\n")}`;

      const { data: merged } = await axios.post(
        `${provider.baseUrl}/${provider.model}:generateContent?key=${provider.apiKey}`,
        { contents: [{ parts: [{ text: mergePrompt }] }] },
        { timeout: 45000 }
      );

      return (
        merged?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
        "Failed to summarize"
      );
    }

    if (ctor === "GeminiProvider")
      return res.json({ summary: await geminiSumm(texts), model });

    if(ctor==="OllamaLlama3Provider") return res.json({summary:await llamaSumm(texts), model})
    if(ctor==="OpenAIProvider") return res.json({summary:await openaiSumm(texts), model})
    const sample=texts.slice(0,500).join(" "); const posWords=(sample.match(/\b(good|great|love|amazing|nice|awesome|excellent|helpful|cool)\b/gi)||[]).length; const negWords=(sample.match(/\b(bad|terrible|hate|awful|worse|worst|boring|lame|stupid|annoying|fake|trash)\b/gi)||[]).length
    const tilt=posWords-negWords; const tone=tilt>5?"mostly positive":tilt<-5?"mostly negative":"mixed/neutral"
    return res.json({ summary: `• Overall tone is ${tone}.\n• Use OpenAI/Gemini for richer summaries.`, model })
  }catch(err){ console.error("[/api/summarize]",err?.message||err); res.status(500).json({error:"Failed to summarize"}) }
})

app.get("/",(_,res)=>res.type("text/plain").send("API up. Use the React client on http://localhost:5173"))
app.listen(PORT,()=>console.log(`[server] Listening on http://localhost:${PORT}`))
