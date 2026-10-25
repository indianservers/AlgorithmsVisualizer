export type MedianFrame = {
  phase: 'groups' | 'sort' | 'base' | 'pivot' | 'partition' | 'recurse' | 'answer'
  values: number[]
  rank: number
  depth: number
  purpose: 'selection' | 'pivot'
  groups: number[][]
  sorted: number[][]
  medians: number[]
  pivot?: number
  lower?: number[]
  equal?: number[]
  upper?: number[]
  branch?: 'left' | 'equal' | 'right'
  message: string
}
export const medianReferenceValues = [7, 2, 9, 4, 5, 12, 3, 8, 6, 1, 11, 13, 0, 10, 14, 15, 17, 16, 20, 18, 19]
export const medianGroups = (values: number[]) => Array.from({ length: Math.ceil(values.length / 5) }, (_, i) => values.slice(i * 5, i * 5 + 5))
export function medianTrace(values: number[], rank: number) {
  if (!values.length || values.length > 60 || values.some((v) => !Number.isFinite(v) || Math.abs(v) > 1e6))
    throw new Error('Use 1–60 finite values, each with magnitude at most 1,000,000.')
  if (!Number.isSafeInteger(rank) || rank < 1 || rank > values.length) throw new Error('Selection rank k must be an integer from 1 through the dataset length.')
  const frames: MedianFrame[] = []
  function solve(a: number[], k: number, depth: number, purpose: MedianFrame['purpose']): number {
    const groups = medianGroups(a),
      sorted = groups.map((g) => [...g].sort((x, y) => x - y)),
      medians = sorted.map((g) => g[Math.floor(g.length / 2)])
    const base = { values: a, rank: k, depth, purpose, groups, sorted, medians }
    const emit = (frame: Partial<MedianFrame> & Pick<MedianFrame, 'phase' | 'message'>) => frames.push(structuredClone({ ...base, ...frame }))
    emit({
      phase: 'groups',
      message: `Split ${a.length} values into ${groups.length} group(s) of at most five${purpose === 'pivot' ? ' to select the pivot recursively' : ''}.`,
    })
    emit({ phase: 'sort', message: `Sort each small group. Group medians: [${medians.join(', ')}].` })
    if (a.length <= 5) {
      const value = sorted[0][k - 1]
      emit({ phase: 'base', pivot: value, message: `Base case: sorted [${sorted[0].join(', ')}], rank ${k} gives ${value}.` })
      return value
    }
    const pivot = solve(medians, Math.ceil(medians.length / 2), depth + 1, 'pivot')
    emit({ phase: 'pivot', pivot, message: `Recursively select the median of [${medians.join(', ')}]: pivot = ${pivot}.` })
    const lower = a.filter((v) => v < pivot),
      equal = a.filter((v) => v === pivot),
      upper = a.filter((v) => v > pivot),
      partition = { pivot, lower, equal, upper }
    emit({
      phase: 'partition',
      ...partition,
      message: `Three-way partition: |L|=${lower.length}, |E|=${equal.length}, |R|=${upper.length}. Compare one-based rank ${k}.`,
    })
    const branch = k <= lower.length ? 'left' : k <= lower.length + equal.length ? 'equal' : 'right'
    emit({
      phase: 'recurse',
      ...partition,
      branch,
      message:
        branch === 'left'
          ? `Rank ${k} ≤ ${lower.length}: recurse on L with the same rank.`
          : branch === 'equal'
            ? `${lower.length} < rank ${k} ≤ ${lower.length + equal.length}: return pivot ${pivot}.`
            : `Rank ${k} > ${lower.length + equal.length}: recurse on R with rank ${k - lower.length - equal.length}.`,
    })
    if (branch === 'equal') return pivot
    return solve(branch === 'left' ? lower : upper, branch === 'left' ? k : k - lower.length - equal.length, depth + 1, 'selection')
  }
  const answer = solve([...values], rank, 0, 'selection')
  frames.push({
    ...structuredClone(frames.find((f) => f.depth === 0 && f.phase === 'partition') ?? frames.find((f) => f.depth === 0 && f.phase === 'base') ?? frames[0]),
    phase: 'answer',
    message: `The ${rank}th smallest value is ${answer}.`,
  })
  return { answer, frames }
}
export function parseMedianValues(text: string) {
  const tokens = text
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
  return tokens.map((token) => {
    const value = Number(token)
    if (!Number.isFinite(value)) throw new Error(`'${token}' is not a finite number.`)
    return value
  })
}
