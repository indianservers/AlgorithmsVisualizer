export type TargetSceneKind =
  | 'growth'
  | 'amortized'
  | 'maximum-subarray'
  | 'flow'
  | 'inversions'
  | 'fft'
  | 'bin-packing'
  | 'approximation'
  | 'complexity'
  | 'tree'
  | 'linear-programming'
  | 'trace'
export type TargetProfile = { number: number; scene: TargetSceneKind; eyebrow: string; panels: [string, string, string] }
const p = (number: number, scene: TargetSceneKind, eyebrow: string, panels: [string, string, string]): TargetProfile => ({ number, scene, eyebrow, panels })

export const targetProfiles: Record<string, TargetProfile> = {
  'asymptotic-notation': p(3, 'growth', 'Growth rate laboratory', ['Function classes', 'Worked bound', 'Notation reference']),
  'case-time-space-analysis': p(4, 'trace', 'Complexity case analyzer', ['Case comparison', 'Operation counter', 'Space accounting']),
  'loop-recursion-analysis': p(5, 'trace', 'Execution counter', ['Loop expansion', 'Call stack', 'Cost derivation']),
  'recurrence-substitution': p(6, 'tree', 'Substitution proof builder', ['Inductive guess', 'Expansion steps', 'Boundary condition']),
  'recursion-tree': p(7, 'tree', 'Recursion tree explorer', ['Level cost', 'Tree depth', 'Total work']),
  'master-theorem': p(8, 'tree', 'Master theorem classifier', ['Compare f(n)', 'Applicable case', 'Asymptotic result']),
  'correctness-proofs': p(9, 'trace', 'Invariant proof studio', ['Initialization', 'Maintenance', 'Termination']),
  'greedy-exchange': p(10, 'trace', 'Greedy exchange demonstration', ['Greedy choice', 'Exchange argument', 'Optimal structure']),
  'amortized-analysis': p(11, 'amortized', 'Dynamic array resizing visualizer', ['Accounting method', 'Potential method', 'Aggregate chart']),
  'algorithm-foundations': p(12, 'trace', 'Pseudocode execution studio', ['Editor', 'Execution trace', 'Cost model']),
  'divide-min-max': p(13, 'trace', 'Recursive min/max explorer', ['Recursive split', 'Pair comparison', 'Combined answer']),
  'maximum-subarray': p(14, 'maximum-subarray', 'Divide-and-conquer comparison', ['Three candidate cases', 'Recursion tree', 'Midpoint crossing']),
  strassen: p(15, 'trace', 'Strassen matrix workspace', ['Input quadrants', 'Seven products', 'Recombined product']),
  quickselect: p(16, 'trace', 'Order-statistic partitioner', ['Pivot choice', 'Three-way partition', 'Selected rank']),
  'deterministic-selection': p(17, 'trace', 'Median-of-medians workspace', ['Groups of five', 'Median pivot', 'Guaranteed partition']),
  'divide-conquer-method': p(18, 'tree', 'Recurrence design builder', ['Divide', 'Conquer', 'Combine']),
  'knapsack-fifo': p(19, 'tree', 'FIFO branch-and-bound search', ['Live queue', 'Search tree', 'Incumbent and bound']),
  'knapsack-best-first': p(20, 'tree', 'Best-first branch-and-bound search', ['Priority queue', 'Search tree', 'Incumbent and bound']),
  'tsp-branch-and-bound': p(21, 'tree', 'TSP state-space search', ['Candidate tour', 'Lower bounds', 'Pruned branches']),
  'branch-bound-method': p(22, 'tree', 'Bounding method laboratory', ['Live frontier', 'Optimistic bound', 'Safe pruning']),
  'p-np-classes': p(23, 'complexity', 'Complexity-class explorer', ['Classify a problem', 'Certificate examples', 'Reduction map']),
  'certificates-reductions': p(24, 'complexity', 'Certificate verifier', ['Decision instance', 'Witness check', 'Reduction contract']),
  'three-sat-clique-reduction': p(25, 'complexity', '3-SAT to Clique reduction', ['Formula clauses', 'Construction graph', 'Iff proof']),
  'clique-vertex-cover-reduction': p(26, 'complexity', 'Clique to Vertex Cover reduction', ['Input graph', 'Complement relation', 'Certificate mapping']),
  'cook-levin': p(27, 'complexity', 'Computation tableau', ['Machine configuration', 'Local constraints', 'SAT encoding']),
  'edmonds-karp': p(28, 'flow', 'Residual-network laboratory', ['Flow and residual graphs', 'Augmenting path', 'Max-flow / min-cut']),
  'bipartite-matching': p(29, 'trace', 'Augmenting-path matcher', ['Bipartition', 'Alternating path', 'Current matching']),
  bridges: p(30, 'trace', 'Low-link bridge finder', ['DFS tree', 'Discovery / low', 'Bridge criterion']),
  'articulation-points': p(31, 'trace', 'Cut-vertex explorer', ['DFS tree', 'Root condition', 'Non-root condition']),
  'eulerian-trail': p(32, 'trace', 'Hierholzer trail builder', ['Degree check', 'Edge stack', 'Eulerian trail']),
  'counting-inversions': p(33, 'inversions', 'Merge-and-count workspace', ['Sorted halves', 'Inversion ledger', 'Merge state']),
  'closest-pair': p(34, 'trace', 'Closest-pair strip explorer', ['Plane split', 'Midpoint strip', 'Closest pair']),
  karatsuba: p(35, 'trace', 'Karatsuba product builder', ['High / low split', 'Three products', 'Recombination']),
  'randomized-quicksort': p(36, 'trace', 'Seeded quicksort explorer', ['Random pivot', 'Partition state', 'Recursion trace']),
  'randomized-selection': p(37, 'trace', 'Seeded selection explorer', ['Random pivot', 'Rank comparison', 'Selected value']),
  'vertex-cover-approximation': p(38, 'approximation', '2-approximation graph', ['Maximal matching', 'Selected endpoints', 'Guarantee check']),
  'metric-tsp-approximation': p(39, 'approximation', 'Metric TSP approximation', ['Minimum spanning tree', 'Preorder shortcut', 'Tour guarantee']),
  'boyer-moore': p(40, 'trace', 'Bad-character matcher', ['Rightmost table', 'Pattern alignment', 'Safe shift']),
  'suffix-array': p(41, 'trace', 'Suffix ordering laboratory', ['Generated suffixes', 'Lexicographic sort', 'Suffix array']),
  'reliability-design': p(42, 'trace', 'Reliability design DP', ['Component choices', 'Budget table', 'Best reliability']),
  fft: p(43, 'fft', 'Radix-2 FFT laboratory', ['Time and frequency', 'Butterfly network', 'Twiddle factors']),
  'bin-packing': p(44, 'bin-packing', 'First Fit Decreasing packer', ['Sorted items', 'Bin placement', 'Capacity audit']),
  'expected-analysis': p(45, 'trace', 'Random-variable laboratory', ['Outcome space', 'Expectation', 'Indicator variables']),
  'linear-programming': p(46, 'linear-programming', 'Feasible-region explorer', ['Constraint geometry', 'Corner points', 'Optimal objective']),
  'approximation-method': p(47, 'approximation', 'Approximation guarantee studio', ['Approximation ratio', 'Feasible solution', 'Worst-case proof']),
}
export const getTargetProfile = (id: string) => targetProfiles[id]
