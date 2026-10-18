import { describe, expect, it } from 'vitest'
import { daaLessons, lessonById } from '../daa/catalog'
import { executeLesson, type DaaInput } from '../daa/types'
import { greedyFieldsFor, greedyProfiles, matchesGreedyAnswer, nextGreedyPrediction, parseGreedyFields } from './greedyModel'

const run = (id: string, input: DaaInput) => executeLesson(lessonById.get(id)!, input)
describe('greedy learning traces', () => {
  for (const lesson of daaLessons.filter((l) => l.category === 'Greedy'))
    it(`${lesson.id}: presets and decisions replay truthfully`, () => {
      for (const input of [lesson.defaultInput!, ...greedyProfiles[lesson.id].examples.map((e) => e.input)]) {
        expect(parseGreedyFields(greedyFieldsFor(input), input)).toEqual(input)
        const trace = executeLesson(lesson, input)
        expect(trace.status).toBe('complete')
        expect(trace.steps[0].state?.greedy?.phase).toBe('ready')
        for (const step of trace.steps) {
          const s = step.state!.greedy!
          expect(s.reason.length).toBeGreaterThan(0)
          expect(s.selected.some((id) => s.rejected.includes(id))).toBe(false)
          expect(s.objective).toBeGreaterThanOrEqual(0)
          if (s.fractions) expect(s.fractions.every((f) => f >= 0 && f <= 1)).toBe(true)
          if (s.slots)
            s.slots.forEach((id, i) => {
              if (id >= 0) expect(i + 1).toBeLessThanOrEqual(input.deadlines![id])
            })
        }
        const first = nextGreedyPrediction(trace.steps, 0)
        if (first) {
          expect(matchesGreedyAnswer(first.answer, first.answer)).toBe(true)
          expect(trace.steps[first.index].state?.greedy?.prediction?.answer).toBe(first.answer)
        }
        expect(trace.steps[0].state?.greedy?.selected).toEqual([])
      }
    })
  it('shows rejected jobs, including deadline zero', () => {
    const trace = run('job-sequencing', { profits: [5, 10, 20], deadlines: [0, 1, 1] })
    expect(trace.result).toEqual({ slots: [2], profit: 20 })
    expect(trace.steps.filter((s) => s.state?.greedy?.phase === 'reject' && s.type !== 'complete')).toHaveLength(2)
  })
  it('fractional example ends with 2/3 of the final item', () => {
    const trace = run('fractional-knapsack', { weights: [10, 20, 30], profits: [60, 100, 120], capacity: 50 })
    expect(trace.result).toEqual({ profit: 240, fractions: [1, 1, 2 / 3], weight: 50 })
    expect(trace.steps.at(-1)?.state?.greedy?.objective).toBe(240)
  })
  it('Huffman codes are prefix-free and cost matches the merge trace', () => {
    for (const frequencies of [[5, 9, 12, 13, 16, 45], [1], [4, 4, 4, 4], [1, 1, 2, 3, 20]]) {
      const trace = run('huffman-coding', { frequencies }),
        result = trace.result as { codes: Record<number, string>; weightedLength: number }
      const codes = Object.values(result.codes)
      for (let i = 0; i < codes.length; i++) for (let j = 0; j < codes.length; j++) if (i !== j) expect(codes[j].startsWith(codes[i])).toBe(false)
      expect(trace.steps.at(-1)?.state?.greedy?.objective).toBe(result.weightedLength)
      expect(trace.steps.at(-1)?.state?.greedy?.forest).toHaveLength(1)
      expect(trace.steps[0].state?.greedy?.forest).toHaveLength(frequencies.length)
    }
  })
  it('checks prediction text and numbers without accepting empty or non-finite answers', () => {
    expect(matchesGreedyAnswer(' ACCEPT ', 'accept')).toBe(true)
    expect(matchesGreedyAnswer('0.666667', String(2 / 3))).toBe(true)
    for (const value of ['', ' ', 'NaN', 'Infinity', 'reject']) expect(matchesGreedyAnswer(value, '0')).toBe(false)
    expect(() => parseGreedyFields({ profits: 'abc', deadlines: '1' }, { profits: [1], deadlines: [1] })).toThrow('finite')
    expect(() => parseGreedyFields({ capacity: '' }, { capacity: 5 })).toThrow('required')
  })
  it('rejects infeasible input instead of replacing the trace with nonsense', () => {
    expect(() => run('activity-selection', { intervals: [[2, 2]] })).toThrow('positive duration')
    expect(() => run('fractional-knapsack', { weights: [0], profits: [10], capacity: 2 })).toThrow('positive integers')
    expect(() => run('job-sequencing', { profits: [10, 20], deadlines: [1] })).toThrow('deadline')
    expect(() => run('huffman-coding', { frequencies: [0, 1] })).toThrow('positive')
  })
  it('matches exhaustive activity and job optima on small deterministic cases', () => {
    let seed = 42
    const random = (max: number) => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed % max
    }
    for (let sample = 0; sample < 40; sample++) {
      const intervals = Array.from({ length: 6 }, () => {
        const start = random(8)
        return [start, start + 1 + random(4)]
      })
      const profits = Array.from({ length: 6 }, () => random(50)),
        deadlines = Array.from({ length: 6 }, () => random(5))
      let bestCount = 0,
        bestProfit = 0
      for (let mask = 0; mask < 64; mask++) {
        const ids = Array.from({ length: 6 }, (_, i) => i).filter((i) => mask & (1 << i)),
          sorted = ids.map((i) => intervals[i]).sort((a, b) => a[1] - b[1])
        if (sorted.every((r, i) => !i || r[0] >= sorted[i - 1][1])) bestCount = Math.max(bestCount, ids.length)
        const due = ids.map((i) => deadlines[i]).sort((a, b) => a - b)
        if (due.every((d, i) => d >= i + 1))
          bestProfit = Math.max(
            bestProfit,
            ids.reduce((sum, i) => sum + profits[i], 0),
          )
      }
      expect(run('activity-selection', { intervals }).result).toMatchObject({ count: bestCount })
      expect(run('job-sequencing', { profits, deadlines }).result).toMatchObject({ profit: bestProfit })
    }
  })
})
