// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
import { motion, useReducedMotion } from 'framer-motion'
import type { AlgorithmStep, AnimationQuality } from '../types'
import { Penguin } from './CharacterArt'
import './detective.css'

type Props = {
  items: { id: string; index: number; value: number }[]
  step?: AlgorithmStep
  history: AlgorithmStep[]
  target: number
  algorithmId: string
  reducedMotion: boolean
  quality: AnimationQuality
}

export function DetectiveSearch({ items, step, history, target, algorithmId, reducedMotion, quality }: Props) {
  useLocaleRender()

  const systemReduced = useReducedMotion()
  const still = reducedMotion || systemReduced || quality === 'off'
  const variables = step?.highlights.variables ?? {}
  const complete = step?.type === 'complete'
  const positionSearch = ['lower-bound', 'upper-bound', 'search-insert-position'].includes(algorithmId)
  const peakSearch = algorithmId === 'peak-element-search'
  const suite = algorithmId.includes('suite')
  const missing =
    complete &&
    !suite &&
    !positionSearch &&
    !peakSearch &&
    (variables.sentinel === true || variables.occurrenceIndex === -1 || !step?.highlights.indices?.length)
  const resultIndex = positionSearch
    ? Number(variables.position)
    : peakSearch
      ? Number(variables.peakIndex)
      : Number(variables.occurrenceIndex ?? variables.mid ?? variables.index ?? step?.highlights.indices?.[0])
  const probe =
    complete && !missing && Number.isFinite(resultIndex)
      ? resultIndex
      : Number(variables.mid ?? variables.probe ?? variables.index ?? step?.highlights.indices?.[0] ?? 0)
  const focus = Math.max(0, Math.min(items.length - 1, Number.isFinite(probe) ? probe : 0))
  const visited = new Set(
    history
      .filter((entry) => entry.type === 'compare')
      .flatMap((entry) => {
        const v = entry.highlights.variables ?? {}
        const index = Number(v.mid ?? v.probe ?? v.index)
        return Number.isInteger(index) ? [index] : (entry.highlights.indices ?? [])
      }),
  )
  const hasRange = Number.isFinite(variables.low) && Number.isFinite(variables.high)
  const status = complete
    ? suite
      ? 'Exploration complete'
      : missing
        ? 'No match found'
        : positionSearch
          ? `Position ${resultIndex}`
          : peakSearch
            ? `Peak at index ${resultIndex}`
            : `Found at index ${resultIndex}`
    : 'Following the clues'
  const transition = still ? { duration: 0 } : quality === 'simple' ? { duration: 0.15 } : { type: 'spring' as const, stiffness: 150, damping: 22 }
  return (
    <section className="detective-search" data-motion={still ? 'off' : quality} aria-label={tx('Detective penguin search visualization', 'studios')}>
      <div className="detective-case">
        <span className="detective-eyebrow">{tx('THE SEARCH DESK', 'studios')}</span>
        <strong>{tx(peakSearch ? 'Mission: find a peak' : suite ? 'Mission: explore search strategies' : `Target: ${target}`, 'studios')}</strong>
        <span className="detective-counter">
          {tx(step?.metrics.comparisons ?? 0, 'studios')}
          {tx(' comparisons', 'studios')}
        </span>
      </div>
      <div className="detective-scroll">
        <div className="detective-track" style={{ width: `max(100%, ${Math.max(1, items.length) * 76}px)` }}>
          {tx(
            !!items.length && (
              <motion.div
                className={`detective-agent ${complete ? 'finished' : ''}`}
                initial={false}
                animate={{ left: `${((focus + 0.5) / items.length) * 100}%` }}
                transition={transition}
              >
                <div key={`${step?.id}-${target}`} className={`detective-character ${complete && !missing ? 'celebrating' : 'investigating'}`}>
                  <Penguin height={112} status="still" />
                  <svg className="detective-accessories" viewBox="0 0 100 200" aria-hidden="true">
                    <path d="M22 44 L30 18 Q50 7 70 18 L78 44 Z" fill="#9c6847" stroke="#533b32" strokeWidth="3" />
                    <path d="M28 31 L73 31 L76 40 L25 40Z" fill="#483545" />
                    <path d="M13 44 Q50 32 88 44 L88 51 Q50 43 13 51Z" fill="#c28c5f" stroke="#533b32" strokeWidth="3" />
                    <path d="M76 131 L92 156" stroke="#ab7042" strokeWidth="9" strokeLinecap="round" />
                    <circle cx="72" cy="117" r="21" fill="#c9f2ff" fillOpacity=".48" stroke="#dfab54" strokeWidth="6" />
                    <path d="M61 111 Q62 102 72 103" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="detective-beam" aria-hidden="true" />
              </motion.div>
            ),
            'studios',
          )}
          <div className="detective-cells">
            {tx(
              items.map((item) => {
                const result = complete && !missing && !suite && item.index === resultIndex
                const discarded = hasRange && (item.index < Number(variables.low) || item.index > Number(variables.high))
                const state = result
                  ? 'result'
                  : !complete && item.index === focus
                    ? 'examining'
                    : discarded
                      ? 'eliminated'
                      : visited.has(item.index)
                        ? 'visited'
                        : 'waiting'
                const pointers = ['low', 'mid', 'high'].filter((key) => Number(variables[key]) === item.index)
                return (
                  <div className={`detective-cell ${state}`} key={item.id} data-value={item.value} data-index={item.index} data-state={state}>
                    <span className="detective-pointer">{tx(pointers.join(' · ') || '\u00a0', 'studios')}</span>
                    <strong className="detective-number">{item.value}</strong>
                    <span className="detective-index">
                      {tx('index ', 'studios')}
                      {tx(item.index, 'studios')}
                    </span>
                    <span className="detective-mark">
                      {tx(
                        result
                          ? '✓ result'
                          : state === 'examining'
                            ? 'checking'
                            : state === 'eliminated'
                              ? 'excluded'
                              : state === 'visited'
                                ? 'checked'
                                : '\u00a0',
                        'studios',
                      )}
                    </span>
                  </div>
                )
              }),
              'studios',
            )}
          </div>
          {tx(
            complete && positionSearch && resultIndex === items.length && (
              <p className="detective-end-position">
                {tx('✓ Insert after the last item · index ', 'studios')}
                {tx(resultIndex, 'studios')}
              </p>
            ),
            'studios',
          )}
        </div>
      </div>
      {tx(!items.length && <p className="detective-empty">{tx('No items to inspect. Enter an array to begin.', 'studios')}</p>, 'studios')}
      <div className={`detective-verdict ${missing ? 'missing' : complete ? 'solved' : ''}`} role="status">
        <span aria-hidden="true">{tx(complete ? (missing ? '○' : '✓') : '⌕', 'studios')}</span>
        <div>
          <strong>{tx(status, 'studios')}</strong>
          <p>{tx(step?.description ?? 'The detective is ready to inspect your array.', 'studios')}</p>
        </div>
      </div>
      <div className="detective-legend">
        <span>{tx('◉ Checking', 'studios')}</span>
        <span>{tx('✓ Result', 'studios')}</span>
        <span>{tx('◌ Checked / excluded', 'studios')}</span>
        <span>{tx('Scroll to inspect long arrays →', 'studios')}</span>
      </div>
    </section>
  )
}
