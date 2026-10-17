import { useState } from 'react'
import type { AlgorithmModule, LearningTab } from '../types'
import { daaLessons, lessonById } from '../daa/catalog'
import { GraphLearningStudio } from './GraphLearningStudio'

const suiteAlgorithms: Record<string, string[]> = {
  'graph-shortest-paths-suite': ['dijkstra', 'bellman-ford', 'floyd-warshall', 'multistage-shortest-path'],
  'graph-mst-suite': ['prim', 'kruskal'],
  'topological-sort-suite': ['kahn-topological-sort'],
  'strongly-connected-components': ['kosaraju-scc'],
  'prerequisite-graph': ['kahn-topological-sort'],
  'graph-representation-suite': ['daa-bfs', 'daa-dfs'],
}
export function GraphSuiteLearning({ module, tab }: { module: AlgorithmModule; tab: LearningTab }) {
  const ids = suiteAlgorithms[module.id] ?? daaLessons.filter((l) => l.defaultInput?.vertices && l.run).map((l) => l.id)
  const [selected, setSelected] = useState(ids[0])
  const lesson = lessonById.get(selected)!
  return (
    <div className="graph-suite-layout">
      <section className="learning-studio">
        <span className="ls-eyebrow">CONNECTED GRAPH LESSONS</span>
        <h2>{module.name}</h2>
        <p>{module.summary}</p>
        <ol>
          {module.pseudocode.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ol>
        {module.id === 'prerequisite-graph' && (
          <p>
            Interpret each vertex as a lesson and u → v as “finish u before v.” A topological order is a valid learning sequence. A cycle indicates conflicting
            prerequisites.
          </p>
        )}
        {module.id === 'graph-representation-suite' && (
          <p>
            Use the editor below to add or remove edges and watch the adjacency list and matrix update together. Lists store neighbors; matrix entries represent
            vertex pairs.
          </p>
        )}
        <label>
          Explore a related algorithm
          <select aria-label="Graph suite algorithm" value={selected} onChange={(e) => setSelected(e.target.value)}>
            {ids.map((id) => (
              <option key={id} value={id}>
                {lessonById.get(id)!.title}
              </option>
            ))}
          </select>
        </label>
      </section>
      <GraphLearningStudio key={selected} lesson={lesson} theoryOnly={tab === 'Learn'} />
    </div>
  )
}
