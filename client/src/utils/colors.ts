/**
 * -----------------------------------------------------------------------------
 * Color & Formatting Utilities
 * -----------------------------------------------------------------------------
 * PURPOSE
 *   Small, dependency-free helpers used across tables, chips, and modals:
 *   - `colorForScore(x)`: map a sentiment score in [-1, 1] to Tailwind color
 *     utility classes + a hex swatch for charts/inline indicators.
 *   - `compactNumber(n)`: format large integers with locale-aware compact
 *     notation (e.g., 1.2K, 3.4M).
 *
 * DESIGN NOTES
 *   - Buckets are intentionally asymmetric around 0 to make "slightly neg/pos"
 *     easier to scan in the UI. The neutral band is (-0.2, 0.2), *open* on the
 *     negative side at -0.2 (i.e., x === -0.2 falls into the next bucket).
 *   - Tailwind classes are chosen for **contrast** in both light/dark themes:
 *     100 background / 800 text / 300 border generally yields AA contrast.
 *   - The returned `hex` is used where utility classes aren’t applicable
 *     (e.g., Recharts stroke/fill). Keep it roughly aligned to the utilities.
 *
 * ACCESSIBILITY
 *   - Yellow (neutral) can be tricky for contrast on white; we pair `bg-yellow-100`
 *     with `text-yellow-800` to stay readable. If you adjust thresholds, re-check
 *     contrast in both themes.
 *
 * EXTENSION
 *   - If a theme requires brand colors, keep return shape but swap classes/hex.
 *   - If you need finer granularity, add more buckets but retain monotonic hues
 *     (greens → neutrals → oranges/reds) to preserve quick scanning.
 * -----------------------------------------------------------------------------
 */

/**
 * Map a sentiment score [-1, 1] to Tailwind color classes and a hex swatch.
 *
 * Buckets:
 *   [ 0.6,  1.0] -> strong positive (emerald)
 *   [ 0.2,  0.6) -> mild   positive (lime)
 *   (-0.2,  0.2) -> neutral         (yellow)
 *   (-0.6, -0.2] -> mild   negative (orange)   ← note inclusive at -0.2
 *   [-1.0, -0.6] -> strong negative (red)
 *
 * @param {number} x Sentiment score in [-1, 1]
 * @returns {{ bg: string; text: string; border: string; hex: string }}
 */
export function colorForScore(x: number) {
  if      (x >= 0.6) return { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', hex: '#10b981' }
  else if (x >= 0.2) return { bg: 'bg-lime-100',    text: 'text-lime-800',    border: 'border-lime-300',    hex: '#84cc16' }
  else if (x > -0.2) return { bg: 'bg-yellow-100',  text: 'text-yellow-800',  border: 'border-yellow-300',  hex: '#f59e0b' }
  else if (x > -0.6) return { bg: 'bg-orange-100',  text: 'text-orange-800',  border: 'border-orange-300',  hex: '#f97316' }
  return              { bg: 'bg-red-100',     text: 'text-red-800',     border: 'border-red-300',     hex: '#ef4444' }
}

/**
 * Locale-aware compact integer formatting (e.g., 1.2K, 3.4M).
 * Uses the user agent’s default locale unless overridden by the environment.
 *
 * @param {number} n
 * @returns {string}
 */
export function compactNumber(n:number){
  return new Intl.NumberFormat(undefined,{notation:'compact'}).format(n)
}
