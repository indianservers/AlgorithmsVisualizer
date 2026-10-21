import { allModules } from '../../src/algorithms/index'
import { categoryPages } from '../../src/data/catalog'
const paths = new Set(['/', '/encyclopedia', ...Object.values(categoryPages).map((p) => '/' + p.slug)])
for (const module of allModules) {
  const base = '/' + categoryPages[module.category].slug + '/' + module.id
  paths.add(base)
  paths.add(base + '/learn')
}
export const routes = [...paths]
