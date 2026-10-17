import type { DaaInput } from '../daa/types'
type DPProfile = {
  state: string
  recurrence: string
  base: string
  order: string
  insight: string
  pitfall: string
  optimization: string
  examples: { name: string; input: DaaInput }[]
}
export const dpProfiles: Record<string, DPProfile> = {
  'fibonacci-tabulation': {
    state: 'F[i] is the ith Fibonacci number.',
    recurrence: 'F[i] = F[i−1] + F[i−2]',
    base: 'F[0] = 0; F[1] = 1 when n ≥ 1.',
    order: 'Fill i from 2 through n; both predecessors already exist.',
    insight: 'The exponentially branching recursive problem collapses to n+1 distinct states.',
    pitfall: 'An uncomputed cell is not a zero. This table leaves future states blank until evaluated.',
    optimization: 'Keep two previous values for O(1) auxiliary space. Retain the table when you need to inspect every state.',
    examples: [
      { name: 'F(8) = 21', input: { n: 8 } },
      { name: 'Empty recurrence: F(0)', input: { n: 0 } },
      { name: 'Longer dependency chain', input: { n: 12 } },
    ],
  },
  'fibonacci-memoization': {
    state: 'memo[i] caches F(i) after its first evaluation.',
    recurrence: 'solve(i) = cached(i) or solve(i−1) + solve(i−2)',
    base: 'Cache F(0)=0 and, when needed, F(1)=1.',
    order: 'Calls descend to base cases; results return up the visible call stack.',
    insight: 'A cache hit returns immediately. Compare cache reuse with computing a state for the first time.',
    pitfall: 'Memoization does not eliminate recursion depth. Its call stack still uses O(n) space.',
    optimization: 'Tabulation removes the recursive call stack. A two-value loop also removes the memo table.',
    examples: [
      { name: 'Cache reuse at n=8', input: { n: 8 } },
      { name: 'Base case n=1', input: { n: 1 } },
      { name: 'Small call stack n=5', input: { n: 5 } },
    ],
  },
  'coin-change': {
    state: 'dp[a] is the fewest coins that sum exactly to amount a.',
    recurrence: 'dp[a] = min(1 + dp[a−coin]) over coin ≤ a',
    base: 'dp[0]=0; impossible amounts have value ∞.',
    order: 'Increasing amounts ensure each a−coin is already solved.',
    insight: 'Removing the last coin exposes a smaller optimal subproblem. Traceback follows each selected last coin.',
    pitfall: 'Greedy can fail: with [1,3,4], amount 6 uses [3,3], not [4,1,1]. Coins may be reused here.',
    optimization: 'Store one value and one chosen coin per amount; an entire coin-by-amount matrix is unnecessary.',
    examples: [
      { name: 'Greedy counterexample', input: { values: [1, 3, 4], amount: 6 } },
      { name: 'Unreachable odd amount', input: { values: [2, 4], amount: 7 } },
      { name: 'Amount zero', input: { values: [2, 5], amount: 0 } },
    ],
  },
  'zero-one-knapsack': {
    state: 'dp[i,c] is maximum profit using only the first i items within capacity c.',
    recurrence: 'max(dp[i−1,c], profit[i−1] + dp[i−1,c−weight[i−1]])',
    base: 'No items gives profit 0. Positive weights cannot fit in capacity 0.',
    order: 'Fill items row by row; every choice reads the previous item row.',
    insight: 'Each item is either excluded or included once. The traceback recovers the chosen item indices.',
    pitfall: 'Using the current row in the include transition would allow the same item repeatedly.',
    optimization: 'A one-dimensional table works if capacities run downward. Keep choices or the full table for reconstruction.',
    examples: [
      { name: 'Capacity 5 → profit 7', input: { weights: [2, 3, 4, 5], profits: [3, 4, 5, 6], capacity: 5 } },
      { name: 'Every item too heavy', input: { weights: [3, 4], profits: [7, 9], capacity: 2 } },
      { name: 'Zero capacity', input: { weights: [1, 2], profits: [2, 3], capacity: 0 } },
    ],
  },
  'longest-common-subsequence': {
    state: 'L[i,j] is the LCS length for the first i left-string and j right-string characters.',
    recurrence: 'Match: L[i−1,j−1]+1; mismatch: max(L[i−1,j], L[i,j−1])',
    base: 'An empty prefix has common subsequence length 0.',
    order: 'Fill rows from top to bottom and columns left to right.',
    insight: 'A match extends a diagonal solution. A mismatch excludes at least one final character.',
    pitfall: 'A subsequence may skip characters. It need not be contiguous, and multiple optimal subsequences may exist.',
    optimization: 'Two rows suffice for length alone. Full-table traceback, or a more advanced divide-and-conquer technique, recovers a sequence.',
    examples: [
      { name: 'Multiple optimal answers', input: { left: 'ABCBDAB', right: 'BDCABA' } },
      { name: 'A short diagonal', input: { left: 'ABC', right: 'AC' } },
      { name: 'Empty left string', input: { left: '', right: 'ABC' } },
    ],
  },
  'edit-distance': {
    state: 'E[i,j] is the minimum edit cost to turn the first i source characters into the first j target characters.',
    recurrence: 'min(E[i−1,j]+1, E[i,j−1]+1, E[i−1,j−1]+matchCost)',
    base: 'E[i,0]=i deletions; E[0,j]=j insertions.',
    order: 'Each cell reads above, left, and upper-left.',
    insight: 'Every optimal edit script ends in a deletion, insertion, replacement or free match.',
    pitfall: 'This lesson uses unit-cost edits and UTF-16 code units. Reversing source and target changes operation descriptions.',
    optimization: 'Two rows suffice for distance alone. Retain parents or the table when an edit script is required.',
    examples: [
      { name: 'kitten → sitting', input: { left: 'kitten', right: 'sitting' } },
      { name: 'Already equal', input: { left: 'CODE', right: 'CODE' } },
      { name: 'Only insertions', input: { left: '', right: 'abc' } },
    ],
  },
  'matrix-chain-multiplication': {
    state: 'M[i,j] is the cheapest scalar-operation cost for multiplying matrices Ai…Aj.',
    recurrence: 'min over k: M[i,k] + M[k+1,j] + p[i]p[k+1]p[j+1]',
    base: 'A single matrix costs 0 multiplications.',
    order: 'Fill the upper triangle by increasing chain length.',
    insight: 'Choose the final multiplication first, then solve its two independent subchains optimally.',
    pitfall: 'Parentheses may change; matrix order may not. Matrix multiplication is not commutative.',
    optimization: 'Store a split table to reconstruct parentheses. Arbitrary chains do not justify the two-row optimization used for string DP.',
    examples: [
      { name: '4500 versus 27000', input: { dimensions: [10, 30, 5, 60] } },
      { name: 'One matrix: zero cost', input: { dimensions: [5, 9] } },
      { name: 'Different optimal split', input: { dimensions: [40, 20, 30, 10, 30] } },
    ],
  },
  'optimal-bst': {
    state: 'C[i,j] is minimum weighted search cost for ordered keys i…j, including unsuccessful gaps.',
    recurrence: 'min root r: C[i,r−1] + C[r+1,j] + interval weight',
    base: 'An empty interval contributes its unsuccessful-search frequency q[i].',
    order: 'Fill intervals by increasing length; try every root within an interval.',
    insight: 'Moving a subtree down one level adds its total frequency weight. Popular keys tend to benefit from shallow positions.',
    pitfall: 'The keys remain sorted in inorder. Frequency values choose the shape, not a new key order.',
    optimization: 'Prefix sums make interval weights O(1). Specialized optimizations need their own proven assumptions.',
    examples: [
      { name: 'Successful searches', input: { frequencies: [34, 8, 50], unsuccessful: [0, 0, 0, 0] } },
      { name: 'Include failed searches', input: { frequencies: [3, 2, 4], unsuccessful: [1, 2, 1, 1] } },
      { name: 'Single key + gaps', input: { frequencies: [5], unsuccessful: [2, 3] } },
    ],
  },
  'multistage-shortest-path': {
    state: 'dist[v] is the cheapest known source-to-v path; vertices are processed in topological order.',
    recurrence: 'dist[v] = min(dist[v], dist[u] + weight(u,v))',
    base: 'Source distance is 0; all other vertices start at ∞.',
    order: 'A topological ordering ensures all incoming paths are considered before processing outgoing edges.',
    insight: 'Negative weights are safe because there are no cycles. The parent array reconstructs a path to any reachable vertex.',
    pitfall: 'A directed cycle invalidates the dependency order. Vertex numbers do not themselves define a topological order.',
    optimization: 'Adjacency lists make topological sorting and relaxation O(V+E). This teaching engine scans an edge list.',
    examples: [
      {
        name: 'Negative edge in a DAG',
        input: {
          vertices: 4,
          source: 0,
          directed: true,
          edges: [
            { from: 0, to: 1, weight: 2 },
            { from: 0, to: 2, weight: 5 },
            { from: 1, to: 2, weight: -4 },
            { from: 2, to: 3, weight: 3 },
          ],
        },
      },
      {
        name: 'Unreachable final vertex',
        input: {
          vertices: 4,
          source: 0,
          directed: true,
          edges: [
            { from: 0, to: 1, weight: 2 },
            { from: 1, to: 2, weight: 1 },
          ],
        },
      },
    ],
  },
  'held-karp-tsp': {
    state: 'D[S,v] is the cheapest path from the source that visits exactly set S and ends at v.',
    recurrence: 'D[S∪{v},v] = min(D[S∪{v},v], D[S,u] + weight(u,v))',
    base: 'Only the source-only subset at the source has cost 0.',
    order: 'Extend finite states to an unvisited vertex, then close a full-set path back to the source.',
    insight: 'A visited set and an endpoint together determine which future choices remain possible.',
    pitfall: 'A shortest partial path is not a full tour. The closing edge must exist and its weight must be included.',
    optimization: 'Subset layers can reduce retained states, but exact TSP still needs exponential work. The editor caps this lesson at six vertices.',
    examples: [
      {
        name: 'Triangle tour',
        input: {
          vertices: 3,
          source: 0,
          directed: false,
          edges: [
            { from: 0, to: 1, weight: 2 },
            { from: 1, to: 2, weight: 3 },
            { from: 0, to: 2, weight: 4 },
          ],
        },
      },
      {
        name: 'No return edge',
        input: {
          vertices: 3,
          source: 0,
          directed: true,
          edges: [
            { from: 0, to: 1, weight: 2 },
            { from: 1, to: 2, weight: 3 },
          ],
        },
      },
    ],
  },
  'prefix-sum': {
    state: 'P[i] is the sum of the first i array elements.',
    recurrence: 'P[i+1] = P[i] + A[i]; sum(l,r) = P[r+1] − P[l]',
    base: 'P[0]=0 for the empty prefix.',
    order: 'Scan left to right, then subtract two completed prefix states.',
    insight: 'The prefix through r includes the requested range plus everything before l. Subtract that unwanted prefix.',
    pitfall: 'P has n+1 cells; the right endpoint uses r+1. Negative values are valid.',
    optimization: 'O(n) preprocessing gives O(1) queries. Frequent point updates are better served by Fenwick or segment trees.',
    examples: [
      { name: 'Mixed signs', input: { values: [2, -1, 3, 4, -2], range: [1, 3] } },
      { name: 'Single-element query', input: { values: [5, -2, 7], range: [1, 1] } },
    ],
  },
  'difference-array': {
    state: 'D[i] records the change in value from position i−1 to i.',
    recurrence: 'D[l] += delta; D[r+1] −= delta; A[i] = A[i−1] + D[i]',
    base: 'D[0]=A[0]. The extra final slot is a boundary sentinel, not an array element.',
    order: 'Mark two endpoints, then scan differences to recover the updated array.',
    insight: 'Starting and stopping a persistent addition avoids touching every element for every range update.',
    pitfall: 'Do not forget the stop marker at r+1, including when r is the last real array position.',
    optimization: 'Batch updates cost O(1) each plus one O(n) reconstruction. Interleaved queries need a different structure.',
    examples: [
      { name: 'Add 5 to the middle', input: { values: [2, 4, 6, 8, 10], range: [1, 3], delta: 5 } },
      { name: 'Subtract over full array', input: { values: [3, 1, 4], range: [0, 2], delta: -2 } },
    ],
  },
  'prefix-sum-2d': {
    state: 'P[r,c] sums the rectangle of original rows < r and columns < c.',
    recurrence: 'P[r,c] = A[r−1,c−1] + P[r−1,c] + P[r,c−1] − P[r−1,c−1]',
    base: 'The padded row 0 and column 0 contain zeros.',
    order: 'Fill each row left to right, then move down.',
    insight: 'Above and left overlap in the diagonal rectangle. Subtract that overlap once.',
    pitfall: 'Rectangle queries use four prefix corners and inclusive original coordinates. Padding prevents negative indices.',
    optimization: 'O(RC) preprocessing gives O(1) rectangle sums; a dynamic grid requires a different data structure.',
    examples: [
      {
        name: 'Last two columns',
        input: {
          a: [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9],
          ],
          range: [0, 1, 2, 2],
        },
      },
      {
        name: 'Single cell',
        input: {
          a: [
            [2, -1],
            [3, 5],
          ],
          range: [1, 1, 1, 1],
        },
      },
    ],
  },
}
