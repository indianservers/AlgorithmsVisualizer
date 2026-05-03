import { describe, expect, it } from 'vitest'
import { algorithmModules } from './index'
import { isSortedAscending } from '../utils/input'
import { runDisabledReason } from '../utils/validation'

const baseInput = [42, 18, 67, 9, 31, 73, 54, 26, 88, 12]
const sortedInput = [...baseInput].sort((a, b) => a - b)
const positiveInput = [5, 1, 4, 2, 8, 3, 7, 6]
const exactSortInput = [5, 1, 4, 2, 8]
const exactSortedOutput = [1, 2, 4, 5, 8]

const inputFor = (moduleId: string, requiresSorted: boolean) => {
  if (moduleId === 'counting-sort' || moduleId === 'radix-sort') return positiveInput
  return requiresSorted ? sortedInput : baseInput
}

describe('algorithm runners', () => {
  const liveModules = algorithmModules.filter((module) => module.runner)

  it('has a unit test target for every live runner', () => {
    expect(liveModules.map((module) => module.id).sort()).toMatchInlineSnapshot(`
      [
        "bfs-traversal",
        "binary-insertion-sort",
        "binary-search",
        "bubble-sort",
        "cocktail-shaker-sort",
        "comb-sort",
        "counting-sort",
        "dfs-traversal",
        "first-occurrence",
        "gnome-sort",
        "heap-sort",
        "insertion-sort",
        "last-occurrence",
        "linear-search",
        "lower-bound",
        "merge-sort",
        "peak-element-search",
        "queue",
        "quick-sort",
        "radix-sort",
        "recursive-binary-search",
        "recursive-linear-search",
        "rotated-sorted-array-search",
        "search-insert-position",
        "selection-sort",
        "sentinel-linear-search",
        "shell-sort",
        "stack",
        "tree-inorder-traversal",
        "tree-level-order-traversal",
        "tree-postorder-traversal",
        "tree-preorder-traversal",
        "upper-bound",
      ]
    `)
  })

  it.each(liveModules)('$name returns a completed step timeline', (module) => {
    const requiresSorted = Boolean(module.flags?.includes('Requires sorted input') || module.flags?.includes('Sorted data'))
    const input = inputFor(module.id, requiresSorted)
    const steps = module.runner?.(input, 31) ?? []

    expect(steps.length).toBeGreaterThan(0)
    expect(steps.at(-1)?.type).toBe('complete')
    expect(steps.every((step) => step.id && step.description && Array.isArray(step.dataState))).toBe(true)
  })

  it.each(liveModules)('$name emits explicit step-to-code and pseudocode mapping metadata', (module) => {
    const requiresSorted = Boolean(module.flags?.includes('Requires sorted input') || module.flags?.includes('Sorted data'))
    const input = inputFor(module.id, requiresSorted)
    const steps = module.runner?.(input, 31) ?? []

    expect(steps.every((step) => Number.isInteger(step.pseudocodeLine) && Number.isInteger(step.codeLine))).toBe(true)
  })

  it.each(liveModules.filter((module) => module.category === 'Sorting'))('$name produces sorted output for positive sample input', (module) => {
    const input = inputFor(module.id, false)
    const steps = module.runner?.(input, 31) ?? []
    expect(isSortedAscending(steps.at(-1)?.dataState ?? [])).toBe(true)
  })

  it.each(liveModules.filter((module) => module.category === 'Sorting'))('$name produces the exact sorted output for a fixed sample', (module) => {
    const steps = module.runner?.(exactSortInput, 31) ?? []
    expect(steps.at(-1)?.dataState).toEqual(exactSortedOutput)
  })

  it.each([
    ['linear-search', baseInput, /Found 31 at index 4/],
    ['sentinel-linear-search', baseInput, /Found 31 at index 4/],
    ['recursive-linear-search', baseInput, /found 31 at index 4/i],
    ['binary-search', sortedInput, /Found 31 at sorted index 4/],
    ['recursive-binary-search', sortedInput, /Found 31 at sorted index 4/],
    ['lower-bound', sortedInput, /position is 4/],
    ['upper-bound', sortedInput, /position is 5/],
    ['first-occurrence', sortedInput, /First occurrence of 31 is at sorted index 4/],
    ['last-occurrence', sortedInput, /Last occurrence of 31 is at sorted index 4/],
    ['search-insert-position', sortedInput, /position is 4/],
    ['rotated-sorted-array-search', baseInput, /Found 31 at rotated index 1/],
    ['peak-element-search', baseInput, /Peak element 88 is at index 8/],
  ])('%s returns the exact expected search result', (id, input, expected) => {
    const module = algorithmModules.find((item) => item.id === id)!
    const steps = module.runner?.(input, 31) ?? []
    expect(steps.at(-1)?.description).toMatch(expected)
  })

  it.each([
    ['stack', []],
    ['queue', []],
  ])('%s ends with the exact expected container state', (id, expected) => {
    const module = algorithmModules.find((item) => item.id === id)!
    const steps = module.runner?.([1, 2, 3], 31) ?? []
    expect(steps.at(-1)?.dataState).toEqual(expected)
  })

  it.each([
    ['bfs-traversal', 'A -> C -> B -> F -> E -> D -> G'],
    ['dfs-traversal', 'A -> B -> C -> F -> D -> E -> G'],
    ['tree-preorder-traversal', '8 -> 3 -> 1 -> 6 -> 4 -> 7 -> 10 -> 14 -> 13'],
    ['tree-inorder-traversal', '1 -> 3 -> 4 -> 6 -> 7 -> 8 -> 10 -> 13 -> 14'],
    ['tree-postorder-traversal', '1 -> 4 -> 7 -> 6 -> 3 -> 13 -> 14 -> 10 -> 8'],
    ['tree-level-order-traversal', '8 -> 3 -> 10 -> 1 -> 6 -> 14 -> 4 -> 7 -> 13'],
  ])('%s returns the exact traversal order', (id, expectedOrder) => {
    const module = algorithmModules.find((item) => item.id === id)!
    const steps = module.runner?.(baseInput, 31) ?? []
    expect(steps.at(-1)?.highlights.variables?.order).toBe(expectedOrder)
  })
})

describe('run validation', () => {
  it('blocks empty array input for array visualizations', () => {
    const module = algorithmModules.find((item) => item.id === 'bubble-sort')!
    expect(runDisabledReason(module, [], true)).toBe('Enter at least one numeric value.')
  })

  it.each(algorithmModules.filter((module) => module.visualMode === 'Array'))('blocks empty input for %s', (module) => {
    expect(runDisabledReason(module, [], true)).toBe('Enter at least one numeric value.')
  })

  it('blocks unsorted input for algorithms that require sorted input', () => {
    const module = algorithmModules.find((item) => item.id === 'binary-search')!
    expect(runDisabledReason(module, [3, 1, 2], false)).toBe('Sort the input before running this algorithm.')
  })

  it.each(['counting-sort', 'radix-sort'])('blocks negative numbers for %s', (id) => {
    const module = algorithmModules.find((item) => item.id === id)!
    expect(runDisabledReason(module, [4, -1, 8], true)).toBe('Counting and radix sort need non-negative integers.')
  })
})
