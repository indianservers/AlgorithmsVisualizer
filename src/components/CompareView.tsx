// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
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
  useLocaleRender()

  return (
    <section className="compare-page">
      <div className="compare-header">
        <div>
          <span className="eyebrow">{tx('Algorithm Comparison', 'common')}</span>
          <h1>
            {tx('Compare ', 'common')}
            {tx(compareCategory, 'common')}
            {tx(' Algorithms', 'common')}
          </h1>
          <p>{tx('Run multiple algorithms on the same local input and compare steps, comparisons, swaps, reads, writes, and final output.', 'common')}</p>
        </div>
        <div className="compare-tabs">
          {tx(
            (['Sorting', 'Searching'] as const).map((category) => (
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
                {tx(category, 'common')}
              </button>
            )),
            'common',
          )}
        </div>
      </div>
      <div className="compare-layout">
        <section className="compare-inputs">
          <h2>{tx('Shared Input', 'common')}</h2>
          <label>
            {tx('Data', 'common')}
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
            {tx('Target', 'common')}
            <input type="number" value={target} onChange={(event) => setTarget(Number(event.target.value))} />
          </label>
          <div className="preset-row">
            {tx(
              ['random', 'sorted', 'reverse', 'duplicates', 'nearly', 'single', 'all-equal'].map((mode) => (
                <button type="button" key={mode} className={dataMode === mode ? 'active' : ''} onClick={() => updateRandom(mode)}>
                  <Shuffle size={14} />
                  {tx(mode, 'common')}
                </button>
              )),
              'common',
            )}
          </div>
          <h2>{tx('Algorithms', 'common')}</h2>
          <span className="selection-summary">
            {tx(comparedIds.length, 'common')}
            {tx(' selected', 'common')}
          </span>
          <div className="compare-checks">
            {tx(
              comparableModules.map((module) => (
                <button
                  className={comparedIds.includes(module.id) ? 'active' : ''}
                  key={module.id}
                  onClick={() => toggleComparedAlgorithm(module.id)}
                  type="button"
                >
                  <span>{tx(comparedIds.includes(module.id) ? 'On' : 'Off', 'common')}</span>
                  {tx(module.name, 'common')}
                </button>
              )),
              'common',
            )}
          </div>
        </section>
        <section className="compare-results">
          <div className="compare-notes">
            <strong>{tx('Complexity note', 'common')}</strong>
            <span>
              {tx(
                "Lower step count on this input does not always mean lower asymptotic complexity. Compare the live metrics with each algorithm's average-case class.",
                'common',
              )}
            </span>
            <button type="button" onClick={() => downloadText(`${compareCategory.toLowerCase()}-comparison.csv`, comparisonCsv(), 'text/csv')}>
              {tx('Download comparison CSV', 'common')}
            </button>
          </div>
          <div className="comparison-table">
            <div className="comparison-row head">
              <span>{tx('Algorithm', 'common')}</span>
              <span>{tx('Steps', 'common')}</span>
              <span>{tx('Comparisons', 'common')}</span>
              <span>{tx('Swaps', 'common')}</span>
              <span>{tx('Reads', 'common')}</span>
              <span>{tx('Writes', 'common')}</span>
            </div>
            {tx(
              comparisonRows.map((row) => (
                <div className="comparison-row" key={row.module.id}>
                  <strong>{tx(row.module.name, 'common')}</strong>
                  <span>{tx(row.steps, 'common')}</span>
                  <span>{tx(row.comparisons, 'common')}</span>
                  <span>{tx(row.swaps, 'common')}</span>
                  <span>{tx(row.reads, 'common')}</span>
                  <span>{tx(row.writes, 'common')}</span>
                </div>
              )),
              'common',
            )}
          </div>
          <div className="comparison-bars">
            {tx(
              comparisonRows.map((row) => (
                <article key={row.module.id}>
                  <div>
                    <strong>{tx(row.module.name, 'common')}</strong>
                    <span>
                      {tx(row.steps === Math.min(...comparisonRows.map((item) => item.steps)) ? 'Best on this input' : row.module.complexity.average, 'common')}
                    </span>
                  </div>
                  <label>{tx('Steps', 'common')}</label>
                  <span className="bar-track">
                    <i style={{ width: `${(row.steps / maxComparisonSteps) * 100}%` }} />
                  </span>
                  <label>{tx('Comparisons', 'common')}</label>
                  <span className="bar-track compare">
                    <i style={{ width: `${(row.comparisons / maxComparisonComparisons) * 100}%` }} />
                  </span>
                  <div className="tiny-sparkline">
                    {tx(
                      Array.from({ length: 12 }, (_, index) => (
                        <span key={index} style={{ height: `${Math.max(8, (((row.steps / maxComparisonSteps) * (index + 1)) / 12) * 100)}%` }} />
                      )),
                      'common',
                    )}
                  </div>
                  <small>
                    {tx('Output preview: ', 'common')}
                    {tx(row.output.slice(0, 10).join(', '), 'common')}
                  </small>
                </article>
              )),
              'common',
            )}
          </div>
        </section>
      </div>
    </section>
  )
}
