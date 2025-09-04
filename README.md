# YouTube Comment Sentiment Analyzer — v5 (Full Project)

Modern React + TypeScript UI with analytics and pluggable AI scoring, plus an Express API that fetches all comments & replies, throttles requests, and supports multiple models (Ollama LLaMA 3 (free), OpenAI, VADER).

## Features
- **Reactive weights** (no rerun needed) for comment, likes, replies
- **Model selector** (LLaMA 3 free via Ollama, OpenAI, VADER)
- **In-memory API key** (not stored)
- **Analytics**: pie chart, distribution bar, time-series line, summary metrics
- **AI Summary** of comments
- **Replies expansion** with per-reply sentiment
- **Video metadata** card (thumbnail, title, channel, views, likes) with video link
- **Rate limiting** (throttle between YouTube API pages)
- **Progress** polling & progress bar for long videos
- **Tailwind** sleek UI

## Quick Start (Windows PowerShell)

### 1) Server
```powershell
cd server
copy .env.example .env
# Edit .env:
# YOUTUBE_API_KEY=YOUR_KEY
# (optional) ALLOWED_ORIGINS=*
# (optional) YT_THROTTLE_MS=200
npm install
npm run dev
# -> http://localhost:5177
# Test: http://localhost:5177/api/health  => {"ok":true}
```

### 2) Client
```powershell
cd ../client
npm install
npm install -D @vitejs/plugin-react@4.3.1
# (optional) copy .env.example .env  # set VITE_API_BASE if not local
npm run dev
# -> http://localhost:5173
```

### Models
- **LLaMA 3 (free)** via **Ollama** (local): run `ollama pull llama3` once, then ensure Ollama is running.
- **OpenAI**: choose model in UI and paste API key (memory-only per request).
- **VADER**: lightweight fallback, no key.

## Env (server/.env)
```
PORT=5177
YOUTUBE_API_KEY=
# Cache
CACHE_ENABLED=true
CACHE_MAX_ITEMS=50
CACHE_TTL_MS=900000
# YouTube page throttle (ms)
YT_THROTTLE_MS=200
# CORS
ALLOWED_ORIGINS=*
```

## Data Flow
UI Input → `/api/comments_scored` → fetch all comment threads (paginated) + replies → provider scores base [-1..1] for each → client computes adjusted score using weights & likes/replies → UI renders table + charts + summary.

## License
MIT
