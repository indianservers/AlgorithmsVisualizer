export type TspTerm = { from: number; allowed: number[]; to: number; cost: number }
export type TspLower = { cost: number; unvisited: number[]; terms: TspTerm[]; value: number }
export type TspNode = { id: number; parent?: number; path: number[]; lower: TspLower; status: 'queued' | 'expanded' | 'pruned' | 'solution'; reason: string }
export type TspState = {
  matrix: number[][]
  source: number
  seeded: boolean
  nodes: TspNode[]
  frontier: number[]
  best: { cost: number; tour: number[]; step: number; seed: boolean } | null
  explored: number
  expanded: number
  pruned: number
  last: number | null
  complete: boolean
  paused: boolean
  message: string
}
export const tspFive = [
  [0, 10, 8, 14, 11],
  [10, 0, 12, 9, 20],
  [8, 12, 0, 11, 7],
  [14, 9, 11, 0, 6],
  [11, 20, 7, 6, 0],
]
export const tspFour = [
  [0, 10, 15, 20],
  [10, 0, 35, 25],
  [15, 35, 0, 30],
  [20, 25, 30, 0],
]
export const tourLabel = (path: number[]) => path.map((v) => v + 1).join(' → ')
export function parseTspMatrix(text: string, sourceText: string): { matrix: number[][]; source: number } {
  const matrix = text
      .trim()
      .split(/\r?\n/)
      .map((row) =>
        row
          .trim()
          .split(/[\s,]+/)
          .map(Number),
      ),
    n = matrix.length,
    source = Number(sourceText) - 1
  if (!text.trim() || n < 1 || n > 8 || matrix.some((row) => row.length !== n)) throw new Error('Enter a square matrix for 1 to 8 cities, one row per line.')
  if (matrix.some((row) => row.some((v) => !Number.isInteger(v) || v < 0 || v > 999))) throw new Error('Distances must be integers from 0 to 999.')
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      if (i === j && matrix[i][j] !== 0) throw new Error('Diagonal distances must be 0.')
      if (matrix[i][j] !== matrix[j][i]) throw new Error('Use a symmetric matrix: distance i to j must equal distance j to i.')
    }
  if (!sourceText.trim() || !Number.isInteger(source) || source < 0 || source >= n) throw new Error(`Start city must be an integer from 1 to ${n}.`)
  return { matrix, source }
}
export function tspTourCost(matrix: number[][], path: number[]): number {
  return path.slice(1).reduce((sum, to, i) => sum + matrix[path[i]][to], 0)
}
/** Each remaining outgoing edge occurs exactly once. Return-to-start is an allowed destination, not an extra addend. */
export function tspLower(matrix: number[][], path: number[]): TspLower {
  const source = path[0],
    last = path.at(-1)!,
    cost = tspTourCost(matrix, path),
    unvisited = matrix.map((_, v) => v).filter((v) => !path.includes(v))
  const make = (from: number, allowed: number[]): TspTerm => {
    const to = [...allowed].sort((a, b) => matrix[from][a] - matrix[from][b] || a - b)[0]
    return { from, allowed: [...allowed], to, cost: matrix[from][to] }
  }
  const terms = unvisited.length
    ? [make(last, unvisited), ...unvisited.map((from) => make(from, [...unvisited.filter((to) => to !== from), source]))]
    : [make(last, [source])]
  return { cost, unvisited, terms, value: cost + terms.reduce((sum, term) => sum + term.cost, 0) }
}
export function nearestTspTour(matrix: number[][], source: number) {
  const path = [source]
  while (path.length < matrix.length) {
    const last = path.at(-1)!,
      next = matrix
        .map((_, v) => v)
        .filter((v) => !path.includes(v))
        .sort((a, b) => matrix[last][a] - matrix[last][b] || a - b)[0]
    path.push(next)
  }
  path.push(source)
  const reverse = [...path].reverse(),
    firstDifference = path.findIndex((v, i) => v !== reverse[i]),
    tour = firstDifference >= 0 && reverse[firstDifference] < path[firstDifference] ? reverse : path
  return { tour, cost: tspTourCost(matrix, tour) }
}
export function createTsp(matrix: number[][], source = 0, seeded = true): TspState {
  const parsed = parseTspMatrix(matrix.map((row) => row.join(',')).join('\n'), String(source + 1)),
    copy = parsed.matrix
  return {
    matrix: copy,
    source,
    seeded,
    nodes: [{ id: 0, path: [source], lower: tspLower(copy, [source]), status: 'queued', reason: 'Root: the start city is fixed.' }],
    frontier: [0],
    best: seeded ? { ...nearestTspTour(copy, source), step: 0, seed: true } : null,
    explored: 0,
    expanded: 0,
    pruned: 0,
    last: null,
    complete: false,
    paused: false,
    message: seeded
      ? 'Seed a feasible nearest-neighbor tour. This is an upper bound, not yet a proof of optimality.'
      : 'Start without a feasible incumbent. Search must find a complete closed tour.',
  }
}
export function tspCertified(state: TspState): boolean {
  return state.best !== null && state.frontier.every((id) => state.nodes[id].lower.value >= state.best!.cost)
}
export function advanceTsp(previous: TspState, budget = 4095): TspState {
  if (previous.complete) return previous
  const current = previous.nodes[previous.frontier[0]],
    dominated = previous.best !== null && current.lower.value >= previous.best.cost
  if (!dominated && current.lower.unvisited.length && previous.nodes.length + current.lower.unvisited.length > budget)
    return {
      ...previous,
      paused: true,
      message: `Paused before expanding ${tourLabel(current.path)}: the ${budget}-node budget would be exceeded. The frontier is preserved; increase the budget to continue.`,
    }
  const state: TspState = {
      ...previous,
      nodes: previous.nodes.slice(),
      frontier: previous.frontier.slice(1),
      explored: previous.explored + 1,
      last: current.id,
      paused: false,
    },
    node = { ...current }
  state.nodes[node.id] = node
  if (dominated) {
    node.status = 'pruned'
    state.pruned++
    node.reason = `Lower bound ${node.lower.value} ≥ incumbent ${state.best!.cost}. No strictly cheaper completion exists.`
  } else if (!node.lower.unvisited.length) {
    const tour = [...node.path, state.source]
    state.best = { tour, cost: node.lower.value, step: state.explored, seed: false }
    node.status = 'solution'
    node.reason = `Close the tour with edge ${node.path.at(-1)! + 1} → ${state.source + 1}; total cost ${node.lower.value}.`
  } else {
    node.status = 'expanded'
    state.expanded++
    node.reason = `Expand the smallest lower bound ${node.lower.value}; extend to each unvisited city.`
    for (const v of node.lower.unvisited) {
      const path = [...node.path, v],
        lower = tspLower(state.matrix, path),
        pruned = state.best !== null && lower.value >= state.best.cost,
        id = state.nodes.length
      state.nodes.push({
        id,
        parent: node.id,
        path,
        lower,
        status: pruned ? 'pruned' : 'queued',
        reason: pruned
          ? `Lower bound ${lower.value} ≥ incumbent ${state.best!.cost}; prune on generation.`
          : `Add ${tourLabel(path)} to the frontier with lower bound ${lower.value}.`,
      })
      if (pruned) state.pruned++
      else state.frontier.push(id)
    }
  }
  state.frontier.sort((a, b) => state.nodes[a].lower.value - state.nodes[b].lower.value || a - b)
  state.complete = state.frontier.length === 0
  state.message = `${node.status === 'expanded' ? 'Expand' : node.status === 'solution' ? 'Visit complete tour' : 'Prune'} ${tourLabel(node.path)}. ${node.reason}${state.complete ? ` Frontier empty: optimal tour cost ${state.best!.cost} is proved.` : ''}`
  return state
}
export function initialTspTimeline() {
  const root = createTsp(tspFive),
    first = advanceTsp(root)
  return { state: advanceTsp(first), past: [root, first] }
}
export function stepTspTimeline(timeline: { state: TspState; past: TspState[] }, budget: number) {
  const next = advanceTsp(timeline.state, budget)
  if (next === timeline.state) return timeline
  return { state: next, past: next.explored === timeline.state.explored ? timeline.past : [...timeline.past.slice(-99), timeline.state] }
}
