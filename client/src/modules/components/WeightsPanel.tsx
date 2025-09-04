/**
 * -----------------------------------------------------------------------------
 * WeightsPanel — scoring knobs for the client blend model
 * -----------------------------------------------------------------------------
 * PURPOSE
 *   Provide simple, accessible controls for the three blend weights used by the
 *   client-side scoring function:
 *     - wComment : influence of the parent comment's sentiment
 *     - wLikes   : additional influence from like count (explicit term)
 *     - wReplies : influence of the aggregated reply sentiment
 *
 * COLLABORATION NOTES
 *   - This component is intentionally stateless: it receives the `weights`
 *     object and an `onChange` callback from the parent (App). This keeps the
 *     scoring source-of-truth in one place and avoids duplicate state.
 *   - The "Default" button hard-resets to chosen baseline values. If product
 *     wants different baselines, adjust the literals in that handler; no other
 *     code depends on them.
 *   - The little "i" badge next to labels is a minimal, dependency-free
 *     tooltip via the `title` attribute. Avoids pulling in a full UI kit.
 *
 * ACCESSIBILITY
 *   - Range inputs use native HTML <input type="range"> for broad support.
 *   - The current numeric value is mirrored in a monospace span to help users
 *     fine-tune exact values without relying on the slider alone.
 *
 * STYLING
 *   - Uses Tailwind utility classes for layout and theme friendliness.
 *   - No global styles required; safe to embed in cards/grids.
 * -----------------------------------------------------------------------------
 */

import React from 'react'

type Weights = { wComment:number; wLikes:number; wReplies:number }

/**
 * Stateless panel that renders three sliders bound to the weights passed in.
 * Emits the full weights object on every change (parent is responsible for
 * persisting and re-rendering).
 */
export function WeightsPanel({
  weights,
  onChange,
  disabled
}:{ weights:Weights, onChange:(w:Weights)=>void, disabled?:boolean }){
  // Local helper that returns an onChange handler for a specific weight key.
  const set = (key:keyof Weights) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ ...weights, [key]: parseFloat(e.target.value) })

  /**
   * Tiny inline “info” token that uses `title` for a native tooltip. Kept here
   * rather than importing an icon set to keep the bundle small and portable.
   */
  const Info = ({text}:{text:string}) => (
    <span
      title={text}
      className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 text-xs"
    >
      i
    </span>
  )

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Weights</h3>
        <button
          type="button"
          onClick={()=>onChange({ wComment:1.0, wLikes:0.7, wReplies:1.0 })}
          className="rounded-lg px-3 py-1.5 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
        >
          Default
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Slider
          label={<span>Comment Sentiment<Info text="How much the raw model score matters in the final adjusted score." /></span>}
          value={weights.wComment}
          min={0}
          max={2}
          step={0.1}
          onChange={set('wComment')}
          disabled={disabled}
        />
        <Slider
          label={<span>Likes Influence<Info text="Amplifies the direction of the comment based on its likes (log-scaled)." /></span>}
          value={weights.wLikes}
          min={0}
          max={2}
          step={0.1}
          onChange={set('wLikes')}
          disabled={disabled}
        />
        <Slider
          label={<span>Replies Influence<Info text="Incorporates the average reply sentiment (weighted by reply likes)." /></span>}
          value={weights.wReplies}
          min={0}
          max={2}
          step={0.1}
          onChange={set('wReplies')}
          disabled={disabled}
        />
      </div>
    </div>
  )
}

/**
 * Dumb slider control with a label on the left and a live numeric value on the
 * right. Keeps presentation concerns isolated from the panel layout above.
 */
function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  disabled
}:{label:React.ReactNode,value:number,min:number,max:number,step:number,onChange:(e:any)=>void,disabled?:boolean}){
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
        <span className="text-sm font-mono">{value.toFixed(1)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full"
      />
    </div>
  )
}
