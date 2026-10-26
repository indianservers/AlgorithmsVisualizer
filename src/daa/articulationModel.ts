import { bridgeComponents, runBridgeLesson, type BridgeGraph } from './bridgeLessonModel'
export type ArticulationGraph = { vertices: number; root: number; edges: [number, number][] }
export const articulationExample: ArticulationGraph = {
  vertices: 7,
  root: 0,
  edges: [
    [0, 1],
    [1, 2],
    [2, 0],
    [2, 3],
    [0, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [4, 6],
    [3, 6],
  ],
}
export function validateArticulationGraph(graph: ArticulationGraph) {
  if (!Number.isInteger(graph.vertices) || graph.vertices < 1 || graph.vertices > 8) throw new Error('Use 1–8 vertices numbered 0 to V−1.')
  if (!Number.isInteger(graph.root) || graph.root < 0 || graph.root >= graph.vertices) throw new Error('Choose a root vertex from 0 to V−1.')
  if (!Array.isArray(graph.edges) || graph.edges.length > 20) throw new Error('Use at most 20 undirected edge pairs.')
  for (const edge of graph.edges)
    if (!Array.isArray(edge) || edge.length !== 2 || !edge.every((v) => Number.isInteger(v) && v >= 0 && v < graph.vertices))
      throw new Error('Every edge endpoint must be an integer from 0 to V−1. Parallel edges and loops are allowed.')
}
function bridgeInput(graph: ArticulationGraph): BridgeGraph {
  return { vertices: graph.vertices, start: graph.root + 1, edges: graph.edges.map(([u, v]) => [u + 1, v + 1]) }
}
export function articulationComponents(graph: ArticulationGraph, removedVertex = -1) {
  validateArticulationGraph(graph)
  return bridgeComponents(bridgeInput(graph), -1, removedVertex < 0 ? -1 : removedVertex + 1).map((c) => c.map((v) => v - 1))
}
export function runArticulation(graph: ArticulationGraph) {
  validateArticulationGraph(graph)
  const run = runBridgeLesson(bridgeInput(graph)),
    cuts = run.final.articulation.map((v) => v - 1).sort((a, b) => a - b)
  return { graph: structuredClone(graph), frames: run.frames, final: run.final, cuts, components: articulationComponents(graph) }
}
export function parseArticulationGraph(text: string): ArticulationGraph {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Enter valid JSON with vertices, root and edges.')
  }
  if (!data || typeof data !== 'object') throw new Error('Enter an undirected graph object.')
  if ((data as { directed?: unknown }).directed === true) throw new Error('Articulation points here require an undirected graph.')
  const graph = data as ArticulationGraph
  validateArticulationGraph(graph)
  return graph
}
export const articulationNumber = (v: number) => (v < 0 ? '—' : String(v + 1))
