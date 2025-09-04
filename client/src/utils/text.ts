/**
 * Tiny tokenization + TF-IDF for top keywords.
 * WHY: Quick insight into what people talk about without adding a heavy NLP dep.
 */
export function tokenize(s: string): string[] {
  return (s || '').toLowerCase()
    .replace(/https?:\/\/\S+/g,' ')
    .replace(/[^a-z0-9\s]/g,' ')
    .split(/\s+/)
    .filter(Boolean)
}
export const STOPWORDS = new Set(['the','a','an','to','and','or','but','if','in','on','for','of','is','it','this','that','with','as','are','was','were','be','by','at','from','i','you','he','she','they','we','me','my','your','our','their'])
export function tfidfTopOverall(texts: string[], topK=20){
  const docs = texts.map(t => tokenize(t).filter(w=>!STOPWORDS.has(w)))
  const df = new Map<string, number>(), tf = new Map<string, number>()
  for(const d of docs){
    const uniq = new Set(d)
    for(const w of uniq) df.set(w,(df.get(w)||0)+1)
    for(const w of d) tf.set(w,(tf.get(w)||0)+1)
  }
  const N = docs.length || 1
  const scores: Array<{term:string, score:number}> = []
  for(const [w,cnt] of tf.entries()){
    // +1 smoothing to avoid zero div and overweighting singletons
    const idf = Math.log((N+1)/((df.get(w)||0)+1))+1
    scores.push({term:w, score: cnt*idf})
  }
  scores.sort((a,b)=>b.score-a.score)
  return scores.slice(0, topK)
}
