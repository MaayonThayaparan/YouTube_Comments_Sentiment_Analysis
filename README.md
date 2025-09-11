# YouTube Comment Sentiment Analyzer  

## Overview  
YouTube’s removal of public dislike counts makes it harder to gauge the overall sentiment of videos.  
This project solves that problem by analyzing comments from any YouTube video and presenting AI-powered sentiment insights in multiple interactive formats.  

View application at below link: 

https://www.youtube-sentiment.com

<img width="932" height="472" alt="yt-project-1" src="https://github.com/user-attachments/assets/8a740d73-b1dc-4c8f-84b2-c167169af341" />
<img width="933" height="455" alt="yt-project-1a" src="https://github.com/user-attachments/assets/69a4410e-464a-4496-9430-70f0c78e6dfc" />
<img width="931" height="471" alt="yt-project2" src="https://github.com/user-attachments/assets/2790e07c-6fa5-446c-8715-a31884704b00" />
<img width="930" height="472" alt="yt-project-3" src="https://github.com/user-attachments/assets/9474c988-0aa1-40c1-9e4c-a16ad813c754" />
<img width="938" height="467" alt="yt-project-4" src="https://github.com/user-attachments/assets/f0eee166-0018-4630-ab5a-edb6aea44015" />
<img width="930" height="332" alt="yt-project-5" src="https://github.com/user-attachments/assets/c3353986-8433-47f7-8783-0c307c287b60" />
<img width="929" height="469" alt="yt-project-6" src="https://github.com/user-attachments/assets/125c6a1b-710c-4307-bede-652b53ae4e13" />
<img width="930" height="469" alt="yt-project-7" src="https://github.com/user-attachments/assets/2f8cc308-1cc0-4383-a02f-bcf7f9fde993" />

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
