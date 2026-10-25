// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'
import { BookOpen, Lightbulb, Search, BarChart3 } from 'lucide-react'
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
  const [inspected, setInspected] = useState<number | null>(null)
  const inspectedItem = items.find((item) => item.index === inspected)
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
    (variables.result === -1 || variables.sentinel === true || variables.occurrenceIndex === -1 || !step?.highlights.indices?.length)
  const resultIndex = positionSearch
    ? Number(variables.result ?? variables.position)
    : peakSearch
      ? Number(variables.result ?? variables.peakIndex)
      : Number(variables.result ?? variables.occurrenceIndex ?? variables.mid ?? variables.index ?? step?.highlights.indices?.[0])
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
        <span className="detective-desk-icon">
          <BookOpen size={23} aria-hidden="true" />
        </span>
        <div className="detective-heading">
          <strong>{tx('The Search Desk', 'studios')}</strong>
          <span>{tx('Follow the detective as each clue narrows the search.', 'studios')}</span>
        </div>
        <span className="detective-counter">
          <BarChart3 size={15} aria-hidden="true" />
          {tx(step?.metrics.comparisons ?? 0, 'studios')}
          {tx(' comparisons', 'studios')}
        </span>
      </div>
      <div className="detective-scroll">
        <div className="detective-track" style={{ width: `max(100%, ${Math.max(1, items.length) * 76}px)` }}>
          <svg className="detective-landscape" viewBox="0 0 1000 240" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 120 Q100 40 210 114 T420 112 T640 105 T850 110 T1000 80 V240 H0Z" fill="currentColor" opacity=".23" />
            <path d="M0 180 Q130 95 280 175 T560 165 T800 158 T1000 135 V240 H0Z" fill="currentColor" opacity=".3" />
            <path d="M0 220 Q180 165 350 216 T700 205 T1000 195 V240 H0Z" fill="currentColor" opacity=".3" />
            {[35, 85, 160, 735, 825, 920, 970].map((x, i) => (
              <g key={x} transform={`translate(${x} ${100 + (i % 3) * 28})`} opacity=".45">
                <path d="M0 0 L-17 60 H-10 L-23 85 H23 L10 60 H17Z" fill="currentColor" />
                <path d="M0 80 V105" stroke="currentColor" strokeWidth="5" />
              </g>
            ))}
            <g fill="currentColor" opacity=".22">
              <ellipse cx="310" cy="55" rx="40" ry="12" />
              <ellipse cx="325" cy="44" rx="18" ry="20" />
              <ellipse cx="760" cy="40" rx="45" ry="12" />
            </g>
          </svg>
          <div className="detective-mission">
            <Search size={18} aria-hidden="true" />
            <div>
              <strong>{tx(peakSearch ? 'Mission: find a peak' : suite ? 'Mission: explore search strategies' : `Target: ${target}`, 'studios')}</strong>
              <p>{tx(complete ? status : 'Every comparison brings us closer. Follow the magnifying glass!', 'studios')}</p>
            </div>
          </div>
          {tx(
            !!items.length && (
              <motion.div
                className={`detective-agent ${complete ? 'finished' : ''}`}
                initial={false}
                animate={{ left: `${((focus + 0.5) / items.length) * 100}%` }}
                transition={transition}
              >
                <div key={`${step?.id}-${target}`} className={`detective-character ${complete && !missing ? 'celebrating' : 'investigating'}`}>
                  <Penguin height={140} status="still" />
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
                    <button
                      type="button"
                      className="detective-number"
                      aria-label={tx(`Inspect index ${item.index}, value ${item.value}`, 'studios')}
                      aria-pressed={inspected === item.index}
                      onClick={() => setInspected(inspected === item.index ? null : item.index)}
                    >
                      {item.value}
                    </button>
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
      {inspectedItem && (
        <div className="detective-inspection" role="status">
          <Search size={17} aria-hidden="true" />
          <span>
            {tx(`Index ${inspectedItem.index} · Value ${inspectedItem.value}`, 'studios')} —{' '}
            {tx(
              peakSearch
                ? 'Compare this value with its neighbors to identify a peak.'
                : suite
                  ? 'Follow each strategy’s comparisons in the step explanation.'
                  : inspectedItem.value === target
                    ? 'This value matches the target.'
                    : inspectedItem.value < target
                      ? 'This value is smaller than the target.'
                      : 'This value is larger than the target.',
              'studios',
            )}
          </span>
          <button type="button" aria-label={tx('Close inspection', 'studios')} onClick={() => setInspected(null)}>
            ×
          </button>
        </div>
      )}
      <div className={`detective-verdict ${missing ? 'missing' : complete ? 'solved' : ''}`} role="status">
        <span aria-hidden="true">{complete ? missing ? '○' : '✓' : <Lightbulb size={22} />}</span>
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
