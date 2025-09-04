import React from "react";

/**
 * UnifiedFilters
 * ---------------------------------------------------------------------------
 * A compact, two–row filter bar that merges time window + global filters.
 *
 * Layout goals:
 *  - Mobile (default) .......... 1 column stack (readable on phones)
 *  - Small/Medium (sm/md/lg) ... 3 equal columns per row
 *  - Wide screens (xl and up) .. 12-col grid with wider spans for Date/Subs
 *                                 so full date text fits comfortably.
 *
 * Row 1 (xl):
 *   [Date Range span=5] | [Subscribers span=4] | [Country span=3]
 * Row 2 (xl):
 *   [Likes span=4]      | [Replies span=4]     | [Clear span=3 (right)]
 *
 * Visual affordances:
 *  - Paired min/max inputs are wrapped together so users see they’re related.
 *  - All controls read theme tokens from CSS variables for consistent theming.
 */

export type UnifiedFiltersState = {
  from: string;
  to: string;
  country: string | null;
  countryOptions: string[];

  minSubs: string;
  maxSubs: string;
  minLikes: string;
  maxLikes: string;
  minReplies: string;
  maxReplies: string;
};

type Props = {
  value: UnifiedFiltersState;

  onDateChange: (from: string, to: string) => void;
  onCountryChange: (country: string | null) => void;

  onSubsChange: (min: string, max: string) => void;
  onLikesChange: (min: string, max: string) => void;
  onRepliesChange: (min: string, max: string) => void;

  onClear: () => void;
};

/**
 * RangeGroup
 * Small helper that renders a "Min | Max" pair inside a single bordered box.
 * This provides:
 *  - Visual grouping (users understand min/max belong together)
 *  - Keyboard efficiency (tab once to jump from min to max)
 *  - A single hit area that feels like a composite control
 */
function RangeGroup({
  label,
  min,
  max,
  onChange,
  placeholderMin,
  placeholderMax,
}: {
  label: string;
  min: string;
  max: string;
  onChange: (min: string, max: string) => void;
  placeholderMin: string;
  placeholderMax: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">
        {label}
      </label>

      {/* One bordered container that holds both fields for clear pairing */}
      <div className="flex border rounded-lg bg-[var(--input-bg)] border-[var(--input-border)]">
        <input
          inputMode="numeric"
          className="w-1/2 px-2 py-2 bg-transparent text-[var(--text)] outline-none"
          placeholder={placeholderMin}
          value={min}
          onChange={(e) => onChange(e.target.value, max)}
        />
        <input
          inputMode="numeric"
          className="w-1/2 px-2 py-2 bg-transparent text-[var(--text)] outline-none border-l border-[var(--input-border)]"
          placeholder={placeholderMax}
          value={max}
          onChange={(e) => onChange(min, e.target.value)}
        />
      </div>
    </div>
  );
}

export function UnifiedFilters({
  value,
  onDateChange,
  onCountryChange,
  onSubsChange,
  onLikesChange,
  onRepliesChange,
  onClear,
}: Props) {
  const {
    from,
    to,
    country,
    countryOptions,
    minSubs,
    maxSubs,
    minLikes,
    maxLikes,
    minReplies,
    maxReplies,
  } = value;

  return (
    <div className="card p-4 h-full flex flex-col">
      {/* 
        === ROW 1 ============================================================
        Default → 1 col (mobile)
        sm/lg  → 3 equal cols (space efficient)
        xl     → 12-col grid to allow wider spans for Date + Subs
      */}
      <div className="
          grid gap-4 mb-3
          grid-cols-1 lets go 
          sm:grid-cols-3
          xl:grid-cols-12
        "
      >
        {/* Date Range: */}
        <div className="xl:col-span-5 sm:col-span-1">
          <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">
            Date Range
          </label>
          <div className="flex border rounded-lg bg-[var(--input-bg)] border-[var(--input-border)]">
            <input
              type="date"
              className="w-1/2 px-2 py-2 bg-transparent text-[var(--text)] outline-none"
              value={from}
              onChange={(e) => onDateChange(e.target.value, to)}
            />
            <input
              type="date"
              className="w-1/2 px-2 py-2 bg-transparent text-[var(--text)] outline-none border-l border-[var(--input-border)]"
              value={to}
              onChange={(e) => onDateChange(from, e.target.value)}
            />
          </div>
        </div>

        {/* Subscribers: */}
        <div className="xl:col-span-5 sm:col-span-1">
          <RangeGroup
            label="Subscribers"
            min={minSubs}
            max={maxSubs}
            placeholderMin="Min"
            placeholderMax="Max"
            onChange={onSubsChange}
          />
        </div>

        {/* Country: */}
        <div className="xl:col-span-2 sm:col-span-1">
          <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">
            Country
          </label>
          <select
            className="w-full rounded-lg border px-2 py-2 bg-[var(--input-bg)] text-[var(--text)] border-[var(--input-border)]"
            value={country ?? ""}
            onChange={(e) => onCountryChange(e.target.value || null)}
          >
            <option value="">Any</option>
            {countryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 
        === ROW 2 ============================================================
        Same responsive logic; xl uses 12-col spans so Clear can be narrower.
      */}
      <div className="
          grid gap-4
          grid-cols-1 
          sm:grid-cols-3
          xl:grid-cols-12
        "
      >
        {/* Likes: xl */}
        <div className="xl:col-span-5 sm:col-span-1">
          <RangeGroup
            label="Likes"
            min={minLikes}
            max={maxLikes}
            placeholderMin="Min"
            placeholderMax="Max"
            onChange={onLikesChange}
          />
        </div>

        {/* Replies: */}
        <div className="xl:col-span-5 sm:col-span-1">
          <RangeGroup
            label="Replies"
            min={minReplies}
            max={maxReplies}
            placeholderMin="Min"
            placeholderMax="Max"
            onChange={onRepliesChange}
          />
        </div>

        {/* Clear button:  */}
        <div className="xl:col-span-2 sm:col-span-1 flex items-end">
          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={onClear}
            // Avoid overlap with neighboring inputs at tight widths.
            aria-label="Clear all filters"
          >
            Clear
          </button>
        </div>

        {/* Spacer on xl to complete the 12 columns (5+4+3 / 4+4+3 leaves 1) */}
        <div className="hidden xl:block xl:col-span-1" />
      </div>
    </div>
  );
}
