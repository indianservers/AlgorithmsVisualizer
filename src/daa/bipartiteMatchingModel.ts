export type MatchingPair = [number, number]
export type MatchingGraph = { left: number; right: number; edges: MatchingPair[] }
export const matchingGraph: MatchingGraph = {
  left: 3,
  right: 3,
  edges: [
    [1, 4],
    [1, 5],
    [2, 4],
    [2, 5],
    [2, 6],
    [3, 5],
    [3, 6],
  ],
}
export const matchingStart: MatchingPair[] = [
  [1, 4],
  [3, 6],
]
export const reroutingGraph: MatchingGraph = {
  left: 3,
  right: 3,
  edges: [
    [1, 4],
    [1, 5],
    [2, 4],
    [3, 5],
    [3, 6],
  ],
}
export function validateMatchingGraph(graph: MatchingGraph) {
  if (!Number.isInteger(graph.left) || !Number.isInteger(graph.right) || graph.left < 1 || graph.left > 5 || graph.right < 1 || graph.right > 5)
    throw new Error('Use 1–5 vertices in each partition.')
  if (!Array.isArray(graph.edges) || graph.edges.length > graph.left * graph.right)
    throw new Error('Provide an edge list with at most one edge per cross-partition pair.')
  const seen = new Set<string>()
  for (const edge of graph.edges) {
    if (
      !Array.isArray(edge) ||
      edge.length !== 2 ||
      !Number.isInteger(edge[0]) ||
      !Number.isInteger(edge[1]) ||
      edge[0] < 1 ||
      edge[0] > graph.left ||
      edge[1] <= graph.left ||
      edge[1] > graph.left + graph.right
    )
      throw new Error('Each edge must join a left vertex 1…|U| to a right vertex |U|+1…|U|+|V|.')
    const key = edge.join(':')
    if (seen.has(key)) throw new Error('Duplicate graph edges are not allowed.')
    seen.add(key)
  }
}
export function validateMatching(graph: MatchingGraph, matching: MatchingPair[]) {
  if (!Array.isArray(matching)) throw new Error('Matching must be a list of edge pairs.')
  const used = new Set<number>(),
    graphEdges = new Set(graph.edges.map((p) => p.join(':')))
  for (const pair of matching) {
    if (!Array.isArray(pair) || pair.length !== 2 || !Number.isInteger(pair[0]) || !Number.isInteger(pair[1]) || !graphEdges.has(pair.join(':')))
      throw new Error('Every matching edge must exist in the bipartite graph.')
    if (used.has(pair[0]) || used.has(pair[1])) throw new Error('Matching edges must have disjoint endpoints.')
    used.add(pair[0])
    used.add(pair[1])
  }
}
export function matchingPath(graph: MatchingGraph, matching: MatchingPair[], start: number) {
  validateMatchingGraph(graph)
  validateMatching(graph, matching)
  if (!Number.isInteger(start) || start < 1 || start > graph.left)
    return { path: [] as number[], order: [] as number[], parent: {} as Record<number, number>, reason: 'Choose a vertex in U.' }
  if (matching.some((p) => p[0] === start))
    return {
      path: [] as number[],
      order: [] as number[],
      parent: {} as Record<number, number>,
      reason: 'The starting vertex is already matched. Choose a free vertex in U.',
    }
  const neighbors = Array.from({ length: graph.left + graph.right + 1 }, () => [] as number[]),
    mate = new Map<number, number>(matching.map((p) => [p[1], p[0]])),
    matched = new Set(matching.map((p) => p.join(':'))),
    seen = new Set([start]),
    order = [start],
    parent: Record<number, number> = {}
  graph.edges.forEach(([u, v]) => {
    if (!matched.has(`${u}:${v}`)) neighbors[u].push(v)
  })
  matching.forEach(([u, v]) => neighbors[v].push(u))
  for (let i = 0; i < order.length; i++)
    for (const next of neighbors[order[i]])
      if (!seen.has(next)) {
        seen.add(next)
        parent[next] = order[i]
        order.push(next)
        if (next > graph.left && !mate.has(next)) {
          const path = [next]
          for (let v = next; v !== start; ) {
            v = parent[v]
            path.unshift(v)
          }
          return { path, order, parent, reason: 'An augmenting path reaches a free vertex in V.' }
        }
      }
  return { path: [] as number[], order, parent, reason: 'No augmenting path starts here. Search other free vertices before concluding maximum.' }
}
export function flipMatchingPath(graph: MatchingGraph, matching: MatchingPair[], path: number[]): MatchingPair[] {
  validateMatchingGraph(graph)
  validateMatching(graph, matching)
  if (path.length < 2 || path.length % 2 !== 0 || new Set(path).size !== path.length)
    throw new Error('An augmenting path must be simple, have odd edge length, and end in the other partition.')
  if (
    path[0] < 1 ||
    path[0] > graph.left ||
    path.at(-1)! <= graph.left ||
    path.at(-1)! > graph.left + graph.right ||
    matching.some((p) => p.includes(path[0]) || p.includes(path.at(-1)!))
  )
    throw new Error('Both endpoints of an augmenting path must be free.')
  const nextKeys = new Set(matching.map((p) => p.join(':'))),
    graphEdges = new Set(graph.edges.map((p) => p.join(':')))
  for (let i = 0; i < path.length - 1; i++) {
    const pair: MatchingPair = i % 2 === 0 ? [path[i], path[i + 1]] : [path[i + 1], path[i]],
      key = pair.join(':')
    if (!graphEdges.has(key) || (i % 2 === 0 ? nextKeys.has(key) : !nextKeys.has(key)))
      throw new Error('Path edges must alternate unmatched and matched graph edges.')
    if (i % 2 === 0) nextKeys.add(key)
    else nextKeys.delete(key)
  }
  const next = [...nextKeys].map((key) => key.split(':').map(Number) as MatchingPair)
  validateMatching(graph, next)
  return next.sort((a, b) => a[0] - b[0])
}
export function solveBipartiteMatching(graph: MatchingGraph, initial: MatchingPair[] = []) {
  validateMatchingGraph(graph)
  validateMatching(graph, initial)
  let matching = initial.map((p) => [...p] as MatchingPair)
  const paths: number[][] = []
  for (let u = 1; u <= graph.left; u++)
    if (!matching.some((p) => p[0] === u)) {
      const search = matchingPath(graph, matching, u)
      if (search.path.length) {
        paths.push(search.path)
        matching = flipMatchingPath(graph, matching, search.path)
      }
    }
  // Alternating reachability from every free U gives König's equal-size cover.
  const seen = new Set<number>(),
    queue: number[] = []
  for (let u = 1; u <= graph.left; u++)
    if (!matching.some((p) => p[0] === u)) {
      seen.add(u)
      queue.push(u)
    }
  for (let i = 0; i < queue.length; i++) {
    const v = queue[i],
      neighbors =
        v <= graph.left
          ? graph.edges.filter(([u, w]) => u === v && !matching.some((p) => p[0] === u && p[1] === w)).map((p) => p[1])
          : matching.filter((p) => p[1] === v).map((p) => p[0])
    for (const w of neighbors)
      if (!seen.has(w)) {
        seen.add(w)
        queue.push(w)
      }
  }
  const cover = Array.from({ length: graph.left + graph.right }, (_, i) => i + 1).filter((v) => (v <= graph.left ? !seen.has(v) : seen.has(v)))
  return { matching, paths, size: matching.length, cover, perfect: graph.left === graph.right && matching.length === graph.left }
}
export function parseMatchingInput(text: string) {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Enter valid JSON with left, right, edges and an optional matching.')
  }
  if (!data || typeof data !== 'object') throw new Error('Enter a bipartite graph object.')
  const graph = data as MatchingGraph,
    matching = (data as { matching?: MatchingPair[] }).matching ?? []
  validateMatchingGraph(graph)
  validateMatching(graph, matching)
  return { graph: { left: graph.left, right: graph.right, edges: graph.edges }, matching }
}
