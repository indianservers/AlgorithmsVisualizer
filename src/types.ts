export type StepType = 'compare' | 'swap' | 'select' | 'visit' | 'partition' | 'merge' | 'update' | 'hash' | 'complete'

export type AlgorithmStep = {
  id: string
  operationId?: string
  type: StepType
  description: string
  pseudocodeLine?: number
  codeLine?: number
  reason?: string
  beforeState?: number[]
  dataState: number[]
  afterState?: number[]
  assertion?: string
  constraints?: string[]
  highlights: {
    indices?: number[]
    nodes?: string[]
    edges?: string[]
    variables?: Record<string, unknown>
  }
  metrics: {
    comparisons?: number
    swaps?: number
    reads?: number
    writes?: number
    recursiveCalls?: number
    memory?: number
  }
}

export type AlgorithmCategory =
  | 'Searching'
  | 'Sorting'
  | 'Data Structures'
  | 'Graphs'
  | 'Dynamic Programming'
  | 'Strings'
  | 'Number Theory'
  | 'Backtracking'
  | 'Greedy'
  | 'Matrix / Grid'

export type AlgorithmModule = {
  id: string
  name: string
  category: AlgorithmCategory
  status: 'live' | 'planned'
  visualMode: 'Array' | 'Tree' | 'Graph' | 'Matrix'
  subcategory?: string
  summary: string
  complexity: {
    best: string
    average: string
    worst: string
    space: string
  }
  flags?: string[]
  pseudocode: string[]
  code: string
  runner?: (input: number[], target: number) => AlgorithmStep[]
}

export type SavedExperiment = {
  id: string
  algorithmId: string
  algorithmName: string
  createdAt: string
  input: number[]
  target: number
  stepCount: number
  metrics: AlgorithmStep['metrics']
}

export type LearningTab = 'Study' | 'Sim' | 'Code' | 'Quiz' | 'Experiments'

export type QuizScore = {
  correct: number
  total: number
}

export type AnimationQuality = 'off' | 'simple' | 'detailed'
