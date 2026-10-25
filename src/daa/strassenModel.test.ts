import { describe, expect, it } from 'vitest'
import { strassenMultiply, strassenExampleA, strassenExampleB, type Matrix } from './strassenModel'
const classical = (a: Matrix, b: Matrix) => a.map((row) => b[0].map((_, j) => row.reduce((s, x, k) => s + x * b[k][j], 0)))
describe('Strassen teaching model', () => {
  it('computes every product and block in the reference example', () => {
    const run = strassenMultiply(strassenExampleA, strassenExampleB)
    expect(run.products.map((m) => m[0][0])).toEqual([48, 72, 6, -10, 8, 84, -12])
    expect(run.result).toEqual([
      [18, 14],
      [62, 66],
    ])
    expect(run.children).toHaveLength(7)
  })
  it('agrees with independent classical multiplication across sizes, negatives and fractions', () => {
    for (const n of [1, 2, 4, 8])
      for (let sample = 0; sample < 10; sample++) {
        const a = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (((i * 7 + j * 11 + sample) % 13) - 6) / 2))
        const b = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => ((i * 3 - j * 5 + sample) % 9) / 4))
        const actual = strassenMultiply(a, b).result,
          expected = classical(a, b)
        actual.forEach((row, i) => row.forEach((v, j) => expect(v).toBeCloseTo(expected[i][j], 10)))
      }
  })
  it('does not mutate input and exposes a faithful recursive tree', () => {
    const a = Array.from({ length: 4 }, (_, i) => Array.from({ length: 4 }, (_, j) => (i === j ? 1 : 0)))
    const b = a.map((r) => r.map((x) => x * 2)),
      before = JSON.stringify([a, b])
    const run = strassenMultiply(a, b)
    expect(JSON.stringify([a, b])).toBe(before)
    expect(run.result).toEqual(b)
    expect(run.children.every((c) => c.children.length === 7)).toBe(true)
    expect(run.children[0].children[0].id).toBe('root.1.1')
  })
  it('rejects ragged, non-power-of-two, mismatched and nonfinite matrices', () => {
    for (const a of [
      [],
      [[1, 2]],
      [[NaN]],
      [[Infinity]],
      [[1001]],
      [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ],
    ])
      expect(() => strassenMultiply(a, [[1]])).toThrow()
    expect(() =>
      strassenMultiply(
        [[1]],
        [
          [1, 0],
          [0, 1],
        ],
      ),
    ).toThrow('same size')
  })
})
