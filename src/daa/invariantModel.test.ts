import { describe, it, expect } from 'vitest'
import { binaryInvariantTrace, binaryInvariantExample, insertionInvariantTrace, parseInvariantArray, inductionSumExample } from './invariantModel'

describe('induction and invariant models', () => {
  it('uses a valid upper midpoint and distinguishes inspection from a revealed result', () => {
    const trace = binaryInvariantTrace(binaryInvariantExample, 37)
    expect(trace.frames[0]).toMatchObject({ low: 0, high: 15, mid: 8, status: 'compare', result: null, variant: 16, comparisons: 0 })
    expect(trace.frames[1]).toMatchObject({ status: 'found', mid: 8, result: 8, comparisons: 1 })
    expect(trace.result).toBe(8)
  })
  it('maintains candidate containment and a decreasing backedge variant on seeded sorted arrays', () => {
    let seed = 21983
    const rand = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed
    }
    for (let run = 0; run < 120; run++) {
      const input = Array.from({ length: rand() % 25 }, () => Number(rand() % 31) - 15).sort((a, b) => a - b),
        target = Number(rand() % 41) - 20,
        copy = [...input],
        trace = binaryInvariantTrace(input, target)
      if (input.includes(target)) expect(input[trace.result]).toBe(target)
      else expect(trace.result).toBe(-1)
      for (let i = 0; i < trace.frames.length; i++) {
        const frame = trace.frames[i]
        expect(frame.invariantHolds).toBe(true)
        if (frame.status === 'compare') {
          expect(frame.mid).toBeGreaterThanOrEqual(frame.low)
          expect(frame.mid).toBeLessThanOrEqual(frame.high)
        }
        if (i && frame.status !== 'found') expect(frame.variant).toBeLessThan(trace.frames[i - 1].variant)
        if (frame.status === 'missing') expect(frame.variant).toBe(0)
      }
      expect(input).toEqual(copy)
    }
  })
  it('handles empty, singleton, duplicates, absent values and invalid search inputs', () => {
    expect(binaryInvariantTrace([], 1).frames[0]).toMatchObject({ low: 0, high: -1, mid: null, status: 'missing', result: -1 })
    expect(binaryInvariantTrace([3], 3).result).toBe(0)
    expect(binaryInvariantTrace([3], 2).result).toBe(-1)
    expect(binaryInvariantTrace([2, 2, 2, 2], 2).result).toBe(2)
    expect(() => binaryInvariantTrace([3, 1], 2)).toThrow('sorted')
    expect(() => binaryInvariantTrace([1], Infinity)).toThrow()
    expect(() => binaryInvariantTrace(Array(33).fill(0), 0)).toThrow()
  })
  it('proves sortedness and element preservation at every completed insertion boundary', () => {
    const input = [5, 2, 4, 6, 1, 3],
      trace = insertionInvariantTrace(input)
    expect(trace.result).toEqual([1, 2, 3, 4, 5, 6])
    expect(trace.frames[0]).toMatchObject({ i: 0, prefixSorted: true, prefixPermutation: true, wholePermutation: true, variant: 6 })
    expect(trace.frames[2].values).toEqual([2, 5, 4, 6, 1, 3])
    expect(trace.frames[2].moves).toContain('Shift 5 from index 0 to 1.')
    for (const frame of trace.frames) {
      expect(frame.values.slice(0, frame.i)).toEqual(input.slice(0, frame.i).sort((a, b) => a - b))
      expect([...frame.values].sort((a, b) => a - b)).toEqual([...input].sort((a, b) => a - b))
      expect(frame.variant).toBe(input.length - frame.i)
      expect(frame.prefixSorted && frame.prefixPermutation && frame.wholePermutation).toBe(true)
    }
    expect(input).toEqual([5, 2, 4, 6, 1, 3])
    expect(insertionInvariantTrace([]).frames).toHaveLength(1)
    expect(insertionInvariantTrace([2, -3, 2, 0]).result).toEqual([-3, 0, 2, 2])
  })
  it('validates editable arrays without coercing malformed JSON values', () => {
    expect(parseInvariantArray('')).toEqual([])
    expect(parseInvariantArray('[]')).toEqual([])
    expect(parseInvariantArray('2, -1, 2, 0.5')).toEqual([2, -1, 2, 0.5])
    for (const value of ['[1,"2"]', '[null]', '{}', '[1,]', 'NaN', '1000001']) expect(() => parseInvariantArray(value)).toThrow()
    expect(() => insertionInvariantTrace([NaN])).toThrow()
  })
  it('computes induction examples against independent direct sums for every supported k', () => {
    let sum = 0
    for (let k = 0; k <= 1000; k++) {
      sum += k
      expect(inductionSumExample(k)).toMatchObject({ assumed: sum, next: sum + k + 1, formula: sum + k + 1, holds: true })
    }
    for (const k of [-1, 1.5, 1001, NaN]) expect(() => inductionSumExample(k)).toThrow()
  })
})
