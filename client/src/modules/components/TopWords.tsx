import React, { useMemo } from 'react'
import { tfidfTopOverall } from '../../utils/text'
import { type ScoredRow } from '../../utils/scoring'

/**
 * Section
 * -----------------------------------------------------------------------------
 * Generic subcomponent that renders:
 *   - A section title (colored by sentiment bucket).
 *   - A list of TF-IDF "chips" (keywords).
 *
 * DESIGN INTENT:
 *   - Chips use tinted backgrounds (grey / green / red) to visually reinforce
 *     sentiment grouping.
 *   - Text color is forced to neutral gray so that it's always legible across
 *     all themes (light/dark/neon).
 *   - Borders/shadows are stripped away to avoid clashes with global themes.
 *
 * WHY:
 *   - Separating this into its own component avoids repetition across
 *     Overall/Positive/Negative sections.
 */
function Section({
  title,
  words,
  chipBg,
  titleColor,
}: {
  title: string
  words: { term: string; score: number }[]
  chipBg: string
  titleColor: string
}) {
  if (!words?.length) {
    return <div className="text-gray-500">No Data</div>
  }

  return (
    <div>
      {/* Section header with sentiment-specific color */}
      <div className={`font-semibold mb-2 ${titleColor}`}>{title}</div>

      {/* Chip cloud of TF-IDF words */}
      <div className="flex flex-wrap gap-2 text-sm">
        {words.map((k) => (
          <span
            key={k.term}
            className={[
              // Chip shape & padding
              'px-2 py-1 rounded-lg',
              // Background tint (sentiment-specific, forced with !important)
              chipBg,
              // Always neutral text color to ensure legibility
              '!text-gray-900 dark:!text-gray-100',
              // Remove unwanted outlines/borders
              '!border-0',
              // Defensive: prevent theme leakage
              'shadow-none outline-none',
            ].join(' ')}
          >
            {k.term}
          </span>
        ))}
      </div>
    </div>
  )
}

/**
 * TopWords
 * -----------------------------------------------------------------------------
 * WHAT:
 *   - Computes the top-20 TF-IDF terms for:
 *       1. All comments (Overall)
 *       2. Positive comments/replies
 *       3. Negative comments/replies
 *
 * WHY:
 *   - Surfaces the most distinctive words used across sentiment buckets.
 *   - Helps analysts quickly spot dominant themes.
 *
 * IMPLEMENTATION DETAILS:
 *   - Sentiment thresholds:
 *       • Positive if adjusted/base > +0.1
 *       • Negative if adjusted/base < –0.1
 *       • Neutral zone otherwise (ignored here).
 *   - Uses `useMemo` so expensive TF-IDF calculations only rerun when `rows`
 *     changes.
 *   - Each bucket is passed into <Section /> with custom colors and chip styles.
 *
 * UX:
 *   - Responsive grid: On large screens, Overall / Positive / Negative render
 *     side-by-side in 3 columns. On small screens they stack vertically.
 */
export function TopWords({ rows }: { rows: ScoredRow[] }) {
  const { all, pos, neg } = useMemo(() => {
    // Flatten all comment + reply text
    const allTexts = rows.flatMap((r) => [
      r.textOriginal,
      ...(((r as any).replies ?? []).map((x: any) => x.textOriginal)),
    ])

    // Positive bucket: parent or reply with sentiment > 0.1
    const posTexts = rows.flatMap((r) =>
      (r.adjusted > 0.1 ? [r.textOriginal] : []).concat(
        ((r as any).replies ?? [])
          .filter((x: any) => x.base > 0.1)
          .map((x: any) => x.textOriginal),
      )
    )

    // Negative bucket: parent or reply with sentiment < -0.1
    const negTexts = rows.flatMap((r) =>
      (r.adjusted < -0.1 ? [r.textOriginal] : []).concat(
        ((r as any).replies ?? [])
          .filter((x: any) => x.base < -0.1)
          .map((x: any) => x.textOriginal),
      )
    )

    return {
      all: tfidfTopOverall(allTexts, 20),
      pos: tfidfTopOverall(posTexts, 20),
      neg: tfidfTopOverall(negTexts, 20),
    }
  }, [rows])

  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold mb-3">Top 20 Words</h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Overall → neutral gray tint */}
        <Section
          title="Overall"
          words={all}
          titleColor="text-gray-500 dark:text-gray-200"
          chipBg="!bg-gray-200 dark:!bg-gray-700"
        />

        {/* Positive → green tint */}
        <Section
          title="Positive Responses"
          words={pos}
          titleColor="text-green-600 dark:text-green-400"
          chipBg="!bg-green-200 dark:!bg-green-800"
        />

        {/* Negative → red tint */}
        <Section
          title="Negative Responses"
          words={neg}
          titleColor="text-red-600 dark:text-red-400"
          chipBg="!bg-red-200 dark:!bg-red-800"
        />
      </div>
    </div>
  )
}
