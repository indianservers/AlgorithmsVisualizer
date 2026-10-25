import { describe, it, expect } from 'vitest'
import {
  activityTrace,
  compatibleSchedule,
  optimalActivitySchedule,
  exchangeFirst,
  exchangeActivities,
  parseActivities,
  fractionalKnapsack,
  fractionalExample,
  coinCounterexample,
} from './greedyExchangeModel'

describe('greedy choice and exchange models', () => {
  it('selects a feasible maximum-cardinality schedule and contrasts local rules', () => {
    const trace = activityTrace(exchangeActivities)
    expect(trace.selected.map((a) => a.id)).toEqual(['A1', 'A4', 'A6'])
    expect(trace.frames.map((f) => f.accepted)).toEqual([true, false, false, true, false, true])
    expect(compatibleSchedule(trace.selected)).toBe(true)
    expect(activityTrace(exchangeActivities, 'duration').selected.length).toBe(2)
    expect(activityTrace(exchangeActivities, 'start').selected.length).toBe(2)
    expect(trace.isOptimal).toBe(true)
  })
  it('checks earliest finish against an independent exhaustive oracle on seeded cases', () => {
    let seed = 7321
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed
    }
    for (let run = 0; run < 80; run++) {
      const input = Array.from({ length: 8 }, (_, i) => {
        const start = random() % 12
        return { id: `A${i}`, start, finish: start + 1 + (random() % 6) }
      })
      let optimum = 0
      for (let mask = 0; mask < 256; mask++) {
        const set = input.filter((_, i) => mask & (1 << i))
        let valid = true
        for (let i = 0; i < set.length; i++)
          for (let j = i + 1; j < set.length; j++) if (!(set[i].finish <= set[j].start || set[j].finish <= set[i].start)) valid = false
        if (valid) optimum = Math.max(optimum, set.length)
      }
      expect(activityTrace(input).selected.length).toBe(optimum)
      expect(optimalActivitySchedule(input).length).toBe(optimum)
      const swap = exchangeFirst(input, optimalActivitySchedule(input))
      expect(compatibleSchedule(swap.after)).toBe(true)
      expect(swap.after.length).toBe(optimum)
      expect(swap.greedy.finish).toBeLessThanOrEqual(swap.oldFirst.finish)
    }
  })
  it('allows touching endpoints, preserves input snapshots and validates editable intervals', () => {
    const input = parseActivities('B, 2, 5; C, 5, 7; D, 8, 9; A1, 1, 4')
    const copy = structuredClone(input),
      proof = exchangeFirst(input, input.slice(0, 3))
    expect(proof.after.map((a) => a.id)).toEqual(['A1', 'C', 'D'])
    expect(proof.changed).toBe(true)
    expect(input).toEqual(copy)
    for (const text of ['', 'A 5 5', 'A -1 5', 'A 0 101', 'A 0 2; A 3 4', 'A nan 3', 'A 1 2 3']) expect(() => parseActivities(text)).toThrow()
    expect(() => exchangeFirst(input, [input[0], input[3]])).toThrow()
  })
  it('computes fractional choices, tied ratios, capacity extremes and exclusions', () => {
    const result = fractionalKnapsack(fractionalExample, 50)
    expect(result.value).toBe(240)
    expect(result.used).toBe(50)
    expect(result.fractions).toEqual({ 1: 1, 2: 1, 3: 0.6666666666666666, 4: 0 })
    // At capacity 50, item 3 contributes 20/30, not the incorrect 1/2 shown in the mockup.
    expect(fractionalKnapsack(fractionalExample, 45).value).toBe(220)
    expect(fractionalKnapsack(fractionalExample, 0).value).toBe(0)
    expect(
      fractionalKnapsack(
        fractionalExample.map((a) => ({ ...a, included: false })),
        50,
      ).used,
    ).toBe(0)
    expect(fractionalKnapsack(fractionalExample, 1000).value).toBe(280)
    expect(() => fractionalKnapsack([{ id: 1, value: 5, weight: 0, included: true }], 10)).toThrow()
    expect(() => fractionalKnapsack(fractionalExample, -1)).toThrow()
  })
  it('finds the exact coin optimum and reports unreachable amounts honestly', () => {
    const result = coinCounterexample([1, 3, 4], 6)
    expect(result.greedy).toEqual([4, 1, 1])
    expect(result.optimal).toEqual([3, 3])
    expect(result.greedyOptimal).toBe(false)
    expect(coinCounterexample([1, 5, 10], 18).greedyOptimal).toBe(true)
    expect(coinCounterexample([4, 6], 5)).toMatchObject({ remaining: 1, optimal: null, greedyOptimal: false })
    expect(coinCounterexample([4, 6], 0)).toMatchObject({ greedy: [], optimal: [], greedyOptimal: true })
    expect(() => coinCounterexample([0], 6)).toThrow()
    expect(() => coinCounterexample([1, 1], 6)).toThrow()
  })
})
