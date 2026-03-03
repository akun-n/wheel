import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // Needed for GitHub Pages project sites like https://akun-n.github.io/wheel/
  base: mode === 'production' ? '/wheel/' : '/',
  plugins: [react()],
}))
