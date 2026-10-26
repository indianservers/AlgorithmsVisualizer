export type FlowEdge = { from: number; to: number; capacity: number }
export type FlowNetwork = { vertices: number; source: number; sink: number; edges: FlowEdge[] }
export type ResidualArc = { from: number; to: number; capacity: number; edge: number; reverse: boolean }
export type FlowFrame = {
  flow: number[]
  value: number
  residual: ResidualArc[]
  path: ResidualArc[]
  bottleneck: number
  reached: number[]
  parent: number[]
  order: number[]
}
export const flowExample: FlowNetwork = {
  vertices: 6,
  source: 0,
  sink: 5,
  edges: [
    { from: 0, to: 1, capacity: 16 },
    { from: 0, to: 3, capacity: 13 },
    { from: 1, to: 2, capacity: 6 },
    { from: 1, to: 3, capacity: 4 },
    { from: 4, to: 2, capacity: 14 },
    { from: 2, to: 5, capacity: 6 },
    { from: 3, to: 4, capacity: 5 },
    { from: 4, to: 5, capacity: 5 },
  ],
}
export const flowClassic: FlowNetwork = {
  vertices: 6,
  source: 0,
  sink: 5,
  edges: [
    { from: 0, to: 1, capacity: 16 },
    { from: 0, to: 3, capacity: 13 },
    { from: 1, to: 3, capacity: 10 },
    { from: 3, to: 1, capacity: 4 },
    { from: 1, to: 2, capacity: 12 },
    { from: 2, to: 3, capacity: 9 },
    { from: 3, to: 4, capacity: 14 },
    { from: 4, to: 2, capacity: 7 },
    { from: 2, to: 5, capacity: 20 },
    { from: 4, to: 5, capacity: 4 },
  ],
}
// The second BFS path cancels 1→2 from the first augmentation.
export const flowCancellation: FlowNetwork = {
  vertices: 6,
  source: 0,
  sink: 5,
  edges: [
    { from: 0, to: 1, capacity: 1 },
    { from: 1, to: 2, capacity: 1 },
    { from: 2, to: 5, capacity: 1 },
    { from: 0, to: 3, capacity: 1 },
    { from: 3, to: 2, capacity: 1 },
    { from: 1, to: 4, capacity: 1 },
    { from: 4, to: 5, capacity: 1 },
  ],
}
export function validateFlowNetwork(network: FlowNetwork) {
  const { vertices: n, source, sink, edges } = network
  if (!Number.isInteger(n) || n < 2 || n > 8) throw new Error('Use 2–8 vertices.')
  if (![source, sink].every((v) => Number.isInteger(v) && v >= 0 && v < n) || source === sink)
    throw new Error('Choose distinct source and sink vertices within the network.')
  if (!Array.isArray(edges) || edges.length > n * (n - 1)) throw new Error('Use at most one edge for each directed pair.')
  const seen = new Set<string>()
  for (const edge of edges) {
    if (!edge || typeof edge !== 'object') throw new Error('Each edge must contain from, to and capacity.')
    if (![edge.from, edge.to].every((v) => Number.isInteger(v) && v >= 0 && v < n) || edge.from === edge.to)
      throw new Error('Edge endpoints must be distinct vertex indices within the network.')
    if (!Number.isInteger(edge.capacity) || edge.capacity < 0 || edge.capacity > 1000) throw new Error('Capacities must be integers from 0 to 1000.')
    const key = `${edge.from}:${edge.to}`
    if (seen.has(key)) throw new Error('Duplicate directed edges are not supported. Combine their capacities.')
    seen.add(key)
  }
}
export function parseFlowNetwork(text: string): FlowNetwork {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    throw new Error('Enter a valid JSON network with vertices, source, sink and edges.')
  }
  if (!value || typeof value !== 'object') throw new Error('Enter a network object.')
  const network = value as FlowNetwork
  validateFlowNetwork(network)
  return network
}
export function residualFlowArcs(network: FlowNetwork, flow: number[]): ResidualArc[] {
  const arcs: ResidualArc[] = []
  network.edges.forEach((edge, i) => {
    if (edge.capacity > flow[i]) arcs.push({ from: edge.from, to: edge.to, capacity: edge.capacity - flow[i], edge: i, reverse: false })
    if (flow[i] > 0) arcs.push({ from: edge.to, to: edge.from, capacity: flow[i], edge: i, reverse: true })
  })
  return arcs
}
export function verifyFlow(network: FlowNetwork, flow: number[]) {
  if (flow.length !== network.edges.length || flow.some((f, i) => !Number.isFinite(f) || f < 0 || f > network.edges[i].capacity))
    return { valid: false, value: 0, balance: [] as number[] }
  const balance = Array<number>(network.vertices).fill(0)
  network.edges.forEach((e, i) => {
    balance[e.from] -= flow[i]
    balance[e.to] += flow[i]
  })
  const value = -balance[network.source] || 0
  return {
    valid: value >= 0 && balance[network.sink] === value && balance.every((v, i) => i === network.source || i === network.sink || v === 0),
    value,
    balance,
  }
}
export function runEdmondsKarp(input: FlowNetwork) {
  validateFlowNetwork(input)
  const network = structuredClone(input),
    frames: FlowFrame[] = [],
    flow = network.edges.map(() => 0)
  while (true) {
    const residual = residualFlowArcs(network, flow),
      adjacency = Array.from({ length: network.vertices }, () => [] as ResidualArc[]),
      reached = new Set([network.source]),
      order = [network.source],
      parent = Array<number>(network.vertices).fill(-1),
      parentArc = Array<ResidualArc | undefined>(network.vertices)
    residual.forEach((arc) => adjacency[arc.from].push(arc))
    for (let at = 0; at < order.length; at++)
      for (const arc of adjacency[order[at]])
        if (!reached.has(arc.to)) {
          reached.add(arc.to)
          order.push(arc.to)
          parent[arc.to] = arc.from
          parentArc[arc.to] = arc
        }
    const path: ResidualArc[] = []
    if (reached.has(network.sink))
      for (let v = network.sink; v !== network.source; ) {
        const arc = parentArc[v]!
        path.unshift(arc)
        v = arc.from
      }
    const bottleneck = path.length ? Math.min(...path.map((arc) => arc.capacity)) : 0
    frames.push({
      flow: [...flow],
      value: verifyFlow(network, flow).value,
      residual,
      path,
      bottleneck,
      reached: [...reached].sort((a, b) => a - b),
      parent,
      order,
    })
    if (!path.length) break
    for (const arc of path) flow[arc.edge] += arc.reverse ? -bottleneck : bottleneck
  }
  const final = frames.at(-1)!,
    cutEdges = network.edges.flatMap((edge, i) => (final.reached.includes(edge.from) && !final.reached.includes(edge.to) ? [i] : [])),
    cutCapacity = cutEdges.reduce((sum, i) => sum + network.edges[i].capacity, 0)
  return { network, frames, final, maximum: final.value, cutEdges, cutCapacity, augmentations: frames.length - 1 }
}
export type FlowRun = ReturnType<typeof runEdmondsKarp>
export const flowVertexLabel = (network: FlowNetwork, vertex: number) => (vertex === network.source ? 'S' : vertex === network.sink ? 'T' : String(vertex))
export function flowPathLabel(network: FlowNetwork, path: ResidualArc[]) {
  return path.length ? [path[0].from, ...path.map((a) => a.to)].map((v) => flowVertexLabel(network, v)).join(' → ') : 'No augmenting path'
}
