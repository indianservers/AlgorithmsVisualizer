import { describe, it, expect } from 'vitest'
import {
  runRandomSelection,
  randomSelectExample,
  parseSelectionValues,
  parseSelectionRank,
  parseSelectionSeed,
  shuffleSelectionValues,
} from './randomSelectLessonModel'
describe('037 iterative seeded quickselect', () => {
  it('reproduces the reference main pivot and returns the fourth-smallest value', () => {
    const r = runRandomSelection(randomSelectExample, 4, 42),
      f = r.frames[r.defaultCursor]
    expect(f.kind).toBe('partition')
    expect(f.pivot.value).toBe(7)
    expect(f.position).toBe(6)
    expect(f.rank).toBe(7)
    expect([f.left, f.right]).toEqual([6, 3])
    expect(f.branch).toBe('left')
    expect(r.result).toBe(4)
    expect(r.frames.at(-1)?.branch).toBe('found')
  })
  it('partitions in place, preserves IDs and updates rank when taking the right side', () => {
    const r = runRandomSelection(randomSelectExample, 9, 42)
    expect(r.steps[0].branch).toBe('right')
    expect(r.steps[0].nextK).toBe(2)
    for (const f of r.frames) {
      expect(f.array.map((i) => i.id).sort((a, b) => a - b)).toEqual(Array.from({ length: 10 }, (_, i) => i))
      if (f.kind !== 'choose') {
        expect(f.array.slice(f.lo, f.position!).every((i) => i.value <= f.pivot.value)).toBe(true)
        expect(f.array.slice(f.position! + 1, f.hi + 1).every((i) => i.value > f.pivot.value)).toBe(true)
        expect(f.rank).toBe(f.position! - f.lo + 1)
      }
    }
    expect(r.result).toBe(9)
  })
  it('stops when the rank equals the pivot rank instead of searching a wrong range', () => {
    const r = runRandomSelection(randomSelectExample, 7, 42)
    expect(r.steps).toHaveLength(1)
    expect(r.steps[0].branch).toBe('found')
    expect(r.result).toBe(7)
    expect(r.frames.at(-1)?.kind).toBe('done')
  })
  it('agrees with sorted order at every rank on 100 seeded arrays including duplicates', () => {
    let seed = 371
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed
    }
    for (let trial = 0; trial < 100; trial++) {
      const a = Array.from({ length: 1 + (random() % 20) }, () => (random() % 31) - 15),
        expected = [...a].sort((a, b) => a - b),
        copy = [...a],
        s = random()
      for (let k = 1; k <= a.length; k++) {
        const r = runRandomSelection(a, k, s)
        expect(r.result).toBe(expected[k - 1])
        expect(r.frames).toEqual(runRandomSelection(a, k, s).frames)
        for (const f of r.steps) {
          expect(f.localK).toBe(k - f.lo)
          expect(f.lo).toBeLessThanOrEqual(k - 1)
          expect(f.hi).toBeGreaterThanOrEqual(k - 1)
        }
      }
      expect(a).toEqual(copy)
    }
    expect(runRandomSelection([5, 5, 5, 5], 1, 42).result).toBe(5)
  })
  it('validates arrays, one-based rank and uint32 seeds before creating a trace', () => {
    expect(parseSelectionValues('2, -3 1.5')).toEqual([2, -3, 1.5])
    for (const s of ['', '[]', '[null]', '[true]', '[1,]', 'Infinity', '1000001', JSON.stringify(Array(21).fill(1))])
      expect(() => parseSelectionValues(s)).toThrow()
    for (const k of ['0', '-1', '1.5', '11', '1e0']) expect(() => parseSelectionRank(k, 10)).toThrow()
    for (const s of ['', '-1', '1.5', '4294967296']) expect(() => parseSelectionSeed(s)).toThrow()
    expect(shuffleSelectionValues(randomSelectExample, 42)).toEqual(shuffleSelectionValues(randomSelectExample, 42))
    expect(runRandomSelection([42], 1, 0).result).toBe(42)
  })
})
