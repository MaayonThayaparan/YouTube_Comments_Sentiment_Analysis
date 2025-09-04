/**
 * Strategy interface for sentiment engines.
 * Allows drop-in replacement (VADER, LLaMA via Ollama, OpenAI, etc.).
 */
export class ISentimentProvider{
  /** @param {string[]} texts  @returns {Promise<number[]>} scores in [-1,1] */
  async analyzeBatch(texts){ throw new Error('analyzeBatch not implemented') }
}
