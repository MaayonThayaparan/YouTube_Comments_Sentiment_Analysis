/**
 * -----------------------------------------------------------------------------
 * Keyword Extraction (Tokenization + TF-IDF)
 * -----------------------------------------------------------------------------
 * PURPOSE
 *   Provide a tiny, dependency-free pipeline to extract top keywords across a
 *   corpus of comment texts for UI features like “Top Words”.
 *
 * EXPORTED API
 *   - tokenize(s):   Normalize and split a string into tokens suitable for TF-IDF.
 *   - STOPWORDS:     Minimal English stopword set used to de-noise high-freq terms.
 *   - tfidfTopOverall(texts, topK): Return top-K terms by TF-IDF across all texts.
 *
 * DESIGN DECISIONS
 *   - Normalization:
 *       • Lowercase for case-insensitive matching.
 *       • Strip URLs (they dominate and are rarely semantic).
 *       • Remove non-alphanumerics so emojis/punctuation don’t fragment tokens.
 *   - Stopwords: Small curated set to reduce function words; keeps the module
 *     readable and fast (no external lists). Expand as needed.
 *   - IDF smoothing: Uses (N+1)/(df+1) then +1 (classic additive smoothing) to
 *     avoid div-by-zero and dampen extreme scores in tiny corpora.
 *   - Global TF: We use corpus-level term frequency (sum over docs) rather than
 *     per-document TF, because the goal is an overall “top words” list rather
 *     than document ranking. This is effectively TF(sum) × IDF.
 *
 * COMPLEXITY
 *   O(T) time and O(V) space where:
 *     T = total tokens across all docs after tokenization
 *     V = number of unique terms
 *
 * EXTENSIONS
 *   - Stemming/lemmatization (e.g., “runs” → “run”) for tighter clusters.
 *   - Language detection & per-language stopwords.
 *   - N-grams (bi/tri-grams) for multi-word phrases.
 *   - Per-segment TF-IDF (pos/neg subsets) if you want top words by sentiment.
 * -----------------------------------------------------------------------------
 */

/**
 * Normalize and split input into tokens:
 *  - Lowercase
 *  - Remove URLs
 *  - Replace non [a-z0-9] with spaces
 *  - Split on whitespace and drop empties
 */
export function tokenize(s: string): string[] {
  return (s || '')
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

/**
 * Minimal English stopword list.
 * Keep short and opinionated; extend only if noisy terms recur in outputs.
 */
export const STOPWORDS = new Set([
  'the','a','an','to','and','or','but','if','in','on','for','of','is','it',
  'this','that','with','as','are','was','were','be','by','at','from',
  'i','you','he','she','they','we','me','my','your','our','their'
])

/**
 * Compute top-K terms by corpus-level TF × smoothed IDF.
 *
 * @param texts Array of raw documents (strings)
 * @param topK  Number of terms to return (default 20)
 * @returns     Array of { term, score } sorted desc by score
 *
 * STEPS
 *   1) Tokenize each doc and remove stopwords.
 *   2) Build:
 *        - df(term): number of documents containing term
 *        - tf(term): total count across all documents (global TF)
 *   3) Score(term) = tf(term) * ( log((N+1)/(df+1)) + 1 )
 *      where N = number of documents (avoids div-by-zero for tiny corpora)
 *   4) Sort desc and return topK.
 */
export function tfidfTopOverall(texts: string[], topK = 20) {
  const docs = texts.map(t => tokenize(t).filter(w => !STOPWORDS.has(w)))

  // df: #docs containing term, tf: total term count across all docs
  const df = new Map<string, number>(), tf = new Map<string, number>()
  for (const d of docs) {
    const uniq = new Set(d)
    for (const w of uniq) df.set(w, (df.get(w) || 0) + 1)
    for (const w of d)    tf.set(w, (tf.get(w) || 0) + 1)
  }

  const N = docs.length || 1
  const scores: Array<{ term: string, score: number }> = []

  for (const [w, cnt] of tf.entries()) {
    const idf = Math.log((N + 1) / ((df.get(w) || 0) + 1)) + 1
    scores.push({ term: w, score: cnt * idf })
  }

  scores.sort((a, b) => b.score - a.score)
  return scores.slice(0, topK)
}
