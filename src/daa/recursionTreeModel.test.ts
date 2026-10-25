import { describe, it, expect } from 'vitest'
import { recursionTreeAnalysis, recursionCostChart, decrementTree } from './recursionTreeModel'
describe('recursion-tree level analysis', () => {
  it('corrects the reference arithmetic and includes every leaf', () => {
    const tree = recursionTreeAnalysis({ a: 4, b: 2, d: 1, k: 0 }, 7)
    expect(tree.levels.map((l) => l.work)).toEqual([128, 256, 512, 1024, 2048, 4096, 8192, 16384])
    expect(tree).toMatchObject({
      n: 128,
      combineWork: 16256,
      leafWork: 16384,
      total: 32640,
      bound: 'Θ(n^2)',
      leafBound: 'Θ(n^2)',
      internalBound: 'Θ(n^2)',
      ratio: 2,
    })
    expect(tree.combineWork).toBe(tree.n * (tree.n - 1))
    expect(tree.total).toBe(2 * tree.n ** 2 - tree.n)
  })
  it('separates root, balanced and leaf-dominated trees against direct expansion', () => {
    for (const a of [1, 2, 3, 4])
      for (const b of [2, 3])
        for (const d of [0, 1, 2])
          for (const k of [-2, -1, 0, 2]) {
            const p = { a, b, d, k },
              depth = 4,
              tree = recursionTreeAnalysis(p, depth)
            function solve(h: number): number {
              if (!h) return 1
              const size = b ** h
              return a * solve(h - 1) + size ** d * Math.log2(size) ** k
            }
            expect(tree.total).toBeCloseTo(solve(depth), 7)
            expect(tree.levels.at(-1)).toMatchObject({ nodes: a ** depth, size: 1, perNode: 1, work: a ** depth, leaf: true })
            expect(tree.bound).toMatch(/^Θ\(/)
          }
    expect(recursionTreeAnalysis({ a: 2, b: 2, d: 1, k: 0 }, 7).bound).toBe('Θ(n log n)')
    expect(recursionTreeAnalysis({ a: 1, b: 2, d: 0, k: 0 }, 7).bound).toBe('Θ(log n)')
  })
  it('uses explicit harmonic-series extensions at the logarithmic boundary', () => {
    const harmonic = recursionTreeAnalysis({ a: 2, b: 2, d: 1, k: -1 }, 7),
      summable = recursionTreeAnalysis({ a: 2, b: 2, d: 1, k: -2 }, 7)
    expect(harmonic.classification.kind).toBe('uncovered')
    expect(harmonic.extension).toBe('Θ(n log log n)')
    expect(harmonic.bound).toBe(harmonic.extension)
    expect(summable.extension).toBe('Θ(n)')
    expect(recursionTreeAnalysis({ a: 1, b: 2, d: 0, k: -2 }, 7).bound).toBe('Θ(1)')
  })
  it('plots true linear and logarithmic axes including constant and wide-range costs', () => {
    const linear = recursionCostChart([128, 256, 512, 1024, 2048, 4096, 8192, 16384], 'linear')
    expect(linear).toMatchObject({ min: 0, max: 20000, ticks: [0, 5000, 10000, 15000, 20000] })
    expect(linear.fractions.at(-1)).toBe(16384 / 20000)
    const logarithmic = recursionCostChart([1, 10, 100, 1000], 'logarithmic')
    expect(logarithmic.fractions).toEqual([0, 1 / 3, 2 / 3, 1])
    expect(logarithmic.ticks).toEqual([1, 10, 100, 1000])
    for (const scale of ['linear', 'logarithmic'] as const) expect(recursionCostChart([1, 1, 1], scale).fractions.every(Number.isFinite)).toBe(true)
    expect(recursionCostChart([1, 1e100], 'logarithmic').ticks.length).toBeLessThanOrEqual(7)
    for (const values of [[], [0], [-1], [Infinity]]) expect(() => recursionCostChart(values, 'linear')).toThrow()
  })
  it('draws a decrement recurrence as a chain with linear depth, not a balanced tree', () => {
    for (let n = 1; n <= 16; n++) {
      const chain = decrementTree(n)
      expect(chain.levels.map((l) => l.size)).toEqual(Array.from({ length: n }, (_, i) => n - i))
      expect(chain.depth).toBe(n - 1)
      expect(chain.total).toBe((n * (n + 1)) / 2)
      expect(chain.levels.filter((l) => l.leaf)).toHaveLength(1)
    }
    expect(() => decrementTree(0)).toThrow()
    expect(() => decrementTree(17)).toThrow()
  })
  it('keeps bounded large models finite and validates lab domains', () => {
    const p = { a: 16, b: 16, d: 8, k: 5 },
      copy = { ...p },
      tree = recursionTreeAnalysis(p, 10)
    expect(tree.levels.every((l) => Number.isFinite(l.work))).toBe(true)
    expect(Number.isFinite(tree.total)).toBe(true)
    expect(p).toEqual(copy)
    expect(recursionTreeAnalysis({ a: 4, b: 2, d: 1, k: 0 }, 0)).toMatchObject({ n: 1, combineWork: 0, leafWork: 1, total: 1 })
    expect(() => recursionTreeAnalysis({ ...p, b: 1 }, 5)).toThrow()
    expect(() => recursionTreeAnalysis(p, 11)).toThrow()
  })
})
