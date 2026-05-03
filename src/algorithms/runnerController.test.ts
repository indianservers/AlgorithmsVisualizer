import { describe, expect, it } from 'vitest'
import { algorithmModules } from './index'
import { createRunnerControl, runAlgorithmControlled } from './runnerController'

describe('controlled algorithm runner', () => {
  it('can cancel before running work', async () => {
    const control = createRunnerControl()
    control.abort()
    const module = algorithmModules.find((item) => item.id === 'bubble-sort')!
    await expect(runAlgorithmControlled(module, [3, 2, 1], 2, control.signal)).resolves.toEqual({ cancelled: true, steps: [] })
  })
})
