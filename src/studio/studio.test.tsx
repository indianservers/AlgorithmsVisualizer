import { allModules } from '../algorithms'
import { runDisabledReason } from '../utils/validation'
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ArrayScene, CodeExecutionPanel } from './AlgorithmStudio'
import { isStudioId, needsOrderedInput, runStudio, studioInputError, studioKernels, suiteExamples, type StudioId } from './engine'
import sources from './sources.generated.json'
import translations from './languages.generated.json'

const ids = Object.keys(studioKernels) as StudioId[]
const isSort = (id: StudioId) => (suiteExamples[id] ?? id).endsWith('-sort')
const cases = [[], [2], [2, 1], [1, 2, 3], [3, 2, 1], [3, 1, 3, 0], [-3, 2, -3, 0], [1.5, -2.25, 0, 1.5], [4, 4, 4]]
const prepare = (id: StudioId, a: number[]) =>
  needsOrderedInput(suiteExamples[id] ?? id) || id === 'sliding-window-two-pointers-suite' || id === 'rotated-sorted-array-search'
    ? [...a].sort((x, y) => x - y)
    : a

describe('shared sorting and searching execution', () => {
  it('connects the new validators to every studio in the application catalogue', () => {
    const modules = allModules.filter((m) => isStudioId(m.id))
    expect(modules).toHaveLength(29)
    for (const module of modules) {
      expect(module.executionStudio).toBe(true)
      expect(runDisabledReason(module, [], true)).toBe('')
    }
  })
  for (const id of ids)
    it(`${id}: source mapping, results and immutable historical snapshots`, () => {
      for (const original of cases) {
        const input = prepare(id, original)
        if (studioInputError(id, input)) continue
        const trace = runStudio(id, input, 2)
        expect(trace.at(-1)?.type).toBe('complete')
        expect(input).toEqual(prepare(id, original))
        const result = trace.at(-1)!.highlights.variables!.result
        if (isSort(id)) expect(result).toEqual([...input].sort((a, b) => a - b))
        else if (id === 'sliding-window-two-pointers-suite') {
          const pairs = input.flatMap((a, i) => input.slice(i + 1).map((b, k) => ({ sum: a + b, i, j: i + k + 1 }))).filter((p) => p.sum === 2)
          const pair = result as number[]
          if (!pair.length) expect(pairs).toHaveLength(0)
          else {
            expect(pair[0]).toBeLessThan(pair[1])
            expect(input[pair[0]] + input[pair[1]]).toBe(2)
          }
        } else if ((suiteExamples[id] ?? id) === 'peak-element-search') {
          if (!input.length) expect(result).toBe(-1)
          else {
            const i = Number(result)
            expect(input[i]).toBeGreaterThanOrEqual(input[i - 1] ?? -Infinity)
            expect(input[i]).toBeGreaterThanOrEqual(input[i + 1] ?? -Infinity)
          }
        } else if (id === 'lower-bound' || id === 'search-insert-position')
          expect(result).toBe(input.findIndex((x) => x >= 2) === -1 ? input.length : input.findIndex((x) => x >= 2))
        else if (id === 'upper-bound') expect(result).toBe(input.findIndex((x) => x > 2) === -1 ? input.length : input.findIndex((x) => x > 2))
        else if (id === 'last-occurrence') expect(result).toBe(input.lastIndexOf(2))
        else if (id === 'first-occurrence') expect(result).toBe(input.indexOf(2))
        else expect(result === -1 ? !input.includes(2) : input[Number(result)] === 2).toBe(true)
        for (let i = 0; i < trace.length; i++) {
          const step = trace[i]
          expect(
            sources[id].some((row) => 'id' in row && row.id === step.lineId),
            `${id}: ${step.lineId}`,
          ).toBe(true)
          for (const language of ['Python', 'Java', 'C++'] as const)
            expect(
              translations[id][language].some((row) => 'id' in row && row.id === step.lineId),
              `${id}/${language}/${step.lineId}`,
            ).toBe(true)
          expect(step.metrics.comparisons).toBe((trace[i - 1]?.metrics.comparisons ?? 0) + (step.type === 'compare' ? 1 : 0))
          if (step.type === 'swap') {
            const [a, b] = step.highlights.indices!
            const expected = [...step.beforeState!]
            ;[expected[a], expected[b]] = [expected[b], expected[a]]
            expect(step.dataState).toEqual(expected)
            expect(step.metrics.writes).toBe(trace[i - 1].metrics.writes! + 2)
          }
          if (i > 0) expect(step.dataState).not.toBe(trace[i - 1].dataState)
        }
        // The displayed JavaScript is independently runnable, not an abbreviated illustration.
        const text = sources[id].map((r) => r.text).join('\n')
        const name = text.match(/function (\w+)/)![1]
        const execute = new Function('a', 'target', `${text}; return ${name}(a,target)`)
        expect(execute([...input], 2)).toEqual(result)
      }
    })

  it('sorts deterministic random arrays and moderately sized inputs', () => {
    let seed = 17
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return (seed % 101) - 50
    }
    for (const id of ids.filter(isSort)) {
      for (const length of [8, 16, 32, 64]) {
        const input = Array.from({ length }, () => (id === 'radix-sort' ? Math.abs(random()) : random()))
        const run = runStudio(id, input, 0)
        expect(run.at(-1)?.dataState).toEqual([...input].sort((a, b) => a - b))
        expect(run.at(-1)?.type).toBe('complete')
      }
    }
  })

  it('Bubble Sort comparisons, swap flags, early exit and sorted suffixes are exact', () => {
    for (const input of cases) {
      const trace = runStudio('bubble-sort', input, 0)
      const final = [...input].sort((a, b) => a - b)
      for (const step of trace) {
        for (const index of step.sortedIndices) expect(step.dataState[index]).toBe(final[index])
        if (step.type === 'compare') {
          const v = step.highlights.variables!,
            j = Number(v.j)
          expect(v.left).toBe(step.dataState[j])
          expect(v.right).toBe(step.dataState[j + 1])
          expect(v.condition).toBe(step.dataState[j] > step.dataState[j + 1])
        }
      }
    }
    const ordered = runStudio('bubble-sort', [1, 2, 3, 4], 0)
    expect(ordered.at(-1)!.metrics.comparisons).toBe(3)
    expect(ordered.filter((s) => s.lineId === 'outer-loop')).toHaveLength(1)
    expect(ordered.find((s) => s.lineId === 'early-exit')!.highlights.variables!.swapped).toBe(false)
  })

  it('restores identities, counters and values when seeking backward through a swap', () => {
    const trace = runStudio('bubble-sort', [3, 1, 2], 0)
    const i = trace.findIndex((s) => s.type === 'swap')
    expect(trace[i].dataState).toEqual([1, 3, 2])
    expect(trace[i - 1].dataState).toEqual([3, 1, 2])
    expect(trace[i].itemIds).toEqual(['item-1', 'item-0', 'item-2'])
    expect(trace[i - 1].metrics.swaps).toBe(0)
  })

  it('validates input assumptions instead of silently sorting or dropping invalid values', () => {
    expect(studioInputError('lower-bound', [3, 1])).toMatch(/ascending/)
    expect(studioInputError('rotated-sorted-array-search', [3, 1, 4, 2])).toMatch(/rotated/)
    expect(studioInputError('counting-sort', [-2, 3])).toBe('')
    expect(studioInputError('radix-sort', [-2, 3])).toMatch(/non-negative/)
    expect(studioInputError('linear-search', [])).toBe('')
    expect(isStudioId('stack')).toBe(false)
  })

  it('renders the executing code statement and historical variables together', () => {
    vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) })
    const step = runStudio('selection-sort', [3, 1, 2], 0).find((s) => s.type === 'compare')!
    const html = renderToStaticMarkup(<CodeExecutionPanel id="selection-sort" step={step} />)
    expect(html).toContain('aria-current="step"')
    expect(html).toContain('data-line-id="compare"')
    expect(html).toContain('minIndex')
    expect(html).toContain('Current comparison')
    expect(html).toContain('JavaScript')
    expect(html).toContain('Python')
    vi.unstubAllGlobals()
  })
})

describe('counted icon bars', () => {
  it('renders exactly 79 units with either Apples or Dolphins', () => {
    for (const character of ['apples', 'dolphins']) {
      const html = renderToStaticMarkup(<ArrayScene input={[79]} view="icons" zoom={100} reducedMotion character={character} />)
      expect(html.match(/data-unit-icon=/g)).toHaveLength(79)
      expect(html).toContain(character === 'apples' ? 'studio-apple' : '🐬')
    }
  })
  it('counts negative magnitudes and keeps fractional or excessive values explicitly scaled', () => {
    const negative = renderToStaticMarkup(<ArrayScene input={[-79, 0]} view="icons" zoom={100} reducedMotion />)
    expect(negative.match(/data-unit-icon=/g)).toHaveLength(79)
    expect(negative).toContain('signed label')
    const scaled = renderToStaticMarkup(<ArrayScene input={[1.5, 1001]} view="icons" zoom={100} reducedMotion />)
    expect(scaled).not.toContain('data-unit-icon=')
    expect(scaled).toContain('Scaled bars')
  })
})
