// @localized-render
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRightLeft,
  Bookmark,
  Check,
  Play,
  Pause,
  ChevronsRight,
  RotateCcw,
  Network,
  Info,
  Lightbulb,
  BookOpen,
  SlidersHorizontal,
  BarChart3,
  CheckCircle2,
  X,
} from 'lucide-react'
import { AccountControl } from '../account/AccountControl'
import { LanguageSelector } from '../i18n/LanguageSelector'
import { tx, useLocaleRender } from '../i18n/render'
import { persistentString, usePersistentState } from '../hooks/usePersistentState'
import { MockupTabs, type MockupPageProps, type MockupTab } from './MockupLessonChrome'
import { boyerMooreExample, runBadCharacterLesson } from './boyerMooreLessonModel'
import './boyer-moore-mockup.css'
const tr = (s: string) => tx(s, 'studios'),
  tabs: MockupTab[] = ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments'],
  presets: Record<string, { text: string; pattern: string }> = {
    default: boyerMooreExample,
    overlap: { text: 'ABABABABA', pattern: 'ABA' },
    absent: { text: 'ALGORITHMS ARE FUN', pattern: 'XYZ' },
    repeated: { text: 'AAAAA', pattern: 'AAA' },
    unicode: { text: '🙂A🙂A🙂', pattern: '🙂A🙂' },
    spaces: { text: ' A  A ', pattern: ' A ' },
  },
  displayChar = (c: string | null) => (c === null ? '–' : c === ' ' ? tr('Space') : c)
