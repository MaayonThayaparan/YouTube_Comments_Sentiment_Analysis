/**
 * main.tsx — React Application Entrypoint
 * -----------------------------------------------------------------------------
 * WHAT:
 *   - Bootstraps the React SPA (Single Page Application).
 *   - Binds the React virtual DOM into the static <div id="root"> in index.html.
 *
 * WHY:
 *   - Provides a single, predictable mounting point for React.
 *   - Uses React.StrictMode to highlight potential issues in development.
 *
 * NOTES:
 *   - ReactDOM.createRoot is the new API for React 18 concurrent features.
 *   - index.css applies Tailwind + global styling (theme, resets).
 *   - App.tsx contains the actual application logic & routing.
 */

import React from "react";
import ReactDOM from "react-dom/client";

// Application root component
import App from "./modules/App";

// Global styles (Tailwind + custom overrides)
import "./index.css";

// Bind React to DOM root element
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
