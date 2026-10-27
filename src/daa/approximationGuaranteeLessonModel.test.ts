import { describe, it, expect } from 'vitest'
import {
  guaranteeGraph,
  guaranteeTsp,
  runApproximationGuarantee,
  guaranteeFeasible,
  runCutGuarantee,
  parseGuaranteeInput,
  parseGuaranteeOrder,
  schemeIllustration,
} from './approximationGuaranteeLessonModel'
import { isCoverMatching, isCover } from './vertexCoverLessonModel'
import { tourCost } from './metricTspLessonModel'
describe('047 approximation algorithms and guarantees', () => {
  it('retains the reference totals using a valid maximal matching and real cover', () => {
    const r = runApproximationGuarantee('cover')
    expect(r.graph.vertices).toBe(8)
    expect(r.graph.edges).toHaveLength(11)
    expect(r.cover!.final.matching).toEqual([0, 1, 2])
    expect(isCoverMatching(r.graph, r.final.highlighted)).toBe(true)
    expect(r.final.alg).toBe(6)
    expect(r.optimum).toBe(4)
    expect(r.ratio).toBe(1.5)
    expect(r.bound).toBe(8)
    expect(isCover(r.graph, r.final.selected)).toBe(true)
    expect(guaranteeFeasible(r, r.final)).toBe(true)
    expect(r.graph.edges.every(([u, v]) => r.final.selected.includes(u) || r.final.selected.includes(v))).toBe(true)
  })
  it('checks 160 graph instances, matching certificates and tight-factor examples', () => {
    let seed = 47
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed
    }
    for (let t = 0; t < 160; t++) {
      const n = 1 + (random() % 8),
        edges: [number, number][] = []
      for (let u = 0; u < n; u++) for (let v = u + 1; v < n; v++) if (random() % 3 === 0 && edges.length < 20) edges.push([u, v])
      const r = runApproximationGuarantee('cover', { vertices: n, edges })
      expect(guaranteeFeasible(r, r.final)).toBe(true)
      expect(r.final.alg).toBeLessThanOrEqual(2 * r.optimum)
      expect(r.cover!.final.matching.length).toBeLessThanOrEqual(r.optimum)
      for (const f of r.frames) expect(isCoverMatching(r.graph, f.highlighted)).toBe(true)
    }
    const star = runApproximationGuarantee('cover', { vertices: 8, edges: Array.from({ length: 7 }, (_, i) => [0, i + 1] as [number, number]) })
    expect(star.ratio).toBe(2)
  })
  it('verifies greedy Max-Cut against exhaustive cuts and its m/2 lower bound', () => {
    for (let t = 0; t < 80; t++) {
      const n = 2 + (t % 7),
        edges: [number, number][] = []
      for (let u = 0; u < n; u++) for (let v = u + 1; v < n; v++) if ((u * 11 + v * 7 + t) % 3 && edges.length < 20) edges.push([u, v])
      const r = runApproximationGuarantee('max-cut', { vertices: n, edges }),
        cut = r.cut!
      expect(r.final.alg).toBeGreaterThanOrEqual(edges.length / 2)
      expect(r.final.alg).toBeGreaterThanOrEqual(r.optimum / 2)
      expect(r.final.alg).toBeLessThanOrEqual(r.optimum)
      expect(guaranteeFeasible(r, r.final)).toBe(true)
      expect(cut.decisions.reduce((a, d) => a + d.gain, 0)).toBe(r.final.alg)
      expect(r.optimum).toBe(edges.filter(([u, v]) => r.optimalSides[u] !== r.optimalSides[v]).length)
      for (const d of cut.decisions) expect(d.gain).toBe(Math.max(d.neighborsA, d.neighborsB))
    }
  })
  it('uses actual metric tours, tree lower bounds and validated triangle inequalities', () => {
    const r = runApproximationGuarantee('metric-tsp', guaranteeTsp)
    expect(guaranteeFeasible(r, r.final)).toBe(true)
    expect(r.final.alg).toBeCloseTo(tourCost(r.tsp!.tour, r.tsp!.distances))
    expect(r.tsp!.mstCost).toBeLessThanOrEqual(r.optimum + 1e-8)
    expect(r.final.alg).toBeLessThanOrEqual(2 * r.optimum + 1e-8)
    expect(r.tsp!.shortcuts.every((s) => s.direct <= s.walkCost + 1e-8)).toBe(true)
    expect(() =>
      parseGuaranteeInput(
        'metric-tsp',
        JSON.stringify({
          mode: 'matrix',
          source: 0,
          points: [
            [0, 0],
            [1, 0],
            [2, 0],
          ],
          matrix: [
            [0, 1, 3],
            [1, 0, 1],
            [3, 1, 0],
          ],
        }),
      ),
    ).toThrow('Triangle inequality')
  })
  it('keeps partial states distinct from feasible completed solutions and undefined zero ratios', () => {
    const r = runApproximationGuarantee('cover')
    expect(guaranteeFeasible(r, r.frames[0])).toBe(false)
    expect(r.frames[0].feasible).toBe(false)
    for (const mode of ['cover', 'max-cut'] as const) {
      const empty = runApproximationGuarantee(mode, { vertices: 1, edges: [] })
      expect(empty.final.alg).toBe(0)
      expect(empty.optimum).toBe(0)
      expect(empty.ratio).toBeNull()
      expect(guaranteeFeasible(empty, empty.final)).toBe(true)
    }
    const single = runApproximationGuarantee('metric-tsp', { mode: 'euclidean', source: 0, points: [[0, 0]] })
    expect(single.ratio).toBeNull()
    expect(guaranteeFeasible(single, single.final)).toBe(true)
    expect(parseGuaranteeOrder('0, 2 1', 11)).toEqual([0, 2, 1])
    for (const order of ['0,0', '11', '-1', '0.5']) expect(() => parseGuaranteeOrder(order, 11)).toThrow()
    expect(() => parseGuaranteeInput('cover', '{}')).toThrow()
    const alternative = runApproximationGuarantee('cover', guaranteeGraph, [6])
    expect(alternative.cover!.final.matching[0]).toBe(6)
    expect(guaranteeFeasible(alternative, alternative.final)).toBe(true)
  })
  it('distinguishes illustrative PTAS and FPTAS dependence on accuracy', () => {
    expect(schemeIllustration(10, 0.1)).toEqual({ factor: 1.1, ptas: 1e10, fptas: 1000 })
    expect(schemeIllustration(10, 0.05).ptas).toBeGreaterThan(schemeIllustration(10, 0.1).ptas)
    expect(() => schemeIllustration(10, 0)).toThrow()
    expect(() => schemeIllustration(101, 0.1)).toThrow()
    expect(runCutGuarantee(guaranteeGraph).frames.at(-1)!.feasible).toBe(true)
  })
})
