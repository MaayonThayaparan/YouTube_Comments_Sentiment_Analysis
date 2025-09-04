/**
 * Provider factory
 * ----------------
 * WHAT: Central switch that instantiates the correct sentiment provider by key.
 * WHY: Keeps API routes agnostic of provider implementation and supports easy extension.
 */
import { VaderProvider } from "./VaderProvider.js"
import { OllamaLlama3Provider } from "./OllamaLlama3Provider.js"
import { OpenAIProvider } from "./OpenAIProvider.js"

export function buildProvider(model,opts={}){
  switch((model||'').toLowerCase()){
    case 'llama3-free': return new OllamaLlama3Provider(opts)
    case 'openai-gpt-4o-mini': return new OpenAIProvider({apiKey:opts.apiKey,model:'gpt-4o-mini'})
    case 'vader': return new VaderProvider()
    default: return new VaderProvider()
  }
}
