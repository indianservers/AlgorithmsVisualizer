import type { AlgorithmCategory, AlgorithmStep } from '../types'

export type Edge = { from: number; to: number; weight: number }
export type DaaInput = {
  range?: number[]
  delta?: number
  values?: number[]
  k?: number
  n?: number
  amount?: number
  capacity?: number
  weights?: number[]
  profits?: number[]
  dimensions?: number[]
  frequencies?: number[]
  unsuccessful?: number[]
  intervals?: number[][]
  deadlines?: number[]
  text?: string
  pattern?: string
  left?: string
  right?: string
  vertices?: number
  edges?: Edge[]
  source?: number
  directed?: boolean
  colors?: number
  target?: number
  a?: number[][]
  b?: number[][]
  points?: number[][]
  x?: string
  y?: string
  seed?: number
  bins?: number
}
export type Cell = number | string | boolean | null
export type GreedyTree = { weight: number; id?: number; left?: GreedyTree; right?: GreedyTree }
export type LearningState = {
  greedy?: {
    phase: 'ready' | 'accept' | 'reject' | 'merge' | 'codes'
    order: number[]
    current?: number
    selected: number[]
    rejected: number[]
    reason: string
    objective: number
    boundary?: number
    fractions?: number[]
    remaining?: number
    slots?: number[]
    forest?: GreedyTree[]
    codes?: Record<number, string>
    prediction?: { question: string; answer: string; explanation: string }
  }
  dp?: {
    phase: 'base' | 'call' | 'reuse' | 'choose' | 'traceback' | 'complete'
    focus?: [number, number]
    dependencies: { cell: [number, number]; label: string }[]
    candidates: { label: string; value: Cell }[]
    expression: string
    filled: string[]
    path?: [number, number][]
    stack?: number[]
  }
  networkStudy?: {
    phase: 'ready' | 'remove' | 'release' | 'forward' | 'finish' | 'transpose' | 'group' | 'summary'
    order: number[]
    frontier: number[]
    degrees?: number[]
    groups?: number[][]
    finishOrder?: number[]
    reversed?: boolean
    blocked?: number[]
  }
  routeStudy?: {
    phase: 'start' | 'pass' | 'check' | 'summary'
    pass: number
    from?: number
    to?: number
    via?: number
    before?: Cell
    candidate?: Cell
    improved?: boolean
    affected?: number[]
    negativeCycle?: boolean
  }
  weightedExplorer?: {
    current: number
    action: 'start' | 'settle' | 'relax' | 'accept' | 'reject'
    edge?: number
    accepted: number[]
    visited: number[]
    distances?: (number | null)[]
    frontier?: number[]
    components?: number[]
    cost: number
  }
  traversal?: { current: number; frontier: number[]; visited: number[]; path: number[]; parent: number[]; distance?: number[] }
  activeIndices?: number[]
  matrices?: { label: string; values: Cell[][] }[]
  labels?: string[]
  values?: Cell[]
  table?: Cell[][]
  rowLabels?: string[]
  columnLabels?: string[]
  graph?: { vertices: number; edges: Edge[]; directed: boolean; selected?: number[][]; labels?: string[] }
  search?: { id: number; parent?: number; label: string; bound?: number; pruned?: boolean }[]
  searchTotal?: number
  note?: string
}
export type DaaRun = { steps: AlgorithmStep[]; result: unknown; status: 'complete' | 'truncated'; message?: string }
export type Lesson = {
  id: string
  title: string
  category: AlgorithmCategory
  extension?: boolean
  summary: string
  defaultInput?: DaaInput
  inputHelp?: string
  constraints: string
  pseudocode: string[]
  correctness: string
  time: string
  space: string
  derivation: string
  example: string
  exercise: { question: string; answer: string }
  theory?: string[]
  run?: (input: DaaInput, trace: Trace) => unknown
}

export class Trace {
  steps: AlgorithmStep[] = []
  operations = 0
  private limit: number
  constructor(limit = 1000) {
    this.limit = limit
  }
  add(description: string, state: LearningState = {}, line = 0, type: AlgorithmStep['type'] = 'update') {
    this.operations++
    if (this.steps.length >= this.limit) return
    this.steps.push({
      id: `daa-${this.operations}`,
      type,
      description,
      pseudocodeLine: line,
      dataState: (state.values ?? []).filter((v): v is number => typeof v === 'number' && Number.isFinite(v)),
      state: structuredClone(state.search ? { ...state, searchTotal: state.search.length, search: state.search.slice(-128) } : state),
      highlights: {},
      metrics: { writes: this.operations },
    })
  }
  finish(result: unknown): DaaRun {
    if (this.operations >= this.limit)
      return { steps: this.steps, result, status: 'truncated', message: 'Timeline truncated; the computed result is available, but this trace is incomplete.' }
    this.add('Complete: ' + JSON.stringify(result), this.steps.at(-1)?.state ?? {}, 0, 'complete')
    return { steps: this.steps, result, status: 'complete' }
  }
}

