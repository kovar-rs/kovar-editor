import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use CDN URL in production, relative path in dev
  base: process.env.NODE_ENV === 'production'
    ? 'https://cdn.jsdelivr.net/gh/kovar-rs/kovar-editor@gh-pages/'
    : '/',
  build: {
    rollupOptions: {
      output: {
        // Fixed filenames without hash
        entryFileNames: 'editor.min.js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'editor.min.css'
          }
          return '[name][extname]'
        },
      },
    },
  },
})
