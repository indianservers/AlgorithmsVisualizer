import * as kernels from './kernels'
import { Trace } from './trace'
import type { StudioStep } from './trace'

export const studioKernels = {
  'bubble-sort': kernels.bubble,
  'selection-sort': kernels.selection,
  'insertion-sort': kernels.insertion,
  'binary-insertion-sort': kernels.binaryInsertion,
  'merge-sort': kernels.merge,
  'quick-sort': kernels.quick,
  'heap-sort': kernels.heap,
  'counting-sort': kernels.counting,
  'radix-sort': kernels.radix,
  'shell-sort': kernels.shell,
  'cocktail-shaker-sort': kernels.cocktail,
  'comb-sort': kernels.comb,
  'gnome-sort': kernels.gnome,
  'divide-and-conquer-suite': kernels.merge,
  'advanced-sorting-suite': kernels.quick,
  'advanced-searching-suite': kernels.binary,
  'sliding-window-two-pointers-suite': kernels.twoPointers,
  'linear-search': kernels.linear,
  'sentinel-linear-search': kernels.sentinel,
  'recursive-linear-search': kernels.recursiveLinear,
  'binary-search': kernels.binary,
  'recursive-binary-search': kernels.recursiveBinary,
  'lower-bound': kernels.lower,
  'upper-bound': kernels.upper,
  'first-occurrence': kernels.first,
  'last-occurrence': kernels.last,
  'search-insert-position': kernels.lower,
  'rotated-sorted-array-search': kernels.rotated,
  'peak-element-search': kernels.peak,
}
export type StudioId = keyof typeof studioKernels
export const isStudioId = (id: string): id is StudioId => id in studioKernels
export const suiteExamples: Record<string, StudioId> = {
  'divide-and-conquer-suite': 'merge-sort',
  'advanced-sorting-suite': 'quick-sort',
  'advanced-searching-suite': 'binary-search',
  'sliding-window-two-pointers-suite': 'sliding-window-two-pointers-suite',
}
export const needsOrderedInput = (id: string) =>
  ['binary-search', 'recursive-binary-search', 'lower-bound', 'upper-bound', 'first-occurrence', 'last-occurrence', 'search-insert-position'].includes(id)

export function studioInputError(id: string, input: number[]) {
  id = suiteExamples[id] ?? id
  if (input.length > 64) return 'Use at most 64 values for a readable execution trace.'
  if (input.some((v) => !Number.isFinite(v))) return 'Every value must be a finite number.'
  if ((needsOrderedInput(id) || id === 'sliding-window-two-pointers-suite') && input.some((v, i) => i > 0 && input[i - 1] > v))
    return 'This algorithm needs ascending input. Choose Sort input to continue.'
  if (id === 'counting-sort' && input.some((v) => !Number.isSafeInteger(v))) return 'Counting sort needs integer keys. Negative integers are supported.'
  if (id === 'counting-sort' && Math.max(...input, 0) - Math.min(...input, 0) > 10000) return 'Counting sort supports a key range of at most 10,000.'
  if (id === 'radix-sort' && input.some((v) => !Number.isSafeInteger(v) || v < 0 || v > 1000000000))
    return 'Radix sort needs non-negative integers no larger than 1,000,000,000. Choose another sort for negative or decimal values.'
  if (id === 'rotated-sorted-array-search' && input.length > 1) {
    const drops = input.filter((v, i) => v > input[(i + 1) % input.length]).length
    if (drops > 1) return 'Use an ascending array rotated at one position (duplicates are allowed).'
  }
  return ''
}

export function runStudio(id: StudioId, input: number[], target: number): StudioStep[] {
  const error = studioInputError(id, input)
  if (error) throw new Error(error)
  if (!Number.isFinite(target)) throw new Error('Enter a finite target value.')
  const a = [...input],
    trace = new Trace(a, id)
  const result = studioKernels[id](a, target, trace)
  const sorting = (suiteExamples[id] ?? id).endsWith('-sort')
  if (sorting) a.forEach((_, i) => trace.sorted.add(i))
  const pair = id === 'sliding-window-two-pointers-suite' && Array.isArray(result) ? result : undefined
  trace.emit(
    pair?.length
      ? 'found'
      : ['linear-search', 'binary-search', 'rotated-sorted-array-search'].includes(suiteExamples[id] ?? id) && result !== -1
        ? 'found'
        : 'return',
    { result },
    pair ?? (typeof result === 'number' && result >= 0 && result < a.length ? [result] : []),
    pair
      ? pair.length
        ? `Found a pair at indices ${pair.join(' and ')} with sum ${target}.`
        : `No two distinct positions sum to ${target}.`
      : sorting
        ? 'Complete. Every value is in nondecreasing order.'
        : id === 'peak-element-search'
          ? result === -1
            ? 'Empty array: there is no peak.'
            : `A local peak is ${a[Number(result)]} at index ${result}.`
          : id.includes('bound') || id === 'search-insert-position'
            ? `The insertion boundary is ${result}${result === a.length ? ' (after the last value)' : ''}.`
            : result === -1
              ? `${target} was not found.`
              : `Found ${target} at index ${result}.`,
    'complete',
  )
  return trace.steps
}
