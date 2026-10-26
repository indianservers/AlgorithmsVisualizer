export type MethodSense = 'max' | 'min'
export type MethodPolicy = 'fifo' | 'best'
export type MethodData = { sense: MethodSense; values: number[]; bounds: number[] }
export type MethodState = {
  data: MethodData
  policy: MethodPolicy
  pruning: boolean
  seed: number | null
  frontier: number[]
  status: ('unreached' | 'queued' | 'expanded' | 'pruned' | 'visited' | 'witness')[]
  best: { id: number; value: number } | null
  processed: number[]
  expanded: number[]
  pruned: number[]
  last: number | null
  complete: boolean
  message: string
}
export const methodMax: MethodData = { sense: 'max', values: [0, 10, 8, 12, 10, 8, 7], bounds: [16, 14, 12, 12, 11, 9, 11] }
export const methodMin: MethodData = { sense: 'min', values: [0, 25, 30, 80, 94, 91, 88], bounds: [60, 70, 85, 80, 90, 90, 86] }
export const methodChildren = (id: number) => (id <= 3 ? [id * 2, id * 2 + 1] : [])
export function subtreeOptimum(data: MethodData, id: number): number {
  const children = methodChildren(id)
  if (!children.length) return data.values[id - 1]
  const values = children.map((child) => subtreeOptimum(data, child))
  return data.sense === 'max' ? Math.max(...values) : Math.min(...values)
}
const parse = (text: string) =>
  text
    .trim()
    .split(/[\s,]+/)
    .map(Number)
export function parseMethodData(sense: MethodSense, valuesText: string, boundsText: string): MethodData {
  const values = parse(valuesText),
    bounds = parse(boundsText)
  if (!valuesText.trim() || !boundsText.trim() || values.length !== 7 || bounds.length !== 7)
    throw new Error('Enter exactly 7 values and 7 bounds, one for each node.')
  if ([...values, ...bounds].some((v) => !Number.isInteger(v) || v < 0 || v > 999)) throw new Error('Values and bounds must be integers from 0 to 999.')
  const data = { sense, values, bounds }
  for (let id = 1; id <= 7; id++) {
    const optimum = subtreeOptimum(data, id),
      bound = bounds[id - 1]
    if (sense === 'max' ? bound < optimum : bound > optimum)
      throw new Error(
        `Unsafe bound at node ${id}: ${sense === 'max' ? 'upper bound must be at least' : 'lower bound must be at most'} ${optimum}, the best terminal value in that subtree.`,
      )
  }
  return data
}
export function tightMethodBounds(sense: MethodSense, valuesText: string): number[] {
  const values = parse(valuesText)
  if (!valuesText.trim() || values.length !== 7 || values.some((v) => !Number.isInteger(v) || v < 0 || v > 999))
    throw new Error('Enter 7 integer values from 0 to 999 before computing tight bounds.')
  const data = { sense, values, bounds: [] }
  return values.map((_, i) => subtreeOptimum(data, i + 1))
}
export const methodPrunable = (sense: MethodSense, bound: number, incumbent: number | null) =>
  incumbent !== null && (sense === 'max' ? bound <= incumbent : bound >= incumbent)
