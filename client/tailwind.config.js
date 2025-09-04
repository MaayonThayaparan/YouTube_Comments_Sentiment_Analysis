/**
 * -----------------------------------------------------------------------------
 * Tailwind CSS configuration (ESM)
 * -----------------------------------------------------------------------------
 * PURPOSE
 *   Central styling config for the React client. Keeps Tailwind’s JIT compiler
 *   pointed at our templates, applies a small number of design tokens
 *   (Inter font + a couple branded gradients), and leaves plugins open-ended.
 *
 * KEY DECISIONS
 *   - ESM export: matches Vite’s ESM toolchain; zero CommonJS interop needed.
 *   - Content globs are minimal and safe for tree-shaking: `index.html` +
 *     all TS/TSX under `src/`. This ensures unused classes are purged in prod.
 *   - Theme extension only (no overrides): we extend defaults with `Inter`
 *     as the primary sans face and name two gradients used across hero/CTAs.
 *   - Plugins array kept empty by default to reduce build weight; add
 *     `@tailwindcss/typography` or `@tailwindcss/forms` per feature PRs.
 *
 * COLLABORATION NOTES
 *   - If you introduce new template directories (e.g., `src/pages/**` from a
 *     router, or Markdown rendering), update `content` so JIT sees classnames.
 *   - Gradients are semantic: `bg-yt-head` and `bg-cta`. Prefer using these
 *     names over raw hexes in components to keep brand colors centralized.
 *   - We rely on CSS custom properties (e.g., `--surface`, `--text`, `--border`)
 *     for theme surfaces; Tailwind config doesn’t duplicate those tokens.
 * -----------------------------------------------------------------------------
 */

/** @type {import('tailwindcss').Config} */
export default {
  // Files Tailwind scans for class names (drives JIT + production purge)
  content: ['./index.html', './src/**/*.{ts,tsx}'],

  theme: {
    extend: {
      // Primary typeface: Inter, falling back to system UI sans stack.
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },

      // Branded gradients used in headers and call-to-action components.
      backgroundImage: {
        'yt-head': 'linear-gradient(135deg, #ef4444 0%, #0f172a 100%)',
        'cta':     'linear-gradient(135deg, #ef4444 0%, #7c3aed 100%)',
      },
    },
  },

  // Keep core minimal; add official plugins as needed in feature branches.
  plugins: [],
}
