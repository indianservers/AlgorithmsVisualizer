// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
import { Penguin, Dolphin } from './CharacterArt'
import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { CSSProperties } from 'react'
import type { AlgorithmStep, AnimationQuality } from '../types'
import './penguins.css'

import { sortingCharacters } from '../data/sortingCharacters'

export function PenguinVisualization({
  items,
  step,
  reducedMotion,
  quality,
  showIndices,
  showValues,
  sortedCount,
  palette,
  showStateComparison,
  character = 'penguins',
}: {
  items: { id: string; index: number; value: number }[]
  step?: AlgorithmStep
  reducedMotion: boolean
  quality: AnimationQuality
  showIndices: boolean
  showValues: boolean
  sortedCount: number
  palette: Record<string, string>
  showStateComparison: boolean
  character?: string
}) {
  useLocaleRender()

  const ref = useRef<HTMLDivElement>(null),
    [width, setWidth] = useState(600)
  const systemReduced = useReducedMotion(),
    noMotion = reducedMotion || systemReduced || quality === 'off'
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  const magnitude = Math.max(0, ...items.map((i) => Math.abs(i.value))) || 1,
    values = items.map((i) => i.value / magnitude)
  const min = Math.min(0, ...values),
    max = Math.max(0, ...values),
    equal = items.every((i) => i.value === items[0]?.value)
  const columns = Math.max(1, Math.min(items.length, Math.floor(width / 56)))
  const slot = width / columns,
    maxHeight = Math.min(240, (slot - 8) * 2),
    minHeight = Math.min(30, maxHeight * 0.45)
  const selectedCharacter = sortingCharacters.find((option) => option.id === character) ?? sortingCharacters[0]
  const countMode = !['penguins', 'dolphins'].includes(selectedCharacter.id)
  const countLimit = 1000
  return (
    <div
      ref={ref}
      className="penguin-viewport"
      data-motion={noMotion ? 'off' : quality === 'simple' ? 'simple' : 'full'}
      aria-label={tx(`${selectedCharacter.name} array visualization`, 'studios')}
    >
      <div className="penguin-stage" style={{ width: '100%' }}>
        {tx(
          items.map((item) => {
            const sorted = step?.type === 'complete' || item.index >= items.length - sortedCount
            const active = step?.highlights.indices?.includes(item.index)
            const status = sorted
              ? 'sorted'
              : active && step?.type === 'swap'
                ? 'swapping'
                : active && ['merge', 'update'].includes(step?.type ?? '')
                  ? 'moving'
                  : active
                    ? 'comparing'
                    : 'normal'
            const ratio = equal ? 0.5 : (item.value / magnitude - min) / Math.max(Number.EPSILON, max - min)
            const height = minHeight + ratio * (maxHeight - minHeight)
            return (
              <motion.div
                key={item.id}
                layout={noMotion ? false : 'position'}
                className={`penguin-slot ${status}`}
                data-value={item.value}
                data-status={status}
                style={
                  {
                    width: slot,
                    '--celebrate-delay': `${Math.min(item.index * 45, 540)}ms`,
                    '--lean': item.index % 2 ? '1' : '-1',
                    color:
                      status === 'sorted'
                        ? (palette.complete ?? '#258555')
                        : status === 'swapping'
                          ? (palette.swap ?? '#d99718')
                          : (palette.compare ?? '#e65f42'),
                  } as CSSProperties
                }
                transition={noMotion ? { duration: 0 } : quality === 'simple' ? { duration: 0.12 } : { type: 'spring', stiffness: 240, damping: 24, mass: 0.8 }}
              >
                {tx(showIndices && <small className="penguin-index">{tx(item.index, 'studios')}</small>, 'studios')}
                <div className="penguin-standing">
                  <span className="penguin-ground-shadow" aria-hidden="true" />
                  <span key={`spark-${status}`} className="penguin-sparkles" aria-hidden="true">
                    ✦
                  </span>
                  {tx(
                    countMode ? (
                      <div
                        key={active && !sorted ? step?.id : status}
                        className={`count-character penguin-art ${noMotion ? 'still' : status}`}
                        aria-label={tx(`${item.value}: ${selectedCharacter.name}`, 'studios')}
                      >
                        <div className="count-icon-grid" style={{ gridTemplateColumns: `repeat(${Math.max(1, Math.floor((slot - 8) / 14))}, 14px)` }}>
                          {tx(
                            Array.from({ length: Math.min(countLimit, Math.floor(Math.abs(item.value))) }, (_, i) => (
                              <span aria-hidden="true" key={i}>
                                {tx(selectedCharacter.icon, 'studios')}
                              </span>
                            )),
                            'studios',
                          )}
                        </div>
                        {tx(item.value === 0 && <span className="count-empty">{tx('Empty', 'studios')}</span>, 'studios')}
                        {tx(
                          Math.floor(Math.abs(item.value)) > countLimit && (
                            <small className="count-overflow">+{tx(Math.floor(Math.abs(item.value)) - countLimit, 'studios')}</small>
                          ),
                          'studios',
                        )}
                        {tx(
                          !Number.isInteger(item.value) && (
                            <small className="count-overflow">
                              +{tx(Number((Math.abs(item.value) % 1).toFixed(4)), 'studios')}
                              {tx(' unit', 'studios')}
                            </small>
                          ),
                          'studios',
                        )}
                      </div>
                    ) : selectedCharacter.id === 'dolphins' ? (
                      <Dolphin key={active && !sorted ? step?.id : status} height={height} status={noMotion ? 'still' : status} />
                    ) : (
                      <Penguin key={active && !sorted ? step?.id : status} height={height} status={noMotion ? 'still' : status} />
                    ),
                    'studios',
                  )}
                </div>
                {tx(
                  (showValues || countMode) && (
                    <strong className="penguin-value" title={tx(String(item.value), 'studios')}>
                      {item.value}
                    </strong>
                  ),
                  'studios',
                )}
                {tx(
                  sorted && (
                    <span className="penguin-check" aria-label={tx('Sorted', 'studios')}>
                      ✓
                    </span>
                  ),
                  'studios',
                )}
              </motion.div>
            )
          }),
          'studios',
        )}
      </div>
      {tx(
        countMode && (
          <p className="penguin-scale-note">
            {tx('One ', 'studios')}
            {tx(selectedCharacter.icon, 'studios')}
            {tx(' = one whole unit. Collections above 1,000 show a “+” remainder. Negative values show their magnitude; the signed label is exact.', 'studios')}
          </p>
        ),
        'studios',
      )}
      {tx(
        items.some((i) => i.value < 0) && (
          <p className="penguin-scale-note">
            {tx(
              countMode
                ? 'Negative values keep their minus sign on the label; icon collections show magnitude.'
                : 'Signed scale: smaller values stand shorter; all penguins share one baseline. Labels retain the exact signed values.',
              'studios',
            )}
          </p>
        ),
        'studios',
      )}

      {tx(
        showStateComparison && step && (
          <div className="state-comparison">
            <span>
              {tx('Before: ', 'studios')}
              {tx((step.beforeState ?? []).join(', '), 'studios')}
            </span>
            <span>
              {tx('After: ', 'studios')}
              {tx((step.afterState ?? step.dataState).join(', '), 'studios')}
            </span>
          </div>
        ),
        'studios',
      )}
    </div>
  )
}
