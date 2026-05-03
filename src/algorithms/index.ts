import type { AlgorithmCategory, AlgorithmModule, AlgorithmStep, StepType } from '../types'

export const baseMetrics = {
  comparisons: 0,
  swaps: 0,
  reads: 0,
  writes: 0,
  recursiveCalls: 0,
  memory: 0,
}

function reasonForStep(type: StepType) {
  if (type === 'compare') return 'Compare values or pointers to decide the next branch.'
  if (type === 'swap') return 'Move values because their current order violates the algorithm invariant.'
  if (type === 'select') return 'Choose the active value, pivot, node, or candidate for this phase.'
  if (type === 'partition') return 'Split the range around a pivot so each recursive side is smaller.'
  if (type === 'merge') return 'Combine partially ordered regions into a larger ordered result.'
  if (type === 'update') return 'Write the new state after the current decision.'
  if (type === 'visit') return 'Mark this node as reached in the traversal order.'
  return 'The algorithm has reached a terminal state for this input.'
}

function lineMapForStep(type: StepType) {
  const defaults: Record<StepType, { codeLine: number; pseudocodeLine: number }> = {
    compare: { pseudocodeLine: 2, codeLine: 2 },
    swap: { pseudocodeLine: 4, codeLine: 4 },
    select: { pseudocodeLine: 1, codeLine: 1 },
    visit: { pseudocodeLine: 2, codeLine: 2 },
    partition: { pseudocodeLine: 1, codeLine: 1 },
    merge: { pseudocodeLine: 3, codeLine: 3 },
    update: { pseudocodeLine: 4, codeLine: 4 },
    hash: { pseudocodeLine: 2, codeLine: 2 },
    complete: { pseudocodeLine: 99, codeLine: 99 },
  }
  return defaults[type]
}

function assertionForStep(type: StepType, dataState: number[]) {
  if (type === 'complete' && dataState.length > 1) {
    const sorted = dataState.every((value, index) => index === 0 || dataState[index - 1] <= value)
    return sorted ? 'Final array is nondecreasing.' : 'Final state preserves the visualized data shape.'
  }
  if (type === 'complete') return 'Run completed.'
  return undefined
}

function makeStep(
  steps: AlgorithmStep[],
  type: StepType,
  description: string,
  dataState: number[],
  indices: number[] = [],
  variables: Record<string, unknown> = {},
  metrics: AlgorithmStep['metrics'] = baseMetrics,
) {
  const beforeState = steps.at(-1)?.dataState ?? dataState
  const nextIndex = steps.length + 1
  const nextMetrics = { ...metrics, memory: metrics.memory ?? dataState.length }
  const lineMap = lineMapForStep(type)
  steps.push({
    id: `${type}-${nextIndex}`,
    operationId: `${type}-${nextIndex}-${indices.join('-') || 'none'}`,
    type,
    description,
    pseudocodeLine: lineMap.pseudocodeLine,
    codeLine: lineMap.codeLine,
    reason: reasonForStep(type),
    beforeState: [...beforeState],
    dataState: [...dataState],
    afterState: [...dataState],
    assertion: assertionForStep(type, dataState),
    highlights: { indices, variables },
    metrics: nextMetrics,
  })
}

function linearSearch(input: number[], target: number) {
  const steps: AlgorithmStep[] = []
  const metrics = { ...baseMetrics }
  for (let index = 0; index < input.length; index += 1) {
    const value = input[index]
    metrics.reads += 1
    metrics.comparisons += 1
    makeStep(steps, 'compare', `Compare index ${index} with target ${target}.`, input, [index], { index, value, target }, metrics)
    if (value === target) {
      makeStep(steps, 'complete', `Found ${target} at index ${index}.`, input, [index], { index }, metrics)
      return steps
    }
  }
  if (!steps.some((step) => step.type === 'complete')) {
    makeStep(steps, 'complete', `${target} was not found in the array.`, input, [], { target }, metrics)
  }
  return steps
}

function sentinelLinearSearch(input: number[], target: number) {
  const data = [...input, target]
  const steps: AlgorithmStep[] = []
  const metrics = { ...baseMetrics }
  let index = 0
  makeStep(steps, 'select', `Append sentinel ${target} after the last real element.`, data, [data.length - 1], { sentinelIndex: data.length - 1 }, metrics)
  while (data[index] !== target) {
    metrics.comparisons += 1
    metrics.reads += 1
    makeStep(steps, 'compare', `Index ${index} is ${data[index]}, so continue.`, data, [index], { index, target }, metrics)
    index += 1
  }
  metrics.comparisons += 1
  makeStep(
    steps,
    'complete',
    index < input.length ? `Found ${target} at index ${index}.` : `${target} was not found before the sentinel.`,
    data,
    [index],
    { index, sentinel: index === input.length },
    metrics,
  )
  return steps
}

function recursiveLinearSearch(input: number[], target: number) {
  const steps: AlgorithmStep[] = []
  const metrics = { ...baseMetrics }
  const visit = (index: number): boolean => {
    metrics.recursiveCalls += 1
    if (index >= input.length) {
      makeStep(steps, 'complete', `${target} was not found after ${index} recursive calls.`, input, [], { index }, metrics)
      return false
    }
    metrics.comparisons += 1
    metrics.reads += 1
    makeStep(steps, 'compare', `Recursive call checks index ${index}.`, input, [index], { call: index + 1, value: input[index] }, metrics)
    if (input[index] === target) {
      makeStep(steps, 'complete', `Recursive search found ${target} at index ${index}.`, input, [index], { index }, metrics)
      return true
    }
    return visit(index + 1)
  }
  visit(0)
  return steps
}

function binarySearch(input: number[], target: number) {
  const data = [...input]
  const steps: AlgorithmStep[] = []
  const metrics = { ...baseMetrics }
  let low = 0
  let high = data.length - 1
  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    metrics.comparisons += 1
    metrics.reads += 1
    makeStep(steps, 'compare', `Check middle index ${mid}; range is ${low} to ${high}.`, data, [low, mid, high], { low, mid, high, target }, metrics)
    if (data[mid] === target) {
      makeStep(steps, 'complete', `Found ${target} at sorted index ${mid}.`, data, [mid], { mid }, metrics)
      return steps
    }
    if (data[mid] < target) low = mid + 1
    else high = mid - 1
  }
  makeStep(steps, 'complete', `${target} is not present in the sorted array.`, data, [], { insertionPoint: low }, metrics)
  return steps
}

