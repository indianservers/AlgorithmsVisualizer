import { describe, expect, it } from 'vitest'
import { advanceBest, bestCertified, bestExample, compareBestNodes, createBest, defaultBest } from './bestFirstKnapsackModel'

function oracle(weights: number[], profits: number[], capacity: number) {
  let best = 0
  for (let mask = 0; mask < 2 ** weights.length; mask++) {
    let w = 0,
      p = 0
    weights.forEach((v, i) => {
      if (mask & (1 << i)) {
        w += v
        p += profits[i]
      }
    })
    if (w <= capacity) best = Math.max(best, p)
  }
  return best
}
describe('best-first knapsack model', () => {
  it('corrects the reference instance and derives all dashboard values from one snapshot', () => {
    const root = createBest(bestExample),
      state = defaultBest()
    expect(root.nodes[0].bound?.value).toBe(12)
    expect(root.items.map((i) => i.id)).toEqual([1, 3, 2, 4])
    expect(state.best).toEqual({ profit: 11, weight: 5, chosen: [1, 2], node: 5 })
    expect(state.nodes).toHaveLength(7)
    expect(state.frontier).toEqual([2])
    expect(state.nodes[2].bound?.value).toBeCloseTo(29 / 3)
    expect(state.nodes[3].bound).toBeNull()
    expect(state.nodes[6].bound?.value).toBe(9.6)
    expect(state.expanded).toBe(3)
    expect(state.pruned).toBe(2)
    expect(bestCertified(state)).toBe(true)
    expect(advanceBest(state).complete).toBe(true)
  })
  it('pops the greatest exact bound, not the oldest node, and keeps stable ties', () => {
    const state = advanceBest(advanceBest(createBest(bestExample)))
    expect(state.frontier).toEqual([4, 2])
    expect(advanceBest(state).last).toBe(4)
    const a = state.nodes[4],
      b = { ...a, id: a.id + 1 }
    expect(compareBestNodes(a, b)).toBeLessThan(0)
    const x = { ...a, bound: { ...a.bound!, numerator: 300001, denominator: 30000, value: 300001 / 30000 } }
    const y = { ...b, bound: { ...b.bound!, numerator: 100000, denominator: 10000, value: 10 } }
    expect(compareBestNodes(x, y)).toBeLessThan(0)
  })
  it('matches exhaustive subsets and preserves input/state over 120 deterministic cases', () => {
    let seed = 90210
    const rand = (n: number) => {
      seed = (1664525 * seed + 1013904223) >>> 0
      return seed % n
    }
    for (let example = 0; example < 120; example++) {
      const n = 1 + rand(8),
        weights = Array.from({ length: n }, () => 1 + rand(10)),
        profits = weights.map(() => rand(21)),
        capacity = rand(30)
      let state = createBest({ weights, profits, capacity })
      while (!state.complete) {
        const frozen = JSON.stringify(state),
          next = advanceBest(state)
        expect(JSON.stringify(state)).toBe(frozen)
        expect(next.last).toBe(state.frontier[0])
        for (const id of state.frontier) expect(compareBestNodes(state.nodes[state.frontier[0]], state.nodes[id])).toBeLessThanOrEqual(0)
        state = next
      }
      expect(state.best.profit).toBe(oracle(weights, profits, capacity))
      expect(state.best.weight).toBeLessThanOrEqual(capacity)
      expect(state.best.chosen.reduce((sum, id) => sum + profits[id - 1], 0)).toBe(state.best.profit)
      expect(state.best.chosen.reduce((sum, id) => sum + weights[id - 1], 0)).toBe(state.best.weight)
      expect(bestCertified(state)).toBe(true)
    }
  })
  it('pauses before consuming frontier work and resumes with the same priority', () => {
    const initial = createBest(bestExample),
      paused = advanceBest(initial, 1)
    expect(paused.paused).toBe(true)
    expect(paused.frontier).toEqual([0])
    expect(paused.explored).toBe(0)
    expect(bestCertified(paused)).toBe(false)
    expect(advanceBest(paused, 3).frontier).toEqual([1, 2])
  })
  it('handles zero capacity, zero profits and overweight children without infeasible incumbents', () => {
    for (const input of [
      { weights: [1], profits: [100], capacity: 0 },
      { weights: [2, 3], profits: [0, 0], capacity: 5 },
    ]) {
      const state = advanceBest(createBest(input))
      expect(state.complete).toBe(true)
      expect(state.best.profit).toBe(0)
      expect(state.best.chosen).toEqual([])
    }
    const state = advanceBest(advanceBest(createBest({ weights: [3, 4], profits: [6, 7], capacity: 5 })))
    expect(state.nodes[3].weight).toBe(7)
    expect(state.nodes[3].status).toBe('pruned')
    expect(state.frontier).not.toContain(3)
    expect(state.best.weight).toBeLessThanOrEqual(5)
    expect(createBest({ weights: Array(20).fill(1), profits: Array(20).fill(1), capacity: 10 }).items).toHaveLength(20)
  })
})
