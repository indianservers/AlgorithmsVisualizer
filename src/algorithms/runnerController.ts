import type { AlgorithmModule, AlgorithmStep } from '../types'

export type RunnerControl = {
  abort: () => void
  readonly signal: AbortSignal
}

export type ControlledRunResult = {
  cancelled: boolean
  steps: AlgorithmStep[]
}

export function createRunnerControl(): RunnerControl {
  const controller = new AbortController()
  return {
    abort: () => controller.abort(),
    get signal() {
      return controller.signal
    },
  }
}

export async function runAlgorithmControlled(module: AlgorithmModule, input: number[], target: number, signal: AbortSignal): Promise<ControlledRunResult> {
  if (signal.aborted) return { cancelled: true, steps: [] }
  await new Promise((resolve) => window.setTimeout(resolve, 0))
  if (signal.aborted) return { cancelled: true, steps: [] }
  return { cancelled: false, steps: module.runner?.(input, target) ?? [] }
}
