import { describe, it, expect } from 'vitest'
import { runClosestLesson, closestExample, parseClosestPoints } from './closestPairLessonModel'
function brute(a: [number, number][]) {
  let best = Infinity
  for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) best = Math.min(best, Math.hypot(a[i][0] - a[j][0], a[i][1] - a[j][1]))
  return best
}
describe('034 closest-pair lesson', () => {
  it('keeps the example plot, median, tree and pair consistent', () => {
    const r = runClosestLesson(closestExample),
      f = r.frames[r.defaultCursor]
    expect(r.points).toHaveLength(20)
    expect(r.root.middle).toBe(50)
    expect(r.root.left?.points).toHaveLength(10)
    expect(r.root.right?.points).toHaveLength(10)
    expect(r.pair?.distance).toBeCloseTo(Math.sqrt(34))
    expect([r.pair?.a.id, r.pair?.b.id]).toEqual([10, 14])
    expect(f.stage).toBe('combine')
    expect(f.pair?.distance).toBeCloseTo(Math.sqrt(34))
    expect(f.strip.map((p) => p.y)).toEqual([...f.strip.map((p) => p.y)].sort((a, b) => a - b))
  })
  it('finds a cross-boundary improvement and retains executed strip comparisons', () => {
    const r = runClosestLesson([
      [0, 0],
      [2, 100],
      [4, 0],
      [5, 0],
      [7, 100],
      [9, 0],
    ])
    expect(r.pair?.distance).toBe(1)
    expect(r.frames.some((f) => f.stage === 'strip' && f.compared?.distance === 1)).toBe(true)
    for (const [node, rows] of Object.entries(r.checks))
      for (const row of rows)
        if (row.checked) {
          expect(row.event).not.toBeNull()
          expect(r.frames[row.event!].node).toBe(node)
          expect(r.frames[row.event!].compared?.distance).toBe(row.distance)
        }
  })
  it('handles duplicate points, coincident x coordinates, ties and singleton inputs', () => {
    for (const a of [
      [
        [2, 2],
        [2, 2],
      ],
      [
        [0, 0],
        [0, 20],
        [0, 5],
        [0, 11],
      ],
      [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ],
      [
        [-5, -5],
        [2, -1],
        [2, -1],
        [30, 20],
      ],
    ] as [number, number][][])
      expect(runClosestLesson(a).pair?.distance).toBe(brute(a))
    expect(runClosestLesson([[42, 9]]).pair).toBeNull()
  })
  it('matches an independent quadratic oracle on 200 seeded point sets', () => {
    let seed = 341
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed
    }
    for (let t = 0; t < 200; t++) {
      const a = Array.from({ length: 2 + (random() % 39) }, () => [(random() % 201) - 100, (random() % 201) - 100] as [number, number]),
        r = runClosestLesson(a)
      expect(r.pair?.distance).toBeCloseTo(brute(a), 10)
      for (const f of r.frames) if (f.pair) expect(f.pair.distance).toBe(Math.hypot(f.pair.a.x - f.pair.b.x, f.pair.a.y - f.pair.b.y))
      for (const node of r.nodes) expect(node.pair?.distance ?? Infinity).toBeCloseTo(brute(node.points.map((p) => [p.x, p.y])), 10)
    }
  })
  it('rejects malformed coordinates before generating a trace', () => {
    expect(parseClosestPoints('[[1,-2],[3.5,4]]')).toEqual([
      [1, -2],
      [3.5, 4],
    ])
    for (const text of ['[]', 'null', 'bad', '[1,2]', '[[1]]', '[[1,2,3]]', '[[true,2]]', '[[null,2]]', '[[1001,0]]', JSON.stringify(Array(41).fill([0, 0]))])
      expect(() => parseClosestPoints(text)).toThrow()
  })
})
