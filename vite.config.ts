import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'vendor-react'
          }
          if (id.includes('node_modules/framer-motion')) return 'vendor-motion'
          if (id.includes('node_modules/lucide-react')) return 'vendor-icons'
          if (id.includes('node_modules/dexie')) return 'vendor-storage'
          if (id.includes('/src/algorithms/')) return 'algorithms'
          if (id.includes('/src/components/') || id.includes('/src/guides/') || id.includes('/src/exports/')) return 'ui-support'
        },
      },
    },
  },
})
