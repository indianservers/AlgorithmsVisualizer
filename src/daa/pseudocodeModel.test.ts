import { describe, it, expect } from 'vitest'
import { runPseudocode, compilePseudocode, pseudoTemplates, binarySearchExample, descriptionTemplate, parsePseudoArray } from './pseudocodeModel'
describe('bounded educational pseudocode interpreter', () => {
  it('executes linear and binary searches against independent input oracles', () => {
    for (let n = 0; n <= 30; n++)
      for (const x of [-9, 0, 3, 11, 40]) {
        const a = Array.from({ length: n }, (_, i) => (i % 8) - 3)
        expect(runPseudocode(pseudoTemplates.linear, a, x).result).toBe(a.indexOf(x))
        const sorted = [...a].sort((a, b) => a - b),
          r = runPseudocode(pseudoTemplates.binary, sorted, x)
        if (sorted.includes(x)) {
          expect(typeof r.result).toBe('number')
          expect(sorted[r.result as number]).toBe(x)
        } else expect(r.result).toBe(-1)
        expect(r.frames.at(-1)?.phase).toBe('return')
        expect(r.frames.at(-1)?.result).toBe(r.result)
      }
  })
  it('generates the exact worked binary-search trace from data', () => {
    const example = binarySearchExample([2, 5, 8, 12, 16, 23], 12)
    expect(example.result).toBe(3)
    expect(example.rows.map((r) => [r.low, r.high, r.mid, r.value])).toEqual([
      [0, 5, 2, 8],
      [3, 5, 4, 16],
      [3, 3, 3, 12],
    ])
    expect(example.rows.map((r) => r.action)).toEqual(['x > 8 → low = 3', 'x < 16 → high = 3', 'x found → return 3'])
    expect(binarySearchExample([], 1)).toEqual({ result: -1, rows: [] })
    expect(() => binarySearchExample([3, 1], 1)).toThrow('sorted')
  })
  it('executes changed programs and records immutable variable snapshots', () => {
    const source = `ALGORITHM Custom(A, n, x)\ntotal ← 0\nfor i ← 0 to n − 1 do\n  total ← total + A[i] * 2\nend for\nreturn total + x`
    const a = [-1, 2.5, 4],
      run = runPseudocode(source, a, 3)
    expect(run.result).toBe(14)
    expect(run.frames[0].variables.total).toBe(0)
    expect(run.frames.at(-1)?.variables.total).toBe(11)
    expect(a).toEqual([-1, 2.5, 4])
    expect(runPseudocode(source.replace('total + x', '42'), a, 3).result).toBe(42)
  })
  it('handles maximum, sum, negatives, duplicates and array preconditions', () => {
    for (const a of [[3], [-4, -7, -2], [0, 0], [4, -2, 7, 7]]) {
      expect(runPseudocode(pseudoTemplates.maximum, a, 0).result).toBe(Math.max(...a))
      expect(runPseudocode(pseudoTemplates.sum, a, 0).result).toBe(a.reduce((s, v) => s + v, 0))
    }
    expect(runPseudocode(pseudoTemplates.sum, [], 0).result).toBe(0)
    expect(() => runPseudocode(pseudoTemplates.maximum, [], 0)).toThrow('outside')
    expect(() => runPseudocode(pseudoTemplates.binary, [5, 1], 1)).toThrow('sorted')
  })
  it('supports boolean short-circuiting and explicit block endings', () => {
    const s = `ALGORITHM Guard(A, n, x)\nif n > 0 and A[0] = x then\n  return 0\nelse\n  return −1\nend if`
    expect(runPseudocode(s, [], 3).result).toBe(-1)
    expect(runPseudocode(s, [3], 3).result).toBe(0)
    expect(runPseudocode('ALGORITHM Test(A, n, x)\nif not (x = 3) then\n  return true\nreturn false', [], 2).result).toBe(true)
  })
  it('rejects ambiguous syntax, unsafe expressions and undefined values without eval', () => {
    for (const s of [
      'alert(1)',
      'ALGORITHM Bad(A, n, x)\nreturn window.location',
      'ALGORITHM Bad(A, n, x)\nreturn f(3)',
      'ALGORITHM Bad(A, n, x)\nif x = 1 then\nreturn 2',
      'ALGORITHM Bad(A, n, x)\nend for',
    ])
      expect(() => compilePseudocode(s)).toThrow()
    expect(() => runPseudocode('ALGORITHM Bad(A, n, x)\nreturn missing', [], 0)).toThrow('not defined')
    expect(() => runPseudocode('ALGORITHM Bad(A, n, x)\nreturn 1 / 0', [], 0)).toThrow('zero')
    expect(() => runPseudocode('ALGORITHM Bad(A, n, x)\nx ← 1', [], 0)).toThrow('without returning')
    expect(() => runPseudocode('ALGORITHM Bad(A, n, x)\nwhile true do\n  x ← x + 1\nreturn x', [], 0, 20)).toThrow('20-step limit')
  })
  it('validates editable datasets and limits input complexity', () => {
    expect(parsePseudoArray(', 2, -1 3, ')).toEqual([2, -1, 3])
    expect(parsePseudoArray('')).toEqual([])
    for (const text of ['[1,null]', '1e9', '[true]', 'oops']) expect(() => parsePseudoArray(text)).toThrow()
    expect(() => runPseudocode(pseudoTemplates.linear, Array(31).fill(1), 0)).toThrow('0–30')
    expect(() => runPseudocode(pseudoTemplates.linear, [], NaN)).toThrow('finite target')
    expect(() => compilePseudocode('x'.repeat(12001))).toThrow('12000')
  })
  it('converts only explicitly supported description templates', () => {
    expect(descriptionTemplate('Search for x in an array; return its index.')).toBe('linear')
    expect(descriptionTemplate('Find x in a sorted array using binary search.')).toBe('binary')
    expect(descriptionTemplate('Find the largest array element.')).toBe('maximum')
    expect(descriptionTemplate('Compute the sum of all values.')).toBe('sum')
    expect(() => descriptionTemplate('Build a flight simulator')).toThrow('supports templates')
  })
})
