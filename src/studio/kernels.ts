import type { Trace } from './trace'

// @algorithm bubble-sort
export function bubble(a: number[], target: number, t: Trace) {
  void target
  const n = a.length // @line initialize
  t.emit('initialize', { n, i: null, j: null, swapped: false }, [], 'Read the array length. No comparisons have happened yet.')
  for (let i = 0; i < n - 1; i++) {
    // @line outer-loop
    t.emit('outer-loop', { i, j: null }, [], `Pass ${i + 1}: move the largest remaining value to the right.`)
    let swapped = false // @line reset-swapped
    t.emit('reset-swapped', { swapped }, [], 'Start this pass with swapped = false.')
    for (let j = 0; j < n - i - 1; j++) {
      // @line inner-loop
      t.emit('inner-loop', { j }, [j, j + 1], `Comparison ${j + 1} of pass ${i + 1}.`)
      t.emit(
        'compare',
        { left: a[j], right: a[j + 1], condition: a[j] > a[j + 1], comparison: `${a[j]} > ${a[j + 1]}` },
        [j, j + 1],
        `${a[j]} ${a[j] > a[j + 1] ? 'is greater than' : 'is not greater than'} ${a[j + 1]}. ${a[j] > a[j + 1] ? 'These neighbors must exchange places.' : 'Keep their order.'}`,
        'compare',
      )
      if (a[j] > a[j + 1]) {
        // @line compare
        ;[a[j], a[j + 1]] = [a[j + 1], a[j]] // @line swap
        t.emit('swap', {}, [j, j + 1], `Exchange only positions ${j} and ${j + 1}.`, 'swap')
        swapped = true // @line set-swapped
        t.emit('set-swapped', { swapped }, [], 'Record that this pass changed the order.')
      }
    }
    t.sorted.add(n - i - 1)
    t.emit(
      'early-exit',
      { swapped, j: null },
      [],
      `Pass ${i + 1} is finished. Position ${n - i - 1} is now final. ${swapped ? 'Continue with a shorter range.' : 'No swaps: every neighbor is ordered, so the whole array is sorted.'}`,
    )
    if (!swapped) break // @line early-exit
  }
  return a // @line return
}

// @algorithm selection-sort
export function selection(a: number[], target: number, t: Trace) {
  void target
  const n = a.length // @line initialize
  t.emit('initialize', { n, i: null, j: null, minIndex: null })
  for (let i = 0; i < n - 1; i++) {
    // @line outer-loop
    let minIndex = i // @line select-min
    t.emit('select-min', { i, minIndex, j: null }, [i], `Find the smallest value in positions ${i} through ${n - 1}.`)
    for (let j = i + 1; j < n; j++) {
      // @line inner-loop
      t.emit(
        'compare',
        { j, left: a[j], right: a[minIndex], comparison: `${a[j]} < ${a[minIndex]}`, condition: a[j] < a[minIndex] },
        [j, minIndex],
        `Compare candidate ${a[j]} with current minimum ${a[minIndex]}.`,
        'compare',
      )
      if (a[j] < a[minIndex]) {
        // @line compare
        minIndex = j // @line update-min
        t.emit('update-min', { minIndex }, [j], `${a[j]} is the new minimum. Remember index ${j}.`)
      }
    }
    if (minIndex !== i) {
      // @line check-swap
      ;[a[i], a[minIndex]] = [a[minIndex], a[i]] // @line swap
      t.emit('swap', {}, [i, minIndex], `Put the minimum at position ${i}.`, 'swap')
    }
    t.sorted.add(i)
    t.emit('outer-loop', {}, [i], `Position ${i} is final. The sorted prefix grows by one.`)
  }
  return a // @line return
}

// @algorithm insertion-sort
export function insertion(a: number[], target: number, t: Trace) {
  void target
  const n = a.length // @line initialize
  t.emit('initialize', { n })
  for (let i = 1; i < n; i++) {
    // @line outer-loop
    const key = a[i] // @line select-key
    let j = i - 1
    t.emit('select-key', { i, j, key }, [i], `Insert ${key} into the ordered prefix.`)
    while (j >= 0) {
      // @line inner-loop
      t.emit(
        'compare',
        { j, left: a[j], right: key, comparison: `${a[j]} <= ${key}`, condition: a[j] <= key },
        [j],
        `Compare ${a[j]} with held key ${key}.`,
        'compare',
      )
      if (a[j] <= key) break // @line compare
      a[j + 1] = a[j] // @line shift
      t.emit('shift', {}, [j + 1], `Shift ${a[j]} right; the key stays in temporary storage.`, 'update')
      j-- // @line inner-back
    }
    a[j + 1] = key // @line write-key
    t.emit('write-key', { j }, [j + 1], `Insert ${key} into the gap at ${j + 1}.`, 'update')
  }
  return a // @line return
}

