// @localized-render
import { useEffect, useState, type ReactNode } from 'react'
import { AlertTriangle, BarChart3, CheckCircle2, ChevronRight, ClipboardList, Layers3, Lightbulb, Pause, Play, RotateCcw, Sparkles, Target } from 'lucide-react'
import { tx, useLocaleRender } from '../i18n/render'
import { MockupLessonChrome, MockupTabs, SelectionHeroArt, type MockupPageProps, type MockupTab } from './MockupLessonChrome'
import { quickReferenceValues, quickTrace, type QuickFrame, type QuickPivot } from './quickselectModel'
import { parseMedianValues } from './medianModel'
import source from './quickselectModel.ts?raw'
import './quickselect-mockup.css'

const tr = (text: string) => tx(text, 'studios')
const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th'}`
function QPanel({
  title,
  description,
  icon,
  children,
  className = '',
}: {
  title: string
  description?: string
  icon?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`mom-panel qs-panel ${className}`}>
      <header>
        <span className="qs-panel-icon">{icon ?? <Layers3 size={23} />}</span>
        <div>
          <h2>{tr(title)}</h2>
          {description && <p>{tr(description)}</p>}
        </div>
      </header>
      {children}
    </section>
  )
}
function Partition({ frame }: { frame: QuickFrame }) {
  let position = 0
  const bands = [
    { name: 'Less than pivot', values: frame.lower, tone: 'lower' },
    { name: 'Equal to pivot', values: frame.equal, tone: 'equal' },
    { name: 'Greater than pivot', values: frame.upper, tone: 'upper' },
  ]
  return (
    <div className="qs-partition" aria-label={tr('Three-way partition')}>
      <h3>
        {tr('Partition step (pivot = ')}
        {frame.pivot})
      </h3>
      <div className="qs-partition-layout">
        <div className="qs-bands" dir="ltr">
          {bands.map((band) => {
            const start = position
            position += band.values.length
            return (
              <div className={`qs-band ${band.tone}`} key={band.tone} style={{ flexGrow: Math.max(1, band.values.length) }}>
                <b>{tr(band.name)}</b>
                <span className="qs-band-count">
                  {band.values.length} {tr(band.values.length === 1 ? 'element' : 'elements')}
                </span>
                <div className="qs-bracket" />
                <div className="qs-band-values">
                  {band.values.length ? (
                    band.values.map((v, i) => (
                      <div key={i}>
                        <strong>{v}</strong>
                        <small>{start + i}</small>
                      </div>
                    ))
                  ) : (
                    <div className="qs-empty-band">∅</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <aside className="qs-partition-legend">
          {bands.map((b) => (
            <div key={b.tone}>
              <i className={b.tone} />
              <span>{tr(`Elements ${b.tone === 'lower' ? '<' : b.tone === 'equal' ? '=' : '>'} pivot`)}</span>
              <b>{b.values.length}</b>
            </div>
          ))}
          <p>
            <b>
              {tr('Pivot: ')}
              {frame.pivot}
            </b>
            {tr(' (index ')}
            {frame.pivotIndex}
            {frame.equal.length > 1 ? `…${frame.pivotIndex + frame.equal.length - 1}` : ''})
          </p>
        </aside>
      </div>
    </div>
  )
}
function GrowthChart() {
  const w = 380,
    h = 155,
    left = 37,
    top = 10,
    bottom = 126,
    right = 366,
    x = (n: number) => left + (n / 1000) * (right - left),
    y = (v: number) => bottom - (v / 8000) * (bottom - top),
    curve = (fn: (n: number) => number) => Array.from({ length: 21 }, (_, i) => `${x(i * 50)},${y(fn(i * 50))}`).join(' ')
  return (
    <div className="qs-complexity-chart">
      <div className="qs-chart-legend">
        <span>
          <i />
          {tr('Expected (random pivot)')}
        </span>
        <span>
          <i />
          {tr('Worst case (adversarial)')}
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label={tr('Illustrative linear versus quadratic growth')}>
        <g className="qs-chart-grid">
          {[0, 2000, 4000, 6000, 8000].map((v) => (
            <g key={v}>
              <line x1={left} y1={y(v)} x2={right} y2={y(v)} />
              <text x={left - 7} y={y(v) + 3} textAnchor="end">
                {v ? v / 1000 + 'K' : 0}
              </text>
            </g>
          ))}
          {[0, 200, 400, 600, 800, 1000].map((v) => (
            <g key={v}>
              <line x1={x(v)} y1={top} x2={x(v)} y2={bottom} />
              <text x={x(v)} y={bottom + 14} textAnchor="middle">
                {v.toLocaleString('en-IN')}
              </text>
            </g>
          ))}
        </g>
        <polyline className="qs-linear" points={curve((n) => 3 * n)} />
        <polyline className="qs-quadratic" points={curve((n) => (n * n) / 125)} />
        {[0, 200, 400, 600, 800, 1000].map((n) => (
          <g key={n}>
            <circle className="qs-linear-dot" cx={x(n)} cy={y(3 * n)} r="2.5" />
            <circle className="qs-quadratic-dot" cx={x(n)} cy={y((n * n) / 125)} r="2.5" />
          </g>
        ))}
        <text x="204" y="154" textAnchor="middle">
          {tr('Input size n')}
        </text>
        <text transform="translate(10,77) rotate(-90)" textAnchor="middle">
          {tr('Operations')}
        </text>
      </svg>
      <small>{tr('Illustrative curves: 3n and n²/125, not measured runtimes.')}</small>
    </div>
  )
}
function QuickSideCards() {
  return (
    <aside className="qs-sidecards">
      <article className="qs-takeaways">
        <h2>
          <Lightbulb />
          {tr('Key Takeaways')}
        </h2>
        {[
          'Partitions around a pivot like Quicksort.',
          'Recurse only into the side containing the k-th smallest element.',
          'Expected time O(n) with random pivots; worst case O(n²).',
          'O(n) extra space for this teaching model.',
          'Useful for medians, percentiles and other ranks.',
        ].map((text) => (
          <p key={text}>
            <CheckCircle2 />
            {tr(text)}
          </p>
        ))}
      </article>
      <article className="qs-pitfalls">
        <h2>
          <AlertTriangle />
          {tr('Common Pitfalls')}
        </h2>
        {[
          'Recursing into both sides defeats the purpose.',
          'When recursing right, subtract |L| + |E| from k.',
          'Worst-case quadratic time with poor pivot choices (e.g., always first/last on sorted input).',
          'Confusing 0-based and 1-based ranks.',
          'Not handling duplicate elements correctly.',
        ].map((text) => (
          <p key={text}>
            <span>×</span>
            {tr(text)}
          </p>
        ))}
      </article>
      <article className="qs-pro-tip">
        <h2>
          <Sparkles />
          {tr('Pro Tip')}
        </h2>
        <p>{tr('Use randomized pivot selection to achieve O(n) expected time and avoid adversarial inputs.')}</p>
      </article>
    </aside>
  )
}

export function QuickselectMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const [tab, setTab] = useState<MockupTab>('Learn'),
    [draft, setDraft] = useState(() => quickReferenceValues.map(String)),
    [rank, setRank] = useState('3'),
    [mode, setMode] = useState<QuickPivot>('last'),
    [seed, setSeed] = useState('42'),
    [run, setRun] = useState(() => quickTrace(quickReferenceValues, 3)),
    [cursor, setCursor] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(900),
    [error, setError] = useState(''),
    [proof, setProof] = useState('Correctness'),
    [bulk, setBulk] = useState(quickReferenceValues.join(', ')),
    [notice, setNotice] = useState(''),
    [prediction, setPrediction] = useState(''),
    [feedback, setFeedback] = useState(''),
    [notes, setNotes] = useState(() => localStorage.getItem('algodrishti-quickselect-notes') ?? '')
  const [saved, setSaved] = useState<{ values: number[]; rank: number; mode: QuickPivot; seed: number }[]>(() => {
    try {
      const v = JSON.parse(localStorage.getItem('algodrishti-quickselect-saved') ?? '[]')
      return Array.isArray(v) ? v.filter((x) => x && Array.isArray(x.values) && Number.isInteger(x.rank)).slice(0, 5) : []
    } catch {
      return []
    }
  })
  const frame = run.frames[cursor],
    dirty =
      draft.some((v) => !v.trim()) ||
      JSON.stringify(draft.map(Number)) !== JSON.stringify(run.values) ||
      Number(rank) !== run.rank ||
      mode !== run.pivotMode ||
      Number(seed) !== run.seed
  const interactive = tab === 'Learn' || tab === 'Visualization'
  useEffect(() => {
    if (!playing || !interactive || cursor >= run.frames.length - 1) return
    const timer = window.setTimeout(() => {
      setCursor((c) => c + 1)
      if (cursor + 1 >= run.frames.length - 1) setPlaying(false)
    }, speed)
    return () => window.clearTimeout(timer)
  }, [playing, interactive, cursor, run.frames.length, speed])
  function openTab(next: MockupTab) {
    setTab(next)
    setPlaying(false)
    setFeedback('')
    setPrediction('')
  }
  function compute(values?: number[], k?: number, pivot?: QuickPivot, s?: number) {
    try {
      if (!values && draft.some((v) => !v.trim())) throw new Error('Every array cell needs a finite value.')
      const a = values ?? draft.map(Number),
        r = k ?? Number(rank),
        strategy = pivot ?? mode,
        randomSeed = s ?? Number(seed),
        next = quickTrace(a, r, strategy, randomSeed)
      setRun(next)
      setCursor(0)
      setDraft(a.map(String))
      setRank(String(r))
      setMode(strategy)
      setSeed(String(randomSeed))
      setBulk(a.join(', '))
      setPlaying(false)
      setError('')
      setNotice('')
      setFeedback('')
      return next
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Check the inputs.')
      setPlaying(false)
      return false
    }
  }
  function step() {
    if (dirty) {
      compute()
      return
    }
    setCursor((i) => Math.min(run.frames.length - 1, i + 1))
    setPlaying(false)
  }
  function reset() {
    compute(quickReferenceValues, 3, 'last', 42)
  }
  function save() {
    try {
      const next = [{ values: run.values, rank: run.rank, mode: run.pivotMode, seed: run.seed }, ...saved].slice(0, 5)
      localStorage.setItem('algodrishti-quickselect-saved', JSON.stringify(next))
      setSaved(next)
      setNotice('Experiment saved in this browser.')
    } catch {
      setNotice('Local storage is unavailable. Export your trace instead.')
    }
  }
  function exportRun() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(run, null, 2)], { type: 'application/json' })),
      a = document.createElement('a')
    a.href = url
    a.download = 'quickselect-trace.json'
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <div className="mom-page quickselect-page target-visual" data-target="16" data-mockup-page="quickselect">
      <MockupLessonChrome
        {...props}
        title={tr('Quickselect')}
        description="Partition and recurse only into the rank-containing group."
        decoration={
          <div className="qs-hero-art-slot">
            <SelectionHeroArt />
          </div>
        }
        onStart={() => {
          openTab('Visualization')
          setCursor(0)
        }}
      />
      <MockupTabs active={tab} onChange={openTab} />
      {interactive && (
        <>
          <div className="qs-main-layout">
            <QPanel
              title={tr('Quickselect Visualizer')}
              description="Choose a pivot, partition the array, and recurse only into the side containing the k-th smallest element."
              className="qs-visualizer"
            >
              <div className="qs-input-controls">
                <div className="qs-dataset">
                  <span>{tr('Array (editable)')}</span>
                  <div dir="ltr">
                    {draft.map((value, i) => (
                      <input
                        key={i}
                        type="number"
                        aria-label={tr(`Array value ${i + 1}`)}
                        value={value}
                        onChange={(e) => {
                          setDraft(draft.map((v, j) => (j === i ? e.target.value : v)))
                          setPlaying(false)
                        }}
                      />
                    ))}
                  </div>
                </div>
                <label className="qs-rank">
                  {tr('Rank k (1-based)')}
                  <input
                    aria-label={tr('Quickselect rank k')}
                    type="number"
                    min={1}
                    max={draft.length}
                    value={rank}
                    onChange={(e) => {
                      setRank(e.target.value)
                      setPlaying(false)
                    }}
                  />
                </label>
                <button className="mom-start qs-run-step" disabled={!dirty && cursor === run.frames.length - 1} onClick={step}>
                  <Play size={16} />
                  {tr('Run Step')}
                  <ChevronRight size={15} />
                </button>
              </div>
              <div className="qs-pivot-controls">
                <label>
                  {tr('Pivot selection')}
                  <select
                    aria-label={tr('Quickselect pivot selection')}
                    value={mode}
                    onChange={(e) => {
                      setMode(e.target.value as QuickPivot)
                      setPlaying(false)
                    }}
                  >
                    <option value="last">{tr('Last element (default)')}</option>
                    <option value="first">{tr('First element')}</option>
                    <option value="middle">{tr('Middle element')}</option>
                    <option value="random">{tr('Random element (seeded)')}</option>
                  </select>
                </label>
                <button onClick={reset}>
                  <RotateCcw size={17} />
                  {tr('Reset')}
                </button>
                <button
                  className="qs-auto-run"
                  disabled={!dirty && run.frames.length === 1}
                  onClick={() => {
                    if (playing) {
                      setPlaying(false)
                      return
                    }
                    if (dirty) {
                      const next = compute()
                      if (next) setPlaying(next.frames.length > 1)
                    } else {
                      if (cursor === run.frames.length - 1) setCursor(0)
                      setPlaying(true)
                    }
                  }}
                >
                  {playing ? <Pause size={17} /> : <Play size={17} />} {tr(playing ? 'Pause' : 'Auto Run')}
                </button>
              </div>
              {mode === 'random' && (
                <label className="qs-seed-label">
                  {tr('Random seed')}
                  <input
                    aria-label={tr('Quickselect random seed')}
                    type="number"
                    value={seed}
                    onChange={(e) => {
                      setSeed(e.target.value)
                      setPlaying(false)
                    }}
                  />
                </label>
              )}
              {dirty && (
                <p className="qs-edited" role="status">
                  {tr('Inputs edited. Run Step applies the new input; the diagram still shows the last successful run.')}
                </p>
              )}
              {error && <p role="alert">{tr(error)}</p>}
              <Partition frame={frame} />
              {cursor === run.frames.length - 1 && (
                <output className="qs-result">
                  <CheckCircle2 size={18} />
                  {tr('Answer: ')}
                  {run.answer}
                </output>
              )}
              {tab === 'Visualization' && (
                <details className="qs-bulk-editor" open>
                  <summary>{tr('Bulk input and playback')}</summary>
                  <label>
                    {tr('Dataset (comma or space separated)')}
                    <textarea aria-label={tr('Quickselect bulk dataset')} rows={3} value={bulk} onChange={(e) => setBulk(e.target.value)} />
                  </label>
                  <button
                    onClick={() => {
                      try {
                        compute(parseMedianValues(bulk), Number(rank))
                      } catch (e) {
                        setError(e instanceof Error ? e.message : 'Check dataset.')
                      }
                    }}
                  >
                    {tr('Apply dataset')}
                  </button>
                  <label>
                    {tr('Animation speed')}
                    <select aria-label={tr('Quickselect playback speed')} value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                      <option value={1600}>{tr('Slow')}</option>
                      <option value={900}>{tr('Normal')}</option>
                      <option value={250}>{tr('Fast')}</option>
                    </select>
                  </label>
                  <button
                    onClick={() => {
                      setCursor(run.frames.length - 1)
                      setPlaying(false)
                    }}
                  >
                    {tr('Show answer')}
                  </button>
                  <button onClick={exportRun}>{tr('Export trace')}</button>
                </details>
              )}
            </QPanel>
            <QPanel title={tr('Recursion Trace')} icon={<ClipboardList size={19} />} className="qs-recursion">
              <div className="qs-trace-list">
                {run.frames.map((f, i) => (
                  <button
                    className={`qs-trace-node ${i === cursor ? 'current' : ''} ${i > cursor ? 'future' : ''} ${f.found !== undefined ? 'found' : ''}`}
                    key={i}
                    onClick={() => {
                      setCursor(i)
                      setPlaying(false)
                    }}
                    aria-label={tr(`View recursion step ${i + 1}`)}
                    aria-pressed={i === cursor}
                  >
                    <b className="qs-trace-number">{f.found !== undefined ? '✓' : i + 1}</b>
                    <span>
                      <b>
                        {tr('Step')} {i + 1}
                      </b>{' '}
                      · {'n = '}
                      {f.values.length}
                    </span>
                    <span>
                      {tr('Array: ')}[{f.values.join(', ')}]
                    </span>
                    <span>
                      {tr('Pivot: ')}
                      {f.pivot} → {tr('position: ')}
                      {f.pivotIndex}
                    </span>
                    <span>
                      {tr('Elements < pivot: ')}
                      {f.lower.length}
                    </span>
                    <strong>
                      {tr(
                        f.found !== undefined
                          ? `Found answer: ${f.found}`
                          : f.branch === 'left'
                            ? `k = ${f.rank} ≤ ${f.lower.length} → Recurse left`
                            : `k = ${f.rank} > ${f.lower.length + f.equal.length} → Recurse right, k = ${f.nextRank}`,
                      )}
                    </strong>
                  </button>
                ))}
              </div>
            </QPanel>
            <QuickSideCards />
          </div>
          <div className="qs-bottom-layout">
            <QPanel
              title={tr(`Worked Example: Find ${ordinal(run.rank)} Smallest Element`)}
              description={`Given array [${run.values.join(', ')}] and k = ${run.rank}. Quickselect returns ${run.answer}.`}
              icon={<ClipboardList size={24} />}
              className="qs-worked"
            >
              <div className="qs-table-scroll">
                <table>
                  <thead>
                    <tr>
                      {['Step', 'Array (current subarray)', 'Pivot', 'Position', 'k (adjusted)', 'Next Step'].map((label) => (
                        <th key={label}>{tr(label)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {run.frames.map((f, i) => (
                      <tr key={i} className={cursor === i ? 'active' : ''}>
                        <td>{i + 1}</td>
                        <td>[{f.values.join(', ')}]</td>
                        <td>{f.pivot}</td>
                        <td>
                          {f.pivotIndex}
                          {f.equal.length > 1 ? `…${f.pivotIndex + f.equal.length - 1}` : ''}
                        </td>
                        <td>{f.rank}</td>
                        <td>{tr(f.found !== undefined ? `Found: ${f.found}` : f.branch === 'left' ? 'Recurse left' : `Recurse right, k = ${f.nextRank}`)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="qs-worked-answer">
                <CheckCircle2 size={17} />
                {tr(`Answer: The ${ordinal(run.rank)} smallest element is ${run.answer}.`)}
              </div>
            </QPanel>
            <QPanel
              title={tr('Complexity Analysis')}
              description="Time: O(n) expected, O(n²) worst · Space: O(n) teaching arrays"
              icon={<BarChart3 size={24} />}
              className="qs-complexity"
            >
              <GrowthChart />
            </QPanel>
            <QPanel title={tr('Correctness, Assumptions and Interpretation')} icon={<ClipboardList size={22} />} className="qs-correctness">
              <div className="mom-proof-tabs">
                {['Correctness', 'Assumptions', 'Interpretation'].map((label) => (
                  <button key={label} aria-pressed={proof === label} onClick={() => setProof(label)}>
                    {tr(label)}
                  </button>
                ))}
              </div>
              <div className="qs-proof-content">
                <b>{tr(proof === 'Correctness' ? 'Why it works' : proof === 'Assumptions' ? 'Assumptions' : 'Read the rank correctly')}</b>
                <p>
                  {tr(
                    proof === 'Correctness'
                      ? 'Partition places values < pivot before the equal block, followed by values > pivot. If k lies in L, recurse left; if it lies in E, return the pivot; otherwise recurse right with k−|L|−|E|. The rank-containing subproblem strictly shrinks.'
                      : proof === 'Assumptions'
                        ? 'Ranks are one-based, positions are zero-based. Values are finite; duplicates form the equal block. Expected O(n) needs random pivots (or a distribution assumption), not a fixed first/last pivot on every input.'
                        : 'This implementation copies partition arrays for readable traces, using O(n) auxiliary algorithm space. An iterative in-place partition implementation can use O(1) extra space. Stored teaching snapshots add further space.',
                  )}
                </p>
              </div>
            </QPanel>
          </div>
        </>
      )}
      {tab === 'Code' && (
        <QPanel title={tr('Executable Quickselect implementation')} description="This is the actual runner producing every partition and recursion frame.">
          <pre>
            <code>{source}</code>
          </pre>
        </QPanel>
      )}
      {tab === 'Practice' && (
        <QPanel title={tr('Predict the next recursive branch')} icon={<Target />}>
          <p>{tr('Use the partition counts and one-based rank. Which branch contains the answer?')}</p>
          <p>
            {'k = '}
            {frame.rank} · {'|L| = '}
            {frame.lower.length} · {'|E| = '}
            {frame.equal.length}
          </p>
          <label>
            {tr('Your prediction')}
            <select aria-label={tr('Quickselect predicted branch')} value={prediction} onChange={(e) => setPrediction(e.target.value)}>
              <option value="">{tr('Choose…')}</option>
              <option value="left">{tr('Left')}</option>
              <option value="equal">{tr('Return pivot')}</option>
              <option value="right">{tr('Right')}</option>
            </select>
          </label>
          <button onClick={() => setFeedback(prediction === frame.branch ? 'Correct. ' + frame.message : 'Not yet. Compare k with |L| and |L|+|E|.')}>
            {tr('Check prediction')}
          </button>
          {feedback && <p role="status">{tr(feedback)}</p>}
          <details>
            <summary>{tr('What goes wrong if both sides recurse?')}</summary>
            <p>
              {tr(
                'Quickselect needs only one rank-containing subproblem. Recursing into both sides performs unnecessary work and turns the strategy toward Quicksort rather than selection.',
              )}
            </p>
          </details>
        </QPanel>
      )}
      {tab === 'Experiments' && (
        <QPanel title={tr('Quickselect experiments')}>
          <p>{tr('Change pivot strategy on the same input to compare partition sizes; random mode is reproducible with a seed.')}</p>
          <div className="qs-experiment-actions">
            <button onClick={save}>{tr('Save current run')}</button>
            <button onClick={exportRun}>{tr('Export trace')}</button>
            <button
              onClick={() => {
                compute([1, 2, 3, 4, 5, 6, 7, 8], 1, 'last', 42)
                openTab('Visualization')
              }}
            >
              {tr('Sorted-input worst-case example')}
            </button>
            <button
              onClick={() => {
                compute([4, 4, 4, 4, 4, 4], 3, 'last', 42)
                openTab('Visualization')
              }}
            >
              {tr('All-equal example')}
            </button>
          </div>
          {notice && <p role="status">{tr(notice)}</p>}
          {saved.map((s, i) => (
            <div className="qs-saved" key={i}>
              <span>
                [{s.values.join(', ')}] · {'k = '}
                {s.rank} · {s.mode}
              </span>
              <button
                onClick={() => {
                  if (compute(s.values, s.rank, s.mode, s.seed)) openTab('Visualization')
                }}
              >
                {tr('Load experiment')} {i + 1}
              </button>
            </div>
          ))}
        </QPanel>
      )}
      {tab === 'Notes' && (
        <QPanel title={tr('Your Quickselect notes')} description="Notes are stored in this browser.">
          <textarea
            aria-label={tr('Quickselect notes')}
            rows={10}
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value)
              try {
                localStorage.setItem('algodrishti-quickselect-notes', e.target.value)
                setNotice('Notes saved.')
              } catch {
                setNotice('Local storage is unavailable.')
              }
            }}
          />
          {notice && <p role="status">{tr(notice)}</p>}
        </QPanel>
      )}
    </div>
  )
}
