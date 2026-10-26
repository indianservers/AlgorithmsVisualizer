import { describe, it, expect } from 'vitest'
import { searchComplexitySat } from './complexityClassesModel'
import {
  buildThreeSatClique,
  findThreeSatClique,
  formatThreeSat,
  parseThreeSatFormula,
  threeSatChoicesToIds,
  threeSatReference,
  verifyThreeSatClique,
} from './threeSatCliqueModel'
describe('025 literal occurrence reduction', () => {
  it('constructs the reference graph and decodes the displayed x, y, w clique', () => {
    const built = buildThreeSatClique(threeSatReference)
    expect(built.graph.n).toBe(9)
    expect(built.graph.edges).toHaveLength(23)
    expect(built.pairs).toHaveLength(36)
    expect(built.pairs.filter((p) => p.reason === 'contradictory')).toHaveLength(4)
    expect(built.pairs.filter((p) => p.reason === 'same-clause')).toHaveLength(9)
    const checked = verifyThreeSatClique(threeSatReference, [0, 4, 8])
    expect(checked).toMatchObject({ valid: true, satisfies: true, coveredClauses: 3, assignment: [true, true, false, true] })
    expect(threeSatChoicesToIds([0, 1, 2])).toEqual([0, 4, 8])
  })
  it('parses symbolic or numeric formulas without merging repeated literal occurrences', () => {
    expect(parseThreeSatFormula('(x ∨ y ∨ z) ∧ (¬x ∨ y ∨ w) ∧ (¬y ∨ ¬z ∨ w)')).toEqual(threeSatReference)
    expect(parseThreeSatFormula('1 2 3; -1 2 4; -2 -3 4')).toEqual(threeSatReference)
    expect(parseThreeSatFormula('(x OR y OR z) AND (NOT x OR y OR w)')).toEqual([
      [1, 2, 3],
      [-1, 2, 4],
    ])
    expect(parseThreeSatFormula('x1 | !x2 | x3')).toEqual([[1, -2, 3]])
    const repeat = buildThreeSatClique(parseThreeSatFormula('x x x; -x -x -x'))
    expect(repeat.graph.n).toBe(6)
    expect(repeat.graph.edges).toHaveLength(0)
    expect(formatThreeSat(threeSatReference)).toContain('¬y ∨ ¬z ∨ w')
    for (const invalid of ['', 'x y', 'x y z w', '0 1 2', 'x9 x y', Array(7).fill('x y z').join(';')]) expect(() => parseThreeSatFormula(invalid)).toThrow()
  })
  it('rejects same-clause, contradictory, duplicate, incomplete and out-of-range certificates', () => {
    expect(verifyThreeSatClique(threeSatReference, [0, 3, 8]).conflicts[0].reason).toBe('contradictory')
    expect(verifyThreeSatClique(threeSatReference, [0, 1, 8]).conflicts[0].reason).toBe('same-clause')
    for (const ids of [
      [0, 0, 8],
      [0, 4],
      [0, 4, 99],
      [0, 4, 8, 6],
    ])
      expect(verifyThreeSatClique(threeSatReference, ids).valid).toBe(false)
    expect(verifyThreeSatClique(threeSatReference, [0, 3, 8]).assignment).toBeNull()
  })
  it('preserves satisfiability and correctly decodes every found certificate across varied formulas', () => {
    let seed = 15439
    for (let sample = 0; sample < 160; sample++) {
      const clauses = Array.from({ length: 1 + (sample % 6) }, () =>
          Array.from({ length: 3 }, () => {
            seed = (seed * 1664525 + 1013904223) >>> 0
            return (1 + (seed % 4)) * (seed & 16 ? -1 : 1)
          }),
        ),
        sat = searchComplexitySat(clauses),
        clique = findThreeSatClique(clauses)
      expect(clique.found).toBe(sat.found)
      expect(clique.tried).toBeLessThanOrEqual(clique.limit)
      if (clique.found) expect(verifyThreeSatClique(clauses, clique.selected)).toMatchObject({ valid: true, satisfies: true })
      const built = buildThreeSatClique(clauses)
      for (const [a, b] of built.graph.edges) {
        expect(built.occurrences[a].clause).not.toBe(built.occurrences[b].clause)
        expect(built.occurrences[a].literal).not.toBe(-built.occurrences[b].literal)
      }
    }
    expect(
      findThreeSatClique([
        [1, 1, 1],
        [-1, -1, -1],
      ]).found,
    ).toBe(false)
    expect(findThreeSatClique([[1, 2, 3]]).selected).toHaveLength(1)
  })
})
