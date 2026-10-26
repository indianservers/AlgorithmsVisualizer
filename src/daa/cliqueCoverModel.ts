import { parseCertificateGraph, verifyComplexityClique, verifyComplexityCover, type CertificateGraph } from './complexityClassesModel'
import { complementReductionGraph, exampleReductionGraph, remainingReductionVertices, smallReductionDecision } from './certificatesReductionModel'

export type CliqueCoverPreset = { id: string; name: string; graph: CertificateGraph; k: number; selected: number[] }
export const cliqueCoverPresets: CliqueCoverPreset[] = [
  { id: 'reference', name: 'Example 1: n = 6, k = 3', graph: exampleReductionGraph(), k: 3, selected: [0, 1, 2] },
  {
    id: 'triangle',
    name: 'Example 2: triangle, n = 3, k = 3',
    graph: {
      n: 3,
      edges: [
        [0, 1],
        [0, 2],
        [1, 2],
      ],
    },
    k: 3,
    selected: [0, 1, 2],
  },
  {
    id: 'path',
    name: 'Example 3: path, n = 4, k = 3',
    graph: {
      n: 4,
      edges: [
        [0, 1],
        [1, 2],
        [2, 3],
      ],
    },
    k: 3,
    selected: [0, 1, 2],
  },
  {
    id: 'complete',
    name: 'Example 4: complete, n = 4, k = 2',
    graph: {
      n: 4,
      edges: [
        [0, 1],
        [0, 2],
        [0, 3],
        [1, 2],
        [1, 3],
        [2, 3],
      ],
    },
    k: 2,
    selected: [0, 1],
  },
  { id: 'edgeless', name: 'Example 5: no edges, n = 4, k = 1', graph: { n: 4, edges: [] }, k: 1, selected: [0] },
]
export function cliqueCoverInstance(input: CertificateGraph, k: number, selected: number[]) {
  const graph = parseCertificateGraph(String(input.n), input.edges.map(([a, b]) => `${a + 1}-${b + 1}`).join(','))
  if (!Number.isInteger(k) || k < 0 || k > graph.n) throw new Error('Use an integer k from 0 to n.')
  const complement = complementReductionGraph(graph),
    targetK = graph.n - k,
    cover = remainingReductionVertices(graph.n, selected),
    clique = verifyComplexityClique(graph, selected, k),
    target = verifyComplexityCover(complement, cover, targetK),
    internal = complement.edges.filter(([a, b]) => selected.includes(a) && selected.includes(b)),
    pairs: { a: number; b: number; inG: boolean; inH: boolean; covered: boolean }[] = []
  for (let a = 0; a < graph.n; a++)
    for (let b = a + 1; b < graph.n; b++) {
      const inG = graph.edges.some(([u, v]) => (u === a && v === b) || (u === b && v === a))
      pairs.push({ a, b, inG, inH: !inG, covered: cover.includes(a) || cover.includes(b) })
    }
  return {
    graph,
    complement,
    k,
    targetK,
    selected: [...selected],
    cover,
    clique,
    target,
    internal,
    independent: clique.wellFormed && internal.length === 0,
    pairs,
    pairCount: (graph.n * (graph.n - 1)) / 2,
  }
}
export function toggleCliqueCoverEdge(graph: CertificateGraph, a: number, b: number) {
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || a >= graph.n || b < 0 || b >= graph.n || a === b)
    throw new Error('Choose two distinct vertices from the graph.')
  const exists = graph.edges.some(([u, v]) => (u === a && v === b) || (u === b && v === a)),
    edges = exists
      ? graph.edges.filter(([u, v]) => !((u === a && v === b) || (u === b && v === a)))
      : [...graph.edges, [Math.min(a, b), Math.max(a, b)] as [number, number]]
  return { n: graph.n, edges: edges.sort(([u, v], [x, y]) => u - x || v - y) }
}
export function decodeCliqueCover(graph: CertificateGraph, k: number, cover: number[]) {
  const complement = complementReductionGraph(graph),
    check = verifyComplexityCover(complement, cover, graph.n - k),
    selected = remainingReductionVertices(graph.n, cover)
  return { valid: check.valid && verifyComplexityClique(graph, selected, k).valid, selected, check }
}
export function searchCliqueCover(graph: CertificateGraph, k: number) {
  const source = smallReductionDecision('CLIQUE', graph, k),
    target = smallReductionDecision('VERTEX COVER', complementReductionGraph(graph), graph.n - k)
  return { source, target, total: 2 ** graph.n }
}
