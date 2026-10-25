import { describe, it, expect } from 'vitest'
import { caseComparison, caseSearch, integerInputSize, memoryAnalysis, parseCaseArray, stringInputSize } from './caseSpaceModel'
describe('case, input-size and auxiliary-memory analysis', () => {
  it('models the reference linear-search cases with the exact successful-target distribution', () => {
    const m = caseComparison([5, 8, 3, 7, 9], 'linear')
    expect([m.best, m.average, m.worst]).toEqual([1, 3, 5])
    expect(m.distribution.map((r) => r.comparisons)).toEqual([1, 2, 3, 4, 5])
    expect(caseSearch(m.input, 42, 'linear').index).toBe(-1)
    expect(caseSearch(m.input, 3, 'linear').steps.map((s) => s.index)).toEqual([0, 1, 2])
    for (let n = 1; n <= 12; n++)
      expect(
        caseComparison(
          Array.from({ length: n }, (_, i) => i),
          'linear',
        ).average,
      ).toBe((n + 1) / 2)
  })
  it('binary search sorts the case family and matches an independent interval evaluator', () => {
    for (let n = 1; n <= 12; n++) {
      const input = Array.from({ length: n }, (_, i) => i * 3 - 8),
        m = caseComparison([...input].reverse(), 'binary')
      expect(m.input).toEqual(input)
      for (const target of [...input, -100, 100]) {
        let lo = 0,
          hi = n - 1,
          count = 0,
          index = -1
        while (lo <= hi) {
          count++
          const mid = (lo + hi) >> 1
          if (input[mid] === target) {
            index = mid
            break
          }
          if (input[mid] < target) lo = mid + 1
          else hi = mid - 1
        }
        const actual = caseSearch(input, target, 'binary')
        expect(actual.comparisons).toBe(count)
        expect(actual.index).toBe(index)
      }
      expect(m.best).toBe(1)
      expect(m.worst).toBe(Math.floor(Math.log2(n)) + 1)
    }
    expect(caseComparison([5, 8, 3, 7, 9], 'binary').average).toBe(2.2)
  })
  it('uses exact binary representations without floating-point bit-length errors', () => {
    expect(integerInputSize('1024')).toMatchObject({ bits: 11, binary: '10000000000', exponent: 10, formatted: '1,024' })
    expect(integerInputSize('0')).toMatchObject({ bits: 1, binary: '0', exponent: null })
    for (let k = 1; k < 256; k++) {
      expect(integerInputSize((2n ** BigInt(k)).toString()).bits).toBe(k + 1)
      expect(integerInputSize((2n ** BigInt(k) - 1n).toString()).bits).toBe(k)
    }
    expect(integerInputSize((2n ** 256n - 1n).toString()).bits).toBe(256)
    expect(() => integerInputSize((2n ** 256n).toString())).toThrow()
    expect(() => integerInputSize('1.5')).toThrow()
  })
  it('separates recursive frames, temporary buffers and scalar variables without counting input storage', () => {
    for (let n = 1; n <= 12; n++)
      for (const algorithm of ['linear', 'binary'] as const) {
        expect(memoryAnalysis(n, 'iterative', algorithm)).toMatchObject({ frames: 1, temporary: 0, bound: 'Θ(1)' })
        expect(memoryAnalysis(n, 'temporary', algorithm)).toMatchObject({ frames: 1, temporary: n, bound: 'Θ(n)', heapObjects: 0 })
        const m = memoryAnalysis(n, 'recursive', algorithm)
        const search = caseSearch(
          Array.from({ length: n }, (_, i) => i),
          n + 1,
          algorithm,
        )
        expect(m.frames).toBe(search.comparisons + 1)
        expect(m.frameLabels).toHaveLength(m.frames)
        expect(m.frameLabels.at(-1)).toContain('base')
      }
  })
  it('validates assumptions and states the string size unit', () => {
    expect(parseCaseArray('5, 8, 3, 7, 9')).toEqual([5, 8, 3, 7, 9])
    expect(stringInputSize('A😀B')).toBe(3)
    expect(stringInputSize('')).toBe(0)
    expect(() => parseCaseArray('1,1')).toThrow('distinct')
    expect(() => parseCaseArray('')).toThrow()
    expect(() => parseCaseArray('10000')).toThrow()
    expect(() => caseSearch([2, 1], 1, 'binary')).toThrow('sorted')
    expect(() => caseSearch([], 1, 'linear')).toThrow()
    expect(() => memoryAnalysis(0, 'iterative', 'linear')).toThrow()
  })
})
