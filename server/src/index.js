import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { parseVideoId, fetchAllComments, fetchVideoMeta } from "./youtube.js"
import { buildProvider } from "./sentiment/factory.js"

dotenv.config()
const app = express()
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*').split(',').map(s=>s.trim())
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)) return cb(null, true)
    return cb(new Error('Not allowed by CORS'))
  }
}))
app.use(express.json())

// --- Simple in-memory LRU cache with TTL (opt-in via CACHE_ENABLED) ---
const CACHE_ENABLED = process.env.CACHE_ENABLED === 'true'
const CACHE_MAX_ITEMS = Number(process.env.CACHE_MAX_ITEMS || 50)
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 15*60*1000)
const cacheMap = new Map()
function cacheGet(key){ if(!CACHE_ENABLED) return null; const e=cacheMap.get(key); if(!e) return null; if(Date.now()-e.ts>CACHE_TTL_MS){ cacheMap.delete(key); return null } cacheMap.delete(key); cacheMap.set(key,e); return e.value }
function cacheSet(key,value){ if(!CACHE_ENABLED) return; if(cacheMap.has(key)) cacheMap.delete(key); cacheMap.set(key,{ts:Date.now(),value}); while(cacheMap.size>CACHE_MAX_ITEMS){ const oldestKey = cacheMap.keys().next().value; cacheMap.delete(oldestKey) } }

// --- Progress tracking (in-memory) ---
const progress = new Map()
app.get("/api/progress", (req, res) => {
  const jobId = String(req.query.jobId || "")
  const p = progress.get(jobId) || { totalPages: 0, fetchedPages: 0, totalTexts: 0, scoredTexts: 0 }
  res.json(p)
})

const PORT = process.env.PORT || 5177
const API_KEY = process.env.YOUTUBE_API_KEY
if (!API_KEY) console.warn("[WARN] YOUTUBE_API_KEY missing")

app.get("/api/health", (_, res) => res.json({ ok: true }))

// Fetch-only endpoint
app.get("/api/comments", async (req, res) => {
  try {
    const videoInput = String(req.query.videoId || "")
    const videoId = parseVideoId(videoInput)
    if (!videoId) return res.status(400).json({ error: "Invalid video URL or ID" })
    const data = await fetchAllComments(videoId, API_KEY, 200, null)
    res.json({ videoId, count: data.length, items: data })
  } catch (err) {
    console.error(err?.response?.data || err)
    res.status(500).json({ error: "Failed to fetch comments" })
  }
})

// Fetch + score with provider
app.get("/api/comments_scored", async (req, res) => {
  try {
    const videoInput = String(req.query.videoId || "")
    const model = String(req.query.model || "llama3-free")
    const perRequestApiKey = req.header("X-API-Key") || ""  // memory only
    const jobId = String(req.query.jobId || "")
    const videoId = parseVideoId(videoInput)
    if (!videoId) return res.status(400).json({ error: "Invalid video URL or ID" })

    const cacheKey = `v:${videoId}|m:${model}`
    const cached = cacheGet(cacheKey)
    if (cached) return res.json({ ...cached, cached: true })

    if (jobId) progress.set(jobId, { totalPages: 0, fetchedPages: 0, totalTexts: 0, scoredTexts: 0 })

    const items = await fetchAllComments(videoId, API_KEY, 200, (p) => {
      if (jobId) {
        const cur = progress.get(jobId) || { totalPages: 0, fetchedPages: 0, totalTexts: 0, scoredTexts: 0 }
        progress.set(jobId, { ...cur, fetchedPages: p.fetchedPages || cur.fetchedPages })
      }
    }, Number(process.env.YT_THROTTLE_MS || 200))

    const texts = []
    items.forEach((it) => {
      texts.push(it.textOriginal || "")
      for (let j = 0; j < (it.replies?.length || 0); j++) {
        texts.push(it.replies[j].textOriginal || "")
      }
    })
    if (jobId) {
      const cur = progress.get(jobId) || { totalPages: 0, fetchedPages: 0, totalTexts: 0, scoredTexts: 0 }
      progress.set(jobId, { ...cur, totalTexts: texts.length, scoredTexts: 0 })
    }

    const provider = buildProvider(model, { apiKey: perRequestApiKey })
    const scores = []
    const batchSize = 50
    for (let i = 0; i < texts.length; i += batchSize) {
      const partial = await provider.analyzeBatch(texts.slice(i, i+batchSize))
      scores.push(...partial)
      if (jobId) {
        const cur = progress.get(jobId) || { totalPages: 0, fetchedPages: 0, totalTexts: texts.length, scoredTexts: 0 }
        progress.set(jobId, { ...cur, scoredTexts: Math.min(texts.length, (cur.scoredTexts + partial.length)) })
      }
    }

    let k = 0
    const scored = items.map((it) => {
      const parentScore = scores[k++] ?? 0
      const replies = (it.replies || []).map((r) => ({ ...r, base: scores[k++] ?? 0 }))
      return { ...it, base: parentScore, replies }
    })

    const payload = { videoId, model, count: scored.length, items: scored }
    cacheSet(cacheKey, payload)
    res.json(payload)
  } catch (err) {
    console.error("[comments_scored]", err?.response?.data || err?.message || err)
    res.status(500).json({ error: "Failed to fetch or score comments" })
  }
})

