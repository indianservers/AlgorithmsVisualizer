export type BridgeGraph = { vertices: number; start: number; edges: [number, number][] }
export const bridgeExample: BridgeGraph = {
  vertices: 6,
  start: 1,
  edges: [
    [1, 2],
    [1, 3],
    [2, 3],
    [3, 4],
    [3, 5],
    [3, 6],
    [5, 6],
  ],
}
export type BridgeFrame = {
  kind: 'discover' | 'back' | 'return' | 'complete'
  vertex: number
  from?: number
  edge?: number
  title: string
  detail: string
  bridge: boolean
  tin: number[]
  low: number[]
  parent: number[]
  children: number[][]
  tree: number[]
  back: number[]
  bridges: number[]
  articulation: number[]
  stack: number[]
}
export function validateBridgeGraph(graph: BridgeGraph) {
  if (!Number.isInteger(graph.vertices) || graph.vertices < 1 || graph.vertices > 8) throw new Error('Use 1–8 vertices.')
  if (!Number.isInteger(graph.start) || graph.start < 1 || graph.start > graph.vertices) throw new Error('Choose a starting vertex from 1 to V.')
  if (!Array.isArray(graph.edges) || graph.edges.length > 20) throw new Error('Use at most 20 undirected edges.')
  for (const edge of graph.edges)
    if (!Array.isArray(edge) || edge.length !== 2 || !edge.every((v) => Number.isInteger(v) && v >= 1 && v <= graph.vertices))
      throw new Error('Each edge must contain two vertex indices from 1 to V. Parallel edges and loops are allowed.')
}
export function parseBridgeGraph(text: string): BridgeGraph {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Enter valid JSON with vertices, start and edges.')
  }
  if (!data || typeof data !== 'object') throw new Error('Enter an undirected graph object.')
  const graph = data as BridgeGraph
  validateBridgeGraph(graph)
  return graph
}
export function bridgeComponents(graph: BridgeGraph, removedEdge = -1, removedVertex = -1) {
  const adjacent = Array.from({ length: graph.vertices + 1 }, () => [] as number[])
  graph.edges.forEach(([u, v], id) => {
    if (id !== removedEdge && u !== removedVertex && v !== removedVertex) {
      adjacent[u].push(v)
      adjacent[v].push(u)
    }
  })
  const seen = new Set<number>(),
    components: number[][] = []
  for (let u = 1; u <= graph.vertices; u++)
    if (u !== removedVertex && !seen.has(u)) {
      const queue = [u]
      seen.add(u)
      for (let i = 0; i < queue.length; i++)
        for (const v of adjacent[queue[i]])
          if (!seen.has(v)) {
            seen.add(v)
            queue.push(v)
          }
      components.push(queue.sort((a, b) => a - b))
    }
  return components
}
export function runBridgeLesson(input: BridgeGraph) {
  validateBridgeGraph(input)
  const graph = structuredClone(input),
    adjacency = Array.from({ length: graph.vertices + 1 }, () => [] as { to: number; edge: number }[]),
    tin = Array<number>(graph.vertices + 1).fill(-1),
    low = [...tin],
    parent = [...tin],
    children = Array.from({ length: graph.vertices + 1 }, () => [] as number[]),
    tree = new Set<number>(),
    back = new Set<number>(),
    bridges = new Set<number>(),
    articulation = new Set<number>(),
    stack: number[] = [],
    frames: BridgeFrame[] = []
  graph.edges.forEach(([u, v], edge) => {
    adjacency[u].push({ to: v, edge })
    if (u !== v) adjacency[v].push({ to: u, edge })
  })
  let timer = 0
  function add(kind: BridgeFrame['kind'], vertex: number, title: string, detail: string, from?: number, edge?: number, bridge = false) {
    frames.push({
      kind,
      vertex,
      from,
      edge,
      title,
      detail,
      bridge,
      tin: [...tin],
      low: [...low],
      parent: [...parent],
      children: children.map((a) => [...a]),
      tree: [...tree],
      back: [...back],
      bridges: [...bridges],
      articulation: [...articulation],
      stack: [...stack],
    })
  }
  function dfs(u: number, parentEdge: number) {
    tin[u] = low[u] = timer++
    stack.push(u)
    add(
      'discover',
      u,
      parentEdge < 0 ? `Start DFS at vertex ${u}` : `Visit vertex ${u} from ${parent[u]}`,
      `tin[${u}] = low[${u}] = ${tin[u]}`,
      parent[u] < 0 ? undefined : parent[u],
      parentEdge < 0 ? undefined : parentEdge,
    )
    for (const { to: v, edge } of adjacency[u]) {
      if (edge === parentEdge) continue
      if (tin[v] < 0) {
        parent[v] = u
        children[u].push(v)
        tree.add(edge)
        dfs(v, edge)
        const previous = low[u]
        low[u] = Math.min(low[u], low[v])
        const isBridge = low[v] > tin[u]
        if (isBridge) bridges.add(edge)
        if (parentEdge >= 0 && low[v] >= tin[u]) articulation.add(u)
        add('return', u, `Backtrack to ${u} from ${v}`, `low[${u}] = min(${previous}, ${low[v]}) = ${low[u]}`, v, edge, isBridge)
      } else if (tin[v] <= tin[u] && !back.has(edge)) {
        const previous = low[u]
        low[u] = Math.min(low[u], tin[v])
        back.add(edge)
        add('back', u, `Explore ${u} → ${v} (back edge)`, `low[${u}] = min(${previous}, ${tin[v]}) = ${low[u]}`, v, edge)
      }
    }
    if (parentEdge < 0 && children[u].length > 1) articulation.add(u)
    stack.pop()
  }
  for (const u of [graph.start, ...Array.from({ length: graph.vertices }, (_, i) => i + 1).filter((v) => v !== graph.start)]) if (tin[u] < 0) dfs(u, -1)
  add(
    'complete',
    graph.start,
    'DFS complete',
    `${bridges.size} bridge edge${bridges.size === 1 ? '' : 's'}; ${articulation.size} articulation vert${articulation.size === 1 ? 'ex' : 'ices'}.`,
  )
  return {
    graph,
    frames,
    final: frames.at(-1)!,
    defaultCursor: Math.max(
      0,
      frames.findIndex((f) => f.bridge),
    ),
    components: bridgeComponents(graph),
  }
}
export type BridgeRun = ReturnType<typeof runBridgeLesson>
