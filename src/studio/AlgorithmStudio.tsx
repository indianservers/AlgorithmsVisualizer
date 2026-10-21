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
    <MobileDisclosure className="studio-code" title="Executing code and live variables">
      <header className="studio-code-tabs">
        <Code2 size={18} />
        <b>Live code</b>
        <div role="group" aria-label="Code language">
          {['Pseudocode', 'C++', 'Java', 'Python', 'JavaScript'].map((name) => (
            <button key={name} aria-pressed={language === name} onClick={() => setLanguage(name)}>
              {name}
            </button>
          ))}
        </div>
        <label className="studio-auto">
          <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} /> Follow line
        </label>
      </header>
      <div className="studio-code-grid">
        <div className="studio-source" aria-label={`${language} source code`}>
          {rows.map((line, i) => {
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
                <span className="studio-line-number">{i + 1}</span>
                <span className="studio-execution-arrow">{active ? '▶' : ''}</span>
                <code>
                  <Syntax text={text} />
                </code>
                {line.id?.includes('loop') && <span className="studio-loop-label">{line.id.replaceAll('-', ' ')}</span>}
              </div>
            )
          })}
        </div>
        <aside className="studio-live">
          <h3>
            <Activity size={15} /> Variables <span>Live</span>
          </h3>
          <dl>
            {variables.map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{value === null ? '—' : typeof value === 'object' ? JSON.stringify(value) : String(value)}</dd>
              </div>
            ))}
          </dl>
          {step?.highlights.variables?.comparison !== undefined && (
            <div className="studio-comparison">
              <b>{step?.type === 'compare' ? 'Current comparison' : 'Last comparison'}</b>
              <code>{String(step.highlights.variables.comparison)}</code>
              <span>{String(step.highlights.variables.condition)}</span>
            </div>
          )}
          {nestedLoops && (
            <div className="studio-loop-progress">
              <label>
                Outer loop - i = {i} / {Math.max(0, n - 2)}
                <progress max={Math.max(1, n - 1)} value={i + 1} />
              </label>
              <label>
                Inner loop - {runtime.j === null ? 'between comparisons' : `j = ${j}`}
                <progress max={Math.max(1, n - i - 1)} value={runtime.j === null ? 0 : id === 'bubble-sort' ? j + 1 : j - i} />
              </label>
            </div>
          )}
          <div className="studio-loop-status">
            <b>Execution</b>
            <span>{step?.lineId.replaceAll('-', ' ') ?? 'Ready'}</span>
            {['i', 'j', 'gap', 'low', 'high', 'mid', 'exp', 'root', 'end']
              .filter((k) => typeof step?.highlights.variables?.[k] === 'number')
              .map((k) => (
                <label key={k}>
                  {k} = {String(step?.highlights.variables?.[k])}
                </label>
              ))}
          </div>
        </aside>
      </div>
      <p className="studio-source-note">Source views follow the same canonical trace. Language selection preserves the current step.</p>
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
  const systemReduced = useReducedMotion()
  const reduced = reducedMotion || systemReduced
  const data = step?.dataState ?? input
  const max = Math.max(...data.map(Math.abs), 1)
  const exactIcons = view === 'icons' && data.every((v) => Number.isInteger(v) && Math.abs(v) <= 1000)
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
        {view === 'icons'
          ? exactIcons
            ? `One ${selected.icon} = one whole unit. Each bar contains the exact count; labels retain the sign.`
            : 'Scaled bars · exact values are labeled. Whole numbers up to 1,000 per bar show individual icons.'
          : 'Bar height represents magnitude · exact values are labeled.'}
        {signed && (exactIcons ? ' Negative values show their magnitude with a signed label.' : ' Negative values extend below zero.')}
      </div>
      <div className="studio-chart-scroll">
        <div
          data-motion={reduced ? 'off' : 'on'}
          className={`studio-chart ${signed && !exactIcons ? 'signed' : ''}`}
          style={
            {
              '--chart-zoom': zoom / 100,
              ...(exactIcons ? { minHeight: Math.max(278, stackHeight + 95) } : {}),
            } as React.CSSProperties
          }
          role="img"
          aria-label={`Array: ${data.join(', ') || 'empty'}`}
        >
          <div className="studio-zero-line">
            <span>0</span>
          </div>
          {!data.length && (
            <div className="studio-empty">
              <Layers />
              <b>An empty array is a valid example</b>
              <span>Run the algorithm to inspect its base case.</span>
            </div>
          )}
          {data.map((value, i) => {
            const sorted = step?.sortedIndices.includes(i)
            const state = active.includes(i) ? (step?.type === 'swap' ? 'swapping' : active.indexOf(i) === 0 ? 'active' : 'comparing') : sorted ? 'sorted' : ''
            const markers = Object.entries(variables)
              .filter(([key, v]) => ['i', 'j', 'mid', 'minIndex', 'low', 'high', 'k'].includes(key) && v === i)
              .map(([key]) => key)
            const height = value === 0 ? 3 : Math.max(5, (Math.abs(value) / max) * (signed ? 115 : 190))
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
                <div className="studio-pointer">{markers.join(' · ')}</div>
                <strong className="studio-value">{value}</strong>
                <div
                  className={`studio-bar ${value < 0 ? 'negative' : ''} ${exactIcons ? 'apple-stack' : ''}`}
                  style={
                    {
                      height: exactIcons ? undefined : height,
                      '--apple-height': `${appleHeight}px`,
                      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                    } as React.CSSProperties
                  }
                >
                  {exactIcons
                    ? Array.from({ length: Math.abs(value) }, (_, k) => (
                        <span className="studio-unit-icon" data-unit-icon key={k}>
                          {selected.id === 'apples' ? <AppleIcon id={`apple-${i}-${k}`} /> : selected.icon}
                        </span>
                      ))
                    : view === 'icons' && <span className="studio-unit-icon">{selected.icon}</span>}
                </div>
                <span className="studio-index">{i}</span>
              </motion.div>
            )
          })}
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
}: {
  module: AlgorithmModule
  input: number[]
  inputText: string
  target: number
  size: number
  step?: AlgorithmStep
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
  const [view, setView] = useState('icons'),
    [zoom, setZoom] = useState(100)
  const [character, setCharacter] = usePersistentState('algodrishti-sorting-character', 'apples', persistentString)
  const current = step as StudioStep | undefined
  const sorting = module.category === 'Sorting'
  return (
    <div className="algorithm-studio" data-algorithm={module.id}>
      <div className="studio-main">
        <header className="studio-heading">
          <span className="studio-heading-icon">{sorting ? <AppleIcon id="heading-apple" /> : <Search />}</span>
          <div>
            <h1>{module.name}</h1>
            <p>
              {module.id === 'sliding-window-two-pointers-suite'
                ? 'Live example: two-pointer pair sum on ascending values.'
                : suiteExamples[module.id]
                  ? `Suite example: ${suiteExamples[module.id].replaceAll('-', ' ')}. Browse algorithms to explore each method.`
                  : module.summary}
            </p>
          </div>
          <div className="studio-complexity time">
            <Clock />
            <span>
              Time complexity<strong>{module.complexity.average}</strong>
            </span>
          </div>
          <div className="studio-complexity space">
            <Layers />
            <span>
              Space complexity<strong>{module.complexity.space}</strong>
            </span>
          </div>
        </header>
        {controls}
        <section className="studio-visual" ref={canvasRef}>
          <div className="studio-view-toolbar">
            <span>View as:</span>
            <div className="studio-toggle">
              {['bars', 'icons'].map((v) => (
                <button key={v} aria-pressed={view === v} onClick={() => setView(v)}>
                  {v === 'bars' ? 'Bars' : 'Icons'}
                </button>
              ))}
            </div>
            <label className="studio-character">
              Bar icons
              <select
                aria-label="Bar icons"
                value={character}
                onChange={(event) => {
                  setCharacter(event.target.value)
                  setView('icons')
                }}
              >
                {sortingCharacters.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.icon} {option.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="studio-legend">
              <span className="active">Active</span>
              <span className="comparing">Comparing</span>
              <span className="sorted">Sorted</span>
              <span>Unsorted</span>
            </div>
            <div className="studio-zoom">
              <button aria-label="Zoom out" disabled={zoom <= 75} onClick={() => setZoom((v) => v - 25)}>
                <ZoomOut size={17} />
              </button>
              <button aria-label="Zoom in" disabled={zoom >= 200} onClick={() => setZoom((v) => v + 25)}>
                <ZoomIn size={17} />
              </button>
              <button aria-label="Fit to view" onClick={() => setZoom(100)}>
                {zoom}%
              </button>
              <button aria-label="Reset animation" onClick={reset}>
                <RotateCcw size={17} />
              </button>
            </div>
          </div>
          <ArrayScene step={current} input={input} view={view} zoom={zoom} reducedMotion={reducedMotion} character={character} />
          <div className="studio-explanation" aria-live="polite">
            <BookOpen size={22} />
            <div>
              <b>{current?.type === 'complete' ? 'Result' : 'Step explanation'}</b>
              <p>{disabledReason || current?.description || 'Choose your dataset, then press Run algorithm.'}</p>
            </div>
            <code>{current?.lineId.replaceAll('-', ' ') ?? 'ready'}</code>
          </div>
          <div className="studio-counters">
            {['comparisons', 'swaps', 'writes'].map((key) => (
              <span key={key}>
                {key}
                <b>{current?.metrics[key as keyof AlgorithmStep['metrics']] ?? 0}</b>
              </span>
            ))}
          </div>
        </section>
        <CodeExecutionPanel id={module.id as StudioId} step={current} />
      </div>
      <aside className="studio-sidebar">
        <MobileDisclosure key={module.id} className="studio-input" defaultOpen title="Problem input and presets">
          <h2>
            Problem Input <Settings2 size={19} />
          </h2>
          <label className="studio-dataset">
            Dataset
            <textarea
              aria-label="Dataset"
              value={inputText}
              rows={5}
              spellCheck={false}
              placeholder="42, 18, 67, 9, 31…"
              onChange={(e) => {
                setInput(e.target.value)
                reset()
              }}
            />
          </label>
          <div className="studio-input-fields">
            {!sorting && module.id !== 'peak-element-search' && (
              <label>
                Target
                <input
                  aria-label="Target"
                  type="number"
                  value={target}
                  onChange={(e) => {
                    setTarget(Number(e.target.value))
                    reset()
                  }}
                />
              </label>
            )}
            <label>
              Array size
              <input
                aria-label="Array size"
                type="number"
                min={0}
                max={64}
                value={size}
                onChange={(e) => setSize(Math.max(0, Math.min(64, Number(e.target.value))))}
              />
            </label>
            <span>{input.length} / 64 values</span>
          </div>
          <div className="studio-presets">
            {[
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
                {label}
              </button>
            ))}
          </div>
          <div className="studio-input-utilities">
            <button onClick={() => copy('Input', inputText)}>
              <Copy size={15} /> Copy input
            </button>
            <button
              onClick={() => {
                setInput([...input].sort((a, b) => a - b).join(', '))
                reset()
              }}
            >
              Sort input
            </button>
            <button onClick={() => download(`${module.id}-trace.csv`, csv(), 'text/csv')}>CSV step log</button>
          </div>
          {disabledReason && (
            <p className="studio-input-error" role="alert">
              {disabledReason}
            </p>
          )}
          <details className="studio-browse">
            <summary>
              <Search size={16} /> Browse {sorting ? 'sorting' : 'searching'} algorithms <span>{modules.length}</span>
            </summary>
            {modules.map((m) => (
              <Link key={m.id} to={algorithmPath(m)} aria-current={module.id === m.id ? 'page' : undefined}>
                {m.name}
                <ArrowRight size={14} />
              </Link>
            ))}
          </details>
        </MobileDisclosure>
        <MobileDisclosure className="studio-information" title="Algorithm information">
          <h2>
            <BookOpen size={18} /> Algorithm Information
          </h2>
          <p>{module.summary}</p>
          <div className="studio-flags">
            {module.flags?.map((flag) => (
              <span key={flag}>{flag}</span>
            ))}
          </div>
          <dl>
            <div>
              <dt>Best case</dt>
              <dd>{module.complexity.best}</dd>
            </div>
            <div>
              <dt>Average / worst</dt>
              <dd>
                {module.complexity.average} / {module.complexity.worst}
              </dd>
            </div>
            <div>
              <dt>Extra space</dt>
              <dd>{module.complexity.space}</dd>
            </div>
          </dl>
          <p className="studio-tip">Step forward to inspect one decision. Drag the timeline backward to restore the array, variables, and counters together.</p>
        </MobileDisclosure>
      </aside>
    </div>
  )
}
