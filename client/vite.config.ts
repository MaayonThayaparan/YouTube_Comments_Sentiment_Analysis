/**
 * -----------------------------------------------------------------------------
 * Vite configuration (frontend)
 * -----------------------------------------------------------------------------
 * PURPOSE
 *   Development/build configuration for the React client. We keep this file
 *   intentionally minimal: enable the official React plugin and set the dev
 *   server port to 5173 (the default for Vite + React).
 *
 * KEY DECISIONS
 *   - React plugin: enables fast refresh (HMR) and sensible JSX/TSX defaults.
 *   - Port 5173: pairs with the server running on 5177 by default; this avoids
 *     port collisions with other local services. CORS is handled by the API.
 *
 * COLLABORATION NOTES
 *   - If you need to call the API during local dev without CORS headaches,
 *     prefer updating server CORS `ALLOWED_ORIGINS` to include
 *     `http://localhost:5173`. The backend already exposes this knob.
 *   - If you prefer a transparent dev proxy instead of CORS, you can add a
 *     `server.proxy` block here (see commented template below), but do not
 *     commit that change unless the team agrees—we currently rely on CORS.
 *
 * COMMON EXTENSIONS (leave commented until needed)
 *   - Base path for GitHub Pages or subpath deploys:
 *       // export default defineConfig({ base: '/yt-sentiment/', ... })
 *   - Proxy API to the backend during dev:
 *       // server: {
 *       //   port: 5173,
 *       //   proxy: {
 *       //     '/api': { target: 'http://localhost:5177', changeOrigin: true }
 *       //   }
 *       // }
 *   - Build output directory for static hosting:
 *       // build: { outDir: 'dist' }
 * -----------------------------------------------------------------------------
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Minimal setup: React fast-refresh + dev server on 5173.
// Keep this small; feature-specific tuning belongs in feature PRs.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 }
})
