import { describe, expect, it } from 'vitest'
import { daaLessons, lessonById } from '../daa/catalog'
import { executeLesson, type DaaInput } from '../daa/types'
import { cellKey } from '../daa/dpTrace'
import { fieldsFor, nextDPPrediction, parseDPFields, validateDPStudioInput } from './dpModel'
import { dpProfiles } from './dpProfiles'
import { dpExtraLessons } from './dpExtras'

const lessons = [...daaLessons.filter((l) => l.category === 'Dynamic Programming' && l.run), ...dpExtraLessons]
const result = (id: string, input?: DaaInput) => {
  const lesson = lessons.find((l) => l.id === id)!
  return executeLesson(lesson, input ?? lesson.defaultInput!).result as Record<string, unknown>
}
describe('dynamic programming learning traces', () => {
  for (const lesson of lessons)
    it(`${lesson.id} has a truthful, replayable dependency trace`, () => {
      expect(dpProfiles[lesson.id]).toBeDefined()
      for (const input of [lesson.defaultInput!, ...dpProfiles[lesson.id].examples.map((e) => e.input)]) {
        validateDPStudioInput(input)
        expect(parseDPFields(fieldsFor(input), input)).toEqual(input)
        const run = executeLesson(lesson, input)
        expect(run.status).toBe('complete')
        expect(run.steps.length).toBeGreaterThan(1)
        for (const step of run.steps) {
          const state = step.state!,
            meta = state.dp!,
            known = new Set(meta.filled)
          expect(meta).toBeDefined()
          expect(state.table).toBeDefined()
          expect(state.rowLabels).toHaveLength(state.table!.length)
          for (const row of state.table!) expect(row).toHaveLength(state.columnLabels!.length)
          for (const dep of meta.dependencies) {
            expect(known.has(cellKey(dep.cell)), `${lesson.id}: ${step.description} dependency ${dep.cell}`).toBe(true)
            expect(state.table?.[dep.cell[0]]?.[dep.cell[1]]).not.toBeUndefined()
          }
          if (meta.phase === 'choose' && meta.focus) expect(known.has(cellKey(meta.focus))).toBe(true)
        }
        const prediction = nextDPPrediction(run.steps, 0)
        if (prediction) {
          expect(prediction.index).toBeGreaterThan(0)
          expect(run.steps[prediction.index].state!.dp!.phase).toBe('choose')
        }
      }
    })
  it('retains earlier snapshots and keeps unknown values hidden', () => {
    const l = lessonById.get('fibonacci-tabulation')!,
      run = executeLesson(l, { n: 8 })
    expect(run.steps[0].state!.table![0][8]).toBe(0)
    expect(run.steps[0].state!.dp!.filled).not.toContain('0:8')
    expect(run.steps.at(-1)!.state!.table![0][8]).toBe(21)
    const memo = executeLesson(lessonById.get('fibonacci-memoization')!, { n: 8 })
    expect(memo.steps.some((s) => s.state!.dp!.phase === 'reuse')).toBe(true)
    expect(memo.steps.some((s) => (s.state!.dp!.stack?.length ?? 0) > 3)).toBe(true)
    expect(memo.steps.at(-1)!.state!.dp!.stack).toEqual([])
    for (const id of ['longest-common-subsequence', 'edit-distance']) {
      const l = lessonById.get(id)!,
        run = executeLesson(l, { left: '😀a', right: '😀' })
      expect(run.steps[0].state!.rowLabels).toHaveLength(4)
      expect(run.steps[0].state!.columnLabels).toHaveLength(3)
    }
  })
  it('handles zero and empty-prefix inputs', () => {
    expect(result('fibonacci-memoization', { n: 0 })).toEqual({ value: 0 })
    expect(result('fibonacci-tabulation', { n: 0 })).toEqual({ value: 0 })
    expect(result('longest-common-subsequence', { left: '', right: 'abc' })).toEqual({ length: 0, sequence: '' })
    expect(result('edit-distance', { left: '', right: 'abc' })).toEqual({ distance: 3, operations: ['insert a', 'insert b', 'insert c'] })
    expect(result('coin-change', { values: [2, 4], amount: 3 })).toEqual({ minimum: null, coins: [], reachable: false })
    expect(result('zero-one-knapsack', { weights: [2, 3], profits: [4, 5], capacity: 0 })).toEqual({ profit: 0, items: [], weight: 0 })
  })
  it('reconstructs correct default solutions', () => {
    expect(result('coin-change')).toMatchObject({ minimum: 2, coins: [3, 3] })
    expect(result('zero-one-knapsack')).toEqual({ profit: 7, items: [0, 1], weight: 5 })
    expect(result('longest-common-subsequence')).toMatchObject({ length: 4 })
    expect(result('edit-distance')).toMatchObject({ distance: 3 })
    expect(result('matrix-chain-multiplication')).toEqual({ cost: 4500, parenthesization: '((A1 × A2) × A3)' })
    expect(result('optimal-bst')).toMatchObject({ cost: 142, tree: { key: 2 } })
    expect(result('held-karp-tsp')).toMatchObject({ cost: 80, exists: true })
  })
  it('computes prefix, difference and rectangle queries against direct arithmetic', () => {
    for (let length = 1; length <= 6; length++) {
      const values = Array.from({ length }, (_, i) => ((i * 7) % 9) - 4)
      for (let l = 0; l < length; l++)
        for (let r = l; r < length; r++) {
          expect(result('prefix-sum', { values, range: [l, r] }).sum).toBe(values.slice(l, r + 1).reduce((a, b) => a + b, 0))
          expect(result('difference-array', { values, range: [l, r], delta: -3 }).values).toEqual(values.map((v, i) => v + (i >= l && i <= r ? -3 : 0)))
        }
    }
    expect(result('prefix-sum-2d').sum).toBe(33)
    expect(() => result('prefix-sum', { values: [1, 2], range: [0, 2] })).toThrow()
    expect(() => result('prefix-sum-2d', { a: [[1, 2], [3]], range: [0, 0, 1, 0] })).toThrow('equal lengths')
  })
  it('rejects cycles and missing tours while accepting negative DAG edges', () => {
    expect(
      result('held-karp-tsp', {
        vertices: 3,
        source: 0,
        directed: true,
        edges: [
          { from: 0, to: 1, weight: 2 },
          { from: 1, to: 2, weight: 3 },
        ],
      }),
    ).toMatchObject({ cost: null, exists: false })
    expect(result('multistage-shortest-path', dpProfiles['multistage-shortest-path'].examples[0].input)).toMatchObject({ distances: [0, 2, -2, 1] })
    expect(() =>
      result('multistage-shortest-path', {
        vertices: 2,
        source: 0,
        directed: true,
        edges: [
          { from: 0, to: 1, weight: 1 },
          { from: 1, to: 0, weight: 1 },
        ],
      }),
    ).toThrow('DAG')
  })
  it('rejects malformed fields and oversized teaching inputs', () => {
    expect(() => parseDPFields({ values: '1,nope', amount: '3' }, { values: [1], amount: 3 })).toThrow('finite')
    expect(() => parseDPFields({ n: '' }, { n: 8 })).toThrow('required')
    expect(() => validateDPStudioInput({ left: 'a'.repeat(13), right: '' })).toThrow('12')
    expect(() => validateDPStudioInput({ vertices: 7 })).toThrow('6 vertices')
  })
})
