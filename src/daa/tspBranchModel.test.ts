import { describe, expect, it } from 'vitest'
import {
  advanceTsp,
  createTsp,
  initialTspTimeline,
  nearestTspTour,
  parseTspMatrix,
  stepTspTimeline,
  tspCertified,
  tspFive,
  tspFour,
  tspLower,
  tspTourCost,
} from './tspBranchModel'

function oracle(matrix: number[][], path: number[]): number {
  const remaining = matrix.map((_, v) => v).filter((v) => !path.includes(v))
  if (!remaining.length) return tspTourCost(matrix, [...path, path[0]])
  return Math.min(...remaining.map((v) => oracle(matrix, [...path, v])))
}
describe('TSP branch-and-bound lesson model', () => {
  it('corrects all matrix, tour and lower-bound contradictions in reference 021', () => {
    expect(tspLower(tspFive, [0]).value).toBe(36)
    const selected = tspLower(tspFive, [0, 1])
    expect(selected.cost).toBe(10)
    expect(selected.value).toBe(38)
    expect(selected.terms.map((t) => t.cost)).toEqual([9, 7, 6, 6])
    expect(nearestTspTour(tspFive, 0)).toEqual({ tour: [0, 1, 3, 4, 2, 0], cost: 40 })
    expect(oracle(tspFive, [0])).toBe(40)
    expect(oracle(tspFour, [0])).toBe(80)
    const { state } = initialTspTimeline()
    expect(state.nodes).toHaveLength(8)
    expect(state.last).toBe(2)
    expect(state.frontier).toEqual([1, 7])
    expect(state.nodes[3].lower.value).toBe(44)
    expect(state.nodes[4].lower.value).toBe(43)
    expect(state.pruned).toBe(4)
    expect(tspCertified(state)).toBe(false)
  })
  it('bounds every feasible completion and finds the optimum for seeded and unseeded searches', () => {
    let seed = 2907
    const rand = (n: number) => {
      seed = (seed * 1664525 + 1013904223) >>> 0
      return seed % n
    }
    for (let example = 0; example < 35; example++) {
      const n = 2 + rand(5),
        matrix = Array.from({ length: n }, () => Array<number>(n).fill(0)),
        source = rand(n)
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) matrix[i][j] = matrix[j][i] = rand(20)
      for (const seeded of [false, true]) {
        let state = createTsp(matrix, source, seeded)
        while (!state.complete) {
          const frozen = JSON.stringify(state),
            next = advanceTsp(state)
          expect(JSON.stringify(state)).toBe(frozen)
          expect(next.last).toBe(state.frontier[0])
          for (const id of state.frontier) expect(state.nodes[state.frontier[0]].lower.value).toBeLessThanOrEqual(state.nodes[id].lower.value)
          state = next
        }
        expect(state.best!.cost).toBe(oracle(matrix, [source]))
        expect(tspTourCost(matrix, state.best!.tour)).toBe(state.best!.cost)
        expect(state.best!.tour[0]).toBe(source)
        expect(state.best!.tour.at(-1)).toBe(source)
        expect(new Set(state.best!.tour.slice(0, -1)).size).toBe(n)
        for (const node of state.nodes) expect(node.lower.value).toBeLessThanOrEqual(oracle(matrix, node.path))
        expect(tspCertified(state)).toBe(true)
      }
    }
  })
  it('counts the return edge once, including one-city, two-city and zero-weight cases', () => {
    expect(
      tspLower(
        [
          [0, 2],
          [2, 0],
        ],
        [0, 1],
      ).value,
    ).toBe(4)
    for (const matrix of [
      [[0]],
      [
        [0, 0],
        [0, 0],
      ],
      [
        [0, 2],
        [2, 0],
      ],
    ])
      for (const seeded of [true, false]) {
        let state = createTsp(matrix, 0, seeded)
        while (!state.complete) state = advanceTsp(state)
        expect(state.best!.cost).toBe(oracle(matrix, [0]))
        expect(state.best!.tour).toHaveLength(matrix.length + 1)
      }
  })
  it('preserves work at the node budget and supports exact rewind snapshots', () => {
    const root = createTsp(tspFive),
      paused = advanceTsp(root, 1)
    expect(paused.paused).toBe(true)
    expect(paused.frontier).toEqual([0])
    expect(paused.explored).toBe(0)
    expect(tspCertified(paused)).toBe(false)
    expect(advanceTsp(paused, 8).nodes).toHaveLength(5)
    const timeline = initialTspTimeline(),
      stepped = stepTspTimeline(timeline, 4095)
    expect(stepped.past.at(-1)).toBe(timeline.state)
    expect(stepped.state.explored).toBe(timeline.state.explored + 1)
  })
  it('validates matrix symmetry, numeric bounds, diagonal and source', () => {
    expect(parseTspMatrix('0, 4\n4, 0', '2')).toEqual({
      matrix: [
        [0, 4],
        [4, 0],
      ],
      source: 1,
    })
    for (const [text, source] of [
      ['', '1'],
      ['0,1\n2,0', '1'],
      ['1,2\n2,0', '1'],
      ['0,-1\n-1,0', '1'],
      ['0,1000\n1000,0', '1'],
      ['0,2', '1'],
      ['0', '2'],
    ])
      expect(() => parseTspMatrix(text, source)).toThrow()
  })
})
