/**
 * =============================================================================
 * UnifiedFilters — global time + meta filters bar (staff developer notes)
 * =============================================================================
 * PURPOSE
 *   Provide a single, compact control surface for global filters that affect
 *   all downstream charts/tables:
 *     • Date range (from/to)
 *     • Country (channel-level enrichment)
 *     • Numeric ranges for subscribers, likes, replies
 *
 * LAYOUT STRATEGY
 *   - Mobile-first single column; upgrades to a 3-col grid on small screens.
 *   - On very wide screens (xl), an explicit 12-col grid lets us allocate
 *     more span to longer controls (Date/Subs) so labels and full dates fit.
 *
 * STATE OWNERSHIP
 *   - The component is fully controlled: `value` in, granular callbacks out.
 *   - Parent owns canonical state; this component never mutates it directly.
 *
 * ACCESSIBILITY & UX
 *   - Paired min/max inputs are rendered inside one bordered wrapper to signal
 *     that they’re a logical unit and to streamline keyboard tabbing.
 *   - All inputs read theme tokens via CSS variables for consistent theming.
 *
 * EXTENSION POINTS
 *   - Add per-field validation (e.g., swap min/max if inverted) in the parent.
 *   - Country list is provided as `countryOptions`; keep it de-duped upstream.
 *
 * NOTE
 *   - There is an extraneous string inside a className below ("lets go") which
 *     looks accidental and has no functional effect; leave as-is per the
 *     “comments-only” directive, but consider removing in a future code-only PR.
 * =============================================================================
 */
import React from "react";

export type UnifiedFiltersState = {
  /** ISO date (YYYY-MM-DD) lower bound, inclusive. */
  from: string;
  /** ISO date (YYYY-MM-DD) upper bound, inclusive. */
  to: string;

  /** Channel country (nullable = any). */
  country: string | null;
  /** Available country list (precomputed upstream for performance). */
  countryOptions: string[];

  /** Subscribers: string to allow empty input; parent parses as needed. */
  minSubs: string;
  maxSubs: string;

  /** Likes: string to allow empty input; parent parses as needed. */
  minLikes: string;
  maxLikes: string;

  /** Replies: string to allow empty input; parent parses as needed. */
  minReplies: string;
  maxReplies: string;
};

type Props = {
  /** Current filter state (controlled). */
  value: UnifiedFiltersState;

  /** Emit new date window (from, to) when either picker changes. */
  onDateChange: (from: string, to: string) => void;
  /** Emit new country or null for “Any”. */
  onCountryChange: (country: string | null) => void;

  /** Numeric range updaters (kept stringly-typed for empty handling). */
  onSubsChange: (min: string, max: string) => void;
  onLikesChange: (min: string, max: string) => void;
  onRepliesChange: (min: string, max: string) => void;

  /** Clear all fields back to parent-provided defaults. */
  onClear: () => void;
};

/**
 * RangeGroup
 * ----------
 * Binds a (min,max) numeric pair into a single bordered control for better
 * visual grouping and keyboard traversal. This component is intentionally
 * dumb: it renders whatever strings it’s given and delegates parsing/validation
 * to the parent, which owns the canonical filter state.
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

/**
 * UnifiedFilters (component)
 * --------------------------
 * Renders two responsive rows of inputs. All callbacks are passed through to
 * the parent; there is no local state here by design.
 */
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
      <div
        className="
          grid gap-4 mb-3
          grid-cols-1 lets go 
          sm:grid-cols-3
          xl:grid-cols-12
        "
      >
        {/* Date Range */}
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

        {/* Subscribers */}
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

        {/* Country */}
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
      <div
        className="
          grid gap-4
          grid-cols-1 
          sm:grid-cols-3
          xl:grid-cols-12
        "
      >
        {/* Likes */}
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

        {/* Replies */}
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

        {/* Clear button */}
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

        {/* Spacer on xl to complete the 12 columns (see header notes) */}
        <div className="hidden xl:block xl:col-span-1" />
      </div>
    </div>
  );
}
