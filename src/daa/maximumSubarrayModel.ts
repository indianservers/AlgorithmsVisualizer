export type Subarray = { start: number; end: number; sum: number }
export type CrossingScan = Subarray & { side: 'suffix' | 'prefix'; best: Subarray }
export type MaximumNode = {
  id: string
  lo: number
  hi: number
  mid: number
  best: Subarray
  left?: MaximumNode
  right?: MaximumNode
  crossing?: Subarray
  scans: CrossingScan[]
}
export type MaximumFrame = { nodeId: string; phase: 'split' | 'base' | 'suffix' | 'prefix' | 'combine'; scan?: number }
export const maximumExample = [2, -1, 3, -4, 5, -1, 2, -1]
/** Prefer a greater sum, then a shorter range, then an earlier range. Empty ranges are never candidates. */
export function betterSubarray(a: Subarray, b: Subarray): Subarray {
  return a.sum > b.sum || (a.sum === b.sum && (a.end - a.start < b.end - b.start || (a.end - a.start === b.end - b.start && a.start <= b.start))) ? a : b
}
export function parseMaximumValues(text: string): number[] {
  const trimmed = text.trim()
  if (!trimmed) throw new Error('Enter between 1 and 32 finite numbers.')
  let values: unknown
  try {
    values = trimmed.startsWith('[')
      ? JSON.parse(trimmed)
      : trimmed
          .split(/[\s,]+/)
          .filter(Boolean)
          .map(Number)
  } catch {
    throw new Error('Enter a number list or a valid JSON array.')
  }
  validateValues(values)
  return values
}
function validateValues(values: unknown): asserts values is number[] {
  if (
    !Array.isArray(values) ||
    values.length < 1 ||
    values.length > 32 ||
    values.some((v) => typeof v !== 'number' || !Number.isFinite(v) || Math.abs(v) > 1e6)
  )
    throw new Error('Enter between 1 and 32 finite numbers, each from −1000000 to 1000000.')
}
export function maximumSubarrayTrace(input: number[]) {
  validateValues(input)
  const values = [...input],
    frames: MaximumFrame[] = [],
    nodes: MaximumNode[] = []
  function solve(lo: number, hi: number): MaximumNode {
    const id = `${lo}:${hi}`,
      mid = Math.floor((lo + hi) / 2)
    if (lo === hi) {
      const node: MaximumNode = { id, lo, hi, mid, best: { start: lo, end: hi, sum: values[lo] }, scans: [] }
      nodes.push(node)
      frames.push({ nodeId: id, phase: 'base' })
      return node
    }
    frames.push({ nodeId: id, phase: 'split' })
    const left = solve(lo, mid),
      right = solve(mid + 1, hi),
      scans: CrossingScan[] = []
    let sum = 0,
      suffix: Subarray | undefined
    for (let i = mid; i >= lo; i--) {
      sum += values[i]
      const candidate = { start: i, end: mid, sum }
      suffix = suffix ? betterSubarray(suffix, candidate) : candidate
      scans.push({ ...candidate, side: 'suffix', best: { ...suffix } })
      frames.push({ nodeId: id, phase: 'suffix', scan: scans.length - 1 })
    }
    sum = 0
    let prefix: Subarray | undefined
    for (let i = mid + 1; i <= hi; i++) {
      sum += values[i]
      const candidate = { start: mid + 1, end: i, sum }
      prefix = prefix ? betterSubarray(prefix, candidate) : candidate
      scans.push({ ...candidate, side: 'prefix', best: { ...prefix } })
      frames.push({ nodeId: id, phase: 'prefix', scan: scans.length - 1 })
    }
    const crossing = { start: suffix!.start, end: prefix!.end, sum: suffix!.sum + prefix!.sum }
    const best = betterSubarray(betterSubarray(left.best, right.best), crossing)
    const node: MaximumNode = { id, lo, hi, mid, left, right, crossing, best, scans }
    nodes.push(node)
    frames.push({ nodeId: id, phase: 'combine' })
    return node
  }
  const root = solve(0, values.length - 1)
  return { values, root, nodes, frames }
}
export type MaximumRun = ReturnType<typeof maximumSubarrayTrace>
