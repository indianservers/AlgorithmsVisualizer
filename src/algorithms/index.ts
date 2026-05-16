import type { AlgorithmModule, AlgorithmStep, StepType } from '../types'

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

function demoArray(
  values: number[],
  label: string,
  operations: { description: string; indices?: number[]; type?: StepType; variables?: Record<string, unknown> }[],
) {
  const data = values.length ? [...values] : [8, 3, 10, 1, 6, 14, 4, 7]
  const steps: AlgorithmStep[] = []
  const metrics = { ...baseMetrics, memory: data.length }
  operations.forEach((operation) => {
    if (operation.type === 'compare') metrics.comparisons += 1
    else if (operation.type === 'visit') metrics.reads += 1
    else metrics.writes += 1
    makeStep(steps, operation.type ?? 'update', operation.description, data, operation.indices ?? [], operation.variables ?? {}, metrics)
  })
  makeStep(
    steps,
    'complete',
    `${label} demo complete.`,
    data,
    data.map((_, index) => index),
    { topic: label },
    metrics,
  )
  return steps
}

function linkedListSuite(input: number[]) {
  const data = input.slice(0, 7)
  data.push(99)
  data.splice(1, 0, 42)
  data.reverse()
  return demoArray(data, 'Linked list suite', [
    { type: 'select', description: 'Create head pointer and chain each input value as a node.', indices: [0], variables: { head: data[0] } },
    { description: 'Insert 42 after the head by rewiring next pointers.', indices: [0, 1], variables: { inserted: 42 } },
    {
      description: 'Delete the old tail by redirecting the previous next pointer.',
      indices: [data.length - 1],
      variables: { deleted: input.at(-1) ?? 'tail' },
    },
    { type: 'compare', description: 'Run slow and fast pointers to check for a cycle.', indices: [1, 3], variables: { slow: 1, fast: 3 } },
    { description: 'Reverse links one node at a time: prev <- current -> next.', indices: [0, 1, 2], variables: { prev: data[0], current: data[1] } },
  ])
}

function hashTableSuite(input: number[], target: number) {
  const size = 11
  const table = Array(size).fill(0)
  const metrics = { ...baseMetrics, memory: size }
  const steps: AlgorithmStep[] = []
  input.slice(0, 8).forEach((value) => {
    let slot = Math.abs(value) % size
    metrics.reads += 1
    makeStep(steps, 'hash', `Hash ${value} to slot ${slot}.`, table, [slot], { value, hash: slot, loadFactor: `${input.length}/${size}` }, metrics)
    while (table[slot] !== 0) {
      metrics.comparisons += 1
      slot = (slot + 1) % size
      makeStep(steps, 'compare', `Collision: probe next slot ${slot}.`, table, [slot], { strategy: 'linear probing' }, metrics)
    }
    table[slot] = value
    metrics.writes += 1
    makeStep(steps, 'update', `Place ${value} in slot ${slot}.`, table, [slot], { slot }, metrics)
  })
  const targetSlot = Math.abs(target) % size
  makeStep(steps, 'complete', `Lookup starts at hash slot ${targetSlot}; rehash when load factor grows too high.`, table, [targetSlot], { targetSlot }, metrics)
  return steps
}

function bstOperations(input: number[], target: number) {
  const values = input.slice(0, 9)
  const order = values.map(String)
  const steps = makeTraversalSteps(order, 'BST insert/search/delete')
  steps.at(-1)!.description = `BST operations complete: inserted ${values.length} values, searched for ${target}, and demonstrated successor-based deletion.`
  steps.at(-1)!.highlights.variables = { order: order.join(' -> '), search: target, deleteCase: 'two-child node uses inorder successor' }
  return steps
}

function rotationDemo(kind: string) {
  return makeTraversalSteps(['30', '20', '10', '25', '40', '35', '50'], kind)
}

function heapPriorityQueue(input: number[]) {
  const data = [...input.slice(0, 10)]
  const steps: AlgorithmStep[] = []
  const metrics = { ...baseMetrics, memory: data.length }
  for (let index = Math.floor(data.length / 2) - 1; index >= 0; index -= 1) {
    metrics.comparisons += 1
    makeStep(
      steps,
      'compare',
      `Heapify subtree rooted at ${index}.`,
      data,
      [index, index * 2 + 1, index * 2 + 2].filter((i) => i < data.length),
      { phase: 'build heap' },
      metrics,
    )
  }
  data.sort((a, b) => b - a)
  makeStep(steps, 'update', 'Extract highest priority item and restore heap order.', data, [0], { extracted: data[0] }, metrics)
  makeStep(
    steps,
    'complete',
    'Priority queue demo complete.',
    data,
    data.map((_, index) => index),
    { heapRoot: data[0] },
    metrics,
  )
  return steps
}

function trieDemo(input: number[]) {
  const words = ['data', 'date', 'deal', 'dear', 'stack', 'star']
  return demoArray(
    input.slice(0, 6),
    'Trie prefix tree',
    words.map((word, index) => ({
      type: 'update' as StepType,
      description: `Insert/search word "${word}" through shared prefix nodes.`,
      indices: [index],
      variables: { word, prefix: word.slice(0, 2), terminal: true },
    })),
  )
}

function dsuDemo(input: number[]) {
  const parent = input.slice(0, 8).map((_, index) => index)
  const steps: AlgorithmStep[] = []
  const metrics = { ...baseMetrics, memory: parent.length }
  ;[
    [0, 1],
    [2, 3],
    [1, 3],
    [4, 5],
    [6, 7],
  ].forEach(([a, b]) => {
    const rootA = parent[a]
    const rootB = parent[b]
    metrics.comparisons += 1
    makeStep(steps, 'compare', `Find roots for ${a} and ${b}.`, parent, [a, b], { rootA, rootB }, metrics)
    parent.forEach((root, index) => {
      if (root === rootB) parent[index] = rootA
    })
    metrics.writes += 1
    makeStep(steps, 'update', `Union ${a} and ${b}; compress paths toward root ${rootA}.`, parent, [a, b], { root: rootA }, metrics)
  })
  makeStep(
    steps,
    'complete',
    'Disjoint set union demo complete.',
    parent,
    parent.map((_, index) => index),
    { sets: [...new Set(parent)].length },
    metrics,
  )
  return steps
}

function segmentTreeDemo(input: number[]) {
  const data = input.slice(0, 8)
  const total = data.reduce((sum, value) => sum + value, 0)
  return demoArray(data, 'Segment tree', [
    {
      type: 'select',
      description: `Build root range [0, ${data.length - 1}] with sum ${total}.`,
      indices: [0, data.length - 1],
      variables: { range: `[0, ${data.length - 1}]`, sum: total },
    },
    { type: 'compare', description: 'Split range query into left and right child intervals.', indices: [1, 2], variables: { query: '[1, 4]' } },
    { description: 'Apply point update and recompute ancestors back to the root.', indices: [3], variables: { updateIndex: 3 } },
    { description: 'Lazy propagation stores pending range updates until a child is needed.', indices: [0], variables: { lazy: '+5 pending' } },
  ])
}

function fenwickTreeDemo(input: number[]) {
  const data = input.slice(0, 8)
  return demoArray(data, 'Fenwick tree', [
    { type: 'select', description: 'Add value at index i, then move i += i & -i.', indices: [1, 2, 4], variables: { lowbit: 'i & -i' } },
    { type: 'compare', description: 'Query prefix sum by walking i -= i & -i.', indices: [7, 6, 4], variables: { prefix: 7 } },
    { description: 'Update touches only logarithmically many tree buckets.', indices: [2, 4], variables: { complexity: 'O(log n)' } },
  ])
}

function dequeCircularQueue(input: number[]) {
  const capacity = Math.max(6, Math.min(10, input.length + 2))
  const buffer = Array(capacity).fill(0)
  return demoArray(buffer, 'Deque and circular queue', [
    { description: 'Enqueue rear wraps with (rear + 1) mod capacity.', indices: [0], variables: { front: 0, rear: 0 } },
    { description: 'Push front wraps backward with (front - 1 + capacity) mod capacity.', indices: [capacity - 1], variables: { front: capacity - 1 } },
    { type: 'compare', description: 'Detect full buffer when next rear equals front.', indices: [capacity - 1, 0], variables: { fullCheck: true } },
    { description: 'Pop front advances front without shifting values.', indices: [1], variables: { operation: 'dequeue' } },
  ])
}

function expressionTreeDemo(input: number[]) {
  const order = ['+', '*', String(input[0] ?? 3), String(input[1] ?? 4), '-', String(input[2] ?? 9), String(input[3] ?? 5)]
  const steps = makeTraversalSteps(order, 'Expression tree')
  steps.at(-1)!.highlights.variables = { order: order.join(' -> '), infix: '(a*b)+(c-d)', postfix: 'a b * c d - +' }
  return steps
}

function skipListDemo(input: number[], target: number) {
  const data = [...input.slice(0, 10)].sort((a, b) => a - b)
  return demoArray(data, 'Skip list', [
    { type: 'select', description: 'Start search on the highest express lane.', indices: [0], variables: { level: 3, target } },
    { type: 'compare', description: 'Move right while the next key is less than the target.', indices: [1, 3, 5], variables: { direction: 'right' } },
    { type: 'compare', description: 'Drop down one level when the next key overshoots.', indices: [5], variables: { direction: 'down' } },
    { description: 'Insert new node with randomly chosen tower height.', indices: [4], variables: { newHeight: 2 } },
  ])
}

function bTreeDemo(input: number[]) {
  const keys = [...input.slice(0, 10)].sort((a, b) => a - b)
  return demoArray(keys, 'B-tree and B+ tree', [
    { type: 'select', description: 'Insert keys into a wide node until it overflows.', indices: [0, 1, 2], variables: { order: 4 } },
    { description: 'Split overflowing node and promote the median key.', indices: [2], variables: { promoted: keys[2] } },
    { type: 'compare', description: 'Range scan follows leaf links in a B+ tree.', indices: [3, 4, 5], variables: { scan: 'leaf chain' } },
    { description: 'Merge or borrow from sibling after deletion underflows a node.', indices: [1, 2], variables: { fixup: 'borrow/merge' } },
  ])
}

function graphSuite(label: string, variables: Record<string, unknown>) {
  const steps = makeTraversalSteps(['A', 'B', 'D', 'E', 'G', 'F', 'C'], label)
  steps.at(-1)!.highlights.variables = { ...steps.at(-1)!.highlights.variables, ...variables }
  return steps
}

function stringStructureDemo(input: number[]) {
  return demoArray(input.slice(0, 8), 'Advanced string structures', [
    { type: 'hash', description: 'Build trie edges for multiple dictionary words.', indices: [0], variables: { structure: 'trie' } },
    {
      type: 'compare',
      description: 'Sort suffixes lexicographically to form a suffix array.',
      indices: [1, 2, 3],
      variables: { suffixArray: '[5, 3, 1, 0, 4, 2]' },
    },
    { description: 'Aho-Corasick adds failure links for multi-pattern matching.', indices: [4], variables: { failureLinks: true } },
  ])
}

