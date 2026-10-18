import { Trace, type DaaInput, type GreedyTree } from './types'

export function minmax(input: DaaInput, t: Trace) {
  function solve(a: number[], depth: number): [number, number] {
    if (a.length === 1) return [a[0], a[0]]
    const mid = Math.floor(a.length / 2),
      left = solve(a.slice(0, mid), depth + 1),
      right = solve(a.slice(mid), depth + 1)
    const result: [number, number] = [Math.min(left[0], right[0]), Math.max(left[1], right[1])]
    t.add(`Depth ${depth}: combine min/max into [${result}].`, { values: a }, 1, 'merge')
    return result
  }
  const [min, max] = solve(input.values!, 0)
  return { min, max }
}
export function maxSubarray(input: DaaInput, t: Trace) {
  const a = input.values!
  t.add('Start with the input array; compare left, right and crossing subarrays.', { values: a }, 0)
  function solve(lo: number, hi: number): { sum: number; start: number; end: number } {
    if (lo === hi) return { sum: a[lo], start: lo, end: hi }
    const mid = Math.floor((lo + hi) / 2),
      left = solve(lo, mid),
      right = solve(mid + 1, hi)
    let s = 0,
      l = -Infinity,
      r = -Infinity,
      start = mid,
      end = mid + 1
    for (let i = mid; i >= lo; i--) {
      s += a[i]
      if (s > l) {
        l = s
        start = i
      }
    }
    s = 0
    for (let i = mid + 1; i <= hi; i++) {
      s += a[i]
      if (s > r) {
        r = s
        end = i
      }
    }
    const best = [left, right, { sum: l + r, start, end }].sort((a, b) => b.sum - a.sum)[0]
    t.add(
      `Range ${lo}…${hi}: best left, right or crossing sum = ${best.sum}.`,
      { values: a, activeIndices: Array.from({ length: best.end - best.start + 1 }, (_, i) => best.start + i), note: `chosen range ${best.start}…${best.end}` },
      1,
    )
    return best
  }
  return solve(0, a.length - 1)
}
export function select(input: DaaInput, t: Trace, deterministic = false, randomized = false) {
  let seed = (input.seed ?? 42) >>> 0
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
  function solve(a: number[], k: number): number {
    if (a.length === 1) return a[0]
    let pivot = a[randomized ? Math.floor(random() * a.length) : Math.floor(a.length / 2)]
    if (deterministic) {
      const medians: number[] = []
      for (let i = 0; i < a.length; i += 5) {
        const group = a.slice(i, i + 5).sort((a, b) => a - b)
        medians.push(group[Math.floor(group.length / 2)])
      }
      pivot = solve(medians, Math.floor(medians.length / 2))
    }
    const lower = a.filter((v) => v < pivot),
      equal = a.filter((v) => v === pivot),
      upper = a.filter((v) => v > pivot)
    t.add(
      `Pivot ${pivot}: ${lower.length} lower, ${equal.length} equal, ${upper.length} upper. Rank ${k + 1}.`,
      { values: [...lower, ...equal, ...upper] },
      1,
      'partition',
    )
    if (k < lower.length) return solve(lower, k)
    if (k < lower.length + equal.length) return pivot
    return solve(upper, k - lower.length - equal.length)
  }
  return { value: solve(input.values!, input.k! - 1) }
}
export function quickselect(i: DaaInput, t: Trace) {
  return select(i, t)
}
export function deterministicSelect(i: DaaInput, t: Trace) {
  return select(i, t, true)
}
export function randomizedSelect(i: DaaInput, t: Trace) {
  return select(i, t, false, true)
}
export function randomizedSort(input: DaaInput, t: Trace) {
  let seed = (input.seed ?? 42) >>> 0
  const display = [...input.values!]
  function solve(a: number[], offset = 0): number[] {
    if (a.length < 2) return a
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    const pivot = a[Math.floor((seed / 4294967296) * a.length)]
    const lower = a.filter((v) => v < pivot),
      equal = a.filter((v) => v === pivot),
      upper = a.filter((v) => v > pivot)
    display.splice(offset, a.length, ...lower, ...equal, ...upper)
    t.add(
      `Seeded random pivot ${pivot} in range ${offset}…${offset + a.length - 1}.`,
      { values: display, activeIndices: equal.map((_, i) => offset + lower.length + i) },
      1,
      'partition',
    )
    const sorted = [...solve(lower, offset), ...equal, ...solve(upper, offset + lower.length + equal.length)]
    display.splice(offset, a.length, ...sorted)
    t.add(`Combine the sorted partitions in range ${offset}…${offset + a.length - 1}.`, { values: display }, 1, 'merge')
    return sorted
  }
  const sorted = solve(input.values!)
  t.add('All partitions are sorted.', { values: sorted }, 1)
  return { sorted, seed: input.seed }
}
export function strassen(input: DaaInput, t: Trace) {
  const a = input.a!,
    b = input.b!,
    n = a.length
  if (n !== b.length || a.some((r) => r.length !== n) || b.some((r) => r.length !== n) || n > 8 || n & (n - 1))
    throw new Error('Use equally sized square matrices of dimension 1, 2, 4 or 8.')
  t.add(
    'Input matrices A and B. Split each into four quadrants.',
    {
      matrices: [
        { label: 'A', values: a },
        { label: 'B', values: b },
      ],
    },
    0,
  )
  const add = (a: number[][], b: number[][], sign = 1) => a.map((r, i) => r.map((v, j) => v + sign * b[i][j]))
  function mul(a: number[][], b: number[][]): number[][] {
    if (a.length === 1) {
      const product = a[0][0] * b[0][0]
      t.add(
        `Scalar multiplication: ${a[0][0]} × ${b[0][0]} = ${product}.`,
        {
          table: [[product]],
          matrices: [
            { label: 'Left operand', values: a },
            { label: 'Right operand', values: b },
          ],
        },
        1,
      )
      return [[product]]
    }
    const m = a.length / 2
    const part = (x: number[][], r: number, c: number) => x.slice(r, r + m).map((row) => row.slice(c, c + m))
    const A = part(a, 0, 0),
      B = part(a, 0, m),
      C = part(a, m, 0),
      D = part(a, m, m),
      E = part(b, 0, 0),
      F = part(b, 0, m),
      G = part(b, m, 0),
      H = part(b, m, m)
    const p1 = mul(add(A, D), add(E, H)),
      p2 = mul(add(C, D), E),
      p3 = mul(A, add(F, H, -1)),
      p4 = mul(D, add(G, E, -1)),
      p5 = mul(add(A, B), H),
      p6 = mul(add(C, A, -1), add(E, F)),
      p7 = mul(add(B, D, -1), add(G, H))
    t.add(
      `Seven products for the ${a.length}×${a.length} subproblem.`,
      { matrices: [p1, p2, p3, p4, p5, p6, p7].map((values, i) => ({ label: `P${i + 1}`, values })) },
      1,
    )
    const c11 = add(add(add(p1, p4), p5, -1), p7),
      c12 = add(p3, p5),
      c21 = add(p2, p4),
      c22 = add(add(add(p1, p2, -1), p3), p6)
    const result = [...c11.map((r, i) => [...r, ...c12[i]]), ...c21.map((r, i) => [...r, ...c22[i]])]
    t.add(`Combine seven products for a ${a.length}×${a.length} multiplication.`, { table: result }, 1, 'merge')
    return result
  }
  return { product: mul(a, b) }
}
export function activitySelection(input: DaaInput, t: Trace) {
  const activities = input.intervals!.map(([start, end], id) => ({ start, end, id })).sort((a, b) => a.end - b.end),
    selected: number[] = [],
    rejected: number[] = [],
    order = activities.map((a) => a.id)
  let finish = -Infinity
  t.add(
    'Sort activities by increasing finish time.',
    { greedy: { phase: 'ready', order, selected, rejected, objective: 0, reason: 'Finish earlier to leave the most room for future activities.' } },
    0,
  )
  for (const a of activities) {
    const safe = a.start >= finish,
      before = finish,
      reason = `${a.start} ≥ ${Number.isFinite(before) ? before : '−∞'} is ${safe}. ${safe ? 'Accept: the activity does not overlap the chosen prefix.' : 'Reject: it overlaps the last chosen activity.'}`
    if (safe) {
      selected.push(a.id)
      finish = a.end
    } else rejected.push(a.id)
    t.add(
      `${safe ? 'Accept' : 'Skip'} activity ${a.id} [${a.start}, ${a.end}].`,
      {
        values: selected,
        greedy: {
          phase: safe ? 'accept' : 'reject',
          order,
          current: a.id,
          selected,
          rejected,
          objective: selected.length,
          boundary: finish,
          reason,
          prediction: { question: `Accept or reject activity ${a.id} [${a.start}, ${a.end}]?`, answer: safe ? 'accept' : 'reject', explanation: reason },
        },
      },
      1,
    )
  }
  return { selected, count: selected.length }
}
export function fractionalKnapsack(input: DaaInput, t: Trace) {
  const items = input.weights!.map((w, id) => ({ w, p: input.profits![id], id })).sort((a, b) => b.p / b.w - a.p / a.w),
    fractions = Array(items.length).fill(0),
    order = items.map((a) => a.id),
    selected: number[] = []
  let remaining = input.capacity!,
    profit = 0
  t.add(
    'Sort by decreasing profit per unit weight.',
    {
      greedy: {
        phase: 'ready',
        order,
        selected,
        rejected: [],
        objective: 0,
        remaining,
        fractions,
        reason: 'Each unit of capacity should earn the highest available profit.',
      },
    },
    0,
  )
  for (const item of items) {
    const fraction = Math.min(1, remaining / item.w)
    fractions[item.id] = fraction
    remaining -= fraction * item.w
    profit += fraction * item.p
    if (fraction > 0) selected.push(item.id)
    const reason = `Take min(1, remaining / ${item.w}) = ${fraction}; gain ${fraction * item.p}. Capacity left: ${remaining}.`
    t.add(
      `Take fraction ${fraction} of item ${item.id}, ratio ${item.p / item.w}.`,
      {
        values: fractions,
        greedy: {
          phase: fraction > 0 ? 'accept' : 'reject',
          order,
          selected,
          rejected: [],
          current: item.id,
          fractions,
          remaining,
          objective: profit,
          reason,
          prediction: { question: `What fraction of item ${item.id} will be taken? (0–1)`, answer: String(fraction), explanation: reason },
        },
      },
      1,
    )
    if (remaining === 0) break
  }
  return { profit, fractions, weight: input.capacity! - remaining }
}
export function jobSequencing(input: DaaInput, t: Trace) {
  const jobs = input.profits!.map((profit, id) => ({ profit, deadline: input.deadlines![id], id })).sort((a, b) => b.profit - a.profit),
    slots = Array(Math.max(0, ...input.deadlines!)).fill(-1),
    selected: number[] = [],
    rejected: number[] = [],
    order = jobs.map((j) => j.id)
  let profit = 0
  t.add(
    'Sort jobs by decreasing profit. Each job occupies one slot.',
    {
      greedy: { phase: 'ready', order, selected, rejected, slots, objective: profit, reason: 'Keep earlier slots available for jobs with tighter deadlines.' },
    },
    0,
  )
  for (const job of jobs) {
    let slot = Math.min(slots.length, job.deadline) - 1
    while (slot >= 0 && slots[slot] >= 0) slot--
    if (slot >= 0) {
      slots[slot] = job.id
      selected.push(job.id)
      profit += job.profit
    } else rejected.push(job.id)
    const reason =
      slot >= 0
        ? `Place job ${job.id} in latest free slot ${slot + 1} ≤ deadline ${job.deadline}; profit +${job.profit}.`
        : `Reject job ${job.id}: no free slot ends by deadline ${job.deadline}.`
    t.add(
      reason,
      {
        values: slots.map((v) => (v < 0 ? 'empty' : v)),
        greedy: {
          phase: slot >= 0 ? 'accept' : 'reject',
          order,
          selected,
          rejected,
          current: job.id,
          slots,
          objective: profit,
          reason,
          prediction: { question: `Which slot receives job ${job.id}? (1-based, or 0 to reject)`, answer: String(slot + 1), explanation: reason },
        },
      },
      1,
    )
  }
  return { slots, profit: slots.reduce((sum, id) => sum + (id < 0 ? 0 : input.profits![id]), 0) }
}
type HuffNode = GreedyTree
export function huffman(input: DaaInput, t: Trace) {
  const queue: HuffNode[] = input.frequencies!.map((weight, id) => ({ weight, id }))
  if (queue.some((n) => n.weight <= 0)) throw new Error('Huffman frequencies must be positive.')
  let cost = 0
  const snapshot = (
    phase: 'ready' | 'merge' | 'codes',
    reason: string,
    prediction?: { question: string; answer: string; explanation: string },
    codes?: Record<number, string>,
  ) => ({
    greedy: {
      phase,
      order: [],
      selected: [],
      rejected: [],
      objective: cost,
      forest: [...queue].sort((a, b) => a.weight - b.weight),
      reason,
      prediction,
      codes,
    },
  })
  t.add(
    'Create one leaf for each symbol, then order the forest by weight.',
    snapshot('ready', 'Merge the two lightest trees; their leaves gain one bit each.'),
    0,
  )
  while (queue.length > 1) {
    queue.sort((a, b) => a.weight - b.weight)
    const left = queue.shift()!,
      right = queue.shift()!
    queue.push({ weight: left.weight + right.weight, left, right })
    cost += left.weight + right.weight
    const reason = `Merge ${left.weight} + ${right.weight} = ${left.weight + right.weight}; weighted path cost increases by ${left.weight + right.weight}.`
    t.add(
      reason,
      {
        values: queue.map((n) => n.weight),
        ...snapshot('merge', reason, {
          question: 'What is the weight of the next merged parent?',
          answer: String(left.weight + right.weight),
          explanation: reason,
        }),
      },
      1,
      'merge',
    )
  }
  const codes: Record<number, string> = {}
  function walk(n: HuffNode, code: string) {
    if (n.id !== undefined) codes[n.id] = code || '0'
    else {
      walk(n.left!, code + '0')
      walk(n.right!, code + '1')
    }
  }
  walk(queue[0], '')
  if (input.frequencies!.length === 1) cost = input.frequencies![0]
  t.add(
    'Read root-to-leaf bits to obtain a prefix-free code.',
    snapshot(
      'codes',
      input.frequencies!.length === 1
        ? 'Single-symbol convention: assign code 0 (one bit per occurrence).'
        : 'Left edges append 0; right edges append 1. Symbols appear only at leaves.',
      undefined,
      codes,
    ),
    2,
  )
  return { codes, weightedLength: input.frequencies!.reduce((s, f, id) => s + f * codes[id].length, 0), tree: queue[0] }
}
export function inversions(input: DaaInput, t: Trace) {
  let count = 0
  function solve(a: number[]): number[] {
    if (a.length < 2) return a
    const m = Math.floor(a.length / 2),
      l = solve(a.slice(0, m)),
      r = solve(a.slice(m)),
      out: number[] = []
    let i = 0,
      j = 0
    while (i < l.length && j < r.length)
      if (l[i] <= r[j]) out.push(l[i++])
      else {
        out.push(r[j++])
        count += l.length - i
      }
    out.push(...l.slice(i), ...r.slice(j))
    t.add(`Merge and count split inversions: total ${count}.`, { values: out }, 1, 'merge')
    return out
  }
  return { sorted: solve(input.values!), inversions: count }
}
export function closestPair(input: DaaInput, t: Trace) {
  if (input.points!.length < 2) throw new Error('Provide at least two points.')
  let pair: number[][] = []
  function solve(points: number[][]): number {
    if (points.length < 2) return Infinity
    const middle = Math.floor(points.length / 2),
      x = points[middle][0]
    let best = Math.min(solve(points.slice(0, middle)), solve(points.slice(middle)))
    const strip = points.filter((p) => Math.abs(p[0] - x) <= best).sort((a, b) => a[1] - b[1])
    for (let i = 0; i < strip.length; i++)
      for (let j = i + 1; j < strip.length && strip[j][1] - strip[i][1] <= best; j++) {
        const d = Math.hypot(strip[i][0] - strip[j][0], strip[i][1] - strip[j][1])
        if (d < best) {
          best = d
          pair = [strip[i], strip[j]]
        }
      }
    t.add(`Split at x=${x}; strip distance ${best}.`, { table: strip }, 1)
    return best
  }
  // Recover the global pair, since recursive local winners need not be global.
  const distance = solve([...input.points!].sort((a, b) => a[0] - b[0]))
  outer: for (const a of input.points!)
    for (const b of input.points!)
      if (a !== b && Math.abs(Math.hypot(a[0] - b[0], a[1] - b[1]) - distance) < 1e-9) {
        pair = [a, b]
        break outer
      }
  return { distance, pair }
}
export function karatsuba(input: DaaInput, t: Trace) {
  function mul(x: bigint, y: bigint): bigint {
    if (x < 10n || y < 10n) return x * y
    const m = Math.floor(Math.max(x.toString().length, y.toString().length) / 2),
      base = 10n ** BigInt(m),
      a = x / base,
      b = x % base,
      c = y / base,
      d = y % base
    const ac = mul(a, c),
      bd = mul(b, d),
      sum = mul(a + b, c + d),
      value = ac * base * base + (sum - ac - bd) * base + bd
    t.add(`${x}×${y}: combine ac, bd and (a+b)(c+d).`, { values: [ac.toString(), bd.toString(), sum.toString()] }, 1, 'merge')
    return value
  }
  return { product: mul(BigInt(input.x!), BigInt(input.y!)).toString() }
}
export function binPacking(input: DaaInput, t: Trace) {
  if (input.values!.some((v) => v <= 0 || v > input.capacity!)) throw new Error('Each item must be positive and fit in a bin.')
  const bins: number[][] = []
  for (const value of [...input.values!].sort((a, b) => b - a)) {
    let index = bins.findIndex((b) => b.reduce((s, v) => s + v, 0) + value <= input.capacity!)
    if (index < 0) {
      index = bins.length
      bins.push([])
    }
    bins[index].push(value)
    t.add(`First-fit decreasing places ${value} in bin ${index}.`, { table: bins.map((b) => [...b, ...Array(input.values!.length - b.length).fill('')]) }, 1)
  }
  return { bins, count: bins.length, optimal: 'heuristic; not guaranteed optimal' }
}
