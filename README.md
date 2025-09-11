# YouTube Comment Sentiment Analyzer  

## Overview  
YouTube’s removal of public dislike counts makes it harder to gauge the overall sentiment of videos.  
This project solves that problem by analyzing comments from any YouTube video and presenting AI-powered sentiment insights in multiple interactive formats.  

View application at below link: 

https://www.youtube-sentiment.com

## Features  
- **AI-Powered Comment Summary**  
  - Generates a 3–6 sentence overview of overall sentiment, common themes, and discussion tone.  

- **Multiple Sentiment Engines**  
  - **VADER** (default, free, no setup required)  
  - **OpenAI** (requires API key, never stored)  
  - **Gemini** (requires API key, never stored)  

- **Interactive Visualizations**  
  - Sentiment breakdowns as numeric stats, pie charts, and bar charts  
  - Average sentiment over time chart  

- **Customizable Analysis**  
  - Adjust weights for top-level comment score, likes, and reply sentiment  
  - Filter by date range, subscriber count, likes, replies, or country  

- **Detailed Data Views**  
  - Full table of comments and replies  
  - Leaderboards: most liked comment, most positive/negative replies (with modal details)  
  - Top 20 most frequent words overall, positive, and negative  

- **Export & Sharing**  
  - Export data as CSV  

- **UI Enhancements**  
  - Theme toggle (light, dark, neon)  

## Tech Stack  
- **Frontend:** React, TypeScript, Vite  
- **Backend:** Node.js, Express  
- **AI & NLP:** VADER Sentiment, OpenAI API, Google Gemini API  
- **Data Visualization:** Chart.js, Recharts  
- **APIs & Data Handling:** YouTube Data API, RESTful HTTP endpoints  
- **Other Tools:** CSV export, environment variable–based API key management  

## Run (Windows PowerShell)
```powershell
# Server
cd server
copy .env.example .env
# Set YOUTUBE_API_KEY in .env (YouTube Data API v3)
npm install
npm run dev

# Client
cd ../client
npm install
npm install -D @vitejs/plugin-react@4.3.1  # Node 18 compatible
npm run dev
```
