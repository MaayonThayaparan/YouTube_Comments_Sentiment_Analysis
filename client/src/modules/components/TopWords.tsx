import React from 'react'

type Props = {
  overall?: string[]
  positive?: string[]
  negative?: string[]
}

export function TopWords({ overall = [], positive = [], negative = [] }: Props) {
  const Section = ({
    title,
    words = [],
    tone,
  }: {
    title: string
    words?: string[]
    tone: 'neutral' | 'pos' | 'neg'
  }) => {
    const safe = Array.isArray(words) ? words : []
    return (
      <div>
        <div
          className={`font-semibold mb-2 ${
            tone === 'pos' ? 'text-green-600' : tone === 'neg' ? 'text-red-600' : 'text-inherit'
          }`}
        >
          {title}
        </div>
        <div className="flex flex-wrap gap-2">
          {safe.slice(0, 20).map((w, i) => (
            <span
              key={i}
              className={`px-2 py-1 rounded-lg border ${
                tone === 'pos'
                  ? 'bg-green-100 border-green-200'
                  : tone === 'neg'
                  ? 'bg-red-100 border-red-200'
                  : 'bg-gray-100 border-gray-200'
              }`}
            >
              {w}
            </span>
          ))}
          {safe.length === 0 && (
            <span className="text-gray-500 text-sm">No Data</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold mb-3">Top 20 Words</h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Section title="Overall" words={overall} tone="neutral" />
        <Section title="Top 20 Words from Positive Responses" words={positive} tone="pos" />
        <Section title="Top 20 Words from Negative Responses" words={negative} tone="neg" />
      </div>
    </div>
  )
}
