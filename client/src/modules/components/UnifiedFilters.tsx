/**
 * UnifiedFilters.tsx
 * -----------------------------------------------------------------------------
 * WHAT:
 *   - A reusable filter bar that consolidates global filters (date, country,
 *     subscribers, likes, replies) into a consistent UI.
 *
 * WHY:
 *   - Centralizes filter logic in one place for easier maintenance.
 *   - Provides a compact but responsive layout:
 *       • Mobile → stacked 1-column for readability.
 *       • sm/md/lg → 3-column grid for efficiency.
 *       • xl+ → 12-column grid with wider spans so dates/subscribers fit.
 *
 * DESIGN DECISIONS:
 *   - RangeGroup wraps Min/Max pairs inside a single bordered container to
 *     visually imply relationship and improve keyboard navigation.
 *   - Theme variables (`--input-bg`, `--input-border`, `--text`) used for
 *     consistent light/dark theming without hardcoding colors.
 *   - A "Clear" button is always present to reset all filters quickly.
 *
 * NOTES:
 *   - Layout scales gracefully with Tailwind grid utilities.
 *   - Controlled inputs for React state synchronization.
 *   - Future extensions (e.g., sentiment thresholds) can be slotted easily.
 */

import React from "react";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/** Filter state managed at the App level. */
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

// -----------------------------------------------------------------------------
// RangeGroup helper
// -----------------------------------------------------------------------------

/**
 * RangeGroup
 * -----------------------------------------------------------------------------
 * Small helper that renders a "Min | Max" numeric pair.
 *
 * WHY:
 *   - Keeps paired inputs visually and structurally grouped.
 *   - Improves UX by showing relation and reducing mis-entry risk.
 *   - Optimizes keyboard flow (Tab moves from min → max seamlessly).
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

      {/* Single bordered container for visual grouping of min/max inputs */}
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

// -----------------------------------------------------------------------------
// UnifiedFilters component
// -----------------------------------------------------------------------------

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
      {/* ---------------------------------------------------------------------
           ROW 1: Date / Subscribers / Country
           Responsive grid: 1-col mobile, 3-col sm/md, 12-col xl
      --------------------------------------------------------------------- */}
      <div
        className="
          grid gap-4 mb-3
          grid-cols-1
          sm:grid-cols-3
          xl:grid-cols-12
        "
      >
        {/* Date Range selector */}
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

        {/* Subscribers range */}
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

        {/* Country dropdown */}
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

      {/* ---------------------------------------------------------------------
           ROW 2: Likes / Replies / Clear Button
           Responsive grid mirrors row 1; Clear spans smaller at xl.
      --------------------------------------------------------------------- */}
      <div
        className="
          grid gap-4
          grid-cols-1
          sm:grid-cols-3
          xl:grid-cols-12
        "
      >
        {/* Likes range */}
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

        {/* Replies range */}
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

        {/* Clear all filters button */}
        <div className="xl:col-span-2 sm:col-span-1 flex items-end">
          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={onClear}
            aria-label="Clear all filters"
          >
            Clear
          </button>
        </div>

        {/* Spacer: ensures 12-col balance (5 + 5 + 2 = 12) */}
        <div className="hidden xl:block xl:col-span-1" />
      </div>
    </div>
  );
}