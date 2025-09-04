/**
 * -----------------------------------------------------------------------------
 * PostCSS configuration
 * -----------------------------------------------------------------------------
 * PURPOSE
 *   Wire up the CSS transform pipeline used by Vite during dev/build:
 *   - tailwindcss  : expands utility classes based on `tailwind.config.ts`
 *   - autoprefixer : adds vendor prefixes per our Browserslist targets
 *
 * KEY DECISIONS
 *   - Plugin order matters: Tailwind should run BEFORE Autoprefixer so any
 *     generated utilities also get prefixed as needed.
 *   - We keep this file minimal; Tailwind handles most authoring ergonomics.
 *   - Autoprefixer targets are controlled by your project’s `browserslist`
 *     in `package.json` (or `.browserslistrc`) to avoid hardcoding here.
 *
 * COLLABORATION NOTES
 *   - Need CSS features like nesting or imports?
 *       • Add `postcss-nesting` for spec-compliant nesting.
 *       • Add `postcss-import` if you want to `@import` plain CSS files.
 *     Place them BEFORE Tailwind in the plugin list.
 *   - Source maps are managed by Vite (`build.sourcemap`)—no changes here.
 *   - If you introduce a design system plugin (e.g., forms/typography),
 *     prefer adding the official Tailwind plugins in `tailwind.config.*`
 *     instead of expanding PostCSS complexity.
 * -----------------------------------------------------------------------------
 */

export default { plugins: { tailwindcss: {}, autoprefixer: {} } }
