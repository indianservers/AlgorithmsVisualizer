import { type Cell, type LearningState, type Trace } from './types'
export type Coordinate = [number, number]
export const cellKey = ([r, c]: Coordinate) => `${r}:${c}`
export const displayValue = (value: number): Cell => (Number.isFinite(value) ? value : '∞')
export class DPTrace {
  trace: Trace
  table: Cell[][]
  rows: string[]
  columns: string[]
  filled = new Set<string>()
  stack?: number[]
  path?: Coordinate[]
  constructor(trace: Trace, table: Cell[][], rows: string[], columns: string[]) {
    this.trace = trace
    this.table = table
    this.rows = rows
    this.columns = columns
  }
  mark(...cells: Coordinate[]) {
    cells.forEach((cell) => this.filled.add(cellKey(cell)))
  }
  emit(
    message: string,
    phase: NonNullable<LearningState['dp']>['phase'],
    focus?: Coordinate,
    dependencies: NonNullable<LearningState['dp']>['dependencies'] = [],
    candidates: NonNullable<LearningState['dp']>['candidates'] = [],
    expression = message,
    extra: LearningState = {},
  ) {
    this.trace.add(
      message,
      {
        table: this.table,
        rowLabels: this.rows,
        columnLabels: this.columns,
        ...extra,
        dp: {
          phase,
          focus,
          dependencies,
          candidates,
          expression,
          filled: [...this.filled],
          stack: this.stack ? [...this.stack] : undefined,
          path: this.path ? [...this.path] : undefined,
          ...extra.dp,
        },
      },
      phase === 'base' || phase === 'call' || phase === 'reuse' ? 0 : phase === 'traceback' ? 2 : 1,
    )
  }
}
