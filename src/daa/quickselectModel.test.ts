import { describe, expect, it } from 'vitest'
import { quickReferenceValues, quickTrace, type QuickPivot } from './quickselectModel'
describe('reference 016: executable Quickselect partitions', () => {
  it('matches the four reference partitions with correct adjusted ranks', () => {
    const result = quickTrace(quickReferenceValues, 3)
    expect(result.answer).toBe(7)
    expect(result.frames.map((f) => ({ values: f.values, rank: f.rank, pivot: f.pivot, position: f.pivotIndex, branch: f.branch }))).toEqual([
      { values: [7, 10, 4, 3, 20, 15], rank: 3, pivot: 15, position: 4, branch: 'left' },
      { values: [7, 10, 4, 3], rank: 3, pivot: 3, position: 0, branch: 'right' },
      { values: [7, 10, 4], rank: 2, pivot: 4, position: 0, branch: 'right' },
      { values: [7, 10], rank: 1, pivot: 10, position: 1, branch: 'left' },
    ])
    expect(result.frames.at(-1)?.found).toBe(7)
    expect(result.frames[1].nextRank).toBe(2)
  })
  it('matches sorted order statistics for all pivot modes, ranks and duplicate signed data', () => {
    let state = 42
    for (let n = 1; n <= 45; n++) {
      const values = Array.from({ length: n }, () => {
          state = (Math.imul(state, 1664525) + 1013904223) >>> 0
          return (state % 19) - 9
        }),
        original = [...values]
      for (const mode of ['first', 'last', 'middle', 'random'] as QuickPivot[])
        for (const k of new Set([1, Math.ceil(n / 2), n])) {
          const result = quickTrace(values, k, mode, 123)
          expect(result.answer).toBe([...values].sort((a, b) => a - b)[k - 1])
          expect(values).toEqual(original)
          for (const [i, f] of result.frames.entries()) {
            expect(f.lower.every((v) => v < f.pivot)).toBe(true)
            expect(f.equal.every((v) => v === f.pivot)).toBe(true)
            expect(f.upper.every((v) => v > f.pivot)).toBe(true)
            expect(f.lower.length + f.equal.length + f.upper.length).toBe(f.values.length)
            expect(f.pivotIndex).toBe(f.lower.length)
            if (i < result.frames.length - 1) {
              const next = result.frames[i + 1]
              expect(next.values.length).toBeLessThan(f.values.length)
              expect(next.rank).toBe(f.nextRank)
              expect(next.values).toEqual(f.branch === 'left' ? f.lower : f.upper)
            }
          }
          expect(result.frames.at(-1)?.found).toBe(result.answer)
        }
    }
  })
  it('terminates for all-equal values, singletons, decimals and zero answers', () => {
    expect(quickTrace([5, 5, 5, 5, 5, 5], 4).frames).toHaveLength(1)
    expect(quickTrace([0], 1).answer).toBe(0)
    expect(quickTrace([2, 0, -3, 9], 2).answer).toBe(0)
    expect(quickTrace([0.2, -1.5, 7, 1], 2).answer).toBe(0.2)
  })
  it('is seeded and records adversarial sorted input honestly', () => {
    expect(quickTrace(quickReferenceValues, 3, 'random', 125)).toEqual(quickTrace(quickReferenceValues, 3, 'random', 125))
    expect(quickTrace([1, 2, 3, 4, 5, 6, 7, 8], 1, 'last').frames).toHaveLength(7)
  })
  it('rejects invalid cells, ranks, strategies and seeds', () => {
    for (const values of [[], [NaN], [Infinity], Array(61).fill(2)]) expect(() => quickTrace(values, 1)).toThrow('1–60')
    for (const k of [0, 2, 1.5, NaN]) expect(() => quickTrace([1], k)).toThrow('Rank')
    expect(() => quickTrace([1], 1, 'bad' as QuickPivot)).toThrow('strategy')
    for (const seed of [-1, 1.2, 4294967296, NaN]) expect(() => quickTrace([1], 1, 'random', seed)).toThrow('Seed')
  })
})
