export type ComplexityClass = 'P' | 'NP' | 'NP-Hard' | 'NP-Complete'
export type ComplexityProblem = {
  id: string
  name: string
  badge: ComplexityClass
  description: string
  membership: string
  hardness: string
  applications: string
  kind: 'decision' | 'optimization'
}
export const complexityProblems: ComplexityProblem[] = [
  {
    id: 'sat',
    name: 'SAT (Boolean Satisfiability)',
    badge: 'NP-Complete',
    kind: 'decision',
    description: 'Given a Boolean formula φ, does any assignment make it true?',
    membership: 'An assignment uses one bit per variable; checking the formula takes polynomial time in its size.',
    hardness: 'Every NP language reduces to SAT in polynomial time (Cook–Levin).',
    applications: 'NP-completeness proofs, verification, planning and scheduling.',
  },
  {
    id: 'tsp-decision',
    name: 'TSP (Decision: tour cost ≤ k?)',
    badge: 'NP-Complete',
    kind: 'decision',
    description: 'Given a weighted complete graph and a threshold k, is there a closed tour of total cost at most k?',
    membership: 'A city permutation is a short certificate. Check every city once, the return edge and the total cost.',
    hardness: 'Hamiltonian Cycle reduces to TSP decision: original edges cost 1, missing edges cost 2, threshold n.',
    applications: 'Threshold feasibility for routing and scheduling; distinct from asking for an optimal tour.',
  },
  {
    id: 'tsp-optimization',
    name: 'TSP (Optimization: min tour)',
    badge: 'NP-Hard',
    kind: 'optimization',
    description: 'Find a minimum-cost closed tour that visits every city exactly once.',
    membership: 'NP is a class of decision languages. This optimization task is not itself a yes/no language.',
    hardness: 'An exact optimizer would solve TSP decision by comparing its optimum with k.',
    applications: 'Vehicle routing and logistics. A tour cost is checkable; optimality is a separate claim.',
  },
  {
    id: 'vertex-cover',
    name: 'Vertex Cover (Decision)',
    badge: 'NP-Complete',
    kind: 'decision',
    description: 'Given a graph G and k, is there a vertex cover using at most k vertices?',
    membership: 'List at most k distinct vertices and check that every edge has a selected endpoint.',
    hardness: 'CLIQUE reduces through the complement graph: a k-clique corresponds to a cover of size n−k.',
    applications: 'Covering constraints, monitoring and reductions between graph problems.',
  },
  {
    id: 'connectivity',
    name: 'Graph Connectivity',
    badge: 'P',
    kind: 'decision',
    description: 'Given an undirected graph, is every vertex reachable from a chosen start?',
    membership: 'BFS or DFS decides it in O(V+E). Every problem in P is also in NP; a verifier can run the solver.',
    hardness: 'No NP-hardness claim is made. NP-hardness for this P language would imply P = NP.',
    applications: 'Network reachability, connected components and graph preprocessing.',
  },
  {
    id: 'factor',
    name: 'Integer Factorization (Decision)',
    badge: 'NP',
    kind: 'decision',
    description: 'Given N and k in binary, does N have a factor d with 1 < d < N and d ≤ k?',
    membership: 'A candidate factor is short in binary; verify the range and divisibility in polynomial time.',
    hardness: 'Verifying a factor proves NP membership, not NP-hardness. This example is not classified as NP-complete.',
    applications: 'Number theory and cryptography. Polynomial-time classical solvability is not known.',
  },
]
export type Cnf = number[][]
export function parseComplexityCnf(text: string): Cnf {
  if (!text.trim()) throw new Error('Enter 1–12 nonempty clauses. Use signed variable numbers 1–8; separate clauses with semicolons.')
  const rows = text.replace(/[()]/g, '').split(/[;&\n]/)
  if (rows.length > 12 || rows.some((row) => !row.trim())) throw new Error('Use 1–12 nonempty clauses; do not leave an empty clause or trailing separator.')
  return rows.map((row) => {
    const words = row.trim().split(/[\s,∨|]+/)
    if (words.length > 8 || words.some((word) => !/^-?[1-8]$/.test(word)))
      throw new Error('Each clause must have 1–8 signed literals from −8 to 8, excluding 0.')
    return words.map(Number)
  })
}
export const satVariableCount = (clauses: Cnf) => Math.max(0, ...clauses.flat().map(Math.abs))
export const formatCnf = (clauses: Cnf) =>
  clauses
    .map((row) => `(${row.map((lit) => `${lit < 0 ? '¬' : ''}x${String(Math.abs(lit)).replace(/[0-9]/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[Number(d)])}`).join(' ∨ ')})`)
    .join(' ∧ ')
