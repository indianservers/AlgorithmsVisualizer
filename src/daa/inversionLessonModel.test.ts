import { describe, it, expect } from 'vitest'
import { inversionExample, runInversionLesson, parseInversionValues } from './inversionLessonModel'
const brute = (values: number[]) => values.flatMap((v, i) => values.flatMap((w, j) => (i < j && v > w ? [`${i}:${j}`] : [])))
describe('033 merge-and-count lesson', () => {
  it('counts three new pairs in the mockup comparison, seven in the complete input', () => {
    const r = runInversionLesson(inversionExample),
      f = r.frames[r.defaultCursor]
    expect(f.node).toBe('0:7')
    expect(f.i).toBe(1)
    expect(f.j).toBe(0)
    expect(f.output.map((v) => v.value)).toEqual([1, 2])
    expect(f.count).toBe(3)
    expect(f.added.map((p) => [p.left.value, p.right.value])).toEqual([
      [3, 2],
      [5, 2],
      [8, 2],
    ])
    expect(r.count).toBe(7)
    expect(r.sorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })
  it('sorts stably, never treats equal elements as inversions, and retains original indices', () => {
    const r = runInversionLesson([3, 1, 3, 1])
    expect(r.count).toBe(3)
    expect(r.root.sorted.map((v) => v.index)).toEqual([1, 3, 0, 2])
    expect(r.pairs.map((p) => `${p.left.index}:${p.right.index}`).sort()).toEqual(brute(r.values).sort())
    expect(runInversionLesson([5, 5, 5]).count).toBe(0)
  })
  it('handles singletons, negatives, odd sizes and fully reversed arrays', () => {
    const singleton = runInversionLesson([42])
    expect(singleton.frames).toEqual([])
    expect(singleton.defaultCursor).toBe(-1)
    expect(singleton.count).toBe(0)
    for (const a of [[-1, -5, -3], [5, 4, 3, 2, 1], Array.from({ length: 20 }, (_, i) => 20 - i)]) {
      const r = runInversionLesson(a)
      expect(r.count).toBe(brute(a).length)
      expect(r.sorted).toEqual([...a].sort((a, b) => a - b))
    }
    expect(runInversionLesson([5, 4, 3, 2, 1]).count).toBe(10)
  })
  it('every retained event and pair is truthful against an independent quadratic oracle', () => {
    let seed = 993
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed
    }
    for (let trial = 0; trial < 150; trial++) {
      const a = Array.from({ length: 1 + (random() % 20) }, () => (random() % 21) - 10),
        r = runInversionLesson(a)
      expect(r.pairs.map((p) => `${p.left.index}:${p.right.index}`).sort()).toEqual(brute(a).sort())
      expect(new Set(r.pairs.map((p) => `${p.left.index}:${p.right.index}`)).size).toBe(r.count)
      for (const [event, f] of r.frames.entries()) {
        expect(f.count).toBe(f.ledger.length)
        expect(f.output.map((v) => v.value)).toEqual([...f.output.map((v) => v.value)].sort((a, b) => a - b))
        expect(f.count - (r.frames[event - 1]?.count ?? 0)).toBe(f.added.length)
        for (const p of f.added) {
          expect(p.left.index).toBeLessThan(p.right.index)
          expect(p.left.value).toBeGreaterThan(p.right.value)
          expect(p.event).toBe(event)
        }
      }
      expect(r.count).toBe(brute(a).length)
    }
  })
  it('validates editing before replacing the current trace', () => {
    expect(parseInversionValues('2, -1 3.5\n0')).toEqual([2, -1, 3.5, 0])
    expect(parseInversionValues('[4,3]')).toEqual([4, 3])
    for (const text of ['', '[]', '[null]', '[true]', '["3"]', '[1,]', 'nope', 'Infinity', '1000001', JSON.stringify(Array(21).fill(1))])
      expect(() => parseInversionValues(text)).toThrow()
    expect(() => runInversionLesson([NaN])).toThrow()
  })
})
