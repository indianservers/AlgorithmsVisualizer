export function parseProblemField(text: string, example: unknown): unknown {
  if (typeof example === 'string') return text
  if (typeof example === 'boolean') return text === 'true'
  if (typeof example === 'number') {
    if (!text.trim() || !Number.isFinite(Number(text))) throw new Error('Enter a finite number.')
    return Number(text)
  }
  if (Array.isArray(example)) {
    if (text.trim().startsWith('[')) {
      const result: unknown = JSON.parse(text)
      if (!Array.isArray(result)) throw new Error('Enter a list.')
      if (example.length && example.every((value) => value !== null && typeof value === 'object' && !Array.isArray(value))) {
        const required = Object.entries(example[0])
          .filter(([, value]) => typeof value === 'number')
          .map(([key]) => key)
        if (
          !result.every(
            (value) => value !== null && typeof value === 'object' && required.every((key) => typeof value[key] === 'number' && Number.isFinite(value[key])),
          )
        )
          throw new Error('Enter a finite number in each edge field.')
      }
      const numeric = example.every((value) => typeof value === 'number' || Array.isArray(value))
      const validNumber = (value: unknown) => typeof value === 'number' && Number.isFinite(value)
      if (numeric && !(Array.isArray(example[0]) ? result.every((row) => Array.isArray(row) && row.every(validNumber)) : result.every(validNumber)))
        throw new Error('Use finite numeric values.')
      return result
    }
    const numbers = (row: string) =>
      row.trim()
        ? row
            .trim()
            .split(/[\s,]+/)
            .filter(Boolean)
            .map((value) => {
              if (!Number.isFinite(Number(value))) throw new Error('Use numbers separated by commas, spaces, or new lines.')
              return Number(value)
            })
        : []
    if (example.some((value) => value !== null && typeof value === 'object' && !Array.isArray(value)))
      throw new Error('Use a JSON list of objects, or open Advanced JSON.')
    return Array.isArray(example[0]) ? (text.trim() ? text.trim().split(/\n|;/).map(numbers) : []) : numbers(text)
  }
  return JSON.parse(text)
}
