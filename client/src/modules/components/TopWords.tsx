/**
 * =============================================================================
 * TopWords — TF-IDF keyword buckets for Overall / Positive / Negative
 * =============================================================================
 * PURPOSE
 *   Surface the top terms driving conversation across three sentiment buckets:
 *     • Overall   : all top-level comments + all replies
 *     • Positive  : parents with adjusted > 0.1 and replies with base > 0.1
 *     • Negative  : parents with adjusted < -0.1 and replies with base < -0.1
 *
 * DESIGN DECISIONS
 *   • Bucketing thresholds mirror table/chart logic (±0.1 dead zone) so users
 *     see consistent numbers/labels throughout the app.
 *   • TF-IDF is computed client-side for responsiveness and debuggability; the
 *     stopword list and tokenizer live in `utils/text`.
 *   • Visual language is chips with *tinted containers* (not tinted text). The
 *     chip background uses Tailwind `!` important to defeat theme overrides
 *     across light/dark/neon. This prevents “mystery white” chips in neon.
 *   • Titles are color-coded (grey/green/red) as an at-a-glance cue.
 *
 * PERFORMANCE
 *   • Heavy work (TF-IDF) is wrapped in a `useMemo` keyed by `rows`. When the
 *     source rows don’t change, we avoid recomputation and re-render churn.
 *   • We cap to top-20 terms per bucket to keep layout stable and fast.
 *
 * COLLABORATION NOTES
 *   • If you adjust thresholds, change them here *and* in any components that
 *     define “positive/negative” to keep behavior consistent.
 *   • If you want per-bucket stopwords (e.g., remove “video” for Overall but
 *     keep domain terms for Negative), extend `tfidfTopOverall` to accept a
 *     per-call stopword set and thread it through.
 *   • Styling is intentionally utility-only; no external CSS hookups besides
 *     Tailwind and app theme tokens. Chip classes are passed via props to
 *     `Section` so variants remain explicit and discoverable.
 * =============================================================================
 */

import React, { useMemo } from 'react'
import { tfidfTopOverall } from '../../utils/text'
import { type ScoredRow } from '../../utils/scoring'

/**
 * Section
 * -------
 * Renders a titled bucket (Overall / Positive / Negative) and a set of TF-IDF words
 * as "chips". Chips use *tinted backgrounds* (grey/green/red) with forced-important
 * Tailwind classes to override any global theme defaults (light/dark/neon).
 *
 * Design goals:
 *  - Title color hints the section (grey/green/red).
 *  - Chip CONTAINER has the tint; chip TEXT remains readable in all themes.
 *  - No borders that could introduce unwanted white/light artifacts.
 *  - No reliance on external CSS classes that might set bg to white.
 */
function Section({
  title,
  words,
  // Tailwind class list (with ! important) for the chip background per theme.
  chipBg,
  // Tailwind class list for the section title color.
  titleColor
}: {
  title: string
  words: { term: string; score: number }[]
  chipBg: string
  titleColor: string
}) {
  if (!words?.length) return <div className="text-gray-500">No Data</div>

  return (
    <div>
      <div className={`font-semibold mb-2 ${titleColor}`}>{title}</div>
      <div className="flex flex-wrap gap-2 text-sm">
        {words.map(k => (
          <span
            key={k.term}
            className={[
              // Base chip shape & spacing
              'px-2 py-1 rounded-lg',
              // Force the tinted background regardless of other styles/themes:
              // light → e.g. bg-green-200 ; dark → e.g. bg-green-800
              chipBg,
              // Text stays neutral & legible in any theme
              '!text-gray-900 dark:!text-gray-100',
              // Remove borders so no white outline leaks in neon/dark
              '!border-0',
              // Defensive: avoid inherited shadows/outlines from other themes
              'shadow-none outline-none'
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
 * --------
 * Computes top-20 TF-IDF terms for:
 *   - Overall (all comments & replies)
 *   - Positive (rows/replies above threshold)
 *   - Negative (rows/replies below threshold)
 *
 * Implementation notes:
 *  - Sentiment thresholds mirror your existing logic (> 0.1 / < -0.1).
 *  - `!` important is applied to chip backgrounds to beat any theme CSS (incl. neon).
 */
export function TopWords({ rows }: { rows: ScoredRow[] }) {
  const { all, pos, neg } = useMemo(() => {
    const allTexts = rows.flatMap(r => [
      r.textOriginal,
      ...(((r as any).replies ?? []).map((x: any) => x.textOriginal))
    ])

    const posTexts = rows.flatMap(r =>
      (r.adjusted > 0.1 ? [r.textOriginal] : []).concat(
        ((r as any).replies ?? [])
          .filter((x: any) => x.base > 0.1)
          .map((x: any) => x.textOriginal)
      )
    )

    const negTexts = rows.flatMap(r =>
      (r.adjusted < -0.1 ? [r.textOriginal] : []).concat(
        ((r as any).replies ?? [])
          .filter((x: any) => x.base < -0.1)
          .map((x: any) => x.textOriginal)
      )
    )

    return {
      all: tfidfTopOverall(allTexts, 20),
      pos: tfidfTopOverall(posTexts, 20),
      neg: tfidfTopOverall(negTexts, 20)
    }
  }, [rows])

  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold mb-3">Top 20 Words</h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Overall → grey tint chips */}
        <Section
          title="Overall"
          words={all}
          titleColor="text-gray-500 dark:text-gray-200"
          chipBg="!bg-gray-200 dark:!bg-gray-700"
        />

        {/* Positive → green tint chips */}
        <Section
          title="Positive Responses"
          words={pos}
          titleColor="text-green-600 dark:text-green-400"
          chipBg="!bg-green-200 dark:!bg-green-800"
        />

        {/* Negative → red tint chips */}
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
