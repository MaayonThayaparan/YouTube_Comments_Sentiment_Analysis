/**
 * colors.ts — Presentation helpers
 * -----------------------------------------------------------------------------
 * WHAT:
 *   - Provides UI-friendly mappings and formatting helpers.
 *   - `colorForScore`: maps sentiment scores to semantic Tailwind color classes.
 *   - `compactNumber`: converts raw counts into short, human-readable numbers.
 *
 * WHY:
 *   - Keeps UI logic centralized and consistent across components.
 *   - Decouples visualization concerns from data processing.
 *
 * NOTES:
 *   - Colors follow a traffic-light / heatmap style:
 *       • Strong positive → green
 *       • Mild positive   → lime
 *       • Neutral         → yellow
 *       • Mild negative   → orange
 *       • Strong negative → red
 *   - Compact numbers leverage Intl.NumberFormat with `"compact"` notation,
 *     yielding values like "1.2K" or "3.4M".
 */

/* -------------------------------------------------------------------------- */
/* Sentiment Score → Color Mapping                                            */
/* -------------------------------------------------------------------------- */

/**
 * Map a sentiment score [-1,1] into TailwindCSS color classes + hex value.
 *
 * @param x - Sentiment score in range [-1, 1].
 * @returns  - Object containing bg/text/border classes + hex color.
 *
 * USAGE:
 *   const { bg, text } = colorForScore(0.7);
 *   <span className={`${bg} ${text}`}>Positive</span>
 */
export function colorForScore(x: number) {
  if (x >= 0.6)
    return {
      bg: "bg-emerald-100",
      text: "text-emerald-800",
      border: "border-emerald-300",
      hex: "#10b981",
    };
  else if (x >= 0.2)
    return {
      bg: "bg-lime-100",
      text: "text-lime-800",
      border: "border-lime-300",
      hex: "#84cc16",
    };
  else if (x > -0.2)
    return {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      border: "border-yellow-300",
      hex: "#f59e0b",
    };
  else if (x > -0.6)
    return {
      bg: "bg-orange-100",
      text: "text-orange-800",
      border: "border-orange-300",
      hex: "#f97316",
    };

  return {
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-300",
    hex: "#ef4444",
  };
}

/* -------------------------------------------------------------------------- */
/* Number Formatting                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Convert large numeric values into a compact, localized string.
 *
 * @param n - Raw number (e.g., 1234).
 * @returns - Human-readable string (e.g., "1.2K").
 *
 * NOTES:
 *   - Uses `Intl.NumberFormat` with `{ notation: "compact" }`.
 *   - Honors the user's current locale (via `undefined`).
 */
export function compactNumber(n: number) {
  return new Intl.NumberFormat(undefined, { notation: "compact" }).format(n);
}