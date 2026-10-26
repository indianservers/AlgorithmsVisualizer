export type FifoInput = { weights: number[]; profits: number[]; capacity: number }
export type FifoItem = { id: number; weight: number; profit: number }
export type FifoBound = {
  numerator: number
  denominator: number
  value: number
  fills: { item: number; weight: number; profit: number; numerator: number; denominator: number }[]
}
export type FifoNode = {
  id: number
  parent?: number
  level: number
  weight: number
  profit: number
  chosen: number[]
  take?: boolean
  status: 'queued' | 'expanded' | 'pruned' | 'terminal'
  reason: string
  bound: FifoBound | null
}
export type FifoState = {
  input: FifoInput
  items: FifoItem[]
  nodes: FifoNode[]
  queue: number[]
  best: { profit: number; weight: number; chosen: number[]; node: number | null }
  explored: number
  expanded: number
  pruned: number
  last: number | null
  complete: boolean
  paused: boolean
  message: string
}
export const fifoExample: FifoInput = { weights: [2, 3, 4, 5], profits: [3, 4, 5, 6], capacity: 5 }

export function parseFifoInput(weights: string, profits: string, capacity: string): FifoInput {
  const parse = (text: string) =>
    text
      .trim()
      .split(/[\s,]+/)
      .map(Number)
  const w = parse(weights),
    p = parse(profits),
    c = Number(capacity)
  if (!weights.trim() || !profits.trim() || w.length !== p.length || w.length > 20)
    throw new Error('Enter 1 to 20 items with the same number of weights and profits.')
  if (w.some((n) => !Number.isInteger(n) || n < 1 || n > 100)) throw new Error('Weights must be integers from 1 to 100.')
  if (p.some((n) => !Number.isInteger(n) || n < 0 || n > 100)) throw new Error('Profits must be integers from 0 to 100.')
  if (!capacity.trim() || !Number.isInteger(c) || c < 0 || c > 200) throw new Error('Capacity must be an integer from 0 to 200.')
  return { weights: w, profits: p, capacity: c }
}

/** Exact rational arithmetic: at most the final remaining item is fractional. */
export function fifoBound(items: FifoItem[], capacity: number, level: number, weight: number, profit: number): FifoBound | null {
  if (weight > capacity) return null
  let remaining = capacity - weight,
    whole = profit,
    numerator = profit,
    denominator = 1
  const fills: FifoBound['fills'] = []
  for (const item of items.slice(level)) {
    if (remaining === 0) break
    const used = Math.min(remaining, item.weight)
    fills.push({ item: item.id, weight: item.weight, profit: item.profit, numerator: used, denominator: item.weight })
    if (used === item.weight) {
      whole += item.profit
      numerator = whole
    } else {
      denominator = item.weight
      numerator = whole * denominator + used * item.profit
    }
    remaining -= used
  }
  return { numerator, denominator, value: numerator / denominator, fills }
}

export function createFifo(input: FifoInput): FifoState {
  const copy = parseFifoInput(input.weights.join(','), input.profits.join(','), String(input.capacity))
  const items = copy.weights
    .map((weight, i) => ({ id: i + 1, weight, profit: copy.profits[i] }))
    .sort((a, b) => b.profit * a.weight - a.profit * b.weight || a.id - b.id)
  return {
    input: copy,
    items,
    nodes: [
      {
        id: 0,
        level: 0,
        weight: 0,
        profit: 0,
        chosen: [],
        status: 'queued',
        reason: 'Root: no decisions yet.',
        bound: fifoBound(items, copy.capacity, 0, 0, 0),
      },
    ],
    queue: [0],
    best: { profit: 0, weight: 0, chosen: [], node: null },
    explored: 0,
    expanded: 0,
    pruned: 0,
    last: null,
    complete: false,
    paused: false,
    message: 'Enqueue the root. The empty subset gives a feasible incumbent of 0.',
  }
}

export function fifoDominated(node: FifoNode, profit: number): boolean {
  return node.bound === null || node.bound.numerator <= profit * node.bound.denominator
}
export function fifoCertified(state: FifoState): boolean {
  return state.queue.every((id) => fifoDominated(state.nodes[id], state.best.profit))
}
/** Dequeue exactly one FIFO node. Children remain queued until their own eligibility check. */
export function advanceFifo(previous: FifoState, budget = 4095): FifoState {
  if (previous.complete) return previous
  const current = previous.nodes[previous.queue[0]],
    bestProfit = previous.best.profit
  const dominated = fifoDominated(current, bestProfit)
  const needsChildren = !dominated && current.level < previous.items.length && current.weight < previous.input.capacity
  if (needsChildren && previous.nodes.length + 2 > budget)
    return {
      ...previous,
      paused: true,
      message: `Paused at the ${budget}-node budget before removing node ${current.id}. Increase the budget to continue; unexplored branches remain.`,
    }
  const state: FifoState = {
    ...previous,
    nodes: previous.nodes.slice(),
    queue: previous.queue.slice(1),
    explored: previous.explored + 1,
    last: current.id,
    paused: false,
  }
  const node = { ...current }
  state.nodes[node.id] = node
  if (dominated) {
    node.status = 'pruned'
    node.reason =
      node.bound === null
        ? 'Infeasible: weight exceeds capacity.'
        : `Upper bound ${formatFifoBound(node.bound)} ≤ incumbent ${bestProfit}; no strictly better completion exists.`
    state.pruned++
    state.message = `Dequeue node ${node.id}. ${node.reason}`
  } else {
    if (node.profit > state.best.profit) state.best = { profit: node.profit, weight: node.weight, chosen: [...node.chosen], node: node.id }
    if (!needsChildren) {
      node.status = 'terminal'
      node.reason =
        node.level === state.items.length ? 'All item decisions are fixed.' : 'Capacity is full; all remaining positive-weight items must be skipped.'
      state.message = `Dequeue node ${node.id}. ${node.reason} Incumbent is ${state.best.profit}.`
    } else {
      node.status = 'expanded'
      state.expanded++
      const item = state.items[node.level],
        ids: number[] = []
      for (const take of [true, false]) {
        const weight = node.weight + (take ? item.weight : 0),
          profit = node.profit + (take ? item.profit : 0),
          id = state.nodes.length
        state.nodes.push({
          id,
          parent: node.id,
          level: node.level + 1,
          weight,
          profit,
          chosen: take ? [...node.chosen, item.id] : [...node.chosen],
          take,
          status: 'queued',
          reason: `${take ? 'Take' : 'Skip'} item ${item.id}. Awaiting FIFO eligibility check.`,
          bound: fifoBound(state.items, state.input.capacity, node.level + 1, weight, profit),
        })
        state.queue.push(id)
        ids.push(id)
      }
      node.reason = `Expanded: take / skip item ${item.id}.`
      state.message = `Dequeue node ${node.id}; append children ${ids.join(' and ')} to the back of the FIFO queue. Incumbent is ${state.best.profit}.`
    }
  }
  state.complete = state.queue.length === 0
  if (state.complete) state.message += ` Queue empty: optimal profit ${state.best.profit} is proved.`
  return state
}
export function defaultFifo(): FifoState {
  let state = createFifo(fifoExample)
  for (let i = 0; i < 4; i++) state = advanceFifo(state)
  return state
}
export function formatFifoBound(bound: FifoBound | null): string {
  if (bound === null) return 'infeasible'
  const rounded = Number(bound.value.toFixed(3))
  return `${rounded === bound.value ? '' : '≈ '}${rounded}`
}
