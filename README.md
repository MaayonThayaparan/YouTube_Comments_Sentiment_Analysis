# YouTube Comment Sentiment Analyzer — v8 (clean)

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
- Install Ollama, run `ollama pull llama3`, ensure `http://localhost:11434` is reachable.
- Switch to "LLaMA 3 (free)" in the UI and re-Analyze.
