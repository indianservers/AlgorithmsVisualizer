import { describe, it, expect } from 'vitest'
import { runReliabilityLesson, reliabilityExample, parallelReliability, parseReliabilityInput } from './reliabilityLessonModel'
describe('042 unit-copy reliability design DP', () => {
  it('computes one coherent default optimum instead of the inconsistent reference totals', () => {
    const r = runReliabilityLesson(reliabilityExample)
    expect(r.optimum.copies).toEqual([2, 3, 2, 3])
    expect(r.optimum.reliability).toBeCloseTo(0.8655558912, 12)
    expect(r.dp[4][4]).toBeCloseTo(0.3024, 12)
    expect(r.dp[0]).toEqual(Array(23).fill(1))
    for (let i = 1; i <= 4; i++) for (let b = 0; b < i; b++) expect(r.dp[i][b]).toBeNull()
    expect(r.optimum.spent).toBe(10)
    expect(r.frames.at(-1)).toMatchObject({ phase: 'result', filled: 55, row: 4, budget: 10 })
  })
  it('checks 120 small instances against exhaustive positive-copy allocations', () => {
    let seed = 42
    const random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
        return seed
      },
      values = [0, 0.2, 0.4, 0.5, 0.7, 0.8, 0.9, 1]
    for (let t = 0; t < 120; t++) {
      const n = 1 + (random() % 4),
        B = random() % 11,
        p = Array.from({ length: n }, () => values[random() % values.length]),
        r = runReliabilityLesson({ stages: n, budget: B, probabilities: p })
      function brute(i: number, b: number, product: number): number | null {
        if (i === n) return product
        if (b < n - i) return null
        let best = -Infinity
        for (let k = 1; k <= b - (n - i - 1); k++) {
          const value = brute(i + 1, b - k, product * (1 - (1 - p[i]) ** k))
          if (value !== null) best = Math.max(best, value)
        }
        return best
      }
      const expected = brute(0, B, 1)
      if (expected === null) {
        expect(r.optimum.feasible).toBe(false)
        expect(r.optimum.reliability).toBeNull()
      } else {
        expect(r.optimum.reliability).toBeCloseTo(expected, 12)
        expect(r.optimum.copies.every((k) => k >= 1)).toBe(true)
        expect(r.optimum.spent).toBeLessThanOrEqual(B)
        expect(r.optimum.stageReliabilities.reduce((a, p) => a * p, 1)).toBeCloseTo(expected, 12)
      }
      for (let b = n + 1; b <= r.limit; b++) expect(r.dp[n][b]!).toBeGreaterThanOrEqual(r.dp[n][b - 1]! - 1e-14)
    }
  })
  it('verifies every feasible transition and reconstructed budget certificate', () => {
    const r = runReliabilityLesson(reliabilityExample)
    for (let i = 1; i <= 4; i++)
      for (let b = i; b <= r.limit; b++) {
        const list = r.candidates[i][b]
        expect(list).toHaveLength(b - i + 1)
        expect(r.dp[i][b]).toBe(Math.max(...list.map((c) => c.product)))
        for (const c of list) {
          expect(c.remaining).toBe(b - c.copies)
          expect(c.previous).toBe(r.dp[i - 1][c.remaining])
          expect(c.product).toBe(c.previous * c.stage)
        }
        expect(list.find((c) => c.copies === r.choice[i][b])!.product).toBe(r.dp[i][b])
      }
    for (const point of r.curve)
      if (point.feasible) {
        expect(point.spent + point.unused).toBe(point.budget)
        expect(point.stageReliabilities.reduce((a, p) => a * p, 1)).toBeCloseTo(point.reliability!, 12)
      }
  })
  it('distinguishes infeasible budgets from feasible zero reliability and preserves unused capacity', () => {
    const zero = runReliabilityLesson({ stages: 2, budget: 4, probabilities: [0, 0.9] })
    expect(zero.optimum.feasible).toBe(true)
    expect(zero.optimum.reliability).toBe(0)
    expect(zero.optimum.copies).toEqual([1, 1])
    expect(zero.optimum.unused).toBe(2)
    expect(runReliabilityLesson({ stages: 2, budget: 1, probabilities: [0.5, 0.5] }).optimum).toMatchObject({ feasible: false, reliability: null, copies: [] })
    expect(runReliabilityLesson({ stages: 2, budget: 10, probabilities: [1, 1] }).optimum).toMatchObject({
      reliability: 1,
      copies: [1, 1],
      spent: 2,
      unused: 8,
    })
  })
  it('handles numerical endpoints and the maximum lesson dimensions', () => {
    expect(parallelReliability(0, 24)).toBe(0)
    expect(parallelReliability(1, 24)).toBe(1)
    expect(parallelReliability(1e-20, 2)).toBeCloseTo(2e-20, 30)
    const r = runReliabilityLesson({ stages: 6, budget: 24, probabilities: [0.2, 0.4, 0.6, 0.8, 0.9, 0.99] })
    expect(r.dp).toHaveLength(7)
    expect(r.dp[0]).toHaveLength(25)
    expect(r.optimum.copies).toHaveLength(6)
    expect(r.optimum.reliability).toBeGreaterThan(0)
    expect(r.frames.every((f) => f.filled >= 0 && f.filled <= 175)).toBe(true)
  })
  it('parses exact-length lists and rejects invalid integer or probability inputs atomically', () => {
    expect(parseReliabilityInput('4', '10', '0.8, 0.7, 0.9, 0.6')).toEqual(reliabilityExample)
    for (const args of [
      ['', '10', '0.8'],
      ['1', '', '0.8'],
      ['0', '10', '0.8'],
      ['7', '10', '0.8'],
      ['1', '25', '0.8'],
      ['1', '-1', '0.8'],
      ['1', '2.5', '0.8'],
      ['2', '4', '0.8'],
      ['1', '4', '1.1'],
      ['1', '4', 'NaN'],
      ['1', '4', 'Infinity'],
    ])
      expect(() => parseReliabilityInput(...(args as [string, string, string]))).toThrow()
  })
})
