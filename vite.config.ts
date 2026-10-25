import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      preserveEntrySignatures: false,
      output: {
        strictExecutionOrder: true,
        codeSplitting: {
          includeDependenciesRecursively: false,
          groups: [
            { name: 'sitemap', test: /src[\\/]sitemap[\\/]/, priority: 155 },
            { name: 'localization', test: /src[\\/]i18n[\\/]|node_modules[\\/](?:i18next|react-i18next)[\\/]/, priority: 150 },
            { name: 'encyclopedia', test: /src[\\/]encyclopedia[\\/]/, priority: 125 },
            { name: 'studio-languages', test: /src[\\/]studio[\\/]languages\.generated\.json/, priority: 120 },
            { name: 'studio-source', test: /src[\\/]studio[\\/]sources\.generated\.json/, priority: 120 },
            { name: 'studio-engine', test: /src[\\/]studio[\\/](engine|kernels|trace)\.ts/, priority: 110 },
            { name: 'vendor-chess', test: /node_modules[\\/]chess\.js/, priority: 100 },
            {
              name(id) {
                if (id.includes('/src/daa/AmortizedMockupLesson') || id.includes('/src/daa/amortizedModel') || id.includes('/src/daa/amortized-mockup.css'))
                  return 'amortized-mockup'
                if (id.includes('/src/daa/PseudocodeMockupLesson') || id.includes('/src/daa/pseudocodeModel') || id.includes('/src/daa/pseudocode-mockup.css'))
                  return 'pseudocode-mockup'
                if (id.includes('/src/daa/MinMaxMockupLesson') || id.includes('/src/daa/minMaxModel') || id.includes('/src/daa/min-max-mockup.css'))
                  return 'min-max-mockup'
                if (
                  id.includes('/src/daa/MaximumSubarrayMockupLesson') ||
                  id.includes('/src/daa/maximumSubarrayModel') ||
                  id.includes('/src/daa/maximum-subarray-mockup.css')
                )
                  return 'maximum-subarray-mockup'
                if (id.includes('/src/daa/StrassenMockupLesson') || id.includes('/src/daa/strassenModel') || id.includes('/src/daa/strassen-mockup.css'))
                  return 'strassen-mockup'
                if (
                  id.includes('/src/daa/QuickselectMockupLesson') ||
                  id.includes('/src/daa/quickselectModel') ||
                  id.includes('/src/daa/quickselect-mockup.css') ||
                  id.includes('/src/daa/MockupLessonChrome')
                )
                  return 'quickselect-mockup'
                if (id.includes('/src/daa/MedianOfMediansLesson') || id.includes('/src/daa/medianModel') || id.includes('/src/daa/median-mockup.css'))
                  return 'median-mockup'
                if (
                  id.includes('/src/learning/BacktrackingStudio') ||
                  id.includes('/src/learning/backtrackingModel') ||
                  id.includes('/src/learning/backtracking.css')
                )
                  return 'backtracking-learning'
                if (id.includes('/src/learning/GreedyStudio') || id.includes('/src/learning/greedyModel') || id.includes('/src/learning/greedy.css'))
                  return 'greedy-learning'
                if (
                  id.includes('/src/learning/DynamicProgrammingStudio') ||
                  id.includes('/src/learning/dpProfiles') ||
                  id.includes('/src/learning/dpExtras') ||
                  id.includes('/src/learning/dpModel') ||
                  id.includes('/src/learning/dynamic-programming.css')
                )
                  return 'dp-learning'
                if (
                  id.includes('/src/components/PenguinVisualization') ||
                  id.includes('/src/components/penguins.css') ||
                  id.includes('/src/data/sortingCharacters')
                )
                  return 'sorting-characters'
                if (id.includes('/src/daa/')) return id.includes('?raw') ? 'daa-source' : 'daa-learning'
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
          ],
        },
      },
    },
  },
})
