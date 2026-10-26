import { describe, it, expect } from 'vitest'
import { articulationComponents, articulationExample, parseArticulationGraph, runArticulation, type ArticulationGraph } from './articulationModel'
describe('031 articulation-point lesson', () => {
  it('computes the displayed zero-based example and exact removal components', () => {
    const run = runArticulation(articulationExample)
    expect(run.cuts).toEqual([3])
    expect(run.final.tin.slice(1).map((v) => v + 1)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(run.final.low.slice(1).map((v) => v + 1)).toEqual([1, 1, 1, 1, 4, 4, 4])
    expect(run.final.parent.slice(1).map((v) => (v < 0 ? -1 : v - 1))).toEqual([-1, 0, 1, 2, 3, 4, 5])
    expect(articulationComponents(articulationExample, 3)).toEqual([
      [0, 1, 2],
      [4, 5, 6],
    ])
    expect(run.final.bridges).toEqual([])
  })
  it('distinguishes root and non-root cut conditions', () => {
    expect(
      runArticulation({
        vertices: 4,
        root: 0,
        edges: [
          [0, 1],
          [0, 2],
          [0, 3],
        ],
      }).cuts,
    ).toEqual([0])
    expect(
      runArticulation({
        vertices: 3,
        root: 0,
        edges: [
          [0, 1],
          [1, 2],
        ],
      }).cuts,
    ).toEqual([1])
    expect(
      runArticulation({
        vertices: 3,
        root: 1,
        edges: [
          [0, 1],
          [1, 2],
        ],
      }).cuts,
    ).toEqual([1])
  })
  it('agrees with direct deletion for every vertex of generated graphs and all roots', () => {
    let seed = 31
    const random = () => (seed = (1664525 * seed + 1013904223) >>> 0) / 2 ** 32
    for (let trial = 0; trial < 35; trial++) {
      const n = 1 + (trial % 8),
        graph: ArticulationGraph = { vertices: n, root: 0, edges: [] }
      for (let e = 0; e < trial % 20; e++) graph.edges.push([Math.floor(random() * n), Math.floor(random() * n)])
      const before = articulationComponents(graph).length,
        oracle = Array.from({ length: n }, (_, v) => v).filter((v) => articulationComponents(graph, v).length > before)
      for (let root = 0; root < n; root++) expect(runArticulation({ ...graph, root }).cuts).toEqual(oracle)
    }
  })
  it('handles disconnected graphs, parallel edges, self-loops and single vertices', () => {
    expect(
      runArticulation({
        vertices: 3,
        root: 0,
        edges: [
          [0, 1],
          [1, 0],
          [1, 2],
          [2, 2],
        ],
      }).cuts,
    ).toEqual([1])
    expect(
      runArticulation({
        vertices: 5,
        root: 4,
        edges: [
          [0, 1],
          [1, 2],
          [2, 0],
          [3, 4],
        ],
      }).cuts,
    ).toEqual([])
    expect(articulationComponents({ vertices: 1, root: 0, edges: [] }, 0)).toEqual([])
  })
  it('rejects malformed, directed, out-of-range and excessive custom graphs', () => {
    for (const text of [
      'invalid',
      'null',
      '{}',
      JSON.stringify({ ...articulationExample, root: 7 }),
      JSON.stringify({ ...articulationExample, edges: [[0, -1]] }),
      JSON.stringify({ ...articulationExample, directed: true }),
      JSON.stringify({ ...articulationExample, edges: [null] }),
      JSON.stringify({ ...articulationExample, edges: Array.from({ length: 21 }, () => [0, 1]) }),
    ])
      expect(() => parseArticulationGraph(text)).toThrow()
  })
})
