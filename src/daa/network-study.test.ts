import { test, expect } from 'vitest'
import { lessonById } from './catalog'
import { executeLesson, type DaaInput } from './types'
const graph: DaaInput = {
  vertices: 5,
  source: 0,
  directed: true,
  edges: [
    { from: 0, to: 1, weight: 4 },
    { from: 0, to: 1, weight: 2 },
    { from: 1, to: 2, weight: 1 },
    { from: 2, to: 1, weight: 3 },
    { from: 2, to: 3, weight: 6 },
  ],
}
test('topological queue and indegrees are immutable; a cycle can block downstream vertices', () => {
  const run = executeLesson(lessonById.get('kahn-topological-sort')!, graph)
  expect(run.result).toEqual({ order: [0, 4], cycle: true })
  expect(run.steps[0].state!.networkStudy).toMatchObject({ frontier: [0, 4], degrees: [0, 3, 1, 1, 0], order: [] })
  expect(run.steps.at(-1)!.state!.networkStudy!.blocked).toEqual([1, 2, 3])
  const release = run.steps.filter((s) => s.state?.networkStudy?.phase === 'release')
  expect(release.map((s) => s.state!.networkStudy!.degrees![1])).toEqual([2, 1])
})
test('SCC phases preserve original graph edges and expose each growing component', () => {
  const run = executeLesson(lessonById.get('kosaraju-scc')!, graph)
  const result = run.result as { components: number[][] }
  expect(result.components.map((c) => [...c].sort()).sort()).toEqual([[0], [1, 2], [3], [4]].sort())
  expect(run.steps.every((s) => JSON.stringify(s.state?.graph?.edges) === JSON.stringify(graph.edges))).toBe(true)
  const transpose = run.steps.find((s) => s.state?.networkStudy?.phase === 'transpose')!
  expect(transpose.state!.networkStudy).toMatchObject({ reversed: true, groups: [] })
  expect(run.steps[0].state!.networkStudy!.groups).toEqual([])
  expect(run.steps.at(-1)!.state!.networkStudy!.reversed).toBe(false)
  expect(run.steps.at(-1)!.state!.networkStudy!.groups!.flat().sort()).toEqual([0, 1, 2, 3, 4])
})
for (const id of ['kahn-topological-sort', 'kosaraju-scc'])
  test(`${id} renders edgeless singleton and cycle-only inputs`, () => {
    const lesson = lessonById.get(id)!
    const run = executeLesson(lesson, { vertices: 1, source: 0, directed: true, edges: [] })
    expect(run.steps[0].state!.weightedExplorer!.current).toBe(0)
    expect(run.steps.at(-1)!.state!.networkStudy!.phase).toBe('summary')
    const loop = executeLesson(lesson, { vertices: 1, source: 0, directed: true, edges: [{ from: 0, to: 0, weight: 2 }] })
    expect(loop.result).toEqual(id === 'kosaraju-scc' ? { components: [[0]] } : { order: [], cycle: true })
  })