function recursiveBinarySearch(input: number[], target: number) {
  const data = [...input]
  const steps: AlgorithmStep[] = []
  const metrics = { ...baseMetrics }
  const search = (low: number, high: number): boolean => {
    metrics.recursiveCalls += 1
    if (low > high) {
      makeStep(steps, 'complete', `${target} is not present; recursion crossed at ${low}.`, data, [], { low, high }, metrics)
      return false
    }
    const mid = Math.floor((low + high) / 2)
    metrics.comparisons += 1
    metrics.reads += 1
    makeStep(steps, 'compare', `Recursive binary search checks middle index ${mid}.`, data, [low, mid, high], { low, mid, high }, metrics)
    if (data[mid] === target) {
      makeStep(steps, 'complete', `Found ${target} at sorted index ${mid}.`, data, [mid], { mid }, metrics)
      return true
    }
    return data[mid] < target ? search(mid + 1, high) : search(low, mid - 1)
  }
  search(0, data.length - 1)
  return steps
}

function boundSearch(input: number[], target: number, upper = false) {
  const data = [...input]
  const steps: AlgorithmStep[] = []
  const metrics = { ...baseMetrics }
  let low = 0
  let high = data.length
  while (low < high) {
    const mid = Math.floor((low + high) / 2)
    metrics.comparisons += 1
    metrics.reads += 1
    const movesRight = upper ? data[mid] <= target : data[mid] < target
    makeStep(
      steps,
      'compare',
      `${upper ? 'Upper' : 'Lower'} bound checks index ${mid}.`,
      data,
      [low, mid, Math.min(high, data.length - 1)],
      { low, mid, high, value: data[mid] },
      metrics,
    )
    if (movesRight) low = mid + 1
    else high = mid
  }
  makeStep(steps, 'complete', `${upper ? 'Upper' : 'Lower'} bound position is ${low}.`, data, [Math.min(low, data.length - 1)], { position: low }, metrics)
  return steps
}

function occurrenceSearch(input: number[], target: number, last = false) {
  const steps = boundSearch(input, target, last)
  const data = steps.at(-1)?.dataState ?? [...input]
  const position = Number(steps.at(-1)?.highlights.variables?.position ?? 0)
  const index = last ? position - 1 : position
  const metrics = steps.at(-1)?.metrics ?? baseMetrics
  makeStep(
    steps,
    'complete',
    data[index] === target
      ? `${last ? 'Last' : 'First'} occurrence of ${target} is at sorted index ${index}.`
      : `${target} does not occur in the sorted array.`,
    data,
    data[index] === target ? [index] : [],
    { occurrenceIndex: data[index] === target ? index : -1 },
    metrics,
  )
  return steps
}

function rotatedSortedSearch(input: number[], target: number) {
  const sorted = [...input].sort((a, b) => a - b)
  const pivot = Math.max(1, Math.floor(sorted.length / 3))
  const data = [...sorted.slice(pivot), ...sorted.slice(0, pivot)]
  const steps: AlgorithmStep[] = []
  const metrics = { ...baseMetrics }
  let low = 0
  let high = data.length - 1
  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    metrics.comparisons += 1
    metrics.reads += 3
    makeStep(steps, 'compare', `Check rotated range ${low}-${high}; mid is ${mid}.`, data, [low, mid, high], { low, mid, high }, metrics)
    if (data[mid] === target) {
      makeStep(steps, 'complete', `Found ${target} at rotated index ${mid}.`, data, [mid], { mid }, metrics)
      return steps
    }
    if (data[low] <= data[mid]) {
      if (data[low] <= target && target < data[mid]) high = mid - 1
      else low = mid + 1
    } else if (data[mid] < target && target <= data[high]) low = mid + 1
    else high = mid - 1
  }
  makeStep(steps, 'complete', `${target} is absent from the rotated sorted array.`, data, [], {}, metrics)
  return steps
}

function peakElementSearch(input: number[]) {
  const data = [...input]
  const steps: AlgorithmStep[] = []
  const metrics = { ...baseMetrics }
  let low = 0
  let high = data.length - 1
  while (low < high) {
    const mid = Math.floor((low + high) / 2)
    metrics.comparisons += 1
    makeStep(steps, 'compare', `Compare index ${mid} with its right neighbor.`, data, [mid, mid + 1], { low, mid, high }, metrics)
    if (data[mid] < data[mid + 1]) low = mid + 1
    else high = mid
  }
  makeStep(steps, 'complete', `Peak element ${data[low]} is at index ${low}.`, data, [low], { peakIndex: low }, metrics)
  return steps
}

function bubbleSort(input: number[]) {
  const data = [...input]
  const steps: AlgorithmStep[] = []
  const metrics = { ...baseMetrics }
  for (let pass = 0; pass < data.length - 1; pass += 1) {
    for (let i = 0; i < data.length - pass - 1; i += 1) {
      metrics.comparisons += 1
      metrics.reads += 2
      makeStep(steps, 'compare', `Compare ${data[i]} and ${data[i + 1]}.`, data, [i, i + 1], { pass }, metrics)
      if (data[i] > data[i + 1]) {
        ;[data[i], data[i + 1]] = [data[i + 1], data[i]]
        metrics.swaps += 1
        metrics.writes += 2
        makeStep(steps, 'swap', `Swap positions ${i} and ${i + 1}.`, data, [i, i + 1], { pass }, metrics)
      }
    }
  }
  makeStep(
    steps,
    'complete',
    'Array is sorted.',
    data,
    data.map((_, index) => index),
    {},
    metrics,
  )
  return steps
}

function selectionSort(input: number[]) {
  const data = [...input]
  const steps: AlgorithmStep[] = []
  const metrics = { ...baseMetrics }
  for (let i = 0; i < data.length - 1; i += 1) {
    let min = i
    makeStep(steps, 'select', `Select index ${i} as the current minimum.`, data, [i], { min }, metrics)
    for (let j = i + 1; j < data.length; j += 1) {
      metrics.comparisons += 1
      metrics.reads += 2
      makeStep(steps, 'compare', `Compare candidate ${data[j]} with minimum ${data[min]}.`, data, [min, j], { min, j }, metrics)
      if (data[j] < data[min]) min = j
    }
    if (min !== i) {
      ;[data[i], data[min]] = [data[min], data[i]]
      metrics.swaps += 1
      metrics.writes += 2
      makeStep(steps, 'swap', `Place the minimum at index ${i}.`, data, [i, min], { min }, metrics)
    }
  }
  makeStep(
    steps,
    'complete',
    'Selection sort complete.',
    data,
    data.map((_, index) => index),
    {},
    metrics,
  )
  return steps
}

