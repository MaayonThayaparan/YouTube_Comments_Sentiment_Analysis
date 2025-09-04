import React from "react";

/**
 * UnifiedFilters
 * ---------------------------------------------------------------------------
 * This component merges the concerns of the previous TimeWindow + GlobalFilters
 * into a single, horizontally-compact bar that can sit next to VideoMetaCard
 * on desktop. On small screens it naturally stacks (Tailwind grid).
 *
 * Design notes (staff-level rationale):
 * - All fields are controlled from the parent (App) to keep a single source of
 *   truth for filtering state. This simplifies cache invalidation and makes it
 *   obvious what triggers recomputation of charts/tables.
 * - We keep each filter's onChange as a narrow callback (one responsibility)
 *   instead of passing a giant "setFilters" to avoid accidental partial updates.
 * - The layout uses a 12-column grid so we can keep consistent spacing with
 *   other modules and easily tune breakpoints without rewriting markup.
 */

export type UnifiedFiltersState = {
  // time
  from: string; // ISO yyyy-mm-dd
  to: string;   // ISO yyyy-mm-dd

  // audience / geo
  country: string | null;
  countryOptions: string[];

  // numeric ranges
  minSubs?: number | "";
  maxSubs?: number | "";
  minLikes?: number | "";
  maxLikes?: number | "";
  minReplies?: number | "";
  maxReplies?: number | "";
};

type Props = {
  value: UnifiedFiltersState;
  onDateChange: (fromISO: string, toISO: string) => void;
  onCountryChange: (country: string | null) => void;
  onSubsChange: (min: number | "", max: number | "") => void;
  onLikesChange: (min: number | "", max: number | "") => void;
  onRepliesChange: (min: number | "", max: number | "") => void;
  onClear: () => void;
};

export const UnifiedFilters: React.FC<Props> = ({
  value,
  onDateChange,
  onCountryChange,
  onSubsChange,
  onLikesChange,
  onRepliesChange,
  onClear,
}) => {
  // Local helpers keep the JSX lean and readable.
  const handleDate = (field: "from" | "to") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = { ...value, [field]: e.target.value };
    onDateChange(next.from, next.to);
  };

  const numOrEmpty = (s: string) => (s === "" ? "" : Number(s));

  return (
    <div
      className="
        card p-4
        grid grid-cols-12 gap-3 items-end
        /* Mobile: stack; md+: compact inline bar */
      "
      aria-label="Filters"
    >
      {/* Dates */}
      <div className="col-span-12 md:col-span-3">
        <label className="block text-xs font-medium mb-1">From</label>
        <input
          type="date"
          className="w-full rounded-lg px-3 py-2"
          value={value.from}
          onChange={handleDate("from")}
        />
      </div>
      <div className="col-span-12 md:col-span-3">
        <label className="block text-xs font-medium mb-1">To</label>
        <input
          type="date"
          className="w-full rounded-lg px-3 py-2"
          value={value.to}
          onChange={handleDate("to")}
        />
      </div>

      {/* Country */}
      <div className="col-span-12 md:col-span-2">
        <label className="block text-xs font-medium mb-1">Country</label>
        <select
          className="w-full rounded-lg px-3 py-2"
          value={value.country ?? ""}
          onChange={(e) => onCountryChange(e.target.value || null)}
        >
          <option value="">Any</option>
          {value.countryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Subs (min / max) */}
      <div className="col-span-12 md:col-span-2">
        <label className="block text-xs font-medium mb-1">Min subscribers</label>
        <input
          inputMode="numeric"
          className="w-full rounded-lg px-3 py-2"
          placeholder="e.g., 1000"
          value={value.minSubs ?? ""}
          onChange={(e) => onSubsChange(numOrEmpty(e.target.value as any), value.maxSubs ?? "")}
        />
      </div>
      <div className="col-span-12 md:col-span-2">
        <label className="block text-xs font-medium mb-1">Max subscribers</label>
        <input
          inputMode="numeric"
          className="w-full rounded-lg px-3 py-2"
          placeholder="e.g., 100000"
          value={value.maxSubs ?? ""}
          onChange={(e) => onSubsChange(value.minSubs ?? "", numOrEmpty(e.target.value as any))}
        />
      </div>

      {/* Likes (min / max) */}
      <div className="col-span-12 md:col-span-2">
        <label className="block text-xs font-medium mb-1">Min likes</label>
        <input
          inputMode="numeric"
          className="w-full rounded-lg px-3 py-2"
          value={value.minLikes ?? ""}
          onChange={(e) => onLikesChange(numOrEmpty(e.target.value as any), value.maxLikes ?? "")}
        />
      </div>
      <div className="col-span-12 md:col-span-2">
        <label className="block text-xs font-medium mb-1">Max likes</label>
        <input
          inputMode="numeric"
          className="w-full rounded-lg px-3 py-2"
          value={value.maxLikes ?? ""}
          onChange={(e) => onLikesChange(value.minLikes ?? "", numOrEmpty(e.target.value as any))}
        />
      </div>

      {/* Replies (min / max) */}
      <div className="col-span-12 md:col-span-2">
        <label className="block text-xs font-medium mb-1">Min replies</label>
        <input
          inputMode="numeric"
          className="w-full rounded-lg px-3 py-2"
          value={value.minReplies ?? ""}
          onChange={(e) =>
            onRepliesChange(numOrEmpty(e.target.value as any), value.maxReplies ?? "")
          }
        />
      </div>
      <div className="col-span-12 md:col-span-2">
        <label className="block text-xs font-medium mb-1">Max replies</label>
        <input
          inputMode="numeric"
          className="w-full rounded-lg px-3 py-2"
          value={value.maxReplies ?? ""}
          onChange={(e) =>
            onRepliesChange(value.minReplies ?? "", numOrEmpty(e.target.value as any))
          }
        />
      </div>

      {/* Clear */}
      <div className="col-span-12 md:col-span-1 flex md:justify-end">
        <button className="btn border px-3 py-2 rounded-lg" onClick={onClear}>
          Clear
        </button>
      </div>
    </div>
  );
};
