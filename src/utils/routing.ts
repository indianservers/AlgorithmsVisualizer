import type { AlgorithmCategory, AlgorithmModule } from '../types'
import { allModules } from '../algorithms'
import { categories, categoryPages } from '../data/catalog'

export type RouteState = {
  activeCategory: AlgorithmCategory
  activeModule: AlgorithmModule
  notFound?: {
    categorySlug?: string
    algorithmSlug?: string
  }
}

export const normalizeRoutePart = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export const algorithmPath = (module: AlgorithmModule) => `/${categoryPages[module.category].slug}/${module.id}`

export const categoryFromSlug = (slug?: string) => categories.find((category) => categoryPages[category].slug === slug)

export const algorithmFromSlug = (algorithmSlug?: string) => {
  return algorithmSlug ? allModules.find((module) => normalizeRoutePart(module.id) === normalizeRoutePart(algorithmSlug)) : undefined
}

export function resolveRouteState(categorySlug?: string, algorithmSlug?: string, lastAlgorithmId = 'bubble-sort'): RouteState {
  const fallbackModule = allModules.find((module) => module.id === lastAlgorithmId) ?? allModules.find((module) => module.id === 'bubble-sort') ?? allModules[0]
  const routeModule = algorithmFromSlug(algorithmSlug)
  if (routeModule) return { activeCategory: routeModule.category, activeModule: routeModule }

  const routeCategory = categoryFromSlug(categorySlug)
  if (routeCategory) {
    const activeModule = allModules.find((module) => module.category === routeCategory) ?? fallbackModule
    return { activeCategory: routeCategory, activeModule }
  }

  if (categorySlug || algorithmSlug) {
    return {
      activeCategory: fallbackModule.category,
      activeModule: fallbackModule,
      notFound: { categorySlug, algorithmSlug },
    }
  }

  return { activeCategory: fallbackModule.category, activeModule: fallbackModule }
}

export function filteredModulesForCategory(category: AlgorithmCategory) {
  return allModules.filter((module) => module.category === category)
}
