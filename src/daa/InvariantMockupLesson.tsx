// @localized-render
import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  ArrowUp,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  GitFork,
  Lightbulb,
  LineChart,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  ShieldCheck,
  Sigma,
  SkipBack,
  SkipForward,
  Target,
  Trophy,
  X,
} from 'lucide-react'
import { tx, useLocaleRender } from '../i18n/render'
import { usePersistentState, persistentString } from '../hooks/usePersistentState'
import { MockupLessonChrome, type MockupPageProps } from './MockupLessonChrome'
import {
  binaryInvariantExample,
  binaryInvariantTrace,
  inductionSumExample,
  insertionInvariantExample,
  insertionInvariantTrace,
  parseInvariantArray,
} from './invariantModel'
import './invariant-mockup.css'

const tr = (s: string) => tx(s, 'studios')
type Tab = 'Learn' | 'Visualize' | 'Practice' | 'Quiz' | 'Notes'
type Modal = { kind: 'induction' | 'checker' | 'insertion' | 'vocabulary' | 'examples' | 'mistake'; index?: number } | null
const tabs: Tab[] = ['Learn', 'Visualize', 'Practice', 'Quiz', 'Notes'],
  tabIcons = [BookOpen, LineChart, Pencil, Trophy, FileText]
const inductionTitles = ['Base Case', 'Induction Hypothesis', 'Inductive Step'],
  checkerTitles = ['Initialization', 'Maintenance', 'Termination']
const definitions = [
  [
    'Induction',
    'Prove P(n) for all n using base case and inductive step.',
    'Choose a smallest case n₀. Prove P(n₀), then prove P(k) ⇒ P(k + 1) for every arbitrary k ≥ n₀. The hypothesis is an assumption used only inside the inductive step; it is not an assumption that the entire theorem is already true.',
  ],
  [
    'Loop Invariant',
    'A property that holds before and after every iteration.',
    'State exactly where the invariant holds, for example at the loop guard. Prove it initially, preserve it through one full body execution, and combine it with the exit condition to obtain the desired result. Intermediate assignments need not satisfy a loop-boundary invariant.',
  ],
  [
    'Initialization',
    'Invariant holds initially.',
    'Use the precondition and the initial values of the loop variables to show the invariant holds before the first iteration. For insertion sort with i = 0, the empty prefix is sorted and contains exactly its original elements.',
  ],
  [
    'Maintenance',
    'Invariant is preserved by each iteration.',
    'Assume the invariant and the loop guard at the beginning of an arbitrary iteration. Show that executing the body reestablishes the invariant at the next guard evaluation. Do not assume the desired postcondition.',
  ],
  [
    'Termination',
    'Loop finishes (variant decreases).',
    'For total correctness, identify a well-founded variant, usually a nonnegative integer, and show it strictly decreases on every backedge. Separately, use the invariant and false guard to prove the postcondition. A direct return may exit before the variant reaches zero.',
  ],
  [
    'Postcondition',
    'Desired property on output.',
    'The postcondition is the complete promised result under the precondition. A sorting algorithm must return a sorted permutation of the original input. Sortedness alone permits losing or duplicating values.',
  ],
]
const mistakes = [
  [
    'Proving only a few base cases but not the inductive step.',
    'Checking P(0), P(1) and P(2) does not establish P(n) for every n. The inductive step must work for an arbitrary k and transfer the truth of P(k) to P(k + 1).',
  ],
  [
    'Using a wrong or too weak loop invariant.',
    '“The prefix is sorted” does not by itself prove that sorting preserved the input elements. Include the permutation property, specify the prefix bounds, and verify that the loop body preserves both claims.',
  ],
  [
    'Assuming the invariant implies the postcondition without the exit condition.',
    'During insertion sort a sorted empty prefix says nothing about the unsorted suffix. At exit, i = n turns the prefix property into a property of the whole array.',
  ],
  [
    'Not proving termination (for loops or recursive proofs).',
    'Partial correctness says that an answer is correct if the algorithm stops. Total correctness also requires a termination argument. For an unsuccessful binary-search iteration the candidate interval strictly shrinks; a successful comparison returns immediately.',
  ],
]
function Panel({
  title,
  description,
  icon,
  children,
  className = '',
}: {
  title: string
  description?: string
  icon: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`mom-panel iv-panel ${className}`}>
      <header>
        <span className="iv-icon">{icon}</span>
        <div>
          <h2>{tr(title)}</h2>
          {description && <p>{tr(description)}</p>}
        </div>
      </header>
      {children}
    </section>
  )
}
function HeroArt() {
  return (
    <svg className="iv-hero-art" viewBox="0 0 278 148" aria-hidden="true">
      <defs>
        <linearGradient id="iv-wave" x2="0" y2="1">
          <stop stopColor="#5eaeff" stopOpacity=".65" />
          <stop offset="1" stopColor="#c2e5ff" stopOpacity=".08" />
        </linearGradient>
      </defs>
      <path d="M0 143C40 151 60 122 84 56S110 33 132 82S165 137 199 104S244 20 278 33V148H0Z" fill="url(#iv-wave)" />
      <path d="M0 144C34 125 55 97 76 115S114 75 145 75S200 129 228 97S256 80 278 64V148H0Z" fill="url(#iv-wave)" />
      <path d="M0 143C43 151 58 114 77 51S101 72 122 96S153 114 179 88S216 124 239 85S262 57 278 61" fill="none" stroke="#64b2ff" strokeWidth="1.5" />
      <path d="M0 138C33 140 47 103 75 108S113 149 139 129S179 72 201 91S232 106 247 72S264 59 278 58" fill="none" stroke="#0076ff" strokeWidth="1.5" />
      {[
        [46, 116],
        [76, 108],
        [109, 44],
        [126, 80],
        [180, 106],
        [201, 83],
        [247, 75],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 2 ? 4.5 : 4} fill={i % 2 ? '#007dff' : '#70b8ff'} />
      ))}
      <path d="M190 20Q190 12 198 12H237Q246 12 246 20V51Q246 58 237 58H224L218 65L213 58H198Q190 58 190 51Z" fill="#f3fbff" stroke="#a4cfff" />
      <text x="218" y="33" textAnchor="middle" fill="#006bff" fontSize="14">
        {'P(n)'}
      </text>
      <text x="218" y="48" textAnchor="middle" fill="#006bff" fontSize="12">
        {tr('holds')}
      </text>
    </svg>
  )
}

