export type ArrayOperation = { kind: 'push'; value: number } | { kind: 'pop' }
export type ArraySnapshot = {
  step: number
  kind: 'initial' | 'push' | 'pop'
  value?: number
  values: number[]
  capacity: number
  cost: number
  copies: number
  grew: boolean
  potential: number
  amortizedCost: number
  totalCost: number
  totalAmortizedCost: number
  resizeCount: number
}
export function appendOperations(count: number): ArrayOperation[] {
  if (!Number.isSafeInteger(count) || count < 0 || count > 32) throw new Error('Choose 0–32 appends.')
  return Array.from({ length: count }, (_, i) => ({ kind: 'push', value: (i + 1) * 10 }))
}
export function dynamicArrayTrace(input: ArrayOperation[]) {
  if (!Array.isArray(input) || input.length > 64) throw new Error('This visualization supports at most 64 operations per trace.')
  const operations: ArrayOperation[] = [],
    states: ArraySnapshot[] = [
      {
        step: 0,
        kind: 'initial',
        values: [],
        capacity: 1,
        cost: 0,
        copies: 0,
        grew: false,
        potential: 0,
        amortizedCost: 0,
        totalCost: 0,
        totalAmortizedCost: 0,
        resizeCount: 0,
      },
    ]
  for (const operation of input) {
    if (!operation || !['push', 'pop'].includes(operation.kind)) throw new Error('Use push(value) or pop operations.')
    const previous = states.at(-1)!,
      values = [...previous.values]
    let capacity = previous.capacity,
      copies = 0,
      value: number | undefined
    if (operation.kind === 'push') {
      if (typeof operation.value !== 'number' || !Number.isFinite(operation.value) || Math.abs(operation.value) > 1e6)
        throw new Error('Push a finite value between −1000000 and 1000000.')
      if (values.length >= 32) throw new Error('This visualization holds at most 32 elements. Pop an element before appending more.')
      value = operation.value
      if (values.length === capacity) {
        copies = values.length
        capacity *= 2
      }
      values.push(value)
      operations.push({ kind: 'push', value })
    } else {
      if (!values.length) throw new Error('The array is empty; pop requires an element.')
      value = values.pop()
      operations.push({ kind: 'pop' })
    }
    const cost = 1 + copies,
      potential = Math.max(0, 2 * values.length - capacity),
      amortizedCost = cost + potential - previous.potential
    states.push({
      step: states.length,
      kind: operation.kind,
      value,
      values,
      capacity,
      cost,
      copies,
      grew: copies > 0,
      potential,
      amortizedCost,
      totalCost: previous.totalCost + cost,
      totalAmortizedCost: previous.totalAmortizedCost + amortizedCost,
      resizeCount: previous.resizeCount + (copies > 0 ? 1 : 0),
    })
  }
  return { operations, states }
}
export type ArrayTrace = ReturnType<typeof dynamicArrayTrace>
export function stackCreditTrace(operations: ('push' | 'pop')[]) {
  if (!Array.isArray(operations) || operations.length > 64) throw new Error('Use at most 64 stack operations.')
  let size = 0,
    totalActual = 0,
    totalCharged = 0
  const states = [{ size: 0, credits: 0, actualCost: 0, charged: 0, totalActual: 0, totalCharged: 0 }]
  for (const op of operations) {
    if (op !== 'push' && op !== 'pop') throw new Error('Use stack push or pop.')
    if (op === 'pop' && size === 0) throw new Error('Push a stack item before popping it; each item carries one saved credit.')
    size += op === 'push' ? 1 : -1
    totalActual++
    totalCharged += op === 'push' ? 2 : 0
    states.push({ size, credits: totalCharged - totalActual, actualCost: 1, charged: op === 'push' ? 2 : 0, totalActual, totalCharged })
  }
  return { operations: [...operations], states }
}
