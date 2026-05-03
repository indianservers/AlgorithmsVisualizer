import type { AlgorithmCategory } from '../types'

export const categories: AlgorithmCategory[] = [
  'Sorting',
  'Searching',
  'Data Structures',
  'Graphs',
  'Dynamic Programming',
  'Strings',
  'Number Theory',
  'Backtracking',
  'Greedy',
  'Matrix / Grid',
]

export const categoryPages: Record<AlgorithmCategory, { slug: string; title: string; subtitle: string; accent: string; sections: string[] }> = {
  Searching: {
    slug: 'searching',
    title: 'Searching Algorithms',
    subtitle: 'Find targets, bounds, peaks, and positions with step-by-step pointer movement.',
    accent: '#ef6c3e',
    sections: ['Linear search', 'Binary search family', 'Bounds and occurrences', 'Rotated and peak search'],
  },
  Sorting: {
    slug: 'sorting',
    title: 'Sorting Algorithms',
    subtitle: 'Watch comparisons, swaps, partitions, merges, heaps, buckets, and gap passes.',
    accent: '#1673c7',
    sections: ['Elementary sorts', 'Divide and conquer', 'Heap and bucket sorts', 'Gap and bidirectional sorts'],
  },
  'Data Structures': {
    slug: 'data-structures',
    title: 'Data Structure Visualizations',
    subtitle: 'Inspect stacks, queues, tree traversal, node states, and structural operations.',
    accent: '#22a06b',
    sections: ['Linear structures', 'Trees', 'Traversal', 'Hash structures'],
  },
  Graphs: {
    slug: 'graphs',
    title: 'Graph Algorithms',
    subtitle: 'Explore node-edge diagrams, traversal order, shortest paths, and spanning trees.',
    accent: '#5865f2',
    sections: ['Traversal', 'Shortest paths', 'Minimum spanning tree', 'Graph generators'],
  },
  'Dynamic Programming': {
    slug: 'dynamic-programming',
    title: 'Dynamic Programming',
    subtitle: 'Build recurrence tables, dependency arrows, traceback paths, and memoized states.',
    accent: '#7c5bb0',
    sections: ['Memoization', 'Tabulation', 'Grid DP', 'String DP'],
  },
  Strings: {
    slug: 'strings',
    title: 'String Algorithms',
    subtitle: 'Visualize pattern matching, rolling hashes, prefixes, suffixes, and palindromes.',
    accent: '#0f9f9a',
    sections: ['Pattern search', 'Prefix functions', 'Rolling hash', 'Compression preview'],
  },
  'Number Theory': {
    slug: 'number-theory',
    title: 'Number Theory',
    subtitle: 'Learn gcd, modular arithmetic, primes, totients, and RSA-supporting math.',
    accent: '#2563eb',
    sections: ['GCD', 'Modular arithmetic', 'Prime tests', 'RSA math'],
  },
  Backtracking: {
    slug: 'backtracking',
    title: 'Backtracking',
    subtitle: 'Step through search trees, choices, constraints, dead ends, and undo operations.',
    accent: '#db2777',
    sections: ['Recursion tree', 'Constraint solving', 'Permutations', 'Grid puzzles'],
  },
  Greedy: {
    slug: 'greedy',
    title: 'Greedy Algorithms',
    subtitle: 'See local choices, exchange arguments, priority queues, and greedy-vs-DP tradeoffs.',
    accent: '#65a30d',
    sections: ['Scheduling', 'Knapsack', 'Coding trees', 'Greedy vs DP'],
  },
  'Matrix / Grid': {
    slug: 'matrix-grid',
    title: 'Matrix and Grid Algorithms',
    subtitle: 'Visualize cells, neighbors, paths, flood fill, mazes, and matrix transformations.',
    accent: '#0891b2',
    sections: ['Traversal', 'Maze search', 'Matrix operations', 'Cellular automata'],
  },
}
