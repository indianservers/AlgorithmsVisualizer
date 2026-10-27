import { describe, it, expect } from 'vitest'
import {
  runAnalysisLesson,
  runAnalysisSimulation,
  analysisExample,
  simulationExample,
  indicatorProbability,
  expectedQuickComparisons,
  parseAnalysisInput,
  parseAnalysisSimulation,
  analysisValues,
} from './expectedAnalysisLessonModel'
describe('045 expected and randomized quicksort analysis', () => {
  it('uses eight distinct keys, root pivot five and a coherent partition', () => {
    const r = runAnalysisLesson(analysisExample)
    expect(r.values).toEqual([7, 2, 9, 1, 5, 8, 3, 6])
    expect(r.root.pivot?.value).toBe(5)
    expect(r.root.less.map((k) => k.value)).toEqual([2, 1, 3])
    expect(r.root.greater.map((k) => k.value)).toEqual([7, 9, 8, 6])
    expect(r.root.comparisons).toBe(7)
    expect(r.root.sorted.map((k) => k.value)).toEqual([1, 2, 3, 5, 6, 7, 8, 9])
    expect(r.frames[0]).toMatchObject({ node: 0, phase: 0, performed: 0 })
  })
  it('checks 180 seeded traces against an independent rank-interval comparison oracle', () => {
    for (let t = 0; t < 180; t++) {
      const n = 1 + (t % 32),
        r = runAnalysisLesson({ size: n, type: t % 2 ? 'sorted' : 'reverse', seed: t * 101 })
      expect(r.root.sorted.map((k) => k.value)).toEqual([...r.values].sort((a, b) => a - b))
      const pivotOrder = r.frames.filter((f) => f.phase === 0).map((f) => r.nodes[f.node].pivot!.rank)
      let count = 0
      for (let i = 1; i <= n; i++)
        for (let j = i + 1; j <= n; j++) {
          const first = pivotOrder.find((p) => p >= i && p <= j)
          const compared = first === i || first === j
          if (compared) count++
          expect(r.comparedPairs.has(`${i}:${j}`)).toBe(compared)
        }
      expect(r.root.total).toBe(count)
      expect(r.comparedPairs.size).toBe(count)
      expect(r.frames.at(-1)?.performed).toBe(count)
      for (const node of r.nodes)
        if (node.pivot) {
          expect(node.less.every((k) => k.value < node.pivot!.value)).toBe(true)
          expect(node.greater.every((k) => k.value > node.pivot!.value)).toBe(true)
          expect(node.comparisons).toBe(node.values.length - 1)
        }
    }
  })
  it('derives expected comparisons from all pivot recurrences and indicator pairs', () => {
    const recurrence = [0, 0]
    for (let n = 2; n <= 128; n++) {
      recurrence[n] = n - 1 + (2 / n) * recurrence.slice(0, n).reduce((a, b) => a + b, 0)
      let sum = 0
      for (let i = 1; i <= n; i++) for (let j = i + 1; j <= n; j++) sum += indicatorProbability(i, j)
      expect(expectedQuickComparisons(n)).toBeCloseTo(recurrence[n], 9)
      expect(sum).toBeCloseTo(recurrence[n], 8)
    }
    expect(expectedQuickComparisons(50)).toBeCloseTo(258.9189445, 6)
  })
  it('reproduces simulation histograms and aligns the first trial with the animated algorithm', () => {
    const r = runAnalysisSimulation(simulationExample),
      again = runAnalysisSimulation(simulationExample)
    expect(r).toEqual(again)
    expect(r.counts[0]).toBe(runAnalysisLesson({ size: 50, type: 'random', seed: 42 }).root.total)
    expect(r.histogram.reduce((a, b) => a + b.count, 0)).toBe(1000)
    for (const b of r.histogram) expect(b.count).toBe(r.counts.filter((c) => c >= b.low && c <= b.high).length)
    expect(r.min).toBeGreaterThanOrEqual(49)
    expect(r.max).toBeLessThanOrEqual(1225)
    expect(Math.abs(r.mean - r.expected)).toBeLessThan(6 * r.standardError)
    expect(runAnalysisSimulation({ ...simulationExample, seed: 7 }).counts).not.toEqual(r.counts)
    const short = runAnalysisSimulation({ ...simulationExample, trials: 100 })
    expect(short.counts).toEqual(r.counts.slice(0, 100))
  })
  it('handles one- and two-key constant distributions, maximum bounds and distinct-key validation', () => {
    for (const size of [1, 2]) {
      const r = runAnalysisSimulation({ size, trials: 10, seed: 0 })
      expect(r.counts).toEqual(Array(10).fill(size - 1))
      expect(r.stddev).toBe(0)
      expect(r.histogram).toHaveLength(1)
    }
    expect(runAnalysisLesson({ size: 128, type: 'sorted', seed: 4294967295 }).root.sorted).toHaveLength(128)
    expect(analysisValues(8, 'random')).toEqual(analysisValues(8, 'random'))
    expect(parseAnalysisInput('3', 'custom', '42', '-2 5 0').values).toEqual([-2, 5, 0])
    expect(() => parseAnalysisInput('3', 'custom', '42', '5 5 0')).toThrow('distinct')
    expect(() => parseAnalysisInput('2', 'custom', '42', '1')).toThrow('exactly 2')
    expect(() => parseAnalysisInput('2', 'custom', '42', '1 0.5')).toThrow('integers')
    for (const size of ['0', '129', '1.5', '']) expect(() => parseAnalysisSimulation(size, '100', '42')).toThrow()
    for (const seed of ['-1', '4294967296', '1.5', 'NaN']) expect(() => parseAnalysisSimulation('8', '100', seed)).toThrow('Seed')
    for (const trials of ['0', '9', '5001', '1.5', '']) expect(() => parseAnalysisSimulation('8', trials, '42')).toThrow()
    expect(parseAnalysisSimulation('8', '100', '', 123).seed).toBe(123)
  })
})
