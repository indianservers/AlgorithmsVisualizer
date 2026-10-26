import { describe, it, expect } from 'vitest'
import { bridgeComponents, bridgeExample, parseBridgeGraph, runBridgeLesson, type BridgeGraph } from './bridgeLessonModel'
describe('030 DFS bridge and low-link trace', () => {
  it('finds bridge 3–4 and the real discovery, parent and low-link values', () => {
    const run = runBridgeLesson(bridgeExample)
    expect(run.final.tin.slice(1)).toEqual([0, 1, 2, 3, 4, 5])
    expect(run.final.low.slice(1)).toEqual([0, 0, 0, 3, 2, 2])
    expect(run.final.parent.slice(1)).toEqual([-1, 1, 2, 3, 3, 5])
    expect(run.final.bridges).toEqual([3])
    expect(run.final.articulation).toEqual([3])
    expect(run.defaultCursor).toBe(5)
    expect(run.frames[5].bridge).toBe(true)
    expect(bridgeComponents(bridgeExample, 3)).toEqual([[1, 2, 3, 5, 6], [4]])
  })
  it('distinguishes the exact parent edge from parallel edges and handles loops', () => {
    const graph: BridgeGraph = {
        vertices: 3,
        start: 1,
        edges: [
          [1, 2],
          [1, 2],
          [2, 3],
          [3, 3],
        ],
      },
      run = runBridgeLesson(graph)
    expect(run.final.bridges).toEqual([2])
    expect(run.final.back).toEqual([1, 3])
    expect(run.final.low[2]).toBe(0)
    expect(run.final.articulation).toEqual([2])
  })
  it('traverses every disconnected component and applies the special DFS-root articulation rule', () => {
    const run = runBridgeLesson({
      vertices: 6,
      start: 3,
      edges: [
        [3, 1],
        [3, 2],
        [4, 5],
      ],
    })
    expect(run.final.bridges.sort()).toEqual([0, 1, 2])
    expect(run.final.articulation).toEqual([3])
    expect(run.final.parent[6]).toBe(-1)
    expect(new Set(run.final.tin.slice(1)).size).toBe(6)
    expect(run.components).toHaveLength(3)
  })
  it('agrees with independent edge/vertex-removal connectivity checks on multigraphs', () => {
    let seed = 30
    const random = () => (seed = (1664525 * seed + 1013904223) >>> 0) / 2 ** 32
    for (let trial = 0; trial < 100; trial++) {
      const vertices = 1 + (trial % 8),
        graph: BridgeGraph = { vertices, start: 1 + (trial % vertices), edges: [] }
      for (let e = 0; e < Math.min(20, trial % 21); e++) graph.edges.push([1 + Math.floor(random() * vertices), 1 + Math.floor(random() * vertices)])
      const run = runBridgeLesson(graph),
        base = bridgeComponents(graph).length
      expect(run.final.bridges.sort((a, b) => a - b)).toEqual(graph.edges.flatMap((_, e) => (bridgeComponents(graph, e).length > base ? [e] : [])))
      expect(run.final.articulation.sort((a, b) => a - b)).toEqual(
        Array.from({ length: vertices }, (_, i) => i + 1).filter((v) => bridgeComponents(graph, -1, v).length > base),
      )
      expect(new Set([...run.final.tree, ...run.final.back]).size).toBe(graph.edges.length)
      for (let v = 1; v <= vertices; v++) expect(run.final.low[v]).toBeLessThanOrEqual(run.final.tin[v])
    }
  })
  it('validates custom graphs and creates a useful trace for isolated vertices', () => {
    for (const text of [
      'invalid',
      'null',
      '{}',
      JSON.stringify({ vertices: 9, start: 1, edges: [] }),
      JSON.stringify({ vertices: 2, start: 0, edges: [] }),
      JSON.stringify({ vertices: 2, start: 1, edges: [[1, 3]] }),
      JSON.stringify({ vertices: 2, start: 1, edges: [null] }),
    ])
      expect(() => parseBridgeGraph(text)).toThrow()
    const run = runBridgeLesson({ vertices: 1, start: 1, edges: [] })
    expect(run.final.bridges).toEqual([])
    expect(run.final.articulation).toEqual([])
    expect(run.frames).toHaveLength(2)
  })
})
