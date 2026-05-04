import { Shuffle } from 'lucide-react'
import type { AlgorithmModule } from '../types'
import { algorithmModules } from '../algorithms'

type ComparisonRow = {
  module: AlgorithmModule
  steps: number
  comparisons: number
  swaps: number
  reads: number
  writes: number
  recursiveCalls: number
  output: number[]
}

type CompareViewProps = {
  comparableModules: AlgorithmModule[]
  comparedIds: string[]
  compareCategory: 'Sorting' | 'Searching'
  comparisonCsv: () => string
  comparisonRows: ComparisonRow[]
  dataMode: string
  downloadText: (filename: string, value: string, type?: string) => void
  inputText: string
  maxComparisonComparisons: number
  maxComparisonSteps: number
  resetPlayback: () => void
  setCompareCategory: (category: 'Sorting' | 'Searching') => void
  setComparedIds: (ids: string[]) => void
  setInputText: (value: string) => void
  setTarget: (target: number) => void
  target: number
  toggleComparedAlgorithm: (id: string) => void
  updateRandom: (mode?: string) => void
}

export function CompareView({
  comparableModules,
  comparedIds,
  compareCategory,
  comparisonCsv,
  comparisonRows,
  dataMode,
  downloadText,
  inputText,
  maxComparisonComparisons,
  maxComparisonSteps,
  resetPlayback,
  setCompareCategory,
  setComparedIds,
  setInputText,
  setTarget,
  target,
  toggleComparedAlgorithm,
  updateRandom,
}: CompareViewProps) {
  return (
    <section className="compare-page">
      <div className="compare-header">
        <div>
          <span className="eyebrow">Algorithm Comparison</span>
          <h1>Compare {compareCategory} Algorithms</h1>
          <p>Run multiple algorithms on the same local input and compare steps, comparisons, swaps, reads, writes, and final output.</p>
        </div>
        <div className="compare-tabs">
          {(['Sorting', 'Searching'] as const).map((category) => (
            <button
              className={compareCategory === category ? 'active' : ''}
              key={category}
              onClick={() => {
                setCompareCategory(category)
                setComparedIds(
                  algorithmModules
                    .filter((module) => module.category === category && module.runner)
                    .slice(0, 4)
                    .map((module) => module.id),
                )
              }}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      <div className="compare-layout">
        <section className="compare-inputs">
          <h2>Shared Input</h2>
          <label>
            Data
            <textarea
              value={inputText}
              onChange={(event) => {
                setInputText(event.target.value)
                resetPlayback()
              }}
              rows={5}
            />
          </label>
          <label>
            Target
            <input type="number" value={target} onChange={(event) => setTarget(Number(event.target.value))} />
          </label>
          <div className="preset-row">
            {['random', 'sorted', 'reverse', 'duplicates', 'nearly', 'single', 'all-equal'].map((mode) => (
              <button type="button" key={mode} className={dataMode === mode ? 'active' : ''} onClick={() => updateRandom(mode)}>
                <Shuffle size={14} />
                {mode}
              </button>
            ))}
          </div>
          <h2>Algorithms</h2>
          <span className="selection-summary">{comparedIds.length} selected</span>
          <div className="compare-checks">
            {comparableModules.map((module) => (
              <button
                className={comparedIds.includes(module.id) ? 'active' : ''}
                key={module.id}
                onClick={() => toggleComparedAlgorithm(module.id)}
                type="button"
              >
                <span>{comparedIds.includes(module.id) ? 'On' : 'Off'}</span>
                {module.name}
              </button>
            ))}
          </div>
        </section>
        <section className="compare-results">
          <div className="compare-notes">
            <strong>Complexity note</strong>
            <span>
              Lower step count on this input does not always mean lower asymptotic complexity. Compare the live metrics with each algorithm's average-case
              class.
            </span>
            <button type="button" onClick={() => downloadText(`${compareCategory.toLowerCase()}-comparison.csv`, comparisonCsv(), 'text/csv')}>
              Download comparison CSV
            </button>
          </div>
          <div className="comparison-table">
            <div className="comparison-row head">
              <span>Algorithm</span>
              <span>Steps</span>
              <span>Comparisons</span>
              <span>Swaps</span>
              <span>Reads</span>
              <span>Writes</span>
            </div>
            {comparisonRows.map((row) => (
              <div className="comparison-row" key={row.module.id}>
                <strong>{row.module.name}</strong>
                <span>{row.steps}</span>
                <span>{row.comparisons}</span>
                <span>{row.swaps}</span>
                <span>{row.reads}</span>
                <span>{row.writes}</span>
              </div>
            ))}
          </div>
          <div className="comparison-bars">
            {comparisonRows.map((row) => (
              <article key={row.module.id}>
                <div>
                  <strong>{row.module.name}</strong>
                  <span>{row.steps === Math.min(...comparisonRows.map((item) => item.steps)) ? 'Best on this input' : row.module.complexity.average}</span>
                </div>
                <label>Steps</label>
                <span className="bar-track">
                  <i style={{ width: `${(row.steps / maxComparisonSteps) * 100}%` }} />
                </span>
                <label>Comparisons</label>
                <span className="bar-track compare">
                  <i style={{ width: `${(row.comparisons / maxComparisonComparisons) * 100}%` }} />
                </span>
                <div className="tiny-sparkline">
                  {Array.from({ length: 12 }, (_, index) => (
                    <span key={index} style={{ height: `${Math.max(8, (((row.steps / maxComparisonSteps) * (index + 1)) / 12) * 100)}%` }} />
                  ))}
                </div>
                <small>Output preview: {row.output.slice(0, 10).join(', ')}</small>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}
