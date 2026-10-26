import { describe, it, expect } from 'vitest'
import { metricTspExample, runMetricTspLesson, parseMetricInput, metricDistances, tourCost, type MetricInput } from './metricTspLessonModel'
describe('039 metric TSP double-tree lesson', () => {
  it('uses exact Euclidean distances and a consistent MST, walk and Hamiltonian tour', () => {
    const r = runMetricTspLesson(metricTspExample)
    expect(r.edges).toHaveLength(21)
    expect(r.mst).toHaveLength(6)
    expect(r.mstCost).toBeCloseTo(5 * Math.sqrt(5) + Math.sqrt(8), 12)
    expect(r.distances[1][2]).toBeCloseTo(Math.sqrt(5), 12)
    expect(r.distances[4][5]).toBeCloseTo(Math.sqrt(5), 12)
    expect(r.walk).toHaveLength(13)
    expect(r.traversals).toHaveLength(12)
    expect(r.mst.map((e) => [e.u, e.v]).sort()).toEqual([
      [0, 1],
      [0, 3],
      [2, 3],
      [3, 6],
      [4, 5],
      [5, 6],
    ])
    expect(r.tour).toEqual([0, 1, 3, 2, 6, 5, 4, 0])
    expect(r.cost).toBeCloseTo(3 * Math.sqrt(5) + 2 * Math.sqrt(10) + Math.sqrt(8) + 3, 12)
    expect(r.doubledCost).toBeCloseTo(2 * r.mstCost, 12)
    expect(r.shortcuts.reduce((sum, s) => sum + s.walkCost, 0)).toBeCloseTo(r.doubledCost, 12)
    expect(r.shortcuts.reduce((sum, s) => sum + s.direct, 0)).toBeCloseTo(r.cost, 12)
  })
  it('verifies all shortcut and MST lower-bound certificates on generated metrics', () => {
    let seed = 39
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed
    }
    for (let t = 0; t < 70; t++) {
      const n = 1 + (random() % 9),
        points = Array.from({ length: n }, () => [random() % 30, random() % 30] as [number, number]),
        r = runMetricTspLesson({ points, source: random() % n, mode: t % 2 ? 'euclidean' : 'manhattan' })
      expect(r.mst).toHaveLength(n - 1)
      expect(r.tour[0]).toBe(r.graph.source)
      expect(r.tour.at(-1)).toBe(r.graph.source)
      expect(new Set(n === 1 ? r.tour : r.tour.slice(0, -1)).size).toBe(n)
      expect(r.mstCost).toBeLessThanOrEqual(r.optimum.cost + 1e-8)
      expect(r.cost).toBeLessThanOrEqual(2 * r.mstCost + 1e-8)
      expect(r.cost).toBeLessThanOrEqual(2 * r.optimum.cost + 1e-8)
      expect(tourCost(r.optimum.tour, r.distances)).toBeCloseTo(r.optimum.cost, 8)
      for (const s of r.shortcuts) {
        expect(s.via[0]).toBe(s.from)
        expect(s.via.at(-1)).toBe(s.to)
        expect(s.direct).toBeLessThanOrEqual(s.walkCost + 1e-8)
      }
      for (const e of r.mst) {
        expect(r.traversals.filter((s) => s.from === e.u && s.to === e.v)).toHaveLength(1)
        expect(r.traversals.filter((s) => s.from === e.v && s.to === e.u)).toHaveLength(1)
      }
    }
  })
  it('independently verifies the Held–Karp optimum against permutations', () => {
    function permute(a: number[]): number[][] {
      if (!a.length) return [[]]
      return a.flatMap((v, i) => permute(a.filter((_, j) => j !== i)).map((t) => [v, ...t]))
    }
    for (let n = 2; n <= 7; n++) {
      const r = runMetricTspLesson({ points: Array.from({ length: n }, (_, i) => [(i * i) % 11, (i * 7) % 13]), mode: 'euclidean', source: n - 1 }),
        others = Array.from({ length: n - 1 }, (_, i) => i)
      expect(r.optimum.cost).toBeCloseTo(Math.min(...permute(others).map((p) => tourCost([n - 1, ...p, n - 1], r.distances))), 10)
    }
  })
  it('supports matrix metrics, singleton and coincident cities without fake ratios', () => {
    const matrix: MetricInput = {
        points: [
          [0, 0],
          [1, 0],
          [0, 1],
        ],
        mode: 'matrix',
        source: 1,
        matrix: [
          [0, 1, 2],
          [1, 0, 1],
          [2, 1, 0],
        ],
      },
      r = runMetricTspLesson(matrix)
    expect(r.cost).toBe(4)
    expect(r.mstCost).toBe(2)
    expect(runMetricTspLesson({ mode: 'euclidean', points: [[0, 0]], source: 0 })).toMatchObject({ cost: 0, mstCost: 0, walk: [0], tour: [0], ratio: null })
    expect(
      runMetricTspLesson({
        mode: 'euclidean',
        points: [
          [0, 0],
          [0, 0],
          [0, 0],
        ],
        source: 0,
      }),
    ).toMatchObject({ cost: 0, mstCost: 0, ratio: null, approximationRatio: null })
    expect(parseMetricInput(JSON.stringify(matrix))).toEqual(matrix)
  })
  it('rejects incomplete, asymmetric, nonmetric and malformed input atomically', () => {
    for (const s of [
      'bad',
      'null',
      '{}',
      '{"points":[],"mode":"euclidean","source":0}',
      '{"points":[[0,0]],"mode":"other","source":0}',
      '{"points":[[0,0]],"mode":"euclidean","source":1}',
      '{"points":[[1001,0]],"mode":"euclidean","source":0}',
    ])
      expect(() => parseMetricInput(s)).toThrow()
    for (const matrix of [
      [
        [1, 1],
        [1, 0],
      ],
      [
        [0, 1],
        [2, 0],
      ],
      [
        [0, -1],
        [-1, 0],
      ],
      [[0], [1, 0]],
      [
        [0, Infinity],
        [Infinity, 0],
      ],
    ])
      expect(() =>
        metricDistances({
          points: [
            [0, 0],
            [1, 1],
          ],
          source: 0,
          mode: 'matrix',
          matrix,
        }),
      ).toThrow()
    expect(() =>
      metricDistances({
        points: [
          [0, 0],
          [1, 0],
          [2, 0],
        ],
        source: 0,
        mode: 'matrix',
        matrix: [
          [0, 1, 8],
          [1, 0, 1],
          [8, 1, 0],
        ],
      }),
    ).toThrow(/Triangle inequality/)
  })
})
