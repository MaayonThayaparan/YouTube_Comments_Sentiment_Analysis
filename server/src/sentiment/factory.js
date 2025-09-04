/**
 * -----------------------------------------------------------------------------
 * Sentiment Provider Factory
 * -----------------------------------------------------------------------------
 * PURPOSE
 *   Resolve a sentiment-analysis implementation by a simple model key and
 *   construct a provider instance used by the API layer. This centralizes
 *   provider selection and keeps the rest of the code unaware of concrete
 *   classes (factory pattern).
 *
 * PROVIDERS
 *   - VaderProvider           : local, lexicon-based, fast/baseline.
 *   - OllamaLlama3Provider    : local LLM via Ollama (e.g., llama3-free).
 *   - OpenAIProvider          : OpenAI Chat Completions (e.g., gpt-4o-mini).
 *
 * DESIGN DECISIONS
 *   - String keys are normalized to lowercase and mapped explicitly.
 *   - Unknown/omitted model keys fall back to VADER for deterministic behavior.
 *   - API keys are passed through via `opts` (never logged here).
 *   - The returned instance is expected to implement a common interface:
 *       analyzeBatch(texts: string[]): Promise<number[]>
 *     (and any provider-specific fields used by /api/summarize).
 *
 * EXTENDING
 *   1) Implement a new Provider class exposing `analyzeBatch`.
 *   2) Import it here and add a `case` branch mapping a string key to `new YourProvider(opts)`.
 *
 * USAGE (server/index.js)
 *   const provider = buildProvider(model, { apiKey: req.header('X-API-Key') })
 *   const scores = await provider.analyzeBatch(texts)
 * -----------------------------------------------------------------------------
 */

import { VaderProvider } from "./VaderProvider.js"
import { OllamaLlama3Provider } from "./OllamaLlama3Provider.js"
import { OpenAIProvider } from "./OpenAIProvider.js"

/**
 * Construct a sentiment provider based on a model key.
 *
 * @param {string} model - Provider key. Supported:
 *   'vader' | 'llama3-free' | 'openai-gpt-4o-mini'
 *   (unknown values default to 'vader')
 * @param {{ apiKey?: string, [k: string]: any }} [opts] - Provider options.
 *   - For OpenAIProvider: { apiKey, model?: string }
 *   - For OllamaLlama3Provider: host/model may be read from provider defaults.
 * @returns {VaderProvider | OllamaLlama3Provider | OpenAIProvider}
 */
export function buildProvider(model, opts = {}) {
  switch ((model || '').toLowerCase()) {
    case 'llama3-free':
      return new OllamaLlama3Provider(opts)
    case 'openai-gpt-4o-mini':
      return new OpenAIProvider({ apiKey: opts.apiKey, model: 'gpt-4o-mini' })
    case 'vader':
      return new VaderProvider()
    default:
      // Conservative default keeps the API functional without external keys.
      return new VaderProvider()
  }
}
