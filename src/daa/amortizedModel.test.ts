import { describe, it, expect } from 'vitest'
import { appendOperations, dynamicArrayTrace, stackCreditTrace, type ArrayOperation } from './amortizedModel'
describe('amortized-analysis teaching models', () => {
  it('computes every doubling cost in the worked reference example', () => {
    const run = dynamicArrayTrace(appendOperations(8)),
      steps = run.states.slice(1)
    expect(steps.map((s) => s.capacity)).toEqual([1, 2, 4, 4, 8, 8, 8, 8])
    expect(steps.map((s) => s.cost)).toEqual([1, 2, 3, 1, 5, 1, 1, 1])
    expect(steps.map((s) => s.totalCost)).toEqual([1, 3, 6, 7, 12, 13, 14, 15])
    expect(steps.map((s) => s.amortizedCost)).toEqual([2, 3, 3, 3, 3, 3, 3, 3])
    expect(run.states[5]).toMatchObject({ values: [10, 20, 30, 40, 50], capacity: 8, cost: 5, totalCost: 12, resizeCount: 3, potential: 2 })
  })
  it('matches an independent aggregate formula and demonstrates why 2n is insufficient', () => {
    for (let n = 1; n <= 32; n++) {
      const run = dynamicArrayTrace(appendOperations(n)),
        last = run.states.at(-1)!,
        capacity = 2 ** Math.ceil(Math.log2(n))
      expect(last.totalCost).toBe(n + capacity - 1)
      expect(last.totalCost).toBeLessThan(3 * n)
      expect(last.totalAmortizedCost).toBe(last.totalCost + last.potential)
    }
    expect(dynamicArrayTrace(appendOperations(9)).states[9].totalCost).toBe(24)
    expect(24).toBeGreaterThan(2 * 9)
  })
  it('preserves array values and the potential bound across valid mixed sequences', () => {
    for (let seed = 0; seed < 12; seed++) {
      const ops: ArrayOperation[] = [],
        oracle: number[] = []
      let capacity = 1,
        total = 0
      for (let i = 0; i < 64; i++) {
        const push = oracle.length === 0 || (oracle.length < 32 && (i * 11 + seed * 7) % 5 !== 0)
        if (push) {
          const value = (i - seed) / 2
          ops.push({ kind: 'push', value })
          if (oracle.length === capacity) {
            total += oracle.length
            capacity *= 2
          }
          oracle.push(value)
        } else {
          ops.push({ kind: 'pop' })
          oracle.pop()
        }
        total++
        const s = dynamicArrayTrace(ops).states.at(-1)!
        expect(s.values).toEqual(oracle)
        expect(s.capacity).toBe(capacity)
        expect(s.totalCost).toBe(total)
        expect(s.potential).toBeGreaterThanOrEqual(0)
        expect(s.totalAmortizedCost - s.totalCost).toBe(s.potential)
        expect(s.amortizedCost).toBeLessThanOrEqual(3)
        expect(s.totalCost).toBeLessThanOrEqual(3 * (i + 1))
      }
    }
  })
  it('retains capacity on pop, allows negative amortized costs and keeps snapshots immutable', () => {
    const ops = [...appendOperations(5), { kind: 'pop' } as const],
      r = dynamicArrayTrace(ops)
    expect(r.states[6]).toMatchObject({ capacity: 8, cost: 1, potential: 0, amortizedCost: -1, value: 50 })
    expect(r.states[5].values).toEqual([10, 20, 30, 40, 50])
    expect(ops).toHaveLength(6)
  })
  it('balances the separate stack accounting model without negative credits', () => {
    const run = stackCreditTrace(['push', 'push', 'pop', 'push', 'pop', 'pop'])
    expect(run.states.map((s) => s.credits)).toEqual([0, 1, 2, 1, 2, 1, 0])
    expect(run.states.at(-1)).toMatchObject({ totalActual: 6, totalCharged: 6, size: 0 })
    expect(run.states.every((s) => s.credits === s.size)).toBe(true)
    expect(() => stackCreditTrace(['pop'])).toThrow('before popping')
  })
  it('rejects invalid operations and values without producing a partial run', () => {
    for (const n of [-1, 1.5, 33]) expect(() => appendOperations(n)).toThrow()
    for (const value of [NaN, Infinity, 1000001]) expect(() => dynamicArrayTrace([{ kind: 'push', value }])).toThrow('finite value')
    expect(() => dynamicArrayTrace([{ kind: 'pop' }])).toThrow('empty')
    expect(() => dynamicArrayTrace([...appendOperations(32), { kind: 'push', value: 1 }])).toThrow('32 elements')
    expect(() => dynamicArrayTrace(Array(65).fill({ kind: 'push', value: 1 }))).toThrow('64 operations')
  })
})
