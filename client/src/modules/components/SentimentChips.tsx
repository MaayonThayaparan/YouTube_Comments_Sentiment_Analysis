import React from 'react'

/**
 * SentimentChips
 * Buckets:
 *  - 'all': no filter
 *  - 'neg': <= -0.4
 *  - 'slneg': (-0.4, -0.1]
 *  - 'neu': (-0.1, 0.1)
 *  - 'slpos': [0.1, 0.4)
 *  - 'pos': >= 0.4
 *
 * New prop:
 *  - variant = 'block' | 'inline'
 *    - 'block'  : original look (card wrapper, bigger paddings)
 *    - 'inline' : no card wrapper; smaller chips that fit in toolbars
 */
export type SentimentBucket = 'all'|'neg'|'slneg'|'neu'|'slpos'|'pos'

export function SentimentChips({
  value,
  onChange,
  variant = 'block',
  className = '',
}: {
  value: SentimentBucket
  onChange: (v: SentimentBucket) => void
  variant?: 'block' | 'inline'
  className?: string
}) {
  const chips: Array<{ key: SentimentBucket; label: string }> = [
    { key: 'all',   label: 'All' },
    { key: 'neg',   label: 'Negative' },
    { key: 'slneg', label: 'Slight Neg' },
    { key: 'neu',   label: 'Neutral' },
    { key: 'slpos', label: 'Slight Pos' },
    { key: 'pos',   label: 'Positive' },
  ]

  const wrapperClass =
    variant === 'block'
      ? `card p-3 ${className}`
      : `p-0 ${className}`

  const chipPad =
    variant === 'inline' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'

  return (
    <div className={wrapperClass}>
      <div className="flex flex-wrap items-center gap-2">
        {chips.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => onChange(c.key)}
            className={`${chipPad} rounded-full border transition
                        ${value === c.key
                          ? 'bg-cta text-white border-transparent'
                          : 'bg-white/70 dark:bg-gray-800/70 border-gray-200 dark:border-gray-700'}`}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  )
}
