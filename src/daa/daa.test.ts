import { describe, expect, it } from 'vitest'
import { daaLessons, lessonById } from './catalog'
import { executeLesson, Trace, type DaaInput } from './types'
import { allModules } from '../algorithms'
import { algorithmPath, resolveRouteState } from '../utils/routing'
import { coverageFor, conceptTopics, suiteLinks } from './syllabi'
import { buildStepLogCsv } from '../exports'
import { DSU } from './graphs'

const run = (id: string, input?: DaaInput) => {
  const l = lessonById.get(id)!
  return executeLesson(l, input ?? l.defaultInput!).result
}
const graph = (n: number, edges: number[][], directed = true): DaaInput => ({
  vertices: n,
  edges: edges.map(([from, to, weight = 1]) => ({ from, to, weight })),
  source: 0,
  directed,
})

describe('DAA catalog and trace contracts', () => {
  it('has unique routable lessons with complete authored learning material', () => {
    expect(new Set(allModules.map((m) => m.id)).size).toBe(allModules.length)
    for (const l of daaLessons) {
      const module = allModules.find((m) => m.id === l.id)!
      expect(resolveRouteState(...(algorithmPath(module).slice(1).split('/') as [string, string])).activeModule.id).toBe(l.id)
      expect(l.correctness.length).toBeGreaterThan(40)
      expect(l.example.length).toBeGreaterThan(0)
      expect(l.exercise.answer.length).toBeGreaterThan(10)
      if (l.run) {
        expect(l.pseudocode.length).toBeGreaterThan(1)
        expect(l.derivation.length).toBeGreaterThan(30)
        expect(module.typedRunner).toBeTypeOf('function')
      } else expect(l.theory?.length).toBeGreaterThan(2)
    }
  })
  for (const l of daaLessons.filter((l) => l.run))
    it(`${l.id}: computed default and serializable trace`, () => {
      const result = executeLesson(l, l.defaultInput!)
      expect(result.steps.length).toBeGreaterThan(0)
      expect(result.status).toBe('complete')
      expect(result.steps.at(-1)?.type).toBe('complete')
      for (const s of result.steps.slice(0, -1)) expect(s.pseudocodeLine).toBeLessThan(l.pseudocode.length)
      expect(JSON.parse(JSON.stringify(result))).toEqual(result)
    })
  it('bounds trace storage and never claims truncated completion', () => {
    const l = lessonById.get('zero-one-knapsack')!,
      result = executeLesson(l, l.defaultInput!, 2)
    expect(result.status).toBe('truncated')
    expect(result.steps).toHaveLength(2)
    expect(result.steps.every((s) => s.type !== 'complete')).toBe(true)
    expect(result.result).toMatchObject({ profit: 7 })
    const trace = new Trace()
    trace.add('first', { table: [[1]] })
    const first = trace.steps[0].state!
    trace.add('second', { table: [[2]] })
    expect(first.table).toEqual([[1]])
    expect(buildStepLogCsv(trace.steps)).toContain('"{""table""')
  })
  it('keeps course coverage independent of live flags and learner progress', () => {
    expect(coverageFor({ topic: 'Demo', pages: ['greedy-suite'] }, allModules)).toBe('partial')
    expect(coverageFor({ topic: 'Absent', pages: [] }, allModules)).toBe('missing')
    expect(coverageFor({ topic: 'KMP', pages: ['kmp'] }, allModules)).toBe('complete')
    expect(coverageFor({ topic: 'Broader', pages: ['kmp'], limitation: 'Additional material required' }, allModules)).toBe('partial')
    for (const topic of conceptTopics) for (const id of topic.pages) expect(allModules.some((module) => module.id === id)).toBe(true)
    for (const [id, links] of Object.entries(suiteLinks)) {
      expect(
        allModules.some((m) => m.id === id),
        id,
      ).toBe(true)
      links.forEach((link) => expect(lessonById.has(link), link).toBe(true))
    }
  })
  it('rejects malformed fields before execution', () => {
    expect(() => run('activity-selection', { intervals: [[2, 2]] })).toThrow(/positive duration/)
    expect(() => run('dijkstra', graph(2, [[0, 4, 1]]))).toThrow(/Edges/)
    expect(() => run('zero-one-knapsack', { weights: [0], profits: [1], capacity: 5 })).toThrow(/Weights/)
    expect(() => run('quickselect', { values: [1], k: 2 })).toThrow(/rank/)
    expect(() => run('n-queens', { n: 9 })).toThrow(/n ≤ 8/)
    expect(() => run('fft', { values: [1, 2, 3] })).toThrow(/power-of-two/)
    expect(() => run('strassen', { a: [[1, 2]], b: [[1]] })).toThrow(/square/)
    expect(() => run('coin-change', { values: [-1], amount: 5 })).toThrow(/positive/)
  })
})

