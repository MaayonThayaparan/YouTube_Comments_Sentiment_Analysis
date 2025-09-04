/**
 * SentimentChips
 * -----------------------------------------------------------------------------
 * Staff dev notes:
 * - WHAT: A small pill-based filter to bucket comments by adjusted sentiment.
 * - WHY: Quick toggling across sentiment bands used consistently across charts.
 * - API:
 *     value:     current bucket
 *     onChange:  callback with next bucket
 *     variant:   'block' | 'inline' (layout density)
 *     className: optional extra classes for the wrapper
 *
 * Buckets:
 *   'all'   : no filter
 *   'neg'   : <= -0.4
 *   'slneg' : (-0.4, -0.1]
 *   'neu'   : (-0.1, 0.1)
 *   'slpos' : [0.1, 0.4)
 *   'pos'   : >= 0.4
 *
 * Visual decisions:
 * - 'block' variant wraps chips in a card with roomier paddings (dashboard row).
 * - 'inline' variant removes the card and tightens paddings (toolbars/headings).
 * - Active chip uses the existing gradient token `bg-cta` for strong affordance.
 */

import React from 'react';

export type SentimentBucket = 'all' | 'neg' | 'slneg' | 'neu' | 'slpos' | 'pos';

export function SentimentChips({
  value,
  onChange,
  variant = 'block',
  className = '',
}: {
  value: SentimentBucket;
  onChange: (v: SentimentBucket) => void;
  variant?: 'block' | 'inline';
  className?: string;
}) {
  // Ordered definitions keep labels consistent everywhere this control appears.
  const chips: Array<{ key: SentimentBucket; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'neg', label: 'Negative' },
    { key: 'slneg', label: 'Slight Neg' },
    { key: 'neu', label: 'Neutral' },
    { key: 'slpos', label: 'Slight Pos' },
    { key: 'pos', label: 'Positive' },
  ];

  // Wrapper: card for 'block', plain for 'inline' (to fit inside toolbars).
  const wrapperClass = variant === 'block' ? `card p-3 ${className}` : `p-0 ${className}`;

  // Chip density scales with variant to maintain visual balance in tight spaces.
  const chipPad = variant === 'inline' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <div className={wrapperClass}>
      <div className="flex flex-wrap items-center gap-2">
        {chips.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => onChange(c.key)}
            className={`${chipPad} rounded-full border transition
                        ${
                          value === c.key
                            ? 'bg-cta text-white border-transparent'
                            : 'bg-white/70 dark:bg-gray-800/70 border-gray-200 dark:border-gray-700'
                        }`}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
