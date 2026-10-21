// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
import { useId } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { AlgorithmStep } from '../types'
import { Penguin } from './CharacterArt'
import './explorer.css'
import './weighted-explorer.css'
import { RouteStudyBoard } from './RouteStudyBoard'
import { NetworkStudyBoard } from './NetworkStudyBoard'

type Props = {
  step?: AlgorithmStep
  mode: 'dijkstra' | 'prim' | 'kruskal' | 'bellman-ford' | 'floyd-warshall' | 'kahn-topological-sort' | 'kosaraju-scc'
  reducedMotion: boolean
}
const groupColors = ['#298c9b', '#a273bd', '#c08734', '#4b8e66', '#bc687a', '#6578bf', '#8d853e', '#b16d44']

export function WeightedExplorer({ step, mode, reducedMotion }: Props) {
  useLocaleRender()

  const id = useId().replace(/:/g, '')
  const systemReduced = useReducedMotion()
  const still = reducedMotion || systemReduced
  const rawGraph = step?.state?.graph,
    state = step?.state?.weightedExplorer
  if (!rawGraph || !state) return <p>{tx('Run the algorithm to begin the expedition.', 'studios')}</p>
  const network = step?.state?.networkStudy,
    scc = mode === 'kosaraju-scc'
  const graph = network?.reversed ? { ...rawGraph, edges: rawGraph.edges.map((e) => ({ ...e, from: e.to, to: e.from })) } : rawGraph
  const route = mode === 'dijkstra' || mode === 'bellman-ford' || mode === 'floyd-warshall',
    joining = mode === 'kruskal',
    complete = step?.type === 'complete'
  const study = step?.state?.routeStudy
  const atlas = mode === 'floyd-warshall'
  const courier = mode === 'bellman-ford'
  const names = {
    dijkstra: 'The shortest-route expedition',
    prim: 'The bridge-building expedition',
    kruskal: 'The island-union expedition',
    'bellman-ford': 'The courier’s route patrol',
    'floyd-warshall': 'The penguin’s shortcut atlas',
    'kahn-topological-sort': 'The penguin dispatch dock',
    'kosaraju-scc': 'The island reunion expedition',
  }
  const nodes = Array.from({ length: graph.vertices }, (_, v) => ({
    x: 320 + (graph.vertices === 1 ? 0 : 220 * Math.cos(-Math.PI / 2 + (v * 2 * Math.PI) / graph.vertices)),
    y: 245 + (graph.vertices === 1 ? 0 : 142 * Math.sin(-Math.PI / 2 + (v * 2 * Math.PI) / graph.vertices)),
  }))
  const current = nodes[state.current]
  const accepted = new Set(state.accepted),
    visited = new Set(state.visited)
  const sortedEdges = graph.edges.map((edge, index) => ({ ...edge, index })).sort((a, b) => a.weight - b.weight || a.index - b.index)
  const rejected = new Set(
    joining
      ? sortedEdges
          .slice(0, state.edge === undefined ? 0 : sortedEdges.findIndex((e) => e.index === state.edge) + 1)
          .filter((e) => !accepted.has(e.index))
          .map((e) => e.index)
      : [],
  )
  const crossing = sortedEdges.filter((e) => visited.has(e.from) !== visited.has(e.to))
  const components = [...new Set(state.components ?? [])].filter((c) => !scc || c >= 0)
  const decision = network
    ? network.blocked?.length
      ? 'Cycle blocks the dispatch'
      : network.reversed
        ? 'Transpose expedition · arrows reversed'
        : network.phase === 'finish'
          ? 'Finish card collected'
          : network.phase === 'release'
            ? 'Dependency released'
            : network.phase === 'group'
              ? 'Island group grows'
              : 'Follow the expedition'
    : state.action === 'reject'
      ? 'Cycle detected · skip bridge'
      : state.action === 'relax'
        ? 'Better route found'
        : state.action === 'settle'
          ? 'Shortest distance confirmed'
          : state.action === 'accept'
            ? 'Bridge accepted'
            : 'Expedition begins'
  const paths = graph.edges.map((edge, index) => {
    const a = nodes[edge.from],
      b = nodes[edge.to],
      dx = b.x - a.x,
      dy = b.y - a.y,
      len = Math.hypot(dx, dy) || 1
    const siblings = graph.edges
      .map((e, i) => ({ e, i }))
      .filter(({ e }) => Math.min(e.from, e.to) === Math.min(edge.from, edge.to) && Math.max(e.from, e.to) === Math.max(edge.from, edge.to))
    const rank = siblings.findIndex((e) => e.i === index) - (siblings.length - 1) / 2
    const side = edge.from <= edge.to ? 1 : -1,
      offset = rank * 120 * side
    const cx = (a.x + b.x) / 2 - (dy / len) * offset,
      cy = (a.y + b.y) / 2 + (dx / len) * offset
    const loop = edge.from === edge.to
    return {
      d: loop
        ? `M${a.x - 18} ${a.y - 18} C${a.x - 65} ${a.y - 84},${a.x + 65} ${a.y - 84},${a.x + 18} ${a.y - 18}`
        : `M${a.x + (dx / len) * 27} ${a.y + (dy / len) * 27} Q${cx} ${cy} ${b.x - (dx / len) * 31} ${b.y - (dy / len) * 31}`,
      x: loop ? a.x : (a.x + b.x) / 2 - ((dy / len) * offset) / 2,
      y: loop ? a.y - 63 : (a.y + b.y) / 2 + ((dx / len) * offset) / 2,
    }
  })
  return (
    <section
      className={`explorer-workbench weighted-expedition ${mode}`}
      data-motion={still ? 'off' : 'on'}
      aria-label={tx(`${mode} penguin icons visualization`, 'studios')}
    >
      <header className="explorer-heading">
        <div>
          <span className="explorer-kicker">{tx('PENGUIN EXPEDITIONS', 'studios')}</span>
          <h3>{tx(names[mode], 'studios')}</h3>
        </div>
        <span className="explorer-current">
          {tx(
            network?.blocked?.length
              ? 'Cycle blocks the dispatch'
              : study?.negativeCycle
                ? 'Negative cycle detected'
                : complete
                  ? 'Expedition complete'
                  : study
                    ? atlas
                      ? `Hub ${study.via} · ${study.phase === 'check' ? `${study.from} → ${study.to}` : 'open the atlas'}`
                      : `Pass ${study.pass} · ${study.improved ? 'route improved' : 'checking routes'}`
                    : decision,
            'studios',
          )}
        </span>
      </header>
      <div className="weighted-summary">
        <span>
          {tx(
            network
              ? scc
                ? 'Island groups'
                : 'Dispatched nodes'
              : study
                ? atlas
                  ? 'Intermediate hub'
                  : 'Relaxation pass'
                : route
                  ? 'Current distance'
                  : 'Bridge budget',
            'studios',
          )}
          {tx(' ', 'studios')}
          <strong>{tx(network ? (scc ? components.length : network.order.length) : study ? (atlas ? study.via : study.pass) : state.cost, 'studios')}</strong>
        </span>
        {tx(
          joining && (
            <span>
              {tx('Island groups ', 'studios')}
              <strong>{tx(components.length, 'studios')}</strong>
            </span>
          ),
          'studios',
        )}
        <span>
          {tx(
            network
              ? scc
                ? 'Finish cards'
                : 'Ready to dispatch'
              : study
                ? atlas
                  ? 'Origin row'
                  : 'Vertices affected by a cycle'
                : route
                  ? 'Settled nodes'
                  : 'Accepted bridges',
            'studios',
          )}
          {tx(' ', 'studios')}
          <strong>
            {tx(
              network
                ? scc
                  ? network.finishOrder?.length
                  : network.frontier.length
                : study
                  ? atlas
                    ? study.from
                    : (study.affected?.length ?? 0)
                  : route
                    ? visited.size
                    : accepted.size,
              'studios',
            )}
          </strong>
        </span>
      </div>
      <div className="explorer-map-scroll">
        {tx(
          network && (
            <p className="network-map-caption">
              {tx(
                scc
                  ? network.reversed
                    ? 'PASS 2 · TRANSPOSE · arrows reversed, weights unchanged'
                    : network.phase === 'summary'
                      ? 'FINAL GROUPS · original arrow directions restored'
                      : 'PASS 1 · original arrows · collect finish cards'
                  : 'Original graph stays visible · glowing arrows release dependencies',
                'studios',
              )}
            </p>
          ),
          'studios',
        )}
        <svg
          className="explorer-map"
          viewBox="0 0 640 470"
          role="img"
          aria-label={tx(`${mode} weighted graph with node labels and ${graph.directed ? 'directed arrows' : 'undirected bridges'}`, 'studios')}
        >
          <defs>
            <marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0L10 5L0 10Z" fill="context-stroke" />
            </marker>
            <radialGradient id={`${id}-glow`}>
              <stop stopColor={route ? '#54b7c7' : '#dfb866'} stopOpacity=".2" />
              <stop offset="1" stopColor="#dfb866" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="640" height="470" rx="20" fill={`url(#${id}-glow)`} />
          <g className="explorer-map-grid" aria-hidden="true">
            {tx(
              Array.from({ length: 10 }, (_, i) => <path key={i} d={`M0 ${i * 48}H640 M${i * 72} 0V470`} />),
              'studios',
            )}
          </g>
          <text x="600" y="32" className="explorer-compass">
            {tx('N ↑', 'studios')}
          </text>
          {tx(
            graph.edges.map((_, i) => (
              <g
                key={i}
                className={`weighted-edge ${accepted.has(i) ? 'accepted' : ''} ${rejected.has(i) ? 'reject' : ''} ${state.edge === i ? state.action : ''} ${network?.degrees && accepted.has(i) ? 'network-released' : ''}`}
                data-edge={i}
                data-state={rejected.has(i) ? 'reject' : state.edge === i ? state.action : accepted.has(i) ? 'accepted' : 'waiting'}
              >
                <path className="weighted-bridge" d={paths[i].d} markerEnd={graph.directed ? `url(#${id}-arrow)` : undefined} />
                {tx(
                  state.edge === i && state.action !== 'reject' && !complete && <path key={step?.id} className="weighted-route-pulse" d={paths[i].d} />,
                  'studios',
                )}
              </g>
            )),
            'studios',
          )}
          {tx(
            atlas && study?.phase === 'check' && study.candidate !== '∞' && (
              <path
                key={step?.id}
                className={`atlas-shortcut ${study.improved ? 'improved' : ''}`}
                d={`M${nodes[study.from!].x} ${nodes[study.from!].y} Q320 205 ${nodes[study.via!].x} ${nodes[study.via!].y} Q320 285 ${nodes[study.to!].x} ${nodes[study.to!].y}`}
                markerEnd={`url(#${id}-arrow)`}
              />
            ),
            'studios',
          )}
          <motion.g initial={false} animate={{ x: current.x, y: current.y }} transition={{ duration: still ? 0 : 0.55, ease: 'easeInOut' }} aria-hidden="true">
            <circle className="weighted-halo" r="42" />
            <g transform="translate(-17 -94)">
              <Penguin height={68} status="still" />
              {tx(
                network && (
                  <g>
                    <path d="M4 15Q5 2 18 2Q30 2 31 15Z" fill={scc ? '#a17ab4' : '#59a79d'} stroke="#465569" strokeWidth="2" />
                    <path d="M24 35L39 35L39 55L24 55Z" fill="#fff3d5" stroke="#ac8c57" />
                    <path d="M27 41H36 M27 46H34" stroke="#ac8c57" />
                  </g>
                ),
                'studios',
              )}
              {tx(
                network ? null : route ? (
                  <>
                    <path d="M5 15L10 5Q18 0 26 5L30 15Z" fill="#5898ac" stroke="#335c70" strokeWidth="2" />
                    <path d="M25 36L40 30L43 46L28 50Z" fill="#fff8df" stroke="#b39461" />
                    <path d="M29 39L34 35L39 40L33 45" fill="none" stroke="#5898ac" strokeWidth="1.5" />
                    {tx(
                      courier && (
                        <g>
                          <path d="M2 29L31 53" stroke="#a06d41" strokeWidth="3" />
                          <rect x="22" y="43" width="17" height="14" rx="3" fill="#bb8753" stroke="#775036" />
                          <path d="M23 45L31 50L38 45" fill="none" stroke="#f9e0aa" />
                        </g>
                      ),
                      'studios',
                    )}
                    {tx(
                      atlas && (
                        <g fill="none" stroke="#84619f" strokeWidth="1.2">
                          <circle cx="12" cy="23" r="4" />
                          <circle cx="22" cy="23" r="4" />
                          <path d="M16 23H18" />
                        </g>
                      ),
                      'studios',
                    )}
                  </>
                ) : (
                  <>
                    <path d="M5 15Q5 1 18 1Q30 1 30 15Z M2 16H33" fill="#edbc4d" stroke="#a57521" strokeWidth="2" />
                    <path d="M18 2V14" stroke="#fff0a7" strokeWidth="3" />
                    <path d="M28 39L38 49 M32 34L41 42L37 46L28 38Z" stroke="#6b5a47" fill="#9cabb3" strokeWidth="3" />
                  </>
                ),
                'studios',
              )}
            </g>
          </motion.g>
          {/* Edge badges and node labels render above the travelling character. */}
          {tx(
            graph.edges.map((edge, i) => (
              <g key={i} className="explorer-weight" transform={`translate(${paths[i].x} ${paths[i].y})`}>
                <rect x="-25" y="-11" width="50" height="22" rx="10" />
                <text textAnchor="middle" y="4">
                  {tx(edge.weight, 'studios')}
                </text>
                {tx(
                  state.edge === i && state.action === 'reject' && (
                    <text className="weighted-skip-label" textAnchor="middle" y="-18">
                      {tx('× cycle', 'studios')}
                    </text>
                  ),
                  'studios',
                )}
              </g>
            )),
            'studios',
          )}
          {tx(
            nodes.map((node, v) => {
              const component = state.components?.[v],
                color = component === undefined ? undefined : groupColors[components.indexOf(component) % groupColors.length]
              const distance = state.distances?.[v]
              return (
                <g key={v} className={`explorer-island ${state.current === v ? 'current' : visited.has(v) ? 'visited' : 'unseen'}`} data-node={v}>
                  {tx(
                    (joining || (scc && component !== undefined && component >= 0)) && (
                      <circle key={`${v}-${component}`} className="weighted-component-ring network-group-ring" cx={node.x} cy={node.y} r="34" stroke={color} />
                    ),
                    'studios',
                  )}
                  <ellipse className="island-shore" cx={node.x} cy={node.y + 10} rx="31" ry="24" />
                  <circle
                    className="island-center"
                    cx={node.x}
                    cy={node.y}
                    r="24"
                    style={
                      study?.affected?.includes(v) || network?.blocked?.includes(v)
                        ? { stroke: '#be5973', fill: 'var(--panel)' }
                        : joining || scc
                          ? { stroke: color }
                          : undefined
                    }
                  />
                  <text className="explorer-node-label" textAnchor="middle" x={node.x} y={node.y + 5}>
                    {tx(v, 'studios')}
                  </text>
                  <text className="explorer-node-detail weighted-node-detail" textAnchor="middle" x={node.x} y={node.y + 47}>
                    {tx(
                      network
                        ? scc
                          ? component! >= 0
                            ? `group ${components.indexOf(component!) + 1}`
                            : network.finishOrder?.includes(v)
                              ? 'finished'
                              : 'unassigned'
                          : visited.has(v)
                            ? `order ${network.order.indexOf(v) + 1}`
                            : `in = ${network.degrees?.[v]}`
                        : route
                          ? `${atlas ? `from ${study?.from}: ` : 'd = '}${courier && study?.affected?.includes(v) ? '−∞' : atlas && study?.phase === 'summary' ? step?.state?.table?.[study.from ?? 0]?.[v] : distance === null ? '∞' : distance}`
                          : joining
                            ? `group ${components.indexOf(component!) + 1}`
                            : visited.has(v)
                              ? 'connected'
                              : 'unconnected',
                      'studios',
                    )}
                  </text>
                  {tx(
                    route && visited.has(v) && (
                      <text className="weighted-settled" x={node.x + 28} y={node.y - 12}>
                        ✓
                      </text>
                    ),
                    'studios',
                  )}
                </g>
              )
            }),
            'studios',
          )}
        </svg>
      </div>
      <div className="weighted-decision" role="status">
        <strong>
          {tx(
            study?.negativeCycle
              ? 'No finite shortest route for affected entries'
              : complete
                ? 'Completed'
                : study
                  ? study.improved
                    ? 'Shortcut approved'
                    : 'Inspecting the next route'
                  : decision,
            'studios',
          )}
        </strong>
        <span>
          {tx(
            network
              ? complete
                ? network.blocked?.length
                  ? 'A directed cycle prevents a full ordering. Blocked vertices remain visible.'
                  : scc
                    ? `${components.length} strongly connected groups found. Original arrows restored.`
                    : 'Dispatch complete. The order below respects every directed dependency.'
                : step?.description
              : study
                ? complete
                  ? study.negativeCycle
                    ? 'Negative-cycle effects are marked below; affected routes have no finite shortest distance.'
                    : atlas
                      ? 'Every origin–destination pair has been checked. Read the final shortest distances in the atlas below.'
                      : 'Route patrol complete. Final source distances are shown beside each node; no reachable negative cycle was found.'
                  : step?.description
                : complete
                  ? route
                    ? `Shortest distances confirmed for ${visited.size} reachable nodes${visited.size < graph.vertices ? ` · ${graph.vertices - visited.size} unreachable` : ''}.`
                    : `${accepted.size === graph.vertices - 1 ? 'Minimum spanning tree' : 'Minimum spanning forest'} · total weight ${state.cost}`
                  : step?.description,
            'studios',
          )}
        </span>
      </div>
      {tx(
        network ? (
          <NetworkStudyBoard step={step!} scc={scc} still={!!still} />
        ) : study ? (
          <RouteStudyBoard step={step!} atlas={atlas} />
        ) : (
          <div
            className="explorer-dock"
            aria-label={tx(route ? 'Distance priority board' : joining ? 'Sorted edge conveyor' : 'Crossing edge board', 'studios')}
          >
            <div className="explorer-dock-title">
              <strong>{tx(route ? 'Distance priority board' : joining ? 'Sorted edge conveyor' : 'Crossing edge board', 'studios')}</strong>
              <span>{tx(route ? 'LOWEST DISTANCE FIRST' : joining ? 'LIGHTEST BRIDGE FIRST' : 'LIGHTEST CROSSING FIRST', 'studios')}</span>
            </div>
            <div className="weighted-board">
              {tx(
                route
                  ? (state.frontier ?? []).map((v) => (
                      <motion.div layout={!still} key={v} className="explorer-ticket weighted-distance-ticket">
                        <span>🐧 {tx(v, 'studios')}</span>
                        <strong>{tx(state.distances![v], 'studios')}</strong>
                      </motion.div>
                    ))
                  : (joining ? sortedEdges : crossing).map((e) => (
                      <motion.div
                        layout={!still}
                        key={e.index}
                        className={`weighted-edge-ticket ${accepted.has(e.index) ? 'built' : ''} ${rejected.has(e.index) ? 'reject' : ''} ${e.index === state.edge ? state.action : ''}`}
                        data-edge={e.index}
                      >
                        <strong>
                          {tx(e.from, 'studios')} — {tx(e.to, 'studios')}
                        </strong>
                        <span>
                          {tx('weight ', 'studios')}
                          {tx(e.weight, 'studios')}
                        </span>
                        <small>{tx(accepted.has(e.index) ? '✓ built' : rejected.has(e.index) ? '× cycle' : 'candidate', 'studios')}</small>
                      </motion.div>
                    )),
                'studios',
              )}
              {tx(
                (route ? !state.frontier?.length : !joining && !crossing.length) && (
                  <span className="explorer-dock-empty">{tx(complete ? 'No pending work' : 'No crossing edges available', 'studios')}</span>
                ),
                'studios',
              )}
            </div>
          </div>
        ),
        'studios',
      )}
      {tx(
        (joining || scc) && (
          <div className="weighted-groups" aria-label={tx('Island groups', 'studios')}>
            {tx(
              components.map((root, i) => (
                <span key={root} style={{ borderColor: groupColors[i % groupColors.length] }}>
                  {tx('Group ', 'studios')}
                  {tx(i + 1, 'studios')}: {tx(state.components!.flatMap((r, v) => (r === root ? [v] : [])).join(', '), 'studios')}
                </span>
              )),
              'studios',
            )}
          </div>
        ),
        'studios',
      )}
      <p className="explorer-note">
        {tx(
          network
            ? scc
              ? 'Each colored island group is mutually reachable. The transpose pass reverses arrows only in Icons view; the original Graph view stays available.'
              : 'Only nodes with zero remaining incoming edges enter the ready queue. Weights are displayed but do not affect dependency order.'
            : study
              ? atlas
                ? 'Dashed shortcut guides show the candidate via the hub, not additional graph edges. ∞ means unreachable; −∞ marks a pair affected by a negative cycle.'
                : 'The courier checks every arc each pass. Distances stay tentative until the passes and negative-cycle check finish. −∞ marks affected vertices.'
              : route
                ? 'Flags confirm settled distances. Glowing routes improve a tentative distance; ∞ means no route is known yet.'
                : joining
                  ? 'Bridges arrive in weight order. Join different groups; reject a bridge when both ends already belong to the same group.'
                  : 'Grow one connected island network using its cheapest outgoing bridge. Disconnected islands start a new tree.',
          'studios',
        )}
        {tx(' ', 'studios')}
        {tx('Node labels and edge weights stay visible. Scroll the map on smaller screens.', 'studios')}
      </p>
    </section>
  )
}
