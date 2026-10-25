import { describe, it, expect } from 'vitest'
import { designMergeTrace, designRecurrence, designRecommendation, parseDesignArray } from './divideConquerModel'
describe('divide and conquer design models', () => {
  it('derives all canonical and edited recurrences with correct growth orders', () => {
    expect(designRecurrence(2, 2, 'linear').bound).toBe('Θ(n log n)')
    expect(designRecurrence(1, 2, 'constant').bound).toBe('Θ(log n)')
    expect(designRecurrence(2, 2, 'constant').bound).toBe('Θ(n)')
    expect(designRecurrence(2, 2, 'nlog').bound).toBe('Θ(n log^2 n)')
    expect(designRecurrence(2, 2, 'square').bound).toBe('Θ(n^2)')
    expect(designRecurrence(7, 2, 'square').bound).toBe('Θ(n^(log_2 7))')
    const model = designRecurrence(2, 2, 'linear', 3)
    expect(model.tree.n).toBe(8)
    expect(model.tree.total).toBe(32)
    expect(() => designRecurrence(2, 1, 'linear')).toThrow()
  })
  it('returns design advice from the earliest failed question rather than treating a heuristic as a proof', () => {
    expect(designRecommendation([true, true, true]).kind).toBe('appropriate')
    expect(designRecommendation([false, true, true]).kind).toBe('different')
    expect(designRecommendation([true, false, false]).kind).toBe('overlap')
    expect(designRecommendation([true, true, false]).kind).toBe('combine')
    expect(() => designRecommendation([])).toThrow()
  })
  it('sorts real values with correct recursive partitions and exact comparison accounting', () => {
    const input = [8, 3, 7, 4, 9, 2, 6, 1],
      trace = designMergeTrace(input)
    expect(trace.result).toEqual([1, 2, 3, 4, 6, 7, 8, 9])
    expect(input).toEqual([8, 3, 7, 4, 9, 2, 6, 1])
    expect(trace.comparisons).toBe(17)
    expect(designMergeTrace([1, 2, 3, 4, 5, 6, 7, 8]).comparisons).toBe(12)
    expect(designMergeTrace([8, 7, 6, 5, 4, 3, 2, 1]).comparisons).toBe(12)
    expect(trace.peakFrames).toBe(4)
    expect(trace.nodes).toHaveLength(15)
    expect(trace.events.at(-1)).toMatchObject({ phase: 'done', stack: [], output: trace.result, comparisons: 17 })
    for (const node of trace.nodes)
      for (const child of node.children) {
        expect(trace.nodes[child].end - trace.nodes[child].start).toBeLessThan(node.end - node.start)
        expect(trace.nodes[child].depth).toBe(node.depth + 1)
      }
    for (let i = 1; i < trace.events.length; i++) expect([0, 1]).toContain(trace.events[i].comparisons - trace.events[i - 1].comparisons)
  })
  it('handles odd, empty, duplicate and reverse inputs against an independent sort oracle', () => {
    let seed = 42
    for (let size = 0; size <= 12; size++)
      for (let trial = 0; trial < 8; trial++) {
        const input = Array.from({ length: size }, () => {
            seed = (seed * 1664525 + 1013904223) >>> 0
            return (seed % 17) - 8
          }),
          trace = designMergeTrace(input)
        expect(trace.result).toEqual([...input].sort((a, b) => a - b))
        for (const event of trace.events) {
          if (event.phase === 'combine') {
            expect(event.output).toEqual([...event.output].sort((a, b) => a - b))
            expect(event.output.length).toBe(event.i + event.j)
          }
        }
      }
    expect(designMergeTrace([])).toMatchObject({ result: [], comparisons: 0, peakFrames: 1 })
    expect(designMergeTrace([2, 2]).events.find((e) => e.phase === 'combine')!.picked).toBe('left')
  })
  it('validates editable inputs without rejecting empty base cases or duplicates', () => {
    expect(parseDesignArray('')).toEqual([])
    expect(parseDesignArray('2, -3, 2')).toEqual([2, -3, 2])
    expect(() => parseDesignArray('1, nope')).toThrow()
    expect(() => parseDesignArray('1000')).toThrow()
    expect(() => designMergeTrace(Array(13).fill(1))).toThrow()
  })
})
