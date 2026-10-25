export type Activity = { id: string; start: number; finish: number }
export type ActivityStrategy = 'finish' | 'duration' | 'start'
export const exchangeActivities: Activity[] = [
  { id: 'A1', start: 1, finish: 4 },
  { id: 'A2', start: 3, finish: 5 },
  { id: 'A3', start: 0, finish: 6 },
  { id: 'A4', start: 5, finish: 7 },
  { id: 'A5', start: 3, finish: 9 },
  { id: 'A6', start: 8, finish: 10 },
]
export function validateActivities(input: Activity[]) {
  if (!Array.isArray(input) || input.length < 1 || input.length > 12) throw new Error('Use 1–12 activities.')
  if (
    input.some(
      (a) =>
        !a ||
        typeof a.id !== 'string' ||
        !/^[A-Za-z][A-Za-z0-9]{0,7}$/.test(a.id) ||
        !Number.isFinite(a.start) ||
        !Number.isFinite(a.finish) ||
        a.start < 0 ||
        a.finish > 100 ||
        a.start >= a.finish,
    )
  )
    throw new Error('Use unique short activity names and times with 0 ≤ start < finish ≤ 100.')
  if (new Set(input.map((a) => a.id)).size !== input.length) throw new Error('Activity names must be unique.')
}
export function parseActivities(text: string): Activity[] {
  const lines = text
    .trim()
    .split(/\n|;/)
    .filter((s) => s.trim())
  const input = lines.map((line, i) => {
    const parts = line.trim().split(/[\s,]+/)
    if (parts.length !== 2 && parts.length !== 3) throw new Error('Write one activity per line: name, start, finish (or start, finish).')
    return { id: parts.length === 3 ? parts[0] : `A${i + 1}`, start: Number(parts.at(-2)), finish: Number(parts.at(-1)) }
  })
  validateActivities(input)
  return input
}
export function compatibleSchedule(input: Activity[]) {
  const sorted = [...input].sort((a, b) => a.start - b.start || a.finish - b.finish)
  return sorted.every((a, i) => !i || sorted[i - 1].finish <= a.start)
}
// An interval-scheduling DP independently checks the maximum feasible cardinality.
export function optimalActivitySchedule(input: Activity[]): Activity[] {
  validateActivities(input)
  const sorted = input.map((a) => ({ ...a })).sort((a, b) => a.finish - b.finish || a.start - b.start || a.id.localeCompare(b.id))
  const best: Activity[][] = [[]]
  for (let i = 0; i < sorted.length; i++) {
    let previous = i - 1
    while (previous >= 0 && sorted[previous].finish > sorted[i].start) previous--
    const included = [...best[previous + 1], sorted[i]],
      excluded = best[i]
    // On ties choose a later first finish, providing a nontrivial exchange where possible.
    best.push(included.length >= excluded.length ? included : excluded)
  }
  return best.at(-1)!
}
export function activityTrace(input: Activity[], strategy: ActivityStrategy = 'finish') {
  validateActivities(input)
  if (!['finish', 'duration', 'start'].includes(strategy)) throw new Error('Choose a supported activity rule.')
  const order = input
    .map((a) => ({ ...a }))
    .sort(
      (a, b) =>
        (strategy === 'finish' ? a.finish - b.finish : strategy === 'start' ? a.start - b.start : b.finish - b.start - (a.finish - a.start)) ||
        a.start - b.start ||
        a.id.localeCompare(b.id),
    )
  const chosen: Activity[] = [],
    frames: { activity: Activity; accepted: boolean; conflicts: string[]; selected: Activity[] }[] = []
  for (const activity of order) {
    const conflicts = chosen.filter((a) => !(a.finish <= activity.start || activity.finish <= a.start)).map((a) => a.id)
    if (!conflicts.length) chosen.push(activity)
    frames.push({ activity, accepted: !conflicts.length, conflicts, selected: [...chosen].sort((a, b) => a.start - b.start) })
  }
  const optimal = optimalActivitySchedule(input)
  return { order, frames, selected: [...chosen].sort((a, b) => a.start - b.start), optimal, isOptimal: chosen.length === optimal.length }
}
export function exchangeFirst(input: Activity[], optimal: Activity[]) {
  validateActivities(input)
  if (
    !optimal.length ||
    !compatibleSchedule(optimal) ||
    optimal.length !== optimalActivitySchedule(input).length ||
    optimal.some((a) => !input.some((b) => a.id === b.id && a.start === b.start && a.finish === b.finish))
  )
    throw new Error('Start with a feasible optimal schedule drawn from the input activities.')
  const before = [...optimal].sort((a, b) => a.start - b.start),
    greedy = activityTrace(input).order[0]
  const after = [{ ...greedy }, ...before.slice(1).map((a) => ({ ...a }))]
  if (!compatibleSchedule(after)) throw new Error('The proposed exchange is not feasible.')
  return { before, after, greedy, oldFirst: before[0], changed: greedy.id !== before[0].id }
}
export type FractionalItem = { id: number; value: number; weight: number; included: boolean }
export const fractionalExample: FractionalItem[] = [
  { id: 1, value: 60, weight: 10, included: true },
  { id: 2, value: 100, weight: 20, included: true },
  { id: 3, value: 120, weight: 30, included: true },
  { id: 4, value: 40, weight: 40, included: false },
]
export function fractionalKnapsack(input: FractionalItem[], capacity: number) {
  if (
    !Array.isArray(input) ||
    input.length > 12 ||
    new Set(input.map((a) => a.id)).size !== input.length ||
    input.some(
      (a) =>
        !Number.isInteger(a.id) ||
        !Number.isFinite(a.value) ||
        a.value < 0 ||
        a.value > 10000 ||
        !Number.isFinite(a.weight) ||
        a.weight <= 0 ||
        a.weight > 10000 ||
        typeof a.included !== 'boolean',
    )
  )
    throw new Error('Use unique item IDs, values from 0 to 10000 and positive weights up to 10000.')
  if (!Number.isFinite(capacity) || capacity < 0 || capacity > 10000) throw new Error('Capacity must be between 0 and 10000.')
  let remaining = capacity,
    value = 0
  const fractions: Record<number, number> = Object.fromEntries(input.map((a) => [a.id, 0]))
  const order = input
    .filter((a) => a.included)
    .map((a) => ({ ...a }))
    .sort((a, b) => b.value / b.weight - a.value / a.weight || a.id - b.id)
  for (const item of order) {
    const fraction = Math.min(1, remaining / item.weight)
    fractions[item.id] = fraction
    remaining = Math.max(0, remaining - fraction * item.weight)
    value += fraction * item.value
  }
  return { fractions, value, used: capacity - remaining, order }
}
export function coinCounterexample(coins: number[], amount: number) {
  if (
    !Array.isArray(coins) ||
    !coins.length ||
    coins.length > 9 ||
    new Set(coins).size !== coins.length ||
    coins.some((c) => !Number.isInteger(c) || c <= 0 || c > 100) ||
    !Number.isInteger(amount) ||
    amount < 0 ||
    amount > 100
  )
    throw new Error('Use 1–9 distinct positive integer coins and an integer amount from 0 to 100.')
  const descending = [...coins].sort((a, b) => b - a),
    greedy: number[] = []
  let remaining = amount
  for (const coin of descending)
    while (remaining >= coin) {
      greedy.push(coin)
      remaining -= coin
    }
  const best: (number[] | null)[] = Array.from({ length: amount + 1 }, () => null)
  best[0] = []
  for (let total = 1; total <= amount; total++)
    for (const coin of descending) {
      const prev = best[total - coin]
      if (prev && (!best[total] || prev.length + 1 < best[total]!.length)) best[total] = [...prev, coin]
    }
  return { greedy, remaining, optimal: best[amount], greedyOptimal: remaining === 0 && greedy.length === best[amount]?.length }
}
