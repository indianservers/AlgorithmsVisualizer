export type SearchAlgorithm = 'linear' | 'binary'
export type MemoryMode = 'iterative' | 'recursive' | 'temporary'
export function parseCaseArray(source: string): number[] {
  const tokens = source
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
  if (tokens.length < 1 || tokens.length > 12) throw new Error('Enter 1 to 12 distinct integers, separated by commas.')
  const values = tokens.map(Number)
  if (values.some((value) => !Number.isInteger(value) || Math.abs(value) > 9999)) throw new Error('Use integers from −9999 to 9999.')
  if (new Set(values).size !== values.length) throw new Error('Use distinct values for the stated uniform successful-target distribution.')
  return values
}
export type SearchStep = { index: number; lo: number; hi: number; value: number; comparison: number; found: boolean; nextLo: number; nextHi: number }
export function caseSearch(values: number[], target: number, algorithm: SearchAlgorithm) {
  if (
    !values.length ||
    values.length > 12 ||
    values.some((v) => !Number.isInteger(v) || Math.abs(v) > 9999) ||
    new Set(values).size !== values.length ||
    !Number.isFinite(target)
  )
    throw new Error('Use a nonempty array of at most 12 distinct bounded integers and a finite target.')
  if (algorithm === 'binary' && values.some((v, i) => i > 0 && v < values[i - 1])) throw new Error('Binary search requires ascending sorted input.')
  const steps: SearchStep[] = []
  if (algorithm === 'linear') {
    for (let i = 0; i < values.length; i++) {
      steps.push({
        index: i,
        lo: i,
        hi: values.length - 1,
        value: values[i],
        comparison: i + 1,
        found: values[i] === target,
        nextLo: i + 1,
        nextHi: values.length - 1,
      })
      if (values[i] === target) break
    }
  } else {
    let lo = 0,
      hi = values.length - 1
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2),
        found = values[mid] === target,
        nextLo = values[mid] < target ? mid + 1 : lo,
        nextHi = values[mid] > target ? mid - 1 : hi
      steps.push({ index: mid, lo, hi, value: values[mid], comparison: steps.length + 1, found, nextLo, nextHi })
      if (found) break
      lo = nextLo
      hi = nextHi
    }
  }
  return { steps, comparisons: steps.length, index: steps.at(-1)?.found ? steps.at(-1)!.index : -1 }
}
export function caseComparison(values: number[], algorithm: SearchAlgorithm) {
  const input = algorithm === 'binary' ? [...values].sort((a, b) => a - b) : [...values]
  const distribution = input.map((target) => ({ target, comparisons: caseSearch(input, target, algorithm).comparisons }))
  const bestIndex = algorithm === 'binary' ? Math.floor((input.length - 1) / 2) : 0,
    best = caseSearch(input, input[bestIndex], algorithm)
  const worstTarget = algorithm === 'linear' ? input.at(-1)! : Math.max(...input) + 1,
    worst = caseSearch(input, worstTarget, algorithm)
  return {
    input,
    distribution,
    bestIndex,
    bestTarget: input[bestIndex],
    best: best.comparisons,
    average: distribution.reduce((sum, row) => sum + row.comparisons, 0) / input.length,
    worst: worst.comparisons,
    worstTarget,
    worstIndex: algorithm === 'linear' ? input.length - 1 : -1,
    averageBound: algorithm === 'linear' ? 'Θ(n)' : 'Θ(log n)',
    worstBound: algorithm === 'linear' ? 'Θ(n)' : 'Θ(log n)',
  }
}
export function integerInputSize(source: string) {
  if (!/^\d{1,78}$/.test(source.trim())) throw new Error('Enter a nonnegative decimal integer with at most 256 bits.')
  const value = BigInt(source.trim()),
    binary = value.toString(2)
  if (binary.length > 256) throw new Error('Enter a nonnegative decimal integer with at most 256 bits.')
  return {
    decimal: value.toString(),
    binary,
    bits: binary.length,
    exponent: value === 0n ? null : binary.length - 1,
    decimalOrder: value.toString().length - 1,
    formatted: value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','),
  }
}
export function stringInputSize(source: string) {
  return Array.from(source).length
}
export function memoryAnalysis(n: number, mode: MemoryMode, algorithm: SearchAlgorithm) {
  if (!Number.isInteger(n) || n < 1 || n > 12) throw new Error('Choose n from 1 to 12.')
  const recursive = mode === 'recursive',
    frames = recursive ? (algorithm === 'linear' ? n + 1 : Math.floor(Math.log2(n)) + 2) : 1,
    temporary = mode === 'temporary' ? n : 0
  return {
    frames,
    temporary,
    heapObjects: 0,
    variables: temporary ? ['i', 'bufferRef'] : algorithm === 'linear' ? ['i', 'target', 'found'] : ['lo', 'hi', 'mid', 'target'],
    bound: mode === 'temporary' ? 'Θ(n)' : recursive ? (algorithm === 'linear' ? 'Θ(n)' : 'Θ(log n)') : 'Θ(1)',
    frameLabels: Array.from({ length: frames }, (_, i) =>
      recursive
        ? i === frames - 1
          ? 'empty interval (base)'
          : algorithm === 'linear'
            ? `search(i = ${i})`
            : `search(size = ${Math.floor(n / 2 ** i)})`
        : 'main()',
    ),
  }
}
