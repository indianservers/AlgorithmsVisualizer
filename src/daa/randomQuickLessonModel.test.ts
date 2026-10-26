import { describe, it, expect } from 'vitest'
import { runRandomQuickLesson, randomQuickExample, parseQuickValues, parseQuickSeed, shuffleQuickValues } from './randomQuickLessonModel'
describe('036 seeded in-place three-way quicksort', () => {
  it('reproduces the reference first pivot and stable classification preview', () => {
    const r = runRandomQuickLesson(randomQuickExample, 42),
      f = r.frames[0]
    expect(f.pivotIndex).toBe(4)
    expect(f.pivot?.value).toBe(3)
    expect(f.less.map((x) => x.value)).toEqual([2, 1])
    expect(f.equal.map((x) => x.value)).toEqual([3])
    expect(f.greater.map((x) => x.value)).toEqual([7, 9, 4, 8, 6, 5])
    expect(r.root.left?.lo).toBe(0)
    expect(r.root.left?.hi).toBe(1)
    expect(r.root.right?.lo).toBe(3)
    expect(r.root.right?.hi).toBe(8)
  })
  it('retains point identity and respects every in-place partition invariant', () => {
    const r = runRandomQuickLesson([5, 2, 5, 1, 5, 9, -1], 42)
    for (const f of r.frames) {
      expect(f.array.map((p) => p.id).sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6])
      if (f.kind === 'partition' || f.kind === 'complete') {
        expect(f.array.slice(f.lo, f.lt).every((p) => p.value < f.pivot!.value)).toBe(true)
        expect(f.array.slice(f.lt, f.gt + 1).every((p) => p.value === f.pivot!.value)).toBe(true)
        expect(f.array.slice(f.gt + 1, f.hi + 1).every((p) => p.value > f.pivot!.value)).toBe(true)
      }
    }
    expect(r.sorted).toEqual([-1, 1, 2, 5, 5, 5, 9])
  })
  it('is reproducible by seed, sorts 200 generated arrays and preserves the input', () => {
    let seed = 361
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed
    }
    for (let trial = 0; trial < 200; trial++) {
      const a = Array.from({ length: 1 + (random() % 20) }, () => (random() % 31) - 15),
        copy = [...a],
        s = random(),
        r = runRandomQuickLesson(a, s)
      expect(r.sorted).toEqual([...a].sort((a, b) => a - b))
      expect(a).toEqual(copy)
      expect(runRandomQuickLesson(a, s).frames).toEqual(r.frames)
      expect(r.frames.at(-1)!.sorted).toHaveLength(a.length)
    }
  })
  it('groups duplicates once and handles singleton and extreme valid seeds', () => {
    const r = runRandomQuickLesson(Array(20).fill(7), 0)
    expect(r.nodes).toHaveLength(1)
    expect(r.frames.map((f) => f.kind)).toEqual(['choose', 'partition', 'complete'])
    expect(r.frames[1].equal).toHaveLength(20)
    expect(r.comparisons).toBe(40)
    expect(r.swaps).toBe(0)
    expect(runRandomQuickLesson([42], 4294967295).frames[0].kind).toBe('base')
  })
  it('validates custom arrays and seeds and produces deterministic shuffles', () => {
    expect(parseQuickValues('2, -3 2.5')).toEqual([2, -3, 2.5])
    for (const s of ['', '[]', '[null]', '[true]', '[1,]', 'Infinity', '1000001', JSON.stringify(Array(21).fill(2))])
      expect(() => parseQuickValues(s)).toThrow()
    for (const s of ['-1', '1.2', '1e3', '', '4294967296']) expect(() => parseQuickSeed(s)).toThrow()
    expect(parseQuickSeed('42')).toBe(42)
    const shuffled = shuffleQuickValues(randomQuickExample, 42)
    expect(shuffled).toEqual(shuffleQuickValues(randomQuickExample, 42))
    expect([...shuffled].sort((a, b) => a - b)).toEqual([...randomQuickExample].sort((a, b) => a - b))
  })
})