// @algorithm binary-insertion-sort
export function binaryInsertion(a: number[], target: number, t: Trace) {
  void target
  const n = a.length // @line initialize
  t.emit('initialize', { n })
  for (let i = 1; i < n; i++) {
    // @line outer-loop
    const key = a[i] // @line select-key
    let low = 0,
      high = i
    t.emit('select-key', { i, key, low, high }, [i], `Find a stable insertion position for ${key}.`)
    while (low < high) {
      // @line inner-loop
      const mid = Math.floor((low + high) / 2) // @line midpoint
      t.emit(
        'compare',
        { low, high, mid, left: a[mid], right: key, comparison: `${a[mid]} <= ${key}`, condition: a[mid] <= key },
        [mid],
        `Search the ordered prefix at index ${mid}.`,
        'compare',
      )
      if (a[mid] <= key)
        low = mid + 1 // @line compare
      else high = mid // @line narrow-left
    }
    for (let j = i; j > low; j--) {
      // @line shift-loop
      a[j] = a[j - 1] // @line shift
      t.emit('shift', { j, low, high }, [j], `Shift position ${j - 1} into ${j}.`, 'update')
    }
    a[low] = key // @line write-key
    t.emit('write-key', { low }, [low], `Insert ${key} after any equal keys.`, 'update')
  }
  return a // @line return
}

// @algorithm shell-sort
export function shell(a: number[], target: number, t: Trace) {
  void target
  const n = a.length // @line initialize
  t.emit('initialize', { n })
  for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
    // @line outer-loop
    t.emit('outer-loop', { gap }, [], `Use gap ${gap}. Each gap chain is insertion-sorted.`)
    for (let i = gap; i < n; i++) {
      // @line inner-loop
      const key = a[i] // @line select-key
      let j = i
      t.emit('select-key', { i, j, key }, [i])
      while (j >= gap) {
        // @line gap-loop
        t.emit(
          'compare',
          { j, left: a[j - gap], right: key, comparison: `${a[j - gap]} <= ${key}`, condition: a[j - gap] <= key },
          [j - gap],
          `Compare along the gap-${gap} chain.`,
          'compare',
        )
        if (a[j - gap] <= key) break // @line compare
        a[j] = a[j - gap] // @line shift
        t.emit('shift', {}, [j], `Shift ${a[j]} across the gap.`, 'update')
        j -= gap
      }
      a[j] = key // @line write-key
      t.emit('write-key', { j }, [j], `Place held key ${key}.`, 'update')
    }
  }
  return a // @line return
}

// @algorithm cocktail-shaker-sort
export function cocktail(a: number[], target: number, t: Trace) {
  void target
  let start = 0,
    end = a.length - 1,
    swapped = true // @line initialize
  t.emit('initialize', { n: a.length, start, end, swapped })
  while (swapped && start < end) {
    // @line outer-loop
    swapped = false
    for (let i = start; i < end; i++) {
      // @line inner-loop
      t.emit(
        'compare-forward',
        { i, start, end, left: a[i], right: a[i + 1], comparison: `${a[i]} > ${a[i + 1]}`, condition: a[i] > a[i + 1] },
        [i, i + 1],
        'Forward pass: compare neighbors.',
        'compare',
      )
      if (a[i] > a[i + 1]) {
        // @line compare-forward
        ;[a[i], a[i + 1]] = [a[i + 1], a[i]] // @line swap-forward
        swapped = true
        t.emit('swap-forward', { swapped }, [i, i + 1], 'Exchange the out-of-order neighbors.', 'swap')
      }
    }
    t.sorted.add(end)
    t.emit('early-exit', { swapped }, [], swapped ? 'The maximum is final; sweep backward next.' : 'No exchanges were needed. The array is ordered.')
    if (!swapped) break // @line early-exit
    end--
    swapped = false
    for (let i = end - 1; i >= start; i--) {
      // @line backward-loop
      t.emit(
        'compare-backward',
        { i, start, end, left: a[i], right: a[i + 1], comparison: `${a[i]} > ${a[i + 1]}`, condition: a[i] > a[i + 1] },
        [i, i + 1],
        'Backward pass: bring the minimum to the left.',
        'compare',
      )
      if (a[i] > a[i + 1]) {
        // @line compare-backward
        ;[a[i], a[i + 1]] = [a[i + 1], a[i]] // @line swap-backward
        swapped = true
        t.emit('swap-backward', { swapped }, [i, i + 1], 'Exchange these neighbors.', 'swap')
      }
    }
    t.sorted.add(start)
    start++
  }
  return a // @line return
}

