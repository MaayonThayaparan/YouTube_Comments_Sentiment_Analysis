/**
 * WeightsPanel.tsx — User-adjustable sliders for sentiment weighting
 * -----------------------------------------------------------------------------
 * WHAT:
 *   - Allows user to tune how final sentiment is computed:
 *       • Raw comment sentiment weight
 *       • Likes influence weight
 *       • Replies influence weight
 *   - Provides "Default" reset button.
 *
 * WHY:
 *   - Interactive control lets analysts explore sensitivity of scores to
 *     engagement signals (likes, replies) vs raw sentiment.
 *
 * NOTES:
 *   - Sliders are normalized [0,2] with step=0.1.
 *   - Each slider has an inline "info" tooltip for context.
 *   - Styled with Tailwind, with custom gradient circular thumbs.
 */

import React from "react";

type Weights = { wComment: number; wLikes: number; wReplies: number };

/**
 * Panel container for all three weight sliders + reset control.
 */
export function WeightsPanel({
  weights,
  onChange,
  disabled,
}: {
  weights: Weights;
  onChange: (w: Weights) => void;
  disabled?: boolean;
}) {
  // Utility: returns handler bound to the right key in weights
  const set =
    (key: keyof Weights) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ ...weights, [key]: parseFloat(e.target.value) });

  // Small inline tooltip "i" bubble
  const Info = ({ text }: { text: string }) => (
    <span
      title={text}
      className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 text-xs"
    >
      i
    </span>
  );

  return (
    <div className="card p-4">
      {/* Header row: title + reset button */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Weights</h3>
        <button
          type="button"
          onClick={() =>
            onChange({ wComment: 1.0, wLikes: 0.7, wReplies: 1.0 })
          }
          className="rounded-lg px-3 py-1.5 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
        >
          Default
        </button>
      </div>

      {/* Three adjustable sliders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Slider
          label={
            <span>
              Comment Sentiment
              <Info text="How much the raw model score matters in the final adjusted score." />
            </span>
          }
          value={weights.wComment}
          min={0}
          max={2}
          step={0.1}
          onChange={set("wComment")}
          disabled={disabled}
        />

        <Slider
          label={
            <span>
              Likes Influence
              <Info text="Amplifies the direction of the comment based on its likes (log-scaled)." />
            </span>
          }
          value={weights.wLikes}
          min={0}
          max={2}
          step={0.1}
          onChange={set("wLikes")}
          disabled={disabled}
        />

        <Slider
          label={
            <span>
              Replies Influence
              <Info text="Incorporates the average reply sentiment (weighted by reply likes)." />
            </span>
          }
          value={weights.wReplies}
          min={0}
          max={2}
          step={0.1}
          onChange={set("wReplies")}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

/**
 * Slider — generic input[type=range] with custom gradient circular knob.
 * - Shows label on left + current numeric value on right.
 * - Disabled state dims thumb and track.
 */
function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  disabled,
}: {
  label: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (e: any) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      {/* Row: label (left) + numeric value (right) */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {label}
        </span>
        <span className="text-sm font-mono">{value.toFixed(1)}</span>
      </div>

      {/* Range input with custom circular thumb styling */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="
          w-full h-2 rounded-lg appearance-none cursor-pointer
          bg-gray-200 dark:bg-gray-700
          disabled:opacity-50
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-red-500 [&::-webkit-slider-thumb]:to-fuchsia-500
          [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
          dark:[&::-webkit-slider-thumb]:border-gray-800
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-gradient-to-r [&::-moz-range-thumb]:from-red-500 [&::-moz-range-thumb]:to-fuchsia-500
          [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white
          dark:[&::-moz-range-thumb]:border-gray-800
          [&::-moz-range-thumb]:cursor-pointer
        "
      />
    </div>
  );
}