function insertionSort(input: number[]) {
  const data = [...input]
  const steps: AlgorithmStep[] = []
  const metrics = { ...baseMetrics }
  for (let i = 1; i < data.length; i += 1) {
    const key = data[i]
    let j = i - 1
    metrics.reads += 1
    makeStep(steps, 'select', `Take ${key} from index ${i}.`, data, [i], { key }, metrics)
    while (j >= 0 && data[j] > key) {
      metrics.comparisons += 1
      metrics.reads += 1
      data[j + 1] = data[j]
      metrics.writes += 1
      makeStep(steps, 'update', `Shift ${data[j]} one position to the right.`, data, [j, j + 1], { key }, metrics)
      j -= 1
    }
    data[j + 1] = key
    metrics.writes += 1
    makeStep(steps, 'update', `Insert ${key} at index ${j + 1}.`, data, [j + 1], { key }, metrics)
  }
  makeStep(
    steps,
    'complete',
    'Insertion sort complete.',
    data,
    data.map((_, index) => index),
    {},
    metrics,
  )
  return steps
}

function binaryInsertionSort(input: number[]) {
  const data = [...input]
  const steps: AlgorithmStep[] = []
  const metrics = { ...baseMetrics }
  for (let i = 1; i < data.length; i += 1) {
    const key = data[i]
    let low = 0
    let high = i
    makeStep(steps, 'select', `Use binary search to place ${key} within the sorted prefix.`, data, [i], { key }, metrics)
    while (low < high) {
      const mid = Math.floor((low + high) / 2)
      metrics.comparisons += 1
      makeStep(steps, 'compare', `Insertion point check at prefix index ${mid}.`, data, [mid, i], { low, mid, high, key }, metrics)
      if (data[mid] <= key) low = mid + 1
      else high = mid
    }
    for (let j = i; j > low; j -= 1) {
      data[j] = data[j - 1]
      metrics.writes += 1
      makeStep(steps, 'update', `Shift index ${j - 1} right to open position ${low}.`, data, [j - 1, j], { insertionPoint: low }, metrics)
    }
    data[low] = key
    metrics.writes += 1
    makeStep(steps, 'update', `Insert ${key} at index ${low}.`, data, [low], { key }, metrics)
  }
  makeStep(
    steps,
    'complete',
    'Binary insertion sort complete.',
    data,
    data.map((_, index) => index),
    {},
    metrics,
  )
  return steps
}

function shellSort(input: number[]) {
  const data = [...input]
  const steps: AlgorithmStep[] = []
  const metrics = { ...baseMetrics }
  for (let gap = Math.floor(data.length / 2); gap > 0; gap = Math.floor(gap / 2)) {
    for (let i = gap; i < data.length; i += 1) {
      const temp = data[i]
      let j = i
      makeStep(steps, 'select', `Gap ${gap}: insert ${temp} into its gapped subsequence.`, data, [i], { gap }, metrics)
      while (j >= gap && data[j - gap] > temp) {
        metrics.comparisons += 1
        data[j] = data[j - gap]
        metrics.writes += 1
        makeStep(steps, 'update', `Move ${data[j]} from ${j - gap} to ${j}.`, data, [j - gap, j], { gap }, metrics)
        j -= gap
      }
      data[j] = temp
      metrics.writes += 1
      makeStep(steps, 'update', `Place ${temp} at index ${j}.`, data, [j], { gap }, metrics)
    }
  }
  makeStep(
    steps,
    'complete',
    'Shell sort complete.',
    data,
    data.map((_, index) => index),
    {},
    metrics,
  )
  return steps
}

function cocktailShakerSort(input: number[]) {
  const data = [...input]
  const steps: AlgorithmStep[] = []
  const metrics = { ...baseMetrics }
  let start = 0
  let end = data.length - 1
  let swapped = true
  while (swapped) {
    swapped = false
    for (let i = start; i < end; i += 1) {
      metrics.comparisons += 1
      makeStep(steps, 'compare', `Forward pass compares ${i} and ${i + 1}.`, data, [i, i + 1], { start, end }, metrics)
      if (data[i] > data[i + 1]) {
        ;[data[i], data[i + 1]] = [data[i + 1], data[i]]
        metrics.swaps += 1
        swapped = true
        makeStep(steps, 'swap', `Forward swap at ${i}.`, data, [i, i + 1], { start, end }, metrics)
      }
    }
    if (!swapped) break
    swapped = false
    end -= 1
    for (let i = end - 1; i >= start; i -= 1) {
      metrics.comparisons += 1
      makeStep(steps, 'compare', `Backward pass compares ${i} and ${i + 1}.`, data, [i, i + 1], { start, end }, metrics)
      if (data[i] > data[i + 1]) {
        ;[data[i], data[i + 1]] = [data[i + 1], data[i]]
        metrics.swaps += 1
        swapped = true
        makeStep(steps, 'swap', `Backward swap at ${i}.`, data, [i, i + 1], { start, end }, metrics)
      }
    }
    start += 1
  }
  makeStep(
    steps,
    'complete',
    'Cocktail shaker sort complete.',
    data,
    data.map((_, index) => index),
    {},
    metrics,
  )
  return steps
}

function combSort(input: number[]) {
  const data = [...input]
  const steps: AlgorithmStep[] = []
  const metrics = { ...baseMetrics }
  let gap = data.length
  let swapped = true
  while (gap !== 1 || swapped) {
    gap = Math.max(1, Math.floor(gap / 1.3))
    swapped = false
    for (let i = 0; i + gap < data.length; i += 1) {
      metrics.comparisons += 1
      makeStep(steps, 'compare', `Compare gap pair ${i} and ${i + gap}.`, data, [i, i + gap], { gap }, metrics)
      if (data[i] > data[i + gap]) {
        ;[data[i], data[i + gap]] = [data[i + gap], data[i]]
        metrics.swaps += 1
        swapped = true
        makeStep(steps, 'swap', `Swap gap pair ${i} and ${i + gap}.`, data, [i, i + gap], { gap }, metrics)
      }
    }
  }
  makeStep(
    steps,
    'complete',
    'Comb sort complete.',
    data,
    data.map((_, index) => index),
    {},
    metrics,
  )
  return steps
}

function gnomeSort(input: number[]) {
  const data = [...input]
  const steps: AlgorithmStep[] = []
  const metrics = { ...baseMetrics }
  let index = 0
  while (index < data.length) {
    if (index === 0) {
      index += 1
      continue
    }
    metrics.comparisons += 1
    makeStep(steps, 'compare', `Gnome compares ${index - 1} and ${index}.`, data, [index - 1, index], { index }, metrics)
    if (data[index] >= data[index - 1]) index += 1
    else {
      ;[data[index], data[index - 1]] = [data[index - 1], data[index]]
      metrics.swaps += 1
      makeStep(steps, 'swap', `Swap and step back to index ${index - 1}.`, data, [index - 1, index], { index }, metrics)
      index -= 1
    }
  }
  makeStep(
    steps,
    'complete',
    'Gnome sort complete.',
    data,
    data.map((_, index) => index),
    {},
    metrics,
  )
  return steps
}

