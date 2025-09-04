/**
 * -----------------------------------------------------------------------------
 * Client entry point (React 18 + Vite)
 * -----------------------------------------------------------------------------
 * PURPOSE
 *   Bootstraps the SPA by mounting <App /> into the #root node. This file is
 *   intentionally tiny: it wires global CSS, enables React.StrictMode in dev,
 *   and defers all routing/state/layout to App.
 *
 * KEY DECISIONS
 *   - React 18 root API (`createRoot`) for concurrent features + strict mode.
 *   - StrictMode is kept ON in development to surface side-effect bugs; note it
 *     double-invokes certain lifecycle hooks in dev only (no impact in prod).
 *   - Global CSS is imported here once to ensure Tailwind/base styles load
 *     before any component renders.
 *
 * COLLABORATION NOTES
 *   - If you add client-side routing, do it inside App (or a Router provider)
 *     rather than here—keeps the entry lightweight and testable.
 *   - The non-null assertion on `getElementById('root')!` is safe given our
 *     index.html contract; avoid extra runtime checks for perf and clarity.
 * -----------------------------------------------------------------------------
 */

import React from 'react'
import ReactDOM from 'react-dom/client'

// Top-level application component (composition: routes, providers, layout).
import App from './modules/App'

// Global styles (Tailwind layers + project tokens).
import './index.css'

// Mount the app. StrictMode: dev-only extra checks; no prod runtime cost.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
