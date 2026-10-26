export type ReliabilityInput = { stages: number; budget: number; probabilities: number[] }
export type ReliabilityCandidate = { copies: number; remaining: number; previous: number; stage: number; product: number }
export type ReliabilityFrame = { phase: 'initialize' | 'fill' | 'result'; row: number; budget: number; filled: number }
export const reliabilityExample: ReliabilityInput = { stages: 4, budget: 10, probabilities: [0.8, 0.7, 0.9, 0.6] }
export function parallelReliability(p: number, k: number) {
  return p === 0 ? 0 : p === 1 ? 1 : -Math.expm1(k * Math.log1p(-p))
}
export function validateReliabilityInput(input: ReliabilityInput) {
  if (!input || !Number.isInteger(input.stages) || input.stages < 1 || input.stages > 6) throw new Error('Use an integer number of stages from 1 to 6.')
  if (!Number.isInteger(input.budget) || input.budget < 0 || input.budget > 24) throw new Error('Use an integer budget from 0 to 24 copies.')
  if (!Array.isArray(input.probabilities) || input.probabilities.length !== input.stages) throw new Error(`Enter exactly ${input.stages} stage probabilities.`)
  if (input.probabilities.some((p) => !Number.isFinite(p) || p < 0 || p > 1))
    throw new Error('Every stage probability must be a finite number between 0 and 1.')
}
export function parseReliabilityInput(stages: string, budget: string, probabilities: string): ReliabilityInput {
  if (!stages.trim() || !budget.trim()) throw new Error('Enter both the number of stages and the total budget.')
  const input = {
    stages: Number(stages),
    budget: Number(budget),
    probabilities: probabilities.trim()
      ? probabilities
          .trim()
          .split(/[,\s]+/)
          .map(Number)
      : [],
  }
  validateReliabilityInput(input)
  return input
}
function allocation(probabilities: number[], dp: (number | null)[][], choice: number[][], budget: number) {
  const n = probabilities.length,
    reliability = dp[n][budget]
  if (reliability === null)
    return { budget, feasible: false, reliability: null, copies: [] as number[], stageReliabilities: [] as number[], spent: 0, unused: budget }
  const copies = Array<number>(n).fill(0)
  let b = budget
  for (let i = n; i >= 1; i--) {
    copies[i - 1] = choice[i][b]
    b -= copies[i - 1]
  }
  const spent = copies.reduce((a, k) => a + k, 0)
  return {
    budget,
    feasible: true,
    reliability,
    copies,
    stageReliabilities: copies.map((k, i) => parallelReliability(probabilities[i], k)),
    spent,
    unused: budget - spent,
  }
}
export function runReliabilityLesson(input: ReliabilityInput) {
  validateReliabilityInput(input)
  const graph = structuredClone(input),
    n = graph.stages,
    B = graph.budget,
    limit = Math.max(22, B),
    dp: (number | null)[][] = Array.from({ length: n + 1 }, () => Array<number | null>(limit + 1).fill(null)),
    choice = Array.from({ length: n + 1 }, () => Array<number>(limit + 1).fill(0)),
    candidates: ReliabilityCandidate[][][] = Array.from({ length: n + 1 }, () => Array.from({ length: limit + 1 }, () => [] as ReliabilityCandidate[]))
  dp[0].fill(1)
  for (let i = 1; i <= n; i++)
    for (let b = i; b <= limit; b++) {
      let best = -Infinity
      for (let k = 1; k <= b - (i - 1); k++) {
        const previous = dp[i - 1][b - k]
        if (previous === null) continue
        const stage = parallelReliability(graph.probabilities[i - 1], k),
          product = previous * stage
        candidates[i][b].push({ copies: k, remaining: b - k, previous, stage, product })
        if (product > best) {
          best = product
          choice[i][b] = k
        }
      }
      dp[i][b] = best
    }
  const frames: ReliabilityFrame[] = [
    { phase: 'initialize', row: 0, budget: 0, filled: 0 },
    { phase: 'initialize', row: 0, budget: B, filled: B + 1 },
  ]
  for (let i = 1; i <= n; i++) for (let b = 0; b <= B; b++) frames.push({ phase: 'fill', row: i, budget: b, filled: i * (B + 1) + b + 1 })
  frames.push({ phase: 'result', row: n, budget: B, filled: (n + 1) * (B + 1) })
  const curve = Array.from({ length: limit + 1 }, (_, b) => allocation(graph.probabilities, dp, choice, b)),
    optimum = curve[B]
  return { input: graph, dp, choice, candidates, curve, optimum, frames, limit, defaultCursor: frames.length - 1 }
}
export type ReliabilityRun = ReturnType<typeof runReliabilityLesson>
