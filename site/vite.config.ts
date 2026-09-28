import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Local dev/preview serve from '/'. The GitHub Pages build sets PAGES_BASE=/BB-Bakery/
// (see `npm run deploy:pages`), so every asset URL is prefixed with the project path.
export default defineConfig({
  base: process.env.PAGES_BASE || '/',
  plugins: [react()],
})
