import { describe, expect, it } from 'vitest'
import { allModules } from '../algorithms'
import { categories } from './catalog'
import { sidebarNavigation, unresolvedSidebarItems } from './sidebarNavigation'
import { sidebarOrder } from './sidebarOrder'
import { algorithmPath } from '../utils/routing'

describe('global sidebar route coverage', () => {
  it('preserves the 17 catalog categories after Home in the requested order', () => {
    expect(sidebarNavigation.map((group) => group.category)).toEqual(categories)
    expect(categories).toHaveLength(17)
  })
  it('resolves every requested display name to an existing destination', () => {
    expect(unresolvedSidebarItems).toEqual([])
    const paths = new Set(allModules.map(algorithmPath))
    for (const group of sidebarNavigation) {
      expect(group.items.map((item) => item.label)).toEqual(sidebarOrder[group.category])
      for (const item of group.items) expect(paths.has(item.path), item.label).toBe(true)
    }
  })
  it('retains every route through a unique entry or an explicit traversal alias', () => {
    const entries = sidebarNavigation.flatMap((group) => group.items)
    expect(new Set(entries.map((item) => item.path)).size).toBe(entries.length)
    for (const module of allModules)
      expect(
        entries.filter((item) => item.aliases.includes(module.id)),
        module.id,
      ).toHaveLength(1)
    const graph = sidebarNavigation.find((group) => group.category === 'Graphs')!
    expect(graph.items.filter((item) => item.label === 'Breadth-First Search')).toHaveLength(1)
    expect(graph.items.filter((item) => item.label === 'Depth-First Search')).toHaveLength(1)
    expect(graph.items.find((item) => item.id === 'bfs-traversal')?.aliases).toContain('daa-bfs')
    expect(graph.items.find((item) => item.id === 'dfs-traversal')?.aliases).toContain('daa-dfs')
  })
})
