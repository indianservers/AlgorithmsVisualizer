import {
  buildComplexityReduction,
  satVariableCount,
  verifyComplexityClique,
  verifyComplexityCover,
  verifyComplexitySat,
  workedThreeSat,
  type CertificateGraph,
  type Cnf,
} from './complexityClassesModel'

export type ReductionKind = 'clique-cover' | 'cover-clique' | 'sat-clique' | 'independent-clique'
export const reductionExamples: { id: ReductionKind; label: string; source: string; target: string; hint: string; mapping: string }[] = [
  { id: 'clique-cover', label: 'CLIQUE ≤ₚ VERTEX COVER', source: 'CLIQUE', target: 'VERTEX COVER', hint: 'Uses complement', mapping: 'G, k ↦ G̅, n − k' },
  { id: 'cover-clique', label: 'VERTEX COVER ≤ₚ CLIQUE', source: 'VERTEX COVER', target: 'CLIQUE', hint: 'Reverse direction', mapping: 'G, k ↦ G̅, n − k' },
  { id: 'sat-clique', label: '3-SAT ≤ₚ CLIQUE', source: '3-SAT', target: 'CLIQUE', hint: 'Literal construction', mapping: 'φ ↦ Gφ, m' },
  {
    id: 'independent-clique',
    label: 'INDEPENDENT SET ≤ₚ CLIQUE',
    source: 'INDEPENDENT SET',
    target: 'CLIQUE',
    hint: 'Complement graph',
    mapping: 'G, k ↦ G̅, k',
  },
]
export function exampleReductionGraph(n = 6): CertificateGraph {
  if (!Number.isInteger(n) || n < 1 || n > 8) throw new Error('Use 1–8 graph vertices.')
  const edges: [number, number][] = [
    [0, 1],
    [0, 2],
    [1, 2],
    [0, 4],
    [1, 3],
    [1, 4],
    [2, 3],
    [2, 4],
    [2, 5],
    [3, 4],
    [4, 5],
  ]
  for (let v = 6; v < n; v++) edges.push([1, v], [v - 1, v])
  return { n, edges: edges.filter(([a, b]) => a < n && b < n).sort(([a, b], [c, d]) => a - c || b - d) }
}
export function complementReductionGraph(graph: CertificateGraph): CertificateGraph {
  const edges: [number, number][] = []
  for (let a = 0; a < graph.n; a++)
    for (let b = a + 1; b < graph.n; b++) if (!graph.edges.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) edges.push([a, b])
  return { n: graph.n, edges }
}
export const remainingReductionVertices = (n: number, selected: number[]) => Array.from({ length: n }, (_, i) => i).filter((i) => !selected.includes(i))
export type CertificateCheck = { label: string; detail: string; valid: boolean }
export function checkReductionCertificate(kind: 'CLIQUE' | 'VERTEX COVER' | 'INDEPENDENT SET', graph: CertificateGraph, selected: number[], k: number) {
  const idsValid = selected.every((v) => Number.isInteger(v) && v >= 0 && v < graph.n) && new Set(selected).size === selected.length
  const pairs: [number, number][] = []
  for (let a = 0; a < selected.length; a++) for (let b = a + 1; b < selected.length; b++) pairs.push([selected[a], selected[b]])
  const checks: CertificateCheck[] = [
    {
      label: kind === 'VERTEX COVER' ? 'Check |C| ≤ k' : 'Check |S| ≥ k',
      detail: `${selected.length} ${kind === 'VERTEX COVER' ? '≤' : '≥'} ${k}`,
      valid: Number.isInteger(k) && k >= 0 && (kind === 'VERTEX COVER' ? selected.length <= k : selected.length >= k),
    },
  ]
  if (!idsValid) checks.unshift({ label: 'Check distinct, in-range vertex IDs', detail: 'Repeated or invalid ID', valid: false })
  if (kind === 'VERTEX COVER')
    for (const [a, b] of graph.edges)
      checks.push({
        label: `Cover edge (${a + 1}, ${b + 1})`,
        detail: selected.includes(a) || selected.includes(b) ? 'Covered' : 'Uncovered',
        valid: selected.includes(a) || selected.includes(b),
      })
  else
    for (const [a, b] of pairs) {
      const exists = graph.edges.some(([x, y]) => (x === a && y === b) || (x === b && y === a))
      checks.push({
        label: kind === 'CLIQUE' ? 'Check every pair has an edge' : 'Check every pair has no edge',
        detail: `(${a + 1},${b + 1}) ${exists ? '∈' : '∉'} E`,
        valid: kind === 'CLIQUE' ? exists : !exists,
      })
    }
  return { valid: idsValid && checks.every((c) => c.valid), checks }
}
export function buildReductionInstance(
  kind: ReductionKind,
  graph: CertificateGraph,
  k: number,
  sourceVertices: number[],
  clauses: Cnf = workedThreeSat,
  assignment: boolean[] = [true, false, true],
) {
  if (!Number.isInteger(k) || k < 0 || k > graph.n) throw new Error('Threshold k must be an integer from 0 to n.')
  const example = reductionExamples.find((e) => e.id === kind)!
  if (kind === 'sat-clique') {
    if (clauses.length > 3) throw new Error('This laboratory supports at most 3 clauses (up to 9 occurrence vertices).')
    const built = buildComplexityReduction(clauses, assignment),
      sat = verifyComplexitySat(clauses, assignment)
    return {
      example,
      sourceGraph: graph,
      targetGraph: built.graph,
      sourceK: clauses.length,
      targetK: clauses.length,
      sourceVertices: [],
      mappedVertices: built.chosen,
      sourceValid: sat.valid,
      sourceChecks: sat.checks.map((c) => ({ label: `Check clause ${c.index + 1}`, detail: c.satisfied ? 'True' : 'False', valid: c.satisfied })),
      literals: built.literals,
      sourceSize: satVariableCount(clauses),
    }
  }
  const sourceType = example.source as 'CLIQUE' | 'VERTEX COVER' | 'INDEPENDENT SET',
    source = checkReductionCertificate(sourceType, graph, sourceVertices, k)
  return {
    example,
    sourceGraph: graph,
    targetGraph: complementReductionGraph(graph),
    sourceK: k,
    targetK: kind === 'independent-clique' ? k : graph.n - k,
    sourceVertices,
    mappedVertices: kind === 'independent-clique' ? [...sourceVertices] : remainingReductionVertices(graph.n, sourceVertices),
    sourceValid: source.valid,
    sourceChecks: source.checks,
    literals: [],
    sourceSize: graph.n,
  }
}
export function reductionBackMap(kind: ReductionKind, graph: CertificateGraph, targetVertices: number[], clauses: Cnf = workedThreeSat) {
  if (kind === 'sat-clique') {
    const literals = clauses.flat(),
      assignment = Array<boolean>(satVariableCount(clauses)).fill(false)
    for (const id of targetVertices) {
      const literal = literals[id]
      if (literal !== undefined) assignment[Math.abs(literal) - 1] = literal > 0
    }
    return { vertices: [], assignment }
  }
  return { vertices: kind === 'independent-clique' ? [...targetVertices] : remainingReductionVertices(graph.n, targetVertices), assignment: [] }
}
export function smallReductionDecision(kind: 'CLIQUE' | 'VERTEX COVER' | 'INDEPENDENT SET', graph: CertificateGraph, k: number) {
  if (graph.n > 9) throw new Error('Exact classroom search is limited to 9 vertices.')
  let tried = 0
  for (let mask = 0; mask < 2 ** graph.n; mask++) {
    tried++
    const vertices = Array.from({ length: graph.n }, (_, i) => i).filter((i) => mask & (1 << i))
    const valid =
      kind === 'CLIQUE'
        ? verifyComplexityClique(graph, vertices, k).valid
        : kind === 'VERTEX COVER'
          ? verifyComplexityCover(graph, vertices, k).valid
          : checkReductionCertificate(kind, graph, vertices, k).valid
    if (valid) return { yes: true, witness: vertices, tried, total: 2 ** graph.n }
  }
  return { yes: false, witness: [] as number[], tried, total: 2 ** graph.n }
}