// @algorithm comb-sort
export function comb(a: number[], target: number, t: Trace) {
  void target
  let gap = a.length,
    swapped = true // @line initialize
  t.emit('initialize', { n: a.length, gap, swapped })
  while (gap > 1 || swapped) {
    // @line outer-loop
    gap = Math.max(1, Math.floor(gap / 1.3)) // @line shrink-gap
    swapped = false
    t.emit('shrink-gap', { gap, swapped }, [], `Shrink the comparison gap to ${gap}.`)
    for (let i = 0; i + gap < a.length; i++) {
      // @line inner-loop
      t.emit(
        'compare',
        { i, left: a[i], right: a[i + gap], comparison: `${a[i]} > ${a[i + gap]}`, condition: a[i] > a[i + gap] },
        [i, i + gap],
        `Compare positions ${i} and ${i + gap}.`,
        'compare',
      )
      if (a[i] > a[i + gap]) {
        // @line compare
        ;[a[i], a[i + gap]] = [a[i + gap], a[i]] // @line swap
        swapped = true
        t.emit('swap', { swapped }, [i, i + gap], 'Exchange the gap pair.', 'swap')
      }
    }
  }
  return a // @line return
}

// @algorithm gnome-sort
export function gnome(a: number[], target: number, t: Trace) {
  void target
  let i = 0 // @line initialize
  t.emit('initialize', { n: a.length, i })
  while (i < a.length) {
    // @line outer-loop
    if (i === 0) {
      i++
      continue
    } // @line first-position
    t.emit(
      'compare',
      { i, left: a[i - 1], right: a[i], comparison: `${a[i - 1]} <= ${a[i]}`, condition: a[i - 1] <= a[i] },
      [i - 1, i],
      'Check whether these neighbors are ordered.',
      'compare',
    )
    if (a[i - 1] <= a[i])
      i++ // @line compare
    else {
      ;[a[i - 1], a[i]] = [a[i], a[i - 1]] // @line swap
      t.emit('swap', {}, [i - 1, i], 'Exchange the neighbors, then walk back one position.', 'swap')
      i-- // @line backtrack
    }
  }
  return a // @line return
}

// @algorithm quick-sort
export function quick(a: number[], target: number, t: Trace) {
  void target
  function sort(low: number, high: number) {
    // @line recurse
    if (low >= high) return // @line base-case
    const pivot = a[high] // @line pivot
    let i = low
    t.emit('pivot', { low, high, pivot, i }, [high], `Partition ${low}–${high} around ${pivot}.`, 'partition')
    for (let j = low; j < high; j++) {
      // @line inner-loop
      t.emit(
        'compare',
        { j, i, left: a[j], right: pivot, comparison: `${a[j]} <= ${pivot}`, condition: a[j] <= pivot },
        [j, high],
        `Compare ${a[j]} with pivot ${pivot}.`,
        'compare',
      )
      if (a[j] <= pivot) {
        // @line compare
        ;[a[i], a[j]] = [a[j], a[i]] // @line swap
        t.emit('swap', {}, [i, j], 'Move this value into the lower partition.', 'swap')
        i++
      }
    }
    ;[a[i], a[high]] = [a[high], a[i]] // @line place-pivot
    t.sorted.add(i)
    t.emit('place-pivot', { i }, [i, high], `Pivot ${pivot} reaches final position ${i}.`, 'swap')
    t.emit('sort-left', { low, high }, [], 'Sort the left partition, then the right partition.')
    sort(low, i - 1) // @line sort-left
    sort(i + 1, high) // @line sort-right
  }
  t.emit('initialize', { n: a.length })
  sort(0, a.length - 1) // @line initialize
  return a // @line return
}

