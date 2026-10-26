import { describe, expect, it } from 'vitest'
import { flowCancellation, flowClassic, flowExample, parseFlowNetwork, runEdmondsKarp, verifyFlow, type FlowNetwork } from './edmondsKarpModel'
describe('028 Edmonds–Karp residual network', () => {
  function cutOracle(n: FlowNetwork) {
    let best = Infinity
    for (let mask = 0; mask < 1 << n.vertices; mask++)
      if (mask & (1 << n.source) && !(mask & (1 << n.sink)))
        best = Math.min(
          best,
          n.edges.reduce((sum, e) => sum + (mask & (1 << e.from) && !(mask & (1 << e.to)) ? e.capacity : 0), 0),
        )
    return best
  }
  it('computes the two real augmentations and the eleven-unit minimum cut', () => {
    const run = runEdmondsKarp(flowExample)
    expect(run.frames.map((f) => f.value)).toEqual([0, 6, 11])
    expect(run.frames.map((f) => f.bottleneck)).toEqual([6, 5, 0])
    expect(run.final.reached).toEqual([0, 1, 3])
    expect(run.cutCapacity).toBe(11)
    expect(run.final.flow).toEqual([6, 5, 6, 0, 0, 6, 5, 5])
  })
  it('keeps antiparallel original edges distinct from residual cancellation', () => {
    const run = runEdmondsKarp(flowClassic)
    expect(run.maximum).toBe(23)
    expect(run.cutCapacity).toBe(23)
    for (const f of run.frames) expect(verifyFlow(run.network, f.flow).valid).toBe(true)
  })
  it('uses reverse residual arcs to cancel an earlier choice', () => {
    const run = runEdmondsKarp(flowCancellation)
    expect(run.maximum).toBe(2)
    expect(run.frames[1].path.some((a) => a.reverse && a.edge === 1)).toBe(true)
    expect(run.final.flow[1]).toBe(0)
    expect(run.cutCapacity).toBe(run.maximum)
  })
  it('matches exhaustive cut enumeration and preserves capacities and conservation on generated networks', () => {
    let seed = 28
    const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32
    for (let trial = 0; trial < 80; trial++) {
      const vertices = 2 + (trial % 7),
        network: FlowNetwork = { vertices, source: trial % vertices, sink: (trial + 1) % vertices, edges: [] }
      for (let a = 0; a < vertices; a++)
        for (let b = 0; b < vertices; b++) if (a !== b && random() < 0.35) network.edges.push({ from: a, to: b, capacity: Math.floor(random() * 10) })
      const run = runEdmondsKarp(network)
      expect(run.maximum).toBe(cutOracle(network))
      expect(run.cutCapacity).toBe(run.maximum)
      for (let i = 0; i < run.frames.length; i++) {
        const frame = run.frames[i]
        expect(verifyFlow(network, frame.flow).valid).toBe(true)
        expect(frame.residual.every((a) => a.capacity > 0)).toBe(true)
        if (i) expect(frame.value).toBeGreaterThan(run.frames[i - 1].value)
      }
    }
  })
  it('handles disconnected and zero-capacity networks and validates custom networks', () => {
    expect(runEdmondsKarp({ vertices: 2, source: 0, sink: 1, edges: [] }).maximum).toBe(0)
    for (const text of [
      '{}',
      'null',
      'invalid',
      JSON.stringify({ ...flowExample, source: 5 }),
      JSON.stringify({ ...flowExample, edges: [{ from: 0, to: 1, capacity: -1 }] }),
      JSON.stringify({ ...flowExample, edges: [...flowExample.edges, flowExample.edges[0]] }),
    ])
      expect(() => parseFlowNetwork(text)).toThrow()
    expect(verifyFlow(flowExample, [17, 0, 0, 0, 0, 0, 0, 0]).valid).toBe(false)
    expect(verifyFlow(flowExample, [1, 0, 0, 0, 0, 0, 0, 0]).valid).toBe(false)
  })
})
