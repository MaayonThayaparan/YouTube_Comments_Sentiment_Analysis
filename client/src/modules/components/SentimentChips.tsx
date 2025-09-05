/**
 * SentimentChips
 * -----------------------------------------------------------------------------
 * A set of filter chips to quickly segment comments by sentiment bucket.
 *
 * Buckets:
 *   - all   → no filter
 *   - neg   → <= -0.4 (strong negative)
 *   - slneg → (-0.4, -0.1] (slight negative)
 *   - neu   → (-0.1, 0.1) (neutral band)
 *   - slpos → [0.1, 0.4) (slight positive)
 *   - pos   → >= 0.4 (strong positive)
 *
 * Props:
 *   - value     → currently selected bucket
 *   - onChange  → callback fired when user selects a new bucket
 *   - variant   → "block" (default, wrapped in a card) | "inline" (compact, no card)
 *   - className → optional styling extension
 *
 * Implementation notes:
 *   - `block` variant is intended for use in panels with more padding.
 *   - `inline` variant is smaller and fits in toolbars or header rows.
 *   - Active chip gets CTA highlight; inactive chips adapt to light/dark modes.
 *
 * Usage:
 *   <SentimentChips value="all" onChange={setBucket} variant="inline" />
 */

import React from "react";

export type SentimentBucket = "all" | "neg" | "slneg" | "neu" | "slpos" | "pos";

export function SentimentChips({
  value,
  onChange,
  variant = "block",
  className = "",
}: {
  value: SentimentBucket;
  onChange: (v: SentimentBucket) => void;
  variant?: "block" | "inline";
  className?: string;
}) {
  // List of all sentiment buckets with display labels
  const chips: Array<{ key: SentimentBucket; label: string }> = [
    { key: "all", label: "All" },
    { key: "neg", label: "Negative" },
    { key: "slneg", label: "Slight Neg" },
    { key: "neu", label: "Neutral" },
    { key: "slpos", label: "Slight Pos" },
    { key: "pos", label: "Positive" },
  ];

  // Wrapper styles differ depending on variant
  const wrapperClass =
    variant === "block" ? `card p-3 ${className}` : `p-0 ${className}`;

  // Chip padding scales down in inline variant
  const chipPad =
    variant === "inline" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm";

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
                            ? "bg-cta text-white border-transparent"
                            : "bg-white/70 dark:bg-gray-800/70 border-gray-200 dark:border-gray-700"
                        }`}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