export function verifyComplexitySat(clauses: Cnf, assignment: boolean[]) {
  const n = satVariableCount(clauses),
    wellFormed = assignment.length === n && assignment.every((v) => typeof v === 'boolean')
  const checks = clauses.map((row, index) => ({ index, satisfied: wellFormed && row.some((lit) => (lit > 0 ? assignment[lit - 1] : !assignment[-lit - 1])) }))
  return { valid: wellFormed && checks.every((c) => c.satisfied), wellFormed, checks, variables: n, literals: clauses.flat().length }
}
export function searchComplexitySat(clauses: Cnf) {
  const n = satVariableCount(clauses),
    total = 2 ** n
  if (n > 8) throw new Error('The teaching search supports at most 8 variables.')
  for (let mask = 0; mask < total; mask++) {
    const assignment = Array.from({ length: n }, (_, i) => Boolean(mask & (1 << i)))
    if (verifyComplexitySat(clauses, assignment).valid) return { found: true, assignment, tried: mask + 1, total }
  }
  return { found: false, assignment: [] as boolean[], tried: total, total }
}
export type CertificateGraph = { n: number; edges: [number, number][] }
export const certificateGraph: CertificateGraph = {
  n: 4,
  edges: [
    [0, 1],
    [0, 2],
    [1, 2],
    [2, 3],
  ],
}
export const certificateMatrix = [
  [0, 10, 15, 20],
  [10, 0, 35, 25],
  [15, 35, 0, 30],
  [20, 25, 30, 0],
]
export function parseCertificateGraph(nText: string, edgeText: string): CertificateGraph {
  const n = Number(nText)
  if (!nText.trim() || !Number.isInteger(n) || n < 1 || n > 8) throw new Error('Use 1–8 graph vertices.')
  const edges: [number, number][] = [],
    seen = new Set<string>()
  if (edgeText.trim())
    for (const word of edgeText.trim().split(/[,;\n]+/)) {
      const match = word.trim().match(/^(\d+)\s*[-:]\s*(\d+)$/)
      if (!match) throw new Error('Write edges as 1-2, 2-3, using vertex IDs from 1 to n.')
      const a = Number(match[1]) - 1,
        b = Number(match[2]) - 1
      if (a < 0 || a >= n || b < 0 || b >= n || a === b) throw new Error('Edge endpoints must be different vertices from 1 to n.')
      const key = [a, b].sort((x, y) => x - y).join('-')
      if (!seen.has(key)) {
        edges.push(a < b ? [a, b] : [b, a])
        seen.add(key)
      }
    }
  return { n, edges }
}
export function parseCertificateIds(text: string): number[] {
  if (!text.trim()) return []
  const words = text.trim().split(/[\s,→-]+/)
  if (words.some((word) => !/^\d+$/.test(word) || Number(word) < 1 || Number(word) > 99)) throw new Error('Certificate IDs must be integers from 1 to 99.')
  return words.map((word) => Number(word) - 1)
}
const validVertices = (graph: CertificateGraph, vertices: number[]) =>
  vertices.every((v) => Number.isInteger(v) && v >= 0 && v < graph.n) && new Set(vertices).size === vertices.length
