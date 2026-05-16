import { BarChart3, Braces, FileJson, FlaskConical, Gamepad2, Gauge, Hash, Home, RotateCcw, Search, Square } from 'lucide-react'
import type { AlgorithmCategory, AlgorithmModule } from '../types'
import { allModules } from '../algorithms'

const normalizeRoutePart = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

function tableGlyph() {
  return <span className="text-icon">DP</span>
}

export function categoryIcon(category: AlgorithmCategory, size = 17) {
  const props = { size, strokeWidth: 2.2 }
  if (category === 'Searching') return <Search {...props} />
  if (category === 'Sorting') return <BarChart3 {...props} />
  if (category === 'Data Structures') return <Braces {...props} />
  if (category === 'Graphs') return <Home {...props} />
  if (category === 'Dynamic Programming') return tableGlyph()
  if (category === 'Strings') return <FileJson {...props} />
  if (category === 'Number Theory') return <Hash {...props} />
  if (category === 'Backtracking') return <RotateCcw {...props} />
  if (category === 'Greedy') return <Gauge {...props} />
  if (category === 'Matrix / Grid') return <Square {...props} />
  if (category === 'Games') return <Gamepad2 {...props} />
  return <FlaskConical {...props} />
}

export function moduleIcon(module: AlgorithmModule) {
  if (module.visualMode === 'Graph') return 'GR'
  if (module.visualMode === 'Tree') return 'TR'
  if (module.category === 'Games') return 'GM'
  if (module.category === 'Searching') return 'SE'
  if (module.category === 'Sorting') return 'SO'
  return module.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function menuGroupsFor(category: AlgorithmCategory) {
  const modules = allModules.filter((module) => module.category === category)
  const grouped = modules.reduce<Record<string, AlgorithmModule[]>>((groups, module) => {
    const key = module.subcategory ?? (module.status === 'planned' ? 'Planned' : module.visualMode)
    groups[key] = [...(groups[key] ?? []), module]
    return groups
  }, {})
  return Object.entries(grouped).map(([label, items]) => ({
    id: normalizeRoutePart(label),
    label,
    icon: label.slice(0, 2).toUpperCase(),
    items,
  }))
}