function Panel({ title, icon, children, className = '' }: { title: string; icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`bm-panel ${className}`}>
      <header>
        <span className="bm-icon">{icon}</span>
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  )
}
export function BoyerMooreMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const navigate = useNavigate(),
    [tab, setTab] = useState<MockupTab>('Visualization'),
    [run, setRun] = useState(() => runBadCharacterLesson(boyerMooreExample.text, boyerMooreExample.pattern)),
    [cursor, setCursor] = useState(() => runBadCharacterLesson(boyerMooreExample.text, boyerMooreExample.pattern).defaultCursor),
    [textDraft, setTextDraft] = useState(boyerMooreExample.text),
    [patternDraft, setPatternDraft] = useState(boyerMooreExample.pattern),
    [example, setExample] = useState('default'),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(900),
    [indices, setIndices] = useState(true),
    [highlight, setHighlight] = useState(true),
    [error, setError] = useState(''),
    [modal, setModal] = useState<'character' | 'lookup' | 'shift' | null>(null),
    [inspect, setInspect] = useState({ kind: 'text', index: 0 }),
    [lookupChar, setLookupChar] = useState('E'),
    [prediction, setPrediction] = useState(''),
    [feedback, setFeedback] = useState(''),
    [localTheme, setLocalTheme] = useState(() => localStorage.getItem('algodrishti-theme') ?? 'light'),
    dialog = useRef<HTMLDialogElement>(null),
    diagram = useRef<HTMLDivElement>(null)
  const [notes, setNotes] = usePersistentState('algodrishti-boyer-moore-notes', '', persistentString),
    frame = run.frames[cursor],
    theme = props.theme ?? localTheme,
    studied = props.completed.includes(props.module.id),
    pending = textDraft !== run.text || patternDraft !== run.pattern,
    n = run.t.length,
    m = run.p.length,
    done = frame.phase === 'complete',
    displayS = done ? (run.alignments.at(-1) ?? 0) : frame.s,
    cell = Math.max(30, Math.min(36, 756 / Math.max(1, n, m))),
    baseWidth = Math.max(862, 84 + Math.max(n, m, displayS + m) * cell + 16),
    focusIndex = frame.i ?? displayS + Math.max(0, m - 1) / 2,
    activeX = 84 + (focusIndex + 0.5) * cell,
    calloutX = Math.max(35, Math.min(baseWidth - 250, activeX - 164)),
    ghostX = calloutX + 332,
    width = Math.max(baseWidth, calloutX + (frame.shift > 0 ? 575 : 242)),
    bad = (frame.phase === 'mismatch' || frame.phase === 'shift') && !frame.fromMatch,
    found = frame.phase === 'found' || frame.fromMatch,
    table = [...run.last.map((e) => ({ ...e, other: false })), { char: '', index: -1, other: true }],
    half = Math.ceil(table.length / 2),
    history = run.frames.flatMap((f, i) => (f.phase === 'mismatch' || f.phase === 'found' ? [{ ...f, cursor: i }] : [])),
    inspected = (inspect.kind === 'text' ? run.t : run.p)[inspect.index],
    lastIndex = run.last.find((e) => e.char === lookupChar)?.index ?? -1,
    missingChar =
      frame.textChar !== null && !run.p.includes(frame.textChar)
        ? frame.textChar
        : Array.from({ length: 51 }, (_, i) => String.fromCodePoint(0x2200 + i)).find((c) => !run.p.includes(c))!,
    heading = done
      ? m === 0
        ? 'Empty pattern: all boundaries match'
        : run.matches.length
          ? 'Search complete'
          : 'No matches found'
      : bad
        ? `Mismatch at j = ${frame.j}`
        : found
          ? `Match at alignment ${frame.s}`
          : frame.phase === 'match'
            ? `Match at j = ${frame.j}; continue left`
            : `Compare from right to left`,
    description = done
      ? m === 0
        ? `${n + 1} boundary positions; no comparisons required.`
        : `Found ${run.matches.length} match${run.matches.length === 1 ? '' : 'es'} at ${run.matches.length ? run.matches.join(', ') : 'no positions'}.`
      : bad
        ? `T[${frame.i}] = '${displayChar(frame.textChar)}' does not match P[${frame.j}] = '${displayChar(frame.patternChar)}'.`
        : found
          ? 'Advance by 1 to preserve overlapping matches.'
          : `Alignment s = ${frame.s}; text index = s + j = ${frame.i}.`
  useEffect(() => {
    if (modal) dialog.current?.showModal()
    else dialog.current?.close()
  }, [modal])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(
      () =>
        setCursor((c) => {
          if (c >= run.frames.length - 1) {
            setPlaying(false)
            return c
          }
          return c + 1
        }),
      speed,
    )
    return () => window.clearInterval(timer)
  }, [playing, run, speed])
  useEffect(() => {
    if (!diagram.current || diagram.current.scrollWidth <= diagram.current.clientWidth) return
    const target = 84 + (focusIndex + 0.5) * cell
    diagram.current.scrollLeft = Math.max(0, target - diagram.current.clientWidth * (done ? 0.5 : 0.55))
  }, [cursor, focusIndex, cell, tab, done])
  function changeTab(next: MockupTab) {
    setPlaying(false)
    setTab(next)
  }
  function load(text: string, pattern: string, name = 'custom', at?: number) {
    const next = runBadCharacterLesson(text, pattern)
    setRun(next)
    setCursor(at ?? next.defaultCursor)
    setTextDraft(text)
    setPatternDraft(pattern)
    setExample(name)
    setPlaying(false)
    setError('')
    return next
  }
  function start() {
    if (playing) {
      setPlaying(false)
      return
    }
    try {
      if (pending) load(textDraft, patternDraft, 'custom', 0)
      else setCursor(0)
      setPlaying(true)
    } catch (e) {
      setError((e as Error).message)
    }
  }
  function step() {
    setPlaying(false)
    try {
      if (pending) {
        const next = runBadCharacterLesson(textDraft, patternDraft)
        load(textDraft, patternDraft, 'custom', Math.min(1, next.frames.length - 1))
      } else setCursor(done ? 0 : cursor + 1)
    } catch (e) {
      setError((e as Error).message)
    }
  }
  function reset() {
    setPlaying(false)
    setCursor(0)
    setError('')
    setTextDraft(run.text)
    setPatternDraft(run.pattern)
  }
  function inspectCharacter(kind: string, index: number) {
    setInspect({ kind, index })
    setModal('character')
  }
  function lookup(char: string) {
    setLookupChar(char)
    setModal('lookup')
  }
  const clickKey = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      action()
    }
  }
  return (
    <div className="mom-page target-visual boyer-moore-page" data-target="40">
      <header className="bm-topbar">
        <button className="bm-back" aria-label={tr('Back to metric TSP')} onClick={() => navigate('/daa-extensions/metric-tsp-approximation')}>
          <ArrowLeft size={19} />
        </button>
        <div className="bm-title-row">
          <h1>{tr('Boyer–Moore: Bad-Character Rule')}</h1>
          <p>{tr('Visualize the bad-character rule with step-by-step matching.')}</p>
        </div>
        <button className="mom-study" aria-pressed={studied} onClick={() => props.toggleCompleted(props.module.id)}>
          {studied ? <Check size={16} /> : <Bookmark size={16} />} {tr(studied ? 'Studied' : 'Mark studied')}
        </button>
        <AccountControl showLanguage={false} />
      </header>
      <MockupTabs active={tab} onChange={changeTab} tabs={tabs} />
      {tab === 'Visualization' ? (
        <>
          <div className="bm-top-grid">
            <section className={`bm-visualization${pending || error ? ' bm-has-feedback' : ''}`}>
              <header className="bm-visual-heading">
                <span className="bm-main-icon">
                  <Network size={28} />
                </span>
                <div>
                  <h2>{tr('Interactive Visualization')}</h2>
                  <p>{tr('See how the bad-character rule finds mismatches and decides the shift amount.')}</p>
                </div>
                <select
                  aria-label={tr('Boyer–Moore example')}
                  value={example}
                  onChange={(e) => {
                    if (e.target.value === 'custom') return
                    const p = presets[e.target.value]
                    load(p.text, p.pattern, e.target.value)
                  }}
                >
                  {example === 'custom' && <option value="custom">{tr('Custom input')}</option>}
                  {Object.entries({
                    default: 'Default example',
                    overlap: 'Overlapping matches',
                    absent: 'No matching characters',
                    repeated: 'Repeated characters',
                    unicode: 'Unicode characters',
                    spaces: 'Space-sensitive search',
                  }).map(([v, s]) => (
                    <option key={v} value={v}>
                      {tr(s)}
                    </option>
                  ))}
                </select>
              </header>
              <div className="bm-inputs">
                <label>
                  {tr('Text (T)')}
                  <span>
                    <input
                      aria-label={tr('Search text')}
                      value={textDraft}
                      onChange={(e) => {
                        setTextDraft(e.target.value)
                        setPlaying(false)
                        setError('')
                      }}
                    />
                    <small className={Array.from(textDraft).length > 50 ? 'bm-invalid' : ''}>{`${Array.from(textDraft).length}/50`}</small>
                  </span>
                </label>
                <button
                  aria-label={tr('Swap text and pattern')}
                  onClick={() => {
                    setTextDraft(patternDraft)
                    setPatternDraft(textDraft)
                    setPlaying(false)
                    setError('')
                  }}
                >
                  <ArrowRightLeft size={20} />
                </button>
                <label>
                  {tr('Pattern (P)')}
                  <span>
                    <input
                      aria-label={tr('Search pattern')}
                      value={patternDraft}
                      onChange={(e) => {
                        setPatternDraft(e.target.value)
                        setPlaying(false)
                        setError('')
                      }}
                    />
                    <small className={Array.from(patternDraft).length > 50 ? 'bm-invalid' : ''}>{`${Array.from(patternDraft).length}/50`}</small>
                  </span>
                </label>
              </div>
              {error ? (
                <p className="bm-input-feedback" role="alert">
                  {tr(error)}
                </p>
              ) : pending ? (
                <p className="bm-input-feedback" role="status">
                  {tr('Unapplied changes. Start or Step to apply both inputs.')}
                </p>
              ) : null}
              <div ref={diagram} className="bm-diagram-scroll">
                <svg
                  className="bm-diagram"
                  viewBox={`0 0 ${width} 274`}
                  style={{ width, minWidth: width }}
                  role="group"
                  aria-label={tr('Bad-character search alignment')}
                >
                  <text x="13" y="69" className="bm-row-label">
                    {tr('Text  T')}
                  </text>
                  <text x="13" y="140" className="bm-row-label">
                    {tr('Pattern  P')}
                  </text>
                  {run.t.map((c, i) => {
                    const x = 84 + i * cell,
                      active = i === frame.i && !done,
                      suffix = done ? run.matches.includes(displayS) && i >= displayS && i < displayS + m : i >= frame.s + frame.suffixFrom && i < frame.s + m
                    return (
                      <g
                        key={i}
                        className={`bm-text-cell${active ? ' bm-active' : ''}${active && bad && highlight ? ' bm-bad' : ''}${suffix && !bad ? ' bm-matched' : ''}`}
                        role="button"
                        tabIndex={0}
                        aria-label={tr(`Inspect text character ${i}`)}
                        onClick={() => inspectCharacter('text', i)}
                        onKeyDown={(e) => clickKey(e, () => inspectCharacter('text', i))}
                      >
                        <title>{tr(`T[${i}] = ${displayChar(c)}`)}</title>
                        {indices && (
                          <text className="bm-index" x={x + cell / 2} y="28" textAnchor="middle">
                            {i}
                          </text>
                        )}
                        <rect x={x} y="40" width={cell - 1} height="47" rx="7" />
                        <text x={x + cell / 2} y="70" textAnchor="middle" className="bm-letter">
                          {c}
                        </text>
                      </g>
                    )
                  })}
                  {run.p.map((c, j) => {
                    const x = 84 + (displayS + j) * cell,
                      active = j === frame.j && !done,
                      suffix = done ? run.matches.includes(displayS) : j >= frame.suffixFrom
                    return (
                      <g
                        key={j}
                        className={`bm-pattern-cell${j === 0 ? ' bm-first' : ''}${active ? ' bm-active' : ''}${active && bad && highlight ? ' bm-bad' : ''}${suffix ? ' bm-matched' : ''}`}
                        role="button"
                        tabIndex={0}
                        aria-label={tr(`Inspect pattern character ${j}`)}
                        onClick={() => inspectCharacter('pattern', j)}
                        onKeyDown={(e) => clickKey(e, () => inspectCharacter('pattern', j))}
                      >
                        <title>{tr(`P[${j}] = ${displayChar(c)}`)}</title>
                        {!done && <line x1={x + cell / 2} x2={x + cell / 2} y1="87" y2="114" />}
                        <rect x={x} y="114" width={cell - 1} height="45" rx="7" />
                        <text x={x + cell / 2} y="143" textAnchor="middle" className="bm-letter">
                          {c}
                        </text>
                        {indices && (
                          <text x={x + cell / 2} y="177" textAnchor="middle" className="bm-index">
                            {j}
                          </text>
                        )}
                      </g>
                    )
                  })}
                  {!n && (
                    <text x="100" y="69" className="bm-empty-label">
                      {tr('Empty text')}
                    </text>
                  )}
                  {!m && (
                    <text x="100" y="140" className="bm-empty-label">
                      {tr('Empty pattern: every boundary matches')}
                    </text>
                  )}
                  <g
                    className={`bm-callout${bad ? ' bm-mismatch-callout' : found || done ? ' bm-found-callout' : ''}`}
                    role="button"
                    tabIndex={0}
                    aria-label={tr('Explain current comparison and shift')}
                    onClick={() => setModal('shift')}
                    onKeyDown={(e) => clickKey(e, () => setModal('shift'))}
                  >
                    <rect x={calloutX} y="196" width="226" height="62" rx="8" />
                    <title>{tr(`${heading}. ${description}`)}</title>
                    <text x={calloutX + 15} y="222" className="bm-callout-title" style={{ fontSize: Math.min(14, 196 / (heading.length * 0.57)) }}>
                      {tr(heading)}
                    </text>
                    <text x={calloutX + 15} y="244" className="bm-callout-detail">
                      {tr(description.length > 45 ? `${description.slice(0, 42)}…` : description)}
                    </text>
                    {bad && <path d={`M${activeX - 7},196L${activeX},183L${activeX + 7},196`} className="bm-callout-notch" />}
                  </g>
                  {frame.shift > 0 && (
                    <g className="bm-shift-preview">
                      <path d={`M${ghostX - 90} 212H${ghostX - 9}M${ghostX - 22} 204L${ghostX - 8} 212L${ghostX - 22} 220`} />
                      <g
                        role="button"
                        tabIndex={0}
                        aria-label={tr(`Explain shift by ${frame.shift}`)}
                        onClick={() => setModal('shift')}
                        onKeyDown={(e) => clickKey(e, () => setModal('shift'))}
                      >
                        <rect x={ghostX - 90} y="225" width="76" height="28" rx="7" />
                        <text x={ghostX - 52} y="243" textAnchor="middle">
                          {tr(`Shift by ${frame.shift}`)}
                        </text>
                      </g>
                      {run.p.slice(0, 7).map((c, j) => (
                        <g key={j} className="bm-ghost-cell">
                          <rect x={ghostX + j * 33} y="190" width="32" height="42" rx="5" />
                          <text x={ghostX + 16 + j * 33} y="217" textAnchor="middle">
                            {c}
                          </text>
                          {indices && (
                            <text x={ghostX + 16 + j * 33} y="249" className="bm-ghost-index" textAnchor="middle">
                              {j}
                            </text>
                          )}
                        </g>
                      ))}
                      {m > 7 && <text x={ghostX + 238} y="217" className="bm-ghost-more">{`+${m - 7}`}</text>}
                    </g>
                  )}
                </svg>
              </div>
              <div className="bm-controls">
                <button className="bm-primary" onClick={start}>
                  {playing ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
                  {tr(playing ? 'Pause' : 'Start')}
                </button>
                <button onClick={step}>
                  <ChevronsRight size={21} />
                  {tr('Step')}
                </button>
                <button onClick={reset}>
                  <RotateCcw size={18} />
                  {tr('Reset')}
                </button>
                <span className="bm-divider" />
                <label className="bm-speed">
                  {tr('Speed')}
                  <input
                    type="range"
                    min="100"
                    max="1700"
                    step="100"
                    aria-label={tr('Animation speed')}
                    value={1800 - speed}
                    onChange={(e) => setSpeed(1800 - Number(e.target.value))}
                  />
                  <select aria-label={tr('Playback speed')} value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                    {![100, 900, 1600].includes(speed) && <option value={speed}>{tr('Custom')}</option>}
                    <option value={1600}>{tr('Slow')}</option>
                    <option value={900}>{tr('Normal')}</option>
                    <option value={100}>{tr('Fast')}</option>
                  </select>
                </label>
                <label className="bm-switch">
                  <input type="checkbox" checked={indices} onChange={(e) => setIndices(e.target.checked)} />
                  <span />
                  {tr('Show indices')}
                </label>
                <label className="bm-switch">
                  <input type="checkbox" checked={highlight} onChange={(e) => setHighlight(e.target.checked)} />
                  <span />
                  {tr('Highlight mismatch')}
                </label>
              </div>
            </section>
            <aside className="bm-explanation">
              <Panel className="bm-how" title={tr('How it works')} icon={<Info size={20} />}>
                <ol>
                  {[
                    'Align the pattern with the text from left to right; compare characters right to left.',
                    'On a mismatch at position j, use the bad-character rule to decide the shift.',
                    'Shift the pattern so the rightmost occurrence of T[s + j] in the pattern aligns with it (or shift by j + 1 if it is not in the pattern).',
                    'Repeat until every possible alignment has been considered. Preserve overlapping matches.',
                  ].map((s, i) => (
                    <li key={s}>
                      <b>{i + 1}</b>
                      <p>{tr(s)}</p>
                    </li>
                  ))}
                </ol>
              </Panel>
              <Panel className="bm-insight" title={tr('Bad-character rule (key idea)')} icon={<Lightbulb size={22} />}>
                <p>
                  {tr(
                    'When a mismatch occurs at pattern index j with character c = T[s + j], shift the pattern so the rightmost occurrence of c in the pattern aligns with that text character. Use max(1, j − last[c]); if c is absent, last[c] = −1 and the shift is j + 1.',
                  )}
                </p>
              </Panel>
            </aside>
          </div>
          <div className="bm-bottom-grid">
            <Panel className="bm-table-panel" title={tr('Bad-character table (rightmost occurrence)')} icon={<BookOpen size={23} />}>
              <p>{tr(`For pattern P = "${run.pattern}". Store the last index of each character.`)}</p>
              <div className="bm-last-scroll">
                <table>
                  <thead>
                    <tr>
                      {['Character', 'Rightmost index', 'Character', 'Rightmost index'].map((s, i) => (
                        <th key={i}>{tr(s)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: half }, (_, i) => (
                      <tr key={i}>
                        {[table[i], table[i + half]].map((e, k) =>
                          e ? (
                            <Fragment key={k}>
                              <td key={`c${k}`}>
                                <button
                                  className={e.other ? 'bm-other-character' : undefined}
                                  aria-label={tr(e.other ? 'Inspect missing-character lookup' : `Inspect rightmost ${displayChar(e.char)}`)}
                                  onClick={() => lookup(e.other ? missingChar : e.char)}
                                >
                                  {e.other ? tr('(others)') : displayChar(e.char)}
                                </button>
                              </td>
                              <td key={`i${k}`}>{e.index === -1 ? '−1' : e.index}</td>
                            </Fragment>
                          ) : (
                            <Fragment key={k}>
                              <td key={`c${k}`} />
                              <td key={`i${k}`} />
                            </Fragment>
                          ),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
            <Panel className="bm-state" title={tr('Current alignment state')} icon={<SlidersHorizontal size={21} />}>
              <dl>
                {[
                  [tr('Text index (s + j)'), frame.i ?? '–'],
                  [tr('Text character T[s + j]'), displayChar(frame.textChar)],
                  [tr('Pattern index (j)'), frame.j ?? '–'],
                  [tr('Pattern character P[j]'), displayChar(frame.patternChar)],
                  [
                    tr('Rule lookup'),
                    found ? tr('Full match; preserve overlaps') : frame.textChar === null ? '–' : `rightmost(${displayChar(frame.textChar)}) = ${frame.last}`,
                  ],
                  [tr('Shift amount'), frame.shift || '–'],
                  [tr('Next alignment starts at'), frame.nextS ?? (done ? '–' : tr('Continue comparison'))],
                ].map(([s, v], i) => (
                  <div key={s}>
                    <dt>{s}</dt>
                    <dd>
                      {i === 5 ? (
                        <button aria-label={tr('Explain shift amount')} onClick={() => setModal('shift')}>
                          <strong>{v}</strong>
                          <Info size={14} />
                        </button>
                      ) : (
                        <span className={(i === 1 || i === 3) && bad && highlight ? 'bm-state-bad' : ''}>{v}</span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </Panel>
            <Panel className="bm-complexity" title={tr('Complexity')} icon={<BarChart3 size={23} />}>
              <div>
                <p>
                  <b>{tr('Time: O(nm) worst (bad-character only)')}</b>
                </p>
                <p>
                  <b>{tr('Auxiliary space: O(Σ) ⊆ O(m + |Σ|)')}</b>
                </p>
                <p>
                  {tr(
                    'This explicit bad-character-only variant does not implement the full good-suffix optimization and retains quadratic worst-case behavior.',
                  )}
                </p>
              </div>
              <div className="bm-example-result">
                <span>
                  <CheckCircle2 size={25} />
                </span>
                <div>
                  <h3>{tr('Example result')}</h3>
                  <p>
                    {tr(
                      done
                        ? `Matches: ${run.matches.length ? run.matches.join(', ') : 'none'}. Comparisons: ${run.comparisons}.`
                        : 'Try the default example. Observe how the algorithm skips mismatches using the bad-character rule, often shifting by more than one position.',
                    )}
                  </p>
                </div>
              </div>
            </Panel>
          </div>
        </>
      ) : tab === 'Learn' ? (
        <div className="bm-learning">
          <Panel title={tr('Compare right to left, shift safely')} icon={<BookOpen />}>
            <p>
              {tr(
                'Align a pattern of length m at text position s. Compare P[j] with T[s + j], starting at j = m − 1 and moving left. Matching characters to the right form a verified suffix. At the first mismatch, look up the text character c in a table of rightmost pattern positions.',
              )}
            </p>
            <h3>{tr('The bad-character formula')}</h3>
            <p>
              {tr(
                'Set last[c] to the last index of c in the pattern, or −1 if it is absent. Shift by max(1, j − last[c]). If last[c] is to the left of j, align that occurrence with the mismatching text character. Any smaller positive shift would put c opposite a pattern position to the right of its last occurrence, which cannot match. If c is absent, all j + 1 smaller alignments are impossible. If last[c] is at or to the right of j, clamp the shift to one.',
              )}
            </p>
            <p>
              {tr(
                'Matching equal characters is never a mismatch. A full match advances by one in this teaching implementation so overlapping matches are preserved.',
              )}
            </p>
          </Panel>
          <Panel title={tr('Worked example: HERE IS A SIMPLE EXAMPLE')} icon={<Lightbulb />}>
            <p>
              {tr(
                'The full text has 24 characters, including four spaces. EXAMPLE has seven characters. Alignments start at 0, 7, 9, 12 and 17. At s = 9, the suffix MPLE matches, then j = 2 compares I with A. I is absent from the pattern, so shift = max(1, 2 − (−1)) = 3. The next alignment starts at 12. The final match starts at 17.',
              )}
            </p>
            <p>
              {tr(
                'The rightmost E is at index 6, not index 0. Repeated characters overwrite earlier table entries. Try the overlapping preset to find ABA at 0, 2, 4 and 6.',
              )}
            </p>
            <button
              onClick={() => {
                load(presets.overlap.text, presets.overlap.pattern, 'overlap')
                setTab('Visualization')
              }}
            >
              {tr('Explore overlapping matches')}
            </button>
            <h3>{tr('Characters, edge cases and cost')}</h3>
            <p>
              {tr(
                'Search is case-sensitive and preserves spaces. Indices count Unicode code points; an emoji counts as one character, while a combining mark is a separate code point. An empty pattern matches all n + 1 text boundaries. A longer pattern has no valid alignment. Preprocessing costs O(m) time and O(min(m, |Σ|)) table space. The bad-character-only search can take O(nm) time. Stored visualization frames and match outputs require additional space beyond the core lookup table.',
              )}
            </p>
          </Panel>
        </div>
      ) : tab === 'Code' ? (
        <Panel className="bm-code" title={tr('Bad-character-only search with overlapping matches')} icon={<BookOpen />}>
          <pre>
            <code>{`function search(text, pattern) {
  const T = Array.from(text), P = Array.from(pattern);
  if (!P.length) return Array.from({length: T.length + 1}, (_, i) => i);
  const last = new Map();
  P.forEach((c, j) => last.set(c, j));
  const matches = [];
  for (let s = 0; s + P.length <= T.length;) {
    let j = P.length - 1;
    while (j >= 0 && P[j] === T[s + j]) j--;
    if (j < 0) {
      matches.push(s);
      s++; // preserve overlapping matches
    } else {
      s += Math.max(1, j - (last.get(T[s + j]) ?? -1));
    }
  }
  return matches;
}`}</code>
          </pre>
        </Panel>
      ) : tab === 'Practice' ? (
        <Panel className="bm-practice" title={tr('Predict the bad-character shift')} icon={<Lightbulb />}>
          <p>
            {tr('For P = EXAMPLE, a mismatch occurs at j = 3 against text character X. The rightmost X is at pattern index 1. How far can the pattern shift?')}
          </p>
          <label>
            {tr('Your prediction')}
            <select
              value={prediction}
              onChange={(e) => {
                setPrediction(e.target.value)
                setFeedback('')
              }}
            >
              <option value="">{tr('Choose an answer')}</option>
              <option value="1">{tr('Shift by 1')}</option>
              <option value="2">{tr('Shift by 2')}</option>
              <option value="4">{tr('Shift by 4')}</option>
            </select>
          </label>
          <button
            onClick={() =>
              setFeedback(
                prediction === '2'
                  ? 'Correct. max(1, 3 − 1) = 2; align the rightmost X with the mismatching text character.'
                  : 'Try again: use max(1, j − last[X]) with j = 3 and last[X] = 1.',
              )
            }
          >
            {tr('Check prediction')}
          </button>
          {feedback && <p role="status">{tr(feedback)}</p>}
        </Panel>
      ) : (
        <div className="bm-experiments">
          <Panel title={tr('Inspect the complete search trace')} icon={<SlidersHorizontal />}>
            <p>{tr(`Text length ${n}; pattern length ${m}; total comparisons ${run.comparisons}; attempted alignments ${run.alignments.length}.`)}</p>
            <p className="bm-match-summary">
              {tr(`Computed matches: ${run.matches.length ? run.matches.join(', ') : 'none'}. Positions use Unicode code-point indices.`)}
            </p>
            <div className="bm-experiment-controls">
              <button onClick={reset}>{tr('Restart trace')}</button>
              <button
                onClick={() => {
                  setCursor(run.frames.length - 1)
                  setPlaying(false)
                }}
              >
                {tr('Jump to search result')}
              </button>
              <button
                onClick={() => {
                  setCursor(Math.max(0, cursor - 1))
                  setPlaying(false)
                }}
              >
                {tr('Previous event')}
              </button>
              <button onClick={step}>{tr('Next event')}</button>
              <button
                onClick={() => {
                  setCursor(run.defaultCursor)
                  setPlaying(false)
                }}
              >
                {tr('Show worked mismatch')}
              </button>
            </div>
            <label className="bm-event-range">
              {tr(`Trace event: ${cursor} / ${run.frames.length - 1}`)}
              <input
                type="range"
                min="0"
                max={run.frames.length - 1}
                value={cursor}
                aria-label={tr('Search trace event')}
                onChange={(e) => {
                  setCursor(Number(e.target.value))
                  setPlaying(false)
                }}
              />
            </label>
            <p>
              {tr(
                `Current event: ${frame.phase}; alignment ${frame.s}; comparisons so far ${frame.comparisons}; matches found so far ${frame.matches.length}.`,
              )}
            </p>
            <div className="bm-history-scroll">
              <table>
                <thead>
                  <tr>
                    {['Alignment', 'Outcome', 'Pattern index j', 'Shift', 'Next alignment'].map((s) => (
                      <th key={s}>{tr(s)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((f) => (
                    <tr key={f.cursor}>
                      <td>
                        <button
                          aria-label={tr(`Inspect alignment event ${f.cursor}`)}
                          onClick={() => {
                            setCursor(f.cursor)
                            setPlaying(false)
                          }}
                        >
                          {f.s}
                        </button>
                      </td>
                      <td>{tr(f.phase)}</td>
                      <td>{f.j}</td>
                      <td>{f.shift}</td>
                      <td>{f.nextS}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => setTab('Visualization')}>{tr('Return to search diagram')}</button>
          </Panel>
          <Panel title={tr('Notes and preferences')} icon={<Bookmark />}>
            <label>
              {tr('Boyer–Moore notes')}
              <textarea aria-label={tr('Boyer–Moore notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
            <LanguageSelector />
            <button
              onClick={() => {
                if (props.onToggleTheme) props.onToggleTheme()
                else {
                  const next = theme === 'dark' ? 'light' : 'dark'
                  setLocalTheme(next)
                  localStorage.setItem('algodrishti-theme', next)
                }
              }}
            >
              {tr(theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme')}
            </button>
          </Panel>
        </div>
      )}
      <dialog ref={dialog} className="bm-dialog" onCancel={() => setModal(null)}>
        <button className="bm-close" aria-label={tr('Close Boyer–Moore dialog')} onClick={() => setModal(null)}>
          <X size={20} />
        </button>
        {modal === 'character' ? (
          <>
            <h2>{tr(`${inspect.kind === 'text' ? 'Text' : 'Pattern'} character ${inspect.index}`)}</h2>
            <p>{tr(`Character: ${displayChar(inspected)}. Unicode: U+${inspected?.codePointAt(0)?.toString(16).toUpperCase()}.`)}</p>
            <p>
              {tr(
                inspect.kind === 'text'
                  ? `Text index ${inspect.index}; current pattern alignment starts at ${frame.s}.`
                  : `Pattern index ${inspect.index}; its rightmost occurrence is ${run.last.find((e) => e.char === inspected)?.index}.`,
              )}
            </p>
            <button onClick={() => lookup(inspected)}>{tr('Inspect this character in the rightmost table')}</button>
          </>
        ) : modal === 'lookup' ? (
          <>
            <h2>{tr(`Rightmost lookup: ${displayChar(lookupChar)}`)}</h2>
            <p>{tr(`Pattern positions: ${run.p.flatMap((c, i) => (c === lookupChar ? [i] : [])).join(', ') || 'none'}. Rightmost index: ${lastIndex}.`)}</p>
            <p>
              {tr(
                lastIndex === -1
                  ? 'This character does not occur in the pattern. A mismatch at j can shift by j + 1.'
                  : 'The last occurrence overwrites all earlier occurrences during preprocessing.',
              )}
            </p>
          </>
        ) : modal === 'shift' ? (
          <>
            <h2>{tr(heading)}</h2>
            <p>{tr(description)}</p>
            {bad ? (
              <>
                <p className="bm-formula">{tr(`max(1, j − last[c]) = max(1, ${frame.j} − (${frame.last})) = ${frame.shift}`)}</p>
                <p>
                  {tr(
                    `Current alignment ${frame.s}; next alignment ${frame.nextS}. The verified matching suffix is ${run.p.slice(frame.suffixFrom).join('') || '(empty)'}.`,
                  )}
                </p>
                <p>{tr('Only the bad-character rule is used. The minimum shift is one, so the search always makes progress.')}</p>
              </>
            ) : (
              <p>
                {tr(
                  found
                    ? 'A full match advances by one to preserve overlaps.'
                    : done
                      ? 'All valid alignments have been searched.'
                      : 'Continue comparing toward the left before computing a mismatch shift.',
                )}
              </p>
            )}
          </>
        ) : null}
      </dialog>
    </div>
  )
}
