import { Trace, type LearningState } from './types'

type Meta = NonNullable<LearningState['backtrack']>
export class BacktrackingTrace {
  nodes: Meta['nodes'] = [{ id: 0, depth: 0, label: 'Root', status: 'ready' }]
  rejected = 0
  undos = 0
  solutions = 0
  private trace: Trace
  constructor(trace: Trace) {
    this.trace = trace
  }
  branch(parent: number, label: string, depth: number, status: string) {
    const id = this.nodes.length
    this.nodes.push({ id, parent, label, depth, status })
    return id
  }
  emit(phase: Meta['phase'], reason: string, path: number[], depth: number, current = 0, state: LearningState = {}, extra: Partial<Meta> = {}) {
    if (phase === 'reject') this.rejected++
    if (phase === 'undo') this.undos++
    if (phase === 'solution') this.solutions++
    if (this.nodes[current]) this.nodes[current].status = phase
    // Keep recent branches plus their ancestor chain, so the focused branch stays connected.
    const ids = new Set(this.nodes.slice(-48).map((n) => n.id))
    let ancestor: number | undefined = current
    while (ancestor !== undefined) {
      ids.add(ancestor)
      ancestor = this.nodes[ancestor].parent
    }
    ids.add(0)
    const nodes = [...ids].sort((a, b) => a - b).map((id) => this.nodes[id])
    this.trace.add(
      reason,
      {
        ...state,
        backtrack: {
          phase,
          reason,
          path,
          depth,
          current,
          nodes,
          totalNodes: this.nodes.length,
          rejected: this.rejected,
          undos: this.undos,
          solutions: this.solutions,
          conflicts: [],
          ...extra,
        },
      },
      phase === 'undo' ? 3 : phase === 'solution' ? 2 : phase === 'ready' ? 0 : 1,
      phase === 'complete' ? 'complete' : phase === 'reject' ? 'compare' : 'update',
    )
  }
}
