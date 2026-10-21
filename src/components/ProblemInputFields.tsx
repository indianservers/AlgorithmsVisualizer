// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
import { useEffect, useState } from 'react'

import { parseProblemField } from './problemInputParsing'

function readObject(draft: string): Record<string, unknown> | undefined {
  try {
    const value = JSON.parse(draft)
    return value && typeof value === 'object' && !Array.isArray(value) ? value : undefined
  } catch {
    return undefined
  }
}

function toText(value: unknown): string {
  if (Array.isArray(value)) {
    if (value.some((v) => v !== null && typeof v === 'object' && !Array.isArray(v))) return JSON.stringify(value, null, 2)
    return Array.isArray(value[0]) ? value.map((row) => row.join(', ')).join('\n') : value.join(', ')
  }
  return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
}

const labels: Record<string, string> = {
  values: 'Dataset',
  a: 'Matrix A',
  b: 'Matrix B',
  k: 'Selection rank (k)',
  n: 'Problem size (n)',
  text: 'Text',
  pattern: 'Pattern',
  points: 'Points (x, y)',
  dimensions: 'Matrix dimensions',
  weights: 'Weights',
  profits: 'Profits',
  capacity: 'Capacity',
  amount: 'Amount',
  edges: 'Graph edges',
  vertices: 'Number of vertices',
  source: 'Source vertex',
  target: 'Target',
  intervals: 'Intervals (start, end)',
  frequencies: 'Frequencies',
  deadlines: 'Deadlines',
  range: 'Range',
  unsuccessful: 'Unsuccessful search frequencies',
  x: 'First sequence',
  y: 'Second sequence',
}

/** Text stays editable while invalid; a run is blocked until every field is valid. */
export function ProblemInputFields({
  draft,
  onChange,
  onValidityChange,
}: {
  draft: string
  onChange: (draft: string) => void
  onValidityChange?: (error: string) => void
}) {
  useLocaleRender()

  const object = readObject(draft)
  const [synced, setSynced] = useState(draft)
  const [examples, setExamples] = useState(object ?? {})
  const [fields, setFields] = useState(() => Object.fromEntries(Object.entries(object ?? {}).map(([k, v]) => [k, toText(v)])))
  const [errors, setErrors] = useState<Record<string, string>>({})
  useEffect(() => {
    onValidityChange?.(readObject(draft) ? '' : 'Correct the Advanced JSON input.')
  }, [draft, onValidityChange])
  if (synced !== draft) {
    setSynced(draft)
    if (object) {
      setExamples(object)
      setFields(Object.fromEntries(Object.entries(object).map(([k, v]) => [k, toText(v)])))
      setErrors({})
    }
  }
  if (!object) return <p role="alert">{tx('Correct the Advanced JSON input to restore the named fields.', 'common')}</p>
  function edit(key: string, text: string) {
    const nextFields = { ...fields, [key]: text }
    setFields(nextFields)
    const next: Record<string, unknown> = {},
      nextErrors: Record<string, string> = {}
    for (const [name, example] of Object.entries(examples)) {
      try {
        next[name] = parseProblemField(
          nextFields[name],
          name === 'edges' && Array.isArray(example) && !example.length ? [{ from: 0, to: 1, weight: 1 }] : example,
        )
      } catch (error) {
        nextErrors[name] = error instanceof Error ? error.message : 'Check this value.'
      }
    }
    setErrors(nextErrors)
    onValidityChange?.(Object.values(nextErrors)[0] ?? '')
    if (!Object.keys(nextErrors).length) {
      const json = JSON.stringify(next, null, 2)
      setSynced(json)
      onChange(json)
    }
  }
  return (
    <div className="problem-input-fields">
      {tx(
        Object.entries(examples).map(([key, example]) => {
          if (key === 'edges' && Array.isArray(example)) {
            const edges = JSON.parse(fields[key]) as Record<string, unknown>[]
            return (
              <fieldset key={key} className="problem-field-wide problem-edges">
                <legend>{tx('Graph edges', 'common')}</legend>
                {tx(
                  edges.map((edge, index) => (
                    <div className="problem-edge-row" key={index}>
                      {tx(
                        ['from', 'to', 'weight'].map((name) => (
                          <label key={name}>
                            <span>{tx(name, 'common')}</span>
                            <input
                              type="number"
                              aria-label={tx(`Edge ${index + 1} ${name}`, 'common')}
                              value={String(edge[name] ?? '')}
                              onChange={(e) =>
                                edit(
                                  key,
                                  JSON.stringify(
                                    edges.map((item, i) => (i === index ? { ...item, [name]: e.target.value === '' ? '' : Number(e.target.value) } : item)),
                                  ),
                                )
                              }
                            />
                          </label>
                        )),
                        'common',
                      )}
                      <button
                        type="button"
                        aria-label={tx(`Remove edge ${index + 1}`, 'common')}
                        onClick={() => edit(key, JSON.stringify(edges.filter((_, i) => i !== index)))}
                      >
                        ×
                      </button>
                    </div>
                  )),
                  'common',
                )}
                <button type="button" onClick={() => edit(key, JSON.stringify([...edges, { from: 0, to: 1, weight: 1 }]))}>
                  {tx('Add edge', 'common')}
                </button>
                {tx(
                  errors[key] && (
                    <small className="problem-field-error" role="alert">
                      {tx(errors[key], 'common')}
                    </small>
                  ),
                  'common',
                )}
              </fieldset>
            )
          }
          const matrix = Array.isArray(example) && Array.isArray(example[0])
          const multiline = Array.isArray(example) || (typeof example === 'object' && example !== null) || (typeof example === 'string' && example.length > 60)
          return (
            <label key={key} className={multiline ? 'problem-field-wide' : undefined}>
              <span>{tx(labels[key] ?? key.replaceAll('_', ' '), 'common')}</span>
              {tx(
                typeof example === 'boolean' ? (
                  <select aria-label={tx(labels[key] ?? key, 'common')} value={fields[key]} onChange={(e) => edit(key, e.target.value)}>
                    <option value="true">{tx('Yes', 'common')}</option>
                    <option value="false">{tx('No', 'common')}</option>
                  </select>
                ) : multiline ? (
                  <textarea
                    aria-label={tx(labels[key] ?? key, 'common')}
                    aria-invalid={!!errors[key]}
                    rows={matrix ? 5 : 4}
                    spellCheck={false}
                    value={fields[key]}
                    onChange={(e) => edit(key, e.target.value)}
                  />
                ) : (
                  <input
                    aria-label={tx(labels[key] ?? key, 'common')}
                    aria-invalid={!!errors[key]}
                    type={typeof example === 'number' ? 'number' : 'text'}
                    value={fields[key]}
                    onChange={(e) => edit(key, e.target.value)}
                  />
                ),
                'common',
              )}
              {tx(
                Array.isArray(example) && (
                  <small>
                    {tx(
                      matrix
                        ? 'One row per line; separate numbers with commas or spaces.'
                        : key === 'edges'
                          ? 'JSON list of {from, to, weight} objects.'
                          : 'Paste values separated by commas, spaces, or new lines.',
                      'common',
                    )}
                  </small>
                ),
                'common',
              )}
              {tx(
                errors[key] && (
                  <small className="problem-field-error" role="alert">
                    {tx(errors[key], 'common')}
                  </small>
                ),
                'common',
              )}
            </label>
          )
        }),
        'common',
      )}
    </div>
  )
}
