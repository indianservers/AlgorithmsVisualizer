export type CoverGraph = { vertices: number; edges: [number, number][] }
export type CoverFrame = {
  step: number
  edge: number | null
  added: number[]
  cover: number[]
  matching: number[]
  covered: boolean[]
  remaining: number[]
  complete: boolean
}
export const coverExample: CoverGraph = {
  vertices: 6,
  edges: [
    [0, 1],
    [0, 3],
    [0, 4],
    [1, 2],
    [3, 4],
    [2, 4],
    [3, 5],
    [4, 5],
  ],
}
export function validateCoverGraph(graph: CoverGraph) {
  if (!graph || !Number.isInteger(graph.vertices) || graph.vertices < 1 || graph.vertices > 8) throw new Error('Use 1–8 vertices numbered 0 to V−1.')
  if (!Array.isArray(graph.edges) || graph.edges.length > 20) throw new Error('Use at most 20 undirected edges.')
  const seen = new Set<string>()
  for (const pair of graph.edges) {
    if (!Array.isArray(pair) || pair.length !== 2 || pair.some((v) => !Number.isInteger(v) || v < 0 || v >= graph.vertices))
      throw new Error('Each edge must have two integer endpoints from 0 to V−1.')
    const [a, b] = pair
    if (a === b) throw new Error('Use a simple graph without self-loops.')
    const key = [a, b].sort((a, b) => a - b).join(':')
    if (seen.has(key)) throw new Error('Use a simple graph without duplicate or parallel edges.')
    seen.add(key)
  }
}
export function parseCoverGraph(text: string): CoverGraph {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Enter valid JSON with vertices and edges.')
  }
  if (!data || typeof data !== 'object') throw new Error('Enter an undirected graph object.')
  if ((data as { directed?: unknown }).directed === true) throw new Error('This lesson uses undirected graphs.')
  validateCoverGraph(data as CoverGraph)
  return data as CoverGraph
}
export function isCover(graph: CoverGraph, selected: number[]) {
  if (new Set(selected).size !== selected.length || selected.some((v) => !Number.isInteger(v) || v < 0 || v >= graph.vertices)) return false
  const set = new Set(selected)
  return graph.edges.every(([a, b]) => set.has(a) || set.has(b))
}
export function isCoverMatching(graph: CoverGraph, matching: number[]) {
  const seen = new Set<number>()
  for (const id of matching) {
    if (!Number.isInteger(id) || id < 0 || id >= graph.edges.length) return false
    for (const vertex of graph.edges[id]) {
      if (seen.has(vertex)) return false
      seen.add(vertex)
    }
  }
  return true
}
export function minimumCover(graph: CoverGraph) {
  validateCoverGraph(graph)
  for (let size = 0; size <= graph.vertices; size++)
    for (let mask = 0; mask < 2 ** graph.vertices; mask++) {
      const selected = Array.from({ length: graph.vertices }, (_, i) => i).filter((i) => mask & (1 << i))
      if (selected.length === size && isCover(graph, selected)) return selected
    }
  throw new Error('No vertex cover found.')
}
export function runVertexCoverLesson(graph: CoverGraph, prefix: number[] = []) {
  validateCoverGraph(graph)
  if (new Set(prefix).size !== prefix.length || prefix.some((id) => !Number.isInteger(id) || id < 0 || id >= graph.edges.length))
    throw new Error('The edge order must contain distinct edge IDs from 0 to E−1.')
  const network = structuredClone(graph),
    order = [...prefix, ...graph.edges.flatMap((_, id) => (prefix.includes(id) ? [] : [id]))],
    selected = new Set<number>(),
    matching: number[] = [],
    frames: CoverFrame[] = []
  function snapshot(edge: number | null, added: number[]) {
    const covered = network.edges.map(([u, v]) => selected.has(u) || selected.has(v)),
      remaining = covered.flatMap((value, id) => (value ? [] : [id]))
    frames.push({
      step: matching.length,
      edge,
      added,
      cover: [...selected].sort((a, b) => a - b),
      matching: [...matching],
      covered,
      remaining,
      complete: remaining.length === 0,
    })
  }
  snapshot(null, [])
  for (const id of order) {
    const [u, v] = network.edges[id]
    if (selected.has(u) || selected.has(v)) continue
    selected.add(u)
    selected.add(v)
    matching.push(id)
    snapshot(id, [u, v])
  }
  const optimum = minimumCover(network),
    final = frames.at(-1)!,
    degree = Array<number>(graph.vertices).fill(0)
  network.edges.forEach(([a, b]) => {
    degree[a]++
    degree[b]++
  })
  return {
    graph: network,
    order,
    frames,
    degree,
    optimum,
    final,
    ratio: optimum.length ? final.cover.length / optimum.length : null,
    defaultCursor: frames.length - 1,
  }
}
export type CoverRun = ReturnType<typeof runVertexCoverLesson>