function dynamicProgrammingSuite(input: number[]) {
  const values = input.length ? input.slice(0, 8) : [1, 2, 3, 4, 5, 6, 7, 8]
  const rows = 4
  const columns = 6
  const table = Array(rows * columns).fill(0)
  const steps: AlgorithmStep[] = []
  const metrics = { ...baseMetrics, memory: table.length }

  table[0] = 0
  table[1] = 1
  makeStep(
    steps,
    'select',
    'Seed Fibonacci tabulation with base cases F(0)=0 and F(1)=1.',
    table,
    [0, 1],
    {
      problem: 'Fibonacci DP',
      recurrence: 'dp[i] = dp[i - 1] + dp[i - 2]',
      baseCases: ['F(0)', 'F(1)'],
    },
    metrics,
  )

  for (let index = 2; index < columns; index += 1) {
    table[index] = table[index - 1] + table[index - 2]
    metrics.reads += 2
    metrics.writes += 1
    makeStep(
      steps,
      'update',
      `Fill Fibonacci cell ${index} from the previous two solved subproblems.`,
      table,
      [index - 2, index - 1, index],
      {
        problem: 'Fibonacci DP',
        index,
        left: table[index - 2],
        right: table[index - 1],
        value: table[index],
      },
      metrics,
    )
  }

  const coins = [1, 3, 4]
  const target = Math.max(6, Math.min(9, Math.abs(values[0] ?? 6)))
  const coinOffset = columns
  table[coinOffset] = 0
  for (let amount = 1; amount < columns; amount += 1) table[coinOffset + amount] = 99
  coins.forEach((coin) => {
    for (let amount = coin; amount < columns; amount += 1) {
      const index = coinOffset + amount
      const candidate = table[coinOffset + amount - coin] + 1
      metrics.comparisons += 1
      makeStep(
        steps,
        'compare',
        `Coin change checks coin ${coin} for amount ${amount}.`,
        table,
        [coinOffset + amount - coin, index],
        {
          problem: 'Coin Change',
          coin,
          amount,
          candidate,
          previousBest: table[index],
        },
        metrics,
      )
      if (candidate < table[index]) {
        table[index] = candidate
        metrics.writes += 1
        makeStep(
          steps,
          'update',
          `Update minimum coins for amount ${amount} to ${candidate}.`,
          table,
          [index],
          {
            problem: 'Coin Change',
            amount,
            best: candidate,
            target,
          },
          metrics,
        )
      }
    }
  })

  const lcsOffset = columns * 2
  ;[
    [0, 0, 'A', 'A'],
    [0, 1, 'A', 'C'],
    [1, 1, 'B', 'C'],
    [1, 2, 'B', 'B'],
    [2, 3, 'C', 'C'],
  ].forEach(([row, column, leftChar, rightChar]) => {
    const index = lcsOffset + Number(row) * columns + Number(column)
    const matched = leftChar === rightChar
    const previous = Math.max(table[index - 1] ?? 0, table[index - columns] ?? 0)
    table[index] = matched ? previous + 1 : previous
    metrics.comparisons += 1
    metrics.writes += 1
    makeStep(
      steps,
      matched ? 'update' : 'compare',
      matched
        ? `LCS characters ${leftChar} and ${rightChar} match, extend the subsequence.`
        : `LCS characters ${leftChar} and ${rightChar} differ, keep the best neighbor.`,
      table,
      [index],
      {
        problem: 'LCS',
        leftChar,
        rightChar,
        row,
        column,
        value: table[index],
      },
      metrics,
    )
  })

  const editOffset = columns * 3
  ;[
    [0, 0, 0],
    [0, 1, 1],
    [1, 0, 1],
    [1, 1, 1],
    [2, 2, 2],
  ].forEach(([row, column, distance]) => {
    const index = editOffset + row * columns + column
    table[index] = distance
    metrics.writes += 1
    makeStep(
      steps,
      'update',
      `Edit distance stores cost ${distance} at row ${row}, column ${column}.`,
      table,
      [index],
      {
        problem: 'Edit Distance',
        row,
        column,
        operation: distance === 0 ? 'match/base' : 'insert/delete/replace',
      },
      metrics,
    )
  })

  makeStep(
    steps,
    'complete',
    'Dynamic programming suite complete: solve overlapping subproblems once, store answers, and reuse them.',
    table,
    table.map((_, index) => index),
    {
      problems: ['Fibonacci', 'Coin Change', 'LCS', 'Edit Distance', '0/1 Knapsack'],
      tableShape: `${rows}x${columns}`,
      corePattern: 'state -> transition -> memo/table -> answer',
    },
    metrics,
  )
  return steps
}

function backtrackingSuite() {
  const size = 4
  const board = Array(size * size).fill(0)
  const steps: AlgorithmStep[] = []
  const metrics = { ...baseMetrics, memory: board.length }
  const solutions: number[][] = []
  const columns = new Set<number>()
  const descendingDiagonals = new Set<number>()
  const ascendingDiagonals = new Set<number>()

  const placeQueens = (row: number) => {
    metrics.recursiveCalls += 1
    if (row === size) {
      solutions.push([...board])
      makeStep(
        steps,
        'complete',
        'N-Queens solution found; every row has one queen and no columns or diagonals conflict.',
        board,
        board.map((value, index) => (value === 1 ? index : -1)).filter((index) => index >= 0),
        { puzzle: 'N-Queens', size, solutions: solutions.length },
        metrics,
      )
      return true
    }

    for (let column = 0; column < size; column += 1) {
      const index = row * size + column
      const descending = row - column
      const ascending = row + column
      metrics.comparisons += 1
      makeStep(
        steps,
        'compare',
        `Check row ${row}, column ${column} for column and diagonal conflicts.`,
        board,
        [index],
        {
          puzzle: 'N-Queens',
          row,
          column,
          depth: row,
          columnFree: !columns.has(column),
          diagonalsFree: !descendingDiagonals.has(descending) && !ascendingDiagonals.has(ascending),
        },
        metrics,
      )

      if (columns.has(column) || descendingDiagonals.has(descending) || ascendingDiagonals.has(ascending)) continue

      board[index] = 1
      columns.add(column)
      descendingDiagonals.add(descending)
      ascendingDiagonals.add(ascending)
      metrics.writes += 1
      makeStep(steps, 'select', `Place queen at row ${row}, column ${column}.`, board, [index], { puzzle: 'N-Queens', row, column, depth: row }, metrics)

      if (placeQueens(row + 1)) return true

      board[index] = 0
      columns.delete(column)
      descendingDiagonals.delete(descending)
      ascendingDiagonals.delete(ascending)
      metrics.writes += 1
      makeStep(
        steps,
        'update',
        `Backtrack from row ${row}, column ${column} and try the next candidate.`,
        board,
        [index],
        {
          puzzle: 'N-Queens',
          row,
          column,
          depth: row,
          action: 'undo placement',
        },
        metrics,
      )
    }
    return false
  }

  placeQueens(0)
  makeStep(
    steps,
    'compare',
    'Sudoku branch preview: collect row, column, and box candidates before committing a digit.',
    board,
    [0, 1, 4, 5],
    {
      puzzle: 'Sudoku',
      cell: 'r1c1',
      rowMissing: [2, 3, 4],
      columnMissing: [1, 3],
      boxMissing: [2, 4],
      candidates: [3],
    },
    metrics,
  )
  makeStep(
    steps,
    'complete',
    'Backtracking suite complete: recurse, test constraints, commit a candidate, and undo when a branch fails.',
    board,
    [],
    {
      puzzles: ['N-Queens', 'Sudoku'],
      corePattern: 'choose -> constrain -> recurse -> backtrack',
    },
    metrics,
  )
  return steps
}

export const chessFenPresets = [
  { name: 'Starting position', fen: 'startpos' },
  { name: 'Italian opening', fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3' },
  { name: 'Queen pawn center', fen: 'rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq d6 0 2' },
  { name: 'Scholar mate threat', fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR b KQkq - 3 3' },
  { name: 'King safety puzzle', fen: 'r3k2r/pppq1ppp/2n2n2/3pp3/3PP3/2N2N2/PPPQ1PPP/R3K2R w KQkq - 0 9' },
  { name: 'Hanging queen', fen: 'rnb1kbnr/pppp1ppp/8/4p3/4P1q1/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3' },
  { name: 'Fork chance', fen: 'r1bqkbnr/pppp1ppp/2n5/4N3/4p3/8/PPPP1PPP/RNBQKB1R w KQkq - 0 4' },
  { name: 'Pinned knight', fen: 'rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4' },
  { name: 'Castle decision', fen: 'r1bq1rk1/ppp2ppp/2n2n2/3pp3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQ - 4 7' },
  { name: 'Open file rook', fen: 'r4rk1/ppp2ppp/2n2n2/3qp3/3P4/2N1PN2/PPP2PPP/R2Q1RK1 w - - 0 10' },
  { name: 'Knight outpost', fen: 'r2q1rk1/ppp2ppp/2n2n2/3pp3/3P4/2N1PN2/PPP2PPP/R2Q1RK1 w - - 0 9' },
  { name: 'Bishop pair', fen: 'r2qk2r/ppp2ppp/2n2n2/2bpp3/2BPP3/2N2N2/PPP2PPP/R1BQ1RK1 w kq - 2 8' },
  { name: 'Passed pawn', fen: '8/3k4/8/3P4/4K3/8/8/8 w - - 0 1' },
  { name: 'Rook endgame', fen: '8/8/4k3/8/8/4K3/5R2/7r w - - 0 1' },
  { name: 'King opposition', fen: '8/8/8/3k4/8/3K4/4P3/8 w - - 0 1' },
  { name: 'Mate in one', fen: '6k1/5ppp/8/8/8/8/5PPP/6KQ w - - 0 1' },
  { name: 'Back rank danger', fen: '6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1' },
  { name: 'Queen trade', fen: 'r3k2r/ppp2ppp/2n5/3q4/3Q4/2N5/PPP2PPP/R3K2R w KQkq - 0 12' },
  { name: 'Central break', fen: 'r1bq1rk1/ppp2ppp/2n2n2/3pp3/2BPP3/2N2N2/PPP2PPP/R1BQ1RK1 w - - 0 8' },
  { name: 'Isolated pawn', fen: 'r2q1rk1/pp3ppp/2n2n2/2bp4/3P4/2N1PN2/PP3PPP/R2Q1RK1 w - - 0 11' },
  { name: 'Tactical skewer', fen: '4k3/8/8/8/8/8/4q3/4K2R w K - 0 1' },
  { name: 'Discovered attack', fen: 'r3k2r/ppp2ppp/2n5/3b4/3B4/2N5/PPP2PPP/R3K2R w KQkq - 0 10' },
  { name: 'Attack the king', fen: 'r4rk1/ppp2ppp/2n2n2/3qp3/2B1P3/2NP1N1P/PPP2PP1/R2Q1RK1 w - - 0 11' },
  { name: 'Defend the pawn', fen: '8/8/3k4/3p4/3P4/3K4/8/8 w - - 0 1' },
  { name: 'Promotion race', fen: '8/2P5/8/8/8/8/5p2/4K2k w - - 0 1' },
  { name: 'Queen versus rook', fen: '6k1/8/8/8/8/8/5r2/5QK1 w - - 0 1' },
  { name: 'Simplify when ahead', fen: '4k3/8/8/8/8/8/4q3/4RQK1 w - - 0 1' },
  { name: 'Find safe check', fen: '6k1/5ppp/8/8/8/8/5PPP/5RK1 w - - 0 1' },
]

function ticTacToeMinimax() {
  const board = Array(9).fill(0)
  const steps: AlgorithmStep[] = []
  const metrics = { ...baseMetrics, memory: board.length }
  const wins = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ]
  const vars = (extra: Record<string, unknown> = {}) => ({
    game: 'Tic Tac Toe',
    tableShape: '3x3',
    boardSymbols: board.map((value) => (value === 1 ? 'X' : value === -1 ? 'O' : '')),
    ...extra,
  })

  makeStep(
    steps,
    'select',
    'Start with an empty board. X goes first. The goal is to get three marks in a row.',
    board,
    [],
    vars({ next: 'X moves first', idea: 'Rows, columns, and diagonals can win.' }),
    metrics,
  )

  board[4] = 1
  metrics.writes += 1
  makeStep(
    steps,
    'update',
    'X chooses the center. The center is strong because it touches many winning lines.',
    board,
    [4],
    vars({ next: 'O turn', move: 'X plays center' }),
    metrics,
  )

  board[0] = -1
  metrics.writes += 1
  makeStep(
    steps,
    'update',
    'O chooses a corner. Corners are also strong starting squares.',
    board,
    [0],
    vars({ next: 'X turn', move: 'O plays corner' }),
    metrics,
  )

  const candidateScores = [
    { index: 2, score: 0, reason: 'this move is safe, but does not create much pressure' },
    { index: 6, score: 0, reason: 'this move is also safe' },
    { index: 8, score: 1, reason: 'this move creates the most pressure' },
  ]
  candidateScores.forEach((candidate) => {
    metrics.comparisons += 1
    makeStep(
      steps,
      'compare',
      `Look ahead at cell ${candidate.index}: ${candidate.reason}. Score: ${candidate.score}.`,
      board,
      [candidate.index],
      vars({ check: `cell ${candidate.index}`, score: candidate.score, idea: 'Try a move, imagine O replies, then score the result.' }),
      metrics,
    )
  })

  board[8] = 1
  metrics.writes += 1
  makeStep(
    steps,
    'update',
    'X chooses the opposite corner because it was the best look-ahead move.',
    board,
    [8],
    vars({ next: 'O turn', move: 'X plays cell 8' }),
    metrics,
  )

  board[2] = -1
  metrics.writes += 1
  makeStep(steps, 'update', 'O blocks a possible top-row threat.', board, [2], vars({ next: 'X turn', block: 'top row' }), metrics)

  board[6] = 1
  metrics.writes += 1
  makeStep(steps, 'update', 'X creates a bottom-row threat.', board, [6], vars({ next: 'O turn', threat: 'bottom row' }), metrics)

  board[7] = -1
  metrics.writes += 1
  makeStep(
    steps,
    'update',
    'O blocks the bottom row. Good defense stops the immediate win.',
    board,
    [7],
    vars({ next: 'X turn', block: 'bottom row' }),
    metrics,
  )

  board[1] = 1
  metrics.writes += 1
  makeStep(
    steps,
    'update',
    'X plays the top edge. No player has a forced win now.',
    board,
    [1],
    vars({ next: 'O turn', resultSoon: 'draw with best play' }),
    metrics,
  )

  board[3] = -1
  metrics.writes += 1
  makeStep(steps, 'update', 'O takes the last safe side square.', board, [3], vars({ next: 'X turn', remaining: 'cell 5' }), metrics)

  board[5] = 1
  metrics.writes += 1
  const winLine = wins.find((line) => Math.abs(line.reduce((sum, index) => sum + board[index], 0)) === 3)
  makeStep(
    steps,
    'complete',
    'The board is full and nobody has three in a row. With best play, Tic Tac Toe ends in a draw.',
    board,
    winLine ?? board.map((_, index) => index),
    vars({ result: 'Draw', lesson: 'Look ahead, block threats, and choose the safest move.' }),
    metrics,
  )

  return steps
}

function gameLesson({
  columns,
  game,
  initial,
  steps: lessonSteps,
}: {
  columns: number
  game: string
  initial: string[]
  steps: { description: string; indices?: number[]; symbols?: Record<number, string>; type?: StepType; variables?: Record<string, unknown> }[]
}) {
  const symbols = [...initial]
  const data = symbols.map((symbol) => (symbol ? 1 : 0))
  const timeline: AlgorithmStep[] = []
  const metrics = { ...baseMetrics, memory: data.length }
  const vars = (extra: Record<string, unknown> = {}) => ({
    game,
    tableShape: `${Math.ceil(data.length / columns)}x${columns}`,
    boardSymbols: [...symbols],
    ...extra,
  })

  makeStep(
    timeline,
    'select',
    `${game}: start with the board and learn what each piece or cell means.`,
    data,
    [],
    vars({ idea: 'Read the board first, then choose a move.' }),
    metrics,
  )
  lessonSteps.forEach((step) => {
    Object.entries(step.symbols ?? {}).forEach(([index, symbol]) => {
      const position = Number(index)
      symbols[position] = symbol
      data[position] = symbol ? 1 : 0
      metrics.writes += 1
    })
    if (step.type === 'compare') metrics.comparisons += 1
    makeStep(timeline, step.type ?? 'update', step.description, data, step.indices ?? [], vars(step.variables), metrics)
  })
  makeStep(
    timeline,
    'complete',
    `${game} lesson complete: rules plus look-ahead make the next move easier to explain.`,
    data,
    [],
    vars({ result: 'Lesson complete' }),
    metrics,
  )
  return timeline
}

const pieceSymbols: Record<string, string> = {
  wp: '♙',
  wn: '♘',
  wb: '♗',
  wr: '♖',
  wq: '♕',
  wk: '♔',
  bp: '♟',
  bn: '♞',
  bb: '♝',
  br: '♜',
  bq: '♛',
  bk: '♚',
}

const pieceValues: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0,
}

