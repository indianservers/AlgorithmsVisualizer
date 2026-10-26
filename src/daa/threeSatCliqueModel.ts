import { parseComplexityCnf, satVariableCount, verifyComplexityClique, verifyComplexitySat, type CertificateGraph, type Cnf } from './complexityClassesModel'

export const threeSatReference: Cnf = [
  [1, 2, 3],
  [-1, 2, 4],
  [-2, -3, 4],
]
export const threeSatPresets = [
  { id: 'reference', clauses: threeSatReference },
  {
    id: 'two-clause',
    clauses: [
      [1, 2, 3],
      [-1, 2, 4],
    ],
  },
  {
    id: 'unsatisfiable',
    clauses: [
      [1, 1, 1],
      [-1, -1, -1],
    ],
  },
  { id: 'single-clause', clauses: [[1, -2, 3]] },
]
export function threeSatLiteralLabel(literal: number) {
  const names = ['x', 'y', 'z', 'w', 'x₅', 'x₆', 'x₇', 'x₈']
  return `${literal < 0 ? '¬' : ''}${names[Math.abs(literal) - 1]}`
}
export const threeSatClauseLabel = (clause: number[]) => clause.map(threeSatLiteralLabel).join(' ∨ ')
export const formatThreeSat = (clauses: Cnf) => clauses.map((clause) => `(${threeSatClauseLabel(clause)})`).join(' ∧ ')
export function parseThreeSatFormula(text: string): Cnf {
  const normalized = text
    .replace(/[₁-₈]/g, (d) => String('₀₁₂₃₄₅₆₇₈₉'.indexOf(d)))
    .replace(/−/g, '-')
    .replace(/\bnot\s+/gi, '-')
    .replace(/[¬!~]\s*/g, '-')
    .replace(/∧|&&?|\band\b/gi, ';')
    .replace(/∨|\|\|?|\bor\b/gi, ' ')
    .replace(/\bx([1-8])\b/gi, '$1')
    .replace(/\b([xyzw])\b/gi, (name) => String('xyzw'.indexOf(name.toLowerCase()) + 1))
  const clauses = parseComplexityCnf(normalized)
  validateThreeSat(clauses)
  return clauses
}
function validateThreeSat(clauses: Cnf) {
  if (
    !clauses.length ||
    clauses.length > 6 ||
    clauses.some((clause) => clause.length !== 3 || clause.some((lit) => !Number.isInteger(lit) || !lit || Math.abs(lit) > 8))
  )
    throw new Error('Use 1–6 clauses with exactly 3 literals each, using x, y, z, w or signed variable IDs 1–8. Repeated literals are allowed.')
}
export type ThreeSatOccurrence = { id: number; clause: number; index: number; literal: number; label: string; occurrence: string }
export type ThreeSatPair = { a: number; b: number; reason: 'compatible' | 'same-clause' | 'contradictory' }
export function buildThreeSatClique(clauses: Cnf) {
  validateThreeSat(clauses)
  const occurrences: ThreeSatOccurrence[] = clauses.flatMap((row, clause) =>
      row.map((literal, index) => ({
        id: clause * 3 + index,
        clause,
        index,
        literal,
        label: threeSatLiteralLabel(literal),
        occurrence: `v${String(clause + 1).replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[Number(d)])},${String(index + 1).replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[Number(d)])}`,
      })),
    ),
    edges: [number, number][] = [],
    pairs: ThreeSatPair[] = []
  for (let a = 0; a < occurrences.length; a++)
    for (let b = a + 1; b < occurrences.length; b++) {
      const first = occurrences[a],
        second = occurrences[b],
        reason = first.clause === second.clause ? 'same-clause' : first.literal === -second.literal ? 'contradictory' : 'compatible'
      pairs.push({ a, b, reason })
      if (reason === 'compatible') edges.push([a, b])
    }
  return { occurrences, pairs, graph: { n: occurrences.length, edges } as CertificateGraph, m: clauses.length, variables: satVariableCount(clauses) }
}
export function verifyThreeSatClique(clauses: Cnf, selected: number[]) {
  const built = buildThreeSatClique(clauses),
    wellFormed =
      selected.length === built.m &&
      new Set(selected).size === selected.length &&
      selected.every((id) => Number.isInteger(id) && id >= 0 && id < built.graph.n),
    conflicts = built.pairs.filter((pair) => selected.includes(pair.a) && selected.includes(pair.b) && pair.reason !== 'compatible'),
    clique = verifyComplexityClique(built.graph, selected, built.m),
    valid = wellFormed && clique.valid && conflicts.length === 0
  const assignment = valid ? Array<boolean>(built.variables).fill(false) : null
  if (assignment)
    for (const id of selected) {
      const literal = built.occurrences[id].literal
      assignment[Math.abs(literal) - 1] = literal > 0
    }
  return {
    valid,
    wellFormed,
    conflicts,
    assignment,
    satisfies: assignment ? verifyComplexitySat(clauses, assignment).valid : false,
    coveredClauses: [...new Set(selected.filter((id) => id >= 0 && id < built.graph.n).map((id) => built.occurrences[id].clause))].length,
  }
}
export function threeSatChoicesToIds(choices: (number | null)[]) {
  return choices.flatMap((index, clause) => (index === null ? [] : [clause * 3 + index]))
}
export function findThreeSatClique(clauses: Cnf) {
  const built = buildThreeSatClique(clauses)
  let tried = 0
  const visit = (clause: number, selected: number[]): number[] | null => {
    if (clause === built.m) return selected
    for (let index = 0; index < 3; index++) {
      tried++
      const id = clause * 3 + index,
        literal = built.occurrences[id].literal
      if (selected.some((old) => built.occurrences[old].literal === -literal)) continue
      const found = visit(clause + 1, [...selected, id])
      if (found) return found
    }
    return null
  }
  const selected = visit(0, [])
  return { found: selected !== null, selected: selected ?? [], tried, limit: (3 ** (built.m + 1) - 3) / 2 }
}
