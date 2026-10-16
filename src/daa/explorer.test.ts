import { expect, test } from 'vitest'
import { lessonById } from './catalog'
import { executeLesson } from './types'

const input = {
  vertices: 5,
  source: 0,
  directed: true,
  edges: [
    { from: 0, to: 1, weight: 2 },
    { from: 0, to: 2, weight: 6 },
    { from: 1, to: 3, weight: 5 },
    { from: 3, to: 0, weight: 1 },
  ],
}

test('BFS explorer snapshots preserve FIFO state and hop levels on a cyclic disconnected graph', () => {
  const run = executeLesson(lessonById.get('daa-bfs')!, input)
  const states = run.steps.filter((s) => s.type === 'visit').map((s) => s.state!.traversal!)
  expect(states.map((s) => s.current)).toEqual([0, 1, 2, 3])
  expect(states.map((s) => s.frontier)).toEqual([[1, 2], [2, 3], [3], []])
  expect(states[0].visited).toEqual([0])
  expect(states[0].distance).toEqual([0, 1, 1, -1, -1])
  expect(states[3].distance).toEqual([0, 1, 1, 2, -1])
})

test('DFS explorer breadcrumbs preserve parent links through cycles and backtracking', () => {
  const run = executeLesson(lessonById.get('daa-dfs')!, input)
  const states = run.steps.filter((s) => s.type === 'visit').map((s) => s.state!.traversal!)
  expect(states.map((s) => s.current)).toEqual([0, 1, 3, 2])
  expect(states.map((s) => s.path)).toEqual([[0], [0, 1], [0, 1, 3], [0, 2]])
  expect(states.map((s) => s.frontier)).toEqual([[2, 1], [2, 3], [2], []])
  expect(states[0].visited).toEqual([0])
  expect(run.result).toEqual({ order: [0, 1, 3, 2], unreachable: [4] })
})

test('DFS dock clears visited duplicate entries at completion', () => {
  const lesson = lessonById.get('daa-dfs')!
  const run = executeLesson(lesson, lesson.defaultInput!)
  expect(run.steps.at(-1)?.state?.traversal?.frontier).toEqual([])
})
