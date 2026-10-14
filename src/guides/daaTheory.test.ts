import { describe, expect, it } from 'vitest'
import { algorithmModules } from '../algorithms'
import { daaTheoryFor } from './daaTheory'

describe('DAA learning across the legacy catalog', () => {
  it('supplies coherent content, examples, analysis and exercises for every page', () => {
    for (const module of algorithmModules) {
      const content = daaTheoryFor(module)
      for (const field of ['idea', 'proof', 'analysis', 'example', 'limits', 'question', 'answer'] as const)
        expect(content[field], `${module.id}: ${field}`).not.toBe('')
      expect(content.designSteps).toEqual(module.pseudocode)
    }
  })
  it('states implementation-specific limitations instead of a false universal bound', () => {
    const content = (id: string) => daaTheoryFor(algorithmModules.find((m) => m.id === id)!)
    expect(content('bubble-sort').analysis).toContain('early-exit')
    expect(content('queue').analysis).toContain('Array.shift()')
    expect(content('shell-sort').analysis).toContain('gap sequence')
    expect(content('binary-insertion-sort').analysis).toContain('O(n²)')
    expect(content('graph-shortest-paths-suite').overview).toBe(true)
    expect(content('graph-shortest-paths-suite').related).toContain('dijkstra')
  })
})
