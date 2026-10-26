export type EulerGraph = { vertices: number; start: number | null; edges: [number, number][] }
export const eulerExample: EulerGraph = {
  vertices: 4,
  start: null,
  edges: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
  ],
}
export type EulerFrame = {
  kind: 'start' | 'consume' | 'pop' | 'complete' | 'invalid'
  current: number
  from?: number
  to?: number
  edge?: number
  stack: number[]
  used: boolean[]
  reverse: number[]
  reverseEdges: number[]
  move: string
}
export function validateEulerGraph(graph: EulerGraph) {
  if (!Number.isInteger(graph.vertices) || graph.vertices < 1 || graph.vertices > 8) throw new Error('Use 1–8 vertices numbered 0 to V−1.')
  if (graph.start !== null && (!Number.isInteger(graph.start) || graph.start < 0 || graph.start >= graph.vertices))
    throw new Error('Use null for automatic start, or a vertex from 0 to V−1.')
  if (!Array.isArray(graph.edges) || graph.edges.length > 20) throw new Error('Use at most 20 undirected edge pairs.')
  for (const edge of graph.edges)
    if (!Array.isArray(edge) || edge.length !== 2 || !edge.every((v) => Number.isInteger(v) && v >= 0 && v < graph.vertices))
      throw new Error('Each edge must contain two integer endpoints from 0 to V−1. Parallel edges and loops are supported.')
}
export function parseEulerGraph(text: string): EulerGraph {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Enter valid JSON with vertices, start and edges.')
  }
  if (!data || typeof data !== 'object') throw new Error('Enter an undirected graph object.')
  if ((data as { directed?: unknown }).directed === true) throw new Error('This lesson uses undirected graphs.')
  const graph = data as EulerGraph
  validateEulerGraph(graph)
  return graph
}
export function checkEulerGraph(graph: EulerGraph) {
  validateEulerGraph(graph)
  const degree = Array<number>(graph.vertices).fill(0),
    adjacency = Array.from({ length: graph.vertices }, () => [] as number[])
  graph.edges.forEach(([u, v]) => {
    degree[u]++
    degree[v]++
    adjacency[u].push(v)
    adjacency[v].push(u)
  })
  const odd = degree.flatMap((d, v) => (d % 2 ? [v] : [])),
    seen = new Set<number>(),
    components: number[][] = []
  for (let u = 0; u < graph.vertices; u++)
    if (degree[u] > 0 && !seen.has(u)) {
      const queue = [u]
      seen.add(u)
      for (let i = 0; i < queue.length; i++)
        for (const v of adjacency[queue[i]])
          if (!seen.has(v)) {
            seen.add(v)
            queue.push(v)
          }
      components.push(queue)
    }
  const exists = components.length <= 1 && (odd.length === 0 || odd.length === 2),
    start =
      graph.start ??
      odd[0] ??
      Math.max(
        0,
        degree.findIndex((d) => d > 0),
      ),
    startValid = graph.edges.length === 0 || (degree[start] > 0 && (odd.length === 0 || odd.includes(start))),
    feasible = exists && startValid
  const reason =
    components.length > 1
      ? 'The edge-bearing vertices lie in different connected components.'
      : odd.length !== 0 && odd.length !== 2
        ? `There are ${odd.length} odd-degree vertices; an undirected Eulerian trail requires 0 or 2.`
        : !startValid
          ? degree[start] === 0
            ? 'The chosen start is isolated. Start in the edge-bearing component.'
            : 'With two odd vertices, start at an odd-degree endpoint.'
          : graph.edges.length === 0
            ? 'The empty-edge graph has a zero-length trail.'
            : odd.length === 0
              ? 'All edge-bearing vertices are connected and have even degree.'
              : 'The edge-bearing vertices are connected and exactly two have odd degree.'
  return { degree, odd, components, exists, start, startValid, feasible, reason, circuit: exists && odd.length === 0 }
}
export function runEulerLesson(graph: EulerGraph) {
  const check = checkEulerGraph(graph),
    network = structuredClone(graph),
    used = network.edges.map(() => false),
    stack = [check.start],
    incoming: (number | null)[] = [null],
    reverse: number[] = [],
    reverseEdges: number[] = [],
    frames: EulerFrame[] = [],
    adjacency = Array.from({ length: network.vertices }, () => [] as { to: number; edge: number }[]),
    next = Array<number>(network.vertices).fill(0)
  function snapshot(kind: EulerFrame['kind'], current: number, move: string, from?: number, to?: number, edge?: number) {
    frames.push({ kind, current, move, from, to, edge, stack: [...stack], used: [...used], reverse: [...reverse], reverseEdges: [...reverseEdges] })
  }
  if (!check.feasible) {
    stack.pop()
    snapshot('invalid', check.start, check.reason)
    return { graph: network, check, frames, trail: [] as number[], edgeOrder: [] as number[], defaultCursor: 0 }
  }
  network.edges.forEach(([u, v], edge) => {
    adjacency[u].push({ to: v, edge })
    adjacency[v].push({ to: u, edge })
  })
  snapshot('start', check.start, `Start at ${check.start}`)
  while (stack.length) {
    const u = stack.at(-1)!
    while (next[u] < adjacency[u].length && used[adjacency[u][next[u]].edge]) next[u]++
    const arc = adjacency[u][next[u]]
    if (arc) {
      next[u]++
      used[arc.edge] = true
      stack.push(arc.to)
      incoming.push(arc.edge)
      snapshot('consume', arc.to, `${u} → ${arc.to}`, u, arc.to, arc.edge)
    } else {
      const v = stack.pop()!,
        edge = incoming.pop()!
      reverse.push(v)
      if (edge !== null) reverseEdges.push(edge)
      snapshot('pop', stack.at(-1) ?? v, `Backtrack from ${v}`)
    }
  }
  const trail = [...reverse].reverse(),
    edgeOrder = [...reverseEdges].reverse()
  snapshot('complete', trail.at(-1) ?? check.start, 'Final trail assembled')
  return { graph: network, check, frames, trail, edgeOrder, defaultCursor: Math.min(2, frames.length - 1) }
}
export type EulerRun = ReturnType<typeof runEulerLesson>
export function verifyEulerTrail(graph: EulerGraph, trail: number[], edges: number[]) {
  if (trail.length !== graph.edges.length + 1 || edges.length !== graph.edges.length || new Set(edges).size !== edges.length) return false
  if (trail.some((v) => !Number.isInteger(v) || v < 0 || v >= graph.vertices)) return false
  return edges.every(
    (edge, i) =>
      Number.isInteger(edge) &&
      edge >= 0 &&
      edge < graph.edges.length &&
      ((graph.edges[edge][0] === trail[i] && graph.edges[edge][1] === trail[i + 1]) ||
        (graph.edges[edge][1] === trail[i] && graph.edges[edge][0] === trail[i + 1])),
  )
}
