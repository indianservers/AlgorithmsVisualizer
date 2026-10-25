export type MinMaxNode = {
  id: string
  lo: number
  hi: number
  mid: number
  min: number
  max: number
  comparisons: number
  left?: MinMaxNode
  right?: MinMaxNode
}
export type MinMaxFrame = {
  nodeId: string
  phase: 'split' | 'singleton' | 'pair' | 'minimum' | 'maximum' | 'return'
  comparisons: number
  stack: string[]
  operands?: [number, number]
  result?: number
}
export const minMaxExample = [8, 3, 12, 4, 6, 2, 10, 5]
function validateMinMaxValues(values: unknown): asserts values is number[] {
  if (
    !Array.isArray(values) ||
    values.length < 1 ||
    values.length > 20 ||
    values.some((v) => typeof v !== 'number' || !Number.isFinite(v) || Math.abs(v) > 1e6)
  )
    throw new Error('Enter 1–20 finite numbers, each between −1000000 and 1000000.')
}
export function parseMinMaxValues(text: string): number[] {
  const value = text.trim()
  if (!value) throw new Error('Enter 1–20 finite numbers.')
  let values: unknown
  try {
    values = value.startsWith('[')
      ? JSON.parse(value)
      : value
          .split(/[\s,]+/)
          .filter(Boolean)
          .map(Number)
  } catch {
    throw new Error('Enter a number list or a valid JSON array.')
  }
  validateMinMaxValues(values)
  return values
}
export function minMaxTrace(input: number[]) {
  validateMinMaxValues(input)
  const values = [...input],
    nodes: MinMaxNode[] = [],
    frames: MinMaxFrame[] = []
  let comparisons = 0
  function solve(lo: number, hi: number, ancestors: string[]): MinMaxNode {
    const id = `${lo}:${hi}`,
      mid = Math.floor((lo + hi) / 2),
      stack = [...ancestors, id],
      before = comparisons
    if (lo === hi) {
      const node = { id, lo, hi, mid, min: values[lo], max: values[lo], comparisons: 0 }
      nodes.push(node)
      frames.push({ nodeId: id, phase: 'singleton', comparisons, stack, result: values[lo] })
      return node
    }
    if (hi === lo + 1) {
      comparisons++
      const less = values[lo] <= values[hi],
        node = { id, lo, hi, mid, min: less ? values[lo] : values[hi], max: less ? values[hi] : values[lo], comparisons: 1 }
      nodes.push(node)
      frames.push({ nodeId: id, phase: 'pair', comparisons, stack, operands: [values[lo], values[hi]] })
      return node
    }
    frames.push({ nodeId: id, phase: 'split', comparisons, stack })
    const left = solve(lo, mid, stack),
      right = solve(mid + 1, hi, stack)
    comparisons++
    const min = left.min <= right.min ? left.min : right.min
    frames.push({ nodeId: id, phase: 'minimum', comparisons, stack, operands: [left.min, right.min], result: min })
    comparisons++
    const max = left.max >= right.max ? left.max : right.max
    frames.push({ nodeId: id, phase: 'maximum', comparisons, stack, operands: [left.max, right.max], result: max })
    const node = { id, lo, hi, mid, min, max, left, right, comparisons: comparisons - before }
    nodes.push(node)
    frames.push({ nodeId: id, phase: 'return', comparisons, stack })
    return node
  }
  const root = solve(0, values.length - 1, [])
  return { values, root, nodes, frames, comparisons }
}
export type MinMaxRun = ReturnType<typeof minMaxTrace>
