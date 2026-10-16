import { allModules } from '../algorithms'
import { categories } from './catalog'
import { algorithmPath } from '../utils/routing'
import type { AlgorithmCategory, AlgorithmModule } from '../types'
import { sidebarOrder } from './sidebarOrder'

export type SidebarItem = { id: string; label: string; path: string; aliases: readonly string[] }
export type SidebarCategory = { category: AlgorithmCategory; items: readonly SidebarItem[] }
const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '')
// Keep the original traversal URLs in navigation; the typed lesson URLs remain valid aliases.
const traversalAliases: Record<string, string> = { 'daa-bfs': 'bfs-traversal', 'daa-dfs': 'dfs-traversal' }
const canonicalId = (module: AlgorithmModule) => traversalAliases[module.id] ?? module.id

export const unresolvedSidebarItems: { category: AlgorithmCategory; label: string }[] = []
export const sidebarNavigation: readonly SidebarCategory[] = categories.map((category) => {
  const candidates = allModules.filter((module) => module.category === category)
  const seen = new Set<string>()
  const items: SidebarItem[] = []
  function add(module: AlgorithmModule, label = module.name) {
    const id = canonicalId(module)
    if (seen.has(id)) return
    seen.add(id)
    const destination = candidates.find((item) => item.id === id) ?? module
    items.push({ id, label, path: algorithmPath(destination), aliases: candidates.filter((item) => canonicalId(item) === id).map((item) => item.id) })
  }
  for (const label of sidebarOrder[category]) {
    const module = candidates.find((item) => normalize(item.name) === normalize(label))
    if (module) add(module, label)
    else unresolvedSidebarItems.push({ category, label })
  }
  // Include catalog additions as well as the requested hierarchy; never discard real destinations.
  candidates.forEach((module) => add(module))
  return { category, items }
})
