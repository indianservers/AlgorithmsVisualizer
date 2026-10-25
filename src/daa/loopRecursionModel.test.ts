import { describe, it, expect } from 'vitest'
import { growthPlot, growthValue, loopSummary, recursionTrace, type RecursionFunction } from './loopRecursionModel'
describe('loop and recursion analysis', () => {
  it('enumerates real loop iterations and exact closed counts for every allowed n', () => {
    for (let n = 1; n <= 20; n++) {
      for (const pattern of ['nested', 'triangular', 'doubling'] as const) {
        const model = loopSummary(n, pattern)
        expect(model.count).toBe(pattern === 'nested' ? n * n : pattern === 'triangular' ? (n * (n + 1)) / 2 : Math.floor(Math.log2(n)) + 1)
        model.iterations.forEach((row, index) => {
          expect(row.ordinal).toBe(index + 1)
          expect(row.i).toBeLessThanOrEqual(n)
          if (row.j !== null) expect(row.j).toBeLessThanOrEqual(pattern === 'triangular' ? row.i : n)
        })
      }
    }
    expect(loopSummary(6, 'nested').count).toBe(36)
    expect(loopSummary(6, 'triangular').count).toBe(21)
    expect(loopSummary(6, 'doubling').iterations.map((row) => row.i)).toEqual([1, 2, 4])
  })
  it('factorial tracks real frames, base case and every return rather than counting all calls as live', () => {
    for (let n = 0; n <= 10; n++) {
      const trace = recursionTrace(n, 'factorial'),
        oracle = Array.from({ length: n }, (_, i) => i + 1).reduce((a, b) => a * b, 1)
      expect(trace.result).toBe(oracle)
      expect(trace.peak).toBe(n + 1)
      expect(trace.frames.map((f) => f.n)).toEqual(Array.from({ length: n + 1 }, (_, i) => n - i))
      expect(trace.snapshots[n].phase).toBe('base')
      expect(trace.snapshots.at(-1)).toMatchObject({ phase: 'done', stack: [], returned: oracle })
      for (let i = 1; i < trace.snapshots.length; i++) expect(Math.abs(trace.snapshots[i].stack.length - trace.snapshots[i - 1].stack.length)).toBe(1)
    }
    expect(recursionTrace(4, 'factorial').frames.map((f) => f.value)).toEqual([24, 6, 2, 1, 1])
  })
  it('binary search uses an actual sorted-array interval and a missing target at n + 1', () => {
    for (let n = 0; n <= 10; n++) {
      const trace = recursionTrace(n, 'binary')
      expect(trace.result).toBe(-1)
      expect(trace.peak).toBe(n === 0 ? 1 : Math.floor(Math.log2(n)) + 2)
      trace.frames.forEach((f, i) => {
        expect(f.hi! - f.lo! + 1).toBe(f.n)
        if (f.n > 0) {
          expect(f.mid! + 1).toBeLessThan(n + 1)
          expect(trace.frames[i + 1].lo).toBe(f.mid! + 1)
          expect(trace.frames[i + 1].hi).toBe(f.hi)
        }
      })
    }
  })
  it('growth curves change coordinates under real axes and preserve actual values', () => {
    for (const max of [20, 100, 1000])
      for (const scale of ['linear', 'log'] as const) {
        const model = growthPlot(max, scale, ['quadratic', 'linear', 'logarithmic', 'binary'])
        for (const series of model.series) {
          expect(series.points).toHaveLength(max)
          for (const point of series.points) {
            expect(point.value).toBe(growthValue(series.id, point.n))
            expect(point.y).toBeGreaterThanOrEqual(0)
            expect(point.y).toBeLessThanOrEqual(1)
          }
        }
      }
    const linear = growthPlot(100, 'linear', ['quadratic']),
      log = growthPlot(100, 'log', ['quadratic'])
    expect(linear.series[0].points[9].y).not.toBe(log.series[0].points[9].y)
    expect(growthValue('binary', 8)).toBe(5)
    expect(growthPlot(20, 'log', []).ticks).toEqual([1, 10])
  })
  it('rejects unbounded or invalid inputs', () => {
    expect(() => loopSummary(21, 'nested')).toThrow()
    expect(() => loopSummary(1.5, 'doubling')).toThrow()
    for (const fn of ['factorial', 'binary'] as RecursionFunction[]) expect(() => recursionTrace(-1, fn)).toThrow()
    expect(() => growthPlot(0, 'linear', [])).toThrow()
    expect(() => growthValue('linear', NaN)).toThrow()
  })
})
