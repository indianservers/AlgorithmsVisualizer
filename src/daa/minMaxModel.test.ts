import { describe, expect, it } from 'vitest'
import { minMaxTrace, minMaxExample, parseMinMaxValues } from './minMaxModel'
describe('recursive min/max model', () => {
  it('computes the reference tree and counts exactly ten value comparisons', () => {
    const r = minMaxTrace(minMaxExample)
    expect([r.root.min, r.root.max, r.comparisons]).toEqual([2, 12, 10])
    expect([r.root.left!.min, r.root.left!.max]).toEqual([3, 12])
    expect([r.root.right!.min, r.root.right!.max]).toEqual([2, 10])
    expect(r.nodes.filter((n) => n.hi - n.lo === 1).map((n) => [n.min, n.max])).toEqual([
      [3, 8],
      [4, 12],
      [2, 6],
      [5, 10],
    ])
    expect(r.frames.filter((f) => ['pair', 'minimum', 'maximum'].includes(f.phase))).toHaveLength(10)
    expect(r.frames.at(-1)?.comparisons).toBe(10)
  })
  it('agrees with independent extrema and comparison recurrences over supported sizes', () => {
    const count = (n: number): number => (n === 1 ? 0 : n === 2 ? 1 : count(Math.ceil(n / 2)) + count(Math.floor(n / 2)) + 2)
    for (let n = 1; n <= 20; n++)
      for (let seed = 0; seed < 20; seed++) {
        const a = Array.from({ length: n }, (_, i) => (((i * i * 3 + seed * 7) % 31) - 15) / 4),
          r = minMaxTrace(a)
        expect(r.root.min).toBe(Math.min(...a))
        expect(r.root.max).toBe(Math.max(...a))
        expect(r.comparisons).toBe(count(n))
        expect(r.frames.map((f) => f.comparisons)).toEqual([...r.frames.map((f) => f.comparisons)].sort((a, b) => a - b))
        expect(r.root.comparisons).toBe(r.comparisons)
      }
  })
  it('handles singletons, duplicate extrema, negative values and zero without mutating input', () => {
    for (const a of [[42], [-7, -2, -9, -1], [0, 0, 0, 0], [-5, 3, 3, -5]]) {
      const before = [...a],
        r = minMaxTrace(a)
      expect(a).toEqual(before)
      expect([r.root.min, r.root.max]).toEqual([Math.min(...a), Math.max(...a)])
    }
    expect(minMaxTrace([42]).comparisons).toBe(0)
    expect(minMaxTrace([2, 2]).comparisons).toBe(1)
  })
  it('exposes valid active call stacks and operands for every trace event', () => {
    const r = minMaxTrace([9, -2, 5, 4, 8, 1, 0])
    for (const frame of r.frames) {
      expect(frame.stack.at(-1)).toBe(frame.nodeId)
      for (let i = 1; i < frame.stack.length; i++) {
        const parent = r.nodes.find((n) => n.id === frame.stack[i - 1])!,
          child = r.nodes.find((n) => n.id === frame.stack[i])!
        expect(child.lo).toBeGreaterThanOrEqual(parent.lo)
        expect(child.hi).toBeLessThanOrEqual(parent.hi)
      }
      if (frame.phase === 'minimum') expect(frame.result).toBe(Math.min(...frame.operands!))
      if (frame.phase === 'maximum') expect(frame.result).toBe(Math.max(...frame.operands!))
    }
  })
  it('uses the power-of-two formula only where it actually applies', () => {
    for (const n of [2, 4, 8, 16]) expect(minMaxTrace(Array.from({ length: n }, (_, i) => i)).comparisons).toBe((3 * n) / 2 - 2)
    expect(minMaxTrace([1, 2, 3, 4, 5, 6]).comparisons).toBe(8)
  })
  it('validates editable lists and JSON without inserting spurious zeroes', () => {
    expect(parseMinMaxValues(', 8, -3 2, ')).toEqual([8, -3, 2])
    expect(parseMinMaxValues('[0,-1,2.5]')).toEqual([0, -1, 2.5])
    for (const s of ['', ',,,', 'oops', '[1,null]', '[true]', '[1,2', 'Infinity', '1e9']) expect(() => parseMinMaxValues(s)).toThrow()
    for (const a of [[], [NaN], [Infinity], Array(21).fill(1)]) expect(() => minMaxTrace(a)).toThrow()
  })
})
