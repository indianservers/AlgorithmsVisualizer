import {
  ArrowDownUp,
  Blocks,
  BookOpen,
  ChartNoAxesCombined,
  FlaskConical,
  Gamepad2,
  Gauge,
  GitBranch,
  Grid2X2,
  Grid3X3,
  Hash,
  Network,
  Search,
  Target,
  Type,
  Undo2,
  Workflow,
} from 'lucide-react'
import type { AlgorithmCategory } from '../types'

const categoryIcons = {
  'DAA Concepts': BookOpen,
  'Analysis & Correctness': ChartNoAxesCombined,
  'Divide and Conquer': GitBranch,
  'Branch and Bound': Network,
  'Complexity Theory': Gauge,
  'DAA Extensions': FlaskConical,
  Sorting: ArrowDownUp,
  Searching: Search,
  'Data Structures': Blocks,
  Graphs: Workflow,
  'Dynamic Programming': Grid2X2,
  Strings: Type,
  'Number Theory': Hash,
  Backtracking: Undo2,
  Greedy: Target,
  'Matrix / Grid': Grid3X3,
  Games: Gamepad2,
} satisfies Record<AlgorithmCategory, typeof BookOpen>
export function categoryIcon(category: AlgorithmCategory, size = 17) {
  const Icon = categoryIcons[category]
  return <Icon size={size} strokeWidth={1.8} />
}
