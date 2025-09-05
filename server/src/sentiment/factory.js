import { VaderProvider } from "./VaderProvider.js";
import { OpenAIProvider } from "./OpenAIProvider.js";
import { GeminiProvider } from "./GeminiProvider.js";

export function buildProvider(model, opts = {}) {
  switch ((model || "").toLowerCase()) {
    case "gemini":
      return new GeminiProvider({
        apiKey: opts.apiKey,
        model: opts.model || "gemini-1.5-flash",
      });
    case "openai-gpt-4o-mini":
      return new OpenAIProvider({ apiKey: opts.apiKey, model: "gpt-4o-mini" });
    case "vader":
      return new VaderProvider();
    default:
      return new VaderProvider();
  }
}