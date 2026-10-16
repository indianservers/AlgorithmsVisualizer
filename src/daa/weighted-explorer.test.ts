import { expect, test } from 'vitest'
import { lessonById } from './catalog'
import { executeLesson, type DaaInput } from './types'

const graph: DaaInput = {
  vertices: 5,
  source: 0,
  directed: false,
  edges: [
    { from: 0, to: 1, weight: 4 },
    { from: 0, to: 1, weight: 1 },
    { from: 1, to: 2, weight: 2 },
    { from: 0, to: 2, weight: 7 },
    { from: 3, to: 3, weight: 0 },
  ],
}

test('Dijkstra snapshots track exact parent edge and immutable distances', () => {
  const run = executeLesson(lessonById.get('dijkstra')!, { ...graph, directed: true })
  const states = run.steps.map((s) => s.state!.weightedExplorer!)
  expect(states[0].distances).toEqual([0, null, null, null, null])
  expect(states.find((s) => s.action === 'relax')!.distances).toEqual([0, 4, null, null, null])
  expect(states.at(-1)!.distances).toEqual([0, 1, 3, null, null])
  expect(states.at(-1)!.accepted).toEqual([1, 2])
  expect(states.at(-1)!.frontier).toEqual([])
  expect(run.result).toMatchObject({ distances: [0, 1, 3, 'unreachable', 'unreachable'] })
})

for (const id of ['prim', 'kruskal'])
  test(`${id} keeps parallel edge identities, cycles and isolated components correct`, () => {
    const run = executeLesson(lessonById.get(id)!, graph)
    const states = run.steps.map((s) => s.state!.weightedExplorer!)
    expect(states.at(-1)!.accepted).toEqual([1, 2])
    expect(states.at(-1)!.cost).toBe(3)
    expect(states[0].accepted).toEqual([])
    expect(run.result).toMatchObject({ weight: 3, components: 3, spanningTree: false })
    if (id === 'kruskal') {
      expect(states.find((s) => s.edge === 4)!.action).toBe('reject')
      expect(states.find((s) => s.edge === 0)!.action).toBe('reject')
      expect(new Set(states.at(-1)!.components).size).toBe(3)
    }
  })

for (const id of ['prim', 'kruskal'])
  test(`${id} supports an edgeless graph in Icons view`, () => {
    const run = executeLesson(lessonById.get(id)!, { vertices: 1, source: 0, directed: false, edges: [] })
    expect(run.steps.at(-1)!.state!.graph!.vertices).toBe(1)
    expect(run.steps.at(-1)!.state!.weightedExplorer!.cost).toBe(0)
  })
