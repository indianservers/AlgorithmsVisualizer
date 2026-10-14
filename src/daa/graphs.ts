import { Trace, type DaaInput, type Edge } from './types'

export function arcs(input: DaaInput): Edge[] {
  return input.directed ? input.edges! : input.edges!.flatMap((e) => [e, { from: e.to, to: e.from, weight: e.weight }])
}
export function graphState(input: DaaInput, selected: number[][] = [], labels?: string[]) {
  return { graph: { vertices: input.vertices!, edges: input.edges!, directed: input.directed ?? false, selected, labels } }
}
export class DSU {
  parent: number[]
  size: number[]
  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i)
    this.size = Array(n).fill(1)
  }
  find(x: number): number {
    if (this.parent[x] !== x) this.parent[x] = this.find(this.parent[x])
    return this.parent[x]
  }
  union(a: number, b: number) {
    a = this.find(a)
    b = this.find(b)
    if (a === b) return false
    if (this.size[a] < this.size[b]) [a, b] = [b, a]
    this.parent[b] = a
    this.size[a] += this.size[b]
    return true
  }
}
export function unionFind(input: DaaInput, t: Trace) {
  const dsu = new DSU(input.vertices!)
  for (const e of input.edges!) {
    const joined = dsu.union(e.from, e.to)
    t.add(
      `Union ${e.from}, ${e.to}: ${joined ? 'link smaller root to larger root' : 'already connected'}. Find compresses paths.`,
      { values: dsu.parent, labels: dsu.size.map((s) => `size=${s}`) },
      1,
    )
  }
  const roots = dsu.parent.map((_, v) => dsu.find(v))
  return { roots, components: new Set(roots).size }
}
export function breadthFirst(input: DaaInput, t: Trace) {
  const edges = arcs(input),
    source = input.source!,
    queue = [source],
    distance = Array(input.vertices!).fill(-1),
    parent = Array(input.vertices!).fill(-1),
    order: number[] = []
  distance[source] = 0
  for (let head = 0; head < queue.length; head++) {
    const u = queue[head]
    order.push(u)
    for (const e of edges.filter((e) => e.from === u))
      if (distance[e.to] < 0) {
        distance[e.to] = distance[u] + 1
        parent[e.to] = u
        queue.push(e.to)
      }
    t.add(
      `Visit ${u}; pending frontier [${queue.slice(head + 1)}].`,
      graphState(
        input,
        parent.flatMap((p, v) => (p < 0 ? [] : [[p, v]])),
        distance.map((d) => (d < 0 ? 'unreachable' : `level ${d}`)),
      ),
      1,
      'visit',
    )
  }
  return { order, distance, parent, interpretation: 'unweighted hop distances; edge weights are ignored' }
}
export function depthFirst(input: DaaInput, t: Trace) {
  const edges = arcs(input),
    visited = new Set<number>(),
    order: number[] = [],
    stack = [input.source!]
  while (stack.length) {
    const u = stack.pop()!
    if (visited.has(u)) continue
    visited.add(u)
    order.push(u)
    const neighbors = edges
      .filter((e) => e.from === u)
      .map((e) => e.to)
      .reverse()
    stack.push(...neighbors.filter((v) => !visited.has(v)))
    t.add(
      `Visit ${u}; DFS stack [${stack}].`,
      graphState(
        input,
        [],
        Array.from({ length: input.vertices! }, (_, v) => (visited.has(v) ? 'visited' : 'pending')),
      ),
      1,
      'visit',
    )
  }
  return { order, unreachable: Array.from({ length: input.vertices! }, (_, v) => v).filter((v) => !visited.has(v)) }
}
export function dijkstra(input: DaaInput, t: Trace) {
  const edges = arcs(input),
    n = input.vertices!,
    dist = Array(n).fill(Infinity),
    parent = Array(n).fill(-1),
    used = new Set<number>()
  if (edges.some((e) => e.weight < 0)) throw new Error('Dijkstra requires non-negative edge weights. Use Bellman–Ford instead.')
  dist[input.source!] = 0
  while (used.size < n) {
    let u = -1
    for (let v = 0; v < n; v++) if (!used.has(v) && (u < 0 || dist[v] < dist[u])) u = v
    if (u < 0 || dist[u] === Infinity) break
    used.add(u)
    t.add(`Settle vertex ${u} at distance ${dist[u]}.`, graphState(input, [], dist.map(String)), 1, 'select')
    for (const e of edges.filter((e) => e.from === u))
      if (dist[u] + e.weight < dist[e.to]) {
        dist[e.to] = dist[u] + e.weight
        parent[e.to] = u
        t.add(`Relax ${u} → ${e.to}.`, graphState(input, [[u, e.to]], dist.map(String)), 2)
      }
  }
  return { distances: dist.map((d) => (Number.isFinite(d) ? d : 'unreachable')), parent }
}
export function bellmanFord(input: DaaInput, t: Trace) {
  const edges = arcs(input),
    n = input.vertices!,
    dist = Array(n).fill(Infinity),
    parent = Array(n).fill(-1)
  dist[input.source!] = 0
  for (let pass = 1; pass < n; pass++) {
    let changed = false
    for (const e of edges)
      if (dist[e.from] !== Infinity && dist[e.from] + e.weight < dist[e.to]) {
        dist[e.to] = dist[e.from] + e.weight
        parent[e.to] = e.from
        changed = true
        t.add(`Pass ${pass}: relax ${e.from} → ${e.to}.`, graphState(input, [[e.from, e.to]], dist.map(String)), 1)
      }
    if (!changed) break
  }
  const affected = new Set<number>()
  for (const e of edges) if (dist[e.from] !== Infinity && dist[e.from] + e.weight < dist[e.to]) affected.add(e.to)
  for (let pass = 0; pass < n; pass++) for (const e of edges) if (affected.has(e.from)) affected.add(e.to)
  return {
    distances: dist.map((d, v) => (affected.has(v) ? 'negative-cycle affected' : Number.isFinite(d) ? d : 'unreachable')),
    parent,
    negativeCycle: affected.size > 0,
  }
}
export function floydWarshall(input: DaaInput, t: Trace) {
  const n = input.vertices!,
    d = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity)))
  for (const e of arcs(input)) d[e.from][e.to] = Math.min(d[e.from][e.to], e.weight)
  for (let k = 0; k < n; k++)
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        if (d[i][k] + d[k][j] < d[i][j]) {
          d[i][j] = d[i][k] + d[k][j]
          t.add(`Allow intermediate ${k}: d[${i}][${j}] = ${d[i][j]}.`, { table: d.map((r) => r.map((v) => (Number.isFinite(v) ? v : '∞'))) }, 1)
        }
  const cycles = Array.from({ length: n }, (_, i) => i).filter((i) => d[i][i] < 0)
  return {
    distances: d.map((r, i) =>
      r.map((v, j) => (cycles.some((k) => d[i][k] !== Infinity && d[k][j] !== Infinity) ? 'negative-cycle affected' : Number.isFinite(v) ? v : 'unreachable')),
    ),
    negativeCycle: cycles.length > 0,
  }
}
export function kruskal(input: DaaInput, t: Trace) {
  if (input.directed) throw new Error('MST requires an undirected graph.')
  const dsu = new DSU(input.vertices!),
    chosen: number[][] = []
  let weight = 0
  for (const e of [...input.edges!].sort((a, b) => a.weight - b.weight)) {
    const safe = dsu.union(e.from, e.to)
    if (safe) {
      chosen.push([e.from, e.to])
      weight += e.weight
    }
    t.add(
      `${safe ? 'Accept' : 'Reject cycle edge'} ${e.from}—${e.to} (${e.weight}); DSU roots: ${dsu.parent.map((_, i) => dsu.find(i))}.`,
      graphState(input, chosen),
      1,
    )
  }
  return { edges: chosen, weight, components: input.vertices! - chosen.length, spanningTree: chosen.length === input.vertices! - 1 }
}
export function prim(input: DaaInput, t: Trace) {
  if (input.directed) throw new Error('MST requires an undirected graph.')
  const used = new Set<number>(),
    chosen: number[][] = []
  let weight = 0,
    components = 0
  for (let start = 0; start < input.vertices!; start++) {
    if (used.has(start)) continue
    components++
    used.add(start)
    while (true) {
      const edge = arcs(input)
        .filter((e) => used.has(e.from) && !used.has(e.to))
        .sort((a, b) => a.weight - b.weight)[0]
      if (!edge) break
      used.add(edge.to)
      chosen.push([edge.from, edge.to])
      weight += edge.weight
      t.add(`Take the minimum crossing edge ${edge.from}—${edge.to}.`, graphState(input, chosen), 1)
    }
  }
  return { edges: chosen, weight, components, spanningTree: components === 1 }
}
export function topological(input: DaaInput, t: Trace) {
  if (!input.directed) throw new Error('Topological ordering requires a directed graph.')
  const degree = Array(input.vertices!).fill(0),
    order: number[] = [],
    queue: number[] = []
  input.edges!.forEach((e) => degree[e.to]++)
  degree.forEach((d, v) => {
    if (d === 0) queue.push(v)
  })
  while (queue.length) {
    const u = queue.shift()!
    order.push(u)
    for (const e of input.edges!.filter((e) => e.from === u)) if (--degree[e.to] === 0) queue.push(e.to)
    t.add(
      `Remove ${u}; frontier [${queue}].`,
      graphState(
        input,
        [],
        degree.map((d) => `in=${d}`),
      ),
      1,
    )
  }
  return { order, cycle: order.length !== input.vertices! }
}
export function kosaraju(input: DaaInput, t: Trace) {
  if (!input.directed) throw new Error('SCC lesson requires a directed graph.')
  const seen = new Set<number>(),
    order: number[] = [],
    components: number[][] = []
  function dfs(u: number) {
    seen.add(u)
    for (const e of input.edges!.filter((e) => e.from === u)) if (!seen.has(e.to)) dfs(e.to)
    order.push(u)
    t.add(`Finish ${u}.`, graphState(input), 0)
  }
  for (let u = 0; u < input.vertices!; u++) if (!seen.has(u)) dfs(u)
  seen.clear()
  function reverse(u: number, component: number[]) {
    seen.add(u)
    component.push(u)
    for (const e of input.edges!.filter((e) => e.to === u)) if (!seen.has(e.from)) reverse(e.from, component)
  }
  for (const u of order.reverse())
    if (!seen.has(u)) {
      const component: number[] = []
      reverse(u, component)
      components.push(component)
      t.add(
        `Transpose search finds SCC {${component}}.`,
        graphState(
          input,
          [],
          Array.from({ length: input.vertices! }, (_, v) => String(components.findIndex((c) => c.includes(v)))),
        ),
        1,
      )
    }
  return { components }
}
export function multistage(input: DaaInput, t: Trace) {
  const sorted = topological(input, new Trace())
  if (sorted.cycle) throw new Error('Multistage shortest paths require a DAG.')
  const dist = Array(input.vertices!).fill(Infinity),
    parent = Array(input.vertices!).fill(-1)
  dist[input.source!] = 0
  for (const u of sorted.order)
    for (const e of input.edges!.filter((e) => e.from === u))
      if (dist[u] + e.weight < dist[e.to]) {
        dist[e.to] = dist[u] + e.weight
        parent[e.to] = u
        t.add(`Topological DP relaxes ${u} → ${e.to}.`, graphState(input, [[u, e.to]], dist.map(String)), 1)
      }
  return { distances: dist.map((d) => (Number.isFinite(d) ? d : 'unreachable')), parent }
}
export function maxFlow(input: DaaInput, t: Trace) {
  const n = input.vertices!,
    source = input.source!,
    sink = n - 1
  if (!input.directed || source === sink || input.edges!.some((e) => !Number.isInteger(e.weight) || e.weight < 0))
    throw new Error('Use a directed graph with non-negative integer capacities and source different from the last vertex (sink).')
  const r = Array.from({ length: n }, () => Array(n).fill(0))
  input.edges!.forEach((e) => (r[e.from][e.to] += e.weight))
  let flow = 0
  const reachable = new Set<number>()
  while (true) {
    const parent = Array(n).fill(-1),
      queue = [source]
    parent[source] = source
    while (queue.length) {
      const u = queue.shift()!
      for (let v = 0; v < n; v++)
        if (r[u][v] > 0 && parent[v] < 0) {
          parent[v] = u
          queue.push(v)
        }
    }
    if (parent[sink] < 0) {
      parent.forEach((p, v) => {
        if (p >= 0) reachable.add(v)
      })
      break
    }
    let delta = Infinity
    const path: number[][] = []
    for (let v = sink; v !== source; v = parent[v]) delta = Math.min(delta, r[parent[v]][v])
    for (let v = sink; v !== source; v = parent[v]) {
      const u = parent[v]
      r[u][v] -= delta
      r[v][u] += delta
      path.push([u, v])
    }
    flow += delta
    t.add(`BFS augmenting path adds ${delta}; flow = ${flow}. Reverse residual edges allow cancellation.`, { ...graphState(input, path), table: r }, 1)
  }
  const cut = input.edges!.filter((e) => reachable.has(e.from) && !reachable.has(e.to))
  return { flow, minCut: cut, cutCapacity: cut.reduce((s, e) => s + e.weight, 0), sourceSide: [...reachable], residual: r }
}
export function matching(input: DaaInput, t: Trace) {
  if (input.directed) throw new Error('Use an undirected bipartite graph.')
  const n = input.vertices!,
    color = Array(n).fill(-1),
    edges = arcs(input)
  for (let root = 0; root < n; root++)
    if (color[root] < 0) {
      color[root] = 0
      const q = [root]
      while (q.length) {
        const u = q.shift()!
        for (const e of edges.filter((e) => e.from === u)) {
          if (color[e.to] < 0) {
            color[e.to] = 1 - color[u]
            q.push(e.to)
          } else if (color[e.to] === color[u]) throw new Error('Graph is not bipartite.')
        }
      }
    }
  const mate = Array(n).fill(-1)
  function augment(u: number, seen: Set<number>): boolean {
    for (const e of edges.filter((e) => e.from === u))
      if (!seen.has(e.to)) {
        seen.add(e.to)
        if (mate[e.to] < 0 || augment(mate[e.to], seen)) {
          mate[e.to] = u
          return true
        }
      }
    return false
  }
  for (let u = 0; u < n; u++)
    if (color[u] === 0) {
      augment(u, new Set())
      t.add(
        `Search an augmenting path from ${u}.`,
        graphState(
          input,
          mate.flatMap((v, i) => (v < 0 ? [] : [[v, i]])),
        ),
        1,
      )
    }
  return { matching: mate.flatMap((v, i) => (v < 0 ? [] : [[v, i]])) }
}
export function lowlink(input: DaaInput, t: Trace) {
  if (input.directed) throw new Error('Bridges/articulation points require an undirected graph.')
  const n = input.vertices!,
    tin = Array(n).fill(-1),
    low = Array(n).fill(-1),
    bridges: number[][] = [],
    articulation = new Set<number>()
  let timer = 0
  function dfs(u: number, parentEdge: number) {
    tin[u] = low[u] = timer++
    let children = 0
    input.edges!.forEach((e, id) => {
      if (id === parentEdge || (e.from !== u && e.to !== u)) return
      const v = e.from === u ? e.to : e.from
      if (tin[v] >= 0) low[u] = Math.min(low[u], tin[v])
      else {
        dfs(v, id)
        children++
        low[u] = Math.min(low[u], low[v])
        if (low[v] > tin[u]) bridges.push([u, v])
        if (parentEdge >= 0 && low[v] >= tin[u]) articulation.add(u)
      }
    })
    if (parentEdge < 0 && children > 1) articulation.add(u)
    t.add(
      `Finish ${u}: discovery=${tin[u]}, low=${low[u]}.`,
      graphState(
        input,
        bridges,
        tin.map((v, i) => `${v}/${low[i]}`),
      ),
      1,
    )
  }
  for (let u = 0; u < n; u++) if (tin[u] < 0) dfs(u, -1)
  return { bridges, articulation: [...articulation] }
}
export function eulerian(input: DaaInput, t: Trace) {
  if (input.directed) throw new Error('This lesson implements undirected Eulerian trails.')
  const n = input.vertices!,
    degree = Array(n).fill(0)
  input.edges!.forEach((e) => {
    degree[e.from]++
    degree[e.to]++
  })
  const odd = degree.flatMap((d, v) => (d % 2 ? [v] : []))
  if (odd.length !== 0 && odd.length !== 2) return { trail: [], exists: false }
  const used = new Set<number>(),
    stack = [odd[0] ?? degree.findIndex((d) => d > 0)],
    trail: number[] = []
  if (stack[0] < 0) return { trail: [0], exists: true }
  while (stack.length) {
    const u = stack.at(-1)!,
      id = input.edges!.findIndex((e, i) => !used.has(i) && (e.from === u || e.to === u))
    if (id < 0) {
      trail.push(stack.pop()!)
      t.add(`Splice ${u} into reverse trail.`, { values: trail }, 1)
    } else {
      used.add(id)
      const e = input.edges![id]
      stack.push(e.from === u ? e.to : e.from)
    }
  }
  return { trail: used.size === input.edges!.length ? trail.reverse() : [], exists: used.size === input.edges!.length }
}
export function vertexCover(input: DaaInput, t: Trace) {
  if (input.directed) throw new Error('Vertex cover requires an undirected graph.')
  const cover = new Set<number>()
  for (const e of input.edges!)
    if (!cover.has(e.from) && !cover.has(e.to)) {
      cover.add(e.from)
      cover.add(e.to)
      t.add(
        `Take both endpoints ${e.from}, ${e.to} of an uncovered edge.`,
        graphState(
          input,
          [[e.from, e.to]],
          Array.from({ length: input.vertices! }, (_, v) => (cover.has(v) ? 'cover' : '')),
        ),
        1,
      )
    }
  return { cover: [...cover], approximation: 'at most 2 × optimum' }
}
export function metricTsp(input: DaaInput, t: Trace) {
  const n = input.vertices!,
    d = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity)))
  if (input.directed) throw new Error('Metric TSP requires an undirected complete graph.')
  arcs(input).forEach((e) => (d[e.from][e.to] = Math.min(d[e.from][e.to], e.weight)))
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      if (!Number.isFinite(d[i][j]) || d[i][j] < 0) throw new Error('Provide a complete non-negative graph.')
      for (let k = 0; k < n; k++)
        if (d[i][j] > d[i][k] + d[k][j] + 1e-9) throw new Error('Weights must satisfy the triangle inequality for the 2-approximation guarantee.')
    }
  const tree = kruskal(input, t).edges,
    order: number[] = []
  function walk(u: number, parent: number) {
    order.push(u)
    for (const [a, b] of tree) {
      const v = a === u ? b : b === u ? a : -1
      if (v >= 0 && v !== parent) walk(v, u)
    }
  }
  walk(0, -1)
  order.push(0)
  const cost = order.slice(1).reduce((s, v, i) => s + d[order[i]][v], 0)
  t.add(
    'Shortcut the doubled MST walk by preorder; triangle inequality preserves the bound.',
    graphState(
      input,
      order.slice(1).map((v, i) => [order[i], v]),
    ),
    2,
  )
  return { tour: order, cost, approximation: 'at most 2 × optimum' }
}
