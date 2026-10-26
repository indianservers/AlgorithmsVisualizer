import { describe, it, expect } from 'vitest'
import { boyerMooreExample, runBadCharacterLesson } from './boyerMooreLessonModel'
function naive(text: string, pattern: string) {
  const t = Array.from(text),
    p = Array.from(pattern)
  return Array.from({ length: Math.max(0, t.length - p.length + 1) }, (_, s) => s).filter((s) => p.every((c, j) => c === t[s + j]))
}
describe('040 Boyer–Moore bad-character lesson', () => {
  it('uses all 24 text characters and a real I/A mismatch at alignment nine', () => {
    const r = runBadCharacterLesson(boyerMooreExample.text, boyerMooreExample.pattern)
    expect(r.t).toHaveLength(24)
    expect(r.p).toHaveLength(7)
    expect(r.matches).toEqual([17])
    expect(r.alignments).toEqual([0, 7, 9, 12, 17])
    expect(r.frames[r.defaultCursor]).toMatchObject({
      phase: 'mismatch',
      s: 9,
      j: 2,
      i: 11,
      textChar: 'I',
      patternChar: 'A',
      last: -1,
      shift: 3,
      nextS: 12,
      suffixFrom: 3,
    })
    expect(r.last).toEqual([
      { char: 'E', index: 6 },
      { char: 'X', index: 1 },
      { char: 'A', index: 2 },
      { char: 'M', index: 3 },
      { char: 'P', index: 4 },
      { char: 'L', index: 5 },
    ])
  })
  it('preserves overlap matches and clamps a rightward rightmost occurrence to shift one', () => {
    expect(runBadCharacterLesson('AAAAA', 'AAA').matches).toEqual([0, 1, 2])
    const f = runBadCharacterLesson('AAAA', 'ABAA').frames.find((f) => f.phase === 'mismatch')!
    expect(f).toMatchObject({ j: 1, last: 3, shift: 1, nextS: 1 })
    expect(runBadCharacterLesson('ABCXYZ', 'XYZ').frames.find((f) => f.phase === 'mismatch')).toMatchObject({ j: 2, last: -1, shift: 3 })
  })
  it('agrees with a naive oracle on 500 generated Unicode and space-containing cases', () => {
    let seed = 40
    const random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
        return seed
      },
      alphabet = ['A', 'B', 'C', '🙂', ' ']
    for (let trial = 0; trial < 500; trial++) {
      const text = Array.from({ length: random() % 16 }, () => alphabet[random() % 5]).join(''),
        pattern = Array.from({ length: random() % 8 }, () => alphabet[random() % 5]).join(''),
        r = runBadCharacterLesson(text, pattern)
      expect(r.matches).toEqual(naive(text, pattern))
      for (const f of r.frames) {
        if (f.phase === 'mismatch') {
          expect(f.textChar).not.toBe(f.patternChar)
          expect(f.shift).toBe(Math.max(1, f.j! - f.last))
          expect(f.nextS).toBe(f.s + f.shift)
          expect(r.matches.filter((s) => s > f.s && s < f.nextS!)).toEqual([])
          for (let j = f.j! + 1; j < r.p.length; j++) expect(r.t[f.s + j]).toBe(r.p[j])
        }
        if (f.phase === 'match') expect(f.textChar).toBe(f.patternChar)
        expect(f.matches.every((s) => r.matches.includes(s))).toBe(true)
      }
    }
  })
  it('counts code points, handles empty boundaries, and terminates when no alignment fits', () => {
    expect(runBadCharacterLesson('🙂A🙂A🙂', '🙂A🙂').matches).toEqual([0, 2])
    expect(runBadCharacterLesson('ABC', '').matches).toEqual([0, 1, 2, 3])
    expect(runBadCharacterLesson('', '').matches).toEqual([0])
    expect(runBadCharacterLesson('', 'A')).toMatchObject({ matches: [], comparisons: 0, alignments: [] })
    expect(runBadCharacterLesson('AB', 'ABCDE').frames).toHaveLength(1)
  })
  it('retains exact counters and valid indices at the 50-character boundary', () => {
    const r = runBadCharacterLesson('A'.repeat(50), 'A'.repeat(25))
    expect(r.matches).toHaveLength(26)
    expect(r.comparisons).toBe(650)
    expect(r.frames.filter((f) => f.phase === 'match' || f.phase === 'mismatch')).toHaveLength(r.comparisons)
    for (const f of r.frames)
      if (f.i !== null) {
        expect(f.i).toBeLessThan(50)
        expect(f.j).toBeLessThan(25)
        expect(f.i).toBe(f.s + f.j!)
      }
    expect(r.frames.at(-1)).toMatchObject({ phase: 'complete', matches: r.matches, comparisons: 650 })
  })
  it('rejects oversized, non-string and control-character input without trimming spaces', () => {
    for (const [t, p] of [
      ['A'.repeat(51), 'A'],
      ['A', 'B'.repeat(51)],
      ['A\nB', 'A'],
      ['A', '\t'],
      ['\u0000', 'A'],
    ])
      expect(() => runBadCharacterLesson(t, p)).toThrow()
    expect(() => runBadCharacterLesson(null as unknown as string, 'A')).toThrow()
    expect(runBadCharacterLesson(' A ', ' ').matches).toEqual([0, 2])
  })
})