// @algorithm merge-sort
export function merge(a: number[], target: number, t: Trace) {
  void target
  function sort(low: number, high: number) {
    // @line recurse
    if (high - low <= 1) return // @line base-case
    const mid = Math.floor((low + high) / 2) // @line split
    t.emit('split', { low, high, mid }, [], `Split the half-open range [${low}, ${high}) at ${mid}.`, 'partition')
    sort(low, mid) // @line sort-left
    sort(mid, high) // @line sort-right
    const left = a.slice(low, mid),
      right = a.slice(mid, high) // @line copy-halves
    let i = 0,
      j = 0,
      k = low
    t.emit('copy-halves', { low, high, mid, leftBuffer: [...left], rightBuffer: [...right] })
    while (i < left.length && j < right.length) {
      // @line inner-loop
      t.emit(
        'compare',
        { i, j, k, left: left[i], right: right[j], comparison: `${left[i]} <= ${right[j]}`, condition: left[i] <= right[j] },
        [],
        'Compare the heads of the two auxiliary buffers.',
        'compare',
      )
      const takeLeft = left[i] <= right[j] // @line compare
      a[k] = takeLeft ? left[i++] : right[j++] // @line merge-write
      t.emit('merge-write', { i, j, k }, [k], `Write ${a[k]} into position ${k}.`, 'merge')
      k++
    }
    while (i < left.length) {
      // @line left-tail
      a[k] = left[i++] // @line write-left
      t.emit('write-left', { i, j, k }, [k], 'Copy the remaining left-buffer value.', 'merge')
      k++
    }
    while (j < right.length) {
      // @line right-tail
      a[k] = right[j++] // @line write-right
      t.emit('write-right', { i, j, k }, [k], 'Copy the remaining right-buffer value.', 'merge')
      k++
    }
  }
  t.emit('initialize', { n: a.length })
  sort(0, a.length) // @line initialize
  return a // @line return
}

// @algorithm heap-sort
export function heap(a: number[], target: number, t: Trace) {
  void target
  function heapify(size: number, root: number) {
    // @line recurse
    let largest = root // @line select-root
    const left = 2 * root + 1,
      right = left + 1
    t.emit('select-root', { size, root, largest, leftChild: left, rightChild: right }, [root])
    if (left < size) {
      t.emit(
        'compare-left',
        { left: a[left], right: a[largest], comparison: `${a[left]} > ${a[largest]}`, condition: a[left] > a[largest] },
        [left, largest],
        'Compare the left child with the largest candidate.',
        'compare',
      )
      if (a[left] > a[largest]) largest = left // @line compare-left
    }
    if (right < size) {
      t.emit(
        'compare-right',
        { largest, left: a[right], right: a[largest], comparison: `${a[right]} > ${a[largest]}`, condition: a[right] > a[largest] },
        [right, largest],
        'Compare the right child with the largest candidate.',
        'compare',
      )
      if (a[right] > a[largest]) largest = right // @line compare-right
    }
    if (largest !== root) {
      ;[a[root], a[largest]] = [a[largest], a[root]] // @line heap-swap
      t.emit('heap-swap', { largest }, [root, largest], 'Restore the max-heap property.', 'swap')
      heapify(size, largest)
    }
  }
  t.emit('initialize', { n: a.length })
  for (let i = Math.floor(a.length / 2) - 1; i >= 0; i--) heapify(a.length, i) // @line initialize
  for (let end = a.length - 1; end > 0; end--) {
    // @line outer-loop
    ;[a[0], a[end]] = [a[end], a[0]] // @line extract-max
    t.sorted.add(end)
    t.emit('extract-max', { end }, [0, end], `Put the heap maximum at final position ${end}.`, 'swap')
    heapify(end, 0) // @line restore-heap
  }
  return a // @line return
}

// @algorithm counting-sort
export function counting(a: number[], target: number, t: Trace) {
  void target
  const min = Math.min(...a, 0),
    max = Math.max(...a, 0) // @line initialize
  const counts = Array(max - min + 1).fill(0) // @line allocate
  t.emit('initialize', { n: a.length, min, max })
  for (let i = 0; i < a.length; i++) {
    // @line outer-loop
    counts[a[i] - min]++ // @line count
    t.emit('count', { i, value: a[i], count: counts[a[i] - min] }, [i], `Count one occurrence of ${a[i]} using offset ${min}.`)
  }
  let k = 0
  for (let bucket = 0; bucket < counts.length; bucket++) {
    // @line bucket-loop
    for (let repeat = 0; repeat < counts[bucket]; repeat++) {
      // @line inner-loop
      a[k] = bucket + min // @line write
      t.sorted.add(k)
      t.emit('write', { bucket, repeat, k }, [k], `Write ${a[k]} from its count bucket.`, 'update')
      k++
    }
  }
  return a // @line return
}

