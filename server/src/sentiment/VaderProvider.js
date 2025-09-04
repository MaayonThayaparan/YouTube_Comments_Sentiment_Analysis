import { ISentimentProvider } from "./ISentimentProvider.js"
import { SentimentIntensityAnalyzer } from "vader-sentiment"
export class VaderProvider extends ISentimentProvider {
  async analyzeBatch(texts) {
    return texts.map(t => {
      const s = SentimentIntensityAnalyzer.polarity_scores(t || "")
      return s.compound
    })
  }
}
