export type SelectItem = { id: number; value: number }
export type SelectFrame = {
  kind: 'choose' | 'partition' | 'done' | 'base'
  step: number
  lo: number
  hi: number
  localK: number
  array: SelectItem[]
  pivot: SelectItem
  chosen: number
  position: number | null
  rank: number | null
  left: number
  right: number
  branch: 'left' | 'right' | 'found' | 'pending'
  nextLo: number
  nextHi: number
  nextK: number
  comparisons: number
  swaps: number
}
export const randomSelectExample = [8, 3, 12, 5, 2, 9, 1, 7, 4, 6]
export function parseSelectionValues(text: string): number[] {
  let value: unknown
  const t = text.trim()
  if (!t) throw new Error('Enter 1–20 finite numbers.')
  try {
    value = t.startsWith('[')
      ? JSON.parse(t)
      : t
          .split(/[\s,]+/)
          .filter(Boolean)
          .map(Number)
  } catch {
    throw new Error('Enter a number list or a valid JSON array.')
  }
  validateSelectionValues(value)
  return value
}
function validateSelectionValues(values: unknown): asserts values is number[] {
  if (
    !Array.isArray(values) ||
    values.length < 1 ||
    values.length > 20 ||
    values.some((v) => typeof v !== 'number' || !Number.isFinite(v) || Math.abs(v) > 1e6)
  )
    throw new Error('Enter 1–20 finite numbers between −1000000 and 1000000.')
}
export function parseSelectionRank(text: string, length: number) {
  if (!/^\d+$/.test(text.trim()) || !Number.isInteger(Number(text)) || Number(text) < 1 || Number(text) > length)
    throw new Error(`Use a 1-indexed rank from 1 to ${length}.`)
  return Number(text)
}
export function parseSelectionSeed(text: string) {
  if (!/^\d+$/.test(text.trim()) || !Number.isSafeInteger(Number(text)) || Number(text) > 4294967295)
    throw new Error('Use an integer seed from 0 to 4294967295.')
  return Number(text)
}
// A portable unsigned 32-bit LCG. Math.imul avoids floating-point multiplication rounding.
export function seededSelectionRandom(seed: number) {
  let state = parseSelectionSeed(String(seed))
  return () => {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0
    return state / 4294967296
  }
}
export function shuffleSelectionValues(values: number[], seed: number) {
  validateSelectionValues(values)
  const out = [...values],
    random = seededSelectionRandom(seed)
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
export function runRandomSelection(values: number[], k: number, seed: number) {
  validateSelectionValues(values)
  parseSelectionRank(String(k), values.length)
  const random = seededSelectionRandom(seed),
    array = values.map((value, id) => ({ value, id })),
    frames: SelectFrame[] = [],
    target = k - 1
  let lo = 0,
    hi = array.length - 1,
    comparisons = 0,
    swaps = 0,
    step = 0
  function swap(a: number, b: number) {
    if (a !== b) {
      ;[array[a], array[b]] = [array[b], array[a]]
      swaps++
    }
  }
  let result: SelectItem | undefined
  while (lo <= hi) {
    const localK = target - lo + 1
    if (lo === hi) {
      result = array[lo]
      frames.push({
        kind: 'base',
        step,
        lo,
        hi,
        localK,
        array: [...array],
        pivot: result,
        chosen: lo,
        position: lo,
        rank: 1,
        left: 0,
        right: 0,
        branch: 'found',
        nextLo: lo,
        nextHi: hi,
        nextK: 1,
        comparisons,
        swaps,
      })
      break
    }
    const chosen = lo + Math.floor(random() * (hi - lo + 1)),
      pivot = array[chosen]
    frames.push({
      kind: 'choose',
      step,
      lo,
      hi,
      localK,
      array: [...array],
      pivot,
      chosen,
      position: null,
      rank: null,
      left: 0,
      right: 0,
      branch: 'pending',
      nextLo: lo,
      nextHi: hi,
      nextK: localK,
      comparisons,
      swaps,
    })
    swap(chosen, hi)
    let p = lo
    for (let j = lo; j < hi; j++) {
      comparisons++
      if (array[j].value <= pivot.value) {
        swap(j, p)
        p++
      }
    }
    swap(p, hi)
    const rank = p - lo + 1,
      branch = target < p ? 'left' : target > p ? 'right' : 'found',
      nextLo = branch === 'right' ? p + 1 : lo,
      nextHi = branch === 'left' ? p - 1 : hi,
      nextK = branch === 'right' ? localK - rank : localK
    frames.push({
      kind: 'partition',
      step,
      lo,
      hi,
      localK,
      array: [...array],
      pivot,
      chosen,
      position: p,
      rank,
      left: p - lo,
      right: hi - p,
      branch,
      nextLo,
      nextHi,
      nextK,
      comparisons,
      swaps,
    })
    if (branch === 'found') {
      result = array[p]
      frames.push({ ...frames.at(-1)!, kind: 'done' })
      break
    }
    lo = nextLo
    hi = nextHi
    step++
  }
  if (!result) throw new Error('Selection invariant failed.')
  return {
    values: [...values],
    k,
    seed,
    frames,
    result: result.value,
    resultId: result.id,
    comparisons,
    swaps,
    steps: frames.filter((f) => f.kind === 'partition' || f.kind === 'base'),
    defaultCursor: frames.length > 1 ? 1 : 0,
  }
}
export type RandomSelectionRun = ReturnType<typeof runRandomSelection>
