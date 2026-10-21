import type { AlgorithmStep, StepType } from '../types'

export type StudioStep = AlgorithmStep & {
  lineId: string
  sortedIndices: number[]
  itemIds: string[]
}

/** Snapshots, including item identities, are owned by the trace, never by playback. */
export class Trace {
  steps: StudioStep[] = []
  sorted = new Set<number>()
  variables: Record<string, unknown> = {}
  ids: string[]
  metrics = { comparisons: 0, swaps: 0, writes: 0, reads: 0, recursiveCalls: 0 }
  data: number[]
  algorithmId: string
  constructor(data: number[], algorithmId: string) {
    this.data = data
    this.algorithmId = algorithmId
    this.ids = data.map((_, i) => `item-${i}`)
  }
  emit(lineId: string, variables: Record<string, unknown> = {}, indices: number[] = [], description = '', type: StepType = 'select') {
    if (this.steps.length >= 30000) throw new Error('This example exceeds 30,000 trace events. Use a smaller array.')
    if (type === 'compare') {
      this.metrics.comparisons++
      this.metrics.reads += indices.length
    }
    if (type === 'swap') {
      this.metrics.swaps++
      this.metrics.writes += 2
      const [i, j] = indices
      ;[this.ids[i], this.ids[j]] = [this.ids[j], this.ids[i]]
    }
    if (type === 'update' || type === 'merge') this.metrics.writes += indices.length
    if (lineId === 'base-case' || lineId === 'sort-left') this.metrics.recursiveCalls++
    while (this.ids.length < this.data.length) this.ids.push(`temporary-${this.ids.length}`)
    this.ids.length = this.data.length
    this.variables = { ...this.variables, ...variables }
    const before = this.steps.at(-1)?.dataState ?? this.data
    this.steps.push({
      id: `${this.algorithmId}-${this.steps.length}`,
      lineId,
      operationId: lineId,
      type,
      description: description || lineId.replaceAll('-', ' '),
      dataState: [...this.data],
      beforeState: [...before],
      afterState: [...this.data],
      highlights: { indices: [...indices].filter((i) => i >= 0 && i < this.data.length), variables: { ...this.variables } },
      sortedIndices: [...this.sorted],
      itemIds: [...this.ids],
      metrics: { ...this.metrics },
    })
  }
}