function ordered(data: MethodData, queue: number[], policy: MethodPolicy) {
  return policy === 'fifo'
    ? queue
    : queue.sort((a, b) => (data.sense === 'max' ? data.bounds[b - 1] - data.bounds[a - 1] : data.bounds[a - 1] - data.bounds[b - 1]) || a - b)
}
export function structuralMethodOrder(data: MethodData, policy: MethodPolicy): number[] {
  const queue = [1],
    result: number[] = []
  while (queue.length) {
    ordered(data, queue, policy)
    const id = queue.shift()!
    result.push(id)
    queue.push(...methodChildren(id))
  }
  return result
}
export function createMethod(data: MethodData, policy: MethodPolicy = 'best', seed: number | null = 4, pruning = true): MethodState {
  const copy = parseMethodData(data.sense, data.values.join(','), data.bounds.join(','))
  if (seed !== null && (!Number.isInteger(seed) || seed < 4 || seed > 7))
    throw new Error('The incumbent seed must be one of the complete terminal nodes 4–7, or none.')
  const status: MethodState['status'] = Array(7).fill('unreached')
  status[0] = 'queued'
  if (seed !== null) status[seed - 1] = 'witness'
  return {
    data: copy,
    policy,
    pruning,
    seed,
    frontier: [1],
    status,
    best: seed === null ? null : { id: seed, value: copy.values[seed - 1] },
    processed: [],
    expanded: [],
    pruned: [],
    last: null,
    complete: false,
    message:
      seed === null
        ? 'Root queued. No feasible incumbent has been found yet.'
        : `Seed incumbent ${copy.values[seed - 1]} from complete terminal node ${seed}. A partial score is not a feasibility certificate.`,
  }
}
export function methodCertified(state: MethodState) {
  return state.best !== null && state.frontier.every((id) => methodPrunable(state.data.sense, state.data.bounds[id - 1], state.best!.value))
}
export function advanceMethod(previous: MethodState): MethodState {
  if (previous.complete) return previous
  const frontier = ordered(previous.data, [...previous.frontier], previous.policy),
    id = frontier.shift()!,
    state: MethodState = {
      ...previous,
      frontier,
      status: [...previous.status],
      processed: [...previous.processed, id],
      expanded: [...previous.expanded],
      pruned: [...previous.pruned],
      last: id,
    },
    bound = state.data.bounds[id - 1],
    children = methodChildren(id)
  if (state.pruning && methodPrunable(state.data.sense, bound, state.best?.value ?? null)) {
    if (id === state.best!.id) state.status[id - 1] = 'witness'
    else {
      state.status[id - 1] = 'pruned'
      state.pruned.push(id)
    }
    state.message = `Prune node ${id}: bound ${bound} ${state.data.sense === 'max' ? '≤' : '≥'} incumbent ${state.best!.value}. No strictly better completion exists.`
  } else if (!children.length) {
    state.status[id - 1] = 'visited'
    const value = state.data.values[id - 1]
    if (!state.best || (state.data.sense === 'max' ? value > state.best.value : value < state.best.value)) state.best = { id, value }
    state.message = `Visit complete terminal node ${id}, objective ${value}. Incumbent is ${state.best!.value}.`
  } else {
    state.status[id - 1] = 'expanded'
    state.expanded.push(id)
    for (const child of children) {
      if (state.pruning && methodPrunable(state.data.sense, state.data.bounds[child - 1], state.best?.value ?? null)) {
        if (child === state.best!.id) state.status[child - 1] = 'witness'
        else {
          state.status[child - 1] = 'pruned'
          state.pruned.push(child)
        }
      } else {
        state.status[child - 1] = 'queued'
        state.frontier.push(child)
      }
    }
    ordered(state.data, state.frontier, state.policy)
    state.message = `Expand node ${id}; inspect children ${children.join(' and ')}. Keep promising children and prune only with a verified bound.`
  }
  state.complete = state.frontier.length === 0
  if (state.complete) state.message += ` Frontier empty: optimal terminal value ${state.best!.value} is proved.`
  return state
}
export function defaultMethod(data: MethodData = methodMax): MethodState {
  let state = createMethod(data)
  for (let i = 0; i < 2 && !state.complete; i++) state = advanceMethod(state)
  return state
}
export function unreachedReason(state: MethodState, id: number) {
  let parent = Math.floor(id / 2)
  while (parent) {
    if (state.status[parent - 1] === 'pruned')
      return `Unreached: ancestor node ${parent} was pruned. This node is shown as part of the potential tree, not as generated search work.`
    parent = Math.floor(parent / 2)
  }
  return 'Unreached potential node; its parent has not been expanded.'
}
