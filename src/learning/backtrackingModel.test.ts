import { describe, expect, it } from 'vitest'
import { daaLessons, lessonById } from '../daa/catalog'
import { executeLesson, type DaaInput } from '../daa/types'
import { btFieldsFor, btProfiles, checkBTPrediction, nextBTPrediction, parseBTFields, validateBTStudioInput } from './backtrackingModel'

const run = (id: string, input: DaaInput, limit = 1500) => executeLesson(lessonById.get(id)!, input, limit)
describe('backtracking learning studio', () => {
  for (const lesson of daaLessons.filter((l) => l.category === 'Backtracking' && l.run))
    it(`${lesson.id}: profiles, presets and truthful traces`, () => {
      for (const input of [lesson.defaultInput!, ...btProfiles[lesson.id].examples.map((e) => e.input)]) {
        validateBTStudioInput(input)
        expect(parseBTFields(btFieldsFor(input), input)).toEqual(input)
        const computed = executeLesson(lesson, input, 1500)
        expect(computed.steps[0].state!.backtrack!.phase).toBe('ready')
        expect(JSON.parse(JSON.stringify(computed))).toEqual(computed)
        for (const step of computed.steps) {
          const meta = step.state!.backtrack!
          expect(meta.nodes.some((n) => n.id === meta.current)).toBe(true)
          expect(meta.nodes.length).toBeLessThanOrEqual(60)
          expect(meta.solutions).toBeGreaterThanOrEqual(0)
          expect(meta.undos).toBeGreaterThanOrEqual(0)
          expect(step.pseudocodeLine).toBeLessThan(lesson.pseudocode.length)
          if (meta.prediction) expect(checkBTPrediction(meta.prediction.answer, meta.prediction.answer)).toBe(true)
          if (lesson.id === 'n-queens')
            for (let a = 0; a < meta.path.length; a++)
              for (let b = a + 1; b < meta.path.length; b++) {
                expect(meta.path[a]).not.toBe(meta.path[b])
                expect(Math.abs(meta.path[a] - meta.path[b])).not.toBe(b - a)
              }
          if (lesson.id === 'hamiltonian-cycle') expect(new Set(meta.path).size).toBe(meta.path.length)
        }
        expect(computed.steps[0].state!.backtrack!.solutions).toBe(0)
      }
    })
  it('enumerates known queen counts, restores empty state and reports truncation honestly', () => {
    for (const [n, count] of [
      [0, 1],
      [1, 1],
      [2, 0],
      [3, 0],
      [4, 2],
      [5, 10],
      [6, 4],
      [8, 92],
    ]) {
      const computed = run('n-queens', { n }, n < 6 ? 1500 : 80)
      expect(computed.result).toMatchObject({ count })
      if (n >= 6) {
        expect(computed.status).toBe('truncated')
        expect(computed.steps).toHaveLength(80)
      } else {
        expect(computed.steps.at(-1)!.state!.backtrack!.path).toEqual([])
        expect(computed.steps.at(-1)!.state!.backtrack!.solutions).toBe(count)
      }
    }
  })
  it('shows rejection attackers and undo exactly restores a queen prefix', () => {
    const computed = run('n-queens', { n: 4 })
    const first = nextBTPrediction(computed.steps, 0)!
    expect(first.answer).toBe('choose')
    expect(first.before).toEqual([])
    const rejected = computed.steps.find((s) => s.state?.backtrack?.phase === 'reject')!.state!.backtrack!
    expect(rejected.conflicts).not.toHaveLength(0)
    for (const step of computed.steps.filter((s) => s.state!.backtrack!.phase === 'undo'))
      expect(step.state!.backtrack!.path.length).toBe(step.state!.backtrack!.depth)
  })
  it('supports negative repair, duplicate indices and empty subsets', () => {
    expect(run('sum-of-subsets', { values: [5, -2], target: 3 }).result).toMatchObject({ subsets: [[0, 1]], count: 1 })
    expect(run('sum-of-subsets', { values: [0, 0], target: 0 }).result).toMatchObject({ count: 4 })
    expect(run('sum-of-subsets', { values: [2, 2], target: 2 }).result).toMatchObject({ subsets: [[0], [1]], count: 2 })
  })
  it('matches exhaustive subset counts for signed inputs', () => {
    for (let seed = 0; seed < 30; seed++) {
      const values = Array.from({ length: 6 }, (_, i) => (((seed + 3) * (i + 7)) % 11) - 5),
        target = (seed % 7) - 3
      const expected = Array.from({ length: 64 }, (_, mask) => values.reduce((sum, v, i) => sum + (mask & (1 << i) ? v : 0), 0)).filter(
        (s) => s === target,
      ).length
      expect(run('sum-of-subsets', { values, target }).result).toMatchObject({ count: expected })
    }
  })
  it('coloring rejects self-loops and two-color triangles, accepts three colors', () => {
    const input = btProfiles['graph-coloring'].examples[0].input
    expect(run('graph-coloring', { ...input, colors: 2 }).result).toEqual({ satisfiable: false, colors: [] })
    expect(run('graph-coloring', { ...input, colors: 3 }).result).toEqual({ satisfiable: true, colors: [0, 1, 2] })
    expect(run('graph-coloring', btProfiles['graph-coloring'].examples[3].input).result).toEqual({ satisfiable: false, colors: [] })
    const failed = run('graph-coloring', { ...input, colors: 2 })
    expect(failed.steps.some((s) => s.state!.backtrack!.phase === 'undo')).toBe(true)
    expect(failed.steps.at(-1)!.state!.backtrack!.path).toEqual([-1, -1, -1])
  })
  it('requires a closing edge and respects direction and the chosen source', () => {
    const input = btProfiles['hamiltonian-cycle'].examples[0].input
    expect(run('hamiltonian-cycle', input).result).toEqual({ exists: true, cycle: [0, 1, 2, 3, 0] })
    expect(run('hamiltonian-cycle', { ...input, source: 2 }).result).toEqual({ exists: true, cycle: [2, 3, 0, 1, 2] })
    expect(run('hamiltonian-cycle', btProfiles['hamiltonian-cycle'].examples[1].input).result).toEqual({ exists: false, cycle: [] })
    expect(run('hamiltonian-cycle', { vertices: 1, directed: true, source: 0, edges: [] }).result).toEqual({ exists: false, cycle: [] })
  })
  it('matches brute-force feasibility for small coloring and Hamiltonian graphs', () => {
    for (let mask = 0; mask < 32; mask++) {
      const pairs = [
          [0, 1],
          [0, 2],
          [0, 3],
          [1, 2],
          [1, 3],
          [2, 3],
        ],
        edges = pairs.filter((_, i) => mask & (1 << i)).map(([from, to]) => ({ from, to, weight: 1 })),
        input = { vertices: 4, directed: false, edges }
      const expected = Array.from({ length: 16 }, (_, colors) => edges.every((e) => ((colors >> e.from) & 1) !== ((colors >> e.to) & 1))).some(Boolean)
      expect(run('graph-coloring', { ...input, colors: 2 }).result).toMatchObject({ satisfiable: expected })
      const paths = [
        [1, 2, 3],
        [1, 3, 2],
        [2, 1, 3],
        [2, 3, 1],
        [3, 1, 2],
        [3, 2, 1],
      ]
      const exists = paths.some((p) =>
        [0, ...p, 0].slice(1).every((v, i) => edges.some((e) => (e.from === [0, ...p][i] && e.to === v) || (e.to === [0, ...p][i] && e.from === v))),
      )
      expect(run('hamiltonian-cycle', { ...input, source: 0 }).result).toMatchObject({ exists })
    }
  })
  it('validates field formats and learning limits', () => {
    expect(() => parseBTFields({ edges: '0, 1' }, { edges: [] })).toThrow('from, to, weight')
    expect(() => parseBTFields({ n: '' }, { n: 4 })).toThrow('required')
    expect(() => parseBTFields({ values: '3, abc' }, { values: [1] })).toThrow('finite')
    expect(() => validateBTStudioInput({ values: Array(13).fill(1) })).toThrow('12 subset')
    expect(() => validateBTStudioInput({ values: [0.1, 0.2, -0.3] })).toThrow('integer subset')
    expect(checkBTPrediction(' CHOOSE ', 'choose')).toBe(true)
    expect(checkBTPrediction('', 'yes')).toBe(false)
  })
})
