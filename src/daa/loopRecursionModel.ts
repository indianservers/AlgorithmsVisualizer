export type LoopPattern = 'nested' | 'triangular' | 'doubling'
export type LoopIteration = { i: number; j: number | null; ordinal: number }
export function loopIterations(n: number, pattern: LoopPattern): LoopIteration[] {
  if (!Number.isInteger(n) || n < 1 || n > 20) throw new Error('Choose an integer n from 1 to 20.')
  const rows: LoopIteration[] = []
  if (pattern === 'doubling') {
    for (let i = 1; i <= n; i *= 2) rows.push({ i, j: null, ordinal: rows.length + 1 })
    return rows
  }
  for (let i = 1; i <= n; i++) for (let j = 1; j <= (pattern === 'triangular' ? i : n); j++) rows.push({ i, j, ordinal: rows.length + 1 })
  return rows
}
export function loopSummary(n: number, pattern: LoopPattern) {
  const iterations = loopIterations(n, pattern)
  return {
    iterations,
    count: iterations.length,
    formula: pattern === 'nested' ? `n × n = ${n * n}` : pattern === 'triangular' ? `n(n + 1)/2 = ${(n * (n + 1)) / 2}` : `⌊log₂ n⌋ + 1 = ${iterations.length}`,
    bound: pattern === 'doubling' ? 'Θ(log n)' : 'Θ(n²)',
    space: 'Θ(1)',
  }
}
export type RecursionFunction = 'factorial' | 'binary'
export type CallFrame = { id: number; n: number; label: string; expression: string; value: number; lo?: number; hi?: number; mid?: number }
export type CallSnapshot = { stack: CallFrame[]; phase: 'call' | 'base' | 'return' | 'done'; message: string; returned: number | null; active: number | null }
export function recursionTrace(n: number, fn: RecursionFunction): { frames: CallFrame[]; snapshots: CallSnapshot[]; result: number; peak: number } {
  if (!Number.isInteger(n) || n < 0 || n > 10) throw new Error('Choose an integer n from 0 to 10.')
  const frames: CallFrame[] = [],
    snapshots: CallSnapshot[] = []
  let size = n,
    lo = 0
  for (let depth = 0; depth <= n; depth++) {
    const index = frames.length,
      hi = lo + size - 1,
      mid = size > 0 ? lo + Math.floor((size - 1) / 2) : -1
    frames.push({
      id: index,
      n: size,
      label: fn === 'factorial' ? `fact(${size})` : `search(${lo}, ${hi})`,
      expression:
        size === 0
          ? `return ${fn === 'factorial' ? 1 : -1}`
          : fn === 'factorial'
            ? `${size} × fact(${size - 1})`
            : `mid = ${mid}, ${mid + 1} < ${n + 1}; search right`,
      value: fn === 'factorial' ? 1 : -1,
      ...(fn === 'binary' ? { lo, hi, mid } : {}),
    })
    if (size === 0) break
    size = fn === 'factorial' ? size - 1 : Math.floor(size / 2)
    if (fn === 'binary') lo = mid + 1
  }
  let result = fn === 'factorial' ? 1 : -1
  for (let i = frames.length - 1; i >= 0; i--) {
    if (fn === 'factorial' && frames[i].n > 0) result *= frames[i].n
    frames[i].value = result
  }
  for (let i = 0; i < frames.length; i++)
    snapshots.push({
      stack: frames.slice(0, i + 1),
      phase: i === frames.length - 1 ? 'base' : 'call',
      message:
        i === frames.length - 1
          ? `Base case: ${frames[i].label} is ready to return ${frames[i].value}.`
          : `Call ${frames[i].label}. Its result waits for the child call.`,
      returned: null,
      active: i,
    })
  for (let i = frames.length - 1; i >= 0; i--)
    snapshots.push({
      stack: frames.slice(0, i),
      phase: i === 0 ? 'done' : 'return',
      message: `${frames[i].label} returns ${frames[i].value}.${i === 0 ? ' The stack is now empty.' : ''}`,
      returned: frames[i].value,
      active: i,
    })
  return { frames, snapshots, result, peak: frames.length }
}
export type GrowthSeries = 'quadratic' | 'linear' | 'logarithmic' | 'binary'
export const growthSeries: { id: GrowthSeries; label: string; formula: string; color: string }[] = [
  { id: 'quadratic', label: 'Quadratic', formula: 'n²', color: '#ff304c' },
  { id: 'linear', label: 'Linear', formula: 'n', color: '#973bff' },
  { id: 'logarithmic', label: 'Logarithmic', formula: 'log₂ n', color: '#0084ff' },
  { id: 'binary', label: 'Recursion (Binary Search)', formula: '⌊log₂ n⌋ + 2 calls', color: '#00ad78' },
]
export function growthValue(id: GrowthSeries, n: number) {
  if (!Number.isFinite(n) || n < 1) throw new Error('Chart inputs must be at least 1.')
  return id === 'quadratic' ? n * n : id === 'linear' ? n : id === 'logarithmic' ? Math.log2(n) : Math.floor(Math.log2(n)) + 2
}
export function growthPlot(maxN: number, scale: 'linear' | 'log', enabled: GrowthSeries[]) {
  if (![20, 100, 1000].includes(maxN)) throw new Error('Choose a supported chart range.')
  const maximum = Math.max(1, ...enabled.map((id) => growthValue(id, maxN)))
  const ceiling =
    scale === 'log'
      ? 10 ** Math.max(1, Math.ceil(Math.log10(maximum)))
      : Math.max(1, Math.ceil(maximum / 10 ** Math.floor(Math.log10(maximum))) * 10 ** Math.floor(Math.log10(maximum)))
  const project = (value: number) => (scale === 'log' ? 1 - Math.log10(Math.max(1, value)) / Math.log10(ceiling) : 1 - value / ceiling)
  const ticks = scale === 'log' ? Array.from({ length: Math.log10(ceiling) + 1 }, (_, i) => 10 ** i) : Array.from({ length: 5 }, (_, i) => (ceiling * i) / 4)
  return {
    ceiling,
    ticks,
    project,
    series: enabled.map((id) => ({
      id,
      points: Array.from({ length: maxN }, (_, i) => ({ n: i + 1, value: growthValue(id, i + 1), x: i / (maxN - 1), y: project(growthValue(id, i + 1)) })),
    })),
  }
}
