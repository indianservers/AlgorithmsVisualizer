import { describe, expect, it } from 'vitest'
import { medianGroups, medianReferenceValues, medianTrace, parseMedianValues } from './medianModel'
describe('mockup Median-of-Medians lesson: executable evidence', () => {
  it('derives all five mockup groups and their medians from the reference values', () => {
    expect(medianGroups(medianReferenceValues)).toHaveLength(5)
    const run = medianTrace(medianReferenceValues, 11),
      root = run.frames.find((f) => f.depth === 0 && f.phase === 'pivot')!
    expect(root.medians).toEqual([5, 6, 11, 17, 19])
    expect(root.pivot).toBe(11)
    expect(run.answer).toBe(10)
    expect(root.groups.flat()).toEqual(medianReferenceValues)
  })
  it('corrects the off-by-one worked example instead of reproducing the reference error', () => {
    const run = medianTrace(medianReferenceValues.slice(0, 15), 7),
      decision = run.frames.find((f) => f.depth === 0 && f.phase === 'recurse')!
    expect(decision.lower).toHaveLength(6)
    expect(decision.equal).toEqual([6])
    expect(decision.branch).toBe('equal')
    expect(run.answer).toBe(6)
  })
  it('matches sorted order statistics and truthful recursive frames across small, duplicate and signed inputs', () => {
    let seed = 727
    for (let n = 1; n <= 60; n++) {
      const values = Array.from({ length: n }, () => {
          seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
          return (seed % 41) - 20
        }),
        before = [...values]
      for (const k of new Set([1, Math.ceil(n / 2), n])) {
        const run = medianTrace(values, k)
        expect(run.answer).toBe([...values].sort((a, b) => a - b)[k - 1])
        expect(values).toEqual(before)
        for (const f of run.frames) {
          expect(f.groups.flat()).toEqual(f.values)
          expect(f.sorted).toEqual(f.groups.map((g) => [...g].sort((a, b) => a - b)))
          expect(f.medians).toEqual(f.sorted.map((g) => g[Math.floor(g.length / 2)]))
          if (f.lower) {
            expect(f.lower.every((v) => v < f.pivot!)).toBe(true)
            expect(f.equal!.every((v) => v === f.pivot)).toBe(true)
            expect(f.upper!.every((v) => v > f.pivot!)).toBe(true)
            expect(f.lower.length + f.equal!.length + f.upper!.length).toBe(f.values.length)
          }
        }
        expect(JSON.parse(JSON.stringify(run))).toEqual(run)
      }
    }
  })
  it('handles short groups, equal pivots, fractional values and rank boundaries', () => {
    expect(medianTrace([3, 3, 3, 3, 3, 3], 4).answer).toBe(3)
    expect(medianTrace([0.2, -1.5, 0.1, 7.3, 9, 4, 4.1], 3).answer).toBe(0.2)
    expect(parseMedianValues('1, 2\n -3 4')).toEqual([1, 2, -3, 4])
    expect(() => medianTrace([], 1)).toThrow('1–60')
    expect(() => medianTrace([1], 0)).toThrow('rank')
    expect(() => medianTrace([1], 2)).toThrow('rank')
    expect(() => medianTrace([1], 1.5)).toThrow('rank')
    expect(() => parseMedianValues('1,nope')).toThrow('finite')
  })
})
