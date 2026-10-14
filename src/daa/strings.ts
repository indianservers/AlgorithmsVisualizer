import { Trace, type DaaInput } from './types'
function emptyMatches(text: string) {
  return Array.from({ length: text.length + 1 }, (_, i) => i)
}
export function naiveMatch(input: DaaInput, t: Trace) {
  const text = input.text!,
    pattern = input.pattern!,
    matches: number[] = []
  for (let i = 0; i + pattern.length <= text.length; i++) {
    let j = 0
    while (j < pattern.length && text[i + j] === pattern[j]) j++
    if (j === pattern.length) matches.push(i)
    t.add(`Window ${i}: matched ${j} characters.`, { values: [...text], note: `pattern=${pattern}, offset=${i}` }, 1, 'compare')
  }
  return { matches }
}
export function kmp(input: DaaInput, t: Trace) {
  const text = input.text!,
    p = input.pattern!,
    pi = Array(p.length).fill(0),
    matches: number[] = []
  if (!p.length) return { matches: emptyMatches(text), prefix: [] }
  for (let i = 1, j = 0; i < p.length; i++) {
    while (j > 0 && p[i] !== p[j]) j = pi[j - 1]
    if (p[i] === p[j]) j++
    pi[i] = j
    t.add(`Prefix[${i}]=${j}.`, { values: pi, labels: [...p] }, 0)
  }
  for (let i = 0, j = 0; i < text.length; i++) {
    while (j > 0 && text[i] !== p[j]) j = pi[j - 1]
    if (text[i] === p[j]) j++
    if (j === p.length) {
      matches.push(i - p.length + 1)
      j = pi[j - 1]
    }
    t.add(`Text index ${i}, prefix length ${j}; matches [${matches}].`, { values: [...text], note: `j=${j}` }, 1, 'compare')
  }
  return { matches, prefix: pi }
}
export function rabinKarp(input: DaaInput, t: Trace) {
  const text = input.text!,
    p = input.pattern!,
    m = p.length,
    base = 256,
    mod = 101,
    matches: number[] = []
  if (!m) return { matches: emptyMatches(text) }
  if (m > text.length) return { matches }
  let ph = 0,
    h = 0,
    power = 1
  for (let i = 0; i < m; i++) {
    ph = (ph * base + p.charCodeAt(i)) % mod
    h = (h * base + text.charCodeAt(i)) % mod
    if (i < m - 1) power = (power * base) % mod
  }
  for (let i = 0; i + m <= text.length; i++) {
    if (h === ph && text.slice(i, i + m) === p) matches.push(i)
    t.add(`Window ${i}: hash=${h}, pattern hash=${ph}; verify characters on hash equality.`, { values: [...text], note: `offset=${i}` }, 1, 'hash')
    if (i + m < text.length) h = ((((h - text.charCodeAt(i) * power) * base + text.charCodeAt(i + m)) % mod) + mod) % mod
  }
  return { matches }
}
export function boyerMoore(input: DaaInput, t: Trace) {
  const text = input.text!,
    p = input.pattern!,
    last = new Map<string, number>(),
    matches: number[] = []
  if (!p.length) return { matches: emptyMatches(text) }
  for (let i = 0; i < p.length; i++) last.set(p[i], i)
  let offset = 0
  while (offset + p.length <= text.length) {
    let j = p.length - 1
    while (j >= 0 && p[j] === text[offset + j]) j--
    const shift = j < 0 ? 1 : Math.max(1, j - (last.get(text[offset + j]) ?? -1))
    if (j < 0) matches.push(offset)
    t.add(`Window ${offset}: mismatch at ${j}, bad-character shift ${shift}.`, { values: [...text] }, 1, 'compare')
    offset += shift
  }
  return { matches, variant: 'bad-character rule; overlapping matches preserved' }
}
export function suffixArray(input: DaaInput, t: Trace) {
  const text = input.text!,
    suffixes = Array.from({ length: text.length }, (_, i) => i).sort((a, b) => (text.slice(a) < text.slice(b) ? -1 : text.slice(a) > text.slice(b) ? 1 : 0))
  t.add('Sort suffix starting positions lexicographically.', { table: suffixes.map((i) => [i, text.slice(i)]) }, 1)
  return { suffixArray: suffixes }
}
