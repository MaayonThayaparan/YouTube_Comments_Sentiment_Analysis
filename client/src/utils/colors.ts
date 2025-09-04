/**
 * Color mapping for sentiment scores.
 * WHY: A compact helper avoids sprinkling threshold logic across components.
 */
export function colorForScore(x: number) {
  if      (x >= 0.6) return { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', hex: '#10b981' }
  else if (x >= 0.2) return { bg: 'bg-lime-100',    text: 'text-lime-800',    border: 'border-lime-300',    hex: '#84cc16' }
  else if (x > -0.2) return { bg: 'bg-yellow-100',  text: 'text-yellow-800',  border: 'border-yellow-300',  hex: '#f59e0b' }
  else if (x > -0.6) return { bg: 'bg-orange-100',  text: 'text-orange-800',  border: 'border-orange-300',  hex: '#f97316' }
  return              { bg: 'bg-red-100',     text: 'text-red-800',     border: 'border-red-300',     hex: '#ef4444' }
}
