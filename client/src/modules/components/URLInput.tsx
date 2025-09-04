import React, { useState } from 'react'
export function URLInput({ onSubmit, loading }: { onSubmit: (v: string) => void, loading?: boolean }){
  const [value, setValue] = useState('')
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!value.trim()) return; onSubmit(value.trim()) }
  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 flex gap-3">
      <input placeholder="Paste YouTube URL or video ID…" value={value} onChange={e=>setValue(e.target.value)} className="flex-1 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <button type="submit" disabled={loading} className="rounded-xl px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold">{loading ? 'Loading…' : 'Analyze'}</button>
    </form>
  )
}