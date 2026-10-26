export type InversionItem = { value: number; index: number }
export type InversionPair = { left: InversionItem; right: InversionItem; event: number; mergeStep: number; node: string }
export type InversionNode = { id: string; lo: number; hi: number; left?: InversionNode; right?: InversionNode; sorted: InversionItem[]; count: number }
export type InversionFrame = {
  node: string
  lo: number
  hi: number
  left: InversionItem[]
  right: InversionItem[]
  i: number
  j: number
  output: InversionItem[]
  added: InversionPair[]
  count: number
  ledger: InversionPair[]
  comparison: string
  take: 'left' | 'right'
}
export const inversionExample = [1, 3, 5, 8, 2, 4, 6, 7]
export function validateInversionValues(values: unknown): asserts values is number[] {
  if (
    !Array.isArray(values) ||
    values.length < 1 ||
    values.length > 20 ||
    values.some((v) => typeof v !== 'number' || !Number.isFinite(v) || Math.abs(v) > 1e6)
  )
    throw new Error('Enter 1–20 finite numbers between −1000000 and 1000000.')
}
export function parseInversionValues(text: string): number[] {
  const trimmed = text.trim()
  if (!trimmed) throw new Error('Enter 1–20 finite numbers.')
  let values: unknown
  try {
    values = trimmed.startsWith('[')
      ? JSON.parse(trimmed)
      : trimmed
          .split(/[\s,]+/)
          .filter(Boolean)
          .map(Number)
  } catch {
    throw new Error('Enter a comma-separated number list or a valid JSON array.')
  }
  validateInversionValues(values)
  return values
}
export function runInversionLesson(input: number[]) {
  validateInversionValues(input)
  const values = [...input],
    frames: InversionFrame[] = [],
    nodes: InversionNode[] = [],
    ledger: InversionPair[] = []
  function solve(lo: number, hi: number): InversionNode {
    const id = `${lo}:${hi}`
    if (lo === hi) {
      const node = { id, lo, hi, sorted: [{ value: values[lo], index: lo }], count: 0 }
      nodes.push(node)
      return node
    }
    const mid = Math.floor((lo + hi) / 2),
      left = solve(lo, mid),
      right = solve(mid + 1, hi),
      output: InversionItem[] = []
    let i = 0,
      j = 0,
      cross = 0
    while (i < left.sorted.length || j < right.sorted.length) {
      const a = left.sorted[i],
        b = right.sorted[j],
        beforeI = i,
        beforeJ = j,
        added: InversionPair[] = [],
        takeRight = b !== undefined && (a === undefined || b.value < a.value),
        comparison = a && b ? `${a.value} ${takeRight ? '>' : '≤'} ${b.value}` : a ? 'Copy remaining left value' : 'Copy remaining right value'
      if (takeRight) {
        if (a) {
          for (const item of left.sorted.slice(i)) added.push({ left: item, right: b, event: frames.length, mergeStep: output.length + 1, node: id })
          ledger.push(...added)
          cross += added.length
        }
        output.push(b)
        j++
      } else {
        output.push(a)
        i++
      }
      frames.push({
        node: id,
        lo,
        hi,
        left: left.sorted,
        right: right.sorted,
        i: beforeI,
        j: beforeJ,
        output: [...output],
        added,
        count: ledger.length,
        ledger: [...ledger],
        comparison,
        take: takeRight ? 'right' : 'left',
      })
    }
    const node = { id, lo, hi, left, right, sorted: output, count: left.count + right.count + cross }
    nodes.push(node)
    return node
  }
  const root = solve(0, values.length - 1),
    rootFrames = frames.flatMap((f, i) => (f.node === root.id ? [i] : [])),
    defaultCursor = rootFrames[Math.min(1, rootFrames.length - 1)] ?? -1
  return { values, root, nodes, frames, pairs: ledger, rootFrames, defaultCursor, sorted: root.sorted.map((item) => item.value), count: root.count }
}
export type InversionRun = ReturnType<typeof runInversionLesson>