const squareIndex = (square: Square) => {
  const file = square.charCodeAt(0) - 97
  const rank = Number(square[1])
  return (8 - rank) * 8 + file
}

function chessBoardState(chess: Chess) {
  const board = chess.board()
  const symbols: string[] = []
  const data: number[] = []
  board.forEach((row) =>
    row.forEach((piece) => {
      symbols.push(piece ? pieceSymbols[`${piece.color}${piece.type}`] : '')
      data.push(piece ? (piece.color === 'w' ? 1 : -1) : 0)
    }),
  )
  return { data, symbols }
}

function evaluateChess(chess: Chess) {
  if (chess.isCheckmate()) return chess.turn() === 'w' ? -100000 : 100000
  if (chess.isDraw()) return 0
  let score = 0
  chess.board().forEach((row) =>
    row.forEach((piece) => {
      if (piece) score += (piece.color === 'w' ? 1 : -1) * pieceValues[piece.type]
    }),
  )
  const turn = chess.turn()
  const mobility = chess.moves().length
  score += turn === 'w' ? mobility * 3 : -mobility * 3
  return score
}

function orderedChessMoves(chess: Chess) {
  return chess.moves({ verbose: true }).sort((a, b) => {
    const captureA = a.captured ? pieceValues[a.captured] : 0
    const captureB = b.captured ? pieceValues[b.captured] : 0
    return captureB - captureA || a.san.localeCompare(b.san)
  })
}

function searchChess(chess: Chess, depth: number, alpha = -Infinity, beta = Infinity): { line: string[]; score: number } {
  if (depth === 0 || chess.isGameOver()) return { line: [], score: evaluateChess(chess) }
  const maximizing = chess.turn() === 'w'
  let best = { line: [] as string[], score: maximizing ? -Infinity : Infinity }
  for (const move of orderedChessMoves(chess).slice(0, 14)) {
    chess.move(move)
    const result = searchChess(chess, depth - 1, alpha, beta)
    chess.undo()
    const score = result.score
    if ((maximizing && score > best.score) || (!maximizing && score < best.score)) best = { score, line: [move.san, ...result.line] }
    if (maximizing) alpha = Math.max(alpha, score)
    else beta = Math.min(beta, score)
    if (beta <= alpha) break
  }
  return best
}

function chessMinimaxLesson(_input: number[], target: number) {
  const preset = chessFenPresets[Math.abs(Math.trunc(target)) % chessFenPresets.length] ?? chessFenPresets[0]
  const customFen = typeof localStorage === 'undefined' ? '' : (localStorage.getItem('algodrishti-chess-fen') ?? '').trim()
  const selectedFen = customFen || preset.fen
  let chess: Chess
  try {
    chess = selectedFen === 'startpos' ? new Chess() : new Chess(selectedFen)
  } catch {
    chess = preset.fen === 'startpos' ? new Chess() : new Chess(preset.fen)
  }
  const steps: AlgorithmStep[] = []
  const metrics = { ...baseMetrics, memory: 64 }
  const state = () => chessBoardState(chess)
  const vars = (extra: Record<string, unknown> = {}) => ({
    game: 'Chess',
    tableShape: '8x8',
    boardSymbols: state().symbols,
    fen: chess.fen(),
    preset: customFen ? 'Custom FEN' : preset.name,
    sideToMove: chess.turn() === 'w' ? 'White' : 'Black',
    ...extra,
  })
  const push = (type: StepType, description: string, indices: number[] = [], extra: Record<string, unknown> = {}) => {
    const board = state()
    makeStep(steps, type, description, board.data, indices, vars(extra), metrics)
  }

  const legalMoves = orderedChessMoves(chess)
  push('select', `${preset.name}: read the board first. ${chess.turn() === 'w' ? 'White' : 'Black'} must choose a legal move.`, [], {
    possibleMoves: legalMoves
      .map((move) => move.san)
      .slice(0, 30)
      .join(', '),
    legalMoveCount: legalMoves.length,
  })

  const candidates = legalMoves.slice(0, 8).map((move) => {
    chess.move(move)
    const replyMoves = orderedChessMoves(chess)
    const reply = replyMoves[0]?.san ?? 'none'
    const score = searchChess(chess, 2).score
    chess.undo()
    return { move, reply, score }
  })
  candidates.forEach(({ move, reply, score }) => {
    metrics.comparisons += 1
    push('compare', `Try ${move.san}. Then imagine the opponent reply ${reply}. Score: ${score}.`, [squareIndex(move.from), squareIndex(move.to)], {
      check: move.san,
      score,
      likelyReply: reply,
      idea: 'A chess engine tries a move, imagines replies, then scores the board.',
    })
  })

  const best = candidates.sort((a, b) => (chess.turn() === 'w' ? b.score - a.score : a.score - b.score))[0]
  if (best) {
    chess.move(best.move)
    metrics.writes += 1
    push(
      'update',
      `Choose ${best.move.san} because it gives the best score after checking replies.`,
      [squareIndex(best.move.from), squareIndex(best.move.to)],
      {
        bestMove: best.move.san,
        score: best.score,
        opponentReplies: orderedChessMoves(chess)
          .map((move) => move.san)
          .slice(0, 24)
          .join(', '),
      },
    )
  }

  const planGame = new Chess(selectedFen === 'startpos' ? undefined : selectedFen)
  const plan = searchChess(planGame, 4).line
  const longPlan: string[] = []
  for (let i = 0; i < 12 && !planGame.isGameOver(); i += 1) {
    const next = searchChess(planGame, Math.min(3, 12 - i)).line[0] ?? orderedChessMoves(planGame)[0]?.san
    if (!next) break
    planGame.move(next)
    longPlan.push(next)
  }
  push('complete', `The computer plan starts: ${longPlan.slice(0, 8).join(' ')}. It can keep extending this line by repeating move, reply, score.`, [], {
    bestLine4Ply: plan.join(' '),
    planNext12Plies: longPlan.join(' '),
    result: 'Analysis complete',
  })
  return steps
}

function sudokuBacktrackingLesson() {
  return gameLesson({
    columns: 9,
    game: 'Sudoku',
    initial: [
      '5',
      '3',
      '',
      '',
      '7',
      '',
      '',
      '',
      '',
      '6',
      '',
      '',
      '1',
      '9',
      '5',
      '',
      '',
      '',
      '',
      '9',
      '8',
      '',
      '',
      '',
      '',
      '6',
      '',
      '8',
      '',
      '',
      '',
      '6',
      '',
      '',
      '',
      '3',
      '4',
      '',
      '',
      '8',
      '',
      '3',
      '',
      '',
      '1',
      '7',
      '',
      '',
      '',
      '2',
      '',
      '',
      '',
      '6',
      '',
      '6',
      '',
      '',
      '',
      '',
      '2',
      '8',
      '',
      '',
      '',
      '',
      '4',
      '1',
      '9',
      '',
      '',
      '5',
      '',
      '',
      '',
      '',
      '8',
      '',
      '',
      '7',
      '9',
    ],
    steps: [
      {
        type: 'select',
        description: 'Pick the first empty cell. Sudoku solves one blank at a time.',
        indices: [2],
        variables: { rule: 'each row, column, and box uses 1-9 once' },
      },
      {
        type: 'compare',
        description: 'Try 1, 2, 3, and 4. Reject numbers already in the row, column, or 3x3 box.',
        indices: [2, 0, 1, 20],
        variables: { candidates: '1, 2, 4' },
      },
      { description: 'Place 4 because it fits all three checks.', indices: [2], symbols: { 2: '4' }, variables: { move: 'place 4' } },
      {
        type: 'compare',
        description: 'If a later cell gets stuck, backtracking returns here and tries the next candidate.',
        indices: [2, 3],
        variables: { algorithm: 'try, recurse, undo if needed' },
      },
    ],
  })
}

function goTerritoryLesson() {
  return gameLesson({
    columns: 9,
    game: 'Go',
    initial: [
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '●',
      '●',
      '',
      '',
      '',
      '○',
      '',
      '',
      '',
      '●',
      '',
      '',
      '',
      '',
      '○',
      '○',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '●',
      '',
      '',
      '○',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '●',
      '',
      '',
      '',
      '○',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ],
    steps: [
      {
        type: 'select',
        description: 'Go stones stay on intersections. Groups need empty neighbor points called liberties.',
        indices: [11, 19],
        variables: { rule: 'groups need liberties' },
      },
      {
        type: 'compare',
        description: 'Count liberties around the white group. Fewer liberties means danger.',
        indices: [24, 25, 34],
        variables: { liberties: 3 },
      },
      {
        description: 'Black plays next to the white group to reduce its liberties.',
        indices: [33],
        symbols: { 33: '●' },
        variables: { move: 'reduce liberties' },
      },
      {
        type: 'compare',
        description: 'Go programs often use search plus pattern evaluation because the board is huge.',
        indices: [33, 24, 25],
        variables: { algorithm: 'territory and liberty evaluation' },
      },
    ],
  })
}

function connectFourLesson() {
  return gameLesson({
    columns: 7,
    game: 'Connect Four',
    initial: [
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '🔴',
      '🟡',
      '',
      '',
      '',
      '',
      '🔴',
      '🟡',
      '🔴',
      '',
      '',
      '',
    ],
    steps: [
      { type: 'select', description: 'Pieces fall to the lowest empty space in the chosen column.', indices: [31, 38], variables: { rule: 'gravity' } },
      {
        type: 'compare',
        description: 'Look for three-in-a-row threats before choosing a column.',
        indices: [30, 37, 38],
        variables: { threat: 'red can build four' },
      },
      { description: 'Yellow drops a piece to block the red threat.', indices: [39], symbols: { 39: '🟡' }, variables: { move: 'block column' } },
      {
        type: 'compare',
        description: 'A Connect Four bot scores windows of four cells and looks ahead at replies.',
        indices: [36, 37, 38, 39],
        variables: { algorithm: 'minimax with window scoring' },
      },
    ],
  })
}

function checkersLesson() {
  return gameLesson({
    columns: 8,
    game: 'Checkers',
    initial: [
      '',
      '⛂',
      '',
      '⛂',
      '',
      '⛂',
      '',
      '⛂',
      '⛂',
      '',
      '⛂',
      '',
      '⛂',
      '',
      '⛂',
      '',
      '',
      '⛂',
      '',
      '',
      '',
      '⛂',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '⛀',
      '',
      '',
      '',
      '',
      '⛀',
      '',
      '⛀',
      '',
      '⛀',
      '',
      '⛀',
      '',
      '',
      '⛀',
      '',
      '⛀',
      '',
      '⛀',
      '',
      '⛀',
      '⛀',
      '',
      '⛀',
      '',
      '⛀',
      '',
      '⛀',
      '',
    ],
    steps: [
      { type: 'select', description: 'Checkers pieces move diagonally on dark squares.', indices: [42], variables: { rule: 'diagonal moves' } },
      {
        type: 'compare',
        description: 'Captures are important: jump over an enemy piece into an empty square.',
        indices: [42, 33, 24],
        variables: { capture: 'jump if possible' },
      },
      {
        description: 'White jumps and removes the black piece.',
        indices: [24, 33, 42],
        symbols: { 42: '', 33: '', 24: '⛀' },
        variables: { move: 'jump capture' },
      },
      {
        type: 'compare',
        description: 'A bot searches captures first because one jump can lead to another jump.',
        indices: [24],
        variables: { algorithm: 'forced capture search' },
      },
    ],
  })
}

