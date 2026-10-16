import type { AlgorithmStep } from '../types'

export function RouteStudyBoard({ step, atlas }: { step: AlgorithmStep; atlas: boolean }) {
  const study = step.state!.routeStudy!,
    graph = step.state!.graph!,
    table = step.state!.table
  return (
    <div className="route-study-board">
      {study.phase === 'check' && (
        <div className={`route-formula ${study.improved ? 'approved' : ''}`} key={step.id} role="status">
          <span>{atlas ? `${study.from} → ${study.via} → ${study.to}` : `${study.from} → ${study.to}`}</span>
          <strong>
            {study.before} <span>vs candidate</span> {study.candidate}
          </strong>
          <em>{study.improved ? '✓ Improved route' : 'Keep the current route'}</em>
        </div>
      )}
      {atlas ? (
        <div className="route-matrix-scroll">
          <table className="route-matrix">
            <caption>
              Route atlas · origin ↓ / destination →
              {study.phase === 'start' ? ' · direct bridge costs' : study.phase !== 'summary' ? ` · allowed hubs 0…${study.via}` : ' · final distances'}
            </caption>
            <thead>
              <tr>
                <th scope="col">from / to</th>
                {Array.from({ length: graph.vertices }, (_, v) => (
                  <th scope="col" key={v}>
                    {v}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table?.map((row, i) => (
                <tr key={i}>
                  <th scope="row">{i}</th>
                  {row.map((value, j) => (
                    <td
                      key={j}
                      data-from={i}
                      data-to={j}
                      className={`${study.phase === 'check' && study.from === i && study.to === j ? 'route-cell-current' : ''} ${study.phase !== 'summary' && study.phase !== 'start' && (i === study.via || j === study.via) ? 'route-cell-hub' : ''} ${value === '−∞' ? 'route-cell-cycle' : ''}`}
                    >
                      {String(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="explorer-dock" aria-label="Bellman-Ford pass belt">
          <div className="explorer-dock-title">
            <strong>Courier pass belt</strong>
            <span>INPUT ARC ORDER · PASS {study.pass}</span>
          </div>
          <div className="weighted-board">
            {graph.edges.map((edge, i) => (
              <div key={i} className={`weighted-edge-ticket ${step.state?.weightedExplorer?.edge === i ? 'route-edge-active' : ''}`}>
                <strong>
                  {edge.from} {graph.directed ? '→' : '↔'} {edge.to}
                </strong>
                <span>weight {edge.weight}</span>
                <small>{step.state?.weightedExplorer?.edge === i ? (study.improved ? '✓ improved' : 'inspecting') : 'route card'}</small>
              </div>
            ))}
          </div>
        </div>
      )}
      {!!study.negativeCycle && (
        <p className="route-cycle-warning" role="status">
          Negative cycle detected. Affected {atlas ? 'pairs' : 'vertices'} have no finite shortest distance.{' '}
          {atlas ? 'Other matrix entries remain valid.' : 'Unreachable negative cycles do not affect this source.'}
        </p>
      )}
    </div>
  )
}