function quickSort(input: number[]) {
  const data = [...input]
  const steps: AlgorithmStep[] = []
  const metrics = { ...baseMetrics }
  const partition = (low: number, high: number) => {
    const pivot = data[high]
    let i = low
    makeStep(steps, 'partition', `Partition range ${low}-${high} around pivot ${pivot}.`, data, [high], { low, high, pivot }, metrics)
    for (let j = low; j < high; j += 1) {
      metrics.comparisons += 1
      makeStep(steps, 'compare', `Compare ${data[j]} with pivot ${pivot}.`, data, [j, high], { pivot }, metrics)
      if (data[j] <= pivot) {
        ;[data[i], data[j]] = [data[j], data[i]]
        metrics.swaps += 1
        metrics.writes += 2
        makeStep(steps, 'swap', `Move ${data[i]} into the lower partition.`, data, [i, j], { pivot }, metrics)
        i += 1
      }
    }
    ;[data[i], data[high]] = [data[high], data[i]]
    metrics.swaps += 1
    metrics.writes += 2
    makeStep(steps, 'swap', `Place pivot ${pivot} at index ${i}.`, data, [i, high], { pivotIndex: i }, metrics)
    return i
  }
  const sort = (low: number, high: number) => {
    if (low >= high) return
    metrics.recursiveCalls += 1
    const pivot = partition(low, high)
    sort(low, pivot - 1)
    sort(pivot + 1, high)
  }
  sort(0, data.length - 1)
  makeStep(
    steps,
    'complete',
    'Quick sort complete.',
    data,
    data.map((_, index) => index),
    {},
    metrics,
  )
  return steps
}

function mergeSort(input: number[]) {
  const data = [...input]
  const steps: AlgorithmStep[] = []
  const metrics = { ...baseMetrics }
  const merge = (left: number, mid: number, right: number) => {
    const copy = data.slice(left, right + 1)
    let i = 0
    let j = mid - left + 1
    let k = left
    while (i <= mid - left && j <= right - left) {
      metrics.comparisons += 1
      makeStep(steps, 'compare', `Compare ${copy[i]} and ${copy[j]} before merging.`, data, [left + i, left + j], { left, mid, right }, metrics)
      data[k] = copy[i] <= copy[j] ? copy[i++] : copy[j++]
      metrics.writes += 1
      makeStep(steps, 'merge', `Write ${data[k]} into index ${k}.`, data, [k], { left, mid, right }, metrics)
      k += 1
    }
    while (i <= mid - left) {
      data[k] = copy[i++]
      metrics.writes += 1
      makeStep(steps, 'merge', `Copy remaining left value into index ${k}.`, data, [k], { left, right }, metrics)
      k += 1
    }
    while (j <= right - left) {
      data[k] = copy[j++]
      metrics.writes += 1
      makeStep(steps, 'merge', `Copy remaining right value into index ${k}.`, data, [k], { left, right }, metrics)
      k += 1
    }
  }
  const sort = (left: number, right: number) => {
    if (left >= right) return
    metrics.recursiveCalls += 1
    const mid = Math.floor((left + right) / 2)
    sort(left, mid)
    sort(mid + 1, right)
    merge(left, mid, right)
  }
  sort(0, data.length - 1)
  makeStep(
    steps,
    'complete',
    'Merge sort complete.',
    data,
    data.map((_, index) => index),
    {},
    metrics,
  )
  return steps
}

function heapSort(input: number[]) {
  const data = [...input]
  const steps: AlgorithmStep[] = []
  const metrics = { ...baseMetrics }
  const heapify = (size: number, root: number) => {
    let largest = root
    const left = root * 2 + 1
    const right = root * 2 + 2
    if (left < size) {
      metrics.comparisons += 1
      makeStep(steps, 'compare', `Compare left child ${left} with root ${largest}.`, data, [left, largest], { size }, metrics)
      if (data[left] > data[largest]) largest = left
    }
    if (right < size) {
      metrics.comparisons += 1
      makeStep(steps, 'compare', `Compare right child ${right} with largest ${largest}.`, data, [right, largest], { size }, metrics)
      if (data[right] > data[largest]) largest = right
    }
    if (largest !== root) {
      ;[data[root], data[largest]] = [data[largest], data[root]]
      metrics.swaps += 1
      metrics.writes += 2
      makeStep(steps, 'swap', `Heapify swaps root ${root} with ${largest}.`, data, [root, largest], { size }, metrics)
      heapify(size, largest)
    }
  }
  for (let i = Math.floor(data.length / 2) - 1; i >= 0; i -= 1) heapify(data.length, i)
  for (let end = data.length - 1; end > 0; end -= 1) {
    ;[data[0], data[end]] = [data[end], data[0]]
    metrics.swaps += 1
    metrics.writes += 2
    makeStep(steps, 'swap', `Move max value to sorted suffix at ${end}.`, data, [0, end], { end }, metrics)
    heapify(end, 0)
  }
  makeStep(
    steps,
    'complete',
    'Heap sort complete.',
    data,
    data.map((_, index) => index),
    {},
    metrics,
  )
  return steps
}

function countingSort(input: number[]) {
  const data = [...input]
  const steps: AlgorithmStep[] = []
  const metrics = { ...baseMetrics }
  const max = Math.max(...data, 0)
  const counts = Array(max + 1).fill(0)
  data.forEach((value, index) => {
    counts[value] += 1
    metrics.reads += 1
    metrics.writes += 1
    makeStep(steps, 'update', `Count value ${value}.`, data, [index], { counts: counts.join(', ') }, metrics)
  })
  let cursor = 0
  counts.forEach((count, value) => {
    for (let repeat = 0; repeat < count; repeat += 1) {
      data[cursor] = value
      metrics.writes += 1
      makeStep(steps, 'update', `Write ${value} at index ${cursor}.`, data, [cursor], { value }, metrics)
      cursor += 1
    }
  })
  makeStep(
    steps,
    'complete',
    'Counting sort complete.',
    data,
    data.map((_, index) => index),
    {},
    metrics,
  )
  return steps
}

