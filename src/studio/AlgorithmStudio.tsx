// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
import { Penguin, Dolphin } from '../components/CharacterArt'
import { DetectiveSearch } from '../components/DetectiveSearch'
import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Activity, ArrowRight, BookOpen, Clock, Code2, Copy, Layers, RotateCcw, Search, Settings2, Shuffle, ZoomIn, ZoomOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { AlgorithmModule, AlgorithmStep } from '../types'
import { MobileDisclosure } from '../components/MobileDisclosure'
import { algorithmPath } from '../utils/routing'
import sources from './sources.generated.json'
import translations from './languages.generated.json'
import { suiteExamples } from './engine'
import type { StudioStep } from './trace'
import type { StudioId } from './engine'
import { sortingCharacters } from '../data/sortingCharacters'
import { usePersistentState, persistentString } from '../hooks/usePersistentState'
import './studio.css'

export function AppleIcon({ id }: { id: string }) {
  useLocaleRender()

  return (
    <svg viewBox="0 0 40 44" className="studio-apple" aria-hidden="true">
      <defs>
        <radialGradient id={id} cx="30%" cy="20%" r="85%">
          <stop stopColor="#ff7d74" />
          <stop offset=".45" stopColor="#f62945" />
          <stop offset="1" stopColor="#b8072d" />
        </radialGradient>
      </defs>
      <path d="M20 12C10 4 1 14 4 26c2 11 9 17 16 12 7 5 14-1 16-12 3-12-6-22-16-14Z" fill={`url(#${id})`} stroke="#c71336" strokeWidth=".7" />
      <path d="M20 13c-1-5 1-8 3-11" fill="none" stroke="#68462c" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M23 8C24 1 34 2 35 3c-2 7-8 8-12 5" fill="#45a858" />
      <path d="M10 16q-4 4-2 10" stroke="#fff" strokeOpacity=".65" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function Syntax({ text }: { text: string }) {
  return (
    <>
      {text
        .split(
          /(\b(?:function|const|let|for|while|if|else|return|break|continue|true|false|def|range|int|double|boolean|void|static|public|class|import|from|in|not|and|or|False|True)\b|\b\d+(?:\.\d+)?\b|\/\/.*$)/g,
        )
        .map((part, i) => (
          <span
            key={i}
            className={
              /^\/\//.test(part)
                ? 'token-comment'
                : /^\d/.test(part)
                  ? 'token-number'
                  : /^(function|const|let|for|while|if|else|return|break|continue|true|false|def|range|int|double|boolean|void|static|public|class|import|from|in|not|and|or|False|True)$/.test(
                        part,
                      )
                    ? 'token-keyword'
                    : undefined
            }
          >
            {part}
          </span>
        ))}
    </>
  )
}

export function CodeExecutionPanel({ id, step }: { id: StudioId; step?: StudioStep }) {
  useLocaleRender()

  const [language, setLanguage] = useState('JavaScript'),
    [autoScroll, setAutoScroll] = useState(true)
  const activeRef = useRef<HTMLDivElement>(null)
  const rows = (language === 'JavaScript' || language === 'Pseudocode' ? sources[id] : translations[id][language as 'Python' | 'C++' | 'Java']) as {
    id?: string
    text: string
  }[]
  const runtime = step?.highlights.variables ?? {}
  const n = Number(runtime.n ?? step?.dataState.length ?? 0)
  const i = Number(runtime.i ?? 0),
    j = Number(runtime.j ?? 0)
  const nestedLoops = ['bubble-sort', 'selection-sort'].includes(id) && runtime.i !== null && runtime.i !== undefined
  const variables = Object.entries(step?.highlights.variables ?? {}).filter(
    ([key]) => !['comparison', 'condition', 'result', 'leftBuffer', 'rightBuffer', 'left', 'right'].includes(key),
  )
  useEffect(() => {
    const active = activeRef.current
    const source = active?.closest('.studio-source')
    if (autoScroll && active && source instanceof HTMLElement && active.getClientRects().length)
      source.scrollTo({ top: Math.max(0, active.offsetTop - source.clientHeight / 2), behavior: 'instant' })
  }, [autoScroll, step?.id, language])
  return (
    <MobileDisclosure className="studio-code" title={tx('Executing code and live variables', 'studios')}>
      <header className="studio-code-tabs">
        <Code2 size={18} />
        <b>{tx('Live code', 'studios')}</b>
        <div role="group" aria-label={tx('Code language', 'studios')}>
          {tx(
            ['Pseudocode', 'C++', 'Java', 'Python', 'JavaScript'].map((name) => (
              <button key={name} aria-pressed={language === name} onClick={() => setLanguage(name)}>
                {tx(name, 'studios')}
              </button>
            )),
            'studios',
          )}
        </div>
        <label className="studio-auto">
          <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} />
          {tx(' Follow line', 'studios')}
        </label>
      </header>
      <div className="studio-code-grid">
        <div className="studio-source" aria-label={tx(`${language} source code`, 'studios')}>
          {tx(
            rows.map((line, i) => {
              const active = !!line.id && line.id === step?.lineId
              const text =
                language === 'Pseudocode'
                  ? line.text
                      .replace(/\b(const|let) /g, '')
                      .replace(/Math.floor/g, 'floor')
                      .replaceAll('===', '=')
                      .replaceAll('&&', 'AND')
                      .replaceAll('||', 'OR')
                      .replace(/;$/, '')
                  : line.text
              return (
                <div
                  key={i}
                  ref={active ? activeRef : undefined}
                  className={`studio-source-line ${active ? 'executing' : ''}`}
                  data-line-id={line.id}
                  aria-current={active ? 'step' : undefined}
                >
                  <span className="studio-line-number">{tx(i + 1, 'studios')}</span>
                  <span className="studio-execution-arrow">{tx(active ? '▶' : '', 'studios')}</span>
                  <code>
                    <Syntax text={text} />
                  </code>
                  {tx(line.id?.includes('loop') && <span className="studio-loop-label">{tx(line.id.replaceAll('-', ' '), 'studios')}</span>, 'studios')}
                </div>
              )
            }),
            'studios',
          )}
        </div>
        <aside className="studio-live">
          <h3>
            <Activity size={15} />
            {tx(' Variables ', 'studios')}
            <span>{tx('Live', 'studios')}</span>
          </h3>
          <dl>
            {tx(
              variables.map(([key, value]) => (
                <div key={key}>
                  <dt>{tx(key, 'studios')}</dt>
                  <dd>{tx(value === null ? '—' : typeof value === 'object' ? JSON.stringify(value) : String(value), 'studios')}</dd>
                </div>
              )),
              'studios',
            )}
          </dl>
          {tx(
            step?.highlights.variables?.comparison !== undefined && (
              <div className="studio-comparison">
                <b>{tx(step?.type === 'compare' ? 'Current comparison' : 'Last comparison', 'studios')}</b>
                <code>{String(step.highlights.variables.comparison)}</code>
                <span>{tx(String(step.highlights.variables.condition), 'studios')}</span>
              </div>
            ),
            'studios',
          )}
          {tx(
            nestedLoops && (
              <div className="studio-loop-progress">
                <label>
                  {tx('Outer loop - i = ', 'studios')}
                  {tx(i, 'studios')} / {tx(Math.max(0, n - 2), 'studios')}
                  <progress max={Math.max(1, n - 1)} value={i + 1} />
                </label>
                <label>
                  {tx('Inner loop - ', 'studios')}
                  {tx(runtime.j === null ? 'between comparisons' : `j = ${j}`, 'studios')}
                  <progress max={Math.max(1, n - i - 1)} value={runtime.j === null ? 0 : id === 'bubble-sort' ? j + 1 : j - i} />
                </label>
              </div>
            ),
            'studios',
          )}
          <div className="studio-loop-status">
            <b>{tx('Execution', 'studios')}</b>
            <span>{tx(step?.lineId.replaceAll('-', ' ') ?? 'Ready', 'studios')}</span>
            {tx(
              ['i', 'j', 'gap', 'low', 'high', 'mid', 'exp', 'root', 'end']
                .filter((k) => typeof step?.highlights.variables?.[k] === 'number')
                .map((k) => (
                  <label key={k}>
                    {tx(k, 'studios')} = {tx(String(step?.highlights.variables?.[k]), 'studios')}
                  </label>
                )),
              'studios',
            )}
          </div>
        </aside>
      </div>
      <p className="studio-source-note">{tx('Source views follow the same canonical trace. Language selection preserves the current step.', 'studios')}</p>
    </MobileDisclosure>
  )
}

export function ArrayScene({
  step,
  input,
  view,
  zoom,
  reducedMotion,
  character = 'apples',
}: {
  step?: StudioStep
  input: number[]
  view: string
  zoom: number
  reducedMotion: boolean
  character?: string
}) {
  useLocaleRender()

  const systemReduced = useReducedMotion()
  const reduced = reducedMotion || systemReduced
  const data = step?.dataState ?? input
  const max = Math.max(...data.map(Math.abs), 1)
  const scaledCharacter = view === 'icons' && ['penguins', 'dolphins'].includes(character)
  const exactIcons = !scaledCharacter && view === 'icons' && data.every((v) => Number.isInteger(v) && Math.abs(v) <= 1000)
  const selected = sortingCharacters.find((option) => option.id === character) ?? sortingCharacters.find((option) => option.id === 'apples')!
  const columns = max <= 24 ? 2 : 4
  const variables = step?.highlights.variables ?? {}
  const active = step?.highlights.indices ?? []
  const signed = data.some((v) => v < 0)
  const appleHeight = Math.max(10, Math.min(28, 170 / Math.max(1, Math.ceil(max / columns))))
  const stackHeight = Math.ceil(max / columns) * (appleHeight + 1) + 10
  return (
    <>
      <div className="studio-scale-note">
        {tx(
          view === 'icons'
            ? scaledCharacter
              ? `One ${selected.name === 'Penguins' ? 'penguin' : 'dolphin'} per value. Character height represents magnitude; labels show exact values.`
              : exactIcons
                ? `One ${selected.icon} = one whole unit. Each bar contains the exact count; labels retain the sign.`
                : 'Scaled bars · exact values are labeled. Whole numbers up to 1,000 per bar show individual icons.'
            : 'Bar height represents magnitude · exact values are labeled.',
          'studios',
        )}
        {tx(
          signed && (exactIcons || scaledCharacter ? ' Negative values show their magnitude with a signed label.' : ' Negative values extend below zero.'),
          'studios',
        )}
      </div>
      <div className="studio-chart-scroll">
        <div
          data-motion={reduced ? 'off' : 'on'}
          className={`studio-chart ${signed && !exactIcons && !scaledCharacter ? 'signed' : ''}`}
          style={
            {
              '--chart-zoom': zoom / 100,
              ...(exactIcons ? { minHeight: Math.max(278, stackHeight + 95) } : {}),
            } as React.CSSProperties
          }
          role="img"
          aria-label={tx(`Array: ${data.join(', ') || 'empty'}`, 'studios')}
        >
          <div className="studio-zero-line">
            <span>0</span>
          </div>
          {tx(
            !data.length && (
              <div className="studio-empty">
                <Layers />
                <b>{tx('An empty array is a valid example', 'studios')}</b>
                <span>{tx('Run the algorithm to inspect its base case.', 'studios')}</span>
              </div>
            ),
            'studios',
          )}
          {tx(
            data.map((value, i) => {
              const sorted = step?.sortedIndices.includes(i)
              const state = active.includes(i)
                ? step?.type === 'swap'
                  ? 'swapping'
                  : active.indexOf(i) === 0
                    ? 'active'
                    : 'comparing'
                : sorted
                  ? 'sorted'
                  : ''
              const markers = Object.entries(variables)
                .filter(([key, v]) => ['i', 'j', 'mid', 'minIndex', 'low', 'high', 'k'].includes(key) && v === i)
                .map(([key]) => key)
              const height = value === 0 ? 3 : Math.max(5, (Math.abs(value) / max) * (signed && !scaledCharacter ? 115 : 190))
              return (
                <motion.div
                  layout={!reduced}
                  transition={{ layout: { duration: reduced ? 0 : 0.38, ease: 'easeInOut' } }}
                  key={step?.itemIds[i] ?? `item-${i}`}
                  className={`studio-column ${state}`}
                  style={
                    {
                      ...(exactIcons ? { height: stackHeight + 35 } : {}),
                      '--bar-height': `${exactIcons ? Math.ceil(Math.abs(value) / columns) * (appleHeight + 1) + 10 : height}px`,
                    } as React.CSSProperties
                  }
                  data-value={value}
                  data-index={i}
                >
                  <div className="studio-pointer">{tx(markers.join(' · '), 'studios')}</div>
                  <strong className="studio-value">{value}</strong>
                  <div
                    className={`studio-bar ${value < 0 ? 'negative' : ''} ${exactIcons ? 'apple-stack' : ''} ${scaledCharacter ? 'studio-animal' : ''}`}
                    data-scaled-character={scaledCharacter ? selected.id : undefined}
                    style={
                      {
                        height: exactIcons ? undefined : height,
                        '--apple-height': `${appleHeight}px`,
                        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                      } as React.CSSProperties
                    }
                  >
                    {tx(
                      scaledCharacter ? (
                        selected.id === 'penguins' ? (
                          <Penguin height={height} status={reduced ? 'still' : state} />
                        ) : (
                          <Dolphin height={height} status={reduced ? 'still' : state} />
                        )
                      ) : exactIcons ? (
                        Array.from({ length: Math.abs(value) }, (_, k) => (
                          <span className="studio-unit-icon" data-unit-icon key={k}>
                            {tx(selected.id === 'apples' ? <AppleIcon id={`apple-${i}-${k}`} /> : selected.icon, 'studios')}
                          </span>
                        ))
                      ) : (
                        view === 'icons' && <span className="studio-unit-icon">{tx(selected.icon, 'studios')}</span>
                      ),
                      'studios',
                    )}
                  </div>
                  <span className="studio-index">{tx(i, 'studios')}</span>
                </motion.div>
              )
            }),
            'studios',
          )}
        </div>
      </div>
    </>
  )
}

export function AlgorithmStudio({
  module,
  input,
  inputText,
  target,
  size,
  step,
  controls,
  disabledReason,
  modules,
  setInput,
  setTarget,
  setSize,
  preset,
  reset,
  copy,
  csv,
  download,
  canvasRef,
  reducedMotion,
  history = [],
}: {
  module: AlgorithmModule
  input: number[]
  inputText: string
  target: number
  size: number
  step?: AlgorithmStep
  history?: AlgorithmStep[]
  controls: React.ReactNode
  disabledReason: string
  modules: AlgorithmModule[]
  setInput: (value: string) => void
  setTarget: (value: number) => void
  setSize: (value: number) => void
  preset: (mode: string) => void
  reset: () => void
  copy: (label: string, text: string) => void
  csv: () => string
  download: (filename: string, text: string, mime: string) => void
  reducedMotion: boolean
  canvasRef: React.RefObject<HTMLDivElement | null>
}) {
  useLocaleRender()

  const [view, setView] = useState('icons'),
    [zoom, setZoom] = useState(100)
  const [character, setCharacter] = usePersistentState('algodrishti-sorting-character', 'apples', persistentString)
  const current = step as StudioStep | undefined
  const sorting = module.category === 'Sorting'
  return (
    <div className="algorithm-studio" data-algorithm={module.id}>
      <div className="studio-main">
        <header className="studio-heading">
          <span className="studio-heading-icon">{tx(sorting ? <AppleIcon id="heading-apple" /> : <Search />, 'studios')}</span>
          <div>
            <h1>{tx(module.name, 'studios')}</h1>
            <p>
              {tx(
                module.id === 'sliding-window-two-pointers-suite'
                  ? 'Live example: two-pointer pair sum on ascending values.'
                  : suiteExamples[module.id]
                    ? `Suite example: ${suiteExamples[module.id].replaceAll('-', ' ')}. Browse algorithms to explore each method.`
                    : module.summary,
                'studios',
              )}
            </p>
          </div>
          <div className="studio-complexity time">
            <Clock />
            <span>
              {tx('Time complexity', 'studios')}
              <strong>{tx(module.complexity.average, 'studios')}</strong>
            </span>
          </div>
          <div className="studio-complexity space">
            <Layers />
            <span>
              {tx('Space complexity', 'studios')}
              <strong>{tx(module.complexity.space, 'studios')}</strong>
            </span>
          </div>
        </header>
        {tx(controls, 'studios')}
        <section className="studio-visual" ref={canvasRef}>
          {sorting && (
            <div className="studio-view-toolbar">
              <span>{tx('View as:', 'studios')}</span>
              <div className="studio-toggle">
                {tx(
                  ['bars', 'icons'].map((v) => (
                    <button key={v} aria-pressed={view === v} onClick={() => setView(v)}>
                      {tx(v === 'bars' ? 'Bars' : 'Icons', 'studios')}
                    </button>
                  )),
                  'studios',
                )}
              </div>
              <label className="studio-character">
                {tx('Bar icons', 'studios')}
                <select
                  aria-label={tx('Bar icons', 'studios')}
                  value={character}
                  onChange={(event) => {
                    setCharacter(event.target.value)
                    setView('icons')
                  }}
                >
                  {tx(
                    sortingCharacters.map((option) => (
                      <option key={option.id} value={option.id}>
                        {tx(option.icon, 'studios')} {tx(option.name, 'studios')}
                      </option>
                    )),
                    'studios',
                  )}
                </select>
              </label>
              <div className="studio-legend">
                <span className="active">{tx('Active', 'studios')}</span>
                <span className="comparing">{tx('Comparing', 'studios')}</span>
                <span className="sorted">{tx('Sorted', 'studios')}</span>
                <span>{tx('Unsorted', 'studios')}</span>
              </div>
              <div className="studio-zoom">
                <button aria-label={tx('Zoom out', 'studios')} disabled={zoom <= 75} onClick={() => setZoom((v) => v - 25)}>
                  <ZoomOut size={17} />
                </button>
                <button aria-label={tx('Zoom in', 'studios')} disabled={zoom >= 200} onClick={() => setZoom((v) => v + 25)}>
                  <ZoomIn size={17} />
                </button>
                <button aria-label={tx('Fit to view', 'studios')} onClick={() => setZoom(100)}>
                  {tx(zoom, 'studios')}%
                </button>
                <button aria-label={tx('Reset animation', 'studios')} onClick={reset}>
                  <RotateCcw size={17} />
                </button>
              </div>
            </div>
          )}
          {sorting ? (
            <ArrayScene step={current} input={input} view={view} zoom={zoom} reducedMotion={reducedMotion} character={character} />
          ) : (
            <DetectiveSearch
              key={module.id}
              items={(current?.dataState ?? input).map((value, index) => ({ value, index, id: `search-${index}` }))}
              step={current}
              history={history}
              target={target}
              algorithmId={module.id}
              reducedMotion={reducedMotion}
              quality="detailed"
            />
          )}
          <div className="studio-explanation" aria-live="polite">
            <BookOpen size={22} />
            <div>
              <b>{tx(current?.type === 'complete' ? 'Result' : 'Step explanation', 'studios')}</b>
              <p>{tx(disabledReason || current?.description || 'Choose your dataset, then press Run algorithm.', 'studios')}</p>
            </div>
            <code>{current?.lineId.replaceAll('-', ' ') ?? 'ready'}</code>
          </div>
          <div className="studio-counters">
            {tx(
              ['comparisons', 'swaps', 'writes'].map((key) => (
                <span key={key}>
                  {tx(key, 'studios')}
                  <b>{tx(current?.metrics[key as keyof AlgorithmStep['metrics']] ?? 0, 'studios')}</b>
                </span>
              )),
              'studios',
            )}
          </div>
        </section>
        <CodeExecutionPanel id={module.id as StudioId} step={current} />
      </div>
      <aside className="studio-sidebar">
        <MobileDisclosure key={module.id} className="studio-input" defaultOpen title={tx('Problem input and presets', 'studios')}>
          <h2>
            {tx('Problem Input ', 'studios')}
            <Settings2 size={19} />
          </h2>
          <label className="studio-dataset">
            {tx('Dataset', 'studios')}
            <textarea
              aria-label={tx('Dataset', 'studios')}
              value={inputText}
              rows={5}
              spellCheck={false}
              placeholder={tx('42, 18, 67, 9, 31…', 'studios')}
              onChange={(e) => {
                setInput(e.target.value)
                reset()
              }}
            />
          </label>
          <div className="studio-input-fields">
            {tx(
              !sorting && module.id !== 'peak-element-search' && (
                <label>
                  {tx('Target', 'studios')}
                  <input
                    aria-label={tx('Target', 'studios')}
                    type="number"
                    value={target}
                    onChange={(e) => {
                      setTarget(Number(e.target.value))
                      reset()
                    }}
                  />
                </label>
              ),
              'studios',
            )}
            <label>
              {tx('Array size', 'studios')}
              <input
                aria-label={tx('Array size', 'studios')}
                type="number"
                min={0}
                max={64}
                value={size}
                onChange={(e) => setSize(Math.max(0, Math.min(64, Number(e.target.value))))}
              />
            </label>
            <span>
              {tx(input.length, 'studios')}
              {tx(' / 64 values', 'studios')}
            </span>
          </div>
          <div className="studio-presets">
            {tx(
              [
                ['random', 'Random'],
                ['sorted', 'Sorted'],
                ['reverse', 'Reverse'],
                ['duplicates', 'Duplicates'],
                ['nearly', 'Nearly sorted'],
                ['best', 'Best case'],
                ['average', 'Average case'],
                ['worst', 'Worst case'],
                ['empty', 'Empty'],
                ['single', 'Single element'],
                ['all-equal', 'All equal'],
                ['negative', 'Negative numbers'],
              ].map(([mode, label]) => (
                <button key={mode} onClick={() => preset(mode)}>
                  <Shuffle size={13} />
                  {tx(label, 'studios')}
                </button>
              )),
              'studios',
            )}
          </div>
          <div className="studio-input-utilities">
            <button onClick={() => copy('Input', inputText)}>
              <Copy size={15} />
              {tx(' Copy input', 'studios')}
            </button>
            <button
              onClick={() => {
                setInput([...input].sort((a, b) => a - b).join(', '))
                reset()
              }}
            >
              {tx('Sort input', 'studios')}
            </button>
            <button onClick={() => download(`${module.id}-trace.csv`, csv(), 'text/csv')}>{tx('CSV step log', 'studios')}</button>
          </div>
          {tx(
            disabledReason && (
              <p className="studio-input-error" role="alert">
                {tx(disabledReason, 'studios')}
              </p>
            ),
            'studios',
          )}
          <details className="studio-browse">
            <summary>
              <Search size={16} />
              {tx(' Browse ', 'studios')}
              {tx(sorting ? 'sorting' : 'searching', 'studios')}
              {tx(' algorithms ', 'studios')}
              <span>{tx(modules.length, 'studios')}</span>
            </summary>
            {tx(
              modules.map((m) => (
                <Link key={m.id} to={algorithmPath(m)} aria-current={module.id === m.id ? 'page' : undefined}>
                  {tx(m.name, 'studios')}
                  <ArrowRight size={14} />
                </Link>
              )),
              'studios',
            )}
          </details>
        </MobileDisclosure>
        <MobileDisclosure className="studio-information" title={tx('Algorithm information', 'studios')}>
          <h2>
            <BookOpen size={18} />
            {tx(' Algorithm Information', 'studios')}
          </h2>
          <p>{tx(module.summary, 'studios')}</p>
          <div className="studio-flags">
            {tx(
              module.flags?.map((flag) => <span key={flag}>{tx(flag, 'studios')}</span>),
              'studios',
            )}
          </div>
          <dl>
            <div>
              <dt>{tx('Best case', 'studios')}</dt>
              <dd>{tx(module.complexity.best, 'studios')}</dd>
            </div>
            <div>
              <dt>{tx('Average / worst', 'studios')}</dt>
              <dd>
                {tx(module.complexity.average, 'studios')} / {tx(module.complexity.worst, 'studios')}
              </dd>
            </div>
            <div>
              <dt>{tx('Extra space', 'studios')}</dt>
              <dd>{tx(module.complexity.space, 'studios')}</dd>
            </div>
          </dl>
          <p className="studio-tip">
            {tx('Step forward to inspect one decision. Drag the timeline backward to restore the array, variables, and counters together.', 'studios')}
          </p>
        </MobileDisclosure>
      </aside>
    </div>
  )
}
