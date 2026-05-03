export function randomArray(size: number, mode: string) {
  if (mode === 'empty') return []
  if (mode === 'single') return [31]
  if (mode === 'all-equal') return Array.from({ length: size }, () => 31)
  if (mode === 'negative') return Array.from({ length: size }, () => Math.floor(Math.random() * 121) - 60)
  const values = Array.from({ length: size }, () => Math.floor(Math.random() * 96) + 4)
  if (mode === 'best') return Array.from({ length: size }, (_, index) => index * 3 + 5)
  if (mode === 'worst') return Array.from({ length: size }, (_, index) => (size - index) * 3 + 5)
  if (mode === 'average') return values
  if (mode === 'sorted') return [...values].sort((a, b) => a - b)
  if (mode === 'reverse') return [...values].sort((a, b) => b - a)
  if (mode === 'duplicates') return values.map((value) => Math.floor(value / 15) * 10 + 5)
  if (mode === 'nearly') {
    const sorted = [...values].sort((a, b) => a - b)
    for (let i = 0; i < Math.max(1, Math.floor(size / 5)); i += 1) {
      const a = Math.floor(Math.random() * size)
      const b = Math.floor(Math.random() * size)
      ;[sorted[a], sorted[b]] = [sorted[b], sorted[a]]
    }
    return sorted
  }
  return values
}

export function parseInput(value: string) {
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed.map(Number).filter(Number.isFinite)
  } catch {
    // comma input is handled below
  }
  return value
    .split(/[\s,]+/)
    .map(Number)
    .filter(Number.isFinite)
}

export function getInputDiagnostics(value: string) {
  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    parsed = null
  }
  const rawTokens = Array.isArray(parsed) ? parsed.map(String) : value.split(/[\s,]+/).filter(Boolean)
  const valid = rawTokens.map(Number).filter(Number.isFinite)
  const invalid = rawTokens.filter((token) => !Number.isFinite(Number(token)))
  return { rawTokens, valid, invalid, clipped: valid.length > 48 }
}

export function safeJsonValue<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

export function isSortedAscending(values: number[]) {
  return values.every((value, index) => index === 0 || values[index - 1] <= value)
}

export function sortedCopyText(values: number[]) {
  return [...values].sort((a, b) => a - b).join(', ')
}
