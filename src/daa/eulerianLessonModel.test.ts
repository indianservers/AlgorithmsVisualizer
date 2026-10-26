import { describe, it, expect } from 'vitest'
import { checkEulerGraph, eulerExample, parseEulerGraph, runEulerLesson, verifyEulerTrail, type EulerGraph } from './eulerianLessonModel'
describe('032 Hierholzer lesson', () => {
  it('splices a cycle through backtracking rather than mistaking consumption order for output', () => {
    const graph: EulerGraph = {
        vertices: 5,
        start: null,
        edges: [
          [0, 1],
          [1, 2],
          [2, 0],
          [1, 3],
          [3, 4],
          [4, 1],
        ],
      },
      run = runEulerLesson(graph)
    expect(run.trail).toEqual([0, 1, 3, 4, 1, 2, 0])
    expect(run.edgeOrder).toEqual([0, 3, 4, 5, 1, 2])
    expect(run.frames.some((frame, i) => frame.kind === 'pop' && run.frames.slice(i + 1).some((f) => f.kind === 'consume'))).toBe(true)
    expect(verifyEulerTrail(graph, run.trail, run.edgeOrder)).toBe(true)
  })
  it('produces the reference circuit, two-move stack and an edge-identity certificate', () => {
    const r = runEulerLesson(eulerExample)
    expect(r.check.degree).toEqual([2, 2, 2, 2])
    expect(r.trail).toEqual([0, 1, 2, 3, 0])
    expect(r.edgeOrder).toEqual([0, 1, 2, 3])
    expect(r.frames[2].stack).toEqual([0, 1, 2])
    expect(r.frames[2].used).toEqual([true, true, false, false])
    expect(r.frames[2].edge).toBe(1)
    expect(verifyEulerTrail(eulerExample, r.trail, r.edgeOrder)).toBe(true)
    expect(r.frames.filter((f) => f.kind === 'pop')).toHaveLength(5)
    expect(r.frames.at(-1)!.reverse).toEqual([0, 3, 2, 1, 0])
  })
  it('checks legal starts for an open trail and permits isolated vertices outside the edge component', () => {
    const g: EulerGraph = {
      vertices: 5,
      start: null,
      edges: [
        [0, 1],
        [1, 2],
        [2, 3],
      ],
    }
    expect(runEulerLesson(g).trail).toEqual([0, 1, 2, 3])
    expect(runEulerLesson({ ...g, start: 3 }).trail).toEqual([3, 2, 1, 0])
    expect(checkEulerGraph({ ...g, start: 1 })).toMatchObject({ exists: true, startValid: false })
    expect(checkEulerGraph({ ...g, start: 4 }).reason).toContain('isolated')
  })
  it('rejects disconnected edge-bearing components even with all degrees even', () => {
    const g: EulerGraph = {
        vertices: 6,
        start: null,
        edges: [
          [0, 1],
          [1, 2],
          [2, 0],
          [3, 4],
          [4, 5],
          [5, 3],
        ],
      },
      r = runEulerLesson(g)
    expect(r.check.odd).toEqual([])
    expect(r.check.exists).toBe(false)
    expect(r.trail).toEqual([])
    expect(r.frames[0].kind).toBe('invalid')
  })
  it('supports loops, parallel edges and empty-edge graphs without losing identity', () => {
    const g: EulerGraph = {
        vertices: 2,
        start: null,
        edges: [
          [0, 0],
          [0, 1],
          [0, 1],
          [1, 1],
        ],
      },
      r = runEulerLesson(g)
    expect(r.check.degree).toEqual([4, 4])
    expect(verifyEulerTrail(g, r.trail, r.edgeOrder)).toBe(true)
    expect(runEulerLesson({ vertices: 3, start: 2, edges: [] }).trail).toEqual([2])
    expect(verifyEulerTrail(g, r.trail, [0, 1, 1, 3])).toBe(false)
  })
  it('agrees with exhaustive edge-consuming walks on generated multigraphs', () => {
    function possible(g: EulerGraph) {
      function walk(v: number, mask: number): boolean {
        if (mask === (1 << g.edges.length) - 1) return true
        return g.edges.some(([a, b], e) => !(mask & (1 << e)) && (a === v || b === v) && walk(a === v ? b : a, mask | (1 << e)))
      }
      return Array.from({ length: g.vertices }, (_, v) => v).some((v) => walk(v, 0))
    }
    let seed = 32
    const random = () => (seed = (1664525 * seed + 1013904223) >>> 0) / 2 ** 32
    for (let i = 0; i < 75; i++) {
      const vertices = 1 + (i % 6),
        g: EulerGraph = { vertices, start: null, edges: [] }
      for (let e = 0; e < i % 9; e++) g.edges.push([Math.floor(random() * vertices), Math.floor(random() * vertices)])
      const r = runEulerLesson(g)
      expect(r.check.exists).toBe(possible(g))
      if (r.check.feasible) expect(verifyEulerTrail(g, r.trail, r.edgeOrder)).toBe(true)
    }
  })
  it('rejects malformed and directed custom inputs', () => {
    for (const text of [
      'invalid',
      'null',
      '{}',
      JSON.stringify({ ...eulerExample, start: 4 }),
      JSON.stringify({ ...eulerExample, edges: [[0, -1]] }),
      JSON.stringify({ ...eulerExample, directed: true }),
      JSON.stringify({ ...eulerExample, edges: [null] }),
    ])
      expect(() => parseEulerGraph(text)).toThrow()
  })
})
