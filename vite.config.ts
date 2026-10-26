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
                if (
                  id.includes('/src/daa/ReliabilityMockupLesson') ||
                  id.includes('/src/daa/reliabilityLessonModel') ||
                  id.includes('/src/daa/reliability-mockup.css')
                )
                  return 'reliability-mockup'
                if (
                  id.includes('/src/daa/SuffixArrayMockupLesson') ||
                  id.includes('/src/daa/suffixArrayLessonModel') ||
                  id.includes('/src/daa/suffix-array-mockup.css')
                )
                  return 'suffix-array-mockup'
                if (
                  id.includes('/src/daa/BoyerMooreMockupLesson') ||
                  id.includes('/src/daa/boyerMooreLessonModel') ||
                  id.includes('/src/daa/boyer-moore-mockup.css')
                )
                  return 'boyer-moore-mockup'
                if (
                  id.includes('/src/daa/MetricTspMockupLesson') ||
                  id.includes('/src/daa/metricTspLessonModel') ||
                  id.includes('/src/daa/metric-tsp-mockup.css')
                )
                  return 'metric-tsp-mockup'
                if (
                  id.includes('/src/daa/VertexCoverMockupLesson') ||
                  id.includes('/src/daa/vertexCoverLessonModel') ||
                  id.includes('/src/daa/vertex-cover-mockup.css')
                )
                  return 'vertex-cover-mockup'
                if (
                  id.includes('/src/daa/RandomSelectMockupLesson') ||
                  id.includes('/src/daa/randomSelectLessonModel') ||
                  id.includes('/src/daa/random-select-mockup.css')
                )
                  return 'random-select-mockup'
                if (
                  id.includes('/src/daa/RandomQuickMockupLesson') ||
                  id.includes('/src/daa/randomQuickLessonModel') ||
                  id.includes('/src/daa/random-quick-mockup.css')
                )
                  return 'random-quick-mockup'
                if (
                  id.includes('/src/daa/KaratsubaMockupLesson') ||
                  id.includes('/src/daa/karatsubaLessonModel') ||
                  id.includes('/src/daa/karatsuba-mockup.css')
                )
                  return 'karatsuba-mockup'
                if (
                  id.includes('/src/daa/ClosestPairMockupLesson') ||
                  id.includes('/src/daa/closestPairLessonModel') ||
                  id.includes('/src/daa/closest-pair-mockup.css')
                )
                  return 'closest-pair-mockup'
                if (
                  id.includes('/src/daa/InversionsMockupLesson') ||
                  id.includes('/src/daa/inversionLessonModel') ||
                  id.includes('/src/daa/inversions-mockup.css')
                )
                  return 'inversions-mockup'
                if (id.includes('/src/daa/EulerianMockupLesson') || id.includes('/src/daa/eulerianLessonModel') || id.includes('/src/daa/eulerian-mockup.css'))
                  return 'eulerian-mockup'
                if (id.includes('/src/daa/bridgeLessonModel') || id.includes('/src/daa/articulationModel')) return 'low-link-model'
                if (id.includes('/src/daa/ArticulationMockupLesson') || id.includes('/src/daa/articulation-mockup.css')) return 'articulation-mockup'
                if (id.includes('/src/daa/BridgesMockupLesson') || id.includes('/src/daa/bridgeLessonModel') || id.includes('/src/daa/bridges-mockup.css'))
                  return 'bridges-mockup'
                if (
                  id.includes('/src/daa/BipartiteMatchingMockupLesson') ||
                  id.includes('/src/daa/bipartiteMatchingModel') ||
                  id.includes('/src/daa/bipartite-matching-mockup.css')
                )
                  return 'bipartite-matching-mockup'
                if (
                  id.includes('/src/daa/EdmondsKarpMockupLesson') ||
                  id.includes('/src/daa/edmondsKarpModel') ||
                  id.includes('/src/daa/edmonds-karp-mockup.css')
                )
                  return 'edmonds-karp-mockup'
                if (id.includes('/src/daa/CookLevinMockupLesson') || id.includes('/src/daa/cookLevinModel') || id.includes('/src/daa/cook-levin-mockup.css'))
                  return 'cook-levin-mockup'
                if (id.includes('/src/daa/certificatesReductionModel')) return 'graph-reduction-model'
                if (
                  id.includes('/src/daa/CliqueCoverMockupLesson') ||
                  id.includes('/src/daa/cliqueCoverModel') ||
                  id.includes('/src/daa/clique-cover-mockup.css')
                )
                  return 'clique-cover-mockup'
                if (
                  id.includes('/src/daa/ThreeSatCliqueMockupLesson') ||
                  id.includes('/src/daa/threeSatCliqueModel') ||
                  id.includes('/src/daa/three-sat-clique-mockup.css')
                )
                  return 'three-sat-clique-mockup'
                if (id.includes('/src/daa/complexityClassesModel')) return 'complexity-certificate-model'
                if (
                  id.includes('/src/daa/CertificatesReductionMockupLesson') ||
                  id.includes('/src/daa/certificatesReductionModel') ||
                  id.includes('/src/daa/certificates-reduction-mockup.css')
                )
                  return 'certificates-reduction-mockup'
                if (
                  id.includes('/src/daa/ComplexityClassesMockupLesson') ||
                  id.includes('/src/daa/complexityClassesModel') ||
                  id.includes('/src/daa/complexity-classes-mockup.css')
                )
                  return 'complexity-classes-mockup'
                if (
                  id.includes('/src/daa/BranchBoundMethodMockupLesson') ||
                  id.includes('/src/daa/branchBoundMethodModel') ||
                  id.includes('/src/daa/branch-bound-method-mockup.css')
                )
                  return 'branch-bound-method-mockup'
                if (id.includes('/src/daa/TspBranchMockupLesson') || id.includes('/src/daa/tspBranchModel') || id.includes('/src/daa/tsp-branch-mockup.css'))
                  return 'tsp-branch-mockup'
                if (id.includes('/src/daa/fifoKnapsackModel') || id.includes('/src/daa/bestFirstKnapsackModel')) return 'knapsack-search-model'
                if (id.includes('/src/daa/BestFirstKnapsackMockupLesson') || id.includes('/src/daa/best-first-knapsack-mockup.css'))
                  return 'best-first-knapsack-mockup'
                if (id.includes('/src/daa/FifoKnapsackMockupLesson') || id.includes('/src/daa/fifo-knapsack-mockup.css')) return 'fifo-knapsack-mockup'
                if (
                  id.includes('/src/daa/DivideConquerMockupLesson') ||
                  id.includes('/src/daa/divideConquerModel') ||
                  id.includes('/src/daa/divide-conquer-mockup.css')
                )
                  return 'divide-conquer-mockup'
                if (id.includes('/src/daa/AsymptoticMockupLesson') || id.includes('/src/daa/asymptoticModel') || id.includes('/src/daa/asymptotic-mockup.css'))
                  return 'asymptotic-mockup'
                if (id.includes('/src/daa/CaseSpaceMockupLesson') || id.includes('/src/daa/caseSpaceModel') || id.includes('/src/daa/case-space-mockup.css'))
                  return 'case-space-mockup'
                if (
                  id.includes('/src/daa/LoopRecursionMockupLesson') ||
                  id.includes('/src/daa/loopRecursionModel') ||
                  id.includes('/src/daa/loop-recursion-mockup.css')
                )
                  return 'loop-recursion-mockup'
                if (
                  id.includes('/src/daa/SubstitutionMockupLesson') ||
                  id.includes('/src/daa/substitutionModel') ||
                  id.includes('/src/daa/substitution-mockup.css')
                )
                  return 'substitution-mockup'
                if (
                  id.includes('/src/daa/RecursionTreeMockupLesson') ||
                  id.includes('/src/daa/recursionTreeModel') ||
                  id.includes('/src/daa/recursion-tree-mockup.css')
                )
                  return 'recursion-tree-mockup'
                if (
                  id.includes('/src/daa/MasterTheoremMockupLesson') ||
                  id.includes('/src/daa/masterTheoremModel') ||
                  id.includes('/src/daa/master-theorem-mockup.css')
                )
                  return 'master-theorem-mockup'
                if (id.includes('/src/daa/InvariantMockupLesson') || id.includes('/src/daa/invariantModel') || id.includes('/src/daa/invariant-mockup.css'))
                  return 'invariant-mockup'
                if (
                  id.includes('/src/daa/GreedyExchangeMockupLesson') ||
                  id.includes('/src/daa/greedyExchangeModel') ||
                  id.includes('/src/daa/greedy-exchange-mockup.css')
                )
                  return 'greedy-exchange-mockup'
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
