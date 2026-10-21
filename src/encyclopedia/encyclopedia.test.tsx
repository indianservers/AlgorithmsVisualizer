import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { allModules } from '../algorithms'
import { AlgorithmArticle } from './AlgorithmArticle'
import { articleMetadata, metadataHtml } from './metadata'
import { articleSections, encyclopediaFor } from './content'
import { legacyHashDestination } from '../utils/legacyHash'

describe('encyclopedia coverage and semantics', () => {
  it('provides a readable, uniquely titled article and valid section targets for the entire catalog', () => {
    const canonicals = new Set<string>()
    for (const module of allModules) {
      const t = encyclopediaFor(module)
      expect(t.definition.length, module.id).toBeGreaterThan(60)
      expect(t.purpose.length, module.id).toBeGreaterThan(60)
      expect(t.proof.length, module.id).toBeGreaterThan(25)
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <AlgorithmArticle module={module} />
        </MemoryRouter>,
      )
      for (const [id] of articleSections) expect(html, module.id).toContain(`id="${id}"`)
      expect(html.match(/<h1>/g), module.id).toHaveLength(1)
      const meta = articleMetadata(module)
      expect(canonicals.has(meta.url)).toBe(false)
      canonicals.add(meta.url)
      expect(meta.url).not.toContain('#')
      expect(metadataHtml(meta)).toContain('application/ld+json')
    }
    expect(canonicals.size).toBe(allModules.length)
  })
  it('distinguishes selection comparison counts, optimized bubble best case, and binary insertion movement', () => {
    const get = (id: string) => encyclopediaFor(allModules.find((m) => m.id === id)!)
    expect(get('selection-sort').analysis).toContain('n(n−1)/2')
    expect(get('selection-sort').disadvantages.join(' ')).toContain('not stable')
    expect(get('bubble-sort').analysis).toContain('swapped flag')
    expect(get('bubble-sort').analysis).toContain('Θ(n)')
    expect(get('binary-insertion-sort').disadvantages.join(' ')).toContain('quadratic')
    expect(get('dijkstra').proof).toContain('non-negative')
  })
  it('migrates only legacy route hashes while retaining login query and section links', () => {
    expect(legacyHashDestination('/', '?login=1', '#/sorting/selection-sort')).toBe('/sorting/selection-sort?login=1')
    expect(legacyHashDestination('/', '', '#/sorting/selection-sort/learn#complexity')).toBe('/sorting/selection-sort/learn#complexity')
    expect(legacyHashDestination('/sorting/selection-sort/learn', '', '#complexity')).toBeNull()
    expect(legacyHashDestination('/', '', '#//evil.example')).toBeNull()
  })
})
