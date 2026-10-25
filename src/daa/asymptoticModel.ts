export type GrowthFunction = 'exponential' | 'quadratic' | 'nlog' | 'linear' | 'log' | 'constant'
export type AsymptoticNotation = 'O' | 'Ω' | 'Θ' | 'o' | 'ω'
export const asymptoticFunctions: { id: GrowthFunction; label: string; formula: string; color: string; rank: number }[] = [
  { id: 'exponential', label: 'O(2ⁿ)', formula: '2ⁿ', color: '#9139ff', rank: 5 },
  { id: 'quadratic', label: 'O(n²)', formula: 'n²', color: '#ff3a4a', rank: 4 },
  { id: 'nlog', label: 'O(n log n)', formula: 'n log₂ n', color: '#ff880b', rank: 3 },
  { id: 'linear', label: 'O(n)', formula: 'n', color: '#0cbd83', rank: 2 },
  { id: 'log', label: 'O(log n)', formula: 'log₂ n', color: '#087cff', rank: 1 },
  { id: 'constant', label: 'O(1)', formula: '1', color: '#12bccb', rank: 0 },
]
export function asymptoticValue(fn: GrowthFunction, n: number) {
  if (!Number.isInteger(n) || n < 1 || n > 1000) throw new Error('Use an integer n from 1 to 1000.')
  return fn === 'exponential' ? 2 ** n : fn === 'quadratic' ? n * n : fn === 'nlog' ? n * Math.log2(n) : fn === 'linear' ? n : fn === 'log' ? Math.log2(n) : 1
}
export function asymptoticPlot(maxN: number, scale: 'linear' | 'log', enabled: GrowthFunction[], ceiling = 1e6) {
  if (![20, 100, 1000].includes(maxN) || ![1e3, 1e6, 1e12].includes(ceiling)) throw new Error('Choose a supported chart range and ceiling.')
  const project = (value: number) => (scale === 'linear' ? 1 - value / ceiling : 1 - Math.log10(Math.max(1, value)) / Math.log10(ceiling))
  const ticks =
    scale === 'linear' ? Array.from({ length: 5 }, (_, i) => (ceiling * i) / 4) : Array.from({ length: Math.log10(ceiling) / 2 + 1 }, (_, i) => 10 ** (i * 2))
  if (scale === 'log' && ticks.at(-1) !== ceiling) ticks.push(ceiling)
  return {
    ceiling,
    scale,
    ticks,
    project,
    series: enabled.map((id) => {
      const points: { n: number; value: number; x: number; y: number }[] = []
      let firstOffscreen: number | null = null
      for (let n = 1; n <= maxN; n++) {
        const value = asymptoticValue(id, n)
        if (scale !== 'log' || value > 0) points.push({ n, value, x: (n - 1) / (maxN - 1), y: project(value) })
        if (value > ceiling) {
          firstOffscreen = n
          break
        }
      }
      return { id, points, firstOffscreen }
    }),
  }
}
export function asymptoticRelation(f: GrowthFunction, g: GrowthFunction) {
  const difference = asymptoticFunctions.find((row) => row.id === f)!.rank - asymptoticFunctions.find((row) => row.id === g)!.rank
  return {
    limit: difference < 0 ? '0' : difference > 0 ? '∞' : '1',
    membership: { O: difference <= 0, Ω: difference >= 0, Θ: difference === 0, o: difference < 0, ω: difference > 0 } as Record<AsymptoticNotation, boolean>,
  }
}
export type Polynomial = { a: number; b: number; d: number; p: number }
export function validatePolynomial(poly: Polynomial) {
  if (
    ![poly.a, poly.b, poly.d].every((value) => Number.isInteger(value) && value >= 0 && value <= 20) ||
    poly.a < 1 ||
    !Number.isInteger(poly.p) ||
    poly.p < 2 ||
    poly.p > 5
  )
    throw new Error('Use integer coefficients: 1 ≤ a ≤ 20, 0 ≤ b,d ≤ 20, and 2 ≤ p ≤ 5.')
}
export function polynomialValue(poly: Polynomial, n: number) {
  validatePolynomial(poly)
  if (!Number.isInteger(n) || n < 1 || n > 1000000) throw new Error('Use an integer n from 1 to 1000000.')
  return poly.a * n ** poly.p + poly.b * n + poly.d
}
export function polynomialCertificate(poly: Polynomial, c: number) {
  validatePolynomial(poly)
  if (!Number.isFinite(c) || c <= 0 || c > 100 || Math.abs(c * 100 - Math.round(c * 100)) > 1e-8)
    throw new Error('Use a positive constant c ≤ 100 with at most two decimal places.')
  const ratio = (n: number) => poly.a + poly.b / n ** (poly.p - 1) + poly.d / n ** poly.p
  const cents = BigInt(Math.round(c * 100)),
    leading = 100n * BigInt(poly.a)
  const holds = (n: number) => {
    if (!Number.isInteger(n) || n < 1 || n > 1000000) throw new Error('Use an integer n from 1 to 1000000.')
    const size = BigInt(n),
      power = size ** BigInt(poly.p)
    return 100n * (BigInt(poly.a) * power + BigInt(poly.b) * size + BigInt(poly.d)) <= cents * power
  }
  if (cents < leading || (cents === leading && (poly.b > 0 || poly.d > 0)))
    return {
      valid: false,
      n0: null,
      standardC: poly.a + poly.b + poly.d,
      ratio,
      holds,
      reason:
        cents < leading
          ? 'The leading coefficient alone exceeds c, so no eventual upper bound with this constant is possible.'
          : 'The lower-order positive terms keep f(n)/nᵖ strictly above the leading coefficient for every finite n.',
    }
  let hi = 1
  while (!holds(hi)) hi *= 2
  let lo = 1
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2)
    if (holds(mid)) hi = mid
    else lo = mid + 1
  }
  return {
    valid: true,
    n0: lo,
    standardC: poly.a + poly.b + poly.d,
    ratio,
    holds,
    reason: 'The ratio a + b/n^(p−1) + d/nᵖ is nonincreasing for n ≥ 1. Once it is at most c, it stays at most c for every larger input.',
  }
}
export const notationDefinitions: Record<AsymptoticNotation, { name: string; formula: string; meaning: string; example: string }> = {
  O: {
    name: 'Big-O: an eventual upper bound',
    formula: '∃ c > 0, n₀ such that 0 ≤ f(n) ≤ c g(n) for all n ≥ n₀.',
    meaning: 'One positive constant multiple of g eventually bounds f from above. It need not be tight.',
    example: 'n ∈ O(n²), but n ∉ Θ(n²).',
  },
  Ω: {
    name: 'Big-Omega: an eventual lower bound',
    formula: '∃ c > 0, n₀ such that 0 ≤ c g(n) ≤ f(n) for all n ≥ n₀.',
    meaning: 'One positive constant multiple of g eventually bounds f from below.',
    example: 'n² ∈ Ω(n), and n² ∉ O(n).',
  },
  Θ: {
    name: 'Big-Theta: a tight bound',
    formula: '∃ c₁,c₂ > 0, n₀ such that 0 ≤ c₁ g(n) ≤ f(n) ≤ c₂ g(n) for all n ≥ n₀.',
    meaning: 'Both an eventual upper bound and an eventual lower bound hold. Θ(g) = O(g) ∩ Ω(g).',
    example: '3n³ + 5n + 2 ∈ Θ(n³): use c₁ = 3, c₂ = 10, n₀ = 1.',
  },
  o: {
    name: 'Little-o: strict asymptotic domination',
    formula: '∀ c > 0, ∃ n₀ such that 0 ≤ f(n) < c g(n) for all n ≥ n₀.',
    meaning: 'When g is eventually positive, f(n)/g(n) → 0. The order of the quantifiers matters.',
    example: 'n log₂ n ∈ o(n²), because log₂ n/n → 0.',
  },
  ω: {
    name: 'Little-omega: strict asymptotic growth',
    formula: '∀ c > 0, ∃ n₀ such that 0 ≤ c g(n) < f(n) for all n ≥ n₀.',
    meaning: 'When g is eventually positive, f(n)/g(n) → ∞.',
    example: 'n² ∈ ω(n log₂ n), but n² ∉ ω(n²).',
  },
}
