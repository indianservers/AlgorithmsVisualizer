import { runVertexCoverLesson, parseCoverGraph, validateCoverGraph, isCover, type CoverGraph } from './vertexCoverLessonModel'
import { runMetricTspLesson, parseMetricInput, metricTspExample, tourCost, type MetricInput } from './metricTspLessonModel'
export type GuaranteeMode = 'cover' | 'max-cut' | 'metric-tsp'
export type GuaranteeFrame = {
  step: number
  phase: 0 | 1 | 2
  selected: number[]
  highlighted: number[]
  covered: boolean[]
  partition: number[]
  tour: number[]
  alg: number
  feasible: boolean
}
export const guaranteeGraph: CoverGraph = {
  vertices: 8,
  edges: [
    [0, 1],
    [2, 6],
    [3, 7],
    [2, 3],
    [0, 4],
    [1, 5],
    [5, 6],
    [6, 7],
    [0, 5],
    [1, 6],
    [3, 6],
  ],
}
export const guaranteeTsp = metricTspExample
export function parseGuaranteeOrder(text: string, edgeCount: number) {
  const ids = text.trim()
    ? text
        .trim()
        .split(/[,\s]+/)
        .map(Number)
    : []
  if (ids.some((id) => !Number.isInteger(id) || id < 0 || id >= edgeCount) || new Set(ids).size !== ids.length)
    throw new Error('Use distinct zero-based edge IDs from 0 to m−1.')
  return ids
}
export function parseGuaranteeInput(mode: GuaranteeMode, text: string) {
  return mode === 'metric-tsp' ? parseMetricInput(text) : parseCoverGraph(text)
}
export function runCutGuarantee(graph: CoverGraph) {
  validateCoverGraph(graph)
  const sides = Array<number>(graph.vertices).fill(-1),
    frames: GuaranteeFrame[] = [
      { step: 0, phase: 0, selected: [], highlighted: [], covered: graph.edges.map(() => false), partition: [...sides], tour: [], alg: 0, feasible: false },
    ],
    decisions: { vertex: number; neighborsA: number; neighborsB: number; side: number; gain: number }[] = []
  for (let vertex = 0; vertex < graph.vertices; vertex++) {
    let neighborsA = 0,
      neighborsB = 0
    for (const [u, v] of graph.edges) {
      const neighbor = u === vertex ? v : v === vertex ? u : -1
      if (neighbor >= 0) {
        if (sides[neighbor] === 0) neighborsA++
        if (sides[neighbor] === 1) neighborsB++
      }
    }
    const side = neighborsA > neighborsB ? 1 : 0,
      gain = Math.max(neighborsA, neighborsB)
    sides[vertex] = side
    decisions.push({ vertex, neighborsA, neighborsB, side, gain })
    const cut = graph.edges.flatMap(([u, v], i) => (sides[u] >= 0 && sides[v] >= 0 && sides[u] !== sides[v] ? [i] : []))
    frames.push({
      step: vertex + 1,
      phase: vertex === graph.vertices - 1 ? 2 : 0,
      selected: sides.flatMap((s, i) => (s === 1 ? [i] : [])),
      highlighted: cut,
      covered: graph.edges.map((_, i) => cut.includes(i)),
      partition: [...sides],
      tour: [],
      alg: cut.length,
      feasible: vertex === graph.vertices - 1,
    })
  }
  let optimum = 0,
    optimalSides = Array<number>(graph.vertices).fill(0)
  for (let mask = 0; mask < 2 ** graph.vertices; mask++) {
    const side = Array.from({ length: graph.vertices }, (_, v) => (mask >> v) & 1),
      cost = graph.edges.filter(([u, v]) => side[u] !== side[v]).length
    if (cost > optimum) {
      optimum = cost
      optimalSides = side
    }
  }
  return { frames, decisions, optimum, optimalSides }
}
export function runApproximationGuarantee(
  mode: GuaranteeMode,
  input: CoverGraph | MetricInput = mode === 'metric-tsp' ? guaranteeTsp : guaranteeGraph,
  prefix: number[] = [],
  reverse = false,
) {
  let graph: CoverGraph,
    frames: GuaranteeFrame[],
    optimum: number,
    optimalVertices: number[] = [],
    optimalTour: number[] = [],
    optimalSides: number[] = [],
    cover: ReturnType<typeof runVertexCoverLesson> | null = null,
    cut: ReturnType<typeof runCutGuarantee> | null = null,
    tsp: ReturnType<typeof runMetricTspLesson> | null = null,
    weights: number[],
    positions: [number, number][]
  if (mode === 'metric-tsp') {
    tsp = runMetricTspLesson(input as MetricInput, reverse)
    graph = { vertices: tsp.graph.points.length, edges: tsp.edges.map((e) => [e.u, e.v]) }
    weights = tsp.edges.map((e) => e.weight)
    optimum = tsp.optimum.cost
    optimalTour = tsp.optimum.tour
    const xs = tsp.graph.points.map((p) => p[0]),
      ys = tsp.graph.points.map((p) => p[1]),
      dx = Math.max(...xs) - Math.min(...xs),
      dy = Math.max(...ys) - Math.min(...ys)
    positions = tsp.graph.points.map(([x, y], i) =>
      dx && dy
        ? [77 + ((x - Math.min(...xs)) / dx) * 430, 166 - ((y - Math.min(...ys)) / dy) * 135]
        : [285 + 190 * Math.cos((i * 2 * Math.PI) / graph.vertices), 99 + 68 * Math.sin((i * 2 * Math.PI) / graph.vertices)],
    )
    frames = [{ step: 0, phase: 0, selected: [], highlighted: [], covered: graph.edges.map(() => false), partition: [], tour: [], alg: 0, feasible: false }]
    for (let k = 1; k <= tsp.mst.length; k++) {
      const edges = tsp.mst.slice(0, k)
      frames.push({
        step: frames.length,
        phase: 0,
        selected: [...new Set(edges.flatMap((e) => [e.u, e.v]))],
        highlighted: edges.map((e) => e.id),
        covered: graph.edges.map((e) => edges.some((x) => x.u === e[0] && x.v === e[1])),
        partition: [],
        tour: [],
        alg: edges.reduce((a, e) => a + e.weight, 0),
        feasible: false,
      })
    }
    for (let k = 2; k <= tsp.preorder.length; k++) {
      const tour = tsp.preorder.slice(0, k)
      frames.push({
        step: frames.length,
        phase: 1,
        selected: [...tour],
        highlighted: tsp.mst.map((e) => e.id),
        covered: graph.edges.map(() => false),
        partition: [],
        tour,
        alg: tourCost(tour, tsp.distances),
        feasible: false,
      })
    }
    frames.push({
      step: frames.length,
      phase: 2,
      selected: [...tsp.preorder],
      highlighted: tsp.mst.map((e) => e.id),
      covered: graph.edges.map(() => true),
      partition: [],
      tour: tsp.tour,
      alg: tsp.cost,
      feasible: true,
    })
  } else {
    graph = structuredClone(input as CoverGraph)
    validateCoverGraph(graph)
    weights = graph.edges.map(() => 1)
    positions =
      graph.vertices === 8
        ? [
            [77, 31],
            [228, 31],
            [375, 31],
            [508, 31],
            [77, 166],
            [228, 166],
            [375, 166],
            [508, 166],
          ]
        : graph.vertices === 1
          ? [[285, 99]]
          : Array.from({ length: graph.vertices }, (_, i) => [
              285 + 200 * Math.cos((i * 2 * Math.PI) / graph.vertices - Math.PI / 2),
              99 + 68 * Math.sin((i * 2 * Math.PI) / graph.vertices - Math.PI / 2),
            ])
    if (mode === 'cover') {
      cover = runVertexCoverLesson(graph, prefix)
      optimum = cover.optimum.length
      optimalVertices = cover.optimum
      frames = cover.frames.map((f, i) => ({
        step: i,
        phase: f.complete ? 2 : 0,
        selected: f.cover,
        highlighted: f.matching,
        covered: f.covered,
        partition: [],
        tour: [],
        alg: f.cover.length,
        feasible: f.complete,
      }))
    } else {
      cut = runCutGuarantee(graph)
      frames = cut.frames
      optimum = cut.optimum
      optimalSides = cut.optimalSides
    }
  }
  const final = frames.at(-1)!,
    minimize = mode !== 'max-cut',
    ratio = final.alg > 0 && optimum > 0 ? (minimize ? final.alg / optimum : optimum / final.alg) : null,
    bound = minimize ? 2 * optimum : optimum / 2
  return {
    mode,
    graph,
    weights,
    positions,
    frames,
    final,
    optimum,
    optimalVertices,
    optimalTour,
    optimalSides,
    cover,
    cut,
    tsp,
    minimize,
    ratio,
    bound,
    factor: 2,
    defaultCursor: frames.length - 1,
  }
}
export function guaranteeFeasible(run: ReturnType<typeof runApproximationGuarantee>, frame: GuaranteeFrame) {
  if (run.mode === 'cover') return isCover(run.graph, frame.selected)
  if (run.mode === 'max-cut') return frame.partition.length === run.graph.vertices && frame.partition.every((s) => s === 0 || s === 1)
  const cities = frame.tour.length === 1 ? frame.tour : frame.tour.slice(0, -1)
  return (
    new Set(cities).size === run.graph.vertices &&
    cities.every((v) => Number.isInteger(v) && v >= 0 && v < run.graph.vertices) &&
    (frame.tour.length === 1 || frame.tour[0] === frame.tour.at(-1))
  )
}
export function schemeIllustration(n: number, epsilon: number) {
  if (!Number.isInteger(n) || n < 1 || n > 100 || !Number.isFinite(epsilon) || epsilon < 0.01 || epsilon > 1)
    throw new Error('Use 1–100 input items and ε between 0.01 and 1.')
  return { factor: 1 + epsilon, ptas: n ** (1 / epsilon), fptas: (n * n) / epsilon }
}
