import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
