export type QuickItem = { id: number; value: number }
export type QuickNode = {
  id: string
  lo: number
  hi: number
  pivot: QuickItem | null
  pivotIndex: number
  lt: number
  gt: number
  left?: QuickNode
  right?: QuickNode
}
export type QuickFrame = {
  node: string
  kind: 'choose' | 'partition' | 'base' | 'complete'
  lo: number
  hi: number
  array: QuickItem[]
  pivot: QuickItem | null
  pivotIndex: number
  less: QuickItem[]
  equal: QuickItem[]
  greater: QuickItem[]
  lt: number
  gt: number
  comparisons: number
  swaps: number
  sorted: number[]
}
export const randomQuickExample = [7, 2, 9, 4, 3, 8, 1, 6, 5]
export function parseQuickSeed(text: string) {
  if (!/^\d+$/.test(text.trim()) || !Number.isSafeInteger(Number(text)) || Number(text) > 4294967295)
    throw new Error('Use an integer seed from 0 to 4294967295.')
  return Number(text)
}
export function parseQuickValues(text: string): number[] {
  let values: unknown
  const t = text.trim()
  if (!t) throw new Error('Enter 1–20 finite numbers.')
  try {
    values = t.startsWith('[')
      ? JSON.parse(t)
      : t
          .split(/[\s,]+/)
          .filter(Boolean)
          .map(Number)
  } catch {
    throw new Error('Enter a comma-separated number list or a valid JSON array.')
  }
  validateQuickValues(values)
  return values
}
function validateQuickValues(values: unknown): asserts values is number[] {
  if (
    !Array.isArray(values) ||
    values.length < 1 ||
    values.length > 20 ||
    values.some((v) => typeof v !== 'number' || !Number.isFinite(v) || Math.abs(v) > 1e6)
  )
    throw new Error('Enter 1–20 finite numbers between −1000000 and 1000000.')
}
// Mulberry32 with one initialization draw discarded. The warm-up is part of the seed contract.
export function seededQuickRandom(seed: number) {
  let state = parseQuickSeed(String(seed))
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  next()
  return next
}
export function shuffleQuickValues(values: number[], seed: number) {
  validateQuickValues(values)
  const shuffled = [...values],
    random = seededQuickRandom(seed)
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
export function runRandomQuickLesson(values: number[], seed: number) {
  validateQuickValues(values)
  const random = seededQuickRandom(seed),
    array = values.map((value, id) => ({ value, id })),
    nodes: QuickNode[] = [],
    frames: QuickFrame[] = [],
    sorted = new Set<number>()
  let comparisons = 0,
    swaps = 0
  function swap(a: number, b: number) {
    if (a !== b) {
      ;[array[a], array[b]] = [array[b], array[a]]
      swaps++
    }
  }
  function snapshot(node: QuickNode, kind: QuickFrame['kind']) {
    const part = array.slice(node.lo, node.hi + 1),
      pivot = node.pivot
    frames.push({
      node: node.id,
      kind,
      lo: node.lo,
      hi: node.hi,
      array: [...array],
      pivot,
      pivotIndex: node.pivotIndex,
      less: pivot ? part.filter((p) => p.value < pivot.value) : [],
      equal: pivot ? part.filter((p) => p.value === pivot.value) : part,
      greater: pivot ? part.filter((p) => p.value > pivot.value) : [],
      lt: node.lt,
      gt: node.gt,
      comparisons,
      swaps,
      sorted: [...sorted].sort((a, b) => a - b),
    })
  }
  function solve(lo: number, hi: number, id: string): QuickNode | undefined {
    if (lo > hi) return undefined
    const node: QuickNode = { id, lo, hi, pivot: null, pivotIndex: lo, lt: lo, gt: hi }
    nodes.push(node)
    if (lo === hi) {
      sorted.add(lo)
      snapshot(node, 'base')
      return node
    }
    node.pivotIndex = lo + Math.floor(random() * (hi - lo + 1))
    node.pivot = array[node.pivotIndex]
    const part = array.slice(lo, hi + 1),
      lessCount = part.filter((p) => p.value < node.pivot!.value).length,
      equalCount = part.filter((p) => p.value === node.pivot!.value).length
    node.lt = lo + lessCount
    node.gt = node.lt + equalCount - 1
    snapshot(node, 'choose')
    let lt = lo,
      i = lo,
      gt = hi
    while (i <= gt) {
      comparisons++
      if (array[i].value < node.pivot.value) {
        swap(i, lt)
        i++
        lt++
      } else {
        comparisons++
        if (array[i].value > node.pivot.value) {
          swap(i, gt)
          gt--
        } else i++
      }
    }
    node.lt = lt
    node.gt = gt
    for (let k = lt; k <= gt; k++) sorted.add(k)
    snapshot(node, 'partition')
    node.left = solve(lo, lt - 1, id + 'L')
    node.right = solve(gt + 1, hi, id + 'R')
    snapshot(node, 'complete')
    return node
  }
  const root = solve(0, array.length - 1, 'P')!
  return { values: [...values], seed, root, nodes, frames, sorted: array.map((p) => p.value), comparisons, swaps, defaultCursor: 0 }
}
export type RandomQuickRun = ReturnType<typeof runRandomQuickLesson>
