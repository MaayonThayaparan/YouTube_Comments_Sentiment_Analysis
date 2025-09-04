import { SentimentIntensityAnalyzer } from 'vader-sentiment'
export type ReplyItem = { id: string; textOriginal: string; likeCount: number; authorDisplayName: string; publishedAt: string; base?: number }
export type ThreadItem = { id: string; textOriginal: string; likeCount: number; authorDisplayName: string; publishedAt: string; totalReplyCount: number; replies: ReplyItem[]; base?: number }
export type ScoredRow = ThreadItem & { base: number; adjusted: number }
type Weights = { wComment:number, wLikes:number, wReplies:number }
function clamp(x:number,a:number,b:number){ return Math.max(a, Math.min(b, x)) }
function compound(text:string){ const r = SentimentIntensityAnalyzer.polarity_scores(text || ''); return r.compound }
function normalizeLikes(likes:number, maxLikes:number){ const ln = Math.log10(1 + likes); const denom = Math.log10(1 + Math.max(1, maxLikes)); return denom === 0 ? 0 : ln / denom }
export function computeAdjustedScores(items:ThreadItem[], weights:Weights): ScoredRow[] {
  const maxTopLikes = Math.max(1, ...items.map(i=>i.likeCount || 0))
  const maxReplyLikes = Math.max(1, ...items.flatMap(i=>i.replies?.map(r=>r.likeCount||0) || [0]))
  return items.map((i) => {
    const base = typeof (i as any).base === 'number' ? (i as any).base : compound(i.textOriginal)
    const Lc = normalizeLikes(i.likeCount || 0, maxTopLikes)
    const likeAdj = (0.5 + 0.5*Lc) * (base >= 0 ? 1 : -1)
    const replyAggregate = (() => {
      if (!i.replies?.length) return 0
      const vals = i.replies.map(r => {
        const Sr = typeof (r as any).base === 'number' ? (r as any).base : compound(r.textOriginal)
        const Lr = normalizeLikes(r.likeCount || 0, maxReplyLikes)
        return Sr * (0.5 + 0.5*Lr)
      })
      const mean = vals.reduce((a,b)=>a+b,0) / vals.length
      return mean
    })()
    const adjusted = clamp(weights.wComment * base + weights.wLikes * likeAdj + weights.wReplies * replyAggregate, -1, 1)
    return { ...i, base, adjusted }
  })
}