describe('graph algorithm results and failure modes', () => {
  it('computes distances and distinguishes unreachable from negative-cycle affected', () => {
    const g = graph(5, [
      [0, 1, 4],
      [0, 2, 1],
      [2, 1, 2],
      [1, 3, 1],
    ])
    expect(run('dijkstra', g)).toMatchObject({ distances: [0, 3, 1, 4, 'unreachable'] })
    expect(run('bellman-ford', g)).toMatchObject({ distances: [0, 3, 1, 4, 'unreachable'], negativeCycle: false })
    const negative = graph(5, [
      [0, 1, 1],
      [1, 2, -3],
      [2, 1, 1],
      [2, 3, 1],
    ])
    expect(() => run('dijkstra', negative)).toThrow(/non-negative/)
    expect(run('bellman-ford', negative)).toMatchObject({
      distances: [0, 'negative-cycle affected', 'negative-cycle affected', 'negative-cycle affected', 'unreachable'],
      negativeCycle: true,
    })
    expect(
      run(
        'bellman-ford',
        graph(4, [
          [0, 1, 2],
          [2, 3, -2],
          [3, 2, 1],
        ]),
      ),
    ).toMatchObject({ negativeCycle: false })
    expect(run('floyd-warshall', negative)).toMatchObject({ negativeCycle: true })
  })
  it('agrees on MST forests with negative, parallel and disconnected edges', () => {
    const g = graph(
      5,
      [
        [0, 1, -2],
        [0, 1, 5],
        [1, 2, 1],
        [0, 2, 4],
        [3, 4, 3],
      ],
      false,
    )
    for (const id of ['prim', 'kruskal']) expect(run(id, g)).toMatchObject({ weight: 2, components: 2, spanningTree: false })
    const dsu = new DSU(4)
    expect(dsu.union(0, 1)).toBe(true)
    expect(dsu.union(1, 0)).toBe(false)
    dsu.union(2, 3)
    dsu.union(0, 2)
    expect(new Set(dsu.parent.map((_, i) => dsu.find(i))).size).toBe(1)
  })
  it('validates ordering, SCCs and multistage dependencies', () => {
    expect(
      run(
        'daa-bfs',
        graph(5, [
          [0, 1],
          [0, 2],
          [1, 3],
        ]),
      ),
    ).toMatchObject({ order: [0, 1, 2, 3], distance: [0, 1, 1, 2, -1] })
    expect(
      run(
        'daa-dfs',
        graph(5, [
          [0, 1],
          [0, 2],
          [1, 3],
        ]),
      ),
    ).toMatchObject({ order: [0, 1, 3, 2], unreachable: [4] })
    const cyclic = graph(4, [
      [0, 1],
      [1, 0],
      [1, 2],
      [2, 3],
      [3, 2],
    ])
    expect(run('kahn-topological-sort', cyclic)).toMatchObject({ cycle: true })
    expect(() => run('multistage-shortest-path', cyclic)).toThrow(/DAG/)
    expect(run('kosaraju-scc', cyclic)).toMatchObject({
      components: [
        [0, 1],
        [2, 3],
      ],
    })
    expect(
      run(
        'multistage-shortest-path',
        graph(3, [
          [0, 1, 5],
          [1, 2, -7],
          [0, 2, 3],
        ]),
      ),
    ).toMatchObject({ distances: [0, 5, -2] })
  })
  it('matches max-flow/min-cut, reroutes matching and handles multigraph bridges', () => {
    expect(run('edmonds-karp')).toMatchObject({ flow: 5, cutCapacity: 5 })
    expect(run('bipartite-matching')).toMatchObject({
      matching: [
        [1, 2],
        [0, 3],
      ],
    })
    expect(() =>
      run(
        'bipartite-matching',
        graph(
          3,
          [
            [0, 1],
            [1, 2],
            [2, 0],
          ],
          false,
        ),
      ),
    ).toThrow(/bipartite/)
    expect(
      run(
        'bridges',
        graph(
          3,
          [
            [0, 1],
            [0, 1],
            [1, 2],
          ],
          false,
        ),
      ),
    ).toMatchObject({ bridges: [[1, 2]], articulation: [1] })
    expect(
      run(
        'eulerian-trail',
        graph(
          4,
          [
            [0, 1],
            [0, 1],
            [2, 3],
            [2, 3],
          ],
          false,
        ),
      ),
    ).toMatchObject({ exists: false })
  })
})

