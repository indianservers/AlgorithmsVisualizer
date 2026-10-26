export type ClosestPoint = { id: number; x: number; y: number }
export type ClosestPair = { a: ClosestPoint; b: ClosestPoint; distance: number }
export type ClosestNode = {
  id: string
  points: ClosestPoint[]
  middle: number
  left?: ClosestNode
  right?: ClosestNode
  pair: ClosestPair | null
  strip: ClosestPoint[]
  delta: number
}
export type ClosestCheck = { a: ClosestPoint; b: ClosestPoint; distance: number; gap: number; checked: boolean; event: number | null }
export type ClosestFrame = {
  node: string
  stage: 'base' | 'combine' | 'strip' | 'complete'
  pair: ClosestPair | null
  compared: ClosestPair | null
  strip: ClosestPoint[]
  delta: number
  message: string
}
export const closestExample: [number, number][] = [
  [3, 81],
  [7, 18],
  [10, 91],
  [14, 97],
  [15, 10],
  [20, 21],
  [45, 32],
  [46, 40],
  [48, 62],
  [48, 70],
  [52, 48],
  [53, 20],
  [54, 59],
  [55, 89],
  [57, 51],
  [61, 78],
  [67, 68],
  [77, 27],
  [90, 48],
  [97, 11],
]
export function validateClosestPoints(data: unknown): asserts data is [number, number][] {
  if (
    !Array.isArray(data) ||
    data.length < 1 ||
    data.length > 40 ||
    data.some((p) => !Array.isArray(p) || p.length !== 2 || p.some((v) => typeof v !== 'number' || !Number.isFinite(v) || Math.abs(v) > 1000))
  )
    throw new Error('Enter 1–40 [x, y] pairs with finite coordinates between −1000 and 1000.')
}
export function parseClosestPoints(text: string): [number, number][] {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    throw new Error('Enter a valid JSON array of [x, y] coordinate pairs.')
  }
  validateClosestPoints(value)
  return value
}
export function pointDistance(a: ClosestPoint, b: ClosestPoint): ClosestPair {
  return { a, b, distance: Math.hypot(a.x - b.x, a.y - b.y) }
}
export function runClosestLesson(data: [number, number][]) {
  validateClosestPoints(data)
  const points = data.map(([x, y], id) => ({ x, y, id })),
    nodes: ClosestNode[] = [],
    frames: ClosestFrame[] = [],
    checks: Record<string, ClosestCheck[]> = {}
  function solve(ordered: ClosestPoint[], path: string): ClosestNode {
    const middle = ordered.length > 1 ? (ordered[Math.floor(ordered.length / 2) - 1].x + ordered[Math.floor(ordered.length / 2)].x) / 2 : ordered[0].x,
      node: ClosestNode = { id: path, points: ordered, middle, pair: null, strip: [], delta: Infinity }
    nodes.push(node)
    checks[path] = []
    if (ordered.length <= 3) {
      for (let i = 0; i < ordered.length; i++)
        for (let j = i + 1; j < ordered.length; j++) {
          const compared = pointDistance(ordered[i], ordered[j])
          if (!node.pair || compared.distance < node.pair.distance) node.pair = compared
          frames.push({
            node: path,
            stage: 'base',
            pair: node.pair,
            compared,
            strip: [],
            delta: Infinity,
            message: `Compare points ${compared.a.id} and ${compared.b.id} in a base case.`,
          })
        }
      frames.push({
        node: path,
        stage: 'complete',
        pair: node.pair,
        compared: null,
        strip: [],
        delta: Infinity,
        message: ordered.length < 2 ? 'One point has no pair.' : 'The base-case closest pair is known.',
      })
      return node
    }
    const mid = Math.floor(ordered.length / 2)
    node.left = solve(ordered.slice(0, mid), path + 'L')
    node.right = solve(ordered.slice(mid), path + 'R')
    node.pair = !node.left.pair
      ? node.right.pair
      : !node.right.pair
        ? node.left.pair
        : node.left.pair.distance <= node.right.pair.distance
          ? node.left.pair
          : node.right.pair
    node.delta = node.pair?.distance ?? Infinity
    node.strip = ordered.filter((p) => Math.abs(p.x - middle) < node.delta).sort((a, b) => a.y - b.y || a.x - b.x || a.id - b.id)
    frames.push({
      node: path,
      stage: 'combine',
      pair: node.pair,
      compared: null,
      strip: node.strip,
      delta: node.delta,
      message: 'Both halves are solved. Inspect the y-sorted strip using the smaller half distance.',
    })
    for (let i = 0; i < node.strip.length; i++)
      for (let j = i + 1; j < node.strip.length && j <= i + 7; j++) {
        const a = node.strip[i],
          b = node.strip[j],
          gap = b.y - a.y,
          distance = Math.hypot(a.x - b.x, a.y - b.y),
          checked = gap < (node.pair?.distance ?? Infinity),
          event = checked ? frames.length : null
        checks[path].push({ a, b, distance, gap, checked, event })
        if (!checked) break
        const compared = pointDistance(a, b)
        if (!node.pair || compared.distance < node.pair.distance) node.pair = compared
        frames.push({
          node: path,
          stage: 'strip',
          pair: node.pair,
          compared,
          strip: node.strip,
          delta: node.delta,
          message: `Strip comparison: points ${a.id} and ${b.id}, distance ${distance.toFixed(2)}.`,
        })
      }
    frames.push({
      node: path,
      stage: 'complete',
      pair: node.pair,
      compared: null,
      strip: node.strip,
      delta: node.delta,
      message: 'This subproblem is complete. No closer eligible strip pair remains.',
    })
    return node
  }
  const root = solve(
      [...points].sort((a, b) => a.x - b.x || a.y - b.y || a.id - b.id),
      'P',
    ),
    rootFrames = frames.flatMap((f, i) => (f.node === 'P' ? [i] : [])),
    defaultCursor = frames.findIndex((f) => f.node === 'P' && f.stage === 'combine')
  return { points, nodes, frames, checks, root, rootFrames, defaultCursor: defaultCursor < 0 ? frames.length - 1 : defaultCursor, pair: root.pair }
}
export type ClosestRun = ReturnType<typeof runClosestLesson>
