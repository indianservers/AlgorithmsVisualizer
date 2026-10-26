import { describe, it, expect } from 'vitest'
import { cliqueCoverInstance, cliqueCoverPresets, decodeCliqueCover, searchCliqueCover, toggleCliqueCoverEdge } from './cliqueCoverModel'
describe('026 clique to cover instance and certificate mapping', () => {
  it('derives the actual complement and mapped cover for the reference', () => {
    const p = cliqueCoverPresets[0],
      r = cliqueCoverInstance(p.graph, p.k, p.selected)
    expect(r.graph.edges).toHaveLength(11)
    expect(r.complement.edges).toEqual([
      [0, 3],
      [0, 5],
      [1, 5],
      [3, 5],
    ])
    expect(r.cover).toEqual([3, 4, 5])
    expect(r.targetK).toBe(3)
    expect(r.clique.valid).toBe(true)
    expect(r.target.valid).toBe(true)
    expect(r.independent).toBe(true)
    expect(r.pairs).toHaveLength(15)
    for (const pair of r.pairs) expect(pair.inH).toBe(!pair.inG)
  })
  it('shows failing selected pairs as uncovered complement edges rather than claiming NO', () => {
    const r = cliqueCoverInstance(cliqueCoverPresets[0].graph, 3, [0, 1, 5])
    expect(r.clique.missing).toEqual([
      [0, 5],
      [1, 5],
    ])
    expect(r.target.uncovered).toEqual(r.clique.missing)
    expect(r.independent).toBe(false)
    expect(searchCliqueCover(r.graph, 3)).toMatchObject({ source: { yes: true }, target: { yes: true } })
    const bad = cliqueCoverInstance(r.graph, 3, [0, 0, 99])
    expect(bad.clique.valid).toBe(false)
  })
  it('handles triangles, zero thresholds, isolated vertices and edgeless graphs', () => {
    const p = cliqueCoverPresets[1],
      r = cliqueCoverInstance(p.graph, p.k, p.selected)
    expect(r.complement.edges).toEqual([])
    expect(r.cover).toEqual([])
    expect(r.targetK).toBe(0)
    expect(r.target.valid).toBe(true)
    expect(cliqueCoverInstance({ n: 1, edges: [] }, 1, [0]).target.valid).toBe(true)
    expect(cliqueCoverInstance({ n: 3, edges: [] }, 0, []).target.valid).toBe(true)
    expect(searchCliqueCover(cliqueCoverPresets[2].graph, 3)).toMatchObject({ source: { yes: false }, target: { yes: false } })
    expect(() => cliqueCoverInstance({ n: 2, edges: [] }, 3, [])).toThrow()
    expect(() => cliqueCoverInstance({ n: 2, edges: [[0, 2]] }, 1, [])).toThrow()
  })
  it('keeps edge edits immutable and decodes valid target witnesses back to a clique', () => {
    const p = cliqueCoverPresets[0],
      changed = toggleCliqueCoverEdge(p.graph, 0, 1),
      bad = cliqueCoverInstance(changed, 3, p.selected)
    expect(p.graph.edges).toContainEqual([0, 1])
    expect(changed.edges).not.toContainEqual([0, 1])
    expect(bad.complement.edges).toContainEqual([0, 1])
    expect(bad.target.valid).toBe(false)
    expect(toggleCliqueCoverEdge(changed, 1, 0)).toEqual(p.graph)
    expect(decodeCliqueCover(p.graph, 3, [3, 4, 5])).toMatchObject({ valid: true, selected: [0, 1, 2] })
    expect(decodeCliqueCover(p.graph, 3, [3, 4])).toMatchObject({ valid: false })
    expect(() => toggleCliqueCoverEdge(p.graph, 0, 0)).toThrow()
  })
  it('preserves both answers and maps witnesses for all four-vertex graphs and thresholds', () => {
    const all: [number, number][] = [
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 2],
      [1, 3],
      [2, 3],
    ]
    for (let mask = 0; mask < 64; mask++)
      for (let k = 0; k <= 4; k++) {
        const graph = { n: 4, edges: all.filter((_, i) => mask & (1 << i)) },
          found = searchCliqueCover(graph, k)
        expect(found.source.yes).toBe(found.target.yes)
        if (found.source.yes) expect(cliqueCoverInstance(graph, k, found.source.witness).target.valid).toBe(true)
        if (found.target.yes) expect(decodeCliqueCover(graph, k, found.target.witness).valid).toBe(true)
      }
  })
})