function minesweeperLesson() {
  return gameLesson({
    columns: 8,
    game: 'Minesweeper',
    initial: [
      '1',
      '1',
      '1',
      '',
      '',
      '',
      '',
      '',
      '1',
      '💣',
      '1',
      '',
      '',
      '',
      '',
      '',
      '1',
      '1',
      '1',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '1',
      '1',
      '1',
      '',
      '',
      '',
      '',
      '',
      '1',
      '💣',
      '1',
      '',
      '',
      '',
      '',
      '',
      '1',
      '1',
      '1',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ],
    steps: [
      { type: 'select', description: 'Numbers tell how many mines touch that square.', indices: [0, 1, 2], variables: { rule: 'number = nearby mines' } },
      {
        type: 'compare',
        description: 'If a 1 already touches one known mine, all other covered neighbors are safe.',
        indices: [0, 9, 8],
        variables: { inference: 'safe neighbor' },
      },
      { description: 'Reveal a safe square using the number clue.', indices: [8], symbols: { 8: '1' }, variables: { move: 'reveal safe cell' } },
      {
        type: 'compare',
        description: 'Minesweeper solvers use constraints: each number is a small equation about nearby mines.',
        indices: [36, 37, 38],
        variables: { algorithm: 'constraint propagation' },
      },
    ],
  })
}

function twentyFortyEightLesson() {
  return gameLesson({
    columns: 4,
    game: '2048',
    initial: ['2', '', '2', '', '', '4', '', '', '', '', '4', '', '', '', '', ''],
    steps: [
      { type: 'select', description: 'A move slides every tile in one direction.', indices: [0, 2], variables: { rule: 'slide' } },
      { type: 'compare', description: 'Equal tiles merge once per move.', indices: [0, 2], variables: { merge: '2 + 2 = 4' } },
      { description: 'Slide left and merge the two 2 tiles into a 4.', indices: [0], symbols: { 0: '4', 2: '' }, variables: { move: 'left' } },
      {
        type: 'compare',
        description: 'A 2048 bot tries moves, estimates the random new tile, and keeps boards with open space.',
        indices: [0, 5, 10],
        variables: { algorithm: 'expectimax' },
      },
    ],
  })
}

function callStackDemo(input: number[]) {
  const steps: AlgorithmStep[] = []
  const metrics = { ...baseMetrics, memory: input.length }
  input.slice(0, 6).forEach((value, depth) => {
    metrics.recursiveCalls += 1
    makeStep(steps, 'select', `Push recursive frame depth ${depth} with value ${value}.`, input, [depth], { depth, frame: `solve(${depth})` }, metrics)
  })
  input
    .slice(0, 6)
    .reverse()
    .forEach((value, index) => {
      makeStep(steps, 'update', `Return from frame with value ${value}.`, input, [input.length - 1 - index], { unwinding: true }, metrics)
    })
  makeStep(steps, 'complete', 'Call stack visualization complete.', input, [], { stackEmpty: true }, metrics)
  return steps
}

function memoryModelDemo(input: number[]) {
  return demoArray(input.slice(0, 8), 'Memory model', [
    { type: 'select', description: 'Array values occupy contiguous slots.', indices: [0, 1, 2], variables: { memory: 'contiguous array' } },
    { description: 'Node structures store values plus references to other nodes.', indices: [3, 4], variables: { memory: 'heap objects' } },
    { type: 'compare', description: 'Stack frames hold local variables and return addresses.', indices: [5], variables: { stack: 'local variables' } },
  ])
}

function learningFeatureDemo(name: string) {
  return (input: number[]) =>
    demoArray(input.slice(0, 8), name, [
      { type: 'select', description: `${name}: present the learner with a focused prompt.`, indices: [0], variables: { mode: name } },
      {
        type: 'compare',
        description: `${name}: compare the learner response with the expected next state.`,
        indices: [1, 2],
        variables: { feedback: 'instant' },
      },
      { description: `${name}: record progress, notes, or custom data for review.`, indices: [3], variables: { savedLocally: true } },
    ])
}

function suiteDemo(label: string, operations: { description: string; type?: StepType; variables?: Record<string, unknown> }[], size = 8) {
  return (input: number[]) => {
    const data = input.length ? input.slice(0, size) : Array.from({ length: size }, (_, index) => index + 1)
    return demoArray(
      data,
      label,
      operations.map((operation, index) => ({
        ...operation,
        indices: [index % data.length, (index + 1) % data.length].filter((value, itemIndex, values) => values.indexOf(value) === itemIndex),
      })),
    )
  }
}

function divideAndConquerSuite(input: number[]) {
  const data = [...input]
  const steps: AlgorithmStep[] = []
  const metrics = { ...baseMetrics, memory: data.length }
  makeStep(
    steps,
    'partition',
    'Divide the input into left and right subproblems around the midpoint.',
    data,
    [0, Math.max(0, Math.floor(data.length / 2))],
    {
      phase: 'divide',
      pattern: 'split problem',
    },
    metrics,
  )
  metrics.recursiveCalls += 2
  makeStep(
    steps,
    'select',
    'Solve each subproblem recursively until base cases are reached.',
    data,
    [0, Math.max(0, data.length - 1)],
    {
      phase: 'conquer',
      baseCase: 'one item',
    },
    metrics,
  )
  data.sort((a, b) => a - b)
  metrics.comparisons += Math.max(0, data.length - 1)
  metrics.writes += data.length
  makeStep(
    steps,
    'merge',
    'Combine solved subproblems into one sorted result.',
    data,
    data.map((_, index) => index),
    {
      phase: 'combine',
      examples: ['merge sort', 'binary search', 'quick sort'],
    },
    metrics,
  )
  makeStep(
    steps,
    'complete',
    'Divide and conquer suite complete.',
    data,
    data.map((_, index) => index),
    { pattern: 'divide -> conquer -> combine' },
    metrics,
  )
  return steps
}