function numbers(value: unknown, name: string, max = 20): asserts value is number[] {
  if (!Array.isArray(value) || !value.length || value.length > max || value.some((v) => typeof v !== 'number' || !Number.isFinite(v) || Math.abs(v) > 1e6))
    throw new Error(`${name}: provide 1–${max} finite numbers, each with magnitude at most 1,000,000.`)
}
export function validateInput(input: DaaInput, defaults: DaaInput) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Input must be a JSON object.')
  for (const key of Object.keys(defaults) as (keyof DaaInput)[]) {
    const v = input[key]
    if (v === undefined) throw new Error(`Missing input field: ${key}.`)
    if (['values', 'weights', 'profits', 'dimensions', 'frequencies', 'deadlines', 'unsuccessful'].includes(key))
      numbers(v, key, key === 'unsuccessful' ? 21 : 20)
    if (['text', 'pattern', 'left', 'right'].includes(key) && (typeof v !== 'string' || v.length > 32))
      throw new Error(`${key} must be a string of at most 32 characters.`)
    if (['x', 'y'].includes(key) && (typeof v !== 'string' || !/^\d{1,18}$/.test(v))) throw new Error(`${key} must contain 1–18 decimal digits.`)
    if (
      ['k', 'n', 'amount', 'capacity', 'vertices', 'source', 'colors', 'target', 'seed', 'bins'].includes(key) &&
      (typeof v !== 'number' || !Number.isSafeInteger(v))
    )
      throw new Error(`${key} must be an integer.`)
    if (['intervals', 'points', 'a', 'b'].includes(key)) {
      if (!Array.isArray(v) || !v.length || v.length > 16) throw new Error(`${key} must contain 1–16 rows.`)
      v.forEach((row: unknown) => numbers(row, key, 16))
    }
  }
  if (input.directed !== undefined && typeof input.directed !== 'boolean') throw new Error('directed must be true or false.')
  if (
    input.range !== undefined &&
    (!Array.isArray(input.range) || ![2, 4].includes(input.range.length) || input.range.some((v) => !Number.isSafeInteger(v) || v < 0))
  )
    throw new Error('Range must contain 2 or 4 non-negative integer indices.')
  if (input.delta !== undefined && (typeof input.delta !== 'number' || !Number.isFinite(input.delta) || Math.abs(input.delta) > 1e6))
    throw new Error('Delta must be a finite number of magnitude at most 1,000,000.')
  if (input.weights && ((input.profits && input.weights.length !== input.profits.length) || input.weights.some((w) => !Number.isInteger(w) || w <= 0)))
    throw new Error('Weights must be positive integers and match profits when provided.')
  if (input.profits?.some((p) => p < 0)) throw new Error('Profits must be non-negative.')
  if (input.capacity !== undefined && (input.capacity < 0 || input.capacity > 100)) throw new Error('Capacity must be between 0 and 100.')
  if (input.amount !== undefined && (input.amount < 0 || input.amount > 100)) throw new Error('Amount must be between 0 and 100.')
  if (input.n !== undefined && (input.n < 0 || input.n > 12)) throw new Error('n must be between 0 and 12.')
  if (input.colors !== undefined && (input.colors < 1 || input.colors > 6)) throw new Error('Use 1–6 colors.')
  if (input.k !== undefined && (input.k < 1 || input.k > (input.values?.length ?? 0))) throw new Error('k is a one-based rank within values.')
  if (input.dimensions?.some((d) => !Number.isInteger(d) || d < 1 || d > 100)) throw new Error('Dimensions must be positive integers ≤100.')
  if (input.frequencies?.some((f) => f < 0)) throw new Error('Frequencies must be non-negative.')
  if (input.unsuccessful && (input.unsuccessful.length !== (input.frequencies?.length ?? 0) + 1 || input.unsuccessful.some((f) => f < 0)))
    throw new Error('Provide n+1 non-negative unsuccessful-search frequencies for n keys.')
  if (input.deadlines && (input.deadlines.length !== input.profits?.length || input.deadlines.some((d) => !Number.isInteger(d) || d < 0 || d > 20)))
    throw new Error('Provide one integer deadline (0–20) for each profit.')
  if (input.intervals?.some((row) => row.length !== 2 || row[0] >= row[1]))
    throw new Error('Intervals must be [start, finish] with start < finish (positive duration).')
  if (input.points?.some((row) => row.length !== 2)) throw new Error('Points must be [x, y].')
  if (input.vertices !== undefined) {
    if (input.vertices < 1 || input.vertices > 8) throw new Error('Graphs support 1–8 vertices, numbered from zero.')
    if (input.source !== undefined && (input.source < 0 || input.source >= input.vertices)) throw new Error('Source is outside the graph.')
    if (
      !Array.isArray(input.edges) ||
      input.edges.length > 64 ||
      input.edges.some(
        (e) =>
          !e ||
          !Number.isInteger(e.from) ||
          !Number.isInteger(e.to) ||
          e.from < 0 ||
          e.to < 0 ||
          e.from >= input.vertices! ||
          e.to >= input.vertices! ||
          !Number.isFinite(e.weight) ||
          Math.abs(e.weight) > 10000,
      )
    )
      throw new Error('Edges require valid from/to vertices and finite weights (magnitude ≤10000).')
  }
}

export function executeLesson(lesson: Lesson, input: DaaInput, limit = 1000): DaaRun {
  if (!lesson.run || !lesson.defaultInput) throw new Error('This is a theory lesson.')
  validateInput(input, lesson.defaultInput)
  const trace = new Trace(limit)
  return trace.finish(lesson.run(structuredClone(input), trace))
}
