export type AnalysisArrayType = 'random' | 'sorted' | 'reverse' | 'custom'
export type AnalysisInput = { size: number; type: AnalysisArrayType; seed: number; values?: number[] }
export type SimulationInput = { size: number; trials: number; seed: number }
export type AnalysisKey = { id: number; value: number; rank: number }
export type AnalysisNode = {
  id: number
  depth: number
  values: AnalysisKey[]
  pivot: AnalysisKey | null
  less: AnalysisKey[]
  greater: AnalysisKey[]
  sorted: AnalysisKey[]
  comparisons: number
  total: number
  left: number | null
  right: number | null
}
export const analysisExample: AnalysisInput = { size: 8, type: 'random', seed: 42 }
export const simulationExample: SimulationInput = { size: 50, trials: 1000, seed: 42 }
export function seededAnalysisRandom(seed: number) {
  let state = seed >>> 0
  function uint32() {
    state = (state + 0x6d2b79f5) >>> 0
    let z = state
    z = Math.imul(z ^ (z >>> 15), z | 1)
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61)
    return (z ^ (z >>> 14)) >>> 0
  }
  return {
    index(size: number) {
      const limit = Math.floor(4294967296 / size) * size
      let value = uint32()
      while (value >= limit) value = uint32()
      return value % size
    },
  }
}
export function expectedQuickComparisons(n: number) {
  let h = 0
  for (let i = 1; i <= n; i++) h += 1 / i
  return 2 * (n + 1) * h - 4 * n
}
export function indicatorProbability(i: number, j: number) {
  if (!Number.isInteger(i) || !Number.isInteger(j) || i < 1 || j <= i) throw new Error('Choose sorted ranks with 1 ≤ i < j.')
  return 2 / (j - i + 1)
}
function validateSize(n: number) {
  if (!Number.isInteger(n) || n < 1 || n > 128) throw new Error('Array size must be an integer from 1 to 128.')
}
function validateSeed(seed: number) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) throw new Error('Seed must be an integer from 0 to 4294967295.')
}
export function analysisValues(size: number, type: AnalysisArrayType, values?: number[]) {
  validateSize(size)
  if (!['random', 'sorted', 'reverse', 'custom'].includes(type)) throw new Error('Choose a supported array type.')
  if (type === 'custom') {
    if (!values || values.length !== size) throw new Error(`Enter exactly ${size} distinct keys.`)
    if (values.some((v) => !Number.isInteger(v) || Math.abs(v) > 9999)) throw new Error('Keys must be integers between −9999 and 9999.')
    if (new Set(values).size !== values.length) throw new Error('Use distinct keys: the indicator formula assumes no equal values.')
    return [...values]
  }
  const result = Array.from({ length: size }, (_, i) => i + 1)
  if (type === 'reverse') return result.reverse()
  if (type === 'random') {
    if (size === 8) return [7, 2, 9, 1, 5, 8, 3, 6]
    const random = seededAnalysisRandom(2026)
    for (let i = size - 1; i > 0; i--) {
      const j = random.index(i + 1)
      ;[result[i], result[j]] = [result[j], result[i]]
    }
  }
  return result
}
export function parseAnalysisInput(size: string, type: AnalysisArrayType, seed: string, values: string): AnalysisInput {
  if (!size.trim() || !seed.trim()) throw new Error('Enter an array size and a pivot seed.')
  const input = {
    size: Number(size),
    type,
    seed: Number(seed),
    values: values.trim()
      ? values
          .trim()
          .split(/[,\s]+/)
          .map(Number)
      : [],
  }
  validateSeed(input.seed)
  analysisValues(input.size, type, input.values)
  return input
}
export function runAnalysisLesson(input: AnalysisInput) {
  validateSeed(input.seed)
  const values = analysisValues(input.size, input.type, input.values),
    ranked = [...values].sort((a, b) => a - b),
    keys = values.map((value, i) => ({ id: i + 1, value, rank: ranked.indexOf(value) + 1 })),
    random = seededAnalysisRandom(input.seed),
    nodes: AnalysisNode[] = [],
    frames: { node: number; phase: 0 | 1 | 2 | 3; performed: number }[] = [],
    comparedPairs = new Set<string>()
  let performed = 0
  function sort(part: AnalysisKey[], depth: number): AnalysisNode {
    const node: AnalysisNode = {
      id: nodes.length,
      depth,
      values: part,
      pivot: null,
      less: [],
      greater: [],
      sorted: [...part],
      comparisons: Math.max(0, part.length - 1),
      total: 0,
      left: null,
      right: null,
    }
    nodes.push(node)
    if (part.length < 2) return node
    node.pivot = part[random.index(part.length)]
    frames.push({ node: node.id, phase: 0, performed })
    for (const key of part)
      if (key.id !== node.pivot.id) {
        ;(key.value < node.pivot.value ? node.less : node.greater).push(key)
        comparedPairs.add([key.rank, node.pivot.rank].sort((a, b) => a - b).join(':'))
      }
    performed += node.comparisons
    frames.push({ node: node.id, phase: 1, performed }, { node: node.id, phase: 2, performed })
    const left = sort(node.less, depth + 1),
      right = sort(node.greater, depth + 1)
    node.left = left.id
    node.right = right.id
    node.sorted = [...left.sorted, node.pivot, ...right.sorted]
    node.total = node.comparisons + left.total + right.total
    frames.push({ node: node.id, phase: 3, performed })
    return node
  }
  const root = sort(keys, 0)
  if (!frames.length) frames.push({ node: 0, phase: 3, performed: 0 })
  return {
    input: { ...input, values: [...values] },
    values,
    keys,
    nodes,
    frames,
    root,
    comparedPairs,
    expected: expectedQuickComparisons(values.length),
    worst: (values.length * (values.length - 1)) / 2,
  }
}
export function parseAnalysisSimulation(size: string, trials: string, seed: string, blankSeed = 42): SimulationInput {
  if (!size.trim() || !trials.trim()) throw new Error('Enter an array size and number of trials.')
  const input = { size: Number(size), trials: Number(trials), seed: seed.trim() ? Number(seed) : blankSeed }
  validateSize(input.size)
  validateSeed(input.seed)
  if (!Number.isInteger(input.trials) || input.trials < 10 || input.trials > 5000) throw new Error('Trials must be an integer from 10 to 5000.')
  return input
}
export function runAnalysisSimulation(input: SimulationInput) {
  parseAnalysisSimulation(String(input.size), String(input.trials), String(input.seed))
  const random = seededAnalysisRandom(input.seed),
    values = analysisValues(input.size, 'random')
  function count(part: number[]): number {
    if (part.length < 2) return 0
    const pivotIndex = random.index(part.length),
      p = part[pivotIndex],
      less: number[] = [],
      greater: number[] = []
    for (let i = 0; i < part.length; i++) if (i !== pivotIndex) (part[i] < p ? less : greater).push(part[i])
    return part.length - 1 + count(less) + count(greater)
  }
  const counts = Array.from({ length: input.trials }, () => count(values)),
    mean = counts.reduce((a, b) => a + b, 0) / counts.length,
    min = Math.min(...counts),
    max = Math.max(...counts),
    stddev = Math.sqrt(counts.reduce((a, c) => a + (c - mean) ** 2, 0) / counts.length),
    width = Math.max(1, Math.ceil((max - min + 1) / 20)),
    start = Math.floor(min / width) * width,
    histogram = Array.from({ length: Math.floor((max - start) / width) + 1 }, (_, i) => ({
      low: start + i * width,
      high: start + (i + 1) * width - 1,
      count: 0,
    }))
  for (const c of counts) histogram[Math.floor((c - start) / width)].count++
  return {
    input: { ...input },
    counts,
    mean,
    stddev,
    min,
    max,
    histogram,
    expected: expectedQuickComparisons(input.size),
    standardError: stddev / Math.sqrt(input.trials),
    firstRunSeed: input.seed,
  }
}
