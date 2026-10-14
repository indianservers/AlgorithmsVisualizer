import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { AlgorithmStep, AnimationQuality } from '../types'
import './penguins.css'

import { sortingCharacters } from '../data/sortingCharacters'

export function Penguin({ height, status }: { height: number; status: string }) {
  return (
    <svg viewBox="0 0 100 200" width={height / 2} height={height} className={`penguin-art ${status}`} aria-hidden="true">
      <ellipse cx="50" cy="191" rx="35" ry="6" fill="#152c46" opacity=".14" />
      <path d="M26 73 Q4 105 8 145 Q11 156 18 137 L30 108 M74 73 Q96 105 92 145 Q89 156 82 137 L70 108" fill="#173956" stroke="#0e253e" strokeWidth="3" />
      <path d="M48 14 Q38 0 41 20 Q48 6 54 19 Q64 5 59 24" fill="#102b45" />
      <path
        d="M50 19 C20 19 19 52 22 76 C12 112 17 163 31 181 Q50 195 69 181 C83 163 88 112 78 76 C81 52 80 19 50 19"
        fill="#153750"
        stroke="#0c2239"
        strokeWidth="3"
      />
      <path d="M23 78 C25 35 44 34 50 59 C56 34 75 35 77 78 Q68 89 77 121 C85 177 61 189 50 186 C39 189 15 177 23 121 Q32 89 23 78" fill="#f7fafb" />
      <ellipse cx="37" cy="63" rx="8" ry="13" fill="#fff" />
      <ellipse cx="63" cy="63" rx="8" ry="13" fill="#fff" />
      <ellipse cx="39" cy="66" rx="4" ry="7" fill="#102238" />
      <ellipse cx="61" cy="66" rx="4" ry="7" fill="#102238" />
      <circle cx="40" cy="63" r="1.8" fill="white" />
      <circle cx="62" cy="63" r="1.8" fill="white" />
      <path d="M40 83 Q50 73 60 83 L50 91 Z" fill="#ffad2e" stroke="#d47710" strokeWidth="1.5" />
      <ellipse cx="33" cy="187" rx="16" ry="6" fill="#ffac27" />
      <ellipse cx="67" cy="187" rx="16" ry="6" fill="#ffac27" />
      <path d="M31 102 Q22 143 33 168" fill="none" stroke="white" opacity=".65" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

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
  const slot = Math.max(32, width / Math.max(1, items.length)),
    maxHeight = Math.min(240, (slot - 8) * 2),
    minHeight = Math.min(30, maxHeight * 0.45)
  const selectedCharacter = sortingCharacters.find((option) => option.id === character) ?? sortingCharacters[0]
  const countMode = selectedCharacter.id !== 'penguins'
  const countLimit = Math.min(100, Math.max(1, Math.floor((slot - 8) / 14)) * 14)
  return (
    <div ref={ref} className="penguin-viewport" aria-label={`${selectedCharacter.name} array visualization`}>
      <div className="penguin-stage" style={{ width: Math.max(width, items.length * 32) }}>
        {items.map((item) => {
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
              layout="position"
              className={`penguin-slot ${status}`}
              data-value={item.value}
              data-status={status}
              style={{
                width: slot,
                color:
                  status === 'sorted' ? (palette.complete ?? '#258555') : status === 'swapping' ? (palette.swap ?? '#d99718') : (palette.compare ?? '#e65f42'),
              }}
              transition={{ duration: noMotion ? 0 : quality === 'simple' ? 0.12 : 0.3 }}
            >
              {showIndices && <small className="penguin-index">{item.index}</small>}
              <div className="penguin-standing">
                {countMode ? (
                  <div
                    key={active && !sorted ? step?.id : status}
                    className={`count-character penguin-art ${noMotion ? 'still' : status}`}
                    aria-label={`${item.value}: ${selectedCharacter.name}`}
                  >
                    <div className="count-icon-grid" style={{ gridTemplateColumns: `repeat(${Math.max(1, Math.floor((slot - 8) / 14))}, 14px)` }}>
                      {Array.from({ length: Math.min(countLimit, Math.floor(Math.abs(item.value))) }, (_, i) => (
                        <span aria-hidden="true" key={i}>
                          {selectedCharacter.icon}
                        </span>
                      ))}
                    </div>
                    {item.value === 0 && <span className="count-empty">Empty</span>}
                    {Math.floor(Math.abs(item.value)) > countLimit && (
                      <small className="count-overflow">+{Math.floor(Math.abs(item.value)) - countLimit}</small>
                    )}
                    {!Number.isInteger(item.value) && <small className="count-overflow">+{Number((Math.abs(item.value) % 1).toFixed(4))} unit</small>}
                  </div>
                ) : (
                  <Penguin key={active && !sorted ? step?.id : status} height={height} status={noMotion ? 'still' : status} />
                )}
              </div>
              {(showValues || countMode) && (
                <strong className="penguin-value" title={String(item.value)}>
                  {item.value}
                </strong>
              )}
              {sorted && (
                <span className="penguin-check" aria-label="Sorted">
                  ✓
                </span>
              )}
            </motion.div>
          )
        })}
      </div>
      {countMode && (
        <p className="penguin-scale-note">
          One {selectedCharacter.icon} = one whole unit. Large collections show a “+” remainder to keep the view readable. Negative values show their magnitude;
          the signed label is exact.
        </p>
      )}
      {items.some((i) => i.value < 0) && (
        <p className="penguin-scale-note">
          {countMode
            ? 'Negative values keep their minus sign on the label; icon collections show magnitude.'
            : 'Signed scale: smaller values stand shorter; all penguins share one baseline. Labels retain the exact signed values.'}
        </p>
      )}
      {items.length * 32 > width && <p className="penguin-scale-note">Scroll horizontally to inspect all values; slots keep a minimum width of 32 px.</p>}
      {showStateComparison && step && (
        <div className="state-comparison">
          <span>Before: {(step.beforeState ?? []).join(', ')}</span>
          <span>After: {(step.afterState ?? step.dataState).join(', ')}</span>
        </div>
      )}
    </div>
  )
}
