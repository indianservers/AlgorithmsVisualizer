import type { AlgorithmStep } from '../types'
import type { DaaInput } from '../daa/types'

export const greedyFields: Record<string, string> = {
  intervals: 'Activities: start, finish (one per line)',
  weights: 'Item weights',
  profits: 'Profits',
  capacity: 'Capacity',
  deadlines: 'Deadlines',
  frequencies: 'Symbol frequencies',
}
export function greedyFieldsFor(input: DaaInput): Record<string, string> {
  return Object.fromEntries(
    Object.entries(input).map(([k, v]) => [
      k,
      k === 'intervals' ? (v as number[][]).map((r) => r.join(', ')).join('\n') : Array.isArray(v) ? v.join(', ') : String(v),
    ]),
  )
}
export function parseGreedyFields(fields: Record<string, string>, defaults: DaaInput): DaaInput {
  const numbers = (value: string) =>
    value
      .split(/[\s,]+/)
      .filter(Boolean)
      .map((v) => {
        const n = Number(v)
        if (!Number.isFinite(n)) throw new Error(`'${v}' is not a finite number.`)
        return n
      })
  return Object.fromEntries(
    Object.entries(defaults).map(([k, v]) => {
      const text = fields[k] ?? ''
      if (!text.trim()) throw new Error(`${greedyFields[k]} is required.`)
      return [
        k,
        k === 'intervals'
          ? text
              .split(/\r?\n/)
              .filter((r) => r.trim())
              .map(numbers)
          : Array.isArray(v)
            ? numbers(text)
            : Number(text),
      ]
    }),
  ) as DaaInput
}
export const nextGreedyPrediction = (steps: AlgorithmStep[], cursor: number) => {
  const index = steps.findIndex((s, i) => i > cursor && !!s.state?.greedy?.prediction)
  return index < 0 ? undefined : { index, ...steps[index].state!.greedy!.prediction! }
}
export function matchesGreedyAnswer(answer: string, expected: string) {
  if (!answer.trim()) return false
  if (['accept', 'reject'].includes(expected)) return answer.trim().toLowerCase() === expected
  const number = Number(answer)
  return Number.isFinite(number) && Math.abs(number - Number(expected)) <= 1e-5 * Math.max(1, Math.abs(Number(expected)))
}

type Profile = {
  rule: string
  feasibility: string
  invariant: string
  pitfall: string
  tradeoff: string
  worked: string[]
  examples: { name: string; input: DaaInput }[]
}
export const greedyProfiles: Record<string, Profile> = {
  'activity-selection': {
    rule: 'Choose the compatible activity that finishes earliest.',
    feasibility: 'start ≥ last chosen finish; touching endpoints are allowed.',
    invariant: 'The chosen prefix has the earliest possible finish among optimal-count prefixes.',
    pitfall: 'Earliest start and shortest duration are not safe rules. Weighted rewards also invalidate this count-maximizing strategy.',
    tradeoff: 'Sort in O(n log n), then scan in O(n). If already finish-sorted, the scan alone is linear.',
    worked: [
      'Sort the default activities by finish: 0, 1, 2, 3, 4, 5.',
      'Accept 0 [1,4]; reject 1 and 2 because they start before 4.',
      'Accept 3 [5,7], then 4 [8,9]. Reject 5 [5,9]. Count = 3.',
    ],
    examples: [
      {
        name: 'Touching endpoints',
        input: {
          intervals: [
            [0, 2],
            [2, 4],
            [4, 6],
            [1, 5],
          ],
        },
      },
      {
        name: 'Earliest-start trap',
        input: {
          intervals: [
            [0, 10],
            [1, 2],
            [2, 3],
            [3, 4],
          ],
        },
      },
      {
        name: 'All overlap',
        input: {
          intervals: [
            [0, 8],
            [1, 7],
            [2, 6],
          ],
        },
      },
    ],
  },
  'fractional-knapsack': {
    rule: 'Take available items in decreasing profit ÷ weight.',
    feasibility: 'Use any fraction from 0 to 1; never exceed capacity.',
    invariant: 'No chosen unit has lower value density than an unchosen available unit.',
    pitfall: 'Items must be divisible. The same ratio rule does not solve 0/1 knapsack. Equal ratios may yield different equally good fillings.',
    tradeoff: 'O(n log n) sorting plus O(n) filling; no capacity-indexed DP table is required.',
    worked: [
      'Default ratios: 3/2 = 1.5; 4/3 ≈ 1.33; 5/4 = 1.25; 6/5 = 1.2.',
      'Take item 0 completely: weight 2, profit 3, capacity left 3.',
      'Take item 1 completely: weight 3, profit 4. Total weight 5, profit 7.',
    ],
    examples: [
      { name: 'A genuine fractional final item', input: { weights: [10, 20, 30], profits: [60, 100, 120], capacity: 50 } },
      { name: 'Zero capacity', input: { weights: [2, 3], profits: [5, 7], capacity: 0 } },
      { name: 'Equal value density', input: { weights: [2, 4, 6], profits: [6, 12, 18], capacity: 5 } },
    ],
  },
  'job-sequencing': {
    rule: 'Consider highest-profit jobs first; use their latest free feasible slot.',
    feasibility: 'Every job takes one time unit. Slot t must end by its deadline.',
    invariant: 'The scheduled job set remains feasible; late placement preserves earlier slots.',
    pitfall: 'Deadlines are not durations. This proof assumes unit-duration independent jobs and non-negative profits. Deadline 0 means unschedulable.',
    tradeoff: 'This readable implementation scans at most D slots per job: O(n log n + nD). A disjoint-set slot finder can accelerate larger schedules.',
    worked: [
      'Default profit order: jobs 0, 2, 3, 1, 4.',
      'Place 0 in slot 2; place 2 in slot 1. Jobs 3 and 1 have no feasible slot.',
      'Place 4 in slot 3: slots [2,0,4]; profit 27 + 100 + 15 = 142.',
    ],
    examples: [
      { name: 'Latest slot protects early jobs', input: { profits: [100, 80, 60], deadlines: [3, 1, 2] } },
      { name: 'No feasible deadline', input: { profits: [10, 20], deadlines: [0, 0] } },
      { name: 'Everyone needs slot 1', input: { profits: [20, 50, 30], deadlines: [1, 1, 1] } },
    ],
  },
  'huffman-coding': {
    rule: 'Repeatedly merge the two smallest-weight trees.',
    feasibility: 'Positive symbol frequencies; assign symbols only to leaves.',
    invariant: 'A minimum-weight pair can be deepest siblings in an optimal binary prefix tree.',
    pitfall: 'Equal frequencies can produce different optimal codes. The bits themselves are not unique. A single symbol uses code 0 here.',
    tradeoff: 'This teaching queue is re-sorted for every merge: O(n² log n). A min-heap gives standard O(n log n).',
    worked: [
      'Merge 5 + 9 = 14; merge 12 + 13 = 25.',
      'Merge 14 + 16 = 30; merge 25 + 30 = 55.',
      'Merge 45 + 55 = 100. Merge costs sum to 14 + 25 + 30 + 55 + 100 = 224 weighted bits.',
    ],
    examples: [
      { name: 'Equal frequencies', input: { frequencies: [4, 4, 4, 4] } },
      { name: 'One symbol', input: { frequencies: [7] } },
      { name: 'Skewed distribution', input: { frequencies: [1, 1, 2, 3, 20] } },
    ],
  },
}
