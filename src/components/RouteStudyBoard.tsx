// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
import type { AlgorithmStep } from '../types'

export function RouteStudyBoard({ step, atlas }: { step: AlgorithmStep; atlas: boolean }) {
  useLocaleRender()

  const study = step.state!.routeStudy!,
    graph = step.state!.graph!,
    table = step.state!.table
  return (
    <div className="route-study-board">
      {tx(
        study.phase === 'check' && (
          <div className={`route-formula ${study.improved ? 'approved' : ''}`} key={step.id} role="status">
            <span>{tx(atlas ? `${study.from} → ${study.via} → ${study.to}` : `${study.from} → ${study.to}`, 'common')}</span>
            <strong>
              {tx(study.before, 'common')} <span>{tx('vs candidate', 'common')}</span> {tx(study.candidate, 'common')}
            </strong>
            <em>{tx(study.improved ? '✓ Improved route' : 'Keep the current route', 'common')}</em>
          </div>
        ),
        'common',
      )}
      {tx(
        atlas ? (
          <div className="route-matrix-scroll">
            <table className="route-matrix">
              <caption>
                {tx('Route atlas · origin ↓ / destination →', 'common')}
                {tx(
                  study.phase === 'start' ? ' · direct bridge costs' : study.phase !== 'summary' ? ` · allowed hubs 0…${study.via}` : ' · final distances',
                  'common',
                )}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{tx('from / to', 'common')}</th>
                  {tx(
                    Array.from({ length: graph.vertices }, (_, v) => (
                      <th scope="col" key={v}>
                        {tx(v, 'common')}
                      </th>
                    )),
                    'common',
                  )}
                </tr>
              </thead>
              <tbody>
                {tx(
                  table?.map((row, i) => (
                    <tr key={i}>
                      <th scope="row">{tx(i, 'common')}</th>
                      {tx(
                        row.map((value, j) => (
                          <td
                            key={j}
                            data-from={i}
                            data-to={j}
                            className={`${study.phase === 'check' && study.from === i && study.to === j ? 'route-cell-current' : ''} ${study.phase !== 'summary' && study.phase !== 'start' && (i === study.via || j === study.via) ? 'route-cell-hub' : ''} ${value === '−∞' ? 'route-cell-cycle' : ''}`}
                          >
                            {tx(String(value), 'common')}
                          </td>
                        )),
                        'common',
                      )}
                    </tr>
                  )),
                  'common',
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="explorer-dock" aria-label={tx('Bellman-Ford pass belt', 'common')}>
            <div className="explorer-dock-title">
              <strong>{tx('Courier pass belt', 'common')}</strong>
              <span>
                {tx('INPUT ARC ORDER · PASS ', 'common')}
                {tx(study.pass, 'common')}
              </span>
            </div>
            <div className="weighted-board">
              {tx(
                graph.edges.map((edge, i) => (
                  <div key={i} className={`weighted-edge-ticket ${step.state?.weightedExplorer?.edge === i ? 'route-edge-active' : ''}`}>
                    <strong>
                      {tx(edge.from, 'common')} {tx(graph.directed ? '→' : '↔', 'common')} {tx(edge.to, 'common')}
                    </strong>
                    <span>
                      {tx('weight ', 'common')}
                      {tx(edge.weight, 'common')}
                    </span>
                    <small>{tx(step.state?.weightedExplorer?.edge === i ? (study.improved ? '✓ improved' : 'inspecting') : 'route card', 'common')}</small>
                  </div>
                )),
                'common',
              )}
            </div>
          </div>
        ),
        'common',
      )}
      {tx(
        !!study.negativeCycle && (
          <p className="route-cycle-warning" role="status">
            {tx('Negative cycle detected. Affected ', 'common')}
            {tx(atlas ? 'pairs' : 'vertices', 'common')}
            {tx(' have no finite shortest distance.', 'common')}
            {tx(' ', 'common')}
            {tx(atlas ? 'Other matrix entries remain valid.' : 'Unreachable negative cycles do not affect this source.', 'common')}
          </p>
        ),
        'common',
      )}
    </div>
  )
}
