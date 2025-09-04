/** VADER provider — fast, no external calls, a great default baseline. */
import { ISentimentProvider } from "./ISentimentProvider.js"
import { SentimentIntensityAnalyzer } from "vader-sentiment"
export class VaderProvider extends ISentimentProvider{
  async analyzeBatch(texts){ return texts.map(t=>SentimentIntensityAnalyzer.polarity_scores(t||'').compound) }
}