function radixSort(input: number[]) {
  const data = [...input]
  const steps: AlgorithmStep[] = []
  const metrics = { ...baseMetrics }
  const max = Math.max(...data, 0)
  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
    const buckets = Array.from({ length: 10 }, () => [] as number[])
    data.forEach((value, index) => {
      const digit = Math.floor(value / exp) % 10
      buckets[digit].push(value)
      metrics.reads += 1
      makeStep(steps, 'select', `Place ${value} into digit bucket ${digit}.`, data, [index], { exp, digit }, metrics)
    })
    let index = 0
    buckets.flat().forEach((value) => {
      data[index] = value
      metrics.writes += 1
      makeStep(steps, 'update', `Collect ${value} back into index ${index}.`, data, [index], { exp }, metrics)
      index += 1
    })
  }
  makeStep(
    steps,
    'complete',
    'Radix sort complete.',
    data,
    data.map((_, index) => index),
    {},
    metrics,
  )
  return steps
}

function stackDemo(input: number[]) {
  const stack: number[] = []
  const steps: AlgorithmStep[] = []
  const metrics = { ...baseMetrics }
  input.slice(0, 8).forEach((value) => {
    stack.push(value)
    metrics.writes += 1
    makeStep(steps, 'update', `Push ${value} onto the stack.`, stack, [stack.length - 1], { top: value }, metrics)
  })
  while (stack.length) {
    const value = stack.pop()
    metrics.reads += 1
    makeStep(steps, 'update', `Pop ${value} from the stack.`, stack, [stack.length - 1], { popped: value }, metrics)
  }
  makeStep(steps, 'complete', 'Stack is empty.', stack, [], {}, metrics)
  return steps
}

function queueDemo(input: number[]) {
  const queue: number[] = []
  const steps: AlgorithmStep[] = []
  const metrics = { ...baseMetrics }
  input.slice(0, 8).forEach((value) => {
    queue.push(value)
    metrics.writes += 1
    makeStep(steps, 'update', `Enqueue ${value}.`, queue, [queue.length - 1], { rear: value }, metrics)
  })
  while (queue.length) {
    const value = queue.shift()
    metrics.reads += 1
    makeStep(steps, 'update', `Dequeue ${value}.`, queue, [0], { front: queue[0] ?? 'empty' }, metrics)
  }
  makeStep(steps, 'complete', 'Queue is empty.', queue, [], {}, metrics)
  return steps
}

export const graphNodes = [
  { id: 'A', x: 70, y: 150 },
  { id: 'B', x: 180, y: 65 },
  { id: 'C', x: 180, y: 235 },
  { id: 'D', x: 310, y: 150 },
  { id: 'E', x: 420, y: 70 },
  { id: 'F', x: 420, y: 235 },
  { id: 'G', x: 535, y: 150 },
]

export const graphEdges = [
  ['A', 'B', 2],
  ['A', 'C', 5],
  ['B', 'C', 6],
  ['B', 'D', 1],
  ['B', 'E', 3],
  ['C', 'F', 8],
  ['D', 'E', 4],
  ['D', 'F', 5],
  ['E', 'G', 9],
  ['F', 'G', 7],
] as const

export const treeNodes = [
  { id: '8', x: 300, y: 45 },
  { id: '3', x: 170, y: 130 },
  { id: '10', x: 430, y: 130 },
  { id: '1', x: 95, y: 220 },
  { id: '6', x: 235, y: 220 },
  { id: '14', x: 500, y: 220 },
  { id: '4', x: 195, y: 310 },
  { id: '7', x: 275, y: 310 },
  { id: '13', x: 460, y: 310 },
]

export const treeEdges = [
  ['8', '3'],
  ['8', '10'],
  ['3', '1'],
  ['3', '6'],
  ['10', '14'],
  ['6', '4'],
  ['6', '7'],
  ['14', '13'],
] as const

const treeOrders: Record<string, string[]> = {
  'tree-preorder-traversal': ['8', '3', '1', '6', '4', '7', '10', '14', '13'],
  'tree-inorder-traversal': ['1', '3', '4', '6', '7', '8', '10', '13', '14'],
  'tree-postorder-traversal': ['1', '4', '7', '6', '3', '13', '14', '10', '8'],
  'tree-level-order-traversal': ['8', '3', '10', '1', '6', '14', '4', '7', '13'],
}

function makeTraversalSteps(order: string[], label: string) {
  const steps: AlgorithmStep[] = []
  order.forEach((node, index) => {
    steps.push({
      id: `${label}-${index}`,
      operationId: `visit-${index + 1}-${node}`,
      type: 'visit',
      description: `${label}: visit node ${node}. Traversal order is ${order.slice(0, index + 1).join(' -> ')}.`,
      pseudocodeLine: 2,
      codeLine: 2,
      reason: reasonForStep('visit'),
      beforeState: [],
      dataState: [],
      afterState: [],
      highlights: { nodes: [node], variables: { order: order.slice(0, index + 1).join(' -> '), current: node } },
      metrics: { reads: index + 1, writes: index + 1, memory: order.length },
    })
  })
  steps.push({
    id: `${label}-complete`,
    operationId: `complete-${order.length + 1}`,
    type: 'complete',
    description: `${label} complete: ${order.join(' -> ')}.`,
    pseudocodeLine: 4,
    codeLine: 4,
    reason: reasonForStep('complete'),
    beforeState: [],
    dataState: [],
    afterState: [],
    assertion: 'Traversal visited the expected order.',
    highlights: { nodes: order, variables: { order: order.join(' -> ') } },
    metrics: { reads: order.length, writes: order.length, memory: order.length },
  })
  return steps
}

function graphTraversal(_input: number[], _target: number, mode: 'bfs' | 'dfs') {
  const adjacency: Record<string, string[]> = {
    A: ['B', 'C'],
    B: ['A', 'C', 'D', 'E'],
    C: ['A', 'B', 'F'],
    D: ['B', 'E', 'F'],
    E: ['B', 'D', 'G'],
    F: ['C', 'D', 'G'],
    G: ['E', 'F'],
  }
  const seen = new Set<string>()
  const frontier = ['A']
  const order: string[] = []
  while (frontier.length) {
    const node = mode === 'bfs' ? frontier.shift()! : frontier.pop()!
    if (seen.has(node)) continue
    seen.add(node)
    order.push(node)
    adjacency[node]
      .slice()
      .reverse()
      .forEach((next) => {
        if (!seen.has(next)) frontier.push(next)
      })
  }
  return makeTraversalSteps(order, mode === 'bfs' ? 'BFS traversal' : 'DFS traversal')
}

