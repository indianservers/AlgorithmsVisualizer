export type MetricPoint = [number, number]
export type MetricInput = { points: MetricPoint[]; mode: 'euclidean' | 'manhattan' | 'matrix'; source: number; matrix?: number[][] }
export type MetricEdge = { u: number; v: number; weight: number; id: number }
export const metricTspExample: MetricInput = {
  mode: 'euclidean',
  source: 0,
  points: [
    [0, 0],
    [-2, 1],
    [-1, 3],
    [1, 2],
    [3, 0],
    [4, 2],
    [2, 4],
  ],
}
function validate(input: MetricInput) {
  if (!input || !Array.isArray(input.points) || input.points.length < 1 || input.points.length > 9) throw new Error('Use 1–9 cities.')
  if (!['euclidean', 'manhattan', 'matrix'].includes(input.mode)) throw new Error('Choose euclidean, manhattan or matrix mode.')
  if (input.points.some((p) => !Array.isArray(p) || p.length !== 2 || p.some((v) => !Number.isFinite(v) || Math.abs(v) > 1000)))
    throw new Error('Each point needs two finite coordinates between −1000 and 1000.')
  const n = input.points.length
  if (!Number.isInteger(input.source) || input.source < 0 || input.source >= n) throw new Error('The source must be a city ID from 0 to V−1.')
  if (
    input.mode === 'matrix' &&
    (!Array.isArray(input.matrix) ||
      input.matrix.length !== n ||
      input.matrix.some((row) => !Array.isArray(row) || row.length !== n || row.some((v) => !Number.isFinite(v) || v < 0 || v > 1e9)))
  )
    throw new Error('Enter a square non-negative finite distance matrix, with weights at most 1000000000.')
}
export function metricDistances(input: MetricInput) {
  validate(input)
  const n = input.points.length,
    distance = input.points.map(([x, y], i) =>
      input.points.map(([a, b], j) =>
        input.mode === 'matrix' ? input.matrix![i][j] : input.mode === 'manhattan' ? Math.abs(x - a) + Math.abs(y - b) : Math.hypot(x - a, y - b),
      ),
    )
  for (let i = 0; i < n; i++) {
    if (Math.abs(distance[i][i]) > 1e-9) throw new Error('Every diagonal distance must be zero.')
    distance[i][i] = 0
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(distance[i][j] - distance[j][i]) > 1e-9) throw new Error('The distance matrix must be symmetric.')
      distance[i][j] = distance[j][i] = (distance[i][j] + distance[j][i]) / 2
    }
  }
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      for (let k = 0; k < n; k++)
        if (distance[i][k] > distance[i][j] + distance[j][k] + 1e-9 * Math.max(1, distance[i][k]))
          throw new Error(`Triangle inequality fails for cities ${i}, ${j}, ${k}.`)
  return distance
}
export function parseMetricInput(text: string): MetricInput {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    throw new Error('Enter valid JSON with points, mode and source.')
  }
  metricDistances(value as MetricInput)
  return structuredClone(value as MetricInput)
}
export function tourCost(tour: number[], distances: number[][]) {
  return tour.slice(1).reduce((sum, v, i) => sum + distances[tour[i]][v], 0)
}
export function exactMetricTour(distances: number[][], source: number) {
  const n = distances.length,
    full = (1 << n) - 1,
    dp = Array.from({ length: 1 << n }, () => Array<number>(n).fill(Infinity)),
    parent = Array.from({ length: 1 << n }, () => Array<number>(n).fill(-1))
  if (n === 1) return { tour: [source], cost: 0 }
  dp[1 << source][source] = 0
  for (let mask = 0; mask <= full; mask++)
    for (let u = 0; u < n; u++)
      if (Number.isFinite(dp[mask][u]))
        for (let v = 0; v < n; v++)
          if (!(mask & (1 << v))) {
            const next = mask | (1 << v),
              cost = dp[mask][u] + distances[u][v]
            if (cost < dp[next][v]) {
              dp[next][v] = cost
              parent[next][v] = u
            }
          }
  let last = -1,
    cost = Infinity
  for (let u = 0; u < n; u++)
    if (u !== source && dp[full][u] + distances[u][source] < cost) {
      last = u
      cost = dp[full][u] + distances[u][source]
    }
  const reverse: number[] = []
  let mask = full
  while (last !== -1) {
    reverse.push(last)
    const previous = parent[mask][last]
    mask ^= 1 << last
    last = previous
  }
  return { tour: [...reverse.reverse(), source], cost }
}
export function runMetricTspLesson(input: MetricInput, reverse = false) {
  const distances = metricDistances(input),
    graph = structuredClone(input),
    n = graph.points.length,
    edges: MetricEdge[] = [],
    mst: MetricEdge[] = [],
    roots = Array.from({ length: n }, (_, i) => i)
  for (let u = 0; u < n; u++) for (let v = u + 1; v < n; v++) edges.push({ u, v, weight: distances[u][v], id: edges.length })
  function find(v: number): number {
    if (roots[v] !== v) roots[v] = find(roots[v])
    return roots[v]
  }
  // Equal weights may yield many valid MSTs. Prefer root edges, then larger IDs,
  // so the reference instance uses the same six tree edges as the mockup.
  const rootPriority = (e: MetricEdge) => (e.u === graph.source || e.v === graph.source ? 0 : 1)
  for (const edge of [...edges].sort((a, b) => a.weight - b.weight || rootPriority(a) - rootPriority(b) || b.u - a.u || b.v - a.v)) {
    const a = find(edge.u),
      b = find(edge.v)
    if (a !== b) {
      roots[a] = b
      mst.push(edge)
    }
  }
  const adjacency = Array.from({ length: n }, () => [] as number[])
  for (const { u, v } of mst) {
    adjacency[u].push(v)
    adjacency[v].push(u)
  }
  adjacency.forEach((row) => row.sort((a, b) => (reverse ? b - a : a - b)))
  const walk: number[] = [],
    preorder: number[] = [],
    traversals: { from: number; to: number; weight: number }[] = []
  function dfs(u: number, parent = -1) {
    walk.push(u)
    preorder.push(u)
    for (const v of adjacency[u])
      if (v !== parent) {
        traversals.push({ from: u, to: v, weight: distances[u][v] })
        dfs(v, u)
        walk.push(u)
        traversals.push({ from: v, to: u, weight: distances[v][u] })
      }
  }
  dfs(graph.source)
  const tour = n === 1 ? [graph.source] : [...preorder, graph.source],
    shortcuts: { from: number; to: number; via: number[]; direct: number; walkCost: number }[] = []
  let at = 0
  for (let i = 1; i < tour.length; i++) {
    const to = tour[i]
    let end = at + 1
    if (i === tour.length - 1) end = walk.length - 1
    else while (end < walk.length && walk[end] !== to) end++
    const via = walk.slice(at, end + 1)
    shortcuts.push({ from: tour[i - 1], to, via, direct: distances[tour[i - 1]][to], walkCost: tourCost(via, distances) })
    at = end
  }
  const mstCost = mst.reduce((s, e) => s + e.weight, 0),
    doubledCost = tourCost(walk, distances),
    cost = tourCost(tour, distances),
    optimum = exactMetricTour(distances, graph.source)
  return {
    graph,
    reverse,
    distances,
    edges,
    mst,
    walk,
    preorder,
    traversals,
    tour,
    shortcuts,
    mstCost,
    doubledCost,
    cost,
    optimum,
    ratio: mstCost ? cost / mstCost : null,
    approximationRatio: optimum.cost ? cost / optimum.cost : null,
  }
}
export type MetricTspRun = ReturnType<typeof runMetricTspLesson>
