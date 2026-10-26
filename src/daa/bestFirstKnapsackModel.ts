import {
  createFifo,
  fifoBound,
  fifoDominated,
  formatFifoBound,
  type FifoInput as KnapsackInput,
  type FifoItem as KnapsackItem,
  type FifoNode as BestNode,
} from './fifoKnapsackModel'

export type BestEvent = {
  step: number
  action: string
  node: number
  weight: number
  profit: number
  bound: string
  frontier: number[]
  incumbent: number
  note: string
}
export type BestState = {
  input: KnapsackInput
  items: KnapsackItem[]
  nodes: BestNode[]
  frontier: number[]
  best: { profit: number; weight: number; chosen: number[]; node: number | null }
  explored: number
  expanded: number
  pruned: number
  last: number | null
  complete: boolean
  paused: boolean
  message: string
  history: BestEvent[]
}
export const bestExample: KnapsackInput = { weights: [2, 3, 4, 5], profits: [6, 5, 8, 6], capacity: 5 }
/** Exact decreasing rational bound, with stable insertion ID as the tie-break. */
export function compareBestNodes(a: BestNode, b: BestNode): number {
  if (!a.bound) return !b.bound ? a.id - b.id : 1
  if (!b.bound) return -1
  return b.bound.numerator * a.bound.denominator - a.bound.numerator * b.bound.denominator || a.id - b.id
}
export function bestCertified(state: BestState) {
  return state.frontier.every((id) => fifoDominated(state.nodes[id], state.best.profit))
}
export function createBest(input: KnapsackInput): BestState {
  const initial = createFifo(input),
    root = initial.nodes[0]
  return {
    input: initial.input,
    items: initial.items,
    nodes: initial.nodes,
    frontier: [0],
    best: initial.best,
    explored: 0,
    expanded: 0,
    pruned: 0,
    last: null,
    complete: false,
    paused: false,
    message: 'Insert the root into the priority frontier. The empty subset gives a feasible incumbent of 0.',
    history: [
      {
        step: 0,
        action: 'Start',
        node: 0,
        weight: 0,
        profit: 0,
        bound: formatFifoBound(root.bound),
        frontier: [0],
        incumbent: 0,
        note: 'Root inserted. No item decisions yet.',
      },
    ],
  }
}
/** Process one maximum-bound node. Feasible children update the incumbent as soon as they are generated. */
export function advanceBest(previous: BestState, budget = 4095): BestState {
  if (previous.complete) return previous
  const current = previous.nodes[previous.frontier[0]],
    dominated = fifoDominated(current, previous.best.profit)
  const terminal = current.level === previous.items.length || current.weight === previous.input.capacity
  if (!dominated && !terminal && previous.nodes.length + 2 > budget)
    return {
      ...previous,
      paused: true,
      message: `Paused before processing node ${current.id}: the ${budget}-node budget would be exceeded. Increase the budget to resume; the frontier is preserved.`,
    }
  const state: BestState = {
    ...previous,
    nodes: previous.nodes.slice(),
    frontier: previous.frontier.slice(1),
    explored: previous.explored + 1,
    last: current.id,
    paused: false,
  }
  const node = { ...current }
  state.nodes[node.id] = node
  let action: string, note: string
  if (dominated) {
    node.status = 'pruned'
    state.pruned++
    action = 'Prune'
    note = `Upper bound ${formatFifoBound(node.bound)} ≤ incumbent ${state.best.profit}; no strictly better completion exists.`
    node.reason = note
  } else if (terminal) {
    node.status = 'terminal'
    action = 'Visit'
    note = 'No remaining feasible item choice can improve this terminal node.'
    node.reason = note
  } else {
    node.status = 'expanded'
    state.expanded++
    action = 'Expand'
    const item = state.items[node.level],
      childIds: number[] = []
    for (const take of [true, false]) {
      const weight = node.weight + (take ? item.weight : 0),
        profit = node.profit + (take ? item.profit : 0),
        id = state.nodes.length
      const child: BestNode = {
        id,
        parent: node.id,
        level: node.level + 1,
        weight,
        profit,
        chosen: take ? [...node.chosen, item.id] : [...node.chosen],
        take,
        status: 'queued',
        bound: fifoBound(state.items, state.input.capacity, node.level + 1, weight, profit),
        reason: `${take ? 'Include' : 'Exclude'} item ${item.id}.`,
      }
      if (!child.bound) {
        child.status = 'pruned'
        state.pruned++
        child.reason += ' Infeasible: weight exceeds capacity.'
      } else {
        if (profit > state.best.profit) state.best = { profit, weight, chosen: [...child.chosen].sort((a, b) => a - b), node: id }
        if (fifoDominated(child, state.best.profit)) {
          if (state.best.node === id) {
            child.status = 'terminal'
            child.reason += ' Feasible incumbent; its bound equals its profit.'
          } else {
            child.status = 'pruned'
            state.pruned++
            child.reason += ` Bound ${formatFifoBound(child.bound)} ≤ incumbent ${state.best.profit}.`
          }
        } else {
          state.frontier.push(id)
          child.reason += ` Insert into the priority frontier with bound ${formatFifoBound(child.bound)}.`
        }
      }
      state.nodes.push(child)
      childIds.push(id)
    }
    node.reason = `Expanded: include / exclude item ${item.id}.`
    note = `Generate children ${childIds.join(' and ')}. Incumbent ${previous.best.profit} → ${state.best.profit}.`
  }
  state.frontier.sort((a, b) => compareBestNodes(state.nodes[a], state.nodes[b]))
  state.complete = state.frontier.length === 0
  state.message = `${action} node ${node.id} (maximum bound ${formatFifoBound(node.bound)}). ${note}${state.complete ? ` Frontier empty: optimal profit ${state.best.profit} is proved.` : ''}`
  // Event rows contain complete frontier snapshots; cap retained history independently of the node budget.
  state.history = [
    ...previous.history.slice(-199),
    {
      step: state.explored,
      action,
      node: node.id,
      weight: node.weight,
      profit: node.profit,
      bound: formatFifoBound(node.bound),
      frontier: [...state.frontier],
      incumbent: state.best.profit,
      note,
    },
  ]
  return state
}
export function defaultBest(): BestState {
  let state = createBest(bestExample)
  for (let i = 0; i < 3; i++) state = advanceBest(state)
  return state
}
