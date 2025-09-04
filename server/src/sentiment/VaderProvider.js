/**
 * VADER provider
 * --------------
 * WHAT: Fast lexicon-based sentiment scoring.
 * WHY: Great default for polarity; deterministic; no external network.
 */
import { ISentimentProvider } from "./ISentimentProvider.js"
import { SentimentIntensityAnalyzer } from "vader-sentiment"

export class VaderProvider extends ISentimentProvider{
  async analyzeBatch(texts){
    // VADER's "compound" is already normalized to [-1,1].
    return texts.map(t=>SentimentIntensityAnalyzer.polarity_scores(t||'').compound)
  }
}