export const algorithmModules: AlgorithmModule[] = [
  {
    id: 'linear-search',
    name: 'Linear Search',
    category: 'Searching',
    status: 'live',
    visualMode: 'Array',
    summary: 'Scans each element until the target is found or the array ends.',
    complexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(1)' },
    flags: ['Works on unsorted data', 'Stable read order'],
    pseudocode: ['for each item in array', 'compare item with target', 'if equal, return index', 'return not found'],
    code: 'array.findIndex((value) => value === target)',
    runner: linearSearch,
  },
  {
    id: 'sentinel-linear-search',
    name: 'Sentinel Linear Search',
    category: 'Searching',
    status: 'live',
    visualMode: 'Array',
    summary: 'Adds a sentinel value to remove the inner bounds check during scanning.',
    complexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(1)' },
    flags: ['Teaching optimization', 'Unsorted data'],
    pseudocode: ['place target as sentinel at the end', 'scan until target appears', 'if index is original length, not found'],
    code: 'array[n] = target; while (array[i] !== target) i += 1',
    runner: sentinelLinearSearch,
  },
  {
    id: 'recursive-linear-search',
    name: 'Recursive Linear Search',
    category: 'Searching',
    status: 'live',
    visualMode: 'Array',
    summary: 'Searches one index per recursive call and shows the call count.',
    complexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(n)' },
    flags: ['Recursive'],
    pseudocode: ['if index equals length, stop', 'compare current item', 'recurse with index + 1'],
    code: 'return array[i] === target ? i : search(i + 1)',
    runner: recursiveLinearSearch,
  },
  {
    id: 'binary-search',
    name: 'Binary Search',
    category: 'Searching',
    status: 'live',
    visualMode: 'Array',
    summary: 'Repeatedly halves a sorted search range.',
    complexity: { best: 'O(1)', average: 'O(log n)', worst: 'O(log n)', space: 'O(1)' },
    flags: ['Requires sorted input'],
    pseudocode: ['low = 0, high = n - 1', 'while low <= high', 'mid = floor((low + high) / 2)', 'move left or right by comparison'],
    code: 'while (low <= high) { const mid = Math.floor((low + high) / 2) }',
    runner: binarySearch,
  },
  {
    id: 'recursive-binary-search',
    name: 'Recursive Binary Search',
    category: 'Searching',
    status: 'live',
    visualMode: 'Array',
    summary: 'The same halving strategy with explicit recursive call-stack metrics.',
    complexity: { best: 'O(1)', average: 'O(log n)', worst: 'O(log n)', space: 'O(log n)' },
    flags: ['Requires sorted input', 'Recursive'],
    pseudocode: ['if low > high, stop', 'check middle', 'recurse left or right'],
    code: 'return value < target ? search(mid + 1, high) : search(low, mid - 1)',
    runner: recursiveBinarySearch,
  },
  {
    id: 'lower-bound',
    name: 'Lower Bound',
    category: 'Searching',
    status: 'live',
    visualMode: 'Array',
    summary: 'Finds the first sorted position whose value is greater than or equal to the target.',
    complexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)', space: 'O(1)' },
    flags: ['Duplicates friendly'],
    pseudocode: ['while low < high', 'if array[mid] < target, low = mid + 1', 'else high = mid', 'return low'],
    code: 'if (array[mid] < target) low = mid + 1; else high = mid',
    runner: (input, target) => boundSearch(input, target),
  },
  {
    id: 'upper-bound',
    name: 'Upper Bound',
    category: 'Searching',
    status: 'live',
    visualMode: 'Array',
    summary: 'Finds the first sorted position whose value is greater than the target.',
    complexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)', space: 'O(1)' },
    flags: ['Duplicates friendly'],
    pseudocode: ['while low < high', 'if array[mid] <= target, low = mid + 1', 'else high = mid', 'return low'],
    code: 'if (array[mid] <= target) low = mid + 1; else high = mid',
    runner: (input, target) => boundSearch(input, target, true),
  },
  {
    id: 'first-occurrence',
    name: 'First Occurrence',
    category: 'Searching',
    status: 'live',
    visualMode: 'Array',
    summary: 'Uses lower bound to find the first duplicate position.',
    complexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)', space: 'O(1)' },
    flags: ['Sorted data', 'Duplicates'],
    pseudocode: ['find lower bound', 'confirm value equals target', 'return first index or -1'],
    code: 'const i = lowerBound(array, target)',
    runner: (input, target) => occurrenceSearch(input, target),
  },
  {
    id: 'last-occurrence',
    name: 'Last Occurrence',
    category: 'Searching',
    status: 'live',
    visualMode: 'Array',
    summary: 'Uses upper bound minus one to find the last duplicate position.',
    complexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)', space: 'O(1)' },
    flags: ['Sorted data', 'Duplicates'],
    pseudocode: ['find upper bound', 'subtract one', 'confirm value equals target'],
    code: 'const i = upperBound(array, target) - 1',
    runner: (input, target) => occurrenceSearch(input, target, true),
  },
  {
    id: 'search-insert-position',
    name: 'Search Insert Position',
    category: 'Searching',
    status: 'live',
    visualMode: 'Array',
    summary: 'Returns the sorted position where the target should be inserted.',
    complexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)', space: 'O(1)' },
    flags: ['Sorted data'],
    pseudocode: ['run lower bound', 'return insertion position'],
    code: 'return lowerBound(array, target)',
    runner: (input, target) => boundSearch(input, target),
  },
  {
    id: 'rotated-sorted-array-search',
    name: 'Rotated Sorted Array Search',
    category: 'Searching',
    status: 'live',
    visualMode: 'Array',
    summary: 'Finds a target while detecting which half is currently sorted.',
    complexity: { best: 'O(1)', average: 'O(log n)', worst: 'O(log n)', space: 'O(1)' },
    flags: ['Rotated sorted data'],
    pseudocode: ['check mid', 'detect sorted half', 'discard the other half'],
    code: 'if (array[low] <= array[mid]) handle sorted-left half',
    runner: rotatedSortedSearch,
  },
  {
    id: 'peak-element-search',
    name: 'Peak Element Search',
    category: 'Searching',
    status: 'live',
    visualMode: 'Array',
    summary: 'Binary-search style walk toward a local peak.',
    complexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)', space: 'O(1)' },
    flags: ['Local optimum'],
    pseudocode: ['compare mid with mid + 1', 'move toward the rising side', 'low equals peak'],
    code: 'array[mid] < array[mid + 1] ? low = mid + 1 : high = mid',
    runner: peakElementSearch,
  },
  {
    id: 'bubble-sort',
    name: 'Bubble Sort',
    category: 'Sorting',
    status: 'live',
    visualMode: 'Array',
    summary: 'Repeated adjacent comparisons move large values to the sorted suffix.',
    complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
    flags: ['Stable', 'In-place'],
    pseudocode: ['repeat passes', 'compare adjacent values', 'swap if out of order', 'largest bubbles to the end'],
    code: 'if (array[i] > array[i + 1]) [array[i], array[i + 1]] = [array[i + 1], array[i]]',
    runner: bubbleSort,
  },
  {
    id: 'selection-sort',
    name: 'Selection Sort',
    category: 'Sorting',
    status: 'live',
    visualMode: 'Array',
    summary: 'Selects the minimum remaining value and moves it into place.',
    complexity: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
    flags: ['In-place', 'Not stable by default'],
    pseudocode: ['for each position', 'find minimum in suffix', 'swap minimum into current position'],
    code: 'for (let i = 0; i < n; i++) select the smallest suffix value',
    runner: selectionSort,
  },
  {
    id: 'insertion-sort',
    name: 'Insertion Sort',
    category: 'Sorting',
    status: 'live',
    visualMode: 'Array',
    summary: 'Builds a sorted prefix one inserted value at a time.',
    complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
    flags: ['Stable', 'In-place', 'Great for nearly sorted data'],
    pseudocode: ['take next key', 'shift larger prefix values right', 'insert key into the gap'],
    code: 'while (j >= 0 && array[j] > key) array[j + 1] = array[j]',
    runner: insertionSort,
  },
  {
    id: 'binary-insertion-sort',
    name: 'Binary Insertion Sort',
    category: 'Sorting',
    status: 'live',
    visualMode: 'Array',
    summary: 'Uses binary search to find each insertion point, then shifts values into place.',
    complexity: { best: 'O(n log n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
    flags: ['Stable', 'In-place'],
    pseudocode: ['binary search sorted prefix', 'shift values right', 'insert key'],
    code: 'const pos = lowerBound(prefix, key)',
    runner: binaryInsertionSort,
  },
  {
    id: 'merge-sort',
    name: 'Merge Sort',
    category: 'Sorting',
    status: 'live',
    visualMode: 'Array',
    summary: 'Splits the array and merges sorted halves.',
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)' },
    flags: ['Stable', 'Divide and conquer'],
    pseudocode: ['split array in half', 'sort left and right', 'merge two sorted halves'],
    code: 'merge(sort(left), sort(right))',
    runner: mergeSort,
  },
  {
    id: 'quick-sort',
    name: 'Quick Sort',
    category: 'Sorting',
    status: 'live',
    visualMode: 'Array',
    summary: 'Partitions around a pivot and recursively sorts both sides.',
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)' },
    flags: ['In-place', 'Recursive'],
    pseudocode: ['choose pivot', 'partition smaller values left', 'sort left side', 'sort right side'],
    code: 'const pivotIndex = partition(array, low, high)',
    runner: quickSort,
  },
  {
    id: 'heap-sort',
    name: 'Heap Sort',
    category: 'Sorting',
    status: 'live',
    visualMode: 'Array',
    summary: 'Builds a heap, then repeatedly extracts the maximum.',
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)' },
    flags: ['In-place', 'Not stable'],
    pseudocode: ['build max heap', 'swap root with end', 'heapify reduced heap'],
    code: 'heapify(size, root)',
    runner: heapSort,
  },
  {
    id: 'counting-sort',
    name: 'Counting Sort',
    category: 'Sorting',
    status: 'live',
    visualMode: 'Array',
    summary: 'Counts small integer values, then writes them back in order.',
    complexity: { best: 'O(n + k)', average: 'O(n + k)', worst: 'O(n + k)', space: 'O(k)' },
    flags: ['Integer keys', 'Non-comparison'],
    pseudocode: ['count each value', 'scan counts', 'write values in sorted order'],
    code: 'counts[value] += 1',
    runner: countingSort,
  },
  {
    id: 'radix-sort',
    name: 'Radix Sort',
    category: 'Sorting',
    status: 'live',
    visualMode: 'Array',
    summary: 'Sorts integers digit by digit using stable buckets.',
    complexity: { best: 'O(d(n + b))', average: 'O(d(n + b))', worst: 'O(d(n + b))', space: 'O(n + b)' },
    flags: ['Integer keys', 'Non-comparison'],
    pseudocode: ['for each digit place', 'bucket by digit', 'collect buckets in order'],
    code: 'const digit = Math.floor(value / exp) % 10',
    runner: radixSort,
  },
  {
    id: 'shell-sort',
    name: 'Shell Sort',
    category: 'Sorting',
    status: 'live',
    visualMode: 'Array',
    summary: 'Sorts distant elements first, shrinking the gap until it becomes insertion sort.',
    complexity: { best: 'O(n log n)', average: 'Depends on gaps', worst: 'O(n²)', space: 'O(1)' },
    flags: ['In-place', 'Gap sequence'],
    pseudocode: ['start with large gap', 'gapped insertion sort', 'halve gap until one'],
    code: 'for (let gap = n / 2; gap > 0; gap = Math.floor(gap / 2))',
    runner: shellSort,
  },
  {
    id: 'cocktail-shaker-sort',
    name: 'Cocktail Shaker Sort',
    category: 'Sorting',
    status: 'live',
    visualMode: 'Array',
    summary: 'Bubble sort in both directions, tightening the unsorted range.',
    complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
    flags: ['Stable', 'In-place'],
    pseudocode: ['bubble forward', 'bubble backward', 'shrink both ends'],
    code: 'scan left to right, then right to left',
    runner: cocktailShakerSort,
  },
  {
    id: 'comb-sort',
    name: 'Comb Sort',
    category: 'Sorting',
    status: 'live',
    visualMode: 'Array',
    summary: 'Compares elements far apart, shrinking the gap to remove small inversions early.',
    complexity: { best: 'O(n log n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
    flags: ['In-place', 'Gap-based'],
    pseudocode: ['gap = n', 'gap = gap / 1.3', 'compare gap pairs', 'finish at gap 1'],
    code: 'if (array[i] > array[i + gap]) swap()',
    runner: combSort,
  },
  {
    id: 'gnome-sort',
    name: 'Gnome Sort',
    category: 'Sorting',
    status: 'live',
    visualMode: 'Array',
    summary: 'Walks forward when ordered and swaps backward when it finds an inversion.',
    complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
    flags: ['Stable', 'In-place'],
    pseudocode: ['compare current with previous', 'if ordered move forward', 'else swap and step back'],
    code: 'array[i] < array[i - 1] ? swapAndBacktrack() : i++',
    runner: gnomeSort,
  },
  {
    id: 'stack',
    name: 'Stack',
    category: 'Data Structures',
    status: 'live',
    visualMode: 'Array',
    summary: 'Last-in, first-out operations with push and pop.',
    complexity: { best: 'O(1)', average: 'O(1)', worst: 'O(1)', space: 'O(n)' },
    flags: ['LIFO'],
    pseudocode: ['push adds to top', 'pop removes from top', 'peek reads top'],
    code: 'stack.push(value); stack.pop()',
    runner: stackDemo,
  },
  {
    id: 'queue',
    name: 'Queue',
    category: 'Data Structures',
    status: 'live',
    visualMode: 'Array',
    summary: 'First-in, first-out operations with enqueue and dequeue.',
    complexity: { best: 'O(1)', average: 'O(1)', worst: 'O(1)', space: 'O(n)' },
    flags: ['FIFO'],
    pseudocode: ['enqueue adds to rear', 'dequeue removes from front', 'front reads next item'],
    code: 'queue.push(value); queue.shift()',
    runner: queueDemo,
  },
  {
    id: 'tree-preorder-traversal',
    name: 'Tree Preorder Traversal',
    category: 'Data Structures',
    subcategory: 'Traversal',
    status: 'live',
    visualMode: 'Tree',
    summary: 'Visits root, then left subtree, then right subtree on a real tree diagram.',
    complexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)', space: 'O(h)' },
    flags: ['Traversal', 'Recursive'],
    pseudocode: ['visit root', 'traverse left', 'traverse right'],
    code: 'preorder(node) { visit(node); preorder(node.left); preorder(node.right); }',
    runner: () => makeTraversalSteps(treeOrders['tree-preorder-traversal'], 'Preorder traversal'),
  },
  {
    id: 'tree-inorder-traversal',
    name: 'Tree Inorder Traversal',
    category: 'Data Structures',
    subcategory: 'Traversal',
    status: 'live',
    visualMode: 'Tree',
    summary: 'Visits left subtree, root, then right subtree; sorted order for BSTs.',
    complexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)', space: 'O(h)' },
    flags: ['Traversal', 'BST sorted order'],
    pseudocode: ['traverse left', 'visit root', 'traverse right'],
    code: 'inorder(node) { inorder(node.left); visit(node); inorder(node.right); }',
    runner: () => makeTraversalSteps(treeOrders['tree-inorder-traversal'], 'Inorder traversal'),
  },
  {
    id: 'tree-postorder-traversal',
    name: 'Tree Postorder Traversal',
    category: 'Data Structures',
    subcategory: 'Traversal',
    status: 'live',
    visualMode: 'Tree',
    summary: 'Visits children before the root; useful for deletion and expression trees.',
    complexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)', space: 'O(h)' },
    flags: ['Traversal', 'Recursive'],
    pseudocode: ['traverse left', 'traverse right', 'visit root'],
    code: 'postorder(node) { postorder(node.left); postorder(node.right); visit(node); }',
    runner: () => makeTraversalSteps(treeOrders['tree-postorder-traversal'], 'Postorder traversal'),
  },
  {
    id: 'tree-level-order-traversal',
    name: 'Tree Level Order Traversal',
    category: 'Data Structures',
    subcategory: 'Traversal',
    status: 'live',
    visualMode: 'Tree',
    summary: 'Visits nodes breadth-first using a queue.',
    complexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)', space: 'O(w)' },
    flags: ['Traversal', 'Queue'],
    pseudocode: ['enqueue root', 'while queue not empty', 'dequeue node', 'enqueue children'],
    code: 'while (queue.length) { node = queue.shift(); visit(node); }',
    runner: () => makeTraversalSteps(treeOrders['tree-level-order-traversal'], 'Level order traversal'),
  },
  {
    id: 'bfs-traversal',
    name: 'BFS Traversal',
    category: 'Graphs',
    subcategory: 'Traversal',
    status: 'live',
    visualMode: 'Graph',
    summary: 'Explores a graph layer by layer from the start node using a queue.',
    complexity: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)' },
    flags: ['Traversal', 'Queue'],
    pseudocode: ['enqueue start', 'visit nearest frontier first', 'enqueue unvisited neighbors'],
    code: 'while (queue.length) visit(queue.shift())',
    runner: (input, target) => graphTraversal(input, target, 'bfs'),
  },
  {
    id: 'dfs-traversal',
    name: 'DFS Traversal',
    category: 'Graphs',
    subcategory: 'Traversal',
    status: 'live',
    visualMode: 'Graph',
    summary: 'Explores deeply along each branch before backtracking.',
    complexity: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)' },
    flags: ['Traversal', 'Stack'],
    pseudocode: ['push start', 'visit deepest frontier first', 'backtrack when blocked'],
    code: 'while (stack.length) visit(stack.pop())',
    runner: (input, target) => graphTraversal(input, target, 'dfs'),
  },
]