// @algorithm radix-sort
export function radix(a: number[], target: number, t: Trace) {
  void target
  const max = Math.max(...a, 0) // @line initialize
  t.emit('initialize', { n: a.length, max })
  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
    // @line outer-loop
    const buckets: number[][] = Array.from({ length: 10 }, () => []) // @line buckets
    t.emit('buckets', { exp }, [], `Start a stable digit pass at place ${exp}.`)
    for (let i = 0; i < a.length; i++) {
      // @line inner-loop
      const digit = Math.floor(a[i] / exp) % 10 // @line digit
      buckets[digit].push(a[i]) // @line distribute
      t.emit('distribute', { i, digit, value: a[i] }, [i], `Place ${a[i]} in bucket ${digit}.`)
    }
    let k = 0
    for (const bucket of buckets) {
      for (const value of bucket) {
        a[k] = value // @line collect
        t.emit('collect', { k, value }, [k], `Collect ${value}, preserving order within its bucket.`, 'update')
        k++
      }
    }
  }
  return a // @line return
}

// @algorithm linear-search
export function linear(a: number[], target: number, t: Trace) {
  t.emit('initialize', { n: a.length, target })
  for (let i = 0; i < a.length; i++) {
    // @line initialize
    t.emit(
      'compare',
      { i, left: a[i], right: target, comparison: `${a[i]} === ${target}`, condition: a[i] === target },
      [i],
      `Check position ${i} against target ${target}.`,
      'compare',
    )
    if (a[i] === target) {
      // @line compare
      t.emit('found', { result: i }, [i], `Found ${target} at index ${i}.`)
      return i // @line found
    }
  }
  return -1 // @line return
}

// @algorithm sentinel-linear-search
export function sentinel(a: number[], target: number, t: Trace) {
  const n = a.length // @line initialize
  a.push(target) // @line sentinel
  let i = 0
  t.emit('sentinel', { n, target, i }, [n], 'Append a temporary sentinel. It is not part of the original dataset.')
  while (true) {
    // @line inner-loop
    t.emit(
      'compare',
      { i, left: a[i], right: target, comparison: `${a[i]} === ${target}`, condition: a[i] === target },
      [i],
      'Scan until a value equals the target.',
      'compare',
    )
    if (a[i] === target) break // @line compare
    i++
  }
  a.pop() // @line restore
  t.emit('restore', { i }, [], 'Remove the temporary sentinel before returning the result.')
  return i < n ? i : -1 // @line return
}

// @algorithm recursive-linear-search
export function recursiveLinear(a: number[], target: number, t: Trace) {
  function search(i: number): number {
    // @line recurse
    t.emit('base-case', { i, n: a.length, target }, [], `Recursive call at index ${i}.`)
    if (i >= a.length) return -1 // @line base-case
    t.emit(
      'compare',
      { left: a[i], right: target, comparison: `${a[i]} === ${target}`, condition: a[i] === target },
      [i],
      'Check this recursive call’s value.',
      'compare',
    )
    if (a[i] === target) return i // @line compare
    return search(i + 1) // @line next-call
  }
  return search(0) // @line return
}

// @algorithm binary-search
export function binary(a: number[], target: number, t: Trace) {
  let low = 0,
    high = a.length - 1 // @line initialize
  t.emit('initialize', { n: a.length, target, low, high })
  while (low <= high) {
    // @line outer-loop
    const mid = Math.floor((low + high) / 2) // @line midpoint
    t.emit(
      'compare',
      { low, high, mid, left: a[mid], right: target, comparison: `${a[mid]} === ${target}`, condition: a[mid] === target },
      [mid],
      `Check middle index ${mid} in range ${low}–${high}.`,
      'compare',
    )
    if (a[mid] === target) {
      // @line compare
      t.emit('found', { result: mid }, [mid], `Found ${target} at index ${mid}.`)
      return mid // @line found
    }
    t.emit(
      'direction',
      { comparison: `${a[mid]} < ${target}`, condition: a[mid] < target },
      [mid],
      'Choose which half can still contain the target.',
      'compare',
    )
    if (a[mid] < target) {
      // @line direction
      low = mid + 1 // @line move-right
      t.emit('move-right', { low, high }, [], 'Discard the middle and all smaller positions.')
    } else {
      high = mid - 1 // @line move-left
      t.emit('move-left', { low, high }, [], 'Discard the middle and all larger positions.')
    }
  }
  return -1 // @line return
}

