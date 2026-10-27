import { describe, it, expect } from 'vitest'
import {
  buildComplexityReduction,
  certificateGraph,
  certificateMatrix,
  complexityProblems,
  complexityMapMembership,
  complexityMapRegions,
  parseCertificateGraph,
  parseCertificateIds,
  parseCertificateMatrix,
  parseComplexityCnf,
  satVariableCount,
  searchComplexitySat,
  verifyComplexityClique,
  verifyComplexityCover,
  verifyComplexityFactor,
  verifyComplexitySat,
  verifyComplexityTour,
  workedThreeSat,
} from './complexityClassesModel'

describe('complexity class explorer and real certificate verifiers', () => {
  it('keeps P outside the NP-hard colored region and makes the purple region the intersection', () => {
    expect(complexityMapMembership(264, 214)).toEqual({ P: true, NP: true, 'NP-Hard': false, 'NP-Complete': false })
    expect(complexityMapMembership(300, 112)).toEqual({ P: false, NP: true, 'NP-Hard': false, 'NP-Complete': false })
    expect(complexityMapMembership(418, 192)).toEqual({ P: false, NP: true, 'NP-Hard': true, 'NP-Complete': true })
    expect(complexityMapMembership(543, 162)).toEqual({ P: false, NP: false, 'NP-Hard': true, 'NP-Complete': false })
    for (let angle = 0; angle < Math.PI * 2; angle += 0.01) {
      const p = complexityMapRegions.complete,
        point = complexityMapMembership(p.cx + p.rx * 0.999 * Math.cos(angle), p.cy + p.ry * 0.999 * Math.sin(angle))
      expect(point.NP).toBe(true)
      expect(point['NP-Hard']).toBe(true)
      expect(point.P).toBe(false)
      const pRegion = complexityMapRegions.p,
        pBoundary = complexityMapMembership(pRegion.cx + pRegion.rx * 0.999 * Math.cos(angle), pRegion.cy + pRegion.ry * 0.999 * Math.sin(angle))
      expect(pBoundary).toEqual({ P: true, NP: true, 'NP-Hard': false, 'NP-Complete': false })
    }
  })
  it('keeps decision and optimization classifications distinct without claiming P ≠ NP', () => {
    expect(complexityProblems).toHaveLength(6)
    expect(complexityProblems.find((p) => p.id === 'tsp-decision')?.badge).toBe('NP-Complete')
    expect(complexityProblems.find((p) => p.id === 'tsp-optimization')?.kind).toBe('optimization')
    expect(complexityProblems.find((p) => p.id === 'factor')?.badge).toBe('NP')
    expect(complexityProblems.find((p) => p.id === 'connectivity')?.membership).toContain('also in NP')
  })
  it('parses a bounded CNF and checks certificates without executing formula text', () => {
    const clauses = parseComplexityCnf('1 -2; -1 3')
    expect(verifyComplexitySat(clauses, [true, false, true]).valid).toBe(true)
    expect(verifyComplexitySat(clauses, [true, false, false]).checks[1].satisfied).toBe(false)
    expect(verifyComplexitySat(clauses, [true]).wellFormed).toBe(false)
    expect(searchComplexitySat(parseComplexityCnf('1;-1'))).toMatchObject({ found: false, tried: 2, total: 2 })
    expect(searchComplexitySat(parseComplexityCnf('1;-2;3'))).toMatchObject({ found: true, assignment: [true, false, true] })
    expect(satVariableCount(parseComplexityCnf('8'))).toBe(8)
    for (const text of ['', '1;', '0', '9', 'alert(1)', '1;;2']) expect(() => parseComplexityCnf(text)).toThrow()
  })
  it('validates cover and clique witnesses including empty, repeated and out-of-range candidates', () => {
    expect(verifyComplexityCover(certificateGraph, [0, 2], 2).valid).toBe(true)
    expect(verifyComplexityCover(certificateGraph, [0, 1], 2).uncovered).toEqual([[2, 3]])
    expect(verifyComplexityClique(certificateGraph, [0, 1, 2], 3).valid).toBe(true)
    expect(verifyComplexityClique(certificateGraph, [0, 1, 3], 3).valid).toBe(false)
    expect(verifyComplexityCover(certificateGraph, [0, 0], 2).wellFormed).toBe(false)
    expect(verifyComplexityClique(certificateGraph, [0, 8], 2).wellFormed).toBe(false)
    expect(verifyComplexityCover({ n: 1, edges: [] }, [], 0).valid).toBe(true)
    expect(parseCertificateGraph('4', '1-2, 2-1, 3-4').edges).toEqual([
      [0, 1],
      [2, 3],
    ])
    expect(parseCertificateIds('1, 3')).toEqual([0, 2])
    expect(() => parseCertificateGraph('3', '1-4')).toThrow()
    expect(() => parseCertificateGraph('3', '1-1')).toThrow()
  })
  it('checks a complete closed tour and its threshold without asserting optimality', () => {
    expect(verifyComplexityTour(certificateMatrix, [0, 1, 3, 2, 0], 80)).toMatchObject({ valid: true, cost: 80 })
    expect(verifyComplexityTour(certificateMatrix, [0, 1, 3, 2, 0], 79).valid).toBe(false)
    expect(verifyComplexityTour(certificateMatrix, [0, 1, 1, 2, 0], 1000).wellFormed).toBe(false)
    expect(verifyComplexityTour(certificateMatrix, [0, 1, 3, 2], 1000).wellFormed).toBe(false)
    expect(verifyComplexityTour([[0]], [0, 0], 0).valid).toBe(true)
    expect(() => parseCertificateMatrix('0,1\n2,0')).toThrow()
    expect(parseCertificateMatrix('0 7\n7 0')).toEqual([
      [0, 7],
      [7, 0],
    ])
  })
  it('checks factor certificates with exact bounded integers', () => {
    expect(verifyComplexityFactor('91', '10', '7').valid).toBe(true)
    for (const d of ['0', '1', '13', '91']) expect(verifyComplexityFactor('91', '10', d).valid).toBe(false)
    expect(verifyComplexityFactor(String((1n << 200n) + 2n), '2', '2').valid).toBe(true)
    expect(() => verifyComplexityFactor(String(1n << 256n), '2', '2')).toThrow()
  })
  it('constructs the actual 3-SAT → CLIQUE → complement VERTEX COVER witness', () => {
    const result = buildComplexityReduction(workedThreeSat, [true, false, true])
    expect(result.graph.n).toBe(9)
    expect(result.cliqueSize).toBe(3)
    expect(result.coverBudget).toBe(6)
    expect(result.chosen).toEqual([0, 5, 6])
    expect(result.cliqueValid).toBe(true)
    expect(result.coverValid).toBe(true)
    for (let mask = 0; mask < 8; mask++) {
      const assignment = Array.from({ length: 3 }, (_, i) => Boolean(mask & (1 << i))),
        sat = verifyComplexitySat(workedThreeSat, assignment).valid,
        r = buildComplexityReduction(workedThreeSat, assignment)
      expect(r.cliqueValid).toBe(sat)
      expect(r.coverValid).toBe(sat)
      for (const edge of r.coverGraph.edges) expect(r.graph.edges).not.toContainEqual(edge)
      expect(r.graph.edges.length + r.coverGraph.edges.length).toBe(36)
    }
    const unsat = buildComplexityReduction([[1], [-1]], [true])
    expect(unsat.cliqueValid).toBe(false)
    expect(unsat.coverValid).toBe(false)
    expect(() => buildComplexityReduction([[-1]], [])).toThrow()
    for (const invalid of [[], [[0]], [[9]], [[1, 2, 3, 4]]]) expect(() => buildComplexityReduction(invalid, [true])).toThrow()
  })
})
