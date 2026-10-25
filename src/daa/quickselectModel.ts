export type QuickPivot = 'last' | 'first' | 'middle' | 'random'
export type QuickFrame = {
  values: number[]
  rank: number
  pivot: number
  pivotIndex: number
  lower: number[]
  equal: number[]
  upper: number[]
  branch: 'left' | 'equal' | 'right'
  nextRank: number
  found?: number
  message: string
}
export const quickReferenceValues = [7, 10, 4, 3, 20, 15]
export function quickTrace(values: number[], rank: number, pivotMode: QuickPivot = 'last', seed = 42) {
  if (!values.length || values.length > 60 || values.some((v) => !Number.isFinite(v) || Math.abs(v) > 1e6))
    throw new Error('Use 1–60 finite values, each with magnitude at most 1,000,000.')
  if (!Number.isSafeInteger(rank) || rank < 1 || rank > values.length) throw new Error('Rank k must be an integer from 1 through the dataset length.')
  if (!['last', 'first', 'middle', 'random'].includes(pivotMode)) throw new Error('Choose a valid pivot strategy.')
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 4294967295) throw new Error('Seed must be an integer from 0 through 4,294,967,295.')
  const frames: QuickFrame[] = []
  let current = [...values],
    k = rank,
    state = seed >>> 0
  while (true) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    const pivot =
      current[
        pivotMode === 'first'
          ? 0
          : pivotMode === 'middle'
            ? Math.floor(current.length / 2)
            : pivotMode === 'random'
              ? Math.floor((state / 4294967296) * current.length)
              : current.length - 1
      ]
    const lower = current.filter((v) => v < pivot),
      equal = current.filter((v) => v === pivot),
      upper = current.filter((v) => v > pivot),
      branch = k <= lower.length ? 'left' : k <= lower.length + equal.length ? 'equal' : 'right',
      nextRank = branch === 'right' ? k - lower.length - equal.length : k
    const next = branch === 'left' ? lower : upper,
      found = branch === 'equal' ? pivot : next.length === 1 ? next[0] : undefined
    const message =
      found !== undefined
        ? `Found answer: ${found}. ${branch === 'equal' ? 'The requested rank lies in the equal block.' : 'The retained subarray is a singleton.'}`
        : branch === 'left'
          ? `k = ${k} ≤ ${lower.length}: recurse left with k = ${k}.`
          : `k = ${k} > ${lower.length + equal.length}: recurse right with k = ${nextRank}.`
    frames.push({ values: [...current], rank: k, pivot, pivotIndex: lower.length, lower, equal, upper, branch, nextRank, found, message })
    if (found !== undefined) return { answer: found, frames, pivotMode, seed, values: [...values], rank }
    current = next
    k = nextRank
  }
}