describe('DP, search and selection cross-checks', () => {
  it('matches knapsack exhaustive search with FIFO and best-first safe pruning', () => {
    for (let sample = 0; sample < 30; sample++) {
      const n = 5,
        weights = Array.from({ length: n }, (_, i) => ((sample * 3 + i * 7) % 7) + 1),
        profits = Array.from({ length: n }, (_, i) => (sample * 7 + i * 3) % 13),
        capacity = sample % 15
      let best = 0
      for (let mask = 0; mask < 1 << n; mask++) {
        let weight = 0,
          profit = 0
        for (let i = 0; i < n; i++)
          if (mask & (1 << i)) {
            weight += weights[i]
            profit += profits[i]
          }
        if (weight <= capacity) best = Math.max(best, profit)
      }
      for (const id of ['zero-one-knapsack', 'knapsack-fifo', 'knapsack-best-first']) {
        const result = run(id, { weights, profits, capacity }) as { profit: number; items: number[]; weight: number }
        expect(result.profit).toBe(best)
        expect(new Set(result.items).size).toBe(result.items.length)
        expect(result.weight).toBeLessThanOrEqual(capacity)
        expect(result.items.reduce((s, i) => s + profits[i], 0)).toBe(best)
      }
    }
  })
  it('matches Held–Karp and bounded TSP with exhaustive tour costs', () => {
    const permutations = (a: number[]): number[][] => (a.length ? a.flatMap((v, i) => permutations(a.filter((_, j) => i !== j)).map((p) => [v, ...p])) : [[]])
    for (let sample = 0; sample < 12; sample++) {
      const matrix = Array.from({ length: 4 }, () => Array(4).fill(Infinity)),
        edges: number[][] = []
      for (let i = 0; i < 4; i++)
        for (let j = 0; j < 4; j++)
          if (i !== j && (i * 5 + j + sample) % 5 !== 0) {
            const w = ((i * 3 + j * 7 + sample) % 12) - 2
            matrix[i][j] = w
            edges.push([i, j, w])
          }
      const expected = Math.min(...permutations([1, 2, 3]).map((p) => [0, ...p, 0].slice(1).reduce((s, v, i) => s + matrix[[0, ...p, 0][i]][v], 0)))
      for (const id of ['held-karp-tsp', 'tsp-branch-and-bound'])
        expect(run(id, graph(4, edges))).toMatchObject({ cost: Number.isFinite(expected) ? expected : null })
    }
  })
  it('handles unreachable DP states and reconstructs known answers', () => {
    expect(run('coin-change', { values: [4, 6], amount: 3 })).toMatchObject({ reachable: false, minimum: null, coins: [] })
    expect(run('coin-change')).toMatchObject({ minimum: 2, coins: [3, 3] })
    expect(run('longest-common-subsequence')).toMatchObject({ length: 4 })
    expect(run('longest-common-subsequence', { left: '', right: 'ABC' })).toMatchObject({ length: 0, sequence: '' })
    expect(run('edit-distance')).toMatchObject({ distance: 3 })
    expect(run('matrix-chain-multiplication')).toMatchObject({ cost: 4500 })
    expect(run('optimal-bst')).toMatchObject({ cost: 142 })
    expect(run('optimal-bst', { frequencies: [0.15, 0.1, 0.05, 0.1, 0.2], unsuccessful: [0.05, 0.1, 0.05, 0.05, 0.05, 0.1] })).toMatchObject({ cost: 2.75 })
    for (let n = 0; n <= 12; n++) expect(run('fibonacci-memoization', { n })).toEqual(run('fibonacci-tabulation', { n }))
  })
  it('covers unsatisfiable constraints and negative subset values', () => {
    expect(run('n-queens', { n: 4 })).toMatchObject({ count: 2 })
    expect(run('n-queens', { n: 3 })).toMatchObject({ count: 0 })
    expect(
      run('graph-coloring', {
        ...graph(
          3,
          [
            [0, 1],
            [1, 2],
            [2, 0],
          ],
          false,
        ),
        colors: 2,
      }),
    ).toMatchObject({ satisfiable: false })
    expect(
      run(
        'hamiltonian-cycle',
        graph(
          3,
          [
            [0, 1],
            [1, 2],
          ],
          false,
        ),
      ),
    ).toMatchObject({ exists: false })
    expect(run('sum-of-subsets', { values: [5, -2], target: 3 })).toMatchObject({ subsets: [[0, 1]] })
    expect(run('sum-of-subsets', { values: [0], target: 0 })).toMatchObject({ count: 2 })
  })
  it('matches selection against sorted ranks with duplicates', () => {
    for (let sample = 0; sample < 12; sample++) {
      const values = Array.from({ length: 10 }, (_, i) => ((sample * 7 + i * 3) % 9) - 4),
        sorted = [...values].sort((a, b) => a - b)
      for (let k = 1; k <= values.length; k++)
        for (const id of ['quickselect', 'deterministic-selection', 'randomized-selection'])
          expect(run(id, { values, k, seed: sample })).toMatchObject({ value: sorted[k - 1] })
    }
    expect(run('maximum-subarray', { values: [-4, -1, -3] })).toMatchObject({ sum: -1, start: 1, end: 1 })
    expect(run('counting-inversions')).toMatchObject({ inversions: 3 })
    expect(run('strassen')).toMatchObject({
      product: [
        [19, 22],
        [43, 50],
      ],
    })
    expect(run('karatsuba')).toMatchObject({ product: '7006652' })
  })
})