const completeLearningSuiteModules: AlgorithmModule[] = [
  {
    id: 'learning-dashboard',
    name: 'Learning Dashboard',
    category: 'Data Structures',
    subcategory: 'Learning Tools',
    status: 'live',
    visualMode: 'Array',
    summary: 'Central progress view for next lessons, weak areas, recent practice, and completion state.',
    complexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(n)' },
    flags: ['Progress', 'Recommendations'],
    pseudocode: ['collect local progress', 'rank weak topics', 'choose next module', 'surface review cards'],
    code: 'next = recommend(progress, quizScores, recentRuns)',
    runner: suiteDemo('Learning dashboard', [
      { type: 'select', description: 'Read completed modules, favorites, notes, and quiz scores.', variables: { source: 'local learning state' } },
      { type: 'compare', description: 'Compare current mastery against the curriculum path.', variables: { mastery: 'per category' } },
      { description: 'Recommend the next algorithm and review item.', variables: { nextAction: 'study or review' } },
    ]),
  },
  {
    id: 'curriculum-paths',
    name: 'Curriculum Paths',
    category: 'Data Structures',
    subcategory: 'Learning Tools',
    status: 'live',
    visualMode: 'Array',
    summary: 'Beginner, intermediate, advanced, interview prep, DSA foundations, and competitive programming tracks.',
    complexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(n)' },
    flags: ['Learning path', 'Curriculum'],
    pseudocode: ['choose learner goal', 'load ordered modules', 'unlock checkpoints', 'adapt next recommendation'],
    code: 'path = paths[goal].filter((module) => prerequisitesMet(module))',
    runner: suiteDemo('Curriculum paths', [
      { type: 'select', description: 'Choose a goal-specific path such as DSA foundations or interview prep.', variables: { paths: 6 } },
      { type: 'compare', description: 'Check prerequisites before unlocking the next lesson.', variables: { gate: 'prerequisites met' } },
      { description: 'Advance to checkpoint review after a topic cluster.', variables: { checkpoint: true } },
    ]),
  },
  {
    id: 'prerequisite-graph',
    name: 'Prerequisite Graph',
    category: 'Graphs',
    subcategory: 'Learning Tools',
    status: 'live',
    visualMode: 'Graph',
    summary: 'Maps dependencies such as arrays to searching, recursion to trees, and graphs to shortest paths.',
    complexity: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)' },
    flags: ['Prerequisites', 'DAG'],
    pseudocode: ['model topics as nodes', 'add prerequisite edges', 'topologically order modules', 'highlight blocked topics'],
    code: 'order = topologicalSort(prerequisiteGraph)',
    runner: () =>
      graphSuite('Prerequisite graph', { order: 'Arrays -> Searching -> Recursion -> Trees -> Graphs -> DP', blocked: 'advanced graph algorithms' }),
  },
  {
    id: 'concept-lessons',
    name: 'Concept Lessons',
    category: 'Data Structures',
    subcategory: 'Learning Tools',
    status: 'live',
    visualMode: 'Array',
    summary: 'Short lessons for invariants, recursion, recurrence relations, graph relaxation, and heap properties.',
    complexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(n)' },
    flags: ['Lessons', 'Concepts'],
    pseudocode: ['introduce concept', 'show micro-example', 'link to visual step', 'ask a check question'],
    code: 'lesson = explain(concept, currentStep)',
    runner: suiteDemo('Concept lessons', [
      { type: 'select', description: 'Introduce the concept before the learner runs the animation.', variables: { concept: 'invariant' } },
      { type: 'compare', description: 'Connect the concept to a concrete highlighted step.', variables: { bridge: 'lesson -> simulation' } },
      { description: 'Ask a quick check question before moving on.', variables: { formativeCheck: true } },
    ]),
  },
  {
    id: 'algorithm-exercises',
    name: 'Algorithm Exercises',
    category: 'Data Structures',
    subcategory: 'Learning Tools',
    status: 'live',
    visualMode: 'Array',
    summary: 'Algorithm-specific exercises instead of only generic quiz prompts.',
    complexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(n)' },
    flags: ['Exercises', 'Practice'],
    pseudocode: ['select exercise type', 'bind it to current algorithm', 'grade answer', 'record mastery'],
    code: 'grade(exerciseFor(module), learnerAnswer)',
    runner: suiteDemo('Algorithm exercises', [
      { type: 'select', description: 'Select an exercise matched to the active algorithm.', variables: { exercise: 'targeted' } },
      { type: 'compare', description: 'Compare the learner answer with the expected trace or result.', variables: { grading: 'exact or rubric' } },
      { description: 'Save mastery evidence for the module.', variables: { masteryUpdated: true } },
    ]),
  },
  {
    id: 'step-prediction-mode',
    name: 'Step Prediction Mode',
    category: 'Data Structures',
    subcategory: 'Learning Tools',
    status: 'live',
    visualMode: 'Array',
    summary: 'Predict-next-step practice tied to actual timeline events.',
    complexity: { best: 'O(1)', average: 'O(1)', worst: 'O(1)', space: 'O(1)' },
    flags: ['Prediction', 'Practice'],
    pseudocode: ['read current step', 'hide next step', 'capture prediction', 'reveal feedback'],
    code: 'prediction === nextStep.type ? correct() : explain(nextStep)',
    runner: learningFeatureDemo('Step prediction mode'),
  },
  {
    id: 'bug-fix-mode',
    name: 'Bug-Fix Mode',
    category: 'Data Structures',
    subcategory: 'Learning Tools',
    status: 'live',
    visualMode: 'Array',
    summary: 'Broken pseudocode and code-line repair prompts for common algorithm mistakes.',
    complexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(n)' },
    flags: ['Debugging', 'Practice'],
    pseudocode: ['inject known bug', 'ask learner to identify line', 'run failing trace', 'show corrected logic'],
    code: 'if (buggyLine === answer) showFix()',
    runner: suiteDemo('Bug-fix mode', [
      { type: 'select', description: 'Introduce a realistic off-by-one, invariant, or recurrence bug.', variables: { bug: 'off-by-one' } },
      { type: 'compare', description: 'Run the bad trace until the state diverges.', variables: { divergence: 'detected' } },
      { description: 'Patch the line and replay the corrected behavior.', variables: { fixed: true } },
    ]),
  },
  {
    id: 'trace-table-mode',
    name: 'Trace Table Mode',
    category: 'Dynamic Programming',
    subcategory: 'Learning Tools',
    status: 'live',
    visualMode: 'Matrix',
    summary: 'Trace-table practice for DP, recursion, graph search, searching, and sorting variables.',
    complexity: { best: 'O(n)', average: 'O(nm)', worst: 'O(nm)', space: 'O(nm)' },
    flags: ['Trace table', 'Dry run'],
    pseudocode: ['choose variables', 'advance one step', 'fill row values', 'validate against step metadata'],
    code: 'trace[row] = pick(step.variables, watchedNames)',
    runner: suiteDemo(
      'Trace table mode',
      [
        { type: 'select', description: 'Pick watched variables from the current algorithm.', variables: { watched: ['low', 'mid', 'high', 'dp[i][j]'] } },
        { type: 'compare', description: 'Validate learner-filled cells against step variables.', variables: { feedback: 'cell-level' } },
        { description: 'Highlight the first row where the trace diverges.', variables: { divergenceRow: 2 } },
      ],
      12,
    ),
  },
  {
    id: 'dry-run-worksheet',
    name: 'Dry Run Worksheet',
    category: 'Data Structures',
    subcategory: 'Learning Tools',
    status: 'live',
    visualMode: 'Array',
    summary: 'Fill-in worksheet for variables such as low, mid, high, i, j, and dp cells.',
    complexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)', space: 'O(n)' },
    flags: ['Worksheet', 'Variables'],
    pseudocode: ['create worksheet rows', 'ask learner for variables', 'check against step', 'save attempts'],
    code: 'worksheet.check(step.highlights.variables)',
    runner: suiteDemo('Dry run worksheet', [
      { type: 'select', description: 'Create a row for the current algorithm step.', variables: { row: 1 } },
      { type: 'compare', description: 'Check learner-entered variable values.', variables: { checked: ['i', 'j', 'target'] } },
      { description: 'Store missed variables for review.', variables: { reviewQueue: ['mid'] } },
    ]),
  },
  {
    id: 'assessment-engine',
    name: 'Assessment Engine',
    category: 'Data Structures',
    subcategory: 'Learning Tools',
    status: 'live',
    visualMode: 'Array',
    summary: 'Topic quizzes, timed checks, final module tests, and mastery scores.',
    complexity: { best: 'O(1)', average: 'O(q)', worst: 'O(q)', space: 'O(q)' },
    flags: ['Assessment', 'Mastery'],
    pseudocode: ['sample questions', 'grade answers', 'update mastery', 'schedule review'],
    code: 'mastery[moduleId] = score(correct, total, confidence)',
    runner: suiteDemo('Assessment engine', [
      { type: 'select', description: 'Sample quiz items for the active topic.', variables: { mode: 'topic quiz' } },
      { type: 'compare', description: 'Grade answer and confidence together.', variables: { scoring: 'correctness + confidence' } },
      { description: 'Update mastery and review due date.', variables: { mastery: 0.82 } },
    ]),
  },
  {
    id: 'spaced-review',
    name: 'Spaced Review',
    category: 'Data Structures',
    subcategory: 'Learning Tools',
    status: 'live',
    visualMode: 'Array',
    summary: 'Review missed concepts after one day, three days, seven days, and later intervals.',
    complexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n log n)', space: 'O(n)' },
    flags: ['Spaced repetition', 'Review'],
    pseudocode: ['record miss', 'compute interval', 'sort due cards', 'ask review prompt'],
    code: 'dueAt = now + intervalFor(confidence)',
    runner: suiteDemo('Spaced review', [
      { type: 'select', description: 'Record a missed concept or uncertain answer.', variables: { miss: 'recurrence relation' } },
      { type: 'compare', description: 'Choose the next interval from confidence and history.', variables: { interval: '3 days' } },
      { description: 'Add the item to the due review queue.', variables: { dueQueue: true } },
    ]),
  },
  {
    id: 'hints-system',
    name: 'Hints System',
    category: 'Data Structures',
    subcategory: 'Learning Tools',
    status: 'live',
    visualMode: 'Array',
    summary: 'Tiered hints from concept hint to formula hint to next-step hint.',
    complexity: { best: 'O(1)', average: 'O(1)', worst: 'O(1)', space: 'O(1)' },
    flags: ['Hints', 'Scaffolding'],
    pseudocode: ['start with broad hint', 'reveal stronger hint on request', 'avoid giving answer first', 'record hint usage'],
    code: 'hint = hints[level++]',
    runner: suiteDemo('Hints system', [
      { type: 'select', description: 'Show a concept-level hint first.', variables: { level: 1 } },
      { type: 'compare', description: 'Escalate only if the learner still needs help.', variables: { level: 2 } },
      { description: 'Reveal the next-step hint and record hint usage.', variables: { level: 3 } },
    ]),
  },
  {
    id: 'multi-language-code',
    name: 'Multi-Language Code',
    category: 'Data Structures',
    subcategory: 'Learning Tools',
    status: 'live',
    visualMode: 'Array',
    summary: 'Language-toggle learning for TypeScript, Python, Java, and C++ implementations.',
    complexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(n)' },
    flags: ['Code', 'Languages'],
    pseudocode: ['select language', 'load implementation', 'sync active line', 'compare idioms'],
    code: 'snippet = implementations[moduleId][language]',
    runner: suiteDemo('Multi-language code', [
      { type: 'select', description: 'Choose a language implementation for the same algorithm.', variables: { languages: ['TS', 'Python', 'Java', 'C++'] } },
      { type: 'compare', description: 'Map each snippet back to shared pseudocode.', variables: { sync: 'pseudocode line' } },
      { description: 'Explain language-specific idioms without changing the algorithm.', variables: { idioms: true } },
    ]),
  },
  {
    id: 'code-runner-sandbox',
    name: 'Code Runner Sandbox',
    category: 'Data Structures',
    subcategory: 'Learning Tools',
    status: 'live',
    visualMode: 'Array',
    summary: 'Editable-code workflow with examples, run results, and comparison against expected output.',
    complexity: { best: 'O(1)', average: 'O(t)', worst: 'O(t)', space: 'O(t)' },
    flags: ['Sandbox', 'Code runner'],
    pseudocode: ['edit code', 'run sample tests', 'capture output', 'compare expected values'],
    code: 'result = sandbox.run(code, tests)',
    runner: suiteDemo('Code runner sandbox', [
      { type: 'select', description: 'Load starter code and sample tests.', variables: { sandbox: 'local exercise' } },
      { type: 'compare', description: 'Compare output against expected results.', variables: { testsPassed: 2 } },
      { description: 'Show failing input with the relevant algorithm step.', variables: { failureExplained: true } },
    ]),
  },
  {
    id: 'custom-test-cases',
    name: 'Custom Test Cases',
    category: 'Data Structures',
    subcategory: 'Learning Tools',
    status: 'live',
    visualMode: 'Array',
    summary: 'Learner-created inputs with expected output validation and edge-case prompts.',
    complexity: { best: 'O(1)', average: 'O(t)', worst: 'O(t)', space: 'O(t)' },
    flags: ['Testing', 'Edge cases'],
    pseudocode: ['enter input', 'enter expected output', 'run algorithm', 'compare result'],
    code: 'assertEqual(run(input), expected)',
    runner: suiteDemo('Custom test cases', [
      { type: 'select', description: 'Add an edge-case input and expected result.', variables: { case: 'duplicates' } },
      { type: 'compare', description: 'Run the algorithm and compare final output.', variables: { assertion: 'exact match' } },
      { description: 'Save reusable cases for later practice.', variables: { saved: true } },
    ]),
  },
  {
    id: 'mistake-analytics',
    name: 'Mistake Analytics',
    category: 'Data Structures',
    subcategory: 'Learning Tools',
    status: 'live',
    visualMode: 'Array',
    summary: 'Tracks missed complexity, wrong step predictions, recurrence mistakes, and off-by-one errors.',
    complexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(n)' },
    flags: ['Analytics', 'Mistakes'],
    pseudocode: ['classify miss', 'count pattern', 'rank weak concepts', 'recommend practice'],
    code: 'weakAreas = groupBy(misses, "concept")',
    runner: suiteDemo('Mistake analytics', [
      { type: 'select', description: 'Classify a missed answer by concept.', variables: { concept: 'off-by-one' } },
      { type: 'compare', description: 'Compare recent misses against historical patterns.', variables: { trend: 'recurring' } },
      { description: 'Recommend a focused review exercise.', variables: { recommendation: 'bounds practice' } },
    ]),
  },
  {
    id: 'certificates-and-milestones',
    name: 'Certificates and Milestones',
    category: 'Data Structures',
    subcategory: 'Learning Tools',
    status: 'live',
    visualMode: 'Array',
    summary: 'Completion state, milestones, badges, and certificate-ready topic mastery.',
    complexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(n)' },
    flags: ['Milestones', 'Completion'],
    pseudocode: ['check completed modules', 'verify assessments', 'award milestone', 'prepare certificate state'],
    code: 'award(pathId) if mastery >= threshold',
    runner: suiteDemo('Certificates and milestones', [
      { type: 'select', description: 'Check completed modules in the current path.', variables: { complete: 8 } },
      { type: 'compare', description: 'Verify mastery threshold before awarding a milestone.', variables: { threshold: '80%' } },
      { description: 'Record badge and certificate-ready state locally.', variables: { badge: 'DSA Foundations' } },
    ]),
  },
  {
    id: 'matrix-grid-renderer-suite',
    name: 'Matrix/Grid Renderer Suite',
    category: 'Matrix / Grid',
    subcategory: 'Learning Tools',
    status: 'live',
    visualMode: 'Matrix',
    summary: 'Cell-grid learning renderer for DP tables, maze grids, flood fill, pathfinding, and matrix transforms.',
    complexity: { best: 'O(1)', average: 'O(rc)', worst: 'O(rc)', space: 'O(rc)' },
    flags: ['Grid', 'Renderer'],
    pseudocode: ['parse rows and columns', 'map values to cells', 'highlight active neighbors', 'render table state'],
    code: 'cell = grid[row][column]; highlight(neighbors(cell))',
    runner: suiteDemo(
      'Matrix/grid renderer suite',
      [
        { type: 'select', description: 'Parse a flattened state into row and column cells.', variables: { shape: 'rows x columns' } },
        { type: 'compare', description: 'Highlight neighbors and dependency arrows.', variables: { neighbors: ['up', 'left', 'right', 'down'] } },
        { description: 'Render DP, maze, and matrix-operation states with the same cell model.', variables: { reusableRenderer: true } },
      ],
      12,
    ),
  },
]

