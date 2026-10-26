import { describe, expect, it } from 'vitest'
import { advanceFifo, createFifo, defaultFifo, fifoBound, fifoCertified, fifoExample, parseFifoInput } from './fifoKnapsackModel'

function oracle(weights: number[], profits: number[], capacity: number) {
  let best = 0
  for (let mask = 0; mask < 2 ** weights.length; mask++) {
    let w = 0,
      p = 0
    weights.forEach((weight, i) => {
      if (mask & (1 << i)) {
        w += weight
        p += profits[i]
      }
    })
    if (w <= capacity) best = Math.max(best, p)
  }
  return best
}
describe('FIFO knapsack lesson model', () => {
  it('uses the actual fractional relaxation instead of the erroneous mockup arithmetic', () => {
    const root = createFifo(fifoExample)
    expect(root.nodes[0].bound?.value).toBe(7)
    expect(fifoBound(root.items, 5, 1, 0, 0)?.value).toBe(6.5)
    expect(fifoBound(root.items, 5, 2, 2, 3)?.value).toBe(6.75)
    expect(fifoBound(root.items, 5, 2, 0, 0)?.value).toBe(6.2)
    expect(fifoBound(root.items, 5, 2, 6, 8)).toBeNull()
  })
  it('keeps one coherent breadth-first snapshot and explains deferred pruning', () => {
    const state = defaultFifo()
    expect(state.nodes).toHaveLength(7)
    expect(state.queue).toEqual([4, 5, 6])
    expect(state.explored).toBe(4)
    expect(state.best).toEqual({ profit: 7, weight: 5, chosen: [1, 2], node: 3 })
    expect(fifoCertified(state)).toBe(true)
    expect(state.complete).toBe(false)
    let finished = state
    while (!finished.complete) finished = advanceFifo(finished)
    expect(finished.explored).toBe(7)
    expect(finished.pruned).toBe(3)
    expect(finished.queue).toEqual([])
    expect(state.nodes[4].status).toBe('queued')
  })
  it('agrees with exhaustive subsets and bounds every feasible descendant for 100 small cases', () => {
    let seed = 714
    const rand = (n: number) => {
      seed = (seed * 1664525 + 1013904223) >>> 0
      return seed % n
    }
    for (let example = 0; example < 100; example++) {
      const n = 1 + rand(7),
        weights = Array.from({ length: n }, () => 1 + rand(9)),
        profits = weights.map(() => rand(16)),
        capacity = rand(25)
      let state = createFifo({ weights, profits, capacity })
      while (!state.complete) {
        const before = JSON.stringify(state),
          next = advanceFifo(state)
        expect(JSON.stringify(state)).toBe(before)
        expect(next.last).toBe(state.queue[0])
        const levels = next.queue.map((id) => next.nodes[id].level)
        expect(levels).toEqual([...levels].sort((a, b) => a - b))
        state = next
      }
      expect(state.best.profit).toBe(oracle(weights, profits, capacity))
      expect(state.best.weight).toBeLessThanOrEqual(capacity)
      for (const node of state.nodes) {
        if (!node.bound) continue
        const remaining = state.items.slice(node.level)
        const possible =
          node.profit +
          oracle(
            remaining.map((i) => i.weight),
            remaining.map((i) => i.profit),
            capacity - node.weight,
          )
        expect(node.bound.numerator).toBeGreaterThanOrEqual(possible * node.bound.denominator)
      }
    }
  })
  it('preserves original item IDs after density sorting and handles ties, zero profits and zero capacity', () => {
    let state = createFifo({ weights: [5, 1, 2], profits: [5, 10, 20], capacity: 3 })
    expect(state.items.map((i) => i.id)).toEqual([2, 3, 1])
    while (!state.complete) state = advanceFifo(state)
    expect(state.best.profit).toBe(30)
    expect(state.best.chosen).toEqual([2, 3])
    for (const input of [
      { weights: [2, 1], profits: [0, 0], capacity: 2 },
      { weights: [1], profits: [100], capacity: 0 },
    ]) {
      const zero = advanceFifo(createFifo(input))
      expect(zero.complete).toBe(true)
      expect(zero.best.profit).toBe(0)
      expect(zero.best.chosen).toEqual([])
    }
  })
  it('pauses before consuming a node at the budget and resumes without losing branches', () => {
    const initial = createFifo(fifoExample),
      paused = advanceFifo(initial, 1)
    expect(paused.paused).toBe(true)
    expect(paused.queue).toEqual([0])
    expect(paused.explored).toBe(0)
    expect(fifoCertified(paused)).toBe(false)
    expect(advanceFifo(paused, 3).queue).toEqual([1, 2])
    expect(parseFifoInput('1, 2', '4, 5', '3').capacity).toBe(3)
    for (const args of [
      ['', '', '3'],
      ['0', '2', '3'],
      ['1', '-1', '3'],
      ['1,2', '3', '4'],
      ['1', '2', '201'],
    ])
      expect(() => parseFifoInput(...(args as [string, string, string]))).toThrow()
  })
})
