export type SuffixProbe = { offset: number; left: string | null; right: string | null; result: number }
export type SuffixBuildFrame = { phase: 'generate' | 'sort' | 'complete'; generated: number; order: number[]; range: [number, number] | null }
export const suffixArrayExample = 'banana'
export function validateSuffixText(text: string) {
  if (typeof text !== 'string') throw new Error('Enter a string.')
  if (Array.from(text).length > 50) throw new Error('Use at most 50 Unicode code points.')
  if (Array.from(text).some((c) => c.codePointAt(0)! < 32 || c.codePointAt(0) === 127))
    throw new Error('Use a single-line string without tabs or control characters.')
}
export function compareSuffixes(chars: string[], left: number, right: number) {
  if (![left, right].every((i) => Number.isInteger(i) && i >= 0 && i < chars.length)) throw new Error('Choose valid suffix start indices.')
  const probes: SuffixProbe[] = []
  let offset = 0
  while (left + offset < chars.length && right + offset < chars.length) {
    const a = chars[left + offset],
      b = chars[right + offset],
      result = Math.sign(a.codePointAt(0)! - b.codePointAt(0)!)
    probes.push({ offset, left: a, right: b, result })
    if (result) return { left, right, result, lcp: offset, reason: 'character' as const, probes }
    offset++
  }
  const a = chars[left + offset] ?? null,
    b = chars[right + offset] ?? null,
    result = a === null ? (b === null ? 0 : -1) : 1
  probes.push({ offset, left: a, right: b, result })
  return { left, right, result, lcp: offset, reason: result === 0 ? ('equal' as const) : ('prefix' as const), probes }
}
export function runSuffixArrayLesson(text: string) {
  validateSuffixText(text)
  const chars = Array.from(text),
    n = chars.length,
    suffixes = chars.map((_, index) => ({ index, suffix: chars.slice(index).join('') })),
    work = chars.map((_, i) => i),
    frames: SuffixBuildFrame[] = [{ phase: 'generate', generated: 0, order: [], range: null }],
    comparisons: ReturnType<typeof compareSuffixes>[] = []
  for (let i = 0; i < n; i++) frames.push({ phase: 'generate', generated: i + 1, order: [], range: null })
  function sort(lo: number, hi: number) {
    if (hi - lo <= 1) return
    const mid = Math.floor((lo + hi) / 2)
    sort(lo, mid)
    sort(mid, hi)
    const left = work.slice(lo, mid),
      right = work.slice(mid, hi),
      merged: number[] = []
    let i = 0,
      j = 0
    while (i < left.length && j < right.length) {
      const c = compareSuffixes(chars, left[i], right[j])
      comparisons.push(c)
      if (c.result <= 0) merged.push(left[i++])
      else merged.push(right[j++])
    }
    merged.push(...left.slice(i), ...right.slice(j))
    work.splice(lo, hi - lo, ...merged)
    frames.push({ phase: 'sort', generated: n, order: [...work], range: [lo, hi - 1] })
  }
  sort(0, n)
  const sa = [...work],
    lcp = sa.map((start, i) => (i ? compareSuffixes(chars, sa[i - 1], start).lcp : 0)),
    rank = Array<number>(n).fill(0)
  sa.forEach((start, i) => (rank[start] = i + 1))
  frames.push({ phase: 'complete', generated: n, order: [...sa], range: null })
  return { text, chars, suffixes, sa, lcp, rank, frames, comparisons, defaultCursor: frames.length - 1 }
}
export type SuffixArrayRun = ReturnType<typeof runSuffixArrayLesson>
export function searchSuffixArray(run: SuffixArrayRun, query: string) {
  validateSuffixText(query)
  const pattern = Array.from(query)
  if (!pattern.length) return { lo: 0, hi: 0, positions: [], comparisons: 0 }
  let comparisons = 0
  function compare(start: number) {
    for (let j = 0; j < pattern.length; j++) {
      comparisons++
      const c = run.chars[start + j]
      if (c === undefined) return -1
      const value = Math.sign(c.codePointAt(0)! - pattern[j].codePointAt(0)!)
      if (value) return value
    }
    return 0
  }
  let low = 0,
    high = run.sa.length
  while (low < high) {
    const mid = Math.floor((low + high) / 2)
    if (compare(run.sa[mid]) < 0) low = mid + 1
    else high = mid
  }
  const lo = low
  high = run.sa.length
  while (low < high) {
    const mid = Math.floor((low + high) / 2)
    if (compare(run.sa[mid]) <= 0) low = mid + 1
    else high = mid
  }
  return { lo, hi: low, positions: run.sa.slice(lo, low).sort((a, b) => a - b), comparisons }
}
