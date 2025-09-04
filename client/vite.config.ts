import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Node 18: use plugin-react v4.x. Dev server runs on 5173
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 }
})
