import { describe, it, expect } from 'vitest'
import {
  buildReductionInstance,
  checkReductionCertificate,
  complementReductionGraph,
  exampleReductionGraph,
  reductionBackMap,
  smallReductionDecision,
  type ReductionKind,
} from './certificatesReductionModel'
import { verifyComplexitySat, workedThreeSat } from './complexityClassesModel'
describe('024 executable many-one reductions', () => {
  it('maps the reference clique to a cover of the exact complement', () => {
    const graph = exampleReductionGraph(),
      result = buildReductionInstance('clique-cover', graph, 3, [0, 1, 2])
    expect(result.sourceValid).toBe(true)
    expect(result.targetK).toBe(3)
    expect(result.mappedVertices).toEqual([3, 4, 5])
    expect(checkReductionCertificate('VERTEX COVER', result.targetGraph, result.mappedVertices, 3).valid).toBe(true)
    expect(complementReductionGraph(result.targetGraph)).toEqual(graph)
    expect(result.sourceChecks).toHaveLength(4)
    expect(checkReductionCertificate('CLIQUE', graph, [0, 0, 1], 3).valid).toBe(false)
    expect(checkReductionCertificate('CLIQUE', graph, [0, 1, 5], 3).valid).toBe(false)
  })
  it('preserves yes/no answers in both directions for every graph on four vertices and every legal threshold', () => {
    const pairs: [number, number][] = [
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 2],
      [1, 3],
      [2, 3],
    ]
    for (let mask = 0; mask < 64; mask++)
      for (let k = 0; k <= 4; k++)
        for (const kind of ['clique-cover', 'cover-clique', 'independent-clique'] as ReductionKind[]) {
          const graph = { n: 4, edges: pairs.filter((_, i) => mask & (1 << i)) },
            result = buildReductionInstance(kind, graph, k, []),
            source = smallReductionDecision(result.example.source as 'CLIQUE' | 'VERTEX COVER' | 'INDEPENDENT SET', graph, k),
            target = smallReductionDecision(result.example.target as 'CLIQUE' | 'VERTEX COVER', result.targetGraph, result.targetK)
          expect(source.yes).toBe(target.yes)
          if (source.yes) {
            const mapped = buildReductionInstance(kind, graph, k, source.witness)
            expect(
              checkReductionCertificate(result.example.target as 'CLIQUE' | 'VERTEX COVER', mapped.targetGraph, mapped.mappedVertices, mapped.targetK).valid,
            ).toBe(true)
          }
          if (target.yes) {
            const back = reductionBackMap(kind, graph, target.witness)
            expect(checkReductionCertificate(result.example.source as 'CLIQUE' | 'VERTEX COVER' | 'INDEPENDENT SET', graph, back.vertices, k).valid).toBe(true)
          }
        }
  })
  it('builds an actual 3-SAT to clique graph and decodes its certificate', () => {
    const r = buildReductionInstance('sat-clique', exampleReductionGraph(), 3, [], workedThreeSat, [true, false, true])
    expect(r.targetGraph.n).toBe(9)
    expect(r.targetK).toBe(3)
    expect(r.mappedVertices).toEqual([0, 5, 6])
    expect(r.sourceValid).toBe(true)
    const found = smallReductionDecision('CLIQUE', r.targetGraph, r.targetK)
    expect(found.yes).toBe(true)
    expect(verifyComplexitySat(workedThreeSat, reductionBackMap('sat-clique', exampleReductionGraph(), found.witness).assignment).valid).toBe(true)
    const no = buildReductionInstance('sat-clique', exampleReductionGraph(), 2, [], [[1], [-1]], [true])
    expect(smallReductionDecision('CLIQUE', no.targetGraph, 2).yes).toBe(false)
  })
  it('rejects unsupported inputs and distinguishes an invalid witness from a NO instance', () => {
    const g = exampleReductionGraph(),
      bad = buildReductionInstance('clique-cover', g, 3, [0, 1, 5])
    expect(bad.sourceValid).toBe(false)
    expect(smallReductionDecision('CLIQUE', g, 3).yes).toBe(true)
    expect(() => exampleReductionGraph(9)).toThrow()
    expect(() => buildReductionInstance('clique-cover', g, 7, [])).toThrow()
    expect(() => buildReductionInstance('sat-clique', g, 3, [], [[1], [1], [1], [1]], [true])).toThrow()
    expect(smallReductionDecision('CLIQUE', { n: 1, edges: [] }, 1).yes).toBe(true)
    expect(checkReductionCertificate('VERTEX COVER', { n: 1, edges: [] }, [], 0).valid).toBe(true)
  })
})
