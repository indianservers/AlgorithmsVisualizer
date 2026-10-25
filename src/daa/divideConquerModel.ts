import { classifyMaster, masterTreeLevels, type MasterParameters } from './masterTheoremModel'
export const designCosts = [
  { id: 'constant', label: 'Θ(1)', d: 0, k: 0 },
  { id: 'linear', label: 'Θ(n)', d: 1, k: 0 },
  { id: 'nlog', label: 'Θ(n log n)', d: 1, k: 1 },
  { id: 'square', label: 'Θ(n²)', d: 2, k: 0 },
] as const
export type DesignCost = (typeof designCosts)[number]['id']
export function designRecurrence(a: number, b: number, cost: DesignCost, depth = 3) {
  const choice = designCosts.find((row) => row.id === cost)
  if (!choice) throw new Error('Choose a supported combine cost.')
  const parameters: MasterParameters = { a, b, d: choice.d, k: choice.k },
    classification = classifyMaster(parameters)
  return {
    parameters,
    classification,
    tree: masterTreeLevels(parameters, depth),
    recurrence: `T(n) = ${a === 1 ? '' : a}T(n/${b}) + ${choice.label}`,
    bound: classification.result!,
  }
}
export const designExamples = [
  {
    id: 'merge',
    name: 'Merge Sort',
    algorithm: 'merge-sort',
    a: 2,
    b: 2,
    cost: 'linear' as DesignCost,
    description: 'Divide array, sort halves, combine with merge.',
    explanation:
      'Sort each half recursively. Merge by repeatedly taking the smaller front value. The merge is linear in the total length; the recurrence is 2T(n/2) + Θ(n). Standard merge sort also uses Θ(n) auxiliary array storage.',
  },
  {
    id: 'binary',
    name: 'Binary Search',
    algorithm: 'binary-search',
    a: 1,
    b: 2,
    cost: 'constant' as DesignCost,
    description: 'Discard one half each time to find a target.',
    explanation:
      'Maintain a sorted candidate interval. Compare with its midpoint and recurse into at most one half. Constant local work and logarithmic depth give Θ(log n) worst-case time. This single-subproblem pattern is also called decrease and conquer.',
  },
  {
    id: 'minmax',
    name: 'Find Min and Max',
    algorithm: 'divide-min-max',
    a: 2,
    b: 2,
    cost: 'constant' as DesignCost,
    description: 'Simultaneously find minimum and maximum.',
    explanation:
      'Each child returns both its minimum and maximum. Combine with one minimum comparison and one maximum comparison. Constant combine work yields Θ(n) time; returning just one child result would be incorrect.',
  },
  {
    id: 'subarray',
    name: 'Maximum Subarray',
    algorithm: 'maximum-subarray',
    a: 2,
    b: 2,
    cost: 'linear' as DesignCost,
    description: 'Divide at mid; consider a crossing subarray.',
    explanation:
      'A maximum subarray lies in the left half, the right half, or crosses the midpoint. Find the best suffix on the left and prefix on the right in linear time, then choose the best of all three candidates. This divide-and-conquer implementation takes Θ(n log n).',
  },
] as const
export function designRecommendation(answers: readonly boolean[]) {
  if (answers.length !== 3) throw new Error('Answer all three design questions.')
  const firstNo = answers.findIndex((answer) => !answer)
  return {
    firstNo,
    kind: firstNo === 0 ? 'different' : firstNo === 1 ? 'overlap' : firstNo === 2 ? 'combine' : 'appropriate',
    message:
      firstNo === 0
        ? 'Look for a decomposition into smaller instances of the same problem.'
        : firstNo === 1
          ? 'Consider Dynamic Programming when repeated overlapping states dominate.'
          : firstNo === 2
            ? 'Redesign the combine step or consider another paradigm.'
            : 'Divide and Conquer is appropriate!',
  }
}
export function parseDesignArray(source: string) {
  if (!source.trim()) return []
  const values = source
    .trim()
    .split(/[\s,]+/)
    .map(Number)
  if (values.length > 12 || values.some((value) => !Number.isInteger(value) || Math.abs(value) > 999))
    throw new Error('Enter up to 12 integers from −999 to 999, separated by commas. Empty input is allowed.')
  return values
}
export type DesignNode = { id: number; start: number; end: number; depth: number; values: number[]; result: number[]; children: number[] }
export type DesignEvent = {
  phase: 'divide' | 'base' | 'combine' | 'complete' | 'done'
  node: number
  stack: number[]
  left: number[]
  right: number[]
  output: number[]
  i: number
  j: number
  comparisons: number
  picked: 'left' | 'right' | null
  message: string
}
export function designMergeTrace(values: number[]) {
  if (values.length > 12 || values.some((value) => !Number.isInteger(value) || Math.abs(value) > 999)) throw new Error('Use at most 12 bounded integers.')
  const nodes: DesignNode[] = [],
    events: DesignEvent[] = []
  let comparisons = 0
  function visit(start: number, end: number, depth: number, ancestors: number[]): number[] {
    const id = nodes.length,
      part = values.slice(start, end),
      node: DesignNode = { id, start, end, depth, values: part, result: [], children: [] }
    nodes.push(node)
    const stack = [...ancestors, id]
    const emit = (
      phase: DesignEvent['phase'],
      left: number[] = [],
      right: number[] = [],
      output: number[] = [],
      i = 0,
      j = 0,
      picked: DesignEvent['picked'] = null,
      message = '',
    ) => events.push({ phase, node: id, stack: [...stack], left: [...left], right: [...right], output: [...output], i, j, comparisons, picked, message })
    if (part.length <= 1) {
      node.result = [...part]
      emit(
        'base',
        [],
        [],
        part,
        0,
        0,
        null,
        part.length ? 'One value is already sorted: return the base solution.' : 'Empty input is already sorted: return the empty base solution.',
      )
      return node.result
    }
    const mid = start + Math.floor(part.length / 2)
    emit('divide', [], [], [], 0, 0, null, `Divide ${part.length} values into sizes ${mid - start} and ${end - mid}; both children are smaller.`)
    const leftId = nodes.length,
      left = visit(start, mid, depth + 1, stack),
      rightId = nodes.length,
      right = visit(mid, end, depth + 1, stack)
    node.children = [leftId, rightId]
    const output: number[] = []
    let i = 0,
      j = 0
    while (i < left.length || j < right.length) {
      const comparing = i < left.length && j < right.length
      if (comparing) comparisons++
      const takeLeft = j === right.length || (i < left.length && left[i] <= right[j]),
        value = takeLeft ? left[i++] : right[j++]
      output.push(value)
      emit(
        'combine',
        left,
        right,
        output,
        i,
        j,
        takeLeft ? 'left' : 'right',
        comparing
          ? `Compare the front values; take ${value} from the ${takeLeft ? 'left' : 'right'} solution. Equal values are taken from the left first.`
          : `The ${takeLeft ? 'right' : 'left'} solution is exhausted; append ${value} without another key comparison.`,
      )
    }
    node.result = [...output]
    emit('complete', left, right, output, i, j, null, `Combined ${part.length} values into a sorted solution for this subproblem.`)
    return node.result
  }
  const result = visit(0, values.length, 0, [])
  events.push({
    phase: 'done',
    node: 0,
    stack: [],
    left: [],
    right: [],
    output: [...result],
    i: 0,
    j: 0,
    comparisons,
    picked: null,
    message: `Finished: ${comparisons} key comparisons; every subproblem solution has been combined.`,
  })
  return { input: [...values], result, nodes, events, comparisons, peakFrames: Math.max(...events.map((e) => e.stack.length)) }
}
