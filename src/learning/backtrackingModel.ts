import type { AlgorithmStep } from '../types'
import type { DaaInput } from '../daa/types'
export const btFieldNames: Record<string, string> = {
  n: 'Board size n',
  values: 'Subset values',
  target: 'Target sum',
  vertices: 'Number of vertices',
  edges: 'Edges: from, to, weight (one per line)',
  source: 'Start vertex',
  directed: 'Graph direction',
  colors: 'Available colors',
}
export function btFieldsFor(input: DaaInput): Record<string, string> {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [
      key,
      key === 'edges' ? input.edges!.map((e) => `${e.from}, ${e.to}, ${e.weight}`).join('\n') : Array.isArray(value) ? value.join(', ') : String(value),
    ]),
  )
}
export function parseBTFields(fields: Record<string, string>, defaults: DaaInput): DaaInput {
  const nums = (s: string) =>
    s
      .split(/[\s,]+/)
      .filter(Boolean)
      .map((token) => {
        const v = Number(token)
        if (!Number.isFinite(v)) throw new Error(`'${token}' is not a finite number.`)
        return v
      })
  return Object.fromEntries(
    Object.entries(defaults).map(([key, value]) => {
      const text = fields[key] ?? ''
      if (key === 'edges')
        return [
          key,
          text
            .split(/\r?\n/)
            .filter((row) => row.trim())
            .map((row) => {
              const n = nums(row)
              if (n.length !== 3) throw new Error('Each edge needs from, to, weight.')
              return { from: n[0], to: n[1], weight: n[2] }
            }),
        ]
      if (!text.trim()) throw new Error(`${btFieldNames[key]} is required.`)
      if (typeof value === 'boolean') {
        if (!['true', 'false'].includes(text)) throw new Error('Graph direction must be true or false.')
        return [key, text === 'true']
      }
      return [key, Array.isArray(value) ? nums(text) : Number(text)]
    }),
  ) as DaaInput
}
export function validateBTStudioInput(input: DaaInput) {
  if (input.values?.some((value) => !Number.isSafeInteger(value))) throw new Error('Use integer subset values so equality with the target is exact.')
  if ((input.values?.length ?? 0) > 12) throw new Error('Use at most 12 subset values in the interactive studio; enumeration is exponential.')
}
export function nextBTPrediction(steps: AlgorithmStep[], cursor: number) {
  const index = steps.findIndex((s, i) => i > cursor && !!s.state?.backtrack?.prediction)
  return index < 0 ? undefined : { index, before: steps[Math.max(0, index - 1)].state!.backtrack!.path, ...steps[index].state!.backtrack!.prediction! }
}
export const checkBTPrediction = (answer: string, expected: string) => answer.trim().toLowerCase() === expected

