import { Trace, type DaaInput, type LearningState } from './types'
import { arcs } from './graphs'
import { BacktrackingTrace } from './backtrackingTrace'

export function queens(input: DaaInput, t: Trace) {
  const n = input.n!
  if (n > 8) throw new Error('N-Queens visualization supports n ≤ 8.')
  const columns = new Set<number>(),
    down = new Set<number>(),
    up = new Set<number>(),
    placement: number[] = [],
    solutions: number[][] = []
  const bt = new BacktrackingTrace(t)
  const board = () => ({ table: Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => (placement[r] === c ? 'Q' : '·'))) })
  bt.emit('ready', 'Start with an empty board. Try rows and columns in increasing order.', [], 0, 0, board())
  function solve(row: number, parent = 0) {
    if (row === n) {
      solutions.push([...placement])
      bt.emit(
        'solution',
        `Solution ${solutions.length}: columns [${placement}]. All ${n} queens are nonattacking. Continue to enumerate other solutions.`,
        placement,
        row,
        parent,
        board(),
      )
      return
    }
    for (let c = 0; c < n; c++) {
      const conflicts = placement.map((col, r) => (col === c || Math.abs(col - c) === row - r ? r : -1)).filter((r) => r >= 0),
        safe = !columns.has(c) && !down.has(row - c) && !up.has(row + c)
      const id = bt.branch(parent, `r${row} → c${c}`, row + 1, safe ? 'choose' : 'reject'),
        reason = safe
          ? `Choose (${row},${c}): no queen shares its column or diagonals.`
          : `Reject (${row},${c}): attacked by queen(s) in row ${conflicts.join(', ')}.`
      const prediction = { question: `Choose or reject row ${row}, column ${c}?`, answer: safe ? 'choose' : 'reject', explanation: reason }
      if (!safe) {
        bt.emit('reject', reason, placement, row, id, board(), { candidate: c, conflicts, prediction })
        continue
      }
      columns.add(c)
      down.add(row - c)
      up.add(row + c)
      placement[row] = c
      bt.emit('choose', reason, placement, row, id, board(), { candidate: c, prediction })
      solve(row + 1, id)
      columns.delete(c)
      down.delete(row - c)
      up.delete(row + c)
      placement.pop()
      bt.emit('undo', `Undo (${row},${c}): remove the queen and restore its column and diagonal marks before trying a sibling.`, placement, row, id, board(), {
        candidate: c,
      })
    }
  }
  solve(0)
  bt.emit('complete', `Exhausted every safe branch. Found ${solutions.length} solution(s); the board is restored to empty.`, placement, 0, 0, board())
  return { count: solutions.length, solutions }
}
export function subsetSum(input: DaaInput, t: Trace) {
  if (input.values!.length > 16) throw new Error('Subset search supports at most 16 values.')
  const solutions: number[][] = [],
    chosen: number[] = []
  const bt = new BacktrackingTrace(t)
  bt.emit('ready', 'Start with sum 0. Each input index has an include and an exclude branch.', chosen, 0, 0, { values: input.values })
  function solve(index: number, sum: number, parent = 0) {
    if (index === input.values!.length) {
      const found = sum === input.target
      if (found) solutions.push([...chosen])
      const reason = `Leaf: chosen indices [${chosen}], sum ${sum} ${found ? '=' : '≠'} target ${input.target}. ${found ? 'Record this subset.' : 'Reject this complete subset.'}`
      bt.emit(
        found ? 'solution' : 'reject',
        reason,
        chosen,
        index,
        parent,
        { values: input.values, note: `sum=${sum}` },
        {
          prediction: { question: `Does the complete subset [${chosen}] sum to ${input.target}? (yes/no)`, answer: found ? 'yes' : 'no', explanation: reason },
        },
      )
      return
    }
    chosen.push(index)
    const include = bt.branch(parent, `+ index ${index}`, index + 1, 'choose')
    bt.emit('choose', `Include index ${index} (value ${input.values![index]}): sum ${sum} → ${sum + input.values![index]}.`, chosen, index, include, {
      values: input.values,
      note: `sum=${sum + input.values![index]}`,
    })
    solve(index + 1, sum + input.values![index], include)
    chosen.pop()
    bt.emit('undo', `Undo inclusion of index ${index}; restore sum ${sum}.`, chosen, index, include, { values: input.values, note: `sum=${sum}` })
    const exclude = bt.branch(parent, `− index ${index}`, index + 1, 'choose')
    bt.emit('choose', `Exclude index ${index}: keep sum ${sum}.`, chosen, index, exclude, { values: input.values, note: `sum=${sum}` })
    solve(index + 1, sum, exclude)
  }
  solve(0, 0)
  bt.emit(
    'complete',
    `All include/exclude branches explored; found ${solutions.length} subset(s). Equal values at different indices are distinct choices.`,
    chosen,
    0,
    0,
    { values: input.values, note: 'sum=0' },
  )
  return { subsets: solutions, count: solutions.length, interpretation: 'indices; equal-valued items remain distinct' }
}
export function coloring(input: DaaInput, t: Trace) {
  const n = input.vertices!,
    colors = Array(n).fill(-1),
    edges = arcs({ ...input, directed: false })
  const bt = new BacktrackingTrace(t),
    graph = () => ({ graph: { vertices: n, edges: input.edges!, directed: false, labels: colors.map((c) => (c < 0 ? 'uncolored' : `color ${c}`)) } })
  bt.emit(
    'ready',
    `Assign vertices in order using at most ${input.colors} colors. Edges are treated as undirected constraints; weights are ignored.`,
    colors,
    0,
    0,
    graph(),
  )
  if (input.edges!.some((e) => e.from === e.to)) {
    bt.emit('reject', 'A self-loop requires a vertex to differ from itself: no coloring exists.', colors, 0, 0, graph())
    return { satisfiable: false, colors: [] }
  }
  function solve(u: number, parent = 0): boolean {
    if (u === n) {
      bt.emit('solution', 'Every edge joins different colors. Stop at the first valid coloring.', colors, u, parent, graph())
      return true
    }
    for (let c = 0; c < input.colors!; c++) {
      const conflicts = [...new Set(edges.filter((e) => e.from === u && colors[e.to] === c).map((e) => e.to))],
        safe = conflicts.length === 0
      const id = bt.branch(parent, `v${u} → color ${c}`, u + 1, safe ? 'choose' : 'reject'),
        reason = safe
          ? `Choose color ${c} for vertex ${u}: no assigned neighbor has that color.`
          : `Reject color ${c} for vertex ${u}: neighbor(s) ${conflicts.join(', ')} already use it.`
      const prediction = { question: `Choose or reject color ${c} for vertex ${u}?`, answer: safe ? 'choose' : 'reject', explanation: reason }
      if (safe) {
        colors[u] = c
        bt.emit('choose', reason, colors, u, id, graph(), { candidate: c, prediction })
        if (solve(u + 1, id)) return true
        colors[u] = -1
        bt.emit('undo', `Undo vertex ${u}: color ${c} had no valid completion. Restore uncolored before trying the next color.`, colors, u, id, graph(), {
          candidate: c,
        })
      } else bt.emit('reject', reason, colors, u, id, graph(), { candidate: c, conflicts, prediction })
    }
    bt.emit('dead-end', `Vertex ${u} has no remaining safe color. Return to the previous vertex.`, colors, u, parent, graph())
    return false
  }
  const satisfiable = solve(0)
  bt.emit(
    'complete',
    satisfiable
      ? 'One valid coloring found; this is a decision problem, not enumeration or minimum-color optimization.'
      : 'All possible colorings failed; no solution exists for this color limit.',
    colors,
    0,
    0,
    graph(),
  )
  return { satisfiable, colors: satisfiable ? colors : [] }
}
export function hamiltonian(input: DaaInput, t: Trace) {
  const edges = arcs(input),
    path = [input.source!],
    used = new Set(path)
  const bt = new BacktrackingTrace(t),
    graph = () => ({
      graph: { vertices: input.vertices!, edges: input.edges!, directed: input.directed ?? false, selected: path.slice(1).map((v, i) => [path[i], v]) },
    })
  bt.emit(
    'ready',
    `Start at vertex ${path[0]}. Extend along edges to unused vertices. A full path must also have an edge back to the start.`,
    path,
    0,
    0,
    graph(),
  )
  function solve(parent = 0): boolean {
    if (path.length === input.vertices) {
      const closed = edges.some((e) => e.from === path.at(-1) && e.to === path[0]),
        reason = closed
          ? `Closing edge ${path.at(-1)} → ${path[0]} exists: a Hamiltonian cycle is found.`
          : `Full path, but closing edge ${path.at(-1)} → ${path[0]} is missing. Backtrack.`
      bt.emit(closed ? 'solution' : 'reject', reason, path, path.length - 1, parent, graph(), {
        closed,
        prediction: { question: `Can this full path close into a cycle? (yes/no)`, answer: closed ? 'yes' : 'no', explanation: reason },
      })
      return closed
    }
    for (let v = 0; v < input.vertices!; v++) {
      const adjacent = edges.some((e) => e.from === path.at(-1) && e.to === v),
        safe = adjacent && !used.has(v)
      const id = bt.branch(parent, `→ vertex ${v}`, path.length, safe ? 'choose' : 'reject'),
        reason = safe
          ? `Choose vertex ${v}: adjacent to ${path.at(-1)} and not yet visited.`
          : `Reject vertex ${v}: ${used.has(v) ? 'already visited' : 'no edge from the current endpoint'}.`
      const prediction = { question: `Choose or reject next vertex ${v}?`, answer: safe ? 'choose' : 'reject', explanation: reason }
      if (safe) {
        used.add(v)
        path.push(v)
        bt.emit('choose', reason, path, path.length - 1, id, graph(), { candidate: v, prediction })
        if (solve(id)) return true
        used.delete(path.pop()!)
        bt.emit('undo', `Undo vertex ${v}: this path has no cycle completion. Restore the previous endpoint and visited set.`, path, path.length, id, graph(), {
          candidate: v,
        })
      } else bt.emit('reject', reason, path, path.length - 1, id, graph(), { candidate: v, prediction })
    }
    bt.emit('dead-end', 'No remaining neighbor leads to a cycle. Return to the previous choice.', path, path.length - 1, parent, graph())
    return false
  }
  const exists = solve()
  bt.emit(
    'complete',
    exists
      ? 'Found a source-starting cycle visiting every vertex exactly once before returning.'
      : 'All source-starting paths exhausted; no Hamiltonian cycle exists.',
    path,
    0,
    0,
    graph(),
    { closed: exists },
  )
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
