import { Trace, type DaaInput } from './types'

export function reliability(input: DaaInput, t: Trace) {
  // Series system, identical independent parallel copies within each stage.
  const probabilities = input.values!,
    costs = input.weights!,
    budget = input.capacity!
  if (costs.length !== probabilities.length || probabilities.some((p) => p <= 0 || p >= 1))
    throw new Error('Use one probability strictly between 0 and 1 per positive integer stage cost.')
  const n = costs.length,
    dp = Array.from({ length: n + 1 }, () => Array(budget + 1).fill(-1)),
    copies = dp.map((r) => r.map(() => 0))
  dp[0].fill(1)
  for (let i = 1; i <= n; i++)
    for (let b = 0; b <= budget; b++) {
      for (let k = 1; k * costs[i - 1] <= b; k++) {
        const previous = dp[i - 1][b - k * costs[i - 1]]
        if (previous < 0) continue
        const value = previous * (1 - (1 - probabilities[i - 1]) ** k)
        if (value > dp[i][b]) {
          dp[i][b] = value
          copies[i][b] = k
        }
      }
      t.add(
        `Stages=${i}, budget=${b}: best series reliability ${dp[i][b]}.`,
        { table: dp.map((r) => r.map((v) => (v < 0 ? 'unreachable' : Number(v.toFixed(5))))) },
        1,
      )
    }
  if (dp[n][budget] < 0) return { reachable: false, reliability: null, copies: [] }
  let b = budget
  const selected = Array(n).fill(0)
  for (let i = n; i > 0; i--) {
    selected[i - 1] = copies[i][b]
    b -= selected[i - 1] * costs[i - 1]
  }
  return { reachable: true, reliability: dp[n][budget], copies: selected, cost: budget - b }
}
type Complex = [number, number]
export function fft(input: DaaInput, t: Trace) {
  const values = input.values!,
    n = values.length
  if (n & (n - 1)) throw new Error('FFT requires a power-of-two number of samples.')
  function solve(a: Complex[]): Complex[] {
    if (a.length === 1) return a
    const even = solve(a.filter((_, i) => i % 2 === 0)),
      odd = solve(a.filter((_, i) => i % 2 === 1)),
      out: Complex[] = Array(a.length)
    for (let k = 0; k < a.length / 2; k++) {
      const angle = (-2 * Math.PI * k) / a.length,
        [re, im] = odd[k],
        wr = Math.cos(angle) * re - Math.sin(angle) * im,
        wi = Math.sin(angle) * re + Math.cos(angle) * im
      out[k] = [even[k][0] + wr, even[k][1] + wi]
      out[k + a.length / 2] = [even[k][0] - wr, even[k][1] - wi]
    }
    t.add(
      `Combine even/odd transforms of length ${a.length} with butterfly operations.`,
      { table: out.map(([r, i]) => [Number(r.toFixed(5)), Number(i.toFixed(5))]), columnLabels: ['Real', 'Imaginary'] },
      1,
      'merge',
    )
    return out
  }
  return { spectrum: solve(values.map((v) => [v, 0])) }
}
