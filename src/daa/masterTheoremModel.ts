export type MasterParameters = { a: number; b: number; d: number; k: number }
export type MasterCase = 1 | 2 | 3 | 'uncovered'
export function validateMasterParameters(p: MasterParameters) {
  if (!Number.isInteger(p.a) || p.a < 1 || p.a > 16) throw new Error('Use an integer a from 1 to 16.')
  if (!Number.isInteger(p.b) || p.b < 2 || p.b > 16) throw new Error('Use an integer b from 2 to 16.')
  if (!Number.isInteger(p.d) || p.d < 0 || p.d > 8) throw new Error('Use an integer polynomial exponent d from 0 to 8.')
  if (!Number.isInteger(p.k) || p.k < -3 || p.k > 5) throw new Error('Use an integer logarithmic exponent k from −3 to 5.')
}
export function masterGrowthLabel(d: number, k: number) {
  const polynomial = d === 0 ? '' : d === 1 ? 'n' : `n^${d}`,
    logarithm = k === 0 ? '' : k === 1 ? 'log n' : `log^${k} n`
  return [polynomial, logarithm].filter(Boolean).join(' ') || '1'
}
export function classifyMaster(p: MasterParameters) {
  validateMasterParameters(p)
  const exponent = Math.log(p.a) / Math.log(p.b),
    comparison = p.b ** p.d,
    gap = Math.abs(exponent - p.d)
  // Integer inputs allow exact comparison a versus b^d, avoiding a floating-point equality test on log_b(a).
  const kind: MasterCase = p.a > comparison ? 1 : p.a < comparison ? 3 : p.k >= 0 ? 2 : 'uncovered'
  const exponentInteger = Number.isInteger(exponent) ? exponent : null
  const critical = exponentInteger === 0 ? '' : exponentInteger === 1 ? 'n' : exponentInteger !== null ? `n^${exponentInteger}` : `n^(log_${p.b} ${p.a})`
  const criticalResult = critical || '1'
  const result =
    kind === 1
      ? `Θ(${criticalResult})`
      : kind === 2
        ? `Θ(${[critical, masterGrowthLabel(0, p.k + 1)].filter(Boolean).join(' ')})`
        : kind === 3
          ? `Θ(${masterGrowthLabel(p.d, p.k)})`
          : null
  const ratioLimit = p.a / comparison,
    c = (1 + ratioLimit) / 2
  const regularity =
    kind === 3
      ? {
          ratioLimit,
          c,
          // For negative k, r(1−log(b)/log(n))^k ≤ c once this logarithmic threshold is reached.
          logThreshold: p.k >= 0 ? 2 * Math.log(p.b) : Math.log(p.b) / (1 - (ratioLimit / c) ** (1 / -p.k)),
        }
      : null
  return { ...p, exponent, kind, result, gap, epsilon: kind === 1 || kind === 3 ? gap / 2 : null, regularity }
}
export function masterCombineCost(size: number, p: MasterParameters) {
  validateMasterParameters(p)
  if (!Number.isFinite(size) || size <= 1 || size > 16 ** 10) throw new Error('Combine cost is evaluated only for 1 < size ≤ 16^10; leaves have base cost 1.')
  return size ** p.d * Math.log2(size) ** p.k
}
export function masterTreeLevels(p: MasterParameters, depth: number) {
  validateMasterParameters(p)
  if (!Number.isInteger(depth) || depth < 0 || depth > 10) throw new Error('Use a recursion depth from 0 to 10.')
  const n = p.b ** depth
  const levels = Array.from({ length: depth + 1 }, (_, level) => {
    const nodes = p.a ** level,
      size = p.b ** (depth - level),
      leaf = level === depth,
      perNode = leaf ? 1 : masterCombineCost(size, p)
    return { level, nodes, size, leaf, perNode, work: nodes * perNode }
  })
  const leafWork = levels.at(-1)!.work,
    combineWork = levels.slice(0, -1).reduce((sum, level) => sum + level.work, 0)
  return { n, depth, levels, leafWork, combineWork, total: combineWork + leafWork }
}
export function masterRegularityRatio(p: MasterParameters, n: number) {
  validateMasterParameters(p)
  if (!Number.isFinite(n) || n <= p.b) throw new Error('Evaluate the regularity ratio at n > b.')
  return (p.a / p.b ** p.d) * (1 - Math.log(p.b) / Math.log(n)) ** p.k
}
export const masterPresets: { id: string; name: string; parameters: MasterParameters }[] = [
  { id: 'strassen', name: "Strassen's Matrix Multiplication", parameters: { a: 7, b: 2, d: 2, k: 0 } },
  { id: 'merge', name: 'Merge Sort', parameters: { a: 2, b: 2, d: 1, k: 0 } },
  { id: 'binary', name: 'Binary Search', parameters: { a: 1, b: 2, d: 0, k: 0 } },
  { id: 'root', name: 'Quadratic combine work', parameters: { a: 2, b: 2, d: 2, k: 0 } },
  { id: 'leaves', name: 'Constant combine work', parameters: { a: 2, b: 2, d: 0, k: 0 } },
  { id: 'boundary', name: 'A logarithmic boundary', parameters: { a: 2, b: 2, d: 1, k: -1 } },
]
