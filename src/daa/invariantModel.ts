export const binaryInvariantExample = [4, 8, 12, 16, 23, 28, 31, 34, 37, 42, 45, 51, 56, 62, 78, 91]
export const insertionInvariantExample = [5, 2, 4, 6, 1, 3]
function validateValues(input: number[]) {
  if (!Array.isArray(input) || input.length > 32 || input.some((v) => typeof v !== 'number' || !Number.isFinite(v) || Math.abs(v) > 1e6))
    throw new Error('Use 0–32 finite numbers, each between −1000000 and 1000000.')
}
export function parseInvariantArray(text: string): number[] {
  const trimmed = text.trim()
  if (!trimmed) return []
  let input: unknown
  try {
    input = trimmed.startsWith('[')
      ? JSON.parse(trimmed)
      : trimmed
          .split(/[\s,]+/)
          .filter(Boolean)
          .map(Number)
  } catch {
    throw new Error('Enter a comma-separated number list or a valid JSON array.')
  }
  validateValues(input as number[])
  return input as number[]
}
export type BinaryInvariantFrame = {
  low: number
  high: number
  mid: number | null
  variant: number
  status: 'compare' | 'found' | 'missing'
  result: number | null
  invariantHolds: boolean
  candidates: number[]
  comparisons: number
}
export function binaryInvariantTrace(input: number[], target: number) {
  validateValues(input)
  if (input.some((v, i) => i > 0 && input[i - 1] > v)) throw new Error('Binary search requires a sorted nondecreasing array.')
  if (!Number.isFinite(target) || Math.abs(target) > 1e6) throw new Error('Use a finite target between −1000000 and 1000000.')
  const values = [...input],
    matches = values.flatMap((v, i) => (v === target ? [i] : [])),
    frames: BinaryInvariantFrame[] = []
  let low = 0,
    high = values.length - 1,
    comparisons = 0
  function snapshot(status: BinaryInvariantFrame['status'], mid: number | null, result: number | null) {
    const candidates = values.flatMap((_, i) => (i >= low && i <= high ? [i] : []))
    frames.push({
      low,
      high,
      mid,
      variant: Math.max(0, high - low + 1),
      status,
      result,
      candidates,
      comparisons,
      invariantHolds: !matches.length || status === 'found' || matches.some((i) => i >= low && i <= high),
    })
  }
  while (low <= high) {
    // The upper midpoint reproduces the reference's mid=8 for [0,15]. Both midpoint conventions are correct.
    const mid = low + Math.ceil((high - low) / 2)
    snapshot('compare', mid, null)
    comparisons++
    if (values[mid] === target) {
      snapshot('found', mid, mid)
      return { values, target, frames, result: mid }
    }
    if (values[mid] < target) low = mid + 1
    else high = mid - 1
  }
  snapshot('missing', null, -1)
  return { values, target, frames, result: -1 }
}
export type InsertionInvariantFrame = {
  i: number
  values: number[]
  key: number | null
  moves: string[]
  variant: number
  prefixSorted: boolean
  prefixPermutation: boolean
  wholePermutation: boolean
}
const sortedCopy = (a: number[]) => [...a].sort((a, b) => a - b)
const same = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => v === b[i])
export function insertionInvariantTrace(input: number[]) {
  validateValues(input)
  const original = [...input],
    values = [...input],
    frames: InsertionInvariantFrame[] = []
  function snapshot(i: number, key: number | null, moves: string[]) {
    const prefix = values.slice(0, i)
    frames.push({
      i,
      values: [...values],
      key,
      moves,
      variant: values.length - i,
      prefixSorted: prefix.every((v, j) => !j || prefix[j - 1] <= v),
      prefixPermutation: same(sortedCopy(prefix), sortedCopy(original.slice(0, i))),
      wholePermutation: same(sortedCopy(values), sortedCopy(original)),
    })
  }
  snapshot(0, null, [])
  for (let i = 0; i < values.length; i++) {
    const key = values[i],
      moves = [`Store key = A[${i}] = ${key}.`]
    let j = i - 1
    while (j >= 0 && values[j] > key) {
      moves.push(`Shift ${values[j]} from index ${j} to ${j + 1}.`)
      values[j + 1] = values[j]
      j--
    }
    values[j + 1] = key
    moves.push(`Place key ${key} at index ${j + 1}; the prefix [0, ${i + 1}) is sorted.`)
    snapshot(i + 1, key, moves)
  }
  return { original, frames, result: [...values] }
}
export function inductionSumExample(k: number) {
  if (!Number.isInteger(k) || k < 0 || k > 1000) throw new Error('Choose an integer k from 0 to 1000.')
  const assumed = (k * (k + 1)) / 2,
    next = assumed + k + 1,
    formula = ((k + 1) * (k + 2)) / 2
  return { k, base: 0, assumed, next, formula, holds: next === formula }
}
