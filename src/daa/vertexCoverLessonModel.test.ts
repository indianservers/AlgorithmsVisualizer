import { describe, it, expect } from 'vitest'
import { coverExample, runVertexCoverLesson, isCover, isCoverMatching, parseCoverGraph, minimumCover, type CoverGraph } from './vertexCoverLessonModel'
describe('038 maximal-matching vertex cover', () => {
  it('uses disjoint example edges and synchronizes the actual cover and edge counts', () => {
    const r = runVertexCoverLesson(coverExample)
    expect(r.graph.edges).toHaveLength(8)
    expect(r.degree).toEqual([3, 2, 2, 3, 4, 2])
    expect(r.final.matching).toEqual([0, 4])
    expect(r.final.cover).toEqual([0, 1, 3, 4])
    expect(r.final.remaining).toEqual([])
    expect(r.frames[1].remaining).toEqual([4, 5, 6, 7])
    expect(r.optimum).toHaveLength(3)
    expect(r.ratio).toBe(4 / 3)
  })
  it('rejects covered edges as matching extensions and verifies every retained certificate', () => {
    const r = runVertexCoverLesson(coverExample, [4, 0])
    expect(r.final.matching).toEqual([4, 0])
    for (const f of r.frames) {
      expect(isCoverMatching(r.graph, f.matching)).toBe(true)
      expect(f.cover).toHaveLength(2 * f.matching.length)
      expect(f.complete).toBe(isCover(r.graph, f.cover))
      expect(f.covered).toEqual(r.graph.edges.map(([u, v]) => f.cover.includes(u) || f.cover.includes(v)))
      if (f.edge !== null) {
        const previous = r.frames[f.step - 1]
        expect(previous.remaining).toContain(f.edge)
        expect(f.added.every((v) => !previous.cover.includes(v))).toBe(true)
      }
    }
    expect(isCoverMatching(coverExample, [0, 1])).toBe(false)
    expect(isCover(coverExample, [0, 1, 3])).toBe(false)
  })
  it('demonstrates a tight factor two and edge-order dependence', () => {
    const star: CoverGraph = {
        vertices: 6,
        edges: [
          [0, 1],
          [0, 2],
          [0, 3],
          [0, 4],
          [0, 5],
        ],
      },
      r = runVertexCoverLesson(star)
    expect(r.final.cover).toEqual([0, 1])
    expect(r.optimum).toEqual([0])
    expect(r.ratio).toBe(2)
    const path: CoverGraph = {
      vertices: 6,
      edges: [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
      ],
    }
    expect(runVertexCoverLesson(path).final.cover).toHaveLength(6)
    expect(runVertexCoverLesson(path, [1, 3]).final.cover).toHaveLength(4)
  })
  it('proves coverage, maximality and the two-approximation bound on 150 generated graphs', () => {
    let seed = 381
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed
    }
    for (let t = 0; t < 150; t++) {
      const vertices = 1 + (random() % 8),
        edges: [number, number][] = []
      for (let u = 0; u < vertices; u++) for (let v = u + 1; v < vertices; v++) if (random() % 3 === 0 && edges.length < 20) edges.push([u, v])
      const r = runVertexCoverLesson({ vertices, edges })
      expect(isCover(r.graph, r.final.cover)).toBe(true)
      expect(isCoverMatching(r.graph, r.final.matching)).toBe(true)
      expect(r.final.matching.length).toBeLessThanOrEqual(r.optimum.length)
      expect(r.final.cover.length).toBeLessThanOrEqual(2 * r.optimum.length)
      for (let mask = 0; mask < 2 ** vertices; mask++) {
        const candidate = Array.from({ length: vertices }, (_, i) => i).filter((i) => mask & (1 << i))
        if (candidate.length < r.optimum.length) expect(isCover(r.graph, candidate)).toBe(false)
      }
    }
  })
  it('supports isolated and empty-edge graphs and rejects invalid simple-graph inputs', () => {
    expect(runVertexCoverLesson({ vertices: 8, edges: [] }).final).toMatchObject({ complete: true, cover: [], matching: [] })
    expect(minimumCover({ vertices: 4, edges: [[0, 1]] })).toHaveLength(1)
    for (const text of [
      'bad',
      'null',
      '{}',
      '{"vertices":9,"edges":[]}',
      '{"vertices":2,"edges":[[0,0]]}',
      '{"vertices":2,"edges":[[0,1],[1,0]]}',
      '{"vertices":2,"edges":[[0,2]]}',
      '{"vertices":2,"edges":[],"directed":true}',
    ])
      expect(() => parseCoverGraph(text)).toThrow()
    expect(() => runVertexCoverLesson(coverExample, [0, 0])).toThrow()
    expect(() => runVertexCoverLesson(coverExample, [99])).toThrow()
  })
})
