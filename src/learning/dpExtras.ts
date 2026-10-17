import { DPTrace, type Coordinate } from '../daa/dpTrace'
import type { DaaInput, Lesson, Trace } from '../daa/types'

function range1D(input: DaaInput) {
  const [l, r] = input.range!
  if (input.range!.length !== 2 || l > r || r >= input.values!.length)
    throw new Error('Use an inclusive range [left,right] inside the values array, with left ≤ right.')
  return [l, r]
}
function prefixSum(input: DaaInput, t: Trace) {
  const values = input.values!,
    [l, r] = range1D(input),
    prefix = Array(values.length + 1).fill(0) as number[],
    d = new DPTrace(
      t,
      [prefix],
      ['P[i]'],
      prefix.map((_, i) => String(i)),
    )
  d.mark([0, 0])
  d.emit('P[0] = 0 represents the empty prefix.', 'base')
  for (let i = 0; i < values.length; i++) {
    prefix[i + 1] = prefix[i] + values[i]
    d.mark([0, i + 1])
    d.emit(
      `P[${i + 1}] = ${prefix[i]} + ${values[i]} = ${prefix[i + 1]}.`,
      'choose',
      [0, i + 1],
      [{ cell: [0, i], label: 'previous prefix' }],
      [],
      `${prefix[i]} + ${values[i]} = ${prefix[i + 1]}`,
    )
  }
  const sum = prefix[r + 1] - prefix[l]
  d.emit(
    `Range [${l},${r}]: P[${r + 1}] − P[${l}] = ${sum}.`,
    'traceback',
    undefined,
    [
      { cell: [0, r + 1], label: 'prefix through right' },
      { cell: [0, l], label: 'remove prefix before left' },
    ],
    [],
    `${prefix[r + 1]} − ${prefix[l]} = ${sum}`,
  )
  return { sum, range: [l, r], prefix }
}
function differenceArray(input: DaaInput, t: Trace) {
  const a = input.values!,
    [l, r] = range1D(input),
    delta = input.delta!,
    diff = Array(a.length + 1).fill(0) as number[],
    recovered = Array(a.length + 1).fill(0) as number[],
    d = new DPTrace(
      t,
      [diff, recovered],
      ['difference', 'recovered'],
      diff.map((_, i) => (i === a.length ? 'sentinel' : String(i))),
    )
  for (let i = 0; i < a.length; i++) diff[i] = a[i] - (a[i - 1] ?? 0)
  for (let i = 0; i <= a.length; i++) d.mark([0, i])
  d.emit('Difference values store the change from the previous array value. The final cell is a boundary sentinel.', 'base')
  const oldLeft = diff[l]
  diff[l] += delta
  d.emit(`Start the range addition: difference[${l}] += ${delta}.`, 'choose', [0, l], [], [], `${oldLeft} + ${delta} = ${diff[l]}`)
  const oldRight = diff[r + 1]
  diff[r + 1] -= delta
  d.emit(
    `Stop the addition after the inclusive right endpoint: difference[${r + 1}] -= ${delta}.`,
    'choose',
    [0, r + 1],
    [],
    [],
    `${oldRight} − ${delta} = ${diff[r + 1]}`,
  )
  for (let i = 0; i < a.length; i++) {
    recovered[i] = (recovered[i - 1] ?? 0) + diff[i]
    d.mark([1, i])
    d.emit(
      `Recover value ${i}: ${recovered[i - 1] ?? 0} + ${diff[i]} = ${recovered[i]}.`,
      'choose',
      [1, i],
      [{ cell: [0, i], label: 'difference' }, ...(i > 0 ? [{ cell: [1, i - 1] as Coordinate, label: 'previous value' }] : [])],
      [],
      `${recovered[i - 1] ?? 0} + ${diff[i]} = ${recovered[i]}`,
    )
  }
  return { values: recovered.slice(0, a.length), range: [l, r], delta }
}
function prefix2D(input: DaaInput, t: Trace) {
  const a = input.a!,
    rows = a.length,
    cols = a[0].length,
    [r0, c0, r1, c1] = input.range!
  if (a.some((row) => row.length !== cols)) throw new Error('Matrix rows must have equal lengths.')
  if (input.range!.length !== 4 || r0 > r1 || c0 > c1 || r1 >= rows || c1 >= cols)
    throw new Error('Use [top,left,bottom,right] inside the matrix, with inclusive endpoints.')
  const p = Array.from({ length: rows + 1 }, () => Array(cols + 1).fill(0) as number[]),
    d = new DPTrace(
      t,
      p,
      p.map((_, i) => String(i)),
      p[0].map((_, i) => String(i)),
    )
  for (let i = 0; i <= rows; i++) d.mark([i, 0])
  for (let j = 0; j <= cols; j++) d.mark([0, j])
  d.emit('Pad the prefix matrix with an empty row and column of zeros.', 'base')
  for (let i = 1; i <= rows; i++)
    for (let j = 1; j <= cols; j++) {
      p[i][j] = a[i - 1][j - 1] + p[i - 1][j] + p[i][j - 1] - p[i - 1][j - 1]
      d.mark([i, j])
      d.emit(
        `P[${i},${j}] = ${p[i][j]}.`,
        'choose',
        [i, j],
        [
          { cell: [i - 1, j], label: 'above' },
          { cell: [i, j - 1], label: 'left' },
          { cell: [i - 1, j - 1], label: 'subtract overlap' },
        ],
        [],
        `${a[i - 1][j - 1]} + ${p[i - 1][j]} + ${p[i][j - 1]} − ${p[i - 1][j - 1]} = ${p[i][j]}`,
      )
    }
  const sum = p[r1 + 1][c1 + 1] - p[r0][c1 + 1] - p[r1 + 1][c0] + p[r0][c0]
  d.emit(
    `Rectangle sum = ${sum}.`,
    'traceback',
    undefined,
    [
      { cell: [r1 + 1, c1 + 1], label: 'full prefix' },
      { cell: [r0, c1 + 1], label: 'remove above' },
      { cell: [r1 + 1, c0], label: 'remove left' },
      { cell: [r0, c0], label: 'restore overlap' },
    ],
    [],
    `${p[r1 + 1][c1 + 1]} − ${p[r0][c1 + 1]} − ${p[r1 + 1][c0]} + ${p[r0][c0]} = ${sum}`,
  )
  return { sum, rectangle: input.range, prefix: p }
}
function extra(
  id: string,
  title: string,
  input: DaaInput,
  run: NonNullable<Lesson['run']>,
  summary: string,
  example: string,
  time: string,
  space: string,
): Lesson {
  return {
    id,
    title,
    category: 'Dynamic Programming',
    defaultInput: input,
    run,
    summary,
    example,
    time,
    space,
    constraints: 'Array indices are zero-based; ranges are inclusive. Use small finite inputs to inspect each state.',
    correctness:
      'Each cumulative state combines already computed predecessors. Induction over the fill order proves that each prefix or recovered array value has its stated meaning. Subtracting the excluded prefix regions leaves exactly the requested range.',
    derivation:
      'One pass builds the states. A prefix range query uses a fixed number of arithmetic operations; a difference-array range addition touches two endpoints before the reconstruction pass.',
    pseudocode: [
      'Initialize the empty-prefix or difference base states',
      'Compute each state from its dependencies',
      'Use the completed states to answer the requested range',
    ],
    exercise: {
      question: 'Why do inclusive right endpoints use the position right + 1?',
      answer: 'Prefix states count how many values have been included. Difference updates must stop immediately after the last included array position.',
    },
  }
}
export const dpExtraLessons: Lesson[] = [
  extra(
    'prefix-sum',
    'Prefix Sums',
    { values: [2, -1, 3, 4, -2], range: [1, 3] },
    prefixSum,
    'Answer an inclusive range sum by subtracting two cumulative states.',
    'For [2,−1,3,4,−2], P = [0,2,1,4,8,6]. Sum [1,3] = P[4] − P[1] = 8 − 2 = 6.',
    'Build O(n), query O(1)',
    'O(n)',
  ),
  extra(
    'difference-array',
    'Difference Arrays',
    { values: [2, 4, 6, 8, 10], range: [1, 3], delta: 5 },
    differenceArray,
    'Apply a range addition with two boundary changes, then recover the array.',
    'Add 5 to indices [1,3]: [2,4,6,8,10] becomes [2,9,11,13,10].',
    'Update O(1), reconstruction O(n)',
    'O(n)',
  ),
  extra(
    'prefix-sum-2d',
    '2D Prefix Sums',
    {
      a: [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ],
      range: [0, 1, 2, 2],
    },
    prefix2D,
    'Use inclusion–exclusion to query a rectangle in constant time after preprocessing.',
    'The last two columns of the 3×3 matrix 1…9 sum to 2+3+5+6+8+9 = 33.',
    'Build O(RC), query O(1)',
    'O(RC)',
  ),
]
