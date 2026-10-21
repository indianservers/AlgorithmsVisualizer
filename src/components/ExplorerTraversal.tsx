// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
import { useId } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import type { AlgorithmStep } from '../types'
import { Penguin } from './CharacterArt'
import './explorer.css'

type Props = { step?: AlgorithmStep; previous?: AlgorithmStep; mode: 'bfs' | 'dfs'; reducedMotion: boolean }

export function ExplorerTraversal({ step, previous, mode, reducedMotion }: Props) {
  useLocaleRender()

  const marker = useId().replace(/:/g, '')
  const systemReduced = useReducedMotion()
  const still = reducedMotion || systemReduced
  const graph = step?.state?.graph
  const traversal = step?.state?.traversal
  if (!graph || !traversal) return <p>{tx('Run the traversal to begin the expedition.', 'studios')}</p>
  const bfs = mode === 'bfs'
  const complete = step?.type === 'complete'
  const nodes = Array.from({ length: graph.vertices }, (_, id) => ({
    id,
    x: 320 + (graph.vertices === 1 ? 0 : 222 * Math.cos(-Math.PI / 2 + (id * 2 * Math.PI) / graph.vertices)),
    y: 245 + (graph.vertices === 1 ? 0 : 145 * Math.sin(-Math.PI / 2 + (id * 2 * Math.PI) / graph.vertices)),
  }))
  const current = nodes[traversal.current]
  const oldPath = previous?.state?.traversal?.path ?? []
  let shared = 0
  while (shared < oldPath.length && shared < traversal.path.length && oldPath[shared] === traversal.path[shared]) shared++
  const backtracking = !bfs && shared > 0 && shared < oldPath.length
  const route = backtracking
    ? [...oldPath.slice(shared - 1).reverse(), ...traversal.path.slice(shared)]
    : [previous?.state?.traversal?.current ?? traversal.current, traversal.current]
  const points = route.map((id) => nodes[id]).filter(Boolean)
  const pending = new Set(traversal.frontier)
  const visited = new Set(traversal.visited)
  const frontier = bfs ? traversal.frontier : [...traversal.frontier].reverse()
  return (
    <section
      className={`explorer-workbench ${mode}`}
      data-motion={still ? 'off' : 'on'}
      aria-label={tx(`${bfs ? 'BFS' : 'DFS'} explorer icons visualization`, 'studios')}
    >
      <header className="explorer-heading">
        <div>
          <span className="explorer-kicker">{tx('PENGUIN EXPEDITIONS', 'studios')}</span>
          <h3>{tx(bfs ? 'The sonar expedition' : 'The lantern trail', 'studios')}</h3>
        </div>
        <span className="explorer-current">
          {tx(complete ? 'Expedition complete' : backtracking ? `Backtrack → ${traversal.current}` : `Exploring node ${traversal.current}`, 'studios')}
        </span>
      </header>
      <div className="explorer-map-scroll">
        <svg
          className="explorer-map"
          viewBox="0 0 640 470"
          role="img"
          aria-label={tx(
            `${bfs ? 'BFS sonar' : 'DFS lantern'} graph with node labels, ${graph.directed ? 'directed arrows' : 'undirected bridges'}, and edge weights`,
            'studios',
          )}
        >
          <defs>
            <marker id={`${marker}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0L10 5L0 10Z" fill="context-stroke" />
            </marker>
            <radialGradient id={`${marker}-sea`}>
              <stop stopColor={bfs ? '#50b6c2' : '#b49a57'} stopOpacity=".13" />
              <stop offset="1" stopColor={bfs ? '#50b6c2' : '#b49a57'} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${marker}-light`}>
              <stop stopColor="#ffd47c" stopOpacity=".5" />
              <stop offset="1" stopColor="#ffd47c" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="640" height="470" rx="20" fill={`url(#${marker}-sea)`} />
          <g className="explorer-map-grid" aria-hidden="true">
            {tx(
              Array.from({ length: 10 }, (_, i) => <path key={i} d={`M0 ${i * 48}H640 M${i * 72} 0V470`} />),
              'studios',
            )}
          </g>
          <text className="explorer-compass" x="602" y="34">
            {tx('N ↑', 'studios')}
          </text>
          {tx(
            bfs ? (
              <g key={step?.id} className="explorer-sonar" transform={`translate(${current.x} ${current.y})`} aria-hidden="true">
                {tx(
                  [0, 1, 2].map((i) => <circle key={i} className={`sonar-ring ring-${i}`} r={32 + i * 24} />),
                  'studios',
                )}
              </g>
            ) : (
              <motion.circle
                className="explorer-lantern-glow"
                initial={false}
                animate={{ cx: current.x, cy: current.y - 15 }}
                transition={{ duration: still ? 0 : 0.45 }}
                r="86"
                fill={`url(#${marker}-light)`}
              />
            ),
            'studios',
          )}
          {tx(
            graph.edges.map((edge, i) => {
              const from = nodes[edge.from],
                to = nodes[edge.to]
              const dx = to.x - from.x,
                dy = to.y - from.y,
                length = Math.hypot(dx, dy) || 1
              const reciprocal = graph.directed && graph.edges.some((other) => other.from === edge.to && other.to === edge.from && other.from !== other.to)
              const offset = reciprocal ? 26 : 0
              const cx = (from.x + to.x) / 2 - (dy / length) * offset,
                cy = (from.y + to.y) / 2 + (dx / length) * offset
              const startX = from.x + (dx / length) * 27,
                startY = from.y + (dy / length) * 27
              const endX = to.x - (dx / length) * 30,
                endY = to.y - (dy / length) * 30
              const loop = edge.from === edge.to
              const d = loop
                ? `M${from.x - 18} ${from.y - 18} C${from.x - 70} ${from.y - 86},${from.x + 70} ${from.y - 86},${from.x + 18} ${from.y - 18}`
                : `M${startX} ${startY} Q${cx} ${cy} ${endX} ${endY}`
              const tree = traversal.parent[edge.to] === edge.from || (!graph.directed && traversal.parent[edge.from] === edge.to)
              const trail =
                !bfs &&
                traversal.path.some(
                  (v, j) =>
                    j > 0 &&
                    ((traversal.path[j - 1] === edge.from && v === edge.to) || (!graph.directed && traversal.path[j - 1] === edge.to && v === edge.from)),
                )
              return (
                <g key={`${edge.from}-${edge.to}-${i}`} className="explorer-edge" data-from={edge.from} data-to={edge.to}>
                  <path d={d} className={`explorer-bridge ${tree ? 'discovered' : ''}`} markerEnd={graph.directed ? `url(#${marker}-arrow)` : undefined} />
                  {tx(trail && <path d={d} className="explorer-breadcrumb-edge" />, 'studios')}
                </g>
              )
            }),
            'studios',
          )}
          {/* Weights sit above every bridge and trail so the animation cannot cover them. */}
          {tx(
            graph.edges.map((edge, i) => {
              const from = nodes[edge.from],
                to = nodes[edge.to],
                dx = to.x - from.x,
                dy = to.y - from.y,
                length = Math.hypot(dx, dy) || 1
              const reciprocal = graph.directed && graph.edges.some((other) => other.from === edge.to && other.to === edge.from && other.from !== other.to)
              const x = edge.from === edge.to ? from.x : (from.x + to.x) / 2 - (dy / length) * (reciprocal ? 13 : 0)
              const y = edge.from === edge.to ? from.y - 64 : (from.y + to.y) / 2 + (dx / length) * (reciprocal ? 13 : 0)
              return (
                <g className="explorer-weight" key={i} transform={`translate(${x} ${y})`}>
                  <rect x="-24" y="-11" width="48" height="22" rx="10" />
                  <text textAnchor="middle" y="4">
                    {tx(edge.weight, 'studios')}
                  </text>
                </g>
              )
            }),
            'studios',
          )}
          {tx(
            nodes.map((node) => {
              const active = node.id === traversal.current,
                seen = visited.has(node.id)
              return (
                <g
                  key={node.id}
                  className={`explorer-island ${active ? 'current' : seen ? 'visited' : pending.has(node.id) ? 'queued' : 'unseen'}`}
                  data-node={node.id}
                  data-state={active ? 'current' : seen ? 'visited' : pending.has(node.id) ? 'queued' : 'unseen'}
                >
                  <ellipse cx={node.x} cy={node.y + 10} rx="32" ry="25" className="island-shore" />
                  <circle cx={node.x} cy={node.y} r="24" className="island-center" />
                  <text x={node.x} y={node.y + 5} className="explorer-node-label" textAnchor="middle">
                    {tx(node.id, 'studios')}
                  </text>
                  <text x={node.x} y={node.y + 47} className="explorer-node-detail" textAnchor="middle">
                    {tx(
                      bfs
                        ? traversal.distance![node.id] < 0
                          ? 'undiscovered'
                          : `level ${traversal.distance![node.id]}`
                        : seen
                          ? `visit ${traversal.visited.indexOf(node.id) + 1}`
                          : pending.has(node.id)
                            ? 'on stack'
                            : 'undiscovered',
                      'studios',
                    )}
                  </text>
                  {tx(
                    seen && (
                      <g className="explorer-flag" transform={`translate(${node.x + 29} ${node.y - 8})`} aria-hidden="true">
                        <path d="M0 12V-12L15-7L0-2" />
                      </g>
                    ),
                    'studios',
                  )}
                </g>
              )
            }),
            'studios',
          )}
          <motion.g
            className="explorer-penguin-position"
            key={still ? 'still' : 'animated'}
            initial={false}
            animate={{ x: still ? current.x : points.map((p) => p.x), y: still ? current.y : points.map((p) => p.y) }}
            transition={{ duration: still ? 0 : backtracking ? 0.85 : 0.5, ease: 'easeInOut' }}
          >
            <g className="explorer-penguin" transform="translate(-17 -94)" aria-hidden="true">
              <Penguin height={68} status="still" />
              <path d="M6 16L10 5Q17 0 25 5L29 16Z M3 17Q17 11 32 17" fill="#bb9161" stroke="#684b36" strokeWidth="2" />
              {tx(
                !bfs && (
                  <g className="explorer-lantern" transform="translate(31 43)">
                    <path d="M-3 0V-5Q2-10 6-5V0" fill="none" stroke="#a87631" strokeWidth="2" />
                    <rect x="-5" y="0" width="13" height="16" rx="3" fill="#ffda78" stroke="#a87631" strokeWidth="2" />
                    <path d="M1 3V13" stroke="white" strokeWidth="2" />
                  </g>
                ),
                'studios',
              )}
            </g>
          </motion.g>
        </svg>
      </div>
      <div className="explorer-dock" aria-label={tx(bfs ? 'BFS queue dock' : 'DFS stack dock', 'studios')}>
        <div className="explorer-dock-title">
          <strong>{tx(bfs ? 'Queue dock' : 'Trail stack', 'studios')}</strong>
          <span>{tx(bfs ? 'FRONT → BACK' : 'TOP → BOTTOM', 'studios')}</span>
        </div>
        <div className="explorer-frontier">
          <AnimatePresence initial={false}>
            {tx(
              frontier.map((node, i) => (
                <motion.div
                  className="explorer-ticket"
                  key={`${node}-${frontier.slice(0, i).filter((v) => v === node).length}`}
                  layout={!still}
                  initial={still ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: still ? 0 : -12 }}
                  transition={{ duration: still ? 0 : 0.25 }}
                >
                  <span aria-hidden="true">🐧</span>
                  <strong>{tx(node, 'studios')}</strong>
                  {tx(i === 0 && <small>{tx('next', 'studios')}</small>, 'studios')}
                </motion.div>
              )),
              'studios',
            )}
          </AnimatePresence>
          {tx(
            !frontier.length && <span className="explorer-dock-empty">{tx(complete ? 'All reachable nodes explored' : 'Frontier empty', 'studios')}</span>,
            'studios',
          )}
        </div>
      </div>
      {tx(
        !bfs && (
          <div className="explorer-breadcrumbs" aria-label={tx('DFS breadcrumb path', 'studios')}>
            <strong>{tx('Breadcrumbs', 'studios')}</strong>
            <span>{tx(traversal.path.join(' → '), 'studios')}</span>
            {tx(backtracking && !complete && <em>{tx('Return along the trail, then explore the next branch.', 'studios')}</em>, 'studios')}
          </div>
        ),
        'studios',
      )}
      <div className="explorer-legend">
        <span>{tx('◉ Current', 'studios')}</span>
        <span>{tx('⚑ Visited', 'studios')}</span>
        <span>{tx('○ Undiscovered', 'studios')}</span>
        <span>{tx(bfs ? 'Sonar shows the current visit; levels count hops.' : 'Dotted bridges show the current path.', 'studios')}</span>
      </div>
      <p className="explorer-order">
        <strong>{tx('Visit order', 'studios')}</strong> {tx(traversal.visited.join(' → '), 'studios')}
        {tx(complete && traversal.visited.length < graph.vertices && ` · ${graph.vertices - traversal.visited.length} unreachable`, 'studios')}
      </p>
      <p className="explorer-note">
        {tx(
          bfs ? 'Edge weights stay visible; BFS uses hop distance, not weighted cost.' : 'The stack shows pending work; breadcrumbs show the current path.',
          'studios',
        )}
        {tx(' ', 'studios')}
        {tx('Scroll the map horizontally on smaller screens.', 'studios')}
      </p>
    </section>
  )
}
