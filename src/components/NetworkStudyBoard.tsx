import { motion, AnimatePresence } from 'framer-motion'
import type { AlgorithmStep } from '../types'

export function NetworkStudyBoard({ step, scc, still }: { step: AlgorithmStep; scc: boolean; still: boolean }) {
  const state = step.state!.networkStudy!,
    graph = step.state!.graph!
  const cards = scc ? [...(state.finishOrder ?? [])].reverse() : state.frontier
  const assigned = new Set(state.groups?.flat() ?? [])
  return (
    <div className="network-study-board">
      {scc && (
        <div className="network-pass-banner" role="status">
          <span className={state.reversed || state.phase === 'summary' ? '' : 'active'}>1 · Explore and finish</span>
          <span aria-hidden="true">→</span>
          <span className={state.reversed || state.phase === 'summary' ? 'active' : ''}>2 · Reverse and reunite</span>
        </div>
      )}
      <div className="explorer-dock" aria-label={scc ? 'SCC finish stack' : 'Topological ready queue'}>
        <div className="explorer-dock-title">
          <strong>{scc ? 'Finish-card lighthouse' : 'Ready-to-dispatch dock'}</strong>
          <span>{scc ? 'LAST FINISHED → FIRST EXPLORED' : 'ZERO INCOMING DEPENDENCIES · FIFO'}</span>
        </div>
        <div className="weighted-board">
          <AnimatePresence initial={false}>
            {cards.map((v, i) => (
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
                <strong>{v}</strong>
                <small>{scc ? (assigned.has(v) ? 'group found' : i === 0 ? 'top' : 'finish card') : i === 0 ? 'next' : 'ready'}</small>
              </motion.div>
            ))}
          </AnimatePresence>
          {!cards.length && (
            <span className="explorer-dock-empty">
              {scc ? 'Finish cards appear as exploration returns.' : state.blocked?.length ? 'No ready nodes · cycle blocks progress' : 'No nodes waiting'}
            </span>
          )}
        </div>
      </div>
      {!scc && (
        <>
          <div className="network-output" aria-label="Topological output">
            <strong>Dispatch order</strong>
            <div>
              <AnimatePresence initial={false}>
                {state.order.map((v, i) => (
                  <motion.span
                    key={v}
                    initial={still ? false : { opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: still ? 0 : 0.35 }}
                  >
                    <small>{i + 1}</small>
                    {v}
                  </motion.span>
                ))}
              </AnimatePresence>
              {!state.order.length && <em>Waiting for the first dispatch</em>}
            </div>
          </div>
          <div className="network-degrees" aria-label="Remaining incoming degrees">
            {state.degrees?.map((d, v) => (
              <span key={v} className={d === 0 ? 'ready' : ''}>
                Node {v} · {d} incoming
              </span>
            ))}
          </div>
        </>
      )}
      {!!state.blocked?.length && (
        <p className="network-cycle-warning" role="status">
          A directed cycle blocks a complete topological order. Remaining vertices: {state.blocked.join(', ')}. This includes vertices downstream of a cycle.
        </p>
      )}
      {scc && (
        <p className="explorer-note">
          {state.phase === 'summary'
            ? `${state.groups?.length} groups cover all ${graph.vertices} nodes. Each group is strongly connected; an arrow between groups does not merge them.`
            : state.reversed
              ? 'Follow the reversed arrows from the next unassigned finish card. Every reached node joins the same group.'
              : 'The penguin adds a finish card only after all reachable outgoing branches have been explored.'}
        </p>
      )}
    </div>
  )
}
