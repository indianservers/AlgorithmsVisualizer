import { describe, expect, it } from 'vitest'
import { maximumSubarrayTrace, maximumExample, parseMaximumValues } from './maximumSubarrayModel'
describe('divide-and-conquer maximum subarray', () => {
  it('computes truthful left, right, crossing and midpoint scan values for the mockup', () => {
    const run = maximumSubarrayTrace(maximumExample),
      r = run.root
    expect(r.best).toEqual({ sum: 6, start: 4, end: 6 })
    expect(r.left!.best).toEqual({ sum: 4, start: 0, end: 2 })
    expect(r.right!.best).toEqual({ sum: 6, start: 4, end: 6 })
    expect(r.crossing).toEqual({ sum: 6, start: 0, end: 6 })
    expect(r.scans.filter((s) => s.side === 'suffix').map((s) => s.sum)).toEqual([-4, -1, -2, 0])
    expect(r.scans.filter((s) => s.side === 'prefix').map((s) => s.sum)).toEqual([5, 4, 6, 5])
    expect(run.nodes).toHaveLength(15)
  })
  it('agrees with an independent exhaustive oracle, including tie-breaking', () => {
    for (let n = 1; n <= 32; n++)
      for (let seed = 0; seed < 12; seed++) {
        const a = Array.from({ length: n }, (_, i) => (((i * 13 + i * i + seed * 7) % 19) - 9) / 2)
        const candidates = []
        for (let lo = 0; lo < n; lo++)
          for (let hi = lo; hi < n; hi++) candidates.push({ start: lo, end: hi, sum: a.slice(lo, hi + 1).reduce((x, y) => x + y, 0) })
        candidates.sort((a, b) => b.sum - a.sum || a.end - a.start - (b.end - b.start) || a.start - b.start)
        expect(maximumSubarrayTrace(a).root.best).toEqual(candidates[0])
      }
  })
  it('keeps ranges nonempty for negative arrays, zeros and singletons', () => {
    expect(maximumSubarrayTrace([-8, -2, -7]).root.best).toEqual({ start: 1, end: 1, sum: -2 })
    expect(maximumSubarrayTrace([0, 0, 0]).root.best).toEqual({ start: 0, end: 0, sum: 0 })
    expect(maximumSubarrayTrace([9]).frames).toEqual([{ nodeId: '0:0', phase: 'base' }])
    const a = [1, 2, 3]
    maximumSubarrayTrace(a)
    expect(a).toEqual([1, 2, 3])
  })
  it('traces contiguous candidates crossing the actual midpoint for every node', () => {
    const run = maximumSubarrayTrace([1, -2, 4, -1, 3, -5, 2])
    for (const node of run.nodes) {
      if (!node.crossing) continue
      expect(node.crossing.start).toBeLessThanOrEqual(node.mid)
      expect(node.crossing.end).toBeGreaterThan(node.mid)
      expect(node.crossing.sum).toBe(run.values.slice(node.crossing.start, node.crossing.end + 1).reduce((a, b) => a + b, 0))
      expect(node.scans).toHaveLength(node.hi - node.lo + 1)
      expect(run.frames.filter((f) => f.nodeId === node.id).at(-1)?.phase).toBe('combine')
    }
  })
  it('validates editable input without silently inserting missing values', () => {
    expect(parseMaximumValues('2, -1 3\n-4')).toEqual([2, -1, 3, -4])
    expect(parseMaximumValues('[0, -2, 1.5]')).toEqual([0, -2, 1.5])
    expect(parseMaximumValues(', 3, -2, ')).toEqual([3, -2])
    for (const text of ['', ',,,', 'abc', '[1,null]', '[1,2', '[true]', '1e9', 'Infinity']) expect(() => parseMaximumValues(text)).toThrow()
    for (const values of [[], [NaN], [Infinity], Array(33).fill(1)]) expect(() => maximumSubarrayTrace(values)).toThrow()
  })
})
