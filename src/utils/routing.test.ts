import { describe, expect, it } from 'vitest'
import { algorithmModules } from '../algorithms'
import { algorithmFromSlug, algorithmPath, categoryFromSlug, normalizeRoutePart, resolveRouteState } from './routing'

describe('routing helpers', () => {
  it('normalizes route parts consistently', () => {
    expect(normalizeRoutePart('Binary Insertion Sort!')).toBe('binary-insertion-sort')
  })

  it('builds category algorithm paths', () => {
    const module = algorithmModules.find((item) => item.id === 'bubble-sort')!
    expect(algorithmPath(module)).toBe('/sorting/bubble-sort')
  })

  it('resolves categories and algorithms from slugs', () => {
    expect(categoryFromSlug('sorting')).toBe('Sorting')
    expect(algorithmFromSlug('bubble-sort')?.name).toBe('Bubble Sort')
  })

  it('returns a fallback route state for unknown paths', () => {
    const state = resolveRouteState('missing-category', 'missing-algorithm', 'queue')
    expect(state.activeModule.id).toBe('queue')
    expect(state.notFound).toEqual({ categorySlug: 'missing-category', algorithmSlug: 'missing-algorithm' })
  })
})
