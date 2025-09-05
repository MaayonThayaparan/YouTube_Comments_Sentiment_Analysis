/**
 * Text utilities — tokenization & TF-IDF scoring
 * -----------------------------------------------------------------------------
 * WHAT:
 *   - Provides lightweight NLP helpers for processing comment text.
 *   - Tokenizer: cleans and splits input into normalized word tokens.
 *   - Stopwords: common English words to ignore in analysis.
 *   - TF-IDF: extracts top-K most "important" words across a corpus.
 *
 * WHY:
 *   - Enables downstream features such as keyword extraction, leaderboards,
 *     and text analytics without introducing heavy NLP libraries.
 *   - Keeps implementation transparent and easily customizable.
 *
 * NOTES:
 *   - This is not a full NLP pipeline (no stemming/lemmatization).
 *   - Works best for simple English corpora (like YouTube comments).
 *   - If scaling further, consider integrating libraries like spaCy or scikit-learn.
 */

/**
 * Normalize and tokenize input text.
 * - Lowercases input.
 * - Removes URLs.
 * - Strips non-alphanumeric characters (except whitespace).
 * - Splits on whitespace.
 * - Filters out empty tokens.
 */
export function tokenize(s: string): string[] {
  return (s || "")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")       // remove URLs
    .replace(/[^a-z0-9\s]/g, " ")          // strip punctuation
    .split(/\s+/)                          // split by whitespace
    .filter(Boolean);                      // drop empty tokens
}

/**
 * Common English stopwords — excluded from analysis.
 * Rationale:
 * - Prevents over-weighting filler words that carry no semantic meaning.
 */
export const STOPWORDS = new Set([
  "the", "a", "an", "to", "and", "or", "but", "if",
  "in", "on", "for", "of", "is", "it", "this", "that",
  "with", "as", "are", "was", "were", "be", "by", "at",
  "from", "i", "you", "he", "she", "they", "we", "me",
  "my", "your", "our", "their"
]);

/**
 * Compute TF-IDF scores across a corpus of texts.
 *
 * @param texts - Array of raw text documents.
 * @param topK - Number of top-scoring terms to return.
 * @returns Array of {term, score} sorted by descending importance.
 *
 * HOW IT WORKS:
 * - Tokenize all documents, removing stopwords.
 * - Build:
 *   - Term Frequency (TF): counts of each token across all docs.
 *   - Document Frequency (DF): number of docs containing each token.
 * - Compute TF-IDF: tf * (log((N+1)/(df+1)) + 1).
 *   - Smoothing (+1) avoids divide-by-zero.
 * - Return top-K terms sorted by score.
 */
export function tfidfTopOverall(texts: string[], topK = 20) {
  // Tokenize & filter stopwords
  const docs = texts.map((t) => tokenize(t).filter((w) => !STOPWORDS.has(w)));

  // Term Frequency (TF) and Document Frequency (DF)
  const df = new Map<string, number>();
  const tf = new Map<string, number>();

  for (const d of docs) {
    const uniq = new Set(d);
    for (const w of uniq) {
      df.set(w, (df.get(w) || 0) + 1);
    }
    for (const w of d) {
      tf.set(w, (tf.get(w) || 0) + 1);
    }
  }

  // Compute TF-IDF scores
  const N = docs.length || 1;
  const scores: Array<{ term: string; score: number }> = [];

  for (const [w, cnt] of tf.entries()) {
    const idf = Math.log((N + 1) / ((df.get(w) || 0) + 1)) + 1;
    scores.push({ term: w, score: cnt * idf });
  }

  // Sort descending by score
  scores.sort((a, b) => b.score - a.score);

  return scores.slice(0, topK);
}