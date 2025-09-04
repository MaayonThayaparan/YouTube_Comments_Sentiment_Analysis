# YouTube Comment Sentiment Analyzer — v9

**What’s in this build**
- Fix for Windows newline escape bug in `/api/summarize` (uses `\n` inside template strings).
- Staff-level comments across server & client explaining **what** and **why**.
- **Front & center analytics**: Metrics + Pie + Distribution + TimeSeries.
- **Compact Time Window** above charts.
- **Combined Analyze Bar**: URL/ID + Model + API Key + Analyze in one.
- **Responsive/mobile-first** layout (Tailwind).

## Run (Windows PowerShell)
```powershell
# Server
cd server
copy .env.example .env
# set YOUTUBE_API_KEY in .env
npm install
npm run dev

# Client
cd ../client
npm install
npm install -D @vitejs/plugin-react@4.3.1   # Node 18 compatible
npm run dev
```

## Optional LLaMA (via Ollama)
1) Install Ollama, 2) `ollama pull llama3`, 3) ensure `http://localhost:11434` is reachable.
Then select **LLaMA 3 (free)** in the AnalyzeBar and click **Analyze**.
