// Authored study material supplements the existing visual runners and URLs.
export const legacyStudy: Record<
  string,
  { proof: string; derivation: string; example: string; constraints: string; question: string; answer: string; code: string }
> = {
  'linear-search': {
    proof:
      'Before index i is checked, no earlier index contains the target. A match returns a correct index; exhausting the array proves absence. The number of unchecked positions decreases on each iteration.',
    derivation:
      'Best Θ(1), worst Θ(n); for a uniformly located successful target, expected comparisons are (n+1)/2. The iterative search uses Θ(1) auxiliary space.',
    example: '[7,2,9], target 2 → index 1; target 4 → −1.',
    constraints: 'Any finite numeric array; duplicate targets return the first occurrence.',
    question: 'Must the input be sorted?',
    answer: 'No. Linear search examines candidates independently.',
    code: 'function linearSearch(a: number[], target: number): number {\n  for (let i = 0; i < a.length; i++) if (a[i] === target) return i\n  return -1\n}',
  },
  'binary-search': {
    proof:
      'If the target occurs, a candidate remains in [low,high]. Comparing the midpoint discards only values strictly smaller or larger than the target in the sorted array. The interval shrinks each iteration; an empty interval proves absence.',
    derivation: 'T(n)=T(n/2)+Θ(1)=Θ(log n) worst case, Θ(1) best. Iterative bounds use Θ(1) auxiliary space.',
    example: '[1,3,5,7,9], target 7 → index 3; target 4 → −1.',
    constraints: 'Ascending sorted numeric array. Duplicate targets may return any matching index; use lower bound to find the first.',
    question: 'Why cannot this discard rule use unsorted input?',
    answer: 'Ordering is what proves the discarded half cannot contain a target.',
    code: 'function binarySearch(a: number[], target: number): number {\n  let low = 0, high = a.length - 1\n  while (low <= high) {\n    const mid = Math.floor((low + high) / 2)\n    if (a[mid] === target) return mid\n    if (a[mid] < target) low = mid + 1; else high = mid - 1\n  }\n  return -1\n}',
  },
  'merge-sort': {
    proof:
      'Induction sorts each smaller half. During merging, the output prefix is sorted and contains exactly the smallest already-consumed elements of the two sorted halves. Choosing the smaller head preserves this invariant; exhausted tails complete the permutation.',
    derivation:
      'T(n)=2T(n/2)+Θ(n)=Θ(n log n) in all cases. Temporary merge storage is Θ(n); recursion depth is Θ(log n). Animation snapshots require additional storage.',
    example: '[5,1,4,2] → merge [1,5] and [2,4] → [1,2,4,5].',
    constraints: 'Finite numeric values; choosing the left head on ties preserves stability.',
    question: 'Why does sorting the halves alone not finish the job?',
    answer: 'Elements across the halves may interleave; merging establishes the global sorted order.',
    code: 'function mergeSort(a: number[]): number[] {\n  if (a.length < 2) return [...a]\n  const mid = Math.floor(a.length / 2), l = mergeSort(a.slice(0, mid)), r = mergeSort(a.slice(mid))\n  const out: number[] = []; let i = 0, j = 0\n  while (i < l.length && j < r.length) out.push(l[i] <= r[j] ? l[i++] : r[j++])\n  return [...out, ...l.slice(i), ...r.slice(j)]\n}',
  },
  'quick-sort': {
    proof:
      'A Lomuto partition maintains values smaller than the pivot before the boundary and unclassified values after the current scan. The final pivot swap fixes its sorted position. Induction sorts the strictly smaller ranges; partitioning and swaps preserve the multiset.',
    derivation:
      'Balanced splits give Θ(n log n); adversarial last-element pivots give T(n)=T(n−1)+Θ(n)=Θ(n²). Average Θ(n log n) assumes random input permutations. Recursion is Θ(log n) balanced but Θ(n) worst; this runner also copies input once.',
    example: '[3,1,4,2] partitions around 2, then sorts the remaining ranges → [1,2,3,4].',
    constraints: 'Finite numeric array; unstable, and duplicate-heavy or sorted inputs can cause unbalanced recursion.',
    question: 'Does “in-place partition” imply constant total space?',
    answer: 'No. Include the recursion stack and the visualization runner’s input copy.',
    code: 'function quickSort(a: number[]): number[] {\n  const data = [...a]\n  function sort(lo: number, hi: number) {\n    if (lo >= hi) return\n    const pivot = data[hi]; let boundary = lo\n    for (let j = lo; j < hi; j++) if (data[j] < pivot) { [data[j], data[boundary]] = [data[boundary], data[j]]; boundary++ }\n    [data[boundary], data[hi]] = [data[hi], data[boundary]]\n    sort(lo, boundary - 1); sort(boundary + 1, hi)\n  }\n  sort(0, data.length - 1); return data\n}',
  },
  'heap-sort': {
    proof:
      'Bottom-up heapification creates a max heap. Each extraction places its maximum at the front of the sorted suffix; restoring the reduced heap preserves the prefix heap property and suffix order. All operations are swaps, preserving the permutation.',
    derivation:
      'Bottom-up building is O(n), since few nodes have large height. n extractions each cost O(log n), so total Θ(n log n) worst. The iterative textbook core is O(1) auxiliary; the visual runner’s copied input and recursive heapify use additional memory.',
    example: '[3,1,4,2] → max heap [4,2,3,1] → [1,2,3,4].',
    constraints: 'Finite numeric array; not stable.',
    question: 'Why is bottom-up heap building linear?',
    answer: 'The sum of node heights is O(n), rather than n times the maximum height.',
    code: 'function heapSort(a: number[]): number[] {\n  const data = [...a]\n  function sift(root: number, size: number) {\n    while (root * 2 + 1 < size) {\n      let child = root * 2 + 1\n      if (child + 1 < size && data[child + 1] > data[child]) child++\n      if (data[root] >= data[child]) break\n      [data[root], data[child]] = [data[child], data[root]]; root = child\n    }\n  }\n  for (let i = Math.floor(data.length / 2) - 1; i >= 0; i--) sift(i, data.length)\n  for (let end = data.length - 1; end > 0; end--) { [data[0], data[end]] = [data[end], data[0]]; sift(0, end) }\n  return data\n}',
  },
  'counting-sort': {
    proof:
      'The count for each key equals its multiplicity after the counting loop. Emitting keys in increasing order with exactly those multiplicities creates a sorted permutation. This numeric output variant does not claim stable ordering of associated records.',
    derivation:
      'For n items and key range 0…k, counting, scanning and emitting cost Θ(n+k), with Θ(k) count storage plus output. It is linear only when k=O(n), and is not comparison-based.',
    example: '[2,0,2,1] has counts [1,1,2], yielding [0,1,2,2].',
    constraints: 'Non-negative integers with bounded maximum key; large key ranges can exhaust memory.',
    question: 'Why does counting sort not violate the comparison-sort lower bound?',
    answer: 'It uses integer keys as array indices, rather than deriving order only through comparisons.',
    code: 'function countingSort(a: number[]): number[] {\n  if (!a.length) return []\n  const counts = Array(Math.max(...a) + 1).fill(0), out: number[] = []\n  for (const v of a) counts[v]++\n  for (let v = 0; v < counts.length; v++) for (let i = 0; i < counts[v]; i++) out.push(v)\n  return out\n}',
  },
  'radix-sort': {
    proof:
      'After digit pass d, order is correct on the lowest d digits. Stable bucketing by the next digit preserves the lower-digit order among equal next digits. Induction through all digits yields numeric order.',
    derivation:
      'd digit passes each take Θ(n+b) for base b, giving Θ(d(n+b)) time and Θ(n+b) temporary storage. “Linear time” assumes a bounded digit count and base.',
    example: '[21,11,2] → units pass [21,11,2] → tens pass [2,11,21].',
    constraints: 'Non-negative safe integers; base 10, stable least-significant-digit passes.',
    question: 'Why must each digit pass be stable?',
    answer: 'Otherwise the next digit pass may destroy the order already established on lower digits.',
    code: 'function radixSort(a: number[]): number[] {\n  let data = [...a]; const max = Math.max(0, ...data)\n  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {\n    const buckets: number[][] = Array.from({ length: 10 }, () => [])\n    for (const v of data) buckets[Math.floor(v / exp) % 10].push(v)\n    data = buckets.flat()\n  }\n  return data\n}',
  },
}
