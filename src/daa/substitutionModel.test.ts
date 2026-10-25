import { describe, expect, it } from 'vitest'
import {
  exactSubstitutionCost,
  guessValue,
  parseSubstitution,
  recommendedGuess,
  substitutionPresets,
  substitutionProof,
  substitutionSamples,
  type SubstitutionId,
} from './substitutionModel'

function recursiveCost(id: SubstitutionId, n: number): number {
  if (n === 1) return 1
  if (id === 'chain') return recursiveCost(id, n - 1) + n
  return (id === 'ternary' ? 3 : 2) * recursiveCost(id, n / 2) + n * (id === 'logwork' ? Math.log2(n) : 1)
}
describe('substitution certificates and exact costs', () => {
  it('closed forms agree with an independent recursive evaluator over the domain', () => {
    for (const { id } of substitutionPresets)
      for (let i = 0; i <= 10; i++) {
        const n = id === 'chain' ? i + 1 : 2 ** i
        expect(exactSubstitutionCost(id, n)).toBe(recursiveCost(id, n))
      }
    expect(exactSubstitutionCost('merge', 8)).toBe(32)
    expect(exactSubstitutionCost('ternary', 8)).toBe(65)
    expect(exactSubstitutionCost('chain', 8)).toBe(36)
    expect(exactSubstitutionCost('logwork', 8)).toBe(56)
  })
  it('recommended certificates cover their domains with a single constant', () => {
    for (const { id } of substitutionPresets) {
      const guess = recommendedGuess(id),
        c = id === 'ternary' ? 3 : id === 'chain' ? 1 : 2
      expect(substitutionProof(id, guess, c).valid).toBe(true)
      for (let i = 1; i <= 10; i++) {
        const n = id === 'chain' ? i : 2 ** i
        expect(guessValue(guess, c, n) + 1e-8).toBeGreaterThanOrEqual(exactSubstitutionCost(id, n))
      }
    }
  })
  it('requires a base constant, rejects circular linear guesses, and allows loose bounds', () => {
    expect(substitutionProof('merge', 'nlog', 1).valid).toBe(false)
    expect(substitutionProof('merge', 'nlog', 1).base).toContain('4 ≤ 2c = 2')
    expect(substitutionProof('merge', 'nlog', 2).threshold).toBe(2)
    expect(substitutionProof('merge', 'linear', 100).valid).toBe(false)
    expect(substitutionProof('merge', 'square', 1).valid).toBe(true)
    expect(substitutionProof('merge', 'square', 1).explanation).toContain('loose')
    expect(substitutionProof('ternary', 'strengthened', 2).valid).toBe(false)
    expect(substitutionProof('ternary', 'nlog', 100).valid).toBe(false)
    expect(substitutionSamples('merge', 'nlog', 2)[0]).toEqual({ n: 1, actual: 1, bound: 0, holds: false })
  })
  it('certified induction substitutions close independently at every sampled recursive input', () => {
    for (const { id } of substitutionPresets)
      for (const guess of ['linear', 'nlog', 'square', 'nlog2', 'strengthened'] as const)
        for (const c of [0.5, 1, 2, 3, 10]) {
          const proof = substitutionProof(id, guess, c)
          if (!proof.valid) continue
          for (let i = 1; i <= 10; i++) {
            const n = id === 'chain' ? i + 1 : 2 ** i,
              child = id === 'chain' ? n - 1 : n / 2
            if (child < proof.threshold) continue
            const substituted = (id === 'chain' ? 1 : id === 'ternary' ? 3 : 2) * guessValue(guess, c, child) + n * (id === 'logwork' ? Math.log2(n) : 1)
            expect(substituted).toBeLessThanOrEqual(guessValue(guess, c, n) + 1e-7)
          }
        }
  })
  it('parses only supported, explicit forms and rejects invalid numeric domains', () => {
    expect(parseSubstitution(' T(n) = T(n − 1) + n ')).toBe('chain')
    expect(parseSubstitution('T(n)=2T(n/2)+n log₂ n')).toBe('logwork')
    expect(() => parseSubstitution('T(n) = alert(1)')).toThrow('supported')
    expect(() => exactSubstitutionCost('merge', 3)).toThrow('powers of 2')
    expect(() => exactSubstitutionCost('chain', 1025)).toThrow()
    expect(() => guessValue('square', NaN, 2)).toThrow()
    expect(() => substitutionProof('merge', 'nlog', 0)).toThrow()
    expect(() => substitutionSamples('merge', 'nlog', 2, 11)).toThrow()
  })
})