type Profile = {
  state: string
  choice: string
  base: string
  undo: string
  mode: string
  pitfall: string
  help: string
  worked: string[]
  examples: { name: string; input: DaaInput }[]
}
const triangle = {
  vertices: 3,
  directed: false,
  edges: [
    { from: 0, to: 1, weight: 1 },
    { from: 1, to: 2, weight: 1 },
    { from: 2, to: 0, weight: 1 },
  ],
}
export const btProfiles: Record<string, Profile> = {
  'n-queens': {
    state: 'One queen per assigned row. path[r] is its column.',
    choice: 'Try columns left to right; reject shared columns and diagonals.',
    base: 'When row = n, record a complete nonattacking placement.',
    undo: 'Remove the queen and its column / diagonal marks before the next column.',
    mode: 'Enumerate every solution',
    pitfall: 'A locally safe queen may still lead to a dead end. Undo is required even after a solution when enumerating all solutions.',
    help: 'Integer n from 0–8. Coordinates are zero-based. n=0 has one empty placement by convention. Large boards can exceed the displayed trace budget.',
    worked: [
      'Place (0,0). Both branches starting from it eventually fail. Undo the first queen.',
      'Start (0,1), then (1,3), (2,0), (3,2): one valid placement.',
      'Continue searching: [2,0,3,1] is the other n=4 solution. Restore the empty board after enumeration.',
    ],
    examples: [
      { name: 'Two solutions: n=4', input: { n: 4 } },
      { name: 'Impossible board: n=3', input: { n: 3 } },
      { name: 'Single queen', input: { n: 1 } },
      { name: 'Empty board convention', input: { n: 0 } },
      { name: 'Trace-budget demonstration: n=8', input: { n: 8 } },
    ],
  },
  'sum-of-subsets': {
    state: 'Chosen original indices, next undecided index, and current sum.',
    choice: 'At each index explore include first, then exclude.',
    base: 'Only at the leaf: record the indices if sum equals target.',
    undo: 'Pop the included index; restore the previous sum before the exclude branch.',
    mode: 'Enumerate every index-distinct subset',
    pitfall:
      'Do not prune just because sum exceeds target when negative values remain. Equal values at different indices are distinct items. A zero target may include the empty subset.',
    help: '1–12 integer values, each with magnitude ≤1,000,000; integer target. Integers keep sum equality exact. Negative values and zeros are supported. Large inputs produce a truncated teaching trace but a complete computed result.',
    worked: [
      'Default values [3,4,5,−2], target 7: include indices 0 and 1 → 3+4=7.',
      'Exclude indices 2 and 3 to reach a leaf. Record [0,1]. Do not stop at an intermediate sum.',
      'Another leaf chooses [1,2,3]: 4+5−2=7. There are two solutions.',
    ],
    examples: [
      { name: 'Negative value repairs an overshoot', input: { values: [5, -2], target: 3 } },
      { name: 'Zeros and empty subset', input: { values: [0, 0], target: 0 } },
      { name: 'Equal values, distinct indices', input: { values: [2, 2, 3], target: 2 } },
      { name: 'No matching subset', input: { values: [2, 4, 6], target: 5 } },
    ],
  },
  'graph-coloring': {
    state: 'color[v] is −1 for unassigned vertices, or a chosen color ID.',
    choice: 'Assign vertices in order. Try colors 0…m−1 and reject neighbor conflicts.',
    base: 'All vertices assigned: return the first proper coloring.',
    undo: 'Reset a failed vertex to −1 before trying its next color.',
    mode: 'Find one solution / decide feasibility',
    pitfall:
      'This decides whether m colors suffice; it does not compute the minimum chromatic number. A self-loop is impossible for every m. Parallel edges repeat the same constraint.',
    help: '1–8 vertices numbered from 0; 1–6 colors. Edges use from, to, weight triples; weights are ignored and adjacency is treated as undirected.',
    worked: [
      'For a triangle and 2 colors: give vertex 0 color 0, then vertex 1 color 1.',
      'Vertex 2 touches both assigned colors: neither is safe. Undo and explore the remaining branches.',
      'Two colors are impossible; with 3 colors, [0,1,2] is a valid assignment.',
    ],
    examples: [
      { name: 'Triangle needs 3 colors', input: { ...triangle, colors: 3 } },
      { name: 'Triangle fails with 2 colors', input: { ...triangle, colors: 2 } },
      { name: 'No edges: one color is enough', input: { vertices: 4, directed: false, edges: [], colors: 1 } },
      { name: 'Impossible self-loop', input: { vertices: 2, directed: false, edges: [{ from: 0, to: 0, weight: 1 }], colors: 3 } },
    ],
  },
  'hamiltonian-cycle': {
    state: 'An edge-following path from the source; no vertex repeats.',
    choice: 'Try candidate vertices in increasing order; require an edge and an unused vertex.',
    base: 'After visiting all vertices, require a closing edge back to the source.',
    undo: 'Pop the last vertex and remove it from the visited set.',
    mode: 'Find one source-starting cycle',
    pitfall:
      'A Hamiltonian path is not necessarily a cycle. Directed edge orientation matters. This is vertex coverage, not an Eulerian edge tour. The implementation follows adjacency literally, including small graphs.',
    help: '1–8 vertices, valid source, at most 64 edge triples. Choose directed or undirected; weights do not affect existence. For n=1 a self-loop is required; an undirected n=2 edge can be traversed out and back.',
    worked: [
      'Default complete graph: start at 0; choose unused neighbor 1, then 2, then 3.',
      'All vertices are visited. Check the edge 3→0 before accepting.',
      'Return cycle [0,1,2,3,0]. On a path graph the missing closing edge forces undo.',
    ],
    examples: [
      {
        name: 'Directed cycle',
        input: {
          vertices: 4,
          directed: true,
          source: 0,
          edges: [
            { from: 0, to: 1, weight: 1 },
            { from: 1, to: 2, weight: 1 },
            { from: 2, to: 3, weight: 1 },
            { from: 3, to: 0, weight: 1 },
          ],
        },
      },
      {
        name: 'Full path but no closing edge',
        input: {
          vertices: 3,
          directed: true,
          source: 0,
          edges: [
            { from: 0, to: 1, weight: 1 },
            { from: 1, to: 2, weight: 1 },
          ],
        },
      },
      {
        name: 'Disconnected graph',
        input: {
          vertices: 4,
          directed: false,
          source: 0,
          edges: [
            { from: 0, to: 1, weight: 1 },
            { from: 2, to: 3, weight: 1 },
          ],
        },
      },
      { name: 'Single vertex with self-loop', input: { vertices: 1, directed: true, source: 0, edges: [{ from: 0, to: 0, weight: 1 }] } },
    ],
  },
}