// @algorithm recursive-binary-search
export function recursiveBinary(a: number[], target: number, t: Trace) {
  function search(low: number, high: number): number {
    // @line recurse
    t.emit('base-case', { n: a.length, target, low, high }, [], `Recursive range ${low}–${high}.`)
    if (low > high) return -1 // @line base-case
    const mid = Math.floor((low + high) / 2) // @line midpoint
    t.emit(
      'compare',
      { mid, left: a[mid], right: target, comparison: `${a[mid]} === ${target}`, condition: a[mid] === target },
      [mid],
      'Check the middle value.',
      'compare',
    )
    if (a[mid] === target) return mid // @line compare
    t.emit('direction', { comparison: `${a[mid]} < ${target}`, condition: a[mid] < target }, [mid], 'Recurse into the only possible half.', 'compare')
    if (a[mid] < target) return search(mid + 1, high) // @line direction
    return search(low, mid - 1) // @line recurse-left
  }
  return search(0, a.length - 1) // @line return
}

// @algorithm lower-bound
export function lower(a: number[], target: number, t: Trace) {
  let low = 0,
    high = a.length // @line initialize
  t.emit('initialize', { n: a.length, target, low, high })
  while (low < high) {
    // @line outer-loop
    const mid = Math.floor((low + high) / 2) // @line midpoint
    t.emit(
      'compare',
      { low, high, mid, left: a[mid], right: target, comparison: `${a[mid]} < ${target}`, condition: a[mid] < target },
      [mid],
      'Find the first value greater than or equal to the target.',
      'compare',
    )
    if (a[mid] < target)
      low = mid + 1 // @line compare
    else high = mid // @line move-left
    t.emit('outer-loop', { low, high }, [], `The half-open candidate range is now [${low}, ${high}).`)
  }
  return low // @line return
}

// @algorithm upper-bound
export function upper(a: number[], target: number, t: Trace) {
  let low = 0,
    high = a.length // @line initialize
  t.emit('initialize', { n: a.length, target, low, high })
  while (low < high) {
    // @line outer-loop
    const mid = Math.floor((low + high) / 2) // @line midpoint
    t.emit(
      'compare',
      { low, high, mid, left: a[mid], right: target, comparison: `${a[mid]} <= ${target}`, condition: a[mid] <= target },
      [mid],
      'Find the first value strictly greater than the target.',
      'compare',
    )
    if (a[mid] <= target)
      low = mid + 1 // @line compare
    else high = mid // @line move-left
    t.emit('outer-loop', { low, high }, [], `The half-open candidate range is now [${low}, ${high}).`)
  }
  return low // @line return
}

// @algorithm first-occurrence
export function first(a: number[], target: number, t: Trace) {
  let low = 0,
    high = a.length,
    result = -1 // @line initialize
  t.emit('initialize', { n: a.length, target, low, high, result })
  while (low < high) {
    // @line outer-loop
    const mid = Math.floor((low + high) / 2) // @line midpoint
    t.emit(
      'compare',
      { low, high, mid, left: a[mid], right: target, comparison: `${a[mid]} < ${target}`, condition: a[mid] < target },
      [mid],
      'Narrow toward the first possible occurrence.',
      'compare',
    )
    if (a[mid] < target)
      low = mid + 1 // @line compare
    else high = mid // @line move-left
  }
  t.emit('confirm', { low, high }, low < a.length ? [low] : [], 'Confirm that the candidate actually equals the target.')
  if (low < a.length && a[low] === target) result = low // @line confirm
  return result // @line return
}

