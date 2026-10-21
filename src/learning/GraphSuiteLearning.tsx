// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
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
  useLocaleRender()

  const ids = suiteAlgorithms[module.id] ?? daaLessons.filter((l) => l.defaultInput?.vertices && l.run).map((l) => l.id)
  const [selected, setSelected] = useState(ids[0])
  const lesson = lessonById.get(selected)!
  return (
    <div className="graph-suite-layout">
      <section className="learning-studio">
        <span className="ls-eyebrow">{tx('CONNECTED GRAPH LESSONS', 'studios')}</span>
        <h2>{tx(module.name, 'studios')}</h2>
        <p>{tx(module.summary, 'studios')}</p>
        <ol>
          {tx(
            module.pseudocode.map((line, i) => <li key={i}>{tx(line, 'studios')}</li>),
            'studios',
          )}
        </ol>
        {tx(
          module.id === 'prerequisite-graph' && (
            <p>
              {tx(
                'Interpret each vertex as a lesson and u → v as “finish u before v.” A topological order is a valid learning sequence. A cycle indicates conflicting prerequisites.',
                'studios',
              )}
            </p>
          ),
          'studios',
        )}
        {tx(
          module.id === 'graph-representation-suite' && (
            <p>
              {tx(
                'Use the editor below to add or remove edges and watch the adjacency list and matrix update together. Lists store neighbors; matrix entries represent vertex pairs.',
                'studios',
              )}
            </p>
          ),
          'studios',
        )}
        <label>
          {tx('Explore a related algorithm', 'studios')}
          <select aria-label={tx('Graph suite algorithm', 'studios')} value={selected} onChange={(e) => setSelected(e.target.value)}>
            {tx(
              ids.map((id) => (
                <option key={id} value={id}>
                  {tx(lessonById.get(id)!.title, 'studios')}
                </option>
              )),
              'studios',
            )}
          </select>
        </label>
      </section>
      <GraphLearningStudio key={selected} lesson={lesson} theoryOnly={tab === 'Learn'} />
    </div>
  )
}
