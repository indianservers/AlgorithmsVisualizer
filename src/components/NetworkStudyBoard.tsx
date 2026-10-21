// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
import { motion, AnimatePresence } from 'framer-motion'
import type { AlgorithmStep } from '../types'

export function NetworkStudyBoard({ step, scc, still }: { step: AlgorithmStep; scc: boolean; still: boolean }) {
  useLocaleRender()

  const state = step.state!.networkStudy!,
    graph = step.state!.graph!
  const cards = scc ? [...(state.finishOrder ?? [])].reverse() : state.frontier
  const assigned = new Set(state.groups?.flat() ?? [])
  return (
    <div className="network-study-board">
      {tx(
        scc && (
          <div className="network-pass-banner" role="status">
            <span className={state.reversed || state.phase === 'summary' ? '' : 'active'}>{tx('1 · Explore and finish', 'common')}</span>
            <span aria-hidden="true">→</span>
            <span className={state.reversed || state.phase === 'summary' ? 'active' : ''}>{tx('2 · Reverse and reunite', 'common')}</span>
          </div>
        ),
        'common',
      )}
      <div className="explorer-dock" aria-label={tx(scc ? 'SCC finish stack' : 'Topological ready queue', 'common')}>
        <div className="explorer-dock-title">
          <strong>{tx(scc ? 'Finish-card lighthouse' : 'Ready-to-dispatch dock', 'common')}</strong>
          <span>{tx(scc ? 'LAST FINISHED → FIRST EXPLORED' : 'ZERO INCOMING DEPENDENCIES · FIFO', 'common')}</span>
        </div>
        <div className="weighted-board">
          <AnimatePresence initial={false}>
            {tx(
              cards.map((v, i) => (
                <motion.div
                  layout={!still}
                  initial={still ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: still ? 0 : -12 }}
                  transition={{ duration: still ? 0 : 0.3 }}
                  key={v}
                  className={`network-card ${scc && assigned.has(v) ? 'assigned' : ''}`}
                >
                  <span aria-hidden="true">🐧</span>
                  <strong>{tx(v, 'common')}</strong>
                  <small>{tx(scc ? (assigned.has(v) ? 'group found' : i === 0 ? 'top' : 'finish card') : i === 0 ? 'next' : 'ready', 'common')}</small>
                </motion.div>
              )),
              'common',
            )}
          </AnimatePresence>
          {tx(
            !cards.length && (
              <span className="explorer-dock-empty">
                {tx(
                  scc ? 'Finish cards appear as exploration returns.' : state.blocked?.length ? 'No ready nodes · cycle blocks progress' : 'No nodes waiting',
                  'common',
                )}
              </span>
            ),
            'common',
          )}
        </div>
      </div>
      {tx(
        !scc && (
          <>
            <div className="network-output" aria-label={tx('Topological output', 'common')}>
              <strong>{tx('Dispatch order', 'common')}</strong>
              <div>
                <AnimatePresence initial={false}>
                  {tx(
                    state.order.map((v, i) => (
                      <motion.span
                        key={v}
                        initial={still ? false : { opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: still ? 0 : 0.35 }}
                      >
                        <small>{tx(i + 1, 'common')}</small>
                        {tx(v, 'common')}
                      </motion.span>
                    )),
                    'common',
                  )}
                </AnimatePresence>
                {tx(!state.order.length && <em>{tx('Waiting for the first dispatch', 'common')}</em>, 'common')}
              </div>
            </div>
            <div className="network-degrees" aria-label={tx('Remaining incoming degrees', 'common')}>
              {tx(
                state.degrees?.map((d, v) => (
                  <span key={v} className={d === 0 ? 'ready' : ''}>
                    {tx('Node ', 'common')}
                    {tx(v, 'common')} · {tx(d, 'common')}
                    {tx(' incoming', 'common')}
                  </span>
                )),
                'common',
              )}
            </div>
          </>
        ),
        'common',
      )}
      {tx(
        !!state.blocked?.length && (
          <p className="network-cycle-warning" role="status">
            {tx('A directed cycle blocks a complete topological order. Remaining vertices: ', 'common')}
            {tx(state.blocked.join(', '), 'common')}
            {tx('. This includes vertices downstream of a cycle.', 'common')}
          </p>
        ),
        'common',
      )}
      {tx(
        scc && (
          <p className="explorer-note">
            {tx(
              state.phase === 'summary'
                ? `${state.groups?.length} groups cover all ${graph.vertices} nodes. Each group is strongly connected; an arrow between groups does not merge them.`
                : state.reversed
                  ? 'Follow the reversed arrows from the next unassigned finish card. Every reached node joins the same group.'
                  : 'The penguin adds a finish card only after all reachable outgoing branches have been explored.',
              'common',
            )}
          </p>
        ),
        'common',
      )}
    </div>
  )
}
