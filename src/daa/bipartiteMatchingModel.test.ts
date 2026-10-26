import { describe, it, expect } from 'vitest'
import {
  flipMatchingPath,
  matchingGraph,
  matchingPath,
  matchingStart,
  parseMatchingInput,
  reroutingGraph,
  solveBipartiteMatching,
  validateMatching,
  type MatchingGraph,
} from './bipartiteMatchingModel'
describe('029 bipartite augmenting paths', () => {
  it('matches the reference structure with a valid free-to-free path and exact increase', () => {
    const search = matchingPath(matchingGraph, matchingStart, 2)
    expect(search.path).toEqual([2, 5])
    expect(flipMatchingPath(matchingGraph, matchingStart, search.path)).toEqual([
      [1, 4],
      [2, 5],
      [3, 6],
    ])
    expect(matchingPath(matchingGraph, matchingStart, 1).reason).toContain('already matched')
  })
  it('reroutes an existing mate and checks alternating, simple and free endpoint conditions', () => {
    const initial: [number, number][] = [
        [1, 4],
        [3, 6],
      ],
      search = matchingPath(reroutingGraph, initial, 2)
    expect(search.path).toEqual([2, 4, 1, 5])
    expect(flipMatchingPath(reroutingGraph, initial, search.path)).toEqual([
      [1, 5],
      [2, 4],
      [3, 6],
    ])
    for (const path of [
      [2, 4],
      [1, 5],
      [2, 4, 2, 5],
      [2, 5, 1, 6],
      [2, 4, 1],
    ])
      expect(() => flipMatchingPath(reroutingGraph, initial, path)).toThrow()
  })
  it('a failed search from one free vertex does not imply global optimality', () => {
    const graph = { left: 2, right: 2, edges: [[2, 4]] } as MatchingGraph
    expect(matchingPath(graph, [], 1).path).toEqual([])
    expect(solveBipartiteMatching(graph).size).toBe(1)
  })
  it('agrees with exhaustive search and yields a covering set equal in size on generated graphs', () => {
    let seed = 29
    const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32
    function brute(g: MatchingGraph, u = 1, used = new Set<number>()): number {
      if (u > g.left) return 0
      let best = brute(g, u + 1, used)
      for (const [a, b] of g.edges)
        if (a === u && !used.has(b)) {
          const copy = new Set(used)
          copy.add(b)
          best = Math.max(best, 1 + brute(g, u + 1, copy))
        }
      return best
    }
    for (let trial = 0; trial < 90; trial++) {
      const g: MatchingGraph = { left: 1 + (trial % 5), right: 1 + (Math.floor(trial / 5) % 5), edges: [] }
      for (let u = 1; u <= g.left; u++) for (let v = g.left + 1; v <= g.left + g.right; v++) if (random() < 0.4) g.edges.push([u, v])
      const solved = solveBipartiteMatching(g)
      expect(solved.size).toBe(brute(g))
      expect(() => validateMatching(g, solved.matching)).not.toThrow()
      expect(solved.cover.length).toBe(solved.size)
      expect(g.edges.every(([u, v]) => solved.cover.includes(u) || solved.cover.includes(v))).toBe(true)
      const warm: [number, number][] = []
      for (const edge of [...g.edges].reverse()) if (random() < 0.5 && warm.every((p) => !p.includes(edge[0]) && !p.includes(edge[1]))) warm.push(edge)
      expect(solveBipartiteMatching(g, warm).size).toBe(brute(g))
    }
  })
  it('rejects invalid partitions, repeated endpoints, non-edges and malformed custom data', () => {
    for (const data of [
      'invalid',
      'null',
      '{}',
      JSON.stringify({ left: 0, right: 2, edges: [] }),
      JSON.stringify({ left: 2, right: 2, edges: [[1, 2]] }),
      JSON.stringify({
        ...matchingGraph,
        matching: [
          [1, 4],
          [1, 5],
        ],
      }),
      JSON.stringify({ ...matchingGraph, matching: [[3, 4]] }),
      JSON.stringify({ ...matchingGraph, edges: [null] }),
    ])
      expect(() => parseMatchingInput(data)).toThrow()
    expect(solveBipartiteMatching({ left: 2, right: 3, edges: [] }).size).toBe(0)
    expect(
      solveBipartiteMatching({
        left: 2,
        right: 3,
        edges: [
          [1, 3],
          [2, 4],
        ],
      }).perfect,
    ).toBe(false)
  })
})
