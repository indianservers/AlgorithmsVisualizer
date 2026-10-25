import { describe, it, expect } from 'vitest'
import { classifyMaster, masterCombineCost, masterRegularityRatio, masterTreeLevels, masterPresets } from './masterTheoremModel'
describe('Master theorem classifier and tree model', () => {
  it('classifies the standard examples and corrects the mockup default', () => {
    const cases = masterPresets.map((p) => classifyMaster(p.parameters))
    expect(cases.map((c) => c.kind)).toEqual([1, 2, 2, 3, 1, 'uncovered'])
    expect(cases.map((c) => c.result)).toEqual(['Θ(n^(log_2 7))', 'Θ(n log n)', 'Θ(log n)', 'Θ(n^2)', 'Θ(n)', null])
    expect(cases[1].epsilon).toBeNull()
    expect(cases[1].regularity).toBeNull()
  })
  it('handles fixed logarithmic powers without inventing a polynomial gap', () => {
    for (let k = -3; k <= 5; k++) {
      expect(classifyMaster({ a: 4, b: 2, d: 1, k }).kind).toBe(1)
      expect(classifyMaster({ a: 2, b: 2, d: 2, k }).kind).toBe(3)
      expect(classifyMaster({ a: 2, b: 2, d: 1, k }).kind).toBe(k >= 0 ? 2 : 'uncovered')
    }
    expect(classifyMaster({ a: 4, b: 2, d: 2, k: 2 }).result).toBe('Θ(n^2 log^3 n)')
    expect(classifyMaster({ a: 1, b: 2, d: 0, k: 0 }).result).toBe('Θ(log n)')
    expect(classifyMaster({ a: 2, b: 2, d: 0, k: 5 }).epsilon).toBe(0.5)
  })
  it('proves an eventual regularity threshold even with a negative log power', () => {
    for (const a of [1, 2, 7, 15])
      for (const k of [-3, -1, 0, 2, 5]) {
        const parameters = { a, b: 16, d: 1, k },
          result = classifyMaster(parameters),
          regularity = result.regularity!
        expect(regularity.ratioLimit).toBeLessThan(regularity.c)
        expect(regularity.c).toBeLessThan(1)
        const logN = regularity.logThreshold + 1
        const n = Math.exp(logN)
        expect(masterRegularityRatio(parameters, n)).toBeLessThanOrEqual(regularity.c + 1e-12)
      }
    expect(classifyMaster({ a: 2, b: 2, d: 1, k: 0 }).kind).toBe(2)
    expect(masterRegularityRatio({ a: 2, b: 2, d: 1, k: 0 }, 64)).toBe(1)
  })
  it('matches independent recursive expansion and separates leaf costs from combine work', () => {
    const defaultTree = masterTreeLevels({ a: 2, b: 2, d: 1, k: 0 }, 6)
    expect(defaultTree.levels.map((l) => l.work)).toEqual([64, 64, 64, 64, 64, 64, 64])
    expect(defaultTree).toMatchObject({ n: 64, combineWork: 384, leafWork: 64, total: 448 })
    for (const a of [1, 2, 3, 4])
      for (const b of [2, 3, 4])
        for (const d of [0, 1, 2])
          for (const k of [-1, 0, 2]) {
            const p = { a, b, d, k },
              depth = 3
            function solve(level: number): number {
              if (level === 0) return 1
              const n = b ** level
              return a * solve(level - 1) + n ** d * Math.log2(n) ** k
            }
            expect(masterTreeLevels(p, depth).total).toBeCloseTo(solve(depth), 8)
            expect(masterTreeLevels(p, 0).total).toBe(1)
          }
  })
  it('keeps large bounded examples finite and does not mutate parameters', () => {
    const parameters = { a: 16, b: 16, d: 8, k: 5 },
      copy = { ...parameters },
      tree = masterTreeLevels(parameters, 10)
    expect(tree.levels).toHaveLength(11)
    expect(tree.levels.every((l) => Number.isFinite(l.work) && l.nodes >= 1)).toBe(true)
    expect(Number.isFinite(tree.total)).toBe(true)
    expect(parameters).toEqual(copy)
  })
  it('rejects unsupported input domains instead of silently evaluating arbitrary functions', () => {
    const p = { a: 2, b: 2, d: 1, k: 0 }
    for (const patch of [{ a: 0 }, { a: 1.5 }, { a: 17 }, { b: 1 }, { b: 2.5 }, { d: -1 }, { d: 9 }, { k: -4 }, { k: 6 }, { k: NaN }])
      expect(() => classifyMaster({ ...p, ...patch })).toThrow()
    for (const depth of [-1, 1.5, 11, Infinity]) expect(() => masterTreeLevels(p, depth)).toThrow()
    expect(() => masterCombineCost(1, p)).toThrow()
    expect(() => masterRegularityRatio(p, 2)).toThrow()
  })
})
