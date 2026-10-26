import { describe, it, expect } from 'vitest'
import { parseKaratsubaInteger, runKaratsubaLesson } from './karatsubaLessonModel'
describe('035 exact Karatsuba lesson', () => {
  it('reproduces every reference split, product and recombination term', () => {
    const r = runKaratsubaLesson('1234', '5678'),
      n = r.root
    expect([n.a, n.b, n.c, n.d]).toEqual([12n, 34n, 56n, 78n])
    expect([n.z0, n.z1, n.z2, n.middle, n.result]).toEqual([2652n, 6164n, 672n, 2840n, 7006652n])
    expect(n.m).toBe(2)
    expect(n.children?.map((c) => c.n)).toEqual([2, 3, 2])
    expect(r.result).toBe(7006652n)
    expect(r.frames[0].known).toEqual([false, false, false])
    expect(r.frames.at(-1)?.kind).toBe('combine')
  })
  it('retains all recursive identities and emits products only when returned', () => {
    const r = runKaratsubaLesson('99999999', '12345678')
    for (const n of r.nodes) {
      expect(n.result).toBe(n.x * n.y)
      if (n.children) {
        expect(n.x).toBe(n.a * n.base + n.b)
        expect(n.y).toBe(n.c * n.base + n.d)
        expect(n.middle).toBe(n.a * n.d + n.b * n.c)
        expect(n.children.map((c) => c.result)).toEqual([n.z0, n.z1, n.z2])
        const own = r.frames.filter((f) => f.node === n.id)
        expect(own.map((f) => f.kind)).toEqual(['split', 'low', 'sum', 'high', 'combine'])
        expect(own.map((f) => f.known)).toEqual([
          [false, false, false],
          [true, false, false],
          [true, true, false],
          [true, true, true],
          [true, true, true],
        ])
      }
    }
  })
  it('handles unequal and odd digit lengths, zeros, leading zeros and signed operands', () => {
    for (const [x, y] of [
      ['123', '45678'],
      ['-1234', '5678'],
      ['-99', '-99'],
      ['0', '999999'],
      ['1', '123456789012345678901234'],
      ['000012', '+000034'],
      ['999', '999'],
    ]) {
      const r = runKaratsubaLesson(x, y)
      expect(r.result).toBe(BigInt(x) * BigInt(y))
    }
    expect(runKaratsubaLesson('0', '10').root.children).toBeUndefined()
  })
  it('preserves precision for 24-digit inputs and agrees with independent BigInt multiplication', () => {
    let seed = 351
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed
    }
    for (let t = 0; t < 100; t++) {
      const x = String((random() % 9) + 1) + Array.from({ length: random() % 24 }, () => String(random() % 10)).join(''),
        y = String((random() % 9) + 1) + Array.from({ length: random() % 24 }, () => String(random() % 10)).join('')
      expect(runKaratsubaLesson(x, y).result).toBe(BigInt(x) * BigInt(y))
    }
    const x = '999999999999999999999999'
    expect(runKaratsubaLesson(x, x).result).toBe(BigInt(x) ** 2n)
  })
  it('validates exact decimal inputs rather than coercing rounded JavaScript numbers', () => {
    expect(parseKaratsubaInteger('9'.repeat(48), 48)).toBe(BigInt('9'.repeat(48)))
    expect(parseKaratsubaInteger(' -000123 ')).toBe(-123n)
    for (const s of ['', '1.2', '1e3', 'Infinity', 'NaN', '12,345', '--2', '9'.repeat(25)]) expect(() => parseKaratsubaInteger(s)).toThrow()
  })
})
