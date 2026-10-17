import { Trace, type DaaInput } from './types'
import { arcs } from './graphs'
import { DPTrace, displayValue, type Coordinate } from './dpTrace'

export function fibonacciTable(input: DaaInput, t: Trace) {
  const n = input.n!,
    dp = Array(n + 1).fill(0) as number[]
  if (n > 0) dp[1] = 1
  const d = new DPTrace(
    t,
    [dp],
    ['F(i)'],
    dp.map((_, i) => String(i)),
  )
  d.mark([0, 0])
  if (n > 0) d.mark([0, 1])
  d.emit(`Seed F(0)=0${n > 0 ? ', F(1)=1' : ''}.`, 'base', undefined, [], [], 'The recurrence needs two smaller Fibonacci states.')
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2]
    d.mark([0, i])
    d.emit(
      `F(${i}) = ${dp[i - 1]} + ${dp[i - 2]} = ${dp[i]}.`,
      'choose',
      [0, i],
      [
        { cell: [0, i - 1], label: 'previous' },
        { cell: [0, i - 2], label: 'two before' },
      ],
      [],
      `${dp[i - 1]} + ${dp[i - 2]} = ${dp[i]}`,
    )
  }
  return { value: dp[n] }
}
export function fibonacciMemo(input: DaaInput, t: Trace) {
  const n = input.n!,
    memo = new Map<number, number>([
      [0, 0],
      [1, 1],
    ]),
    dp = Array(n + 1).fill(0) as number[],
    stack: number[] = []
  if (n > 0) dp[1] = 1
  const d = new DPTrace(
    t,
    [dp],
    ['memo[i]'],
    dp.map((_, i) => String(i)),
  )
  d.stack = stack
  d.mark([0, 0])
  if (n > 0) d.mark([0, 1])
  d.emit('Cache the base cases before recursion.', 'base')
  const emit = (
    message: string,
    phase: 'call' | 'reuse' | 'choose',
    focus: Coordinate,
    deps: { cell: Coordinate; label: string }[] = [],
    expression = message,
  ) => {
    d.emit(message, phase, focus, deps, [], expression)
  }
  function solve(i: number): number {
    stack.push(i)
    if (memo.has(i)) {
      emit(`Reuse F(${i})=${memo.get(i)} from cache.`, 'reuse', [0, i])
      stack.pop()
      return memo.get(i)!
    }
    emit(`Call F(${i}): solve F(${i - 1}) and F(${i - 2}) first.`, 'call', [0, i])
    const left = solve(i - 1),
      right = solve(i - 2),
      value = left + right
    dp[i] = value
    memo.set(i, value)
    d.mark([0, i])
    emit(
      `Memoize F(${i})=${value}.`,
      'choose',
      [0, i],
      [
        { cell: [0, i - 1], label: 'F(i−1)' },
        { cell: [0, i - 2], label: 'F(i−2)' },
      ],
      `${left} + ${right} = ${value}`,
    )
    stack.pop()
    return value
  }
  const value = solve(n)
  d.emit(`F(${n}) = ${value}; every call has returned and the stack is empty.`, 'complete', [0, n])
  return { value }
}
export function coinChange(input: DaaInput, t: Trace) {
  const coins = input.values!,
    amount = input.amount!
  if (coins.some((c) => !Number.isInteger(c) || c <= 0)) throw new Error('Coins must be positive integers.')
  const dp = Array(amount + 1).fill(Infinity) as number[],
    choice = Array(amount + 1).fill(-1) as number[],
    shown = dp.map(displayValue)
  dp[0] = 0
  shown[0] = 0
  const d = new DPTrace(
    t,
    [shown],
    ['min coins'],
    shown.map((_, i) => String(i)),
  )
  d.mark([0, 0])
  d.emit('Amount 0 needs 0 coins; other amounts are initially unreachable.', 'base')
  for (let a = 1; a <= amount; a++) {
    const candidates = coins.filter((c) => c <= a).map((c) => ({ label: `last coin ${c}: 1 + dp[${a - c}]`, value: displayValue(dp[a - c] + 1) }))
    for (const c of coins)
      if (c <= a && dp[a - c] + 1 < dp[a]) {
        dp[a] = dp[a - c] + 1
        choice[a] = c
      }
    shown[a] = displayValue(dp[a])
    d.mark([0, a])
    d.emit(
      `Minimum coins for amount ${a}: ${shown[a]}.`,
      'choose',
      [0, a],
      coins.filter((c) => c <= a).map((c) => ({ cell: [0, a - c] as Coordinate, label: `use coin ${c}` })),
      candidates,
      `min(${candidates.map((c) => String(c.value)).join(', ') || 'no feasible coin'}) = ${shown[a]}`,
    )
  }
  const selected: number[] = [],
    path: Coordinate[] = []
  d.path = path
  if (dp[amount] < Infinity)
    for (let a = amount; a > 0; ) {
      const c = choice[a]
      selected.push(c)
      path.push([0, a])
      d.emit(
        `Take coin ${c}; remaining amount ${a - c}.`,
        'traceback',
        [0, a],
        [{ cell: [0, a - c], label: 'remaining amount' }],
        [],
        `Follow the chosen last coin ${c}.`,
      )
      a -= c
    }
  return { minimum: Number.isFinite(dp[amount]) ? dp[amount] : null, coins: selected, reachable: dp[amount] < Infinity }
}
export function knapsack(input: DaaInput, t: Trace) {
  const weights = input.weights!,
    profits = input.profits!,
    n = weights.length,
    C = input.capacity!,
    dp = Array.from({ length: n + 1 }, () => Array(C + 1).fill(0) as number[])
  const d = new DPTrace(
    t,
    dp,
    Array.from({ length: n + 1 }, (_, i) => `${i} items`),
    Array.from({ length: C + 1 }, (_, i) => String(i)),
  )
  for (let c = 0; c <= C; c++) d.mark([0, c])
  d.emit('No items gives profit 0 at every capacity.', 'base')
  for (let i = 1; i <= n; i++)
    for (let c = 0; c <= C; c++) {
      const w = weights[i - 1],
        p = profits[i - 1],
        skip = dp[i - 1][c],
        take = w <= c ? p + dp[i - 1][c - w] : -Infinity
      dp[i][c] = Math.max(skip, take)
      d.mark([i, c])
      d.emit(
        `Item ${i - 1}, capacity ${c}: ${take > skip ? 'include' : 'exclude'} gives profit ${dp[i][c]}.`,
        'choose',
        [i, c],
        [{ cell: [i - 1, c], label: 'exclude' }, ...(w <= c ? [{ cell: [i - 1, c - w] as Coordinate, label: 'remaining capacity' }] : [])],
        [{ label: 'Exclude item', value: skip }, ...(w <= c ? [{ label: `Include item: ${p} + ${dp[i - 1][c - w]}`, value: take }] : [])],
        w <= c ? `max(${skip}, ${p} + ${dp[i - 1][c - w]}) = ${dp[i][c]}` : `Weight ${w} exceeds capacity ${c}; copy ${skip}.`,
      )
    }
  const items: number[] = [],
    path: Coordinate[] = []
  let c = C
  d.path = path
  for (let i = n; i > 0; i--) {
    const take = dp[i][c] !== dp[i - 1][c]
    path.push([i, c])
    d.emit(
      `${take ? 'Take' : 'Skip'} item ${i - 1}${take ? `; gain ${profits[i - 1]}` : ''}.`,
      'traceback',
      [i, c],
      [{ cell: [i - 1, take ? c - weights[i - 1] : c], label: 'previous decision' }],
    )
    if (take) {
      items.push(i - 1)
      c -= weights[i - 1]
    }
  }
  return { profit: dp[n][C], items: items.reverse(), weight: C - c }
}
export function lcs(input: DaaInput, t: Trace) {
  const a = input.left!,
    b = input.right!,
    dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0) as number[]),
    d = new DPTrace(t, dp, ['∅', ...a.split('')], ['∅', ...b.split('')])
  for (let i = 0; i <= a.length; i++) d.mark([i, 0])
  for (let j = 0; j <= b.length; j++) d.mark([0, j])
  d.emit('An empty prefix has LCS length 0.', 'base')
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      const match = a[i - 1] === b[j - 1]
      dp[i][j] = match ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
      d.mark([i, j])
      d.emit(
        `L[${i},${j}] = ${dp[i][j]} (${match ? 'match diagonal' : 'best of up/left'}).`,
        'choose',
        [i, j],
        match
          ? [{ cell: [i - 1, j - 1], label: 'match diagonal' }]
          : [
              { cell: [i - 1, j], label: 'drop left-string character' },
              { cell: [i, j - 1], label: 'drop right-string character' },
            ],
        [],
        match
          ? `'${a[i - 1]}' = '${b[j - 1]}': ${dp[i - 1][j - 1]} + 1 = ${dp[i][j]}`
          : `'${a[i - 1]}' ≠ '${b[j - 1]}': max(${dp[i - 1][j]}, ${dp[i][j - 1]}) = ${dp[i][j]}`,
      )
    }
  let i = a.length,
    j = b.length,
    sequence = ''
  const path: Coordinate[] = []
  d.path = path
  while (i && j) {
    path.push([i, j])
    const match = a[i - 1] === b[j - 1]
    d.emit(match ? `Match '${a[i - 1]}' and move diagonally.` : `Follow the larger neighbor from L[${i},${j}].`, 'traceback', [i, j])
    if (match) {
      sequence = a[i - 1] + sequence
      i--
      j--
    } else if (dp[i - 1][j] >= dp[i][j - 1]) i--
    else j--
  }
  d.emit(`Traceback reconstructs ${sequence || 'the empty subsequence'}.`, 'traceback')
  return { length: dp[a.length][b.length], sequence }
}
export function editDistance(input: DaaInput, t: Trace) {
  const a = input.left!,
    b = input.right!,
    dp = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))),
    d = new DPTrace(t, dp, ['∅', ...a.split('')], ['∅', ...b.split('')])
  for (let i = 0; i <= a.length; i++) d.mark([i, 0])
  for (let j = 0; j <= b.length; j++) d.mark([0, j])
  d.emit('Seed empty-prefix deletion and insertion costs.', 'base')
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      const cost = Number(a[i - 1] !== b[j - 1]),
        candidates = [
          { label: 'Delete', value: dp[i - 1][j] + 1 },
          { label: 'Insert', value: dp[i][j - 1] + 1 },
          { label: cost ? 'Replace' : 'Keep', value: dp[i - 1][j - 1] + cost },
        ]
      dp[i][j] = Math.min(...candidates.map((c) => c.value))
      d.mark([i, j])
      d.emit(
        `E[${i},${j}]=${dp[i][j]}.`,
        'choose',
        [i, j],
        [
          { cell: [i - 1, j], label: 'delete' },
          { cell: [i, j - 1], label: 'insert' },
          { cell: [i - 1, j - 1], label: cost ? 'replace' : 'keep' },
        ],
        candidates,
        `min(${dp[i - 1][j]}+1, ${dp[i][j - 1]}+1, ${dp[i - 1][j - 1]}+${cost}) = ${dp[i][j]}`,
      )
    }
  let i = a.length,
    j = b.length
  const operations: string[] = [],
    path: Coordinate[] = []
  d.path = path
  while (i || j) {
    const focus: Coordinate = [i, j]
    path.push(focus)
    let operation: string
    if (i && j && dp[i][j] === dp[i - 1][j - 1] + Number(a[i - 1] !== b[j - 1])) {
      operation = a[i - 1] === b[j - 1] ? `keep ${a[i - 1]}` : `replace ${a[i - 1]} with ${b[j - 1]}`
      i--
      j--
    } else if (i && dp[i][j] === dp[i - 1][j] + 1) operation = `delete ${a[--i]}`
    else operation = `insert ${b[--j]}`
    operations.push(operation)
    d.emit(`Traceback: ${operation}.`, 'traceback', focus, [{ cell: [i, j], label: 'previous prefixes' }])
  }
  return { distance: dp[a.length][b.length], operations: operations.reverse() }
}
export function matrixChain(input: DaaInput, t: Trace) {
  const p = input.dimensions!,
    n = p.length - 1
  if (n < 1) throw new Error('Provide at least two dimensions.')
  const dp = Array.from({ length: n }, () => Array(n).fill(0) as number[]),
    split = dp.map((r) => r.map(() => -1)),
    d = new DPTrace(
      t,
      dp,
      dp.map((_, i) => `A${i + 1}`),
      dp.map((_, i) => `A${i + 1}`),
    )
  for (let i = 0; i < n; i++) d.mark([i, i])
  d.emit('One matrix needs zero scalar multiplications. Only upper-triangle intervals are used.', 'base')
  for (let len = 2; len <= n; len++)
    for (let i = 0; i + len <= n; i++) {
      const j = i + len - 1,
        candidates: { label: string; value: number }[] = []
      dp[i][j] = Infinity
      for (let k = i; k < j; k++) {
        const cost = dp[i][k] + dp[k + 1][j] + p[i] * p[k + 1] * p[j + 1]
        candidates.push({ label: `Split after A${k + 1}: ${dp[i][k]} + ${dp[k + 1][j]} + ${p[i]}×${p[k + 1]}×${p[j + 1]}`, value: cost })
        if (cost < dp[i][j]) {
          dp[i][j] = cost
          split[i][j] = k
        }
      }
      const k = split[i][j]
      d.mark([i, j])
      d.emit(
        `Chain ${i}…${j}: choose split ${k}.`,
        'choose',
        [i, j],
        [
          { cell: [i, k], label: 'left chain' },
          { cell: [k + 1, j], label: 'right chain' },
        ],
        candidates,
        `${dp[i][k]} + ${dp[k + 1][j]} + ${p[i]}×${p[k + 1]}×${p[j + 1]} = ${dp[i][j]}`,
      )
    }
  function parens(i: number, j: number): string {
    return i === j ? `A${i + 1}` : `(${parens(i, split[i][j])} × ${parens(split[i][j] + 1, j)})`
  }
  return { cost: dp[0][n - 1], parenthesization: parens(0, n - 1) }
}
export function optimalBst(input: DaaInput, t: Trace) {
  const f = input.frequencies!,
    q = input.unsuccessful ?? Array(f.length + 1).fill(0),
    n = f.length,
    dp = Array.from({ length: n }, () => Array(n).fill(0) as number[]),
    root = dp.map((r) => r.map(() => -1)),
    prefix = [0],
    missPrefix = [0],
    d = new DPTrace(
      t,
      dp,
      dp.map((_, i) => `key ${i}`),
      dp.map((_, i) => `key ${i}`),
    )
  f.forEach((v) => prefix.push(prefix.at(-1)! + v))
  q.forEach((v) => missPrefix.push(missPrefix.at(-1)! + v))
  d.emit('Empty intervals use their unsuccessful-search gap frequency q[i].', 'base')
  for (let len = 1; len <= n; len++)
    for (let i = 0; i + len <= n; i++) {
      const j = i + len - 1,
        w = prefix[j + 1] - prefix[i] + missPrefix[j + 2] - missPrefix[i],
        candidates: { label: string; value: number }[] = []
      dp[i][j] = Infinity
      for (let r = i; r <= j; r++) {
        const left = r > i ? dp[i][r - 1] : q[i],
          right = r < j ? dp[r + 1][j] : q[j + 1],
          cost = left + right + w
        candidates.push({ label: `Root ${r}: ${left} + ${right} + ${w}`, value: cost })
        if (cost < dp[i][j]) {
          dp[i][j] = cost
          root[i][j] = r
        }
      }
      const r = root[i][j]
      d.mark([i, j])
      d.emit(
        `Keys ${i}…${j}: root ${r}, weighted cost ${dp[i][j]}.`,
        'choose',
        [i, j],
        [
          ...(r > i ? [{ cell: [i, r - 1] as Coordinate, label: 'left keys' }] : []),
          ...(r < j ? [{ cell: [r + 1, j] as Coordinate, label: 'right keys' }] : []),
        ],
        candidates,
        `Choose root ${r}; include interval frequency weight ${w}.`,
      )
    }
  function tree(i: number, j: number): unknown {
    if (i > j) return null
    const r = root[i][j]
    return { key: r, left: tree(i, r - 1), right: tree(r + 1, j) }
  }
  return {
    cost: dp[0][n - 1],
    tree: tree(0, n - 1),
    model: 'weighted successful and unsuccessful search cost; root costs 1 comparison and dummy-leaf depths include the empty-subtree test',
  }
}
export function heldKarp(input: DaaInput, t: Trace) {
  const n = input.vertices!,
    source = input.source!,
    distance = Array.from({ length: n }, () => Array(n).fill(Infinity) as number[])
  arcs(input).forEach((e) => (distance[e.from][e.to] = Math.min(distance[e.from][e.to], e.weight)))
  const dp = Array.from({ length: 1 << n }, () => Array(n).fill(Infinity) as number[]),
    parent = dp.map((r) => r.map(() => -1)),
    shown = dp.map((r) => r.map(displayValue)),
    d = new DPTrace(
      t,
      shown,
      dp.map(
        (_, mask) =>
          `{${Array.from({ length: n }, (_, v) => v)
            .filter((v) => mask & (1 << v))
            .join(',')}}`,
      ),
      distance.map((_, v) => `end ${v}`),
    )
  dp[1 << source][source] = 0
  shown[1 << source][source] = 0
  d.mark([1 << source, source])
  d.emit(`Start at ${source} with only the source visited.`, 'base', [1 << source, source])
  if (n === 1) return { cost: 0, tour: [source, source] }
  for (let mask = 0; mask < 1 << n; mask++)
    for (let u = 0; u < n; u++)
      if (dp[mask][u] < Infinity)
        for (let v = 0; v < n; v++)
          if (!(mask & (1 << v)) && distance[u][v] < Infinity) {
            const next = mask | (1 << v),
              cost = dp[mask][u] + distance[u][v]
            if (cost < dp[next][v]) {
              const old = dp[next][v]
              dp[next][v] = cost
              shown[next][v] = cost
              parent[next][v] = u
              d.mark([next, v])
              d.emit(
                `Visited mask ${next.toString(2)}, end ${v}: cost ${cost}.`,
                'choose',
                [next, v],
                [{ cell: [mask, u], label: 'smaller visited set' }],
                [
                  { label: 'previous best', value: displayValue(old) },
                  { label: `via ${u} → ${v}`, value: cost },
                ],
                `${dp[mask][u]} + edge(${u},${v}) ${distance[u][v]} = ${cost}`,
                { graph: { vertices: n, edges: input.edges!, directed: input.directed ?? false, selected: [[u, v]] } },
              )
            }
          }
  const full = (1 << n) - 1
  let end = -1,
    cost = Infinity
  for (let u = 0; u < n; u++)
    if (dp[full][u] + distance[u][source] < cost) {
      cost = dp[full][u] + distance[u][source]
      end = u
    }
  if (end < 0) {
    d.emit('No complete tour has a finite closing edge.', 'traceback')
    return { cost: null, tour: [], exists: false }
  }
  const finalEnd = end,
    tour = [source],
    path: Coordinate[] = []
  let mask = full
  while (end !== source) {
    path.push([mask, end])
    tour.push(end)
    const previous = parent[mask][end]
    mask ^= 1 << end
    end = previous
  }
  tour.push(source)
  tour.reverse()
  d.path = path
  d.emit(
    `Close the tour with ${finalEnd} → ${source}; total cost ${cost}.`,
    'traceback',
    [full, finalEnd],
    [],
    [],
    `${dp[full][finalEnd]} + ${distance[finalEnd][source]} = ${cost}`,
    { graph: { vertices: n, edges: input.edges!, directed: input.directed ?? false, selected: tour.slice(1).map((v, i) => [tour[i], v]) } },
  )
  return { cost, tour, exists: true }
}