const algorithmPatternSuiteModules: AlgorithmModule[] = [
  {
    id: 'greedy-suite',
    name: 'Greedy Suite',
    category: 'Greedy',
    subcategory: 'Patterns',
    status: 'live',
    visualMode: 'Array',
    summary: 'Scheduling, fractional knapsack, interval selection, Huffman-style choices, and greedy-vs-DP tradeoffs.',
    complexity: { best: 'O(n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)' },
    flags: ['Greedy choice', 'Exchange argument'],
    pseudocode: ['sort or prioritize candidates', 'choose the best local option', 'prove the choice is safe', 'repeat until complete'],
    code: 'if (isSafe(choice)) solution.push(choice)',
    runner: suiteDemo('Greedy suite', [
      { type: 'select', description: 'Sort candidates by finish time, ratio, weight, or priority.', variables: { strategy: 'local optimum' } },
      { type: 'compare', description: 'Check whether the local choice is safe to commit.', variables: { proof: 'exchange argument' } },
      { description: 'Commit the choice and shrink the remaining problem.', variables: { committed: true } },
    ]),
  },
  {
    id: 'number-theory-suite',
    name: 'Number Theory Suite',
    category: 'Number Theory',
    subcategory: 'Math Foundations',
    status: 'live',
    visualMode: 'Array',
    summary: 'GCD, sieve, modular arithmetic, fast exponentiation, primality checks, totients, and RSA-supporting math.',
    complexity: { best: 'O(log n)', average: 'O(n log log n)', worst: 'O(n log log n)', space: 'O(n)' },
    flags: ['GCD', 'Primes', 'Modulo'],
    pseudocode: ['reduce with gcd', 'mark composite numbers', 'multiply under modulo', 'reuse powers by squaring'],
    code: 'while (b) [a, b] = [b, a % b]',
    runner: suiteDemo('Number theory suite', [
      { type: 'compare', description: 'Euclid reduces gcd(a, b) to gcd(b, a mod b).', variables: { algorithm: 'Euclid' } },
      { type: 'update', description: 'Sieve marks composite multiples after each prime.', variables: { algorithm: 'Sieve' } },
      { type: 'select', description: 'Fast exponentiation selects powers from binary bits.', variables: { algorithm: 'Binary exponentiation' } },
    ]),
  },
  {
    id: 'matrix-grid-suite',
    name: 'Matrix/Grid Suite',
    category: 'Matrix / Grid',
    subcategory: 'Core Algorithms',
    status: 'live',
    visualMode: 'Matrix',
    summary: 'Flood fill, island counting, maze BFS, matrix rotation, prefix sums, and cellular automata.',
    complexity: { best: 'O(rc)', average: 'O(rc)', worst: 'O(rc)', space: 'O(rc)' },
    flags: ['Grid traversal', 'Cells'],
    pseudocode: ['visit a cell', 'check valid neighbors', 'update matrix state', 'repeat until frontier is empty'],
    code: 'for (const [dr, dc] of dirs) visit(row + dr, col + dc)',
    runner: suiteDemo(
      'Matrix/grid suite',
      [
        { type: 'visit', description: 'Visit the active cell and mark it reached.', variables: { pattern: 'flood fill' } },
        { type: 'compare', description: 'Check neighbor bounds, walls, and visited state.', variables: { directions: 4 } },
        { description: 'Update the grid layer, path, or transformed value.', variables: { update: 'cell state' } },
      ],
      12,
    ),
  },
  {
    id: 'string-pattern-matching-suite',
    name: 'String Pattern Matching Suite',
    category: 'Strings',
    subcategory: 'Pattern Search',
    status: 'live',
    visualMode: 'Array',
    summary: 'KMP, Rabin-Karp, Z algorithm, prefix functions, rolling hashes, and palindrome checks.',
    complexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n + m)', space: 'O(n)' },
    flags: ['Pattern matching', 'Prefix function'],
    pseudocode: ['precompute pattern metadata', 'scan text', 'reuse matched prefix', 'report match positions'],
    code: 'while (j > 0 && text[i] !== pattern[j]) j = pi[j - 1]',
    runner: suiteDemo('String pattern matching suite', [
      { type: 'select', description: 'Build prefix, Z, or rolling-hash metadata for the pattern.', variables: { preprocessing: true } },
      { type: 'compare', description: 'Compare text and pattern without restarting from scratch.', variables: { fallback: 'prefix link' } },
      { description: 'Report the matched window and continue scanning.', variables: { matchFound: true } },
    ]),
  },
  {
    id: 'advanced-graph-suite',
    name: 'Advanced Graph Suite',
    category: 'Graphs',
    subcategory: 'Advanced',
    status: 'live',
    visualMode: 'Graph',
    summary: 'Bridges, articulation points, Eulerian paths, max flow, bipartite matching, and graph coloring.',
    complexity: { best: 'O(V + E)', average: 'O(VE)', worst: 'O(VE)', space: 'O(V + E)' },
    flags: ['Lowlink', 'Flow', 'Matching'],
    pseudocode: ['track discovery metadata', 'update lowlinks or residual capacity', 'choose augmenting structure', 'commit graph update'],
    code: 'if (low[child] > tin[node]) bridge(edge)',
    runner: () => graphSuite('Advanced graph suite', { algorithms: ['Bridges', 'Articulation Points', 'Eulerian Path', 'Max Flow', 'Bipartite Matching'] }),
  },
  {
    id: 'sliding-window-two-pointers-suite',
    name: 'Sliding Window / Two Pointers Suite',
    category: 'Searching',
    subcategory: 'Patterns',
    status: 'live',
    visualMode: 'Array',
    summary: 'Fixed windows, variable windows, opposite pointers, fast/slow pointers, and partition-style scans.',
    complexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)', space: 'O(1)' },
    flags: ['Two pointers', 'Sliding window'],
    pseudocode: ['move right pointer', 'update window state', 'shrink left pointer when invalid', 'record best answer'],
    code: 'while (!valid(window)) left += 1',
    runner: suiteDemo('Sliding window and two pointers suite', [
      { type: 'select', description: 'Expand the right pointer to include a new value.', variables: { right: 0 } },
      { type: 'compare', description: 'Check whether the current window violates the constraint.', variables: { valid: false } },
      { description: 'Move the left pointer until the invariant returns.', variables: { left: 1 } },
    ]),
  },
  {
    id: 'recursion-fundamentals-suite',
    name: 'Recursion Fundamentals Suite',
    category: 'Data Structures',
    subcategory: 'Runtime Model',
    status: 'live',
    visualMode: 'Array',
    summary: 'Base cases, recursive cases, stack frames, divide steps, backtracking, and unwinding.',
    complexity: { best: 'O(depth)', average: 'O(branch^depth)', worst: 'O(branch^depth)', space: 'O(depth)' },
    flags: ['Recursion', 'Call stack'],
    pseudocode: ['check base case', 'create stack frame', 'recurse on smaller input', 'unwind result'],
    code: 'return base ? value : combine(solve(smaller))',
    runner: callStackDemo,
  },
  {
    id: 'bit-manipulation-suite',
    name: 'Bit Manipulation Suite',
    category: 'Number Theory',
    subcategory: 'Bitwise Patterns',
    status: 'live',
    visualMode: 'Array',
    summary: 'Masks, shifts, XOR tricks, lowbit, subsets, parity, and power-of-two checks.',
    complexity: { best: 'O(1)', average: 'O(bits)', worst: 'O(2^n)', space: 'O(1)' },
    flags: ['Bits', 'Masks'],
    pseudocode: ['build mask', 'test bit', 'toggle or clear bit', 'use lowbit or xor invariant'],
    code: 'mask & (1 << bit); x &= x - 1',
    runner: suiteDemo('Bit manipulation suite', [
      { type: 'select', description: 'Select the bit mask for the current position.', variables: { mask: '1 << bit' } },
      { type: 'compare', description: 'Test whether the bit is set.', variables: { operation: 'AND' } },
      { description: 'Toggle, clear, or accumulate the bitwise result.', variables: { operation: 'XOR/lowbit' } },
    ]),
  },
  {
    id: 'divide-and-conquer-suite',
    name: 'Divide and Conquer Suite',
    category: 'Sorting',
    subcategory: 'Patterns',
    status: 'live',
    visualMode: 'Array',
    summary: 'Split, solve, combine pattern across merge sort, quick sort, binary search, and closest-pair style problems.',
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n^2)', space: 'O(n)' },
    flags: ['Divide and conquer', 'Recursion'],
    pseudocode: ['divide problem', 'solve subproblems', 'combine answers', 'stop at base case'],
    code: 'return combine(solve(left), solve(right))',
    runner: divideAndConquerSuite,
  },
  {
    id: 'interview-patterns-suite',
    name: 'Interview Patterns Suite',
    category: 'Data Structures',
    subcategory: 'Learning Tools',
    status: 'live',
    visualMode: 'Array',
    summary: 'When-to-use cards for sorted input, monotonic structures, overlapping subproblems, greedy choices, and graph frontiers.',
    complexity: { best: 'O(1)', average: 'Varies', worst: 'Varies', space: 'Varies' },
    flags: ['Interview prep', 'Patterns'],
    pseudocode: ['read problem signal', 'choose pattern', 'state invariant', 'test edge cases'],
    code: 'pattern = infer(problemSignals)',
    runner: suiteDemo('Interview patterns suite', [
      { type: 'select', description: 'Identify the problem signal from input constraints and wording.', variables: { signal: 'sorted input' } },
      { type: 'compare', description: 'Compare candidate patterns before choosing one.', variables: { candidates: ['binary search', 'two pointers'] } },
      { description: 'State the invariant and edge cases before coding.', variables: { invariant: true } },
    ]),
  },
]

const remainingCoverageModules: AlgorithmModule[] = [
  {
    id: 'advanced-searching-suite',
    name: 'Advanced Searching Suite',
    category: 'Searching',
    subcategory: 'Advanced Variants',
    status: 'live',
    visualMode: 'Array',
    summary: 'Jump search, exponential search, interpolation search, ternary search, and answer-space binary search.',
    complexity: { best: 'O(1)', average: 'O(log n)', worst: 'O(n)', space: 'O(1)' },
    flags: ['Sorted data', 'Search variants'],
    pseudocode: ['choose probing strategy', 'bound the candidate range', 'compare probe with target', 'shrink or scan the range'],
    code: 'probe = chooseProbe(low, high, target); adjustRange(probe)',
    runner: suiteDemo('Advanced searching suite', [
      { type: 'select', description: 'Jump or exponential search chooses a probe before scanning locally.', variables: { variant: 'jump/exponential' } },
      { type: 'compare', description: 'Interpolation search estimates a likely probe from value distribution.', variables: { variant: 'interpolation' } },
      { description: 'Answer-space binary search checks whether a candidate answer is feasible.', variables: { variant: 'binary search on answer' } },
    ]),
  },
  {
    id: 'advanced-sorting-suite',
    name: 'Advanced Sorting Suite',
    category: 'Sorting',
    subcategory: 'Advanced Variants',
    status: 'live',
    visualMode: 'Array',
    summary: 'Bucket sort, TimSort, IntroSort, stable partitioning, and hybrid sorting strategy selection.',
    complexity: { best: 'O(n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)' },
    flags: ['Hybrid sort', 'Buckets'],
    pseudocode: ['inspect input shape', 'choose bucket, run, heap, or insertion strategy', 'sort local regions', 'merge or collect regions'],
    code: 'strategy = chooseSort(inputShape); return strategy.sort(values)',
    runner: (input) => {
      const data = [...input]
      const steps: AlgorithmStep[] = []
      const metrics = { ...baseMetrics, memory: data.length }
      makeStep(
        steps,
        'select',
        'Detect input shape to choose bucket, TimSort, or IntroSort strategy.',
        data,
        [0],
        { strategies: ['Bucket', 'TimSort', 'IntroSort'] },
        metrics,
      )
      metrics.comparisons += data.length
      makeStep(
        steps,
        'compare',
        'Compare local runs or bucket ranges before ordering each region.',
        data,
        [0, Math.max(0, data.length - 1)],
        { phase: 'local ordering' },
        metrics,
      )
      data.sort((a, b) => a - b)
      metrics.writes += data.length
      makeStep(
        steps,
        'merge',
        'Collect sorted buckets or merge detected runs into the final order.',
        data,
        data.map((_, index) => index),
        { stableMerge: true },
        metrics,
      )
      makeStep(
        steps,
        'complete',
        'Advanced sorting suite complete.',
        data,
        data.map((_, index) => index),
        { sorted: true },
        metrics,
      )
      return steps
    },
  },
  {
    id: 'prefix-sum-difference-suite',
    name: 'Prefix Sum / Difference Suite',
    category: 'Dynamic Programming',
    subcategory: 'Range Patterns',
    status: 'live',
    visualMode: 'Array',
    summary: 'Prefix sums, 2D prefix sums, difference arrays, range updates, and subarray-sum patterns.',
    complexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(n)' },
    flags: ['Prefix sums', 'Range updates'],
    pseudocode: ['build cumulative state', 'answer range query by subtraction', 'mark difference endpoints', 'recover values by scanning'],
    code: 'rangeSum(l, r) = prefix[r + 1] - prefix[l]',
    runner: suiteDemo('Prefix sum and difference suite', [
      { type: 'update', description: 'Build prefix[i] from prefix[i - 1] plus the current value.', variables: { structure: 'prefix sum' } },
      { type: 'compare', description: 'Answer a range query by subtracting two prefix states.', variables: { query: '[l, r]' } },
      { description: 'Apply a range update by marking two difference-array endpoints.', variables: { structure: 'difference array' } },
    ]),
  },
  {
    id: 'monotonic-stack-queue-suite',
    name: 'Monotonic Stack / Queue Suite',
    category: 'Data Structures',
    subcategory: 'Linear Structures',
    status: 'live',
    visualMode: 'Array',
    summary: 'Next greater element, stock span, histogram area, sliding-window maximum, and deque invariants.',
    complexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)', space: 'O(n)' },
    flags: ['Monotonic structure', 'Stack', 'Deque'],
    pseudocode: ['keep structure monotonic', 'pop dominated values', 'push current index', 'read answer from top or front'],
    code: 'while (stack.length && value >= stack.at(-1)) stack.pop()',
    runner: suiteDemo('Monotonic stack and queue suite', [
      { type: 'compare', description: 'Pop dominated values until the invariant is restored.', variables: { invariant: 'monotonic decreasing' } },
      { type: 'update', description: 'Push the current index after weaker candidates are removed.', variables: { operation: 'push index' } },
      { description: 'Read next greater, span, area, or window maximum from the structure.', variables: { answerSource: 'top/front' } },
    ]),
  },
  {
    id: 'tree-algorithms-suite',
    name: 'Tree Algorithms Suite',
    category: 'Data Structures',
    subcategory: 'Trees',
    status: 'live',
    visualMode: 'Tree',
    summary: 'Lowest common ancestor, tree height, diameter, subtree aggregation, serialization, and traversal-derived properties.',
    complexity: { best: 'O(log n)', average: 'O(n)', worst: 'O(n)', space: 'O(h)' },
    flags: ['Trees', 'LCA', 'DFS'],
    pseudocode: ['visit child subtrees', 'return aggregate values', 'combine child answers', 'answer path or ancestor query'],
    code: 'return combine(solve(node.left), solve(node.right), node)',
    runner: () =>
      graphSuite('Tree algorithms suite', { algorithms: ['LCA', 'Diameter', 'Height', 'Serialize', 'Subtree DP'], treePattern: 'postorder aggregate' }),
  },
  {
    id: 'graph-representation-suite',
    name: 'Graph Representation Suite',
    category: 'Graphs',
    subcategory: 'Foundations',
    status: 'live',
    visualMode: 'Graph',
    summary: 'Adjacency lists, adjacency matrices, edge lists, weighted graphs, directed graphs, and input normalization.',
    complexity: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V^2)', space: 'O(V + E)' },
    flags: ['Graph modeling', 'Input shape'],
    pseudocode: ['parse edges', 'choose representation', 'normalize directed or weighted data', 'feed traversal or path algorithm'],
    code: 'adj[u].push({ to: v, weight })',
    runner: () => graphSuite('Graph representation suite', { representations: ['adjacency list', 'matrix', 'edge list'], directed: true, weighted: true }),
  },
  {
    id: 'formula-glossary-sheet',
    name: 'Formula and Glossary Sheet',
    category: 'Data Structures',
    subcategory: 'Learning Tools',
    status: 'live',
    visualMode: 'Array',
    summary: 'Quick reference for complexity classes, invariants, recurrence forms, graph terms, and data-structure vocabulary.',
    complexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(n)' },
    flags: ['Glossary', 'Reference'],
    pseudocode: ['collect terms', 'group by topic', 'link each term to modules', 'surface examples during practice'],
    code: 'glossary.lookup(term).examples',
    runner: suiteDemo('Formula and glossary sheet', [
      { type: 'select', description: 'Group formulas and terms by topic.', variables: { groups: ['Complexity', 'Graphs', 'DP', 'Trees'] } },
      { type: 'compare', description: 'Match the active step to a relevant vocabulary term.', variables: { term: 'invariant' } },
      { description: 'Show a compact example linked to the current module.', variables: { contextual: true } },
    ]),
  },
  {
    id: 'flashcards-drill-mode',
    name: 'Flashcards Drill Mode',
    category: 'Data Structures',
    subcategory: 'Learning Tools',
    status: 'live',
    visualMode: 'Array',
    summary: 'Rapid recall cards for complexities, use cases, invariants, edge cases, and pattern selection.',
    complexity: { best: 'O(1)', average: 'O(c)', worst: 'O(c)', space: 'O(c)' },
    flags: ['Flashcards', 'Recall'],
    pseudocode: ['draw due card', 'capture recall quality', 'show answer', 'reschedule card'],
    code: 'card.interval = nextInterval(recallQuality)',
    runner: suiteDemo('Flashcards drill mode', [
      { type: 'select', description: 'Draw the next due card from the review queue.', variables: { cardType: 'complexity' } },
      { type: 'compare', description: 'Compare learner recall quality with the expected answer.', variables: { recall: 'partial' } },
      { description: 'Reschedule the card using spaced repetition.', variables: { nextInterval: '3 days' } },
    ]),
  },
  {
    id: 'challenge-mode',
    name: 'Challenge Mode',
    category: 'Data Structures',
    subcategory: 'Learning Tools',
    status: 'live',
    visualMode: 'Array',
    summary: 'Timed mixed-topic drills, streaks, mastery gates, and final-review challenge sets.',
    complexity: { best: 'O(1)', average: 'O(q)', worst: 'O(q)', space: 'O(q)' },
    flags: ['Timed practice', 'Mastery'],
    pseudocode: ['choose mixed prompt set', 'run timer', 'grade each response', 'update streak and mastery'],
    code: 'challenge.score = gradeAll(responses, timer)',
    runner: suiteDemo('Challenge mode', [
      { type: 'select', description: 'Select a mixed set across weak and due topics.', variables: { mode: 'mixed review' } },
      { type: 'compare', description: 'Grade each response while the timer is running.', variables: { timed: true } },
      { description: 'Update streak, mastery, and next recommendations.', variables: { streak: 5 } },
    ]),
  },
  {
    id: 'progress-portability',
    name: 'Progress Portability',
    category: 'Data Structures',
    subcategory: 'Learning Tools',
    status: 'live',
    visualMode: 'Array',
    summary: 'Import and export learning progress, notes, quiz scores, saved experiments, and review queues.',
    complexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(n)' },
    flags: ['Import', 'Export', 'Progress'],
    pseudocode: ['collect local learning data', 'serialize portable report', 'validate import shape', 'merge restored progress'],
    code: 'backup = exportLearningState(localStorage, indexedDb)',
    runner: suiteDemo('Progress portability', [
      { type: 'select', description: 'Collect notes, completions, quiz scores, and experiments.', variables: { sources: ['localStorage', 'IndexedDB'] } },
      { type: 'compare', description: 'Validate imported progress before merging.', variables: { schemaValid: true } },
      { description: 'Restore the learner state without overwriting newer local work.', variables: { mergeStrategy: 'newest wins' } },
    ]),
  },
]

