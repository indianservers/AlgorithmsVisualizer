// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
import type { Dispatch, SetStateAction } from 'react'
import { FlaskConical } from 'lucide-react'
import type { AlgorithmStep, SavedExperiment } from '../types'
import { SavedExperimentsSkeleton } from './Skeleton'

type BottomPanelProps = {
  activeModuleId: string
  copyText: (label: string, value: string) => void
  downloadText: (filename: string, value: string, type?: string) => void
  finalMetrics: AlgorithmStep['metrics']
  loadingSaved: boolean
  onLoadSaved: (item: SavedExperiment) => void
  openDashboard: () => void
  openDataGrid: () => void
  openStatistics: () => void
  openVisualizer: () => void
  saved: SavedExperiment[]
  setStepIndex: Dispatch<SetStateAction<number>>
  stepIndex: number
  stepLogCsv: () => string
  steps: AlgorithmStep[]
}

const metricLabel = (value: string) => value.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()

export function BottomPanel({
  activeModuleId,
  copyText,
  downloadText,
  finalMetrics,
  loadingSaved,
  onLoadSaved,
  openDashboard,
  openDataGrid,
  openStatistics,
  openVisualizer,
  saved,
  setStepIndex,
  stepIndex,
  stepLogCsv,
  steps,
}: BottomPanelProps) {
  useLocaleRender()

  return (
    <footer className="bottom-panel">
      <section className="metrics-panel">
        <h2>
          <FlaskConical size={18} />
          {tx(' Experiment Metrics', 'common')}
        </h2>
        <div className="metric-row">
          {tx(
            Object.entries(finalMetrics).map(([key, value]) => (
              <span key={key}>
                <strong>{tx(value ?? 0, 'common')}</strong>
                {tx(metricLabel(key), 'common')}
              </span>
            )),
            'common',
          )}
          <span>
            <strong>{tx(steps.length, 'common')}</strong>
            {tx(' steps', 'common')}
          </span>
        </div>
      </section>
      <section>
        <h2>{tx('Step Log', 'common')}</h2>
        <div className="utility-row">
          <button
            type="button"
            onClick={() => copyText('Step log', steps.map((step, index) => `${index + 1}. ${step.type}: ${step.description}`).join('\n'))}
            disabled={!steps.length}
          >
            {tx('Copy step log', 'common')}
          </button>
          <button type="button" onClick={() => downloadText(`${activeModuleId}-steps.csv`, stepLogCsv(), 'text/csv')} disabled={!steps.length}>
            {tx('Download CSV', 'common')}
          </button>
        </div>
        <div className="log-list">
          {tx(
            steps.length ? (
              steps.map((step, index) => (
                <button className={index === stepIndex ? 'active' : ''} key={step.id} onClick={() => setStepIndex(index)} type="button">
                  <span>{tx(index + 1, 'common')}</span>
                  <strong>{tx(step.type, 'common')}</strong>
                  {tx(step.description, 'common')}
                </button>
              ))
            ) : (
              <p>{tx('No step log yet. Press Run to generate timeline events.', 'common')}</p>
            ),
            'common',
          )}
        </div>
      </section>
      <section>
        <h2>{tx('Saved Locally', 'common')}</h2>
        {tx(
          loadingSaved ? (
            <SavedExperimentsSkeleton />
          ) : (
            <div className="saved-list">
              {tx(
                saved.length ? (
                  <>
                    <div className="saved-next-steps" aria-label={tx('Quick next steps', 'common')}>
                      <button type="button" onClick={openVisualizer}>
                        {tx('Visualize', 'common')}
                      </button>
                      <button type="button" onClick={openDashboard}>
                        {tx('Dashboard', 'common')}
                      </button>
                      <button type="button" onClick={openStatistics}>
                        {tx('Statistics', 'common')}
                      </button>
                      <button type="button" onClick={openDataGrid}>
                        {tx('Data Grid', 'common')}
                      </button>
                    </div>
                    {tx(
                      saved.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            onLoadSaved(item)
                          }}
                          type="button"
                        >
                          <strong>{tx(item.algorithmName, 'common')}</strong>
                          <span>
                            {tx(item.stepCount, 'common')}
                            {tx(' steps. Tap to load and visualize.', 'common')}
                          </span>
                        </button>
                      )),
                      'common',
                    )}
                  </>
                ) : (
                  <div className="empty-state saved-empty-state">
                    <strong>{tx('No saved experiments yet.', 'common')}</strong>
                    <span>{tx('Run an algorithm, then tap Save to keep it here for quick mobile access.', 'common')}</span>
                    <button type="button" onClick={openVisualizer}>
                      {tx('Go to visualizer', 'common')}
                    </button>
                  </div>
                ),
                'common',
              )}
            </div>
          ),
          'common',
        )}
      </section>
    </footer>
  )
}
