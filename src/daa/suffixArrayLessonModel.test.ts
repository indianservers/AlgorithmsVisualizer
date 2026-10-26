import { describe, it, expect } from 'vitest'
import { runSuffixArrayLesson, compareSuffixes, searchSuffixArray } from './suffixArrayLessonModel'
describe('041 suffix array construction and lexicographic comparison', () => {
  it('preserves every banana suffix, LCP and one-based inverse rank from the reference', () => {
    const r = runSuffixArrayLesson('banana')
    expect(r.suffixes.map((s) => s.suffix)).toEqual(['banana', 'anana', 'nana', 'ana', 'na', 'a'])
    expect(r.sa).toEqual([5, 3, 1, 0, 4, 2])
    expect(r.lcp).toEqual([0, 1, 3, 0, 0, 2])
    expect(r.rank).toEqual([4, 3, 6, 2, 5, 1])
    expect(r.frames.at(-1)).toMatchObject({ phase: 'complete', generated: 6, order: r.sa })
    expect(compareSuffixes(r.chars, 5, 3)).toMatchObject({
      result: -1,
      lcp: 1,
      reason: 'prefix',
      probes: [
        { offset: 0, left: 'a', right: 'a', result: 0 },
        { offset: 1, left: null, right: 'n', result: -1 },
      ],
    })
  })
  it('compares by first differing code point, prefix length, and exact equality', () => {
    const r = runSuffixArrayLesson('banana')
    expect(compareSuffixes(r.chars, 0, 1)).toMatchObject({ result: 1, lcp: 0, reason: 'character' })
    expect(compareSuffixes(r.chars, 1, 3)).toMatchObject({ result: 1, lcp: 3, reason: 'prefix' })
    expect(compareSuffixes(r.chars, 2, 2)).toMatchObject({ result: 0, lcp: 4, reason: 'equal' })
    expect(runSuffixArrayLesson('🙂\uE000a').sa).toEqual([2, 1, 0])
  })
  it('checks 150 strings against an independent fixed-width code-point ordering oracle', () => {
    let seed = 41
    const random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
        return seed
      },
      alphabet = ['a', 'b', 'c', '🙂', '\uE000', ' ']
    for (let t = 0; t < 150; t++) {
      const chars = Array.from({ length: random() % 25 }, () => alphabet[random() % alphabet.length]),
        r = runSuffixArrayLesson(chars.join('')),
        encoded = chars.map((_, i) =>
          chars
            .slice(i)
            .map((c) => c.codePointAt(0)!.toString(16).padStart(6, '0'))
            .join(''),
        ),
        expected = encoded
          .map((key, index) => ({ key, index }))
          .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
          .map((e) => e.index)
      expect(r.sa).toEqual(expected)
      expect(new Set(r.sa).size).toBe(chars.length)
      r.sa.forEach((start, i) => {
        expect(r.rank[start]).toBe(i + 1)
        let common = 0
        if (i) while (chars[r.sa[i - 1] + common] !== undefined && chars[r.sa[i - 1] + common] === chars[start + common]) common++
        expect(r.lcp[i]).toBe(common)
      })
      for (const frame of r.frames) {
        expect(frame.generated).toBeLessThanOrEqual(chars.length)
        if (frame.order.length) expect([...frame.order].sort((a, b) => a - b)).toEqual(chars.map((_, i) => i))
      }
    }
  })
  it('binary-searches contiguous matching ranges without losing overlaps', () => {
    const r = runSuffixArrayLesson('banana')
    expect(searchSuffixArray(r, 'ana')).toMatchObject({ lo: 1, hi: 3, positions: [1, 3] })
    expect(searchSuffixArray(r, 'na').positions).toEqual([2, 4])
    expect(searchSuffixArray(r, 'xyz').positions).toEqual([])
    expect(searchSuffixArray(r, '').positions).toEqual([])
    const repeated = runSuffixArrayLesson('a'.repeat(50))
    expect(searchSuffixArray(repeated, 'aaa').positions).toHaveLength(48)
    for (const text of ['🙂a🙂a', ' A A ', 'mississippi', 'BANANA']) {
      const run = runSuffixArrayLesson(text),
        chars = Array.from(text)
      for (const query of ['a', 'A', ' ', '🙂a', 'iss', 'zz']) {
        const p = Array.from(query),
          expected = chars.flatMap((_, i) => (p.every((c, j) => c === chars[i + j]) ? [i] : []))
        expect(searchSuffixArray(run, query).positions).toEqual(expected)
      }
    }
  })
  it('supports empty and single-character strings and bounded worst-case repeated prefixes', () => {
    expect(runSuffixArrayLesson('')).toMatchObject({ sa: [], rank: [], lcp: [], suffixes: [] })
    expect(runSuffixArrayLesson('a')).toMatchObject({ sa: [0], lcp: [0], rank: [1] })
    const r = runSuffixArrayLesson('a'.repeat(50))
    expect(r.sa).toEqual(Array.from({ length: 50 }, (_, i) => 49 - i))
    expect(r.lcp).toEqual(Array.from({ length: 50 }, (_, i) => i))
    for (const c of r.comparisons) {
      expect(c.result).not.toBe(0)
      expect(c.probes.at(-1)!.result).toBe(c.result)
    }
  })
  it('rejects invalid indices, oversized and control-character inputs without trimming', () => {
    for (const text of ['a'.repeat(51), 'a\nb', '\t', '\u0000']) expect(() => runSuffixArrayLesson(text)).toThrow()
    expect(() => runSuffixArrayLesson(null as unknown as string)).toThrow()
    expect(() => compareSuffixes(['a'], 0, 1)).toThrow()
    expect(() => compareSuffixes(['a'], -1, 0)).toThrow()
    expect(runSuffixArrayLesson(' a ').text).toBe(' a ')
  })
})
