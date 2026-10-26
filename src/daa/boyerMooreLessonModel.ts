export type BadCharacterPhase = 'ready' | 'match' | 'mismatch' | 'shift' | 'found' | 'complete'
export type BadCharacterFrame = {
  phase: BadCharacterPhase
  s: number
  j: number | null
  i: number | null
  textChar: string | null
  patternChar: string | null
  last: number
  shift: number
  nextS: number | null
  comparisons: number
  matches: number[]
  suffixFrom: number
  fromMatch: boolean
}
export const boyerMooreExample = { text: 'HERE IS A SIMPLE EXAMPLE', pattern: 'EXAMPLE' }
export function validateBadCharacterInput(text: string, pattern: string) {
  if (typeof text !== 'string' || typeof pattern !== 'string') throw new Error('Enter a text and a pattern as strings.')
  if (Array.from(text).length > 50 || Array.from(pattern).length > 50) throw new Error('Use at most 50 characters in each field.')
  if (Array.from(text + pattern).some((char) => char.codePointAt(0)! < 32 || char.codePointAt(0) === 127))
    throw new Error('Use single-line text without tabs or control characters.')
}
export function runBadCharacterLesson(text: string, pattern: string) {
  validateBadCharacterInput(text, pattern)
  const t = Array.from(text),
    p = Array.from(pattern),
    last = new Map<string, number>(),
    matches: number[] = [],
    frames: BadCharacterFrame[] = [],
    alignments: number[] = []
  p.forEach((char, i) => last.set(char, i))
  let s = 0,
    comparisons = 0
  function snapshot(phase: BadCharacterPhase, j: number | null, shift = 0, fromMatch = false) {
    const i = j === null ? null : s + j,
      textChar = i === null ? null : (t[i] ?? null),
      patternChar = j === null ? null : (p[j] ?? null)
    frames.push({
      phase,
      s,
      j,
      i,
      textChar,
      patternChar,
      last: textChar === null ? -1 : (last.get(textChar) ?? -1),
      shift,
      nextS: shift ? s + shift : null,
      comparisons,
      matches: [...matches],
      suffixFrom: j === null ? p.length : phase === 'match' ? j : fromMatch ? 0 : j + 1,
      fromMatch,
    })
  }
  if (!p.length) {
    matches.push(...Array.from({ length: t.length + 1 }, (_, i) => i))
  } else
    while (s + p.length <= t.length) {
      alignments.push(s)
      let j = p.length - 1
      snapshot('ready', j)
      while (j >= 0) {
        comparisons++
        if (t[s + j] !== p[j]) break
        snapshot('match', j)
        j--
      }
      if (j < 0) {
        matches.push(s)
        snapshot('found', 0, 1, true)
        snapshot('shift', 0, 1, true)
        s++
      } else {
        const shift = Math.max(1, j - (last.get(t[s + j]) ?? -1))
        snapshot('mismatch', j, shift)
        snapshot('shift', j, shift)
        s += shift
      }
    }
  snapshot('complete', null)
  const preferred = frames.findIndex((f) => f.phase === 'mismatch' && f.s === 9 && f.j === 2),
    firstMismatch = frames.findIndex((f) => f.phase === 'mismatch')
  return {
    text,
    pattern,
    t,
    p,
    last: [...last].map(([char, index]) => ({ char, index })),
    frames,
    matches,
    alignments,
    comparisons,
    defaultCursor: preferred >= 0 ? preferred : firstMismatch >= 0 ? firstMismatch : frames.length - 1,
  }
}
export type BadCharacterRun = ReturnType<typeof runBadCharacterLesson>