// @algorithm last-occurrence
export function last(a: number[], target: number, t: Trace) {
  let low = 0,
    high = a.length,
    result = -1 // @line initialize
  t.emit('initialize', { n: a.length, target, low, high, result })
  while (low < high) {
    // @line outer-loop
    const mid = Math.floor((low + high) / 2) // @line midpoint
    t.emit(
      'compare',
      { low, high, mid, left: a[mid], right: target, comparison: `${a[mid]} <= ${target}`, condition: a[mid] <= target },
      [mid],
      'Narrow toward the position after the last occurrence.',
      'compare',
    )
    if (a[mid] <= target)
      low = mid + 1 // @line compare
    else high = mid // @line move-left
  }
  t.emit('confirm', { low, high }, low > 0 ? [low - 1] : [], 'Check the position immediately before the upper bound.')
  if (low > 0 && a[low - 1] === target) result = low - 1 // @line confirm
  return result // @line return
}

// @algorithm rotated-sorted-array-search
export function rotated(a: number[], target: number, t: Trace) {
  let low = 0,
    high = a.length - 1 // @line initialize
  t.emit('initialize', { n: a.length, target, low, high })
  while (low <= high) {
    // @line outer-loop
    const mid = Math.floor((low + high) / 2) // @line midpoint
    t.emit(
      'compare',
      { low, high, mid, left: a[mid], right: target, comparison: `${a[mid]} === ${target}`, condition: a[mid] === target },
      [mid],
      'Check the middle of the rotated range.',
      'compare',
    )
    if (a[mid] === target) {
      // @line compare
      t.emit('found', { result: mid }, [mid], `Found target at index ${mid}.`)
      return mid // @line found
    }
    if (a[low] === a[mid] && a[mid] === a[high]) {
      // @line duplicates
      low++
      high--
      t.emit('duplicates', { low, high }, [], 'Equal boundary values hide the sorted half; shrink both ends.')
    } else if (a[low] <= a[mid]) {
      // @line sorted-left
      if (a[low] <= target && target < a[mid])
        high = mid - 1 // @line choose-left
      else low = mid + 1
      t.emit('choose-left', { low, high }, [], 'Use the sorted left half to choose the remaining range.')
    } else {
      if (a[mid] < target && target <= a[high])
        low = mid + 1 // @line choose-right
      else high = mid - 1
      t.emit('choose-right', { low, high }, [], 'Use the sorted right half to choose the remaining range.')
    }
  }
  return -1 // @line return
}

// @algorithm peak-element-search
export function peak(a: number[], target: number, t: Trace) {
  void target
  let low = 0,
    high = a.length - 1 // @line initialize
  t.emit('initialize', { n: a.length, low, high })
  if (!a.length) return -1 // @line empty
  while (low < high) {
    // @line outer-loop
    const mid = Math.floor((low + high) / 2) // @line midpoint
    t.emit(
      'compare',
      { low, high, mid, left: a[mid], right: a[mid + 1], comparison: `${a[mid]} < ${a[mid + 1]}`, condition: a[mid] < a[mid + 1] },
      [mid, mid + 1],
      'Follow the rising side toward a non-strict local peak.',
      'compare',
    )
    if (a[mid] < a[mid + 1])
      low = mid + 1 // @line compare
    else high = mid // @line move-left
    t.emit('outer-loop', { low, high }, [], `A peak remains in range ${low}–${high}.`)
  }
  return low // @line return
}

// @algorithm sliding-window-two-pointers-suite
export function twoPointers(a: number[], target: number, t: Trace) {
  let low = 0,
    high = a.length - 1 // @line initialize
  t.emit('initialize', { n: a.length, target, low, high }, [], 'Find two distinct positions whose values sum to the target.')
  while (low < high) {
    // @line outer-loop
    const sum = a[low] + a[high] // @line sum
    t.emit(
      'compare',
      { low, high, sum, left: sum, right: target, comparison: `${sum} === ${target}`, condition: sum === target },
      [low, high],
      `The endpoint sum is ${a[low]} + ${a[high]} = ${sum}.`,
      'compare',
    )
    if (sum === target) {
      // @line compare
      t.emit('found', {}, [low, high], `Positions ${low} and ${high} form the target sum.`)
      return [low, high] // @line found
    }
    t.emit(
      'direction',
      { comparison: `${sum} < ${target}`, condition: sum < target },
      [low, high],
      'A smaller sum needs a larger left value; a larger sum needs a smaller right value.',
      'compare',
    )
    if (sum < target)
      low++ // @line direction
    else high-- // @line move-left
    t.emit('outer-loop', { low, high }, [], 'Move one endpoint inward without losing a possible pair.')
  }
  return [] // @line return
}

// @end