// Video metadata
app.get("/api/video_meta", async (req, res) => {
  try {
    const videoInput = String(req.query.videoId || "")
    const videoId = parseVideoId(videoInput)
    if (!videoId) return res.status(400).json({ error: "Invalid video URL or ID" })
    const meta = await fetchVideoMeta(videoId, API_KEY)
    if (!meta) return res.status(404).json({ error: "Video not found" })
    res.json(meta)
  } catch (e) {
    console.error("[/api/video_meta]", e?.message || e)
    res.status(500).json({ error: "Failed to fetch metadata" })
  }
})

// Summarize comments
app.post("/api/summarize", async (req, res) => {
  try {
    const { texts = [], model = "llama3-free" } = req.body || {}
    const perRequestApiKey = req.header("X-API-Key") || ""
    const provider = buildProvider(model, { apiKey: perRequestApiKey })

    // fallbacks / provider-aware
    const ctor = provider?.constructor?.name || ""
    if (ctor === "OpenAIProvider") {
      const axios = (await import("axios")).default
      const prompt = `You are a summarizer. Analyze these YouTube comments and write a concise bullet list (3-6 bullets) capturing overall sentiment (positive/negative/mixed), common themes, and notable disagreements. Keep it under 120 words.\n\nCOMMENTS:\n` + texts.slice(0, 300).join("\n- ") + "\n\nBULLETS:"
      const { data } = await axios.post(`${provider.baseUrl}/chat/completions`, {
        model: provider.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      }, { headers: { Authorization: `Bearer ${provider.apiKey}` }, timeout: 30000 })
      const content = data?.choices?.[0]?.message?.content || ""
      return res.json({ summary: content.trim(), model })
    }
    if (ctor === "OllamaLlama3Provider") {
      const axios = (await import("axios")).default
      const prompt = `You are a summarizer. Analyze these YouTube comments and write a concise bullet list (3-6 bullets) capturing overall sentiment (positive/negative/mixed), common themes, and notable disagreements. Keep it under 120 words.\n\nCOMMENTS:\n` + texts.slice(0, 300).join("\n- ") + "\n\nBULLETS:"
      const { data } = await axios.post(`${provider.host}/api/generate`, {
        model: provider.model,
        prompt,
        stream: false,
      }, { timeout: 30000 })
      return res.json({ summary: String(data?.response || "").trim(), model })
    }

    // VADER fallback heuristic
    const sample = texts.slice(0, 500).join(" ")
    const posWords = (sample.match(/\b(good|great|love|amazing|nice|awesome|excellent|helpful|cool)\b/gi) || []).length
    const negWords = (sample.match(/\b(bad|terrible|hate|awful|worse|worst|boring|lame|stupid|annoying|fake|trash)\b/gi) || []).length
    const tilt = posWords - negWords
    const tone = tilt > 5 ? "mostly positive" : tilt < -5 ? "mostly negative" : "mixed/neutral"
    return res.json({ summary: `Overall tone is ${tone}. Users frequently mention common positives/negatives.`, model })
  } catch (err) {
    console.error("[/api/summarize]", err?.message || err)
    res.status(500).json({ error: "Failed to summarize" })
  }
})

app.get("/", (_, res) => {
  res.type("text/plain").send("API up. Try /api/health or use the React client on http://localhost:5173")
})

app.listen(PORT, () => {
  console.log(`[server] Listening on http://localhost:${PORT}`)
})