describe('strings, greedy and extension algorithms', () => {
  it('cross-checks matchers on overlapping, absent, empty and collision candidates', () => {
    for (const text of ['ABABABABA', 'aaaaa', '', 'abcbacabbc', 'ééé', '😀😀'])
      for (const pattern of ['ABA', 'aa', '', 'abc', 'z', 'é', '😀']) {
        const matches = Array.from({ length: text.length + 1 }, (_, i) => i).filter(
          (i) => i + pattern.length <= text.length && text.slice(i, i + pattern.length) === pattern,
        )
        for (const id of ['naive-string-matching', 'kmp', 'rabin-karp', 'boyer-moore']) expect(run(id, { text, pattern })).toMatchObject({ matches })
      }
    expect(run('suffix-array')).toMatchObject({ suffixArray: [5, 3, 1, 0, 4, 2] })
  })
  it('checks greedy schedules, fractional limits and prefix codes', () => {
    expect(run('activity-selection')).toMatchObject({ selected: [0, 3, 4] })
    expect(run('job-sequencing')).toMatchObject({ profit: 142 })
    expect(run('fractional-knapsack', { weights: [10, 20, 30], profits: [60, 100, 120], capacity: 50 })).toMatchObject({ profit: 240 })
    const result = run('huffman-coding') as { codes: Record<string, string>; weightedLength: number }
    expect(result.weightedLength).toBe(224)
    const codes = Object.values(result.codes)
    for (const a of codes) for (const b of codes) if (a !== b) expect(b.startsWith(a)).toBe(false)
  })
  it('checks FFT against direct DFT and approximation assumptions', () => {
    const values = [2, -1, 4, 0, 3, 1, -2, 5],
      spectrum = (run('fft', { values }) as { spectrum: number[][] }).spectrum
    for (let k = 0; k < values.length; k++) {
      const re = values.reduce((s, v, j) => s + v * Math.cos((-2 * Math.PI * k * j) / values.length), 0),
        im = values.reduce((s, v, j) => s + v * Math.sin((-2 * Math.PI * k * j) / values.length), 0)
      expect(spectrum[k][0]).toBeCloseTo(re)
      expect(spectrum[k][1]).toBeCloseTo(im)
    }
    expect(run('metric-tsp-approximation')).toMatchObject({ cost: 4 })
    expect(() =>
      run(
        'metric-tsp-approximation',
        graph(
          3,
          [
            [0, 1, 1],
            [1, 2, 1],
            [0, 2, 8],
          ],
          false,
        ),
      ),
    ).toThrow(/triangle/)
    const g = graph(
        5,
        [
          [0, 1],
          [1, 2],
          [2, 3],
          [3, 4],
        ],
        false,
      ),
      cover = (run('vertex-cover-approximation', g) as { cover: number[] }).cover
    expect(g.edges!.every((e) => cover.includes(e.from) || cover.includes(e.to))).toBe(true)
    expect(run('reliability-design', { values: [0.8, 0.9], weights: [2, 3], profits: [0, 0], capacity: 4 })).toMatchObject({ reachable: false })
    expect(run('bin-packing')).toMatchObject({ count: 2 })
    expect(run('reliability-design')).toMatchObject({ copies: [2, 2], cost: 10 })
    expect((run('reliability-design') as { reliability: number }).reliability).toBeCloseTo(0.9504)
    expect((run('closest-pair') as { distance: number }).distance).toBeCloseTo(Math.sqrt(2))
  })
})
