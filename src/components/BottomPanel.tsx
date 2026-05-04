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
  saved,
  setStepIndex,
  stepIndex,
  stepLogCsv,
  steps,
}: BottomPanelProps) {
  return (
    <footer className="bottom-panel">
      <section>
        <h2>
          <FlaskConical size={18} /> Experiment Metrics
        </h2>
        <div className="metric-row">
          {Object.entries(finalMetrics).map(([key, value]) => (
            <span key={key}>
              <strong>{value ?? 0}</strong>
              {metricLabel(key)}
            </span>
          ))}
          <span>
            <strong>{steps.length}</strong> steps
          </span>
        </div>
      </section>
      <section>
        <h2>Step Log</h2>
        <div className="utility-row">
          <button
            type="button"
            onClick={() => copyText('Step log', steps.map((step, index) => `${index + 1}. ${step.type}: ${step.description}`).join('\n'))}
            disabled={!steps.length}
          >
            Copy step log
          </button>
          <button type="button" onClick={() => downloadText(`${activeModuleId}-steps.csv`, stepLogCsv(), 'text/csv')} disabled={!steps.length}>
            Download CSV
          </button>
        </div>
        <div className="log-list">
          {steps.length ? (
            steps.map((step, index) => (
              <button className={index === stepIndex ? 'active' : ''} key={step.id} onClick={() => setStepIndex(index)} type="button">
                <span>{index + 1}</span>
                <strong>{step.type}</strong>
                {step.description}
              </button>
            ))
          ) : (
            <p>No step log yet. Press Run to generate timeline events.</p>
          )}
        </div>
      </section>
      <section>
        <h2>Saved Locally</h2>
        {loadingSaved ? (
          <SavedExperimentsSkeleton />
        ) : (
          <div className="saved-list">
            {saved.length ? (
              saved.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onLoadSaved(item)
                  }}
                  type="button"
                >
                  <strong>{item.algorithmName}</strong>
                  <span>{item.stepCount} steps</span>
                </button>
              ))
            ) : (
              <p>No saved experiments yet.</p>
            )}
          </div>
        )}
      </section>
    </footer>
  )
}
