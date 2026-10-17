import type { AlgorithmStep } from '../types'
import type { Cell, DaaInput } from '../daa/types'
export const fieldNames: Record<string, string> = {
  n: 'Fibonacci index n',
  values: 'Values / coin denominations',
  amount: 'Target amount',
  weights: 'Item weights',
  profits: 'Item profits',
  capacity: 'Knapsack capacity',
  left: 'Source / left string',
  right: 'Target / right string',
  dimensions: 'Matrix dimensions',
  frequencies: 'Successful-search frequencies',
  unsuccessful: 'Unsuccessful-search gap frequencies',
  vertices: 'Number of vertices',
  source: 'Source vertex',
  directed: 'Graph direction',
  edges: 'Edges: from, to, weight (one per line)',
  a: 'Matrix: comma-separated rows',
  range: 'Inclusive range indices',
  delta: 'Range addition delta',
}
export const formatCell = (v: Cell | undefined) => (v === undefined ? '—' : v === null ? '∞' : String(v))
export const fieldsFor = (input: DaaInput): Record<string, string> =>
  Object.fromEntries(
    Object.entries(input).map(([key, value]) => [
      key,
      key === 'edges'
        ? (input.edges ?? []).map((e) => `${e.from}, ${e.to}, ${e.weight}`).join('\n')
        : key === 'a'
          ? (input.a ?? []).map((row) => row.join(', ')).join('\n')
          : Array.isArray(value)
            ? value.join(', ')
            : String(value),
    ]),
  )
export function parseDPFields(fields: Record<string, string>, defaults: DaaInput): DaaInput {
  const input: Record<string, unknown> = {}
  const numbers = (text: string) =>
    text
      .split(/[\s,]+/)
      .filter(Boolean)
      .map((token) => {
        const value = Number(token)
        if (!Number.isFinite(value)) throw new Error(`'${token}' is not a finite number.`)
        return value
      })
  for (const [key, original] of Object.entries(defaults)) {
    const text = fields[key] ?? ''
    if (key === 'edges')
      input.edges = text
        .split(/\r?\n/)
        .filter((line) => line.trim())
        .map((line) => {
          const row = numbers(line)
          if (row.length !== 3) throw new Error('Each edge needs from, to, weight.')
          return { from: row[0], to: row[1], weight: row[2] }
        })
    else if (key === 'a')
      input.a = text
        .split(/\r?\n/)
        .filter((line) => line.trim())
        .map(numbers)
    else if (Array.isArray(original)) input[key] = numbers(text)
    else if (typeof original === 'boolean') {
      if (!['true', 'false'].includes(text)) throw new Error('Direction must be true or false.')
      input[key] = text === 'true'
    } else if (typeof original === 'number') {
      if (!text.trim()) throw new Error(`${fieldNames[key] ?? key} is required.`)
      input[key] = Number(text)
    } else input[key] = text
  }
  return input as DaaInput
}
export function validateDPStudioInput(input: DaaInput) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Use a valid input object.')
  if ((input.left?.length ?? 0) > 12 || (input.right?.length ?? 0) > 12)
    throw new Error('Use strings of at most 12 UTF-16 code units so every transition remains readable.')
  if ((input.weights?.length ?? 0) > 8 || (input.capacity ?? 0) > 18)
    throw new Error('Use up to 8 items and capacity at most 18 in the interactive knapsack table.')
  if ((input.dimensions?.length ?? 0) > 9 || (input.frequencies?.length ?? 0) > 8)
    throw new Error('Use at most 8 matrices or ordered keys in the interval table.')
  if ((input.vertices ?? 0) > 6) throw new Error('Use at most 6 vertices in the subset-DP explorer.')
  if (input.a && (input.a.length > 8 || input.a.some((row) => row.length > 8)))
    throw new Error('Use at most 8 rows and 8 columns in the prefix-matrix explorer.')
}
export function nextDPPrediction(steps: AlgorithmStep[], cursor: number) {
  for (let i = cursor + 1; i < steps.length; i++) {
    const state = steps[i].state,
      focus = state?.dp?.focus
    if (steps[i].type !== 'complete' && state?.dp?.phase === 'choose' && focus)
      return { index: i, focus, value: formatCell(state.table?.[focus[0]]?.[focus[1]]) }
  }
  return undefined
}
