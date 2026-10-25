import { classifyMaster, masterTreeLevels, masterGrowthLabel, type MasterParameters } from './masterTheoremModel'
export type TreeScale = 'linear' | 'logarithmic'
export function treeCriticalLabel(a: number, b: number) {
  const p = Math.log(a) / Math.log(b)
  return Number.isInteger(p) ? (p === 0 ? '1' : p === 1 ? 'n' : `n^${p}`) : `n^(log_${b} ${a})`
}
export function recursionTreeAnalysis(parameters: MasterParameters, depth: number) {
  const tree = masterTreeLevels(parameters, depth),
    classification = classifyMaster(parameters),
    critical = treeCriticalLabel(parameters.a, parameters.b),
    ratio = parameters.a / parameters.b ** parameters.d
  // At equal polynomial powers with negative logarithmic powers, a level sum extends the stated Master cases.
  const extension =
    classification.kind === 'uncovered' ? (parameters.k === -1 ? `Θ(${critical === '1' ? '' : critical + ' '}log log n)` : `Θ(${critical})`) : null
  const bound = classification.result ?? extension!
  const finiteFormula = parameters.k === 0 ? (ratio === 1 ? 'n^d · h' : 'n^d · (r^h − 1)/(r − 1)') : 'Σ a^i f(n/b^i), i = 0…h−1'
  return {
    ...tree,
    parameters: { ...parameters },
    classification,
    ratio,
    critical,
    leafBound: `Θ(${critical})`,
    internalBound: bound,
    bound,
    extension,
    finiteFormula,
    growth: masterGrowthLabel(parameters.d, parameters.k),
  }
}
export function recursionCostChart(work: number[], scale: TreeScale) {
  if (!Array.isArray(work) || !work.length || work.length > 11 || work.some((v) => !Number.isFinite(v) || v <= 0))
    throw new Error('Plot 1–11 finite positive level costs.')
  if (scale !== 'linear' && scale !== 'logarithmic') throw new Error('Choose a linear or logarithmic scale.')
  const max = Math.max(...work),
    min = Math.min(...work)
  if (scale === 'linear') {
    const order = 10 ** Math.floor(Math.log10(max)),
      ceiling = Math.ceil(max / order) * order
    return { max: ceiling, min: 0, ticks: Array.from({ length: 5 }, (_, i) => (ceiling * i) / 4), fractions: work.map((v) => v / ceiling) }
  }
  const lowPower = Math.floor(Math.log10(min)),
    highPower = Math.max(lowPower + 1, Math.ceil(Math.log10(max))),
    stride = Math.max(1, Math.ceil((highPower - lowPower) / 5)),
    powers: number[] = []
  for (let power = lowPower; power <= highPower; power += stride) powers.push(power)
  if (powers.at(-1) !== highPower) powers.push(highPower)
  return {
    min: 10 ** lowPower,
    max: 10 ** highPower,
    ticks: powers.map((p) => 10 ** p),
    fractions: work.map((v) => (Math.log10(v) - lowPower) / (highPower - lowPower)),
  }
}
export function decrementTree(n: number) {
  if (!Number.isInteger(n) || n < 1 || n > 16) throw new Error('Choose an integer chain size from 1 to 16.')
  const levels = Array.from({ length: n }, (_, level) => ({ level, size: n - level, work: n - level, leaf: level === n - 1 }))
  return { n, levels, depth: n - 1, total: levels.reduce((sum, l) => sum + l.work, 0), bound: 'Θ(n²)' }
}
