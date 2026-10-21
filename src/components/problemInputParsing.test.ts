import { describe, expect, it } from 'vitest'
import { parseProblemField } from './problemInputParsing'

describe('friendly algorithm input fields', () => {
  it('accepts comma-separated, pasted multiline, decimal and negative datasets', () => {
    expect(parseProblemField(' 7, -2\n3.5   4, ', [1, 2])).toEqual([7, -2, 3.5, 4])
    expect(parseProblemField('', [1, 2])).toEqual([])
    expect(parseProblemField('[7,-2,3.5]', [1, 2])).toEqual([7, -2, 3.5])
  })
  it('supports rows of a matrix and structured graph data', () => {
    expect(
      parseProblemField('1, 2\n3, 4', [
        [1, 2],
        [3, 4],
      ]),
    ).toEqual([
      [1, 2],
      [3, 4],
    ])
    expect(parseProblemField('1 2;3 4', [[1]])).toEqual([
      [1, 2],
      [3, 4],
    ])
    const edges = [{ from: 0, to: 1, weight: 2 }]
    expect(parseProblemField(JSON.stringify(edges), edges)).toEqual(edges)
  })
  it('preserves text and rejects incomplete or nonnumeric numeric fields', () => {
    expect(parseProblemField('hello, world', '')).toBe('hello, world')
    expect(parseProblemField('12', 3)).toBe(12)
    expect(parseProblemField('false', true)).toBe(false)
    for (const invalid of ['2, nope, 3', '[2,"nope"]', '[null]', '[1,']) expect(() => parseProblemField(invalid, [1])).toThrow()
    expect(() => parseProblemField('', 2)).toThrow()
    expect(() => parseProblemField('Infinity', 2)).toThrow()
  })
})
