export type PackingInput = { capacity: number; values: number[] }
export type PackingItem = { id: number; size: number; rank: number }
export type PackingBin = { items: PackingItem[]; used: number; remaining: number }
export type PackingProbe = { bin: number; used: number; remaining: number; fits: boolean }
export type PackingFrame = {
  count: number
  item: PackingItem | null
  destination: number | null
  opened: boolean
  probes: PackingProbe[]
  bins: PackingBin[]
  packedSize: number
}
export const packingExample: PackingInput = { capacity: 10, values: [9, 8, 7, 6, 5, 4, 4, 3, 3, 2, 2, 1] }
export function validatePacking(input: PackingInput) {
  if (!Number.isInteger(input.capacity) || input.capacity < 1 || input.capacity > 100) throw new Error('Bin capacity must be an integer from 1 to 100.')
  if (input.values.length > 24) throw new Error('Use at most 24 items.')
  if (input.values.some((v) => !Number.isInteger(v) || v < 1 || v > input.capacity))
    throw new Error('Every item must be an integer from 1 to the bin capacity.')
}
export function parsePacking(capacity: string, items: string): PackingInput {
  if (!capacity.trim()) throw new Error('Enter a bin capacity.')
  const input = {
    capacity: Number(capacity),
    values: items.trim()
      ? items
          .trim()
          .split(/[,\s]+/)
          .map(Number)
      : [],
  }
  validatePacking(input)
  return input
}
// Exact search is restricted to twelve items. It supplies a certificate, not the heuristic's placement order.
function exactPacking(items: PackingItem[], capacity: number, initial: PackingBin[], lowerBound: number) {
  if (items.length > 12) return null
  let best = initial.map((b) => [...b.items])
  const loads: number[] = [],
    bins: PackingItem[][] = [],
    visited = new Set<string>()
  function visit(i: number) {
    if (best.length === lowerBound) return
    if (i === items.length) {
      if (bins.length < best.length) best = bins.map((b) => [...b])
      return
    }
    const key = `${i}:${[...loads].sort((a, b) => a - b).join(',')}`
    if (visited.has(key)) return
    visited.add(key)
    const seenLoads = new Set<number>(),
      item = items[i]
    for (let j = 0; j < bins.length; j++) {
      if (loads[j] + item.size > capacity || seenLoads.has(loads[j])) continue
      seenLoads.add(loads[j])
      loads[j] += item.size
      bins[j].push(item)
      visit(i + 1)
      bins[j].pop()
      loads[j] -= item.size
    }
    if (bins.length + 1 < best.length) {
      bins.push([item])
      loads.push(item.size)
      visit(i + 1)
      bins.pop()
      loads.pop()
    }
  }
  visit(0)
  return { count: best.length, bins: best.map((bin) => bin.map((item) => ({ ...item }))) }
}
export function runPackingLesson(input: PackingInput) {
  validatePacking(input)
  const items: PackingItem[] = input.values
      .map((size, index) => ({ id: index + 1, size, rank: 0 }))
      .sort((a, b) => b.size - a.size || a.id - b.id)
      .map((item, index) => ({ ...item, rank: index + 1 })),
    bins: PackingBin[] = [],
    frames: PackingFrame[] = [{ count: 0, item: null, destination: null, opened: false, probes: [], bins: [], packedSize: 0 }],
    total = input.values.reduce((a, b) => a + b, 0),
    lowerBound = Math.ceil(total / input.capacity)
  let packedSize = 0
  for (const item of items) {
    const probes: PackingProbe[] = []
    let destination = -1
    for (let j = 0; j < bins.length; j++) {
      const bin = bins[j],
        fits = item.size <= bin.remaining
      probes.push({ bin: j, used: bin.used, remaining: bin.remaining, fits })
      if (fits) {
        destination = j
        break
      }
    }
    const opened = destination < 0
    if (opened) {
      destination = bins.length
      bins.push({ items: [], used: 0, remaining: input.capacity })
    }
    bins[destination].items.push(item)
    bins[destination].used += item.size
    bins[destination].remaining -= item.size
    packedSize += item.size
    frames.push({ count: item.rank, item, destination, opened, probes, bins: bins.map((b) => ({ ...b, items: [...b.items] })), packedSize })
  }
  const optimum = exactPacking(items, input.capacity, bins, lowerBound)
  return {
    input: { capacity: input.capacity, values: [...input.values] },
    items,
    frames,
    bins,
    total,
    lowerBound,
    optimum,
    utilization: bins.length ? total / (bins.length * input.capacity) : 0,
    defaultCursor: items.length,
  }
}
