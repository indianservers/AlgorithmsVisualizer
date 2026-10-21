// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
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
  useLocaleRender()

  const [fieldError, setFieldError] = useState(''),
    [message, setMessage] = useState('')
  return (
    <MobileDisclosure className="problem-input-panel tuv-problem-input" title={tx('Problem Input', 'common')} defaultOpen>
      <h2>
        {tx('Problem Input ', 'common')}
        <Settings2 size={18} />
      </h2>
      <p className="problem-input-hint">
        {tx(draft !== undefined ? 'Edit the fields below, then choose Run algorithm.' : 'Adjust the example size, then animate the concept.', 'common')}
      </p>
      {tx(
        draft !== undefined && onChange ? (
          <>
            <ProblemInputFields draft={draft} onChange={onChange} onValidityChange={setFieldError} />
            <details className="problem-advanced">
              <summary>{tx('Advanced JSON input', 'common')}</summary>
              <textarea
                aria-label={tx('Algorithm input JSON', 'common')}
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
        ),
        'common',
      )}
      <div className="problem-input-actions">
        <button className="problem-run" type="button" disabled={!!fieldError} onClick={onRun}>
          <Play size={17} />
          {tx(draft !== undefined ? 'Run algorithm' : 'Animate concept', 'common')}
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
          {tx('Reset input', 'common')}
        </button>
        {tx(
          draft !== undefined && (
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
              {tx('Copy input', 'common')}
            </button>
          ),
          'common',
        )}
      </div>
      {tx(
        changed && !error && (
          <p className="problem-input-status" role="status">
            {tx('Inputs edited. Run algorithm to update the visualization.', 'common')}
          </p>
        ),
        'common',
      )}
      {tx(
        (fieldError || error) && (
          <p className="problem-field-error" role="alert">
            {tx(fieldError || error, 'common')}
          </p>
        ),
        'common',
      )}
      {tx(message && <p role="status">{tx(message, 'common')}</p>, 'common')}
    </MobileDisclosure>
  )
}
