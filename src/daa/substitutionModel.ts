export type SubstitutionId = 'merge' | 'ternary' | 'chain' | 'logwork'
export type BoundGuess = 'linear' | 'nlog' | 'square' | 'nlog2' | 'strengthened'
export const substitutionPresets: { id: SubstitutionId; recurrence: string; bound: string }[] = [
  { id: 'merge', recurrence: 'T(n) = 2T(n/2) + n', bound: 'Θ(n log n)' },
  { id: 'ternary', recurrence: 'T(n) = 3T(n/2) + n', bound: 'Θ(n^(log₂ 3))' },
  { id: 'chain', recurrence: 'T(n) = T(n - 1) + n', bound: 'Θ(n²)' },
  { id: 'logwork', recurrence: 'T(n) = 2T(n/2) + n log n', bound: 'Θ(n log² n)' },
]
export const boundLabels: Record<BoundGuess, string> = {
  linear: 'T(n) ≤ cn',
  nlog: 'T(n) ≤ cn log₂ n',
  square: 'T(n) ≤ cn²',
  nlog2: 'T(n) ≤ cn log₂² n',
  strengthened: 'T(n) ≤ cn^(log₂ 3) − 2n',
}
export function parseSubstitution(source: string): SubstitutionId {
  const normalized = source.toLowerCase().replaceAll('−', '-').replaceAll('₂', '').replace(/\s+/g, '')
  const match = substitutionPresets.find((p) => p.recurrence.toLowerCase().replace(/\s+/g, '') === normalized)
  if (!match) throw new Error('Use one of the four supported recurrence forms below. All logarithms have base 2; T(1) = 1.')
  return match.id
}
export function recommendedGuess(id: SubstitutionId): BoundGuess {
  return id === 'merge' ? 'nlog' : id === 'ternary' ? 'strengthened' : id === 'chain' ? 'square' : 'nlog2'
}
export function exactSubstitutionCost(id: SubstitutionId, n: number): number {
  if (!Number.isInteger(n) || n < 1 || n > 1024 || (id !== 'chain' && !Number.isInteger(Math.log2(n))))
    throw new Error('Choose an integer n from 1 to 1024; divide-by-two recurrences require powers of 2.')
  if (id === 'chain') return (n * (n + 1)) / 2
  const h = Math.log2(n)
  if (id === 'merge') return n * (h + 1)
  if (id === 'ternary') return 3 * 3 ** h - 2 * n
  return n * (1 + (h * (h + 1)) / 2)
}
export function guessValue(guess: BoundGuess, c: number, n: number): number {
  if (!Number.isFinite(c) || c <= 0 || !Number.isFinite(n) || n < 1) throw new Error('The constant c must be positive and n must be at least 1.')
  const l = Math.log2(n)
  return (
    c * (guess === 'linear' ? n : guess === 'nlog' ? n * l : guess === 'square' ? n * n : guess === 'nlog2' ? n * l * l : n ** Math.log2(3)) -
    (guess === 'strengthened' ? 2 * n : 0)
  )
}
export type ProofCheck = { valid: boolean; title: string; explanation: string; equations: string[]; base: string; minimum: number | null; threshold: number }
export function substitutionProof(id: SubstitutionId, guess: BoundGuess, c: number): ProofCheck {
  if (!Number.isFinite(c) || c <= 0 || c > 100) throw new Error('Choose a constant c greater than 0 and at most 100.')
  const supported =
    (id === 'merge' && ['nlog', 'square', 'nlog2'].includes(guess)) ||
    (id === 'chain' && guess === 'square') ||
    (id === 'ternary' && guess === 'strengthened') ||
    (id === 'logwork' && guess === 'nlog2')
  const minimum = supported ? (id === 'ternary' ? 3 : guess === 'square' ? 1 : 2) : null
  const threshold = guess === 'nlog' || guess === 'nlog2' ? 2 : 1
  const base =
    threshold === 2
      ? `Base n = 2: T(2) = ${exactSubstitutionCost(id, 2)} ≤ 2c = ${2 * c}. Also record T(1) = 1 separately.`
      : `Base n = 1: T(1) = 1 ≤ ${guess === 'strengthened' ? 'c − 2' : 'c'} = ${guessValue(guess, c, 1)}.`
  let equations: string[] = []
  let explanation: string
  if (id === 'merge' && guess === 'nlog') {
    equations = ['T(n) = 2T(n/2) + n', '≤ 2[c(n/2) log₂(n/2)] + n', '= cn(log₂ n − 1) + n', '= cn log₂ n − cn + n', '≤ cn log₂ n   (c ≥ 1)']
    explanation =
      'For powers of 2 with n ≥ 4, both children are at least 2. The induction step needs c ≥ 1; the base n = 2 needs c ≥ 2. Together, c ≥ 2 proves the upper bound for n ≥ 2.'
  } else if (id === 'merge' && guess === 'square') {
    equations = ['T(n) ≤ 2c(n/2)² + n', '= cn²/2 + n', '≤ cn²   (n ≥ 2, c ≥ 1)']
    explanation = 'This is a valid but loose upper bound. The tighter order is Θ(n log n). The base case and n ≥ 2 both hold with c ≥ 1.'
  } else if ((id === 'merge' || id === 'logwork') && guess === 'nlog2') {
    equations = [
      `T(n) ≤ cn(log₂ n − 1)² + ${id === 'merge' ? 'n' : 'n log₂ n'}`,
      `= cn log₂² n − n[c(2 log₂ n − 1) − ${id === 'merge' ? '1' : 'log₂ n'}]`,
      '≤ cn log₂² n   (n ≥ 4, c ≥ 1)',
    ]
    explanation = `The bracket is nonnegative for n ≥ 4 and c ≥ 1. The base n = 2 additionally needs c ≥ 2. ${id === 'merge' ? 'This bound is valid but loose for this recurrence.' : 'This proves O(n log² n); a separate level sum proves the matching lower bound.'}`
  } else if (id === 'chain' && guess === 'square') {
    equations = ['T(n) ≤ c(n − 1)² + n', '= cn² − (2c − 1)n + c', '≤ cn²   (n ≥ 2, c ≥ 1)']
    explanation = 'For c ≥ 1 and n ≥ 2, (2c − 1)n − c ≥ 3c − 2 ≥ 1. The base T(1) = 1 ≤ c also holds. This proves O(n²) for every positive integer n.'
  } else if (id === 'ternary' && guess === 'strengthened') {
    equations = ['Let p = log₂ 3, so 2ᵖ = 3.', 'T(n) ≤ 3[c(n/2)ᵖ − 2(n/2)] + n', '= cnᵖ − 3n + n', '= cnᵖ − 2n']
    explanation =
      'The negative linear term absorbs the +n work. The induction step is an equality, and T(1) = 1 ≤ c − 2 requires c ≥ 3. Dropping −2n gives O(nᵖ).'
  } else {
    explanation =
      'This lesson has no symbolic induction certificate for this pairing. A finite sample cannot prove an asymptotic upper bound. Use the recommended guess, or supply a separate general proof.'
    if (id === 'merge' && guess === 'linear') {
      equations = ['T(n) ≤ 2c(n/2) + n', '= cn + n', '> cn   (n > 0)']
      explanation =
        'The proposed induction step fails for every c: +n remains. The exact solution n(log₂ n + 1) also disproves O(n). Add the missing logarithmic factor.'
    } else if (id === 'ternary' && guess === 'nlog') {
      equations = ['T(n) ≤ (3/2)cn(log₂ n − 1) + n', '= cn log₂ n + n[(c/2) log₂ n − 3c/2 + 1]']
      explanation = 'The extra bracket eventually becomes positive for every fixed c. The exact solution 3n^(log₂ 3) − 2n grows faster than n log n.'
    }
  }
  const valid = supported && c >= minimum!
  return {
    valid,
    title: valid ? 'Induction certificate verified' : supported ? 'Base case needs a larger constant' : 'This guess is not certified',
    explanation,
    equations,
    base,
    minimum,
    threshold,
  }
}
export function substitutionSamples(id: SubstitutionId, guess: BoundGuess, c: number, count = 8) {
  if (!Number.isInteger(count) || count < 1 || count > 10) throw new Error('Use 1 to 10 sample rows.')
  return Array.from({ length: count }, (_, i) => {
    const n = id === 'chain' ? i + 1 : 2 ** i,
      actual = exactSubstitutionCost(id, n),
      bound = guessValue(guess, c, n)
    return { n, actual, bound, holds: actual <= bound + 1e-8 }
  })
}
