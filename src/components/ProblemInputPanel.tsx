import { useState, type ReactNode } from 'react'
import { Copy, Play, RotateCcw, Settings2 } from 'lucide-react'
import { MobileDisclosure } from './MobileDisclosure'
import { ProblemInputFields } from './ProblemInputFields'

export function ProblemInputPanel({
  draft,
  onChange,
  onRun,
  onReset,
  error,
  changed,
  children,
}: {
  draft?: string
  onChange?: (draft: string) => void
  onRun: () => void
  onReset: () => void
  error?: string
  changed?: boolean
  children?: ReactNode
}) {
  const [fieldError, setFieldError] = useState(''),
    [message, setMessage] = useState('')
  return (
    <MobileDisclosure className="problem-input-panel tuv-problem-input" title="Problem Input" defaultOpen>
      <h2>
        Problem Input <Settings2 size={18} />
      </h2>
      <p className="problem-input-hint">
        {draft !== undefined ? 'Edit the fields below, then choose Run algorithm.' : 'Adjust the example size, then animate the concept.'}
      </p>
      {draft !== undefined && onChange ? (
        <>
          <ProblemInputFields draft={draft} onChange={onChange} onValidityChange={setFieldError} />
          <details className="problem-advanced">
            <summary>Advanced JSON input</summary>
            <textarea
              aria-label="Algorithm input JSON"
              value={draft}
              onChange={(e) => {
                setFieldError('')
                onChange(e.target.value)
              }}
              rows={8}
            />
          </details>
        </>
      ) : (
        children
      )}
      <div className="problem-input-actions">
        <button className="problem-run" type="button" disabled={!!fieldError} onClick={onRun}>
          <Play size={17} />
          {draft !== undefined ? 'Run algorithm' : 'Animate concept'}
        </button>
        <button
          type="button"
          onClick={() => {
            setFieldError('')
            setMessage('')
            onReset()
          }}
        >
          <RotateCcw size={15} />
          Reset input
        </button>
        {draft !== undefined && (
          <button
            type="button"
            onClick={() =>
              navigator.clipboard
                .writeText(draft)
                .then(() => setMessage('Input copied.'))
                .catch(() => setMessage('Clipboard unavailable; select and copy the fields.'))
            }
          >
            <Copy size={15} />
            Copy input
          </button>
        )}
      </div>
      {changed && !error && (
        <p className="problem-input-status" role="status">
          Inputs edited. Run algorithm to update the visualization.
        </p>
      )}
      {(fieldError || error) && (
        <p className="problem-field-error" role="alert">
          {fieldError || error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
    </MobileDisclosure>
  )
}
