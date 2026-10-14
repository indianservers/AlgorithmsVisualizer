import type { AlgorithmModule } from '../types'
import { daaLessons } from './catalog'
export type TopicMapping = { topic: string; pages: string[]; limitation?: string }
export const conceptTopics: TopicMapping[] = daaLessons.map((lesson) => ({ topic: lesson.title, pages: [lesson.id] }))

export function coverageFor(topic: TopicMapping, modules: AlgorithmModule[]): 'complete' | 'partial' | 'missing' {
  if (!topic.pages.length || topic.pages.every((id) => !modules.some((m) => m.id === id))) return 'missing'
  if (topic.limitation || topic.pages.some((id) => modules.find((m) => m.id === id)?.coverage !== 'complete')) return 'partial'
  return 'complete'
}

export const suiteLinks: Record<string, string[]> = {
  'graph-shortest-paths-suite': ['dijkstra', 'bellman-ford', 'floyd-warshall'],
  'graph-mst-suite': ['prim', 'kruskal'],
  'topological-sort-suite': ['kahn-topological-sort'],
  'strongly-connected-components': ['kosaraju-scc'],
  'dynamic-programming-suite': [
    'fibonacci-memoization',
    'fibonacci-tabulation',
    'coin-change',
    'zero-one-knapsack',
    'longest-common-subsequence',
    'edit-distance',
    'matrix-chain-multiplication',
    'optimal-bst',
    'held-karp-tsp',
  ],
  'greedy-suite': ['activity-selection', 'fractional-knapsack', 'job-sequencing', 'huffman-coding'],
  'backtracking-suite': ['n-queens', 'sum-of-subsets', 'graph-coloring', 'hamiltonian-cycle'],
  'string-pattern-matching-suite': ['naive-string-matching', 'kmp', 'rabin-karp', 'boyer-moore'],
  'advanced-string-structures': ['suffix-array'],
  'advanced-graph-suite': ['bridges', 'articulation-points', 'eulerian-trail', 'edmonds-karp', 'bipartite-matching'],
  'divide-and-conquer-suite': ['divide-min-max', 'maximum-subarray', 'strassen', 'quickselect', 'deterministic-selection'],
  'complexity-lab': ['asymptotic-notation', 'case-time-space-analysis', 'loop-recursion-analysis', 'amortized-analysis'],
  'disjoint-set-union': ['dsu-union-find'],
}
