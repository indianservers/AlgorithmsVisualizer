import { describe, expect, it } from 'vitest'
import {
  advanceMethod,
  createMethod,
  defaultMethod,
  methodCertified,
  methodMax,
  methodMin,
  methodPrunable,
  parseMethodData,
  structuralMethodOrder,
  subtreeOptimum,
  tightMethodBounds,
  unreachedReason,
} from './branchBoundMethodModel'

describe('branch-and-bound method laboratory', () => {
  it('keeps the reference tree values while distinguishing feasible, pruned and unreached nodes', () => {
    const state = defaultMethod()
    expect(state.best).toEqual({ id: 4, value: 12 })
    expect(state.expanded).toEqual([1, 2])
    expect(state.pruned).toEqual([3, 5])
    expect(state.status).toEqual(['expanded', 'expanded', 'pruned', 'witness', 'pruned', 'unreached', 'unreached'])
    expect(state.complete).toBe(true)
    expect(methodCertified(state)).toBe(true)
    expect(unreachedReason(state, 6)).toContain('ancestor node 3')
    expect(defaultMethod(methodMin).best).toEqual({ id: 4, value: 80 })
  })
  it('computes true structural orders independently of pruning and uses stable bound ties', () => {
    expect(structuralMethodOrder(methodMax, 'fifo')).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(structuralMethodOrder(methodMax, 'best')).toEqual([1, 2, 3, 4, 5, 7, 6])
    expect(structuralMethodOrder(methodMin, 'best')).toEqual([1, 2, 4, 3, 7, 5, 6])
    expect(methodPrunable('max', 12, 12)).toBe(true)
    expect(methodPrunable('max', 13, 12)).toBe(false)
    expect(methodPrunable('min', 80, 80)).toBe(true)
    expect(methodPrunable('min', 79, 80)).toBe(false)
    expect(methodPrunable('min', 80, null)).toBe(false)
  })
  it('finds the exhaustive optimum for both senses, all seed choices and policies with pruning on or off', () => {
    for (const data of [methodMax, methodMin])
      for (const policy of ['fifo', 'best'] as const)
        for (const seed of [null, 4, 5, 6, 7])
          for (const pruning of [true, false]) {
            let state = createMethod(data, policy, seed, pruning),
              steps = 0
            while (!state.complete) {
              const frozen = JSON.stringify(state),
                next = advanceMethod(state)
              expect(JSON.stringify(state)).toBe(frozen)
              state = next
              if (++steps > 7) throw new Error('Search did not terminate')
            }
            expect(state.best!.value).toBe(subtreeOptimum(data, 1))
            expect(state.best!.id).toBeGreaterThanOrEqual(4)
            expect(methodCertified(state)).toBe(true)
          }
  })
  it('rejects unsafe edited bounds with a concrete terminal witness and repairs only this finite teaching example', () => {
    expect(() => parseMethodData('max', '0,10,8,12,10,8,7', '16,14,7,12,11,9,11')).toThrow('Unsafe bound at node 3')
    expect(() => parseMethodData('min', methodMin.values.join(','), '81,70,85,80,90,90,86')).toThrow('Unsafe bound at node 1')
    expect(tightMethodBounds('max', methodMax.values.join(','))).toEqual([12, 12, 8, 12, 10, 8, 7])
    expect(tightMethodBounds('min', methodMin.values.join(','))).toEqual([80, 80, 88, 80, 94, 91, 88])
    const tight = parseMethodData('max', methodMax.values.join(','), tightMethodBounds('max', methodMax.values.join(',')).join(','))
    expect(advanceMethod(createMethod(tight)).complete).toBe(true)
  })
  it('validates fixed tree inputs and never uses partial scores as an incumbent', () => {
    for (const [values, bounds] of [
      ['', ''],
      ['0,1', '1,2'],
      ['0,10,8,12,10,8,7', '16,14,12,12,11,9,-1'],
    ])
      expect(() => parseMethodData('max', values, bounds)).toThrow()
    expect(() => createMethod(methodMax, 'best', 2)).toThrow('complete terminal')
    let state = createMethod(methodMax, 'best', null)
    state = advanceMethod(state)
    expect(state.best).toBeNull()
    state = advanceMethod(state)
    expect(state.best).toBeNull()
    state = advanceMethod(state)
    expect(state.best).toBeNull()
    state = advanceMethod(state)
    expect(state.best).toEqual({ id: 4, value: 12 })
  })
})
