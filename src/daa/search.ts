import { Trace, type DaaInput, type LearningState } from './types'
import { arcs } from './graphs'

export function queens(input: DaaInput, t: Trace) {
  const n = input.n!
  if (n > 8) throw new Error('N-Queens visualization supports n ≤ 8.')
  const columns = new Set<number>(),
    down = new Set<number>(),
    up = new Set<number>(),
    placement: number[] = [],
    solutions: number[][] = []
  function solve(row: number) {
    if (row === n) {
      solutions.push([...placement])
      t.add(
        `Solution ${solutions.length}: ${placement}.`,
        { table: Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => (placement[r] === c ? 'Q' : '·'))) },
        2,
      )
      return
    }
    for (let c = 0; c < n; c++) {
      if (columns.has(c) || down.has(row - c) || up.has(row + c)) continue
      columns.add(c)
      down.add(row - c)
      up.add(row + c)
      placement[row] = c
      t.add(
        `Place queen at row ${row}, column ${c}.`,
        { table: Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, column) => (r <= row && placement[r] === column ? 'Q' : '·'))) },
        1,
      )
      solve(row + 1)
      columns.delete(c)
      down.delete(row - c)
      up.delete(row + c)
      placement.pop()
      t.add(`Undo row ${row}, column ${c}.`, { values: placement }, 3)
    }
  }
  solve(0)
  return { count: solutions.length, solutions }
}
export function subsetSum(input: DaaInput, t: Trace) {
  if (input.values!.length > 16) throw new Error('Subset search supports at most 16 values.')
  const solutions: number[][] = [],
    chosen: number[] = []
  const search: NonNullable<LearningState['search']> = []
  function solve(index: number, sum: number, parent?: number) {
    const id = search.length
    search.push({ id, parent, label: `i=${index}, sum=${sum}` })
    t.add(`Explore subset state ${id}.`, { search }, 1)
    if (index === input.values!.length) {
      if (sum === input.target) solutions.push([...chosen])
      return
    }
    chosen.push(index)
    solve(index + 1, sum + input.values![index], id)
    chosen.pop()
    solve(index + 1, sum, id)
  }
  solve(0, 0)
  return { subsets: solutions, count: solutions.length, interpretation: 'indices; equal-valued items remain distinct' }
}
export function coloring(input: DaaInput, t: Trace) {
  const n = input.vertices!,
    colors = Array(n).fill(-1),
    edges = arcs({ ...input, directed: false })
  if (input.edges!.some((e) => e.from === e.to)) return { satisfiable: false, colors: [] }
  function solve(u: number): boolean {
    if (u === n) return true
    for (let c = 0; c < input.colors!; c++)
      if (!edges.some((e) => e.from === u && colors[e.to] === c)) {
        colors[u] = c
        t.add(
          `Try color ${c} on vertex ${u}.`,
          { graph: { vertices: n, edges: input.edges!, directed: false, labels: colors.map((c) => (c < 0 ? 'uncolored' : `color ${c}`)) } },
          1,
        )
        if (solve(u + 1)) return true
        colors[u] = -1
        t.add(`Undo vertex ${u}.`, { values: colors }, 2)
      }
    return false
  }
  const satisfiable = solve(0)
  return { satisfiable, colors: satisfiable ? colors : [] }
}
export function hamiltonian(input: DaaInput, t: Trace) {
  const edges = arcs(input),
    path = [input.source!],
    used = new Set(path)
  function solve(): boolean {
    if (path.length === input.vertices) return edges.some((e) => e.from === path.at(-1) && e.to === path[0])
    for (const e of edges.filter((e) => e.from === path.at(-1)))
      if (!used.has(e.to)) {
        used.add(e.to)
        path.push(e.to)
        t.add(`Extend path to ${e.to}.`, { values: path }, 1)
        if (solve()) return true
        used.delete(path.pop()!)
        t.add('Undo dead end.', { values: path }, 2)
      }
    return false
  }
  const exists = solve()
  return { exists, cycle: exists ? [...path, path[0]] : [] }
}
type Node = { id: number; parent?: number; index: number; weight: number; profit: number; chosen: number[]; bound: number }
export function boundedKnapsack(input: DaaInput, t: Trace, fifo = false) {
  if (input.weights!.length > 16) throw new Error('Branch and bound supports at most 16 items.')
  const items = input.weights!.map((w, id) => ({ w, p: input.profits![id], id })).sort((a, b) => b.p / b.w - a.p / a.w)
  const bound = (index: number, weight: number, profit: number) => {
    if (weight > input.capacity!) return -Infinity
    let capacity = input.capacity! - weight,
      value = profit
    for (let i = index; i < items.length && capacity > 0; i++) {
      const fraction = Math.min(1, capacity / items[i].w)
      value += items[i].p * fraction
      capacity -= items[i].w * fraction
    }
    return value
  }
  let best = 0,
    chosen: number[] = [],
    nextId = 1
  const queue: Node[] = [{ id: 0, index: 0, weight: 0, profit: 0, chosen: [], bound: bound(0, 0, 0) }],
    search: NonNullable<LearningState['search']> = []
  while (queue.length) {
    if (!fifo) queue.sort((a, b) => b.bound - a.bound)
    const node = queue.shift()!,
      pruned = node.weight > input.capacity! || node.bound <= best
    search.push({
      id: node.id,
      parent: node.parent,
      label: `w=${node.weight}, p=${node.profit}`,
      bound: Number.isFinite(node.bound) ? node.bound : undefined,
      pruned,
    })
    t.add(`${pruned ? 'Prune' : 'Expand'} node ${node.id}: upper bound ${node.bound}, incumbent ${best}.`, { search }, 1)
    if (pruned) continue
    if (node.profit > best) {
      best = node.profit
      chosen = node.chosen
    }
    if (node.index === items.length) continue
    const item = items[node.index],
      index = node.index + 1
    for (const take of [true, false]) {
      const weight = node.weight + (take ? item.w : 0),
        profit = node.profit + (take ? item.p : 0)
      queue.push({
        id: nextId++,
        parent: node.id,
        index,
        weight,
        profit,
        chosen: take ? [...node.chosen, item.id] : node.chosen,
        bound: bound(index, weight, profit),
      })
    }
  }
  return {
    profit: best,
    items: chosen.sort((a, b) => a - b),
    weight: chosen.reduce((s, id) => s + input.weights![id], 0),
    strategy: fifo ? 'FIFO' : 'best-first (least negative upper bound)',
  }
}
export function knapsackFifo(i: DaaInput, t: Trace) {
  return boundedKnapsack(i, t, true)
}
export function knapsackBest(i: DaaInput, t: Trace) {
  return boundedKnapsack(i, t)
}
export function boundedTsp(input: DaaInput, t: Trace) {
  const n = input.vertices!,
    source = input.source!,
    d = Array.from({ length: n }, () => Array(n).fill(Infinity))
  arcs(input).forEach((e) => (d[e.from][e.to] = Math.min(d[e.from][e.to], e.weight)))
  if (n === 1) return { cost: 0, tour: [source, source], exists: true }
  type State = { id: number; parent?: number; path: number[]; cost: number; bound: number }
  const lower = (path: number[], cost: number) => {
    const last = path.at(-1)!,
      unvisited = Array.from({ length: n }, (_, v) => v).filter((v) => !path.includes(v))
    if (!unvisited.length) return cost + d[last][source]
    let value = cost + Math.min(...unvisited.map((v) => d[last][v]))
    for (const u of unvisited) value += Math.min(d[u][source], ...unvisited.filter((v) => v !== u).map((v) => d[u][v]))
    return value
  }
  const q: State[] = [{ id: 0, path: [source], cost: 0, bound: lower([source], 0) }],
    search: NonNullable<LearningState['search']> = []
  let best = Infinity,
    tour: number[] = [],
    next = 1
  while (q.length) {
    q.sort((a, b) => a.bound - b.bound)
    const node = q.shift()!,
      pruned = node.bound >= best
    search.push({ id: node.id, parent: node.parent, label: node.path.join('→'), bound: Number.isFinite(node.bound) ? node.bound : undefined, pruned })
    t.add(`${pruned ? 'Prune' : 'Expand'} ${node.path}: lower bound ${node.bound}, incumbent ${best}.`, { search }, 1)
    if (pruned) continue
    if (node.path.length === n) {
      best = node.bound
      tour = [...node.path, source]
      continue
    }
    const last = node.path.at(-1)!
    for (let v = 0; v < n; v++)
      if (!node.path.includes(v) && d[last][v] < Infinity) {
        const path = [...node.path, v],
          cost = node.cost + d[last][v]
        q.push({ id: next++, parent: node.id, path, cost, bound: lower(path, cost) })
      }
  }
  return { cost: Number.isFinite(best) ? best : null, tour, exists: tour.length > 0 }
}
