import { test, expect } from 'vitest'
import { executeLesson, type DaaInput } from './types'
import { lessonById } from './catalog'
const graph: DaaInput = {
  vertices: 4,
  source: 0,
  directed: true,
  edges: [
    { from: 0, to: 1, weight: 2 },
    { from: 1, to: 2, weight: -3 },
    { from: 2, to: 1, weight: 1 },
  ],
}
for (const id of ['bellman-ford', 'floyd-warshall']) {
  test(`${id} exposes graph and cycle effects without finite shortest-distance claims`, () => {
    const run = executeLesson(lessonById.get(id)!, graph)
    expect(run.result).toMatchObject({ negativeCycle: true })
    expect(run.steps.every((s) => s.state?.graph?.edges.length === 3)).toBe(true)
    expect(run.steps.at(-1)!.state!.routeStudy!.negativeCycle).toBe(true)
    if (id === 'bellman-ford') {
      expect(run.steps.at(-1)!.state!.routeStudy!.affected!.sort()).toEqual([1, 2])
      expect(run.steps.find((s) => s.state?.routeStudy?.phase === 'check')!.state!.routeStudy).toMatchObject({ before: '∞', candidate: 2, improved: true })
    } else {
      expect(run.steps.at(-1)!.state!.table![0]).toEqual([0, '−∞', '−∞', '∞'])
      expect(run.steps.at(-1)!.state!.table![3]).toEqual(['∞', '∞', '∞', 0])
    }
  })
  test(`${id} has valid initial/final states for a graph without edges`, () => {
    const run = executeLesson(lessonById.get(id)!, { vertices: 1, source: 0, directed: false, edges: [] })
    expect(run.result).toMatchObject({ negativeCycle: false })
    expect(run.steps.at(-1)!.state!.graph!.vertices).toBe(1)
    expect(run.steps.at(-1)!.state!.routeStudy!.phase).toBe('summary')
  })
}
test('Bellman-Ford leaves an unreachable negative cycle irrelevant to source distances', () => {
  const run = executeLesson(lessonById.get('bellman-ford')!, { ...graph, edges: graph.edges!.slice(1) })
  expect(run.result).toMatchObject({ negativeCycle: false, distances: [0, 'unreachable', 'unreachable', 'unreachable'] })
})