export const plannedModules: AlgorithmModule[] = [
  ['Graphs', 'Dijkstra', 'Graph'],
  ['Graphs', 'Topological Sort', 'Graph'],
  ['Graphs', 'Prim', 'Graph'],
  ['Graphs', 'Kruskal', 'Graph'],
  ['Dynamic Programming', 'Fibonacci DP', 'Matrix'],
  ['Dynamic Programming', 'Coin Change', 'Matrix'],
  ['Dynamic Programming', '0/1 Knapsack', 'Matrix'],
  ['Dynamic Programming', 'LCS', 'Matrix'],
  ['Dynamic Programming', 'Edit Distance', 'Matrix'],
  ['Strings', 'KMP', 'Array'],
  ['Strings', 'Rabin-Karp', 'Array'],
  ['Strings', 'Z Algorithm', 'Array'],
  ['Number Theory', 'GCD', 'Array'],
  ['Number Theory', 'Sieve of Eratosthenes', 'Array'],
  ['Backtracking', 'N-Queens', 'Tree'],
  ['Greedy', 'Huffman Coding', 'Tree'],
  ['Matrix / Grid', 'A* Maze Pathfinding', 'Matrix'],
].map(([category, name, visualMode]) => ({
  id: String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-$/, ''),
  name: String(name),
  category: category as AlgorithmCategory,
  status: 'planned' as const,
  visualMode: visualMode as AlgorithmModule['visualMode'],
  summary: 'Queued in the product roadmap with the same step-event interface.',
  complexity: { best: 'Varies', average: 'Varies', worst: 'Varies', space: 'Varies' },
  pseudocode: ['Shared AlgorithmStep generator', 'Visualization renderer', 'Experiment metrics', 'Exportable report'],
  code: '// Planned module scaffold',
}))

export const allModules = [...algorithmModules, ...plannedModules]
