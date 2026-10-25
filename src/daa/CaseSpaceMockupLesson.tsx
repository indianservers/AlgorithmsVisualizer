// @localized-render
import { useEffect, useId, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Box,
  Check,
  ChevronRight,
  Clock3,
  Database,
  FileText,
  Layers3,
  Lightbulb,
  LineChart,
  List,
  Pause,
  Pencil,
  Play,
  Settings,
  Trophy,
  X,
  Zap,
} from 'lucide-react'
import { tx, useLocaleRender } from '../i18n/render'
import { usePersistentState, persistentString } from '../hooks/usePersistentState'
import { MockupLessonChrome, type MockupPageProps } from './MockupLessonChrome'
import {
  caseComparison,
  caseSearch,
  integerInputSize,
  memoryAnalysis,
  parseCaseArray,
  stringInputSize,
  type MemoryMode,
  type SearchAlgorithm,
} from './caseSpaceModel'
import './case-space-mockup.css'

const tr = (s: string) => tx(s, 'studios')
const tabs = ['Learn', 'Visualize', 'Practice', 'Quiz', 'Notes'] as const,
  tabIcons = [BookOpen, LineChart, Pencil, Trophy, FileText]
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
    <section className={`mom-panel cs-panel ${className}`}>
      <header>
        <span className="cs-icon">{icon}</span>
        <div>
          <h2>{tr(title)}</h2>
          {description && <p>{tr(description)}</p>}
        </div>
      </header>
      {children}
    </section>
  )
}
function Bars() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect x="2" y="20" width="8" height="12" rx="3" />
      <rect x="12" y="11" width="8" height="21" rx="3" />
      <rect x="22" y="3" width="8" height="29" rx="3" />
    </svg>
  )
}
function HeroArt() {
  const id = useId()
  return (
    <svg className="cs-hero-art" viewBox="0 0 260 132" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x2="0" y2="1">
          <stop stopColor="#91c1ff" />
          <stop offset="1" stopColor="#d7edff" stopOpacity=".4" />
        </linearGradient>
      </defs>
      <path d="M0 132C27 100 30-4 59 51S113 23 144 62 194 5 225 30 251 18 260 24V132Z" fill={`url(#${id})`} />
      <path d="M0 132C40 65 43 79 68 103S126 51 164 60 217 133 260 65" fill="none" stroke="#0075ff" strokeWidth="1.6" />
      <circle cx="164" cy="60" r="6" fill="#0075ff" stroke="white" strokeWidth="2" />
      <rect x="160" y="12" width="50" height="33" rx="9" fill="#e1efff" stroke="#d3e7ff" />
      <text x="185" y="34" textAnchor="middle" fill="#0073ff" fontSize="16">
        {'f(n)'}
      </text>
    </svg>
  )
}
const format = (n: number) => `${Number(n.toFixed(4)) === n ? '' : '≈ '}${Number(n.toFixed(4))}`
export function CaseSpaceMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const [tab, setTab] = useState<(typeof tabs)[number]>('Learn'),
    [algorithm, setAlgorithm] = useState<SearchAlgorithm>('linear'),
    [values, setValues] = useState([5, 8, 3, 7, 9]),
    [arrayDraft, setArrayDraft] = useState('5, 8, 3, 7, 9'),
    [arrayError, setArrayError] = useState(''),
    [inputMode, setInputMode] = useState<'integer' | 'array' | 'string'>('integer'),
    [integerDraft, setIntegerDraft] = useState('1024'),
    [integerValue, setIntegerValue] = useState('1024'),
    [integerError, setIntegerError] = useState(''),
    [text, setText] = useState('ALGORITHM'),
    [memoryMode, setMemoryMode] = useState<MemoryMode>('iterative'),
    [view, setView] = useState('full'),
    [target, setTarget] = useState(3),
    [targetDraft, setTargetDraft] = useState('3'),
    [targetError, setTargetError] = useState(''),
    [cursor, setCursor] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(450),
    [prediction, setPrediction] = useState(''),
    [feedback, setFeedback] = useState(''),
    [quiz, setQuiz] = useState(''),
    [activities, setActivities] = useState<string[]>([])
  const [notes, setNotes] = usePersistentState('case-time-space-notes', '', persistentString)
  const comparison = caseComparison(values, algorithm),
    input = comparison.input,
    trace = caseSearch(input, target, algorithm),
    integer = integerInputSize(integerValue),
    memory = memoryAnalysis(values.length, memoryMode, algorithm),
    active = trace.steps[cursor - 1],
    done = cursor === trace.steps.length
  const name = algorithm === 'linear' ? 'Linear Search' : 'Binary Search',
    n = input.length
  const mark = (key: string) => setActivities((previous) => (previous.includes(key) ? previous : [...previous, key]))
  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => setCursor((c) => Math.min(trace.steps.length, c + 1)), speed)
    return () => window.clearInterval(timer)
  }, [playing, speed, trace.steps.length])
  useEffect(() => {
    if (playing && done) {
      const timer = window.setTimeout(() => setPlaying(false), 0)
      return () => window.clearTimeout(timer)
    }
  }, [playing, done])
  function reset() {
    setCursor(0)
    setPlaying(false)
  }
  function changeAlgorithm(value: SearchAlgorithm) {
    setAlgorithm(value)
    reset()
    mark('case')
  }
  function applyArray() {
    try {
      setValues(parseCaseArray(arrayDraft))
      setArrayError('')
      reset()
      mark('input')
    } catch (e) {
      setArrayError((e as Error).message)
    }
  }
  function applyTarget() {
    const next = Number(targetDraft)
    if (!targetDraft.trim() || !Number.isFinite(next) || Math.abs(next) > 10000) {
      setTargetError('Enter a finite target from −10000 to 10000.')
      return
    }
    setTarget(next)
    setTargetError('')
    reset()
    mark('case')
  }
  function openCase(index: number) {
    const next = index === 0 ? comparison.bestTarget : index === 2 ? comparison.worstTarget : input[Math.floor((n - 1) / 2)]
    setTarget(next)
    setTargetDraft(String(next))
    reset()
    setTab('Visualize')
    mark('case')
  }
  const algorithmOptions = (
    <>
      <option value="linear">{tr('Linear Search')}</option>
      <option value="binary">{tr('Binary Search (sorted)')}</option>
    </>
  )
  const cases = (
    <Panel
      title={tr('1. Best, Average and Worst Case Comparison')}
      description="See how the same algorithm can perform differently depending on the input."
      icon={<LineChart />}
      className="cs-cases"
    >
      <label className="cs-case-algorithm">
        {tr('Algorithm:')}
        <select aria-label={tr('Case comparison algorithm')} value={algorithm} onChange={(e) => changeAlgorithm(e.target.value as SearchAlgorithm)}>
          {algorithmOptions}
        </select>
      </label>
      <div className="cs-case-grid">
        {['Best Case', 'Average Case', 'Worst Case'].map((title, i) => (
          <article key={title} className={`cs-case-card cs-case-${i}`}>
            <button className="cs-case-title" aria-label={tr(`Explore ${title}`)} onClick={() => openCase(i)}>
              <span>{i === 0 ? <Zap /> : i === 1 ? <Bars /> : <AlertTriangle />}</span>
              <div>
                <h3>{tr(title)}</h3>
                <p>
                  {tr(
                    i === 0
                      ? algorithm === 'linear'
                        ? 'Target at first position'
                        : 'Target at the first midpoint'
                      : i === 1
                        ? 'Uniform successful targets'
                        : algorithm === 'linear'
                          ? 'Target at last position'
                          : 'Target absent; deepest path',
                  )}
                </p>
              </div>
            </button>
            <div className="cs-case-array" aria-label={tr(`${title} example array`)}>
              {input.map((value, j) => (
                <span
                  key={j}
                  className={
                    (i === 0 && j === comparison.bestIndex) ||
                    (i === 1 && algorithm === 'linear' && j === Math.floor((n - 1) / 2)) ||
                    (i === 2 && j === comparison.worstIndex)
                      ? 'highlight'
                      : ''
                  }
                >
                  {value}
                </span>
              ))}
            </div>
            <p>
              {tr('Comparisons: ')}
              <output className={i === 1 ? 'cs-average-value' : ''}>
                {i === 0
                  ? comparison.best
                  : i === 1
                    ? algorithm === 'linear'
                      ? `(n + 1) / 2 = ${format(comparison.average)}`
                      : format(comparison.average)
                    : comparison.worst}
              </output>
            </p>
            <p>
              {tr('Time: ')}
              <strong>{i === 0 ? 'Θ(1)' : i === 1 ? comparison.averageBound : comparison.worstBound}</strong>
            </p>
          </article>
        ))}
      </div>
    </Panel>
  )
  const inputSize = (
    <Panel
      title={tr('2. Input Size Model Visualizer')}
      description={
        inputMode === 'integer'
          ? 'For integers, input size is the number of bits, not the numeric value.'
          : inputMode === 'array'
            ? 'For this array model, input size is the number of stored elements.'
            : 'For this string model, input size is the number of Unicode code points.'
      }
      icon={<Box />}
      className="cs-input"
    >
      <div className="cs-input-body">
        <div className="cs-input-main">
          <div className="cs-mode-tabs" aria-label={tr('Input size model')}>
            {(['integer', 'array', 'string'] as const).map((mode) => (
              <button
                aria-pressed={inputMode === mode}
                key={mode}
                onClick={() => {
                  setInputMode(mode)
                  mark('input')
                }}
              >
                {tr(mode === 'integer' ? 'Integer Input' : mode === 'array' ? 'Array Input' : 'String Input')}
              </button>
            ))}
          </div>
          {inputMode === 'integer' ? (
            <label className="cs-input-label">
              {tr('Enter an integer (m):')}
              <input
                aria-label={tr('Integer value')}
                value={integerDraft}
                inputMode="numeric"
                onChange={(e) => {
                  setIntegerDraft(e.target.value)
                  try {
                    const parsed = integerInputSize(e.target.value)
                    setIntegerValue(parsed.decimal)
                    setIntegerError('')
                    mark('input')
                  } catch (err) {
                    setIntegerError((err as Error).message)
                  }
                }}
              />
            </label>
          ) : inputMode === 'array' ? (
            <form
              className="cs-array-size-form"
              onSubmit={(e) => {
                e.preventDefault()
                applyArray()
              }}
            >
              <input aria-label={tr('Array input values')} value={arrayDraft} onChange={(e) => setArrayDraft(e.target.value)} />
              <button>{tr('Apply')}</button>
            </form>
          ) : (
            <label className="cs-input-label cs-string-label">
              {tr('Enter text:')}
              <input
                aria-label={tr('String input text')}
                maxLength={128}
                value={text}
                onChange={(e) => {
                  setText(e.target.value)
                  mark('input')
                }}
              />
            </label>
          )}
          {integerError && inputMode === 'integer' && (
            <p role="alert">
              {tr(integerError)} {tr('The cards show the last valid value.')}
            </p>
          )}
          {arrayError && inputMode === 'array' && <p role="alert">{tr(arrayError)}</p>}
          <div className="cs-size-values">
            <div>
              <p>{tr(inputMode === 'integer' ? 'Numeric value' : inputMode === 'array' ? 'Array length' : 'String length')}</p>
              <strong className={inputMode === 'integer' && integer.decimal.length > 18 ? 'long-value' : ''}>
                {inputMode === 'integer' ? integer.formatted : inputMode === 'array' ? n : stringInputSize(text)}
              </strong>
              <small>
                {inputMode === 'integer' ? (
                  <>
                    {tr('Decimal order: ')}
                    {'10'}
                    <sup>{integer.decimalOrder}</sup>
                  </>
                ) : (
                  tr(inputMode === 'array' ? 'Count elements, not their values.' : 'Count code points, not bytes.')
                )}
              </small>
            </div>
            <div>
              <p>{tr(inputMode === 'integer' ? 'Bit-length (input size)' : 'Input size n')}</p>
              <strong className="cs-bit-length">
                {inputMode === 'integer'
                  ? tr(`${integer.bits} ${integer.bits === 1 ? 'bit' : 'bits'}`)
                  : inputMode === 'array'
                    ? tr(`${n} elements`)
                    : tr(`${stringInputSize(text)} code points`)}
              </strong>
              <small>
                {inputMode === 'integer' ? (
                  integer.exponent === null ? (
                    tr('0 is written using one binary digit.')
                  ) : (
                    <>
                      {tr('since ')}
                      {'2'}
                      <sup>{integer.exponent}</sup>
                      {` ≤ ${integer.decimal} < 2`}
                      <sup>{integer.bits}</sup>
                    </>
                  )
                ) : (
                  tr(inputMode === 'array' ? 'The search demos use these values.' : 'UTF-8 byte length may differ.')
                )}
              </small>
            </div>
          </div>
        </div>
        <aside className="cs-insight">
          <h3>
            <Lightbulb size={20} />
            {tr('Key Insight')}
          </h3>
          <p>
            {tr(
              inputMode === 'integer'
                ? 'Input size for an integer is its bit length: n = ⌊log₂ m⌋ + 1 for m ≥ 1. Algorithms running in O(m) may be pseudo-polynomial if m is a numeric value instead of its bit length.'
                : inputMode === 'array'
                  ? 'When values fit a machine word, an array algorithm often uses n = A.length. A separate bit-cost model must also account for the sizes of those values.'
                  : 'A string length needs a stated unit. Code points, UTF-16 code units, UTF-8 bytes, and user-visible graphemes can have different counts.',
            )}
          </p>
        </aside>
      </div>
    </Panel>
  )
  const memoryPanel = (
    <Panel
      title={tr('3. Auxiliary Space Explorer')}
      description="Explore where extra memory is used (input not counted)."
      icon={<Database />}
      className="cs-memory"
    >
      <div className="cs-mode-tabs cs-memory-tabs">
        {(['iterative', 'recursive', 'temporary'] as const).map((mode) => (
          <button
            key={mode}
            aria-pressed={memoryMode === mode}
            onClick={() => {
              setMemoryMode(mode)
              mark('memory')
            }}
          >
            {tr(mode === 'iterative' ? 'Iterative Example' : mode === 'recursive' ? 'Recursive Example' : 'With Temporary Array')}
          </button>
        ))}
      </div>
      <div className="cs-memory-algorithm">
        <label>
          {tr('Algorithm:')}
          {memoryMode === 'temporary' ? (
            <output>{tr('Copy input to a new array')}</output>
          ) : (
            <select aria-label={tr('Memory example algorithm')} value={algorithm} onChange={(e) => changeAlgorithm(e.target.value as SearchAlgorithm)}>
              {algorithmOptions}
            </select>
          )}
        </label>
        <strong>
          <i />
          {tr('Auxiliary Space: ')}
          <output>{memory.bound}</output>
        </strong>
      </div>
      <div className="cs-memory-grid">
        <div className="cs-memory-card">
          <h3>
            <Layers3 />
            {tr('Call Stack')}
          </h3>
          <div className="cs-stack-frames" aria-label={tr('Live call frames')}>
            {memory.frameLabels.map((label, i) => (
              <span key={i}>{label}</span>
            ))}
          </div>
          <b className="cs-frame-count">
            {memory.frames} {tr(memory.frames === 1 ? 'frame' : 'frames')}
          </b>
          <small>{tr(memoryMode === 'recursive' ? 'Deepest call, including empty base.' : 'Fixed number of frames.')}</small>
        </div>
        <div className="cs-memory-card">
          <h3>
            <Box />
            {tr('Heap')}
          </h3>
          <div className="cs-memory-empty">
            {tr(memoryMode === 'temporary' ? 'Buffer is on heap; counted once in Temporary Arrays.' : 'No other heap allocation')}
          </div>
          <b>{tr(memoryMode === 'temporary' ? 'Same buffer' : 'O(1)')}</b>
          <small>{tr('No separate dynamic objects.')}</small>
        </div>
        <div className="cs-memory-card">
          <h3>
            <List />
            {tr('Temporary Arrays')}
          </h3>
          <div className="cs-temporary-cells">
            {memory.temporary > 0 ? (
              Array.from({ length: memory.temporary }, (_, i) => <span key={i}>{input[i]}</span>)
            ) : (
              <small>{tr('No temporary arrays')}</small>
            )}
          </div>
          <b className="cs-buffer-count">{memory.temporary > 0 ? tr(`${memory.temporary} cells`) : 'O(1)'}</b>
          <small>{tr(memory.temporary > 0 ? 'One copied buffer: Θ(n).' : 'Constant extra space.')}</small>
        </div>
        <div className="cs-memory-card">
          <h3>
            <FileText />
            {tr('Variables')}
          </h3>
          <pre>{memory.variables.join('\n')}</pre>
          <b>{'Θ(1)'}</b>
          <small>{tr(memoryMode === 'recursive' ? 'Per frame; included in stack.' : 'A few scalar variables.')}</small>
        </div>
      </div>
    </Panel>
  )
  const runtime = (
    <Panel
      title={tr('4. Runtime vs Playback Time')}
      description="Animations can be slower or faster than the actual running time."
      icon={<Play />}
      className="cs-runtime"
    >
      <div className="cs-runtime-grid">
        <article>
          <button
            onClick={() => {
              setTab('Visualize')
              mark('runtime')
            }}
            aria-label={tr('Explore algorithm operation count')}
          >
            <Settings />
            <h3>{tr('Algorithm Running Time')}</h3>
          </button>
          <ul>
            {[
              'Counts primitive operations in a stated cost model.',
              'Measured as a mathematical bound over input size n.',
              'Independent of animation speed or your computer’s performance.',
            ].map((s) => (
              <li key={s}>{tr(s)}</li>
            ))}
          </ul>
        </article>
        <article>
          <button
            onClick={() => {
              setTab('Visualize')
              mark('runtime')
            }}
            aria-label={tr('Explore playback timing')}
          >
            <Play />
            <h3>{tr('Playback Time')}</h3>
          </button>
          <ul>
            {[
              'Time taken to visualize steps in the browser.',
              'Can be slower (to show details) or faster (skipping steps).',
              'Used for learning and does not change the algorithm’s operation count.',
            ].map((s) => (
              <li key={s}>{tr(s)}</li>
            ))}
          </ul>
        </article>
      </div>
    </Panel>
  )
  const worked = (
    <Panel
      title={tr(`5. Worked Example: ${name}`)}
      description="Analyze the cases, time and auxiliary space for this search."
      icon={<FileText />}
      className="cs-worked"
    >
      <label className="cs-worked-view">
        {tr('View:')}
        <select
          aria-label={tr('Worked example view')}
          value={view}
          onChange={(e) => {
            setView(e.target.value)
            mark('worked')
          }}
        >
          <option value="full">{tr('Full Analysis')}</option>
          <option value="time">{tr('Time Only')}</option>
          <option value="space">{tr('Space Only')}</option>
        </select>
      </label>
      <div className="cs-worked-problem">{tr(`Problem: Search for a target x in an array A of size n = ${n} using ${name.toLowerCase()}.`)}</div>
      <div className="cs-worked-rows">
        {view !== 'space' && (
          <>
            <div>
              <b>
                <i />
                {tr('Best case')}
              </b>
              <span>
                {tr(algorithm === 'linear' ? 'x is at the first position.' : 'x is at the first midpoint.')} {tr('Comparisons: ')}
                {comparison.best}
                {'. '}
                {tr('Time: ')}
                {'Θ(1).'}
              </span>
            </div>
            <div>
              <b>
                <BarChart3 />
                {tr('Average case')}
              </b>
              <span>
                {tr('x is equally likely to be any stored value. Expected comparisons: ')}
                {format(comparison.average)}
                {'. '}
                {tr('Time: ')}
                {comparison.averageBound}
                {'.'}
              </span>
            </div>
            <div>
              <b>
                <AlertTriangle />
                {tr('Worst case')}
              </b>
              <span>
                {tr(algorithm === 'linear' ? 'x is at the last position or absent.' : 'x is absent on a deepest path.')} {tr('Comparisons: ')}
                {comparison.worst}
                {'. '}
                {tr('Time: ')}
                {comparison.worstBound}
                {'.'}
              </span>
            </div>
          </>
        )}
        {view !== 'time' && (
          <div>
            <b>
              <Database />
              {tr('Auxiliary space')}
            </b>
            <span>
              {tr(
                `Iterative search: Θ(1). Recursive worst-case stack: ${algorithm === 'linear' ? 'Θ(n)' : 'Θ(log n)'}. A separate array-copy example uses Θ(n) extra cells and Θ(n) copy operations.`,
              )}
            </span>
          </div>
        )}
      </div>
      <details>
        <summary>{tr('Cost model, assumptions and derivation')}</summary>
        <p>
          {tr(
            'Count one key comparison for each inspected element. Inputs contain 1–12 distinct machine-word integers in this demo. Average case assumes a uniform distribution over successful targets. No randomization is used.',
          )}
        </p>
        <p>
          {tr(
            algorithm === 'linear'
              ? 'Position i (one-based) takes i comparisons. The expected count is (1 + 2 + ⋯ + n)/n = (n + 1)/2. An absent target takes n comparisons.'
              : 'Binary search uses ascending sorted input and lower midpoints. Its expected count is the sum of successful search depths divided by n; it is not the linear-search formula. The deepest absent path has ⌊log₂ n⌋ + 1 key comparisons.',
          )}
        </p>
      </details>
    </Panel>
  )
  const keyTakeaways = (
    <Panel title={tr('Key Takeaways')} icon={<Lightbulb />} className="cs-takeaways">
      <ul>
        {[
          'Best case minimizes running time; worst case maximizes it.',
          'Average case uses an explicit input distribution.',
          'Input size for integers is bit length, not numeric value.',
          'Auxiliary space excludes input but includes temporary arrays, tables and recursion frames.',
          'Mathematical bounds describe families of inputs, not a single run.',
          'Animation speed does not change operation counts.',
        ].map((s) => (
          <li key={s}>
            <Check />
            {tr(s)}
          </li>
        ))}
      </ul>
    </Panel>
  )
  const pitfalls = (
    <Panel title={tr('Common Pitfalls')} icon={<AlertTriangle />} className="cs-pitfalls">
      {[
        [
          'Ignoring input size model (using numeric value instead of bit length).',
          'A numeric value m may require only Θ(log m) bits. An O(m) bound can be exponential when expressed in bit length.',
        ],
        [
          'Confusing average case with expected time over a stated distribution.',
          'Specify the probability model. This lesson averages uniformly over distinct successful targets; randomized algorithms require a separate expectation over random choices.',
        ],
        [
          'Counting the input as auxiliary space.',
          'The input array is excluded here. Buffers, tables, and active recursion frames allocated by the algorithm are included.',
        ],
        [
          'Changing the cost model without stating it.',
          'Search counts key comparisons on fixed-word values. Arbitrary-precision arithmetic requires accounting for the cost of operating on all those bits.',
        ],
        [
          'Mistaking animation speed for algorithm running time.',
          'Change the playback delay in the laboratory. The trace and its number of comparisons remain unchanged.',
        ],
        [
          'Forgetting recursion frames in auxiliary space.',
          'Count the maximum simultaneously live chain, including its empty base call. Per-frame variables are already part of those frames.',
        ],
      ].map(([title, body]) => (
        <details key={title}>
          <summary>
            <X />
            {tr(title)}
          </summary>
          <p>{tr(body)}</p>
        </details>
      ))}
    </Panel>
  )
  const laboratory = (
    <Panel
      title={tr('Search and Memory Laboratory')}
      description="Edit the input and target, step through actual comparisons, and compare them with playback delay."
      icon={<LineChart />}
      className="cs-lab"
    >
      <form
        className="cs-lab-inputs"
        onSubmit={(e) => {
          e.preventDefault()
          applyArray()
        }}
      >
        <label>
          {tr('Distinct array values')}
          <input aria-label={tr('Search array values')} value={arrayDraft} onChange={(e) => setArrayDraft(e.target.value)} />
        </label>
        <button>{tr('Apply array')}</button>
        <label>
          {tr('Algorithm')}
          <select aria-label={tr('Laboratory search algorithm')} value={algorithm} onChange={(e) => changeAlgorithm(e.target.value as SearchAlgorithm)}>
            {algorithmOptions}
          </select>
        </label>
      </form>
      {arrayError && <p role="alert">{tr(arrayError)}</p>}
      <form
        className="cs-lab-inputs"
        onSubmit={(e) => {
          e.preventDefault()
          applyTarget()
        }}
      >
        <label>
          {tr('Target value')}
          <input aria-label={tr('Search target')} value={targetDraft} onChange={(e) => setTargetDraft(e.target.value)} />
        </label>
        <button>{tr('Apply target')}</button>
        <label>
          {tr('Playback delay per comparison')}
          <input
            aria-label={tr('Playback delay')}
            type="range"
            min="100"
            max="1200"
            step="50"
            value={speed}
            onChange={(e) => {
              setSpeed(Number(e.target.value))
              mark('runtime')
            }}
          />
          <span>{tr(`${speed} ms`)}</span>
        </label>
      </form>
      {targetError && <p role="alert">{tr(targetError)}</p>}
      <div className="cs-lab-controls">
        <button
          disabled={cursor === 0}
          onClick={() => {
            setCursor((c) => c - 1)
            setPlaying(false)
          }}
        >
          {tr('Previous comparison')}
        </button>
        <button
          onClick={() => {
            setPlaying((p) => !p)
            if (done) setCursor(0)
            mark('runtime')
          }}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />} {tr(playing ? 'Pause search' : 'Play search')}
        </button>
        <button
          disabled={done}
          onClick={() => {
            setCursor((c) => c + 1)
            setPlaying(false)
            mark('case')
          }}
        >
          {tr('Next comparison')}
          <ChevronRight size={15} />
        </button>
        <button onClick={reset}>{tr('Reset search')}</button>
      </div>
      <div className="cs-search-array">
        {input.map((value, index) => (
          <div key={index} className={active?.index === index ? 'active' : trace.steps.slice(0, cursor).some((s) => s.index === index) ? 'visited' : ''}>
            <span>{value}</span>
            <small>{index}</small>
          </div>
        ))}
      </div>
      <p className="cs-search-message" role="status">
        {tr(
          cursor === 0
            ? 'No comparisons executed yet.'
            : done
              ? trace.index >= 0
                ? `Found target ${target} at index ${trace.index}.`
                : `Target ${target} is absent.`
              : `Compare ${active.value} with target ${target}; ${algorithm === 'linear' ? 'advance to the next element' : `next interval [${active.nextLo}, ${active.nextHi}]`}.`,
        )}
      </p>
      <div className="cs-search-stats">
        <strong>
          {tr('Comparisons executed: ')}
          <output className="cs-executed-count">{cursor}</output>
        </strong>
        <span>
          {tr('Total for this input: ')}
          <output className="cs-trace-count">{trace.comparisons}</output>
        </span>
        <span>{tr(`Planned playback ≈ ${trace.comparisons * speed} ms (browser scheduling adds overhead).`)}</span>
      </div>
      <p>
        {tr(
          algorithm === 'binary'
            ? 'The displayed values are sorted before binary search; sorting is a separate preprocessing step and is excluded from this search trace.'
            : 'This trace counts only the search’s key comparisons. One input is not an average-case proof.',
        )}
      </p>
      <h3>{tr('Uniform successful-target distribution')}</h3>
      <div className="cs-distribution-scroll">
        <table>
          <thead>
            <tr>
              <th>{tr('Target')}</th>
              <th>{tr('Probability')}</th>
              <th>{tr('Comparisons')}</th>
            </tr>
          </thead>
          <tbody>
            {comparison.distribution.map((row) => (
              <tr key={row.target}>
                <td>{row.target}</td>
                <td>{`1/${n}`}</td>
                <td>{row.comparisons}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan={2}>{tr('Expected comparisons')}</th>
              <td>{format(comparison.average)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      {memoryPanel}
      <p>
        {tr(
          'Memory cards count frames, temporary cells, and scalar variables in their own units. Per-frame variables are included in frame storage; a heap-backed temporary buffer is counted once.',
        )}
      </p>
      <details>
        <summary>{tr('Integer representation in full')}</summary>
        <p className="cs-binary-digits">{integer.binary}</p>
        <p>{tr(`${integer.bits} bits represent ${integer.decimal} in binary. For zero, we use the one-digit representation 0.`)}</p>
      </details>
    </Panel>
  )
  return (
    <div className="mom-page case-space-page target-visual" data-target="4">
      <MockupLessonChrome
        {...props}
        title={tr('Cases, Time and Auxiliary Space')}
        description="Specify input size, cost model, case and memory before making a bound. Compare best, average and worst cases, understand input size models, and analyze auxiliary space usage."
        progress={{ completed: activities.length, total: 6 }}
        startLabel="Continue Learning"
        searchPlaceholder="Search topics, examples, or practice problems..."
        heroIcon={<Bars />}
        decoration={<HeroArt />}
        onStart={() => setTab('Visualize')}
        badges={
          <>
            <span>
              <BarChart3 />
              {tr('Analysis & Correctness')}
            </span>
            <span>
              <BookOpen />
              {tr('Beginner Friendly')}
            </span>
            <span>
              <Clock3 />
              {tr('~ 15 min')}
            </span>
            <span className="cs-dots">{'●○○○○○'}</span>
          </>
        }
      />
      <nav className="mom-tabs cs-tabs" aria-label={tr('Algorithm sections')}>
        {tabs.map((name, i) => {
          const Icon = tabIcons[i]
          return (
            <button
              key={name}
              aria-pressed={tab === name}
              onClick={() => {
                setTab(name)
                setPlaying(false)
              }}
            >
              <Icon size={19} />
              {tr(name)}
            </button>
          )
        })}
      </nav>
      {tab === 'Learn' && (
        <>
          <div className="cs-primary-grid">
            <div>
              {cases}
              {memoryPanel}
            </div>
            <div>
              {inputSize}
              {runtime}
            </div>
          </div>
          <div className="cs-footer-grid">
            {worked}
            {keyTakeaways}
            {pitfalls}
          </div>
        </>
      )}
      {tab === 'Visualize' && laboratory}
      {tab === 'Practice' && (
        <Panel title={tr('Prediction Challenge')} icon={<Pencil />} className="cs-exercise">
          <p>
            {tr(
              'For linear search on five distinct values, the target is uniformly distributed over those five successful values. Predict the expected number of comparisons.',
            )}
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!prediction.trim() || !Number.isFinite(Number(prediction))) {
                setFeedback('Enter a finite numeric answer.')
                return
              }
              setFeedback(
                Number(prediction) === 3
                  ? 'Correct: (1 + 2 + 3 + 4 + 5)/5 = 3 comparisons.'
                  : 'Try again. Average the costs of all five equally likely successful targets: (1 + 2 + 3 + 4 + 5)/5 = 3.',
              )
              mark('challenge')
            }}
          >
            <label>
              {tr('Predicted expected comparisons')}
              <input type="number" step="any" value={prediction} onChange={(e) => setPrediction(e.target.value)} />
            </label>
            <button>{tr('Check prediction')}</button>
          </form>
          {feedback && <p role="status">{tr(feedback)}</p>}
        </Panel>
      )}
      {tab === 'Quiz' && (
        <Panel title={tr('Check Your Understanding')} icon={<Trophy />} className="cs-exercise">
          <p>{tr('The integer 1024 is the input. Under a binary bit-length model, what is its input size?')}</p>
          {['1024 bits, because numeric value is input size.', '11 bits, because 2¹⁰ ≤ 1024 < 2¹¹.', '10 bits, because log₂ 1024 = 10.'].map((answer, i) => (
            <button
              key={answer}
              aria-pressed={quiz === String(i)}
              onClick={() => {
                setQuiz(String(i))
                mark('challenge')
              }}
            >
              {tr(answer)}
            </button>
          ))}
          {quiz && (
            <p role="status">
              {tr(
                quiz === '1'
                  ? 'Correct. The binary representation 10000000000 contains eleven digits.'
                  : 'Try again. Include the leading 1: the bit length of m ≥ 1 is ⌊log₂ m⌋ + 1.',
              )}
            </p>
          )}
        </Panel>
      )}
      {tab === 'Notes' && (
        <Panel title={tr('Your Complexity Notes')} icon={<FileText />} className="cs-exercise">
          <label htmlFor="cs-notes">{tr('Record the input-size model, counted operation, case distribution, and auxiliary memory.')}</label>
          <textarea id="cs-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={12} />
          <p>{tr('Saved in this browser.')}</p>
        </Panel>
      )}
    </div>
  )
}