export function InvariantMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const [tab, setTab] = useState<Tab>('Learn'),
    [values, setValues] = useState([...binaryInvariantExample]),
    [arrayDraft, setArrayDraft] = useState(binaryInvariantExample.join(', ')),
    [target, setTarget] = useState(37),
    [targetDraft, setTargetDraft] = useState('37'),
    [cursor, setCursor] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState('1'),
    [error, setError] = useState(''),
    [selectedIndex, setSelectedIndex] = useState<number | null>(null),
    [modal, setModal] = useState<Modal>(null),
    [checked, setChecked] = useState([true, false, false]),
    [k, setK] = useState(4),
    [insertionInput, setInsertionInput] = useState([...insertionInvariantExample]),
    [insertionDraft, setInsertionDraft] = useState(insertionInvariantExample.join(', ')),
    [insertionCursor, setInsertionCursor] = useState(0),
    [insertionPlaying, setInsertionPlaying] = useState(false),
    [insertionError, setInsertionError] = useState(''),
    [prediction, setPrediction] = useState(''),
    [feedback, setFeedback] = useState(''),
    [quiz, setQuiz] = useState(''),
    [quizFeedback, setQuizFeedback] = useState(''),
    [done, setDone] = useState<string[]>([]),
    [notes, setNotes] = usePersistentState('induction-invariant-notes', '', persistentString)
  const dialogRef = useRef<HTMLDialogElement>(null),
    trace = binaryInvariantTrace(values, target),
    frame = trace.frames[cursor],
    insertion = insertionInvariantTrace(insertionInput),
    sortFrame = insertion.frames[insertionCursor],
    sum = inductionSumExample(k)
  function mark(key: string) {
    setDone((old) => (old.includes(key) ? old : [...old, key]))
  }
  useEffect(() => {
    if (!playing || cursor >= trace.frames.length - 1) return
    const timer = window.setTimeout(
      () => {
        setCursor(cursor + 1)
        setSelectedIndex(null)
        if (cursor + 1 === trace.frames.length - 1) {
          setPlaying(false)
          mark('binary')
        }
      },
      850 / Number(speed),
    )
    return () => clearTimeout(timer)
  }, [playing, cursor, trace.frames.length, speed])
  useEffect(() => {
    if (!insertionPlaying || insertionCursor >= insertion.frames.length - 1) return
    const timer = window.setTimeout(() => {
      setInsertionCursor(insertionCursor + 1)
      if (insertionCursor + 1 === insertion.frames.length - 1) {
        setInsertionPlaying(false)
        mark('insertion')
      }
    }, 700)
    return () => clearTimeout(timer)
  }, [insertionPlaying, insertionCursor, insertion.frames.length])
  useEffect(() => {
    if (modal) {
      if (!dialogRef.current?.open) dialogRef.current?.showModal()
    } else dialogRef.current?.close()
  }, [modal])
  function open(next: Tab) {
    setTab(next)
    setPlaying(false)
    setFeedback('')
  }
  function pick(next: number) {
    setCursor(next)
    setPlaying(false)
    setSelectedIndex(null)
    setFeedback('')
    if (next === trace.frames.length - 1) mark('binary')
  }
  function changeTarget(raw: string) {
    setTargetDraft(raw)
    if (!raw.trim() || !Number.isFinite(Number(raw)) || Math.abs(Number(raw)) > 1e6) {
      setError('Use a finite target between −1000000 and 1000000.')
      return
    }
    setTarget(Number(raw))
    setCursor(0)
    setPlaying(false)
    setSelectedIndex(null)
    setFeedback('')
    setError('')
  }
  function loadSize(raw: string) {
    const n = Number(raw),
      next = n === 32 ? Array.from({ length: 32 }, (_, i) => i * 3 + 1) : binaryInvariantExample.slice(0, n)
    setValues(next)
    setArrayDraft(next.join(', '))
    setCursor(0)
    setPlaying(false)
    setSelectedIndex(null)
    setError('')
    setFeedback('')
  }
  function applyArray() {
    try {
      const next = parseInvariantArray(arrayDraft)
      binaryInvariantTrace(next, target)
      setValues(next)
      setCursor(0)
      setPlaying(false)
      setSelectedIndex(null)
      setError('')
      setFeedback('')
    } catch (e) {
      setError((e as Error).message)
    }
  }
  function applyInsertion() {
    try {
      const next = parseInvariantArray(insertionDraft)
      insertionInvariantTrace(next)
      setInsertionInput(next)
      setInsertionCursor(0)
      setInsertionPlaying(false)
      setInsertionError('')
    } catch (e) {
      setInsertionError((e as Error).message)
    }
  }
  function predict() {
    if (frame.status !== 'compare') {
      setFeedback('Reset the search before predicting a comparison.')
      return
    }
    const expected = values[frame.mid!] === target ? 'found' : values[frame.mid!] < target ? 'right' : 'left',
      correct = prediction === expected
    setFeedback(
      correct
        ? `Correct. Compare ${values[frame.mid!]} with ${target}: ${expected === 'found' ? 'return this midpoint' : expected === 'right' ? 'set low = mid + 1' : 'set high = mid − 1'}.`
        : 'Not yet. Compare A[mid] with the target and use the sorted-array precondition.',
    )
    if (correct) mark('binary')
  }
  function showInduction(index: number) {
    setModal({ kind: 'induction', index })
    mark(['base', 'hypothesis', 'step'][index])
    setPlaying(false)
  }
  const pointers = [
      { name: 'low', index: frame.low },
      { name: 'mid', index: frame.mid },
      { name: 'high', index: frame.high },
    ].filter((p) => p.index !== null && p.index >= 0 && p.index < values.length),
    overlap = new Set(pointers.map((p) => p.index)).size !== pointers.length
  return (
    <div className="mom-page invariant-page target-visual" data-target="9">
      <MockupLessonChrome
        {...props}
        title={tr('Induction and Loop Invariants')}
        description={
          'Prove initialization, preservation, termination and the postcondition. Learn how to\nuse mathematical induction and loop invariants to prove correctness of algorithms.'
        }
        heroIcon={<Sigma />}
        decoration={<HeroArt />}
        progress={{ completed: done.length, total: 6 }}
        startLabel="Continue learning"
        searchPlaceholder="Search topics, examples, or practice problems..."
        onStart={() => open('Visualize')}
        badges={
          <>
            <span>
              <BarChart3 />
              {tr('Concepts & Intuition')}
            </span>
            <span>
              <FileText />
              {tr('Worked Examples')}
            </span>
            <span>
              <Play />
              {tr('Interactive Visualizations')}
            </span>
            <span>
              <Trophy />
              {tr('Practice & Quiz')}
            </span>
          </>
        }
      />
      <nav className="mom-tabs iv-tabs" aria-label={tr('Algorithm sections')}>
        {tabs.map((name, i) => {
          const Icon = tabIcons[i]
          return (
            <button key={name} aria-pressed={tab === name} onClick={() => open(name)}>
              <Icon size={20} />
              {tr(name)}
            </button>
          )
        })}
      </nav>
      {error && (
        <p className="iv-error" role="alert">
          {tr(error)}
        </p>
      )}
      {(tab === 'Learn' || tab === 'Visualize') && (
        <>
          {tab === 'Visualize' && (
            <Panel
              title={tr('Binary-search invariant laboratory')}
              description="Edit a sorted array, compare the interval bounds, then justify each transition."
              className="iv-lab"
              icon={<LineChart />}
            >
              <div className="iv-lab-grid">
                <label>
                  {tr('Sorted array')}
                  <textarea aria-label={tr('Binary search array')} rows={3} value={arrayDraft} onChange={(e) => setArrayDraft(e.target.value)} />
                </label>
                <div>
                  <button className="iv-primary" onClick={applyArray}>
                    {tr('Apply sorted array')}
                  </button>
                  <p className="iv-trace-status" role="status">
                    {tr('Step ')}
                    {cursor + 1}/{trace.frames.length} · {tr('candidate count: ')}
                    {frame.variant} · {tr('comparisons completed: ')}
                    {frame.comparisons}
                  </p>
                  <p>
                    {tr('Invariant: ')}
                    {tr(frame.invariantHolds ? 'holds' : 'fails')} · {tr('Result: ')}
                    {frame.result === null ? tr('not revealed') : frame.result === -1 ? tr('not found') : tr('index ') + frame.result}
                  </p>
                  <label>
                    {tr('Selected search step')}
                    <input
                      aria-label={tr('Selected binary search step')}
                      type="range"
                      min={0}
                      max={trace.frames.length - 1}
                      value={cursor}
                      onChange={(e) => pick(Number(e.target.value))}
                    />
                  </label>
                </div>
              </div>
              <div className="iv-trace-list">
                {trace.frames.map((f, i) => (
                  <button key={i} aria-pressed={cursor === i} aria-label={tr(`Inspect binary search step ${i + 1}`)} onClick={() => pick(i)}>
                    {i + 1}. [{f.low}, {f.high}] · {tr(f.status)}
                  </button>
                ))}
              </div>
              <p>
                {tr(
                  'The upper midpoint is low + ceil((high − low)/2). Either midpoint convention works. A failed comparison strictly reduces max(0, high − low + 1); a match returns immediately. The array must remain sorted and unchanged.',
                )}
              </p>
            </Panel>
          )}
          <div className="iv-main-grid">
            <Panel
              className="iv-workflow"
              title={tr('Induction Workflow')}
              description="To prove a statement P(n) for all n ≥ n₀ using mathematical induction."
              icon={<GitFork />}
            >
              <div className="iv-induction-cards">
                {inductionTitles.map((title, i) => (
                  <div className={`iv-induction-card iv-tone-${i}`} key={title}>
                    <div className="iv-card-title">
                      <b>{i + 1}</b>
                      <h3>{tr(title)}</h3>
                    </div>
                    <p>
                      {tr(
                        i === 0
                          ? 'Prove P(n₀) is true\n(e.g., n = 0 or 1).'
                          : i === 1
                            ? 'Assume P(k) is true\nfor an arbitrary k ≥ n₀.'
                            : 'Using P(k), prove\nP(k + 1) is true.',
                      )}
                    </p>
                    <button onClick={() => showInduction(i)}>
                      {i === 0 ? (
                        <>
                          {tr('Verify ')}
                          <i>{'P(n₀).'}</i>
                        </>
                      ) : i === 1 ? (
                        <>
                          {tr('Assume ')}
                          <i>{'P(k).'}</i>
                        </>
                      ) : (
                        <>
                          {tr('Show ')}
                          <i>{'P(k) ⇒ P(k + 1).'}</i>
                        </>
                      )}
                    </button>
                    {i < 2 && <ArrowRight className="iv-workflow-arrow" />}
                  </div>
                ))}
              </div>
            </Panel>
            <Panel
              className="iv-checker"
              title={tr('Loop Invariant Checker')}
              description="Verify the three essential properties of a loop invariant for correctness."
              icon={<ShieldCheck />}
            >
              <table>
                <thead>
                  <tr>
                    {['Property', 'Requirement', 'Your Check'].map((s) => (
                      <th key={s}>{tr(s)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {checkerTitles.map((title, i) => {
                    const Icon = [GitFork, GitFork, Clock3][i]
                    return (
                      <tr key={title}>
                        <th>
                          <Icon />
                          {tr(title)}
                        </th>
                        <td>
                          {tr(
                            i === 0
                              ? 'Holds before the first iteration.'
                              : i === 1
                                ? 'If it holds before an iteration,\nit remains true after.'
                                : 'When the loop terminates,\ninvariant + exit condition ⇒ postcondition.',
                          )}
                        </td>
                        <td>
                          <button
                            className={checked[i] ? 'verified' : i === 1 ? 'to-verify' : 'not-checked'}
                            aria-label={tr(`Review ${title.toLowerCase()} obligation`)}
                            onClick={() => setModal({ kind: 'checker', index: i })}
                          >
                            {checked[i] ? <Check /> : <MoreHorizontal />}
                            {tr(checked[i] ? 'Verified' : i === 1 ? 'To verify' : 'Not checked')}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Panel>
            <Panel
              className="iv-binary"
              title={tr('Binary Search Interval Visualizer')}
              description="Invariant: if the target exists, a candidate occurrence remains within [low, high]."
              icon={<BarChart3 />}
            >
              <div className="iv-binary-inputs">
                <label>
                  {tr('Target:')}
                  <input
                    aria-label={tr('Binary search target')}
                    type="number"
                    step="any"
                    min={-1e6}
                    max={1e6}
                    value={targetDraft}
                    onChange={(e) => changeTarget(e.target.value)}
                  />
                </label>
                <label>
                  {tr('Array size:')}
                  <select
                    aria-label={tr('Binary search array size')}
                    value={[0, 4, 8, 16, 32].includes(values.length) ? String(values.length) : 'custom'}
                    onChange={(e) => loadSize(e.target.value)}
                  >
                    {![0, 4, 8, 16, 32].includes(values.length) && (
                      <option value="custom" disabled>
                        {tr('Custom')}
                      </option>
                    )}
                    {[0, 4, 8, 16, 32].map((n) => (
                      <option value={n} key={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="iv-array-scroll" tabIndex={0} role="region" aria-label={tr('Binary search array, scroll horizontally when needed')}>
                <div
                  className={`iv-array-content ${values.length > 16 ? 'iv-large-array' : ''}`}
                  style={{ minWidth: values.length * Math.max(37, ...values.map((value) => String(value).length * 8 + 12)) }}
                >
                  {values.length ? (
                    <>
                      <div className="iv-array" style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0,1fr))` }}>
                        {values.map((value, i) => (
                          <div className="iv-cell-column" key={i}>
                            <span>{i}</span>
                            <button
                              aria-label={tr(`Inspect array index ${i}, value ${value}`)}
                              className={`${frame.candidates.includes(i) ? 'candidate' : 'discarded'} ${frame.mid === i ? 'midpoint' : ''} ${selectedIndex === i ? 'inspected' : ''}`}
                              onClick={() => setSelectedIndex(i)}
                            >
                              {value}
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className={`iv-pointers ${overlap ? 'overlap' : ''}`}>
                        {pointers.map((p) => (
                          <div
                            className={`iv-pointer ${p.name}`}
                            key={p.name}
                            style={overlap ? undefined : { left: `${((p.index! + 0.5) * 100) / values.length}%` }}
                          >
                            {!overlap && <ArrowUp />}
                            <b>{p.name}</b>
                            <span>({p.index})</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="iv-empty">{tr('Empty array: low = 0, high = −1. No candidate remains.')}</p>
                  )}
                </div>
              </div>
              <div className="iv-binary-footer">
                <p className="iv-search-explanation" role="status">
                  <Lightbulb />
                  {selectedIndex !== null
                    ? tr(
                        `A[${selectedIndex}] = ${values[selectedIndex]}. This index is ${frame.candidates.includes(selectedIndex) ? 'inside' : 'outside'} the current candidate interval.`,
                      )
                    : frame.status === 'found'
                      ? tr(`Found target ${target} at index ${frame.result}. Returning this matching index establishes the postcondition.`)
                      : frame.status === 'missing'
                        ? tr('The interval is empty. By the invariant, the target does not occur in the array; return −1.')
                        : tr(
                            'At each step, compare target with A[mid]. An unsuccessful comparison shrinks the interval, maintaining the invariant that a candidate occurrence (if any) remains within [low, high].',
                          )}
                </p>
                <div className="iv-player">
                  <button aria-label={tr('Previous binary search step')} disabled={!cursor} onClick={() => pick(cursor - 1)}>
                    <SkipBack />
                  </button>
                  <button
                    className="iv-play"
                    aria-label={tr(playing ? 'Pause binary search' : 'Play binary search')}
                    onClick={() => {
                      if (playing) {
                        setPlaying(false)
                        return
                      }
                      if (trace.frames.length === 1) {
                        mark('binary')
                        return
                      }
                      if (cursor === trace.frames.length - 1) setCursor(0)
                      setPlaying(true)
                    }}
                  >
                    {playing ? <Pause /> : <Play />}
                  </button>
                  <button aria-label={tr('Next binary search step')} disabled={cursor === trace.frames.length - 1} onClick={() => pick(cursor + 1)}>
                    <SkipForward />
                  </button>
                  <select aria-label={tr('Binary search playback speed')} value={speed} onChange={(e) => setSpeed(e.target.value)}>
                    {['0.5', '1', '2'].map((n) => (
                      <option key={n} value={n}>
                        {`${n}x`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Panel>
            <Panel
              className="iv-worked"
              title={tr('Worked Example: Insertion Sort Invariant')}
              description="Loop invariant: before iteration i, the prefix A[0..i) is sorted and contains exactly its original elements."
              icon={<FileText />}
            >
              <button
                className="iv-view-solution"
                onClick={() => {
                  setModal({ kind: 'insertion' })
                  setPlaying(false)
                }}
              >
                {tr('View full solution')}
                <ArrowRight />
              </button>
              <ol>
                {[
                  ['Initialization:', 'A[0..0) is trivially sorted.'],
                  ['Maintenance:', 'Inserting A[i] into the sorted prefix preserves the property.'],
                  ['Termination:', 'When i = n, the entire array is sorted.'],
                ].map(([a, b], i) => (
                  <li key={a}>
                    <b>{i + 1}</b>
                    <p>
                      <strong>{tr(a)}</strong> {tr(b)}
                    </p>
                  </li>
                ))}
              </ol>
              <div className="iv-correct">
                <CheckCircle2 />
                {tr('Therefore, the algorithm is correct.')}
              </div>
            </Panel>
          </div>
          <div className="iv-bottom-grid">
            <Panel className="iv-mistakes" title={tr('Common Mistakes')} icon={<AlertTriangle />}>
              <ul>
                {mistakes.map(([text], i) => (
                  <li key={text}>
                    <X />
                    <button onClick={() => setModal({ kind: 'mistake', index: i })}>{tr(text)}</button>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel className="iv-vocabulary" title={tr('Proof Vocabulary')} icon={<BookOpen />}>
              <div className="iv-vocab-grid">
                {definitions.map(([name, short], i) => (
                  <button key={name} onClick={() => setModal({ kind: 'vocabulary', index: i })}>
                    <b>{tr(name)}</b>
                    <span>{tr(short)}</span>
                  </button>
                ))}
              </div>
            </Panel>
            <Panel className="iv-pro-tip" title={tr('Pro Tip')} icon={<Target />}>
              <p>{tr('Choose an invariant that is strong enough to imply the postcondition, but easy to show initialization and maintenance.')}</p>
              <Lightbulb className="iv-tip-bulb" />
              <button onClick={() => setModal({ kind: 'examples' })}>
                {tr('See more examples')}
                <ArrowRight />
              </button>
            </Panel>
          </div>
          <details className="iv-theory">
            <summary>{tr('Read the complete correctness argument and assumptions')}</summary>
            <div>
              <article>
                <h2>{tr('Partial correctness and total correctness')}</h2>
                <p>
                  {tr(
                    'A loop invariant is a statement at a precise program point, usually just before evaluating the guard. Initialization establishes it; maintenance reestablishes it after a full iteration. When the guard becomes false, combine the invariant with the exit condition to prove the postcondition. This is partial correctness. For total correctness, also show the algorithm terminates using a decreasing nonnegative integer variant or another well-founded measure.',
                  )}
                </p>
                <h3>{tr('Binary search')}</h3>
                <p>
                  {tr(
                    'Precondition: A is sorted in nondecreasing order and remains unchanged. The invariant is: if the target occurs in A, some matching index remains in [low, high]. Initially the interval is the whole array. If A[mid] < target, sortedness excludes every index ≤ mid, so low = mid + 1 is safe. If A[mid] > target, discard every index ≥ mid. Each unsuccessful iteration strictly decreases the candidate count max(0, high − low + 1). A match returns a valid index immediately; an empty interval and the invariant imply absence. Duplicates are allowed; this version returns a matching occurrence, not necessarily the first.',
                  )}
                </p>
              </article>
              <article>
                <h2>{tr('Induction and insertion sort')}</h2>
                <p>
                  {tr(
                    'For induction, a numerical example illustrates the algebra but does not prove the general theorem. Prove the base case, assume P(k) for an arbitrary k in the domain, and derive P(k + 1). Mathematical induction then covers every natural-number input. Recursive correctness similarly needs smaller recursive inputs and a correct combine step.',
                  )}
                </p>
                <p>
                  {tr(
                    'Insertion sort here starts at i = 0. At each outer-loop boundary, A[0..i) is sorted and is a permutation of the original first i elements; the entire array also preserves the original multiset. The empty prefix initializes the invariant. Holding the key, shifting larger elements, then reinserting the key preserves the element multiset and extends the sorted prefix by one. The variant n − i decreases to zero; the inner-loop variant j + 1 decreases during shifts. At exit i = n, so the sorted permutation is the entire output. The displayed snapshots are completed outer-loop boundaries; while shifting, the held key accounts for the temporary hole.',
                  )}
                </p>
              </article>
            </div>
          </details>
        </>
      )}
      {(tab === 'Practice' || tab === 'Quiz') && (
        <Panel
          className="iv-lab"
          title={tr('Predict and justify the next search decision')}
          description="Use sortedness and the invariant instead of guessing from the final answer."
          icon={<Trophy />}
        >
          <p>
            {tr('Candidate interval: ')}[{frame.low}, {frame.high}] · {tr('target = ')}
            {target}
            {frame.mid !== null ? ` · A[${frame.mid}] = ${values[frame.mid]}` : ''}
          </p>
          <div className="iv-controls">
            <button onClick={() => pick(0)}>{tr('Reset prediction')}</button>
            <select
              aria-label={tr('Predicted binary search decision')}
              value={prediction}
              onChange={(e) => {
                setPrediction(e.target.value)
                setFeedback('')
              }}
            >
              <option value="">{tr('Choose a decision')}</option>
              <option value="left">{tr('Search left: high = mid − 1')}</option>
              <option value="right">{tr('Search right: low = mid + 1')}</option>
              <option value="found">{tr('Return the matching midpoint')}</option>
            </select>
            <button disabled={frame.status !== 'compare' || !prediction} onClick={predict}>
              {tr('Check prediction')}
            </button>
            <button disabled={cursor === trace.frames.length - 1} onClick={() => pick(cursor + 1)}>
              {tr('Reveal next step')}
            </button>
          </div>
          {feedback && (
            <p className="iv-prediction-feedback" role="status">
              {tr(feedback)}
            </p>
          )}
          {tab === 'Quiz' && (
            <div className="iv-quiz">
              <h3>{tr('Which is a complete sorting postcondition?')}</h3>
              {[
                ['sorted', 'The output is sorted.'],
                ['permutation', 'The output is a sorted permutation of the input.'],
                ['sample', 'The algorithm passes a few examples.'],
              ].map(([value, label]) => (
                <label key={value}>
                  <input type="radio" name="invariant-quiz" value={value} checked={quiz === value} onChange={(e) => setQuiz(e.target.value)} />
                  {tr(label)}
                </label>
              ))}
              <button
                onClick={() => {
                  setQuizFeedback(
                    quiz === 'permutation'
                      ? 'Correct. Sortedness and element preservation are both required; termination establishes total correctness.'
                      : 'Not yet. Sorting must preserve the original multiset as well as order the output.',
                  )
                }}
              >
                {tr('Check answer')}
              </button>
              {quizFeedback && (
                <p className="iv-quiz-feedback" role="status">
                  {tr(quizFeedback)}
                </p>
              )}
            </div>
          )}
        </Panel>
      )}
      {tab === 'Notes' && (
        <Panel className="iv-lab" title={tr('Your induction and invariant notes')} description="Saved automatically in this browser." icon={<FileText />}>
          <label>
            {tr('Record the precondition, invariant, variant and postcondition.')}
            <textarea aria-label={tr('Induction and invariant notes')} rows={12} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
        </Panel>
      )}
      <dialog
        className="iv-dialog"
        aria-label={tr('Proof detail')}
        ref={dialogRef}
        onClose={() => {
          setModal(null)
          setInsertionPlaying(false)
        }}
      >
        <button
          className="iv-dialog-close"
          aria-label={tr('Close proof detail')}
          onClick={() => {
            setModal(null)
            setInsertionPlaying(false)
          }}
        >
          <X />
        </button>
        {modal?.kind === 'induction' && (
          <>
            <h2>
              {tr(inductionTitles[modal.index!])}: {tr('sum of the first n natural numbers')}
            </h2>
            <p>{tr('Claim P(n): 0 + 1 + ⋯ + n = n(n + 1)/2 for every integer n ≥ 0.')}</p>
            <div className="iv-proof-tabs">
              {inductionTitles.map((name, i) => (
                <button key={name} aria-pressed={modal.index === i} onClick={() => showInduction(i)}>
                  {tr(name)}
                </button>
              ))}
            </div>
            {modal.index === 0 ? (
              <>
                <h3>{tr('Base case n₀ = 0')}</h3>
                <p className="iv-algebra">{'0 = 0(0 + 1)/2 = 0 ✓'}</p>
                <p>{tr('The empty positive-term sum is zero, so P(0) holds.')}</p>
              </>
            ) : modal.index === 1 ? (
              <>
                <h3>{tr('Induction hypothesis for an arbitrary k ≥ 0')}</h3>
                <p className="iv-algebra">{'0 + 1 + ⋯ + k = k(k + 1)/2'}</p>
                <p>
                  {tr(
                    'Assume this identity for an arbitrary k. The next step must derive P(k + 1) using this assumption; a particular numerical k is only an illustration.',
                  )}
                </p>
              </>
            ) : (
              <>
                <h3>{tr('Inductive step')}</h3>
                <p className="iv-algebra">{'S(k + 1) = S(k) + (k + 1)\n= k(k + 1)/2 + (k + 1)\n= (k + 1)(k + 2)/2'}</p>
                <p>{tr('This is exactly P(k + 1). Together with P(0), induction proves the formula for all natural n.')}</p>
              </>
            )}
            <label className="iv-k-input">
              {tr('Illustrate with k = ')}
              <input
                aria-label={tr('Induction example k')}
                type="number"
                min={0}
                max={1000}
                step={1}
                value={k}
                onChange={(e) => {
                  const n = Number(e.target.value)
                  if (e.target.value.trim() && Number.isInteger(n) && n >= 0 && n <= 1000) setK(n)
                }}
              />
            </label>
            <p className="iv-induction-numeric" role="status">
              {tr('Illustration: ')}
              {`S(${k}) = ${sum.assumed}; S(${k + 1}) = ${sum.assumed} + ${k + 1} = ${sum.next} = (${k + 1} × ${k + 2})/2.`}
            </p>
          </>
        )}
        {modal?.kind === 'checker' && (
          <>
            <h2>
              {tr(checkerTitles[modal.index!])} {tr('obligation for binary search')}
            </h2>
            <p>
              {tr(
                'Precondition: the array is sorted and unchanged. Invariant: if a matching value exists, at least one matching index remains in the current interval.',
              )}
            </p>
            <p className="iv-obligation-proof">
              {tr(
                modal.index === 0
                  ? 'Set low = 0 and high = n − 1. Every input index is in this interval, so any matching occurrence is included. With an empty array there is no matching occurrence and the invariant is vacuously true.'
                  : modal.index === 1
                    ? 'Assume the invariant before a comparison. If A[mid] < target, every value at an index ≤ mid is too small because the array is sorted. Retaining [mid + 1, high] cannot discard every match. The symmetric argument justifies high = mid − 1 when A[mid] > target. If equal, return a matching index.'
                    : 'If the guard low ≤ high is false, no candidate remains. The invariant then implies that the target is absent, so −1 is correct. A successful comparison returns a matching index. On every unsuccessful backedge, the nonnegative candidate count high − low + 1 strictly decreases; this proves the loop terminates.',
              )}
            </p>
            <p className="iv-current-evidence">
              {tr('Current snapshot: ')}
              {`low = ${frame.low}, high = ${frame.high}, `}
              {tr('candidate count = ')}
              {frame.variant}, {tr('invariant ')}
              {tr(frame.invariantHolds ? 'holds' : 'fails')}. {tr('A finite trace illustrates the obligation; the argument above covers every valid input.')}
            </p>
            <button
              className="iv-primary"
              onClick={() => {
                const next = checked.map((value, i) => (i === modal.index ? true : value))
                setChecked(next)
                if (next.every(Boolean)) mark('checker')
                setModal(null)
              }}
            >
              {tr('Verify this obligation')}
            </button>
          </>
        )}
        {modal?.kind === 'insertion' && (
          <>
            <h2>{tr('Insertion sort: full invariant solution')}</h2>
            <p>
              {tr(
                'At each outer-loop boundary, prefix A[0..i) is sorted and contains exactly the original first i elements. The full array preserves the original multiset.',
              )}
            </p>
            <label>
              {tr('Editable insertion-sort input')}
              <textarea aria-label={tr('Insertion sort input')} rows={2} value={insertionDraft} onChange={(e) => setInsertionDraft(e.target.value)} />
            </label>
            <button onClick={applyInsertion}>{tr('Apply insertion array')}</button>
            {insertionError && (
              <p className="iv-error" role="alert">
                {tr(insertionError)}
              </p>
            )}
            <div className="iv-insertion-array">
              {sortFrame.values.map((value, i) => (
                <span key={i} className={i < sortFrame.i ? 'sorted' : ''}>
                  {value}
                </span>
              ))}
              {!sortFrame.values.length && <span>∅</span>}
            </div>
            <p className="iv-insertion-status" role="status">
              {`i = ${sortFrame.i}/${insertionInput.length} · `}
              {tr('sorted prefix length: ')}
              {sortFrame.i} · {tr('variant n − i = ')}
              {sortFrame.variant}
            </p>
            <div className="iv-insertion-checks">
              {[
                [tr('Prefix sorted'), sortFrame.prefixSorted],
                [tr('Prefix elements preserved'), sortFrame.prefixPermutation],
                [tr('Whole multiset preserved'), sortFrame.wholePermutation],
              ].map(([label, holds]) => (
                <span key={String(label)}>
                  {holds ? <CheckCircle2 /> : <X />}
                  {label}
                </span>
              ))}
            </div>
            <ol className="iv-insertion-moves">
              {sortFrame.moves.length ? (
                sortFrame.moves.map((move) => <li key={move}>{tr(move)}</li>)
              ) : (
                <li>{tr('Initialize i = 0; the empty prefix is sorted. No elements have changed.')}</li>
              )}
            </ol>
            <div className="iv-controls">
              <button
                disabled={!insertionCursor}
                onClick={() => {
                  setInsertionCursor(insertionCursor - 1)
                  setInsertionPlaying(false)
                }}
              >
                {tr('Previous insertion step')}
              </button>
              <button
                disabled={insertionCursor === insertion.frames.length - 1}
                onClick={() => {
                  setInsertionCursor(insertionCursor + 1)
                  setInsertionPlaying(false)
                  if (insertionCursor + 1 === insertion.frames.length - 1) mark('insertion')
                }}
              >
                {tr('Next insertion step')}
              </button>
              <button
                disabled={insertion.frames.length === 1}
                onClick={() => {
                  if (insertionCursor === insertion.frames.length - 1) setInsertionCursor(0)
                  setInsertionPlaying(!insertionPlaying)
                }}
              >
                {tr(insertionPlaying ? 'Pause insertion sort' : 'Play insertion sort')}
              </button>
              <button
                onClick={() => {
                  setInsertionCursor(0)
                  setInsertionPlaying(false)
                }}
              >
                {tr('Reset insertion sort')}
              </button>
            </div>
            {sortFrame.i === insertionInput.length && (
              <p className="iv-insertion-result">
                {tr('At exit i = n: the entire output is a sorted permutation. Total correctness also follows from the decreasing variants n − i and j + 1.')}
              </p>
            )}
            <pre>
              {'i ← 0\nwhile i < n:\n  key ← A[i]; j ← i − 1\n  while j ≥ 0 and A[j] > key:\n    A[j + 1] ← A[j]; j ← j − 1\n  A[j + 1] ← key\n  i ← i + 1'}
            </pre>
          </>
        )}
        {modal?.kind === 'vocabulary' && (
          <>
            <h2>{tr(definitions[modal.index!][0])}</h2>
            <p>{tr(definitions[modal.index!][2])}</p>
            <p>{tr('For a complete correctness proof, connect the precondition, invariant, exit condition, postcondition and a termination argument.')}</p>
          </>
        )}
        {modal?.kind === 'mistake' && (
          <>
            <h2>{tr('Correct the proof mistake')}</h2>
            <h3>{tr(mistakes[modal.index!][0])}</h3>
            <p>{tr(mistakes[modal.index!][1])}</p>
          </>
        )}
        {modal?.kind === 'examples' && (
          <>
            <h2>{tr('Explore more proof examples')}</h2>
            <div className="iv-example-options">
              <button
                onClick={() => {
                  setValues([...binaryInvariantExample])
                  setArrayDraft(binaryInvariantExample.join(', '))
                  changeTarget('91')
                  setModal(null)
                  open('Visualize')
                }}
              >
                {tr('Binary search: find the last value')}
              </button>
              <button
                onClick={() => {
                  setValues([...binaryInvariantExample])
                  setArrayDraft(binaryInvariantExample.join(', '))
                  changeTarget('38')
                  setModal(null)
                  open('Visualize')
                }}
              >
                {tr('Binary search: prove absence')}
              </button>
              <button
                onClick={() => {
                  setInsertionInput([3, 2, 2, -1])
                  setInsertionDraft('3, 2, 2, -1')
                  setInsertionCursor(0)
                  setModal({ kind: 'insertion' })
                }}
              >
                {tr('Insertion sort: duplicates and negatives')}
              </button>
              <button onClick={() => showInduction(0)}>{tr('Induction: triangular-number formula')}</button>
            </div>
          </>
        )}
      </dialog>
    </div>
  )
}
