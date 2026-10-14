import { Trace, type DaaInput } from './types'
import { arcs } from './graphs'

export function fibonacciTable(input: DaaInput, t: Trace) {
  const dp = Array(input.n! + 1).fill(0)
  if (input.n! > 0) dp[1] = 1
  t.add('Seed F(0)=0, F(1)=1.', { values: dp }, 0)
  for (let i = 2; i <= input.n!; i++) {
    dp[i] = dp[i - 1] + dp[i - 2]
    t.add(`F(${i}) = ${dp[i - 1]} + ${dp[i - 2]}.`, { values: dp }, 1)
  }
  return { value: dp[input.n!] }
}
export function fibonacciMemo(input: DaaInput, t: Trace) {
  const memo = new Map<number, number>([
    [0, 0],
    [1, 1],
  ])
  function solve(n: number): number {
    if (memo.has(n)) {
      t.add(`Reuse F(${n})=${memo.get(n)}.`, { values: [...memo.values()], labels: [...memo.keys()].map(String) }, 0)
      return memo.get(n)!
    }
    const value = solve(n - 1) + solve(n - 2)
    memo.set(n, value)
    t.add(`Memoize F(${n})=${value}.`, { values: [...memo.values()], labels: [...memo.keys()].map(String) }, 1)
    return value
  }
  return { value: solve(input.n!) }
}
export function coinChange(input: DaaInput, t: Trace) {
  if (input.values!.some((c) => !Number.isInteger(c) || c <= 0)) throw new Error('Coins must be positive integers.')
  const dp = Array(input.amount! + 1).fill(Infinity),
    choice = Array(input.amount! + 1).fill(-1)
  dp[0] = 0
  for (let a = 1; a <= input.amount!; a++) {
    for (const coin of input.values!)
      if (coin <= a && dp[a - coin] + 1 < dp[a]) {
        dp[a] = dp[a - coin] + 1
        choice[a] = coin
      }
    t.add(`Minimum coins for amount ${a}: ${dp[a]}.`, { values: dp.map((v) => (Number.isFinite(v) ? v : '∞')) }, 1)
  }
  const coins: number[] = []
  if (dp[input.amount!] < Infinity) for (let a = input.amount!; a > 0; a -= choice[a]) coins.push(choice[a])
  return { minimum: Number.isFinite(dp[input.amount!]) ? dp[input.amount!] : null, coins, reachable: dp[input.amount!] < Infinity }
}
export function knapsack(input: DaaInput, t: Trace) {
  const n = input.weights!.length,
    capacity = input.capacity!,
    dp = Array.from({ length: n + 1 }, () => Array(capacity + 1).fill(0))
  for (let i = 1; i <= n; i++) {
    for (let c = 0; c <= capacity; c++) {
      dp[i][c] = dp[i - 1][c]
      if (input.weights![i - 1] <= c) dp[i][c] = Math.max(dp[i][c], input.profits![i - 1] + dp[i - 1][c - input.weights![i - 1]])
    }
    t.add(
      `Row ${i}: exclude or include item ${i - 1}, using the previous row.`,
      { table: dp, rowLabels: Array.from({ length: n + 1 }, (_, i) => `${i} items`) },
      1,
    )
  }
  const items: number[] = []
  let c = capacity
  for (let i = n; i > 0; i--)
    if (dp[i][c] !== dp[i - 1][c]) {
      items.push(i - 1)
      c -= input.weights![i - 1]
    }
  t.add(`Trace back items ${items}.`, { table: dp }, 2)
  return { profit: dp[n][capacity], items: items.reverse(), weight: capacity - c }
}
export function lcs(input: DaaInput, t: Trace) {
  const a = input.left!,
    b = input.right!,
    dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0))
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
      t.add(
        `L[${i},${j}] = ${dp[i][j]} (${a[i - 1] === b[j - 1] ? 'match diagonal' : 'best of up/left'}).`,
        { table: dp, rowLabels: ['∅', ...a], columnLabels: ['∅', ...b] },
        1,
      )
    }
  let i = a.length,
    j = b.length,
    sequence = ''
  while (i && j) {
    if (a[i - 1] === b[j - 1]) {
      sequence = a[i - 1] + sequence
      i--
      j--
    } else if (dp[i - 1][j] >= dp[i][j - 1]) i--
    else j--
  }
  t.add(`Traceback reconstructs ${sequence || 'the empty subsequence'}.`, { table: dp, rowLabels: ['∅', ...a], columnLabels: ['∅', ...b] }, 2)
  return { length: dp[a.length][b.length], sequence }
}
export function editDistance(input: DaaInput, t: Trace) {
  const a = input.left!,
    b = input.right!,
    dp = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)))
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + Number(a[i - 1] !== b[j - 1]))
      t.add(`E[${i},${j}]=${dp[i][j]}.`, { table: dp, rowLabels: ['∅', ...a], columnLabels: ['∅', ...b] }, 1)
    }
  let i = a.length,
    j = b.length
  const operations: string[] = []
  while (i || j) {
    if (i && j && dp[i][j] === dp[i - 1][j - 1] + Number(a[i - 1] !== b[j - 1])) {
      operations.push(a[i - 1] === b[j - 1] ? `keep ${a[i - 1]}` : `replace ${a[i - 1]} with ${b[j - 1]}`)
      i--
      j--
    } else if (i && dp[i][j] === dp[i - 1][j] + 1) {
      operations.push(`delete ${a[--i]}`)
    } else operations.push(`insert ${b[--j]}`)
  }
  return { distance: dp[a.length][b.length], operations: operations.reverse() }
}
export function matrixChain(input: DaaInput, t: Trace) {
  const p = input.dimensions!,
    n = p.length - 1
  if (n < 1) throw new Error('Provide at least two dimensions.')
  const dp = Array.from({ length: n }, () => Array(n).fill(0)),
    split = Array.from({ length: n }, () => Array(n).fill(-1))
  for (let len = 2; len <= n; len++)
    for (let i = 0; i + len <= n; i++) {
      const j = i + len - 1
      dp[i][j] = Infinity
      for (let k = i; k < j; k++) {
        const cost = dp[i][k] + dp[k + 1][j] + p[i] * p[k + 1] * p[j + 1]
        if (cost < dp[i][j]) {
          dp[i][j] = cost
          split[i][j] = k
        }
      }
      t.add(`Chain ${i}…${j}: choose split ${split[i][j]}.`, { table: dp }, 1)
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
    dp = Array.from({ length: n }, () => Array(n).fill(0)),
    root = Array.from({ length: n }, () => Array(n).fill(-1)),
    prefix = [0],
    missPrefix = [0]
  f.forEach((v) => prefix.push(prefix.at(-1)! + v))
  q.forEach((v) => missPrefix.push(missPrefix.at(-1)! + v))
  for (let len = 1; len <= n; len++)
    for (let i = 0; i + len <= n; i++) {
      const j = i + len - 1
      dp[i][j] = Infinity
      for (let r = i; r <= j; r++) {
        const cost = (r > i ? dp[i][r - 1] : q[i]) + (r < j ? dp[r + 1][j] : q[j + 1]) + prefix[j + 1] - prefix[i] + missPrefix[j + 2] - missPrefix[i]
        if (cost < dp[i][j]) {
          dp[i][j] = cost
          root[i][j] = r
        }
      }
      t.add(`Keys ${i}…${j}: root ${root[i][j]}, weighted cost ${dp[i][j]}.`, { table: dp }, 1)
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
    d = Array.from({ length: n }, () => Array(n).fill(Infinity))
  arcs(input).forEach((e) => (d[e.from][e.to] = Math.min(d[e.from][e.to], e.weight)))
  if (n === 1) return { cost: 0, tour: [source, source] }
  const dp = Array.from({ length: 1 << n }, () => Array(n).fill(Infinity)),
    parent = dp.map((r) => r.map(() => -1))
  dp[1 << source][source] = 0
  for (let mask = 0; mask < 1 << n; mask++)
    for (let u = 0; u < n; u++)
      if (dp[mask][u] < Infinity)
        for (let v = 0; v < n; v++)
          if (!(mask & (1 << v)) && d[u][v] < Infinity) {
            const next = mask | (1 << v),
              cost = dp[mask][u] + d[u][v]
            if (cost < dp[next][v]) {
              dp[next][v] = cost
              parent[next][v] = u
              t.add(
                `Visited mask ${next.toString(2)}, end ${v}: cost ${cost}.`,
                { values: dp[next].map((v) => (Number.isFinite(v) ? v : '∞')), note: `mask=${next}` },
                1,
              )
            }
          }
  const full = (1 << n) - 1
  let end = -1,
    cost = Infinity
  for (let u = 0; u < n; u++)
    if (dp[full][u] + d[u][source] < cost) {
      cost = dp[full][u] + d[u][source]
      end = u
    }
  if (end < 0) return { cost: null, tour: [], exists: false }
  const tour = [source]
  let mask = full
  while (end !== source) {
    tour.push(end)
    const previous = parent[mask][end]
    mask ^= 1 << end
    end = previous
  }
  tour.push(source)
  tour.reverse()
  return { cost, tour, exists: true }
}