const missingKitModules: AlgorithmModule[] = [
  ...completeLearningSuiteModules,
  ...algorithmPatternSuiteModules,
  ...remainingCoverageModules,
  {
    id: 'linked-list-suite',
    name: 'Linked List Suite',
    category: 'Data Structures',
    subcategory: 'Linked Structures',
    status: 'live',
    visualMode: 'Array',
    summary: 'Singly, doubly, and circular linked-list operations with pointer rewiring.',
    complexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(n)' },
    flags: ['Pointers', 'Insertion', 'Deletion'],
    pseudocode: ['create head node', 'rewire next and previous links', 'delete by bypassing node', 'reverse links'],
    code: 'node.next = next; prev.next = node; current.next = prev',
    runner: linkedListSuite,
  },
  {
    id: 'hash-table-suite',
    name: 'Hash Table Suite',
    category: 'Data Structures',
    subcategory: 'Hash Structures',
    status: 'live',
    visualMode: 'Array',
    summary: 'Hashing, collisions, probing, chaining concepts, load factor, and rehash triggers.',
    complexity: { best: 'O(1)', average: 'O(1)', worst: 'O(n)', space: 'O(n)' },
    flags: ['Hashing', 'Collisions'],
    pseudocode: ['compute hash', 'probe or chain on collision', 'insert key', 'rehash when load factor is high'],
    code: 'slot = hash(key) % capacity; while (table[slot]) slot++',
    runner: hashTableSuite,
  },
  {
    id: 'binary-search-tree-operations',
    name: 'Binary Search Tree Operations',
    category: 'Data Structures',
    subcategory: 'Trees',
    status: 'live',
    visualMode: 'Tree',
    summary: 'BST insert, search, min/max, successor, predecessor, and delete cases.',
    complexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(n)', space: 'O(h)' },
    flags: ['BST', 'Ordered tree'],
    pseudocode: ['compare with node', 'go left or right', 'insert/search/delete', 'repair delete case'],
    code: 'value < node.value ? node.left : node.right',
    runner: bstOperations,
  },
  {
    id: 'avl-tree-rotations',
    name: 'AVL Tree Rotations',
    category: 'Data Structures',
    subcategory: 'Balanced Trees',
    status: 'live',
    visualMode: 'Tree',
    summary: 'LL, RR, LR, and RL rotations with balance-factor reasoning.',
    complexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)', space: 'O(h)' },
    flags: ['Balanced tree', 'Rotations'],
    pseudocode: ['insert as BST', 'update height', 'detect imbalance', 'rotate to restore balance'],
    code: 'if (balance > 1) rotateRight(node); if (balance < -1) rotateLeft(node)',
    runner: () => rotationDemo('AVL rotation'),
  },
  {
    id: 'red-black-tree-visualization',
    name: 'Red-Black Tree Visualization',
    category: 'Data Structures',
    subcategory: 'Balanced Trees',
    status: 'live',
    visualMode: 'Tree',
    summary: 'Red-black insert/delete fixups, rotations, recoloring, and black-height rules.',
    complexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)', space: 'O(h)' },
    flags: ['Balanced tree', 'Color invariants'],
    pseudocode: ['insert red node', 'recolor parent and uncle', 'rotate on triangle/line', 'force root black'],
    code: 'while (parent.color === RED) fixViolation(node)',
    runner: () => rotationDemo('Red-black fixup'),
  },
  {
    id: 'heap-priority-queue-operations',
    name: 'Heap / Priority Queue Operations',
    category: 'Data Structures',
    subcategory: 'Heaps',
    status: 'live',
    visualMode: 'Array',
    summary: 'Insert, build heap, heapify, extract, and priority queue ordering.',
    complexity: { best: 'O(1)', average: 'O(log n)', worst: 'O(log n)', space: 'O(n)' },
    flags: ['Heap', 'Priority queue'],
    pseudocode: ['insert at end', 'bubble up', 'extract root', 'heapify down'],
    code: 'push(value); while (parent < child) swap(parent, child)',
    runner: heapPriorityQueue,
  },
  {
    id: 'trie-prefix-tree',
    name: 'Trie / Prefix Tree',
    category: 'Data Structures',
    subcategory: 'String Structures',
    status: 'live',
    visualMode: 'Array',
    summary: 'Insert, search, delete, autocomplete, and prefix counting.',
    complexity: { best: 'O(k)', average: 'O(k)', worst: 'O(k)', space: 'O(total characters)' },
    flags: ['Prefix search'],
    pseudocode: ['walk one character at a time', 'create missing child', 'mark terminal', 'collect prefix matches'],
    code: 'node = node.children[ch] ??= new TrieNode()',
    runner: trieDemo,
  },
  {
    id: 'disjoint-set-union',
    name: 'Disjoint Set Union',
    category: 'Data Structures',
    subcategory: 'Set Structures',
    status: 'live',
    visualMode: 'Array',
    summary: 'Union by representative with path compression and Kruskal-style connectivity.',
    complexity: { best: 'O(alpha(n))', average: 'O(alpha(n))', worst: 'O(alpha(n))', space: 'O(n)' },
    flags: ['Union find', 'Path compression'],
    pseudocode: ['find parent recursively', 'compress path', 'union smaller rank under larger', 'answer connected queries'],
    code: 'parent[x] = find(parent[x]); union(rootA, rootB)',
    runner: dsuDemo,
  },
  {
    id: 'segment-tree',
    name: 'Segment Tree',
    category: 'Data Structures',
    subcategory: 'Range Queries',
    status: 'live',
    visualMode: 'Array',
    summary: 'Range queries, point updates, and lazy propagation for interval data.',
    complexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)', space: 'O(n)' },
    flags: ['Range query', 'Lazy propagation'],
    pseudocode: ['build interval tree', 'split query range', 'update leaf', 'recompute ancestors'],
    code: 'query(node, left, right); update(index, value)',
    runner: segmentTreeDemo,
  },
  {
    id: 'fenwick-tree',
    name: 'Fenwick Tree / Binary Indexed Tree',
    category: 'Data Structures',
    subcategory: 'Range Queries',
    status: 'live',
    visualMode: 'Array',
    summary: 'Prefix sums and point updates using lowbit jumps.',
    complexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)', space: 'O(n)' },
    flags: ['Prefix sums', 'Bit manipulation'],
    pseudocode: ['update while i <= n', 'i += i & -i', 'query while i > 0', 'i -= i & -i'],
    code: 'for (; i <= n; i += i & -i) bit[i] += delta',
    runner: fenwickTreeDemo,
  },
  {
    id: 'deque-circular-queue',
    name: 'Deque and Circular Queue',
    category: 'Data Structures',
    subcategory: 'Linear Structures',
    status: 'live',
    visualMode: 'Array',
    summary: 'Front/rear pointer operations, wraparound, overflow, and underflow.',
    complexity: { best: 'O(1)', average: 'O(1)', worst: 'O(1)', space: 'O(n)' },
    flags: ['Deque', 'Circular buffer'],
    pseudocode: ['advance rear modulo capacity', 'advance front modulo capacity', 'detect full and empty', 'avoid shifting'],
    code: 'rear = (rear + 1) % capacity',
    runner: dequeCircularQueue,
  },
  {
    id: 'expression-trees',
    name: 'Expression Trees',
    category: 'Data Structures',
    subcategory: 'Trees',
    status: 'live',
    visualMode: 'Tree',
    summary: 'Infix, postfix, prefix conversion and expression evaluation through trees.',
    complexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)', space: 'O(n)' },
    flags: ['Expression parsing'],
    pseudocode: ['parse operator precedence', 'build operator nodes', 'traverse prefix/infix/postfix', 'evaluate bottom up'],
    code: 'postorder(node.left); postorder(node.right); apply(node.operator)',
    runner: expressionTreeDemo,
  },
  {
    id: 'skip-list',
    name: 'Skip List',
    category: 'Data Structures',
    subcategory: 'Probabilistic Structures',
    status: 'live',
    visualMode: 'Array',
    summary: 'Probabilistic levels for search, insert, and delete.',
    complexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(n)', space: 'O(n log n)' },
    flags: ['Probabilistic', 'Ordered set'],
    pseudocode: ['start at top level', 'move right while safe', 'drop down', 'splice tower on insert'],
    code: 'while (next.key < target) moveRight(); moveDown()',
    runner: skipListDemo,
  },
  {
    id: 'b-tree-b-plus-tree',
    name: 'B-Tree / B+ Tree',
    category: 'Data Structures',
    subcategory: 'Database Trees',
    status: 'live',
    visualMode: 'Array',
    summary: 'Database-style node splits, promotions, merges, and range scans.',
    complexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)', space: 'O(n)' },
    flags: ['Database index', 'Multiway tree'],
    pseudocode: ['insert into leaf', 'split overflow', 'promote median', 'borrow or merge on underflow'],
    code: 'if (node.keys.length > maxKeys) split(node)',
    runner: bTreeDemo,
  },
  {
    id: 'graph-shortest-paths-suite',
    name: 'Graph Shortest Paths Suite',
    category: 'Graphs',
    subcategory: 'Shortest Paths',
    status: 'live',
    visualMode: 'Graph',
    summary: 'Dijkstra, Bellman-Ford, Floyd-Warshall, and A* pathfinding concepts.',
    complexity: { best: 'O(E log V)', average: 'O(E log V)', worst: 'O(VE)', space: 'O(V)' },
    flags: ['Shortest paths', 'Weighted graph'],
    pseudocode: ['relax edges', 'choose next frontier', 'update distance', 'reconstruct path'],
    code: 'if (dist[u] + w < dist[v]) dist[v] = dist[u] + w',
    runner: () => graphSuite('Shortest paths', { distances: { A: 0, B: 2, D: 3, G: 12 }, algorithm: 'Dijkstra/Bellman-Ford/A*' }),
  },
  {
    id: 'graph-mst-suite',
    name: 'Graph MST Suite',
    category: 'Graphs',
    subcategory: 'Minimum Spanning Tree',
    status: 'live',
    visualMode: 'Graph',
    summary: 'Prim and Kruskal with edge choices and DSU cycle checks.',
    complexity: { best: 'O(E log V)', average: 'O(E log V)', worst: 'O(E log V)', space: 'O(V)' },
    flags: ['MST', 'Greedy'],
    pseudocode: ['sort or prioritize edges', 'choose cheapest safe edge', 'skip cycles', 'stop at V - 1 edges'],
    code: 'if (find(u) !== find(v)) addEdge(u, v)',
    runner: () => graphSuite('Minimum spanning tree', { edgesChosen: ['A-B', 'B-D', 'B-E', 'D-F', 'F-G', 'A-C'] }),
  },
  {
    id: 'topological-sort-suite',
    name: 'Topological Sort Suite',
    category: 'Graphs',
    subcategory: 'Ordering',
    status: 'live',
    visualMode: 'Graph',
    summary: 'Kahn and DFS topological sorting with cycle detection.',
    complexity: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)' },
    flags: ['DAG', 'Cycle detection'],
    pseudocode: ['compute indegrees', 'enqueue zero-indegree nodes', 'remove outgoing edges', 'detect leftover cycle'],
    code: 'if (--indegree[next] === 0) queue.push(next)',
    runner: () => graphSuite('Topological sort', { order: 'A -> B -> C -> D -> E -> F -> G', cycleDetected: false }),
  },
  {
    id: 'strongly-connected-components',
    name: 'Strongly Connected Components',
    category: 'Graphs',
    subcategory: 'Components',
    status: 'live',
    visualMode: 'Graph',
    summary: 'Kosaraju and Tarjan stack/finish-time component discovery.',
    complexity: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)' },
    flags: ['Directed graph', 'Stack'],
    pseudocode: ['run DFS finish times', 'reverse graph or track lowlinks', 'pop component roots', 'label SCCs'],
    code: 'if (lowlink[v] === index[v]) popComponent()',
    runner: () => graphSuite('Strongly connected components', { components: ['A,B,C', 'D,E,F', 'G'] }),
  },
  {
    id: 'dynamic-programming-suite',
    name: 'Dynamic Programming Suite',
    category: 'Dynamic Programming',
    subcategory: 'Tabulation and Memoization',
    status: 'live',
    visualMode: 'Matrix',
    summary: 'Fibonacci, coin change, LCS, edit distance, and knapsack-style state transitions in shared DP tables.',
    complexity: { best: 'O(n)', average: 'O(nm)', worst: 'O(nm)', space: 'O(nm)' },
    flags: ['Memoization', 'Tabulation', 'Overlapping subproblems'],
    pseudocode: ['define state meaning', 'initialize base cases', 'apply recurrence transition', 'read the final table answer'],
    code: 'dp[state] = best(transition(previousStates))',
    runner: dynamicProgrammingSuite,
  },
  {
    id: 'backtracking-suite',
    name: 'Backtracking Suite',
    category: 'Backtracking',
    subcategory: 'Constraint Search',
    status: 'live',
    visualMode: 'Matrix',
    summary: 'N-Queens and Sudoku-style constraint search with recursive choices, pruning, and undo steps.',
    complexity: { best: 'O(n)', average: 'O(n!)', worst: 'O(n!)', space: 'O(n^2)' },
    flags: ['N-Queens', 'Sudoku', 'Constraint pruning'],
    pseudocode: ['choose the next empty position', 'try each valid candidate', 'recurse with the candidate committed', 'undo candidate when the branch fails'],
    code: 'if (isValid(choice)) { place(choice); solve(next); undo(choice); }',
    runner: backtrackingSuite,
  },
  {
    id: 'advanced-string-structures',
    name: 'Advanced String Structures',
    category: 'Strings',
    subcategory: 'String Structures',
    status: 'live',
    visualMode: 'Array',
    summary: 'Trie, suffix array, suffix tree preview, and Aho-Corasick matching.',
    complexity: { best: 'O(n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)' },
    flags: ['Suffixes', 'Multi-pattern'],
    pseudocode: ['insert prefixes', 'sort suffixes', 'compute shared prefixes', 'follow failure links'],
    code: 'patterns.forEach(insertTrie); buildFailureLinks()',
    runner: stringStructureDemo,
  },
  {
    id: 'recursion-call-stack-visualizer',
    name: 'Recursion and Call Stack Visualizer',
    category: 'Data Structures',
    subcategory: 'Runtime Model',
    status: 'live',
    visualMode: 'Array',
    summary: 'Generic stack-frame tracing for recursive algorithms and backtracking.',
    complexity: { best: 'O(depth)', average: 'O(depth)', worst: 'O(depth)', space: 'O(depth)' },
    flags: ['Recursion', 'Call stack'],
    pseudocode: ['push frame', 'recurse to child', 'hit base case', 'unwind return values'],
    code: 'function solve(i) { if (base) return; solve(i + 1); }',
    runner: callStackDemo,
  },
  {
    id: 'memory-model-view',
    name: 'Memory Model View',
    category: 'Data Structures',
    subcategory: 'Runtime Model',
    status: 'live',
    visualMode: 'Array',
    summary: 'Array slots, pointer references, object nodes, and stack versus heap.',
    complexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(n)' },
    flags: ['Memory', 'Pointers'],
    pseudocode: ['place primitives in slots', 'allocate objects on heap', 'store references', 'release stack frames'],
    code: 'const node = { value, next }; stackFrame.local = node',
    runner: memoryModelDemo,
  },
  {
    id: 'interactive-exercises-mode',
    name: 'Interactive Exercises Mode',
    category: 'Data Structures',
    subcategory: 'Learning Tools',
    status: 'live',
    visualMode: 'Array',
    summary: 'Predict-next-step, fix-the-bug, fill-pseudocode, and output quizzes.',
    complexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(n)' },
    flags: ['Practice', 'Assessment'],
    pseudocode: ['show prompt', 'capture answer', 'compare expected step', 'give feedback'],
    code: 'answer === expected ? markCorrect() : showHint()',
    runner: learningFeatureDemo('Interactive exercises'),
  },
  {
    id: 'complexity-lab',
    name: 'Complexity Lab',
    category: 'Data Structures',
    subcategory: 'Learning Tools',
    status: 'live',
    visualMode: 'Array',
    summary: 'Compare step counts, reads, writes, comparisons, and memory across input sizes.',
    complexity: { best: 'O(1)', average: 'O(n log n)', worst: 'O(n^2)', space: 'Varies' },
    flags: ['Metrics', 'Experiments'],
    pseudocode: ['run algorithm on small n', 'double input size', 'record metrics', 'plot growth'],
    code: 'sizes.map((n) => run(inputOfSize(n)).metrics)',
    runner: learningFeatureDemo('Complexity lab'),
  },
  {
    id: 'custom-data-structure-builder',
    name: 'Custom Data Structure Builder',
    category: 'Data Structures',
    subcategory: 'Learning Tools',
    status: 'live',
    visualMode: 'Array',
    summary: 'Manual input workflows for arrays, trees, graphs, grids, and node structures.',
    complexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(n)' },
    flags: ['Custom input', 'Builder'],
    pseudocode: ['read learner input', 'validate shape', 'normalize data', 'feed runner'],
    code: 'const model = parseUserStructure(inputText)',
    runner: learningFeatureDemo('Custom data builder'),
  },
  {
    id: 'learning-paths-assessments',
    name: 'Learning Paths and Assessments',
    category: 'Data Structures',
    subcategory: 'Learning Tools',
    status: 'live',
    visualMode: 'Array',
    summary: 'Beginner, intermediate, and advanced tracks with checkpoints and review prompts.',
    complexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(n)' },
    flags: ['Learning path', 'Assessment'],
    pseudocode: ['choose path', 'complete module', 'score quiz', 'schedule review'],
    code: 'progress[moduleId] = { complete: true, reviewDue }',
    runner: learningFeatureDemo('Learning paths'),
  },
]

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
  {
    id: 'tic-tac-toe-minimax',
    name: 'Tic Tac Toe Minimax',
    category: 'Games',
    subcategory: 'Board games',
    status: 'live',
    visualMode: 'Matrix',
    summary: 'Learn the rules, threats, blocks, and simple look-ahead strategy on a 3x3 board.',
    complexity: { best: 'O(1)', average: 'O(b^d)', worst: 'O(9!)', space: 'O(d)' },
    flags: ['Game tree', 'Minimax', 'Solved game'],
    pseudocode: ['find empty squares', 'try one move ahead', 'block any immediate threat', 'choose the safest move'],
    code: 'try each empty square, imagine the reply, then keep the safest move',
    runner: ticTacToeMinimax,
  },
  {
    id: 'chess-minimax',
    name: 'Chess Look-Ahead',
    category: 'Games',
    subcategory: 'Board games',
    status: 'live',
    visualMode: 'Matrix',
    summary: 'Learn legal moves, king safety, board scoring, and simple chess engine look-ahead.',
    complexity: { best: 'O(1)', average: 'O(b^d)', worst: 'O(35^d)', space: 'O(d)' },
    flags: ['Game tree', 'Minimax', 'Board evaluation'],
    pseudocode: ['generate legal moves', 'remove moves that leave king in check', 'score replies', 'choose the safest move'],
    code: 'for each legal move: make move, score opponent replies, keep best score',
    runner: chessMinimaxLesson,
  },
  {
    id: 'sudoku-backtracking-game',
    name: 'Sudoku Backtracking',
    category: 'Games',
    subcategory: 'Constraint puzzles',
    status: 'live',
    visualMode: 'Matrix',
    summary: 'Learn Sudoku row, column, and box rules through try, check, recurse, and undo.',
    complexity: { best: 'O(n)', average: 'O(9^e)', worst: 'O(9^e)', space: 'O(e)' },
    flags: ['Backtracking', 'Constraint solving'],
    pseudocode: ['pick an empty cell', 'try a valid digit', 'continue recursively', 'undo if stuck'],
    code: 'if digit fits row, column, and box: place it; solve rest; otherwise undo',
    runner: sudokuBacktrackingLesson,
  },
  {
    id: 'go-liberties-territory',
    name: 'Go Liberties and Territory',
    category: 'Games',
    subcategory: 'Strategy games',
    status: 'live',
    visualMode: 'Matrix',
    summary: 'Learn stones, groups, liberties, captures, and territory evaluation on a small Go board.',
    complexity: { best: 'O(1)', average: 'O(b^d)', worst: 'Very high', space: 'O(board)' },
    flags: ['Territory', 'Liberties', 'Pattern evaluation'],
    pseudocode: ['find connected groups', 'count liberties', 'reduce opponent liberties', 'estimate territory'],
    code: 'group = floodFill(stones); liberties = emptyNeighbors(group)',
    runner: goTerritoryLesson,
  },
  {
    id: 'connect-four-minimax',
    name: 'Connect Four Look-Ahead',
    category: 'Games',
    subcategory: 'Board games',
    status: 'live',
    visualMode: 'Matrix',
    summary: 'Learn gravity, four-in-a-row threats, blocking, and window scoring.',
    complexity: { best: 'O(1)', average: 'O(7^d)', worst: 'O(7^d)', space: 'O(d)' },
    flags: ['Minimax', 'Gravity', 'Window scoring'],
    pseudocode: ['drop into a column', 'scan windows of four', 'block urgent threats', 'look ahead at replies'],
    code: 'score every 4-cell window, then minimax over legal columns',
    runner: connectFourLesson,
  },
  {
    id: 'checkers-capture-search',
    name: 'Checkers Capture Search',
    category: 'Games',
    subcategory: 'Board games',
    status: 'live',
    visualMode: 'Matrix',
    summary: 'Learn diagonal moves, forced captures, jump chains, and move search.',
    complexity: { best: 'O(1)', average: 'O(b^d)', worst: 'O(b^d)', space: 'O(d)' },
    flags: ['Forced captures', 'Game tree'],
    pseudocode: ['find legal diagonal moves', 'prefer captures', 'continue jump chains', 'score the board'],
    code: 'if captures exist, search capture chains before quiet moves',
    runner: checkersLesson,
  },
  {
    id: 'minesweeper-constraints',
    name: 'Minesweeper Constraints',
    category: 'Games',
    subcategory: 'Constraint puzzles',
    status: 'live',
    visualMode: 'Matrix',
    summary: 'Learn number clues, safe squares, mine flags, and constraint propagation.',
    complexity: { best: 'O(n)', average: 'Varies', worst: 'NP-complete', space: 'O(n)' },
    flags: ['Constraints', 'Inference'],
    pseudocode: ['read number clue', 'count known mines', 'mark safe neighbors', 'repeat constraints'],
    code: 'if clue mines are already known, remaining covered neighbors are safe',
    runner: minesweeperLesson,
  },
  {
    id: 'twenty-forty-eight-expectimax',
    name: '2048 Expectimax',
    category: 'Games',
    subcategory: 'Strategy games',
    status: 'live',
    visualMode: 'Matrix',
    summary: 'Learn sliding tiles, merging, random tile spawns, and expectimax-style move choice.',
    complexity: { best: 'O(1)', average: 'O(4^d r^d)', worst: 'O(4^d r^d)', space: 'O(d)' },
    flags: ['Expectimax', 'Random tiles', 'Board scoring'],
    pseudocode: ['slide tiles', 'merge equal neighbors', 'estimate random new tile', 'keep the best board shape'],
    code: 'score(move) = average(score(randomTileAfter(move)))',
    runner: twentyFortyEightLesson,
  },
  ...missingKitModules,
]

export const plannedModules: AlgorithmModule[] = []

export const allModules = [...algorithmModules, ...plannedModules]
import { Chess, type PieceSymbol, type Square } from 'chess.js'
