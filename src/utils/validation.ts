import type { AlgorithmModule } from '../types'

export function runDisabledReason(module: AlgorithmModule, input: number[], sortedInputValid: boolean) {
  if (module.status !== 'live' || !module.runner) return 'This module is coming soon.'
  if (!['Graph', 'Tree'].includes(module.visualMode) && input.length === 0) return 'Enter at least one numeric value.'
  if (module.flags?.includes('Requires sorted input') && !sortedInputValid) return 'Sort the input before running this algorithm.'
  if (['counting-sort', 'radix-sort'].includes(module.id) && input.some((value) => value < 0)) return 'Counting and radix sort need non-negative integers.'
  return ''
}
