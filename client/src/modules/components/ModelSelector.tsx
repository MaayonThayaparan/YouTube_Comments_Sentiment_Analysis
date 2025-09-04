import React, { useState } from 'react'
type Props = { model: string; onModelChange: (m: string) => void; apiKey: string; onApiKeyChange: (k: string) => void }
export function ModelSelector({ model, onModelChange, apiKey, onApiKeyChange }: Props){
  const [showKey, setShowKey] = useState(false)
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
      <h3 className="text-lg font-semibold mb-2">AI Model</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div className="col-span-1"><label className="text-sm text-gray-600 dark:text-gray-300">Model</label>
          <select className="mt-1 w-full rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900" value={model} onChange={e => onModelChange(e.target.value)}>
            <option value="llama3-free">LLaMA 3 (free)</option>
            <option value="openai-gpt-4o-mini">OpenAI GPT-4o-mini</option>
            <option value="vader">VADER (fallback)</option>
          </select>
        </div>
        <div className="col-span-1 md:col-span-2">
          <label className="text-sm text-gray-600 dark:text-gray-300 flex items-center justify-between">API Key (optional)<span className="text-xs text-gray-500">Not stored — memory only</span></label>
          <div className="mt-1 flex gap-2">
            <input type={showKey ? 'text' : 'password'} placeholder="Enter API key if required (e.g., OpenAI)" value={apiKey} onChange={e => onApiKeyChange(e.target.value)} className="flex-1 rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900" />
            <button type="button" onClick={() => setShowKey(s => !s)} className="rounded-xl px-3 py-2 border border-gray-300 dark:border-gray-700">{showKey ? 'Hide' : 'Show'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}