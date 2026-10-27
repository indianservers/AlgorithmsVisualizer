import { describe, it, expect } from 'vitest'
import { packingExample, runPackingLesson, parsePacking } from './binPackingLessonModel'
describe('044 first-fit decreasing bin packing', () => {
  it('corrects the reference overflow and uses six feasible bins for 54 units', () => {
    const r = runPackingLesson(packingExample)
    expect(r.total).toBe(54)
    expect(r.lowerBound).toBe(6)
    expect(r.optimum?.count).toBe(6)
    expect(r.bins.map((b) => b.items.map((i) => i.size))).toEqual([
      [9, 1],
      [8, 2],
      [7, 3],
      [6, 4],
      [5, 4],
      [3, 2],
    ])
    expect(r.bins.map((b) => b.used)).toEqual([10, 10, 10, 10, 9, 5])
    expect(r.utilization).toBe(0.9)
    expect(r.frames).toHaveLength(13)
    expect(r.frames[6].probes.map((p) => p.fits)).toEqual([false, false, false, true])
  })
  it('matches 180 independent first-fit implementations with stable duplicate identities', () => {
    let seed = 44
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed
    }
    for (let t = 0; t < 180; t++) {
      const capacity = 1 + (random() % 100),
        values = Array.from({ length: random() % 25 }, () => 1 + (random() % capacity)),
        r = runPackingLesson({ capacity, values })
      const oracle: { sum: number; ids: number[] }[] = []
      const ordered = values.map((size, i) => ({ size, id: i + 1 })).sort((a, b) => b.size - a.size || a.id - b.id)
      for (const item of ordered) {
        let bin = oracle.find((b) => b.sum + item.size <= capacity)
        if (!bin) {
          bin = { sum: 0, ids: [] }
          oracle.push(bin)
        }
        bin.sum += item.size
        bin.ids.push(item.id)
      }
      expect(r.bins.map((b) => b.items.map((i) => i.id))).toEqual(oracle.map((b) => b.ids))
      for (const frame of r.frames) {
        expect(frame.bins.flatMap((b) => b.items)).toHaveLength(frame.count)
        expect(frame.bins.reduce((a, b) => a + b.used, 0)).toBe(frame.packedSize)
        for (const b of frame.bins) {
          expect(b.used).toBeLessThanOrEqual(capacity)
          expect(b.remaining + b.used).toBe(capacity)
        }
        if (frame.item) {
          expect(frame.probes.slice(0, -1).every((p) => !p.fits)).toBe(true)
          if (!frame.opened) expect(frame.probes.at(-1)).toMatchObject({ bin: frame.destination, fits: true })
          else expect(frame.probes.every((p) => !p.fits)).toBe(true)
        }
      }
    }
  })
  it('independently exhausts small labeled assignments to verify the optimality certificate', () => {
    for (let t = 0; t < 60; t++) {
      const capacity = 4 + (t % 5),
        values = Array.from({ length: 3 + (t % 5) }, (_, i) => 1 + ((t * 7 + i * 3) % capacity)),
        r = runPackingLesson({ capacity, values })
      function fits(limit: number) {
        const loads = Array(limit).fill(0)
        function place(i: number): boolean {
          if (i === values.length) return true
          for (let j = 0; j < limit; j++) {
            if (loads[j] + values[i] > capacity) continue
            loads[j] += values[i]
            if (place(i + 1)) return true
            loads[j] -= values[i]
            if (loads[j] === 0) break
          }
          return false
        }
        return place(0)
      }
      let count = r.lowerBound
      while (!fits(count)) count++
      expect(r.optimum?.count).toBe(count)
      expect(
        r.optimum?.bins
          .flat()
          .map((i) => i.id)
          .sort((a, b) => a - b),
      ).toEqual(values.map((_, i) => i + 1))
      expect(r.optimum?.bins.every((b) => b.reduce((a, item) => a + item.size, 0) <= capacity)).toBe(true)
    }
  })
  it('shows that feasible first-fit decreasing packing need not be optimal', () => {
    const r = runPackingLesson({ capacity: 10, values: [6, 5, 3, 2, 2, 2] })
    expect(r.bins.map((b) => b.items.map((i) => i.size))).toEqual([[6, 3], [5, 2, 2], [2]])
    expect(r.optimum?.count).toBe(2)
    expect(r.lowerBound).toBe(2)
  })
  it('handles empty, exact-fill, maximum inputs and validates atomically', () => {
    const empty = runPackingLesson({ capacity: 10, values: [] })
    expect(empty.bins).toEqual([])
    expect(empty.optimum?.count).toBe(0)
    expect(empty.utilization).toBe(0)
    const max = runPackingLesson({ capacity: 100, values: Array(24).fill(100) })
    expect(max.bins).toHaveLength(24)
    expect(max.optimum).toBeNull()
    expect(parsePacking('10', '4, 4 2')).toEqual({ capacity: 10, values: [4, 4, 2] })
    for (const cap of ['', '0', '101', '1.5', 'NaN']) expect(() => parsePacking(cap, '1')).toThrow()
    for (const items of ['11', '0', '-1', '1.5', 'Infinity', 'abc']) expect(() => parsePacking('10', items)).toThrow()
    expect(() => parsePacking('10', Array(25).fill(1).join(','))).toThrow('24')
  })
})