export function verifyComplexityCover(graph: CertificateGraph, vertices: number[], k: number) {
  const uncovered = graph.edges.filter(([a, b]) => !vertices.includes(a) && !vertices.includes(b)),
    wellFormed = validVertices(graph, vertices) && Number.isInteger(k) && k >= 0
  return { valid: wellFormed && vertices.length <= k && uncovered.length === 0, wellFormed, uncovered }
}
export function verifyComplexityClique(graph: CertificateGraph, vertices: number[], k: number) {
  const wellFormed = validVertices(graph, vertices) && Number.isInteger(k) && k >= 0,
    missing: [number, number][] = []
  for (let i = 0; i < vertices.length; i++)
    for (let j = i + 1; j < vertices.length; j++)
      if (!graph.edges.some(([a, b]) => (a === vertices[i] && b === vertices[j]) || (a === vertices[j] && b === vertices[i])))
        missing.push([vertices[i], vertices[j]])
  return { valid: wellFormed && vertices.length >= k && missing.length === 0, wellFormed, missing }
}
export function parseCertificateMatrix(text: string): number[][] {
  const matrix = text
      .trim()
      .split(/\r?\n/)
      .map((row) =>
        row
          .trim()
          .split(/[\s,]+/)
          .map(Number),
      ),
    n = matrix.length
  if (!text.trim() || n > 6 || matrix.some((row) => row.length !== n)) throw new Error('Enter a square matrix for 1–6 cities.')
  if (matrix.some((row, i) => row.some((v, j) => !Number.isInteger(v) || v < 0 || v > 999 || (i === j && v !== 0) || v !== matrix[j][i])))
    throw new Error('Use symmetric distances 0–999, with zero on the diagonal.')
  return matrix
}
export function verifyComplexityTour(matrix: number[][], tour: number[], k: number) {
  const n = matrix.length,
    wellFormed =
      tour.length === n + 1 &&
      tour[0] === tour.at(-1) &&
      tour.every((v) => Number.isInteger(v) && v >= 0 && v < n) &&
      new Set(tour.slice(0, -1)).size === n &&
      Number.isInteger(k) &&
      k >= 0
  const cost = wellFormed ? tour.slice(1).reduce((sum, v, i) => sum + matrix[tour[i]][v], 0) : null
  return { valid: wellFormed && cost !== null && cost <= k, wellFormed, cost }
}
export function verifyComplexityFactor(nText: string, kText: string, dText: string) {
  const parse = (text: string) => {
    if (!/^\d{1,78}$/.test(text) || BigInt(text) >= 1n << 256n) throw new Error('Use non-negative decimal integers of at most 256 bits.')
    return BigInt(text)
  }
  const n = parse(nText),
    k = parse(kText),
    d = parse(dText)
  if (n < 2n) throw new Error('N must be at least 2.')
  return { valid: d > 1n && d < n && d <= k && n % d === 0n, bits: n.toString(2).length, n, k, d }
}
export const workedThreeSat: Cnf = [
  [1, -2, 3],
  [-1, 2, 3],
  [1, 2, -3],
]
export function buildComplexityReduction(clauses: Cnf, assignment: boolean[]) {
  if (clauses.some((row) => !row.length || row.length > 3)) throw new Error('This construction expects 3-CNF with 1–3 literals per clause.')
  const literals = clauses.flatMap((row, clause) => row.map((literal) => ({ clause, literal }))),
    edges: [number, number][] = [],
    complement: [number, number][] = []
  for (let a = 0; a < literals.length; a++)
    for (let b = a + 1; b < literals.length; b++) {
      if (literals[a].clause !== literals[b].clause && literals[a].literal !== -literals[b].literal) edges.push([a, b])
      else complement.push([a, b])
    }
  const chosen: number[] = []
  clauses.forEach((_, clause) => {
    const index = literals.findIndex((item) => item.clause === clause && (item.literal > 0 ? assignment[item.literal - 1] : !assignment[-item.literal - 1]))
    if (index >= 0) chosen.push(index)
  })
  const graph = { n: literals.length, edges },
    coverGraph = { n: literals.length, edges: complement },
    cover = literals.map((_, i) => i).filter((i) => !chosen.includes(i)),
    cliqueSize = clauses.length,
    coverBudget = literals.length - cliqueSize
  return {
    literals,
    graph,
    coverGraph,
    chosen,
    cover,
    cliqueSize,
    coverBudget,
    cliqueValid: verifyComplexityClique(graph, chosen, cliqueSize).valid,
    coverValid: verifyComplexityCover(coverGraph, cover, coverBudget).valid,
  }
}
