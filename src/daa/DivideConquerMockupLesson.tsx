// @localized-render
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  BookOpen,
  Calculator,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Code2,
  FileText,
  GitFork,
  Layers3,
  Lightbulb,
  List,
  Minus,
  Pause,
  Play,
  Plus,
  Search,
  Target,
  Trophy,
  X,
} from 'lucide-react'
import { tx, useLocaleRender } from '../i18n/render'
import { allModules } from '../algorithms'
import { algorithmPath } from '../utils/routing'
import { usePersistentState, persistentString } from '../hooks/usePersistentState'
import { MockupLessonChrome, type MockupPageProps } from './MockupLessonChrome'
import { designCosts, designExamples, designMergeTrace, designRecurrence, designRecommendation, parseDesignArray, type DesignCost } from './divideConquerModel'
import './divide-conquer-mockup.css'

const tr = (s: string) => tx(s, 'studios'),
  tabs = ['Learn', 'Visualize', 'Practice', 'Quiz', 'Notes'] as const,
  tabIcons = [BookOpen, Play, Code2, Trophy, FileText]
const phases = ['Divide', 'Conquer', 'Combine']
const principles = [
  [
    'Divide into smaller instances of the same problem.',
    'A child must have a strictly smaller size outside the base cases. In merge sort, floor(n/2) and ceil(n/2) are both smaller than n for n > 1.',
  ],
  [
    'Conquer recursively with clear base cases.',
    'A base case is solved directly. Empty and one-element arrays are already sorted; a well-founded size measure proves recursion terminates.',
  ],
  [
    'Combine subproblem solutions efficiently.',
    'State precisely what each recursive call returns. A correct merge of sorted child arrays must preserve every value and produce sorted order.',
  ],
  [
    'Subproblems are (mostly) independent (non-overlapping).',
    'Independence often avoids repeated work. Overlap does not make recursion invalid, but repeated states can make memoization or Dynamic Programming a better choice.',
  ],
  [
    'Recurrence captures the time cost accurately.',
    'Count the recursive calls, their sizes, and all local work. Splitting and combining both contribute to f(n). For odd sizes, use floor/ceiling subproblem sizes before simplifying asymptotically.',
  ],
  [
    'Correctness depends on both recursive solutions and the combine step.',
    'Assume each smaller call is correct, then prove that combining its outputs gives a correct full solution. For maximum subarray, include the crossing candidate as well as the left and right candidates.',
  ],
  [
    'Mathematical bounds are for families of inputs, not a single instance.',
    'A finite trace demonstrates behavior. An asymptotic proof uses a recurrence and explicit assumptions for arbitrarily growing input sizes.',
  ],
  [
    'Not always the best choice — overlapping subproblems may favor Dynamic Programming.',
    'Use the flowchart as design advice, not a theorem. Base cases, progress, a valid combine rule, and an appropriate cost model still need separate justification.',
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
    <section className={`mom-panel dm-panel ${className}`}>
      <header>
        <span className="dm-icon">{icon}</span>
        <div>
          <h2>{tr(title)}</h2>
          {description && <p>{tr(description)}</p>}
        </div>
      </header>
      {children}
    </section>
  )
}
function MathLabel({ text }: { text: string }) {
  return (
    <span className="dm-math">
      {text.split(/(\^\([^)]+\)|\^\d+)/).map((part, i) =>
        part.startsWith('^') ? (
          <sup key={i}>
            {part
              .slice(1)
              .replace(/^\(|\)$/g, '')
              .split(/(log_\d+)/)
              .map((piece, j) =>
                piece.startsWith('log_') ? (
                  <span key={j}>
                    {'log'}
                    <sub>{piece.slice(4)}</sub>
                  </span>
                ) : (
                  piece
                ),
              )}
          </sup>
        ) : (
          part
        ),
      )}
    </span>
  )
}
function HeroArt() {
  const id = useId()
  return (
    <svg className="dm-hero-art" viewBox="0 -8 270 153" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x2="0" y2="1">
          <stop stopColor="#9ee6ff" />
          <stop offset="1" stopColor="#5320ff" />
        </linearGradient>
        <linearGradient id={`${id}-side`}>
          <stop stopColor="#79ceff" />
          <stop offset="1" stopColor="#581bff" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(0,${-i * 25})`}>
          <polygon points="73,98 120,73 168,98 120,123" fill={['#914bff', '#848bff', '#7ccfff', '#a7e4ff'][i]} stroke="#b9eaff" />
          <polygon points="73,98 120,123 120,139 73,114" fill={`url(#${id})`} />
          <polygon points="120,123 168,98 168,114 120,139" fill={`url(#${id}-side)`} />
        </g>
      ))}
      {[18, 45].map((x, i) => (
        <g key={x} transform={`translate(${x},${i ? 79 : 52})`}>
          <polygon points="0,0 13,-7 26,0 13,8" fill="#b1e9ff" />
          <polygon points="0,0 13,8 13,28 0,20" fill="#82d7ff" />
          <polygon points="13,8 26,0 26,20 13,28" fill="#41b8ff" />
        </g>
      ))}
      {[43, 73, 103].map((y, i) => (
        <g key={y}>
          <path d={`M174 75C192 75 183 ${y} 198 ${y}H217m-5-4 5 4-5 4`} fill="none" stroke={i === 1 ? '#36baff' : '#9c79ff'} strokeWidth="2" />
          <rect x="222" y={y - 11} width="25" height="22" rx="4" fill={i === 1 ? '#62caff' : '#aa8aff'} stroke="#cde7ff" />
        </g>
      ))}
    </svg>
  )
}
function DesignIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 25H22V7H29M22 25V41H29" />
      <rect x="1" y="18" width="14" height="14" rx="1.5" />
      <rect x="29" y="0" width="14" height="14" rx="1.5" />
      <rect x="29" y="34" width="14" height="14" rx="1.5" />
    </svg>
  )
}
function formatWork(value: number) {
  const rounded = Number(value.toPrecision(6))
  return `${rounded === value ? '' : '≈ '}${Math.abs(rounded) >= 1e8 ? rounded.toExponential(5) : rounded}`
}
function FrameworkDiagram({ phase, a, b }: { phase: number; a: number; b: number }) {
  const marker = useId(),
    count = Math.min(a, 3),
    color = phase === 0 ? '#0679ff' : phase === 1 ? '#7d33ff' : '#08a35a'
  const rect = (x: number, y: number, w: number, h: number, label: string) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={w} height={h} rx="6" fill={phase === 2 ? '#e1faed' : phase === 1 ? '#eee2ff' : '#e4f3ff'} stroke={color} strokeOpacity=".6" />
      <text x={x + w / 2} y={y + h / 2 + 4} textAnchor="middle" fontSize="11" fill={phase === 2 ? '#006d3b' : phase === 1 ? '#4b11bd' : '#0751aa'}>
        {label}
      </text>
    </g>
  )
  return (
    <svg
      className="dm-framework-svg"
      viewBox="0 0 180 120"
      aria-label={tr(`${phases[phase]} schematic: ${a} subproblem${a === 1 ? '' : 's'}, each of size n/${b}`)}
    >
      <defs>
        <marker id={marker} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0 0L6 3L0 6" fill={color} />
        </marker>
      </defs>
      {phase < 2 ? (
        <>
          {rect(45, 0, 90, 33, phase === 0 ? 'Problem (n)' : 'T(n)')}
          {Array.from({ length: count }, (_, i) => {
            const width = count === 3 ? 49 : count === 2 ? 57 : 70,
              x = 5 + (i * 170) / count + (170 / count - width) / 2
            return (
              <g key={i}>
                <path d={`M90 33Q90 47 ${x + width / 2} 59`} fill="none" stroke={color} strokeWidth="1.2" markerEnd={`url(#${marker})`} />
                {rect(x, 63, width, 33, phase === 0 ? `n/${b}` : `T(n/${b})`)}
              </g>
            )
          })}
          {a > 3 && (
            <text x="160" y="114" fontSize="15" fill={color}>
              ⋯
            </text>
          )}
        </>
      ) : (
        <>
          {Array.from({ length: count }, (_, i) => {
            const width = count === 3 ? 49 : count === 2 ? 74 : 88,
              x = 3 + (i * 174) / count + (174 / count - width) / 2
            return (
              <g key={i}>
                {rect(x, 0, width, 36, a === 2 ? (i === 0 ? 'Left solution' : 'Right solution') : `Solution ${i + 1}`)}
                <path d={`M${x + width / 2} 36L90 55`} fill="none" stroke={color} markerEnd={`url(#${marker})`} />
              </g>
            )
          })}
          {rect(46, 58, 88, 27, 'Combine')}
          <path d="M90 85V98" stroke={color} markerEnd={`url(#${marker})`} />
          {rect(37, 101, 106, 18, 'Final solution')}
          {a > 3 && (
            <text x="163" y="48" fontSize="15" fill={color}>
              ⋯
            </text>
          )}
        </>
      )}
    </svg>
  )
}
type Detail =
  | { kind: 'stage'; index: number }
  | { kind: 'principle'; index: number }
  | { kind: 'example'; index: number }
  | { kind: 'examples' }
  | { kind: 'flow' }
  | null
export function DivideConquerMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const navigate = useNavigate(),
    dialog = useRef<HTMLDialogElement>(null),
    treeMarker = useId()
  const [tab, setTab] = useState<(typeof tabs)[number]>('Learn'),
    [a, setA] = useState(2),
    [b, setB] = useState(2),
    [cost, setCost] = useState<DesignCost>('linear'),
    [depth, setDepth] = useState(3),
    [parameterError, setParameterError] = useState(''),
    [answers, setAnswers] = useState([true, true, true]),
    [checklist, setChecklist] = useState<boolean[]>([false, false, false, false]),
    [detail, setDetail] = useState<Detail>(null),
    [draft, setDraft] = useState('8, 3, 7, 4, 9, 2, 6, 1'),
    [values, setValues] = useState([8, 3, 7, 4, 9, 2, 6, 1]),
    [arrayError, setArrayError] = useState(''),
    [cursor, setCursor] = useState(0),
    [playing, setPlaying] = useState(false),
    [delay, setDelay] = useState(500),
    [prediction, setPrediction] = useState(''),
    [feedback, setFeedback] = useState(''),
    [quiz, setQuiz] = useState('')
  const [notes, setNotes] = usePersistentState('divide-conquer-design-notes', '', persistentString)
  const recurrence = designRecurrence(a, b, cost, depth),
    decision = designRecommendation(answers),
    trace = designMergeTrace(values),
    event = trace.events[Math.min(cursor, trace.events.length - 1)],
    completedNodes = new Set(
      trace.events
        .slice(0, cursor + 1)
        .filter((e) => e.phase === 'base' || e.phase === 'complete' || e.phase === 'done')
        .map((e) => e.node),
    )
  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => setCursor((index) => Math.min(trace.events.length - 1, index + 1)), delay)
    return () => window.clearInterval(timer)
  }, [playing, trace.events.length, delay])
  useEffect(() => {
    if (playing && cursor === trace.events.length - 1) {
      const timer = window.setTimeout(() => setPlaying(false), 0)
      return () => window.clearTimeout(timer)
    }
  }, [playing, cursor, trace.events.length])
  function open(value: Exclude<Detail, null>) {
    setDetail(value)
    dialog.current?.showModal()
  }
  function updateParameter(key: 'a' | 'b', value: number) {
    if (!Number.isInteger(value) || value < (key === 'a' ? 1 : 2) || value > 16) {
      setParameterError(key === 'a' ? 'Use an integer a from 1 to 16.' : 'Use an integer b from 2 to 16.')
      return
    }
    if (key === 'a') setA(value)
    else setB(value)
    setParameterError('')
  }
  function loadExample(index: number) {
    const example = designExamples[index]
    setA(example.a)
    setB(example.b)
    setCost(example.cost)
    setParameterError('')
    open({ kind: 'example', index })
  }
  function visitExample(index: number) {
    const module = allModules.find((m) => m.id === designExamples[index].algorithm)
    if (module) {
      dialog.current?.close()
      navigate(algorithmPath(module))
    }
  }
  function inspectNode(id: number) {
    const index = trace.events.findIndex((step) => step.node === id)
    if (index >= 0) {
      setCursor(index)
      setPlaying(false)
    }
  }
  const framework = (
    <Panel
      title={tr('The Divide and Conquer Framework')}
      description="Break the problem into smaller similar subproblems, solve them recursively, and combine the results."
      icon={<Layers3 />}
      className="dm-framework"
    >
      <div className="dm-stage-grid">
        {phases.map((phase, i) => (
          <article key={phase} className={`dm-stage dm-stage-${i}`}>
            <button onClick={() => open({ kind: 'stage', index: i })} aria-label={tr(`Explore ${phase} stage`)}>
              <b>{i + 1}</b>
              <h3>{tr(phase)}</h3>
            </button>
            <p>
              {tr(
                i === 0
                  ? 'Split the problem of size n into smaller subproblems of the same type.'
                  : i === 1
                    ? 'Solve each subproblem recursively. Stop at simple base cases.'
                    : 'Combine subproblem solutions to solve the original problem.',
              )}
            </p>
            <FrameworkDiagram phase={i} a={a} b={b} />
            <div className="dm-stage-tip">
              {tr(
                i === 0
                  ? 'Create subproblems that are smaller instances of the original problem.'
                  : i === 1
                    ? 'Use recursion until the input size is small enough to solve directly.'
                    : 'The combine step should be efficient and correctly merge the subproblem solutions.',
              )}
            </div>
            {i > 0 && <ArrowRight className="dm-stage-arrow" />}
          </article>
        ))}
      </div>
    </Panel>
  )
  const flow = (
    <Panel
      title={tr('When to Use Divide and Conquer?')}
      description="A quick guide to identify if the design method fits."
      icon={<Target />}
      className="dm-flow"
    >
      <div className="dm-flow-body">
        {[
          'Can the problem be split into smaller subproblems of the same type?',
          'Are the subproblems independent (or few overlaps)?',
          'Can the subproblem solutions be combined efficiently?',
        ].map((question, i) => (
          <div className="dm-flow-unit" key={question}>
            <div className={`dm-flow-row ${decision.firstNo === i ? 'no-active' : ''}`}>
              <div className="dm-question">{tr(question)}</div>
              <button
                aria-label={tr(`Answer no to design question ${i + 1}`)}
                aria-pressed={!answers[i]}
                disabled={decision.firstNo >= 0 && i > decision.firstNo}
                onClick={() => setAnswers((previous) => previous.map((answer, j) => (i === j ? false : answer)))}
              >
                <span>{tr('No')}</span>
                <ArrowRight />
              </button>
              <div className="dm-no-result">
                {tr(i === 0 ? 'Not suitable (for Divide and Conquer)' : i === 1 ? 'Consider Dynamic Programming' : 'Redesign or use another paradigm')}
              </div>
            </div>
            <button
              className="dm-flow-yes"
              aria-label={tr(`Answer yes to design question ${i + 1}`)}
              aria-pressed={answers[i]}
              disabled={decision.firstNo >= 0 && i > decision.firstNo}
              onClick={() => setAnswers((previous) => previous.map((answer, j) => (i === j ? true : answer)))}
            >
              <ArrowDown />
              <span>{tr('Yes')}</span>
            </button>
          </div>
        ))}
        <button className={`dm-flow-result ${decision.kind}`} onClick={() => open({ kind: 'flow' })} aria-label={tr('Explain design recommendation')}>
          <CheckCircle2 />
          <span>{tr(decision.message)}</span>
        </button>
      </div>
    </Panel>
  )
  const principlesPanel = (
    <Panel title={tr('Key Principles & Assumptions')} icon={<Lightbulb />} className="dm-principles">
      <ul>
        {principles.map(([title], index) => (
          <li key={title}>
            <button onClick={() => open({ kind: 'principle', index })}>
              <CheckCircle2 />
              <span>{tr(title)}</span>
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  )
  const builder = (
    <Panel
      title={tr('Recurrence Template Builder')}
      description="Express the running time based on subproblem size and combine cost."
      icon={<Calculator />}
      className="dm-builder"
    >
      <div className="dm-recurrence-formula">
        <MathLabel text="T(n) = a · T(n/b) + f(n)" />
      </div>
      <div className="dm-parameter-grid">
        {(['a', 'b'] as const).map((key) => (
          <label key={key}>
            <strong>{tr(key === 'a' ? 'Subproblems (a)' : 'Size factor (b)')}</strong>
            <span className="dm-number-control">
              <input
                aria-label={tr(key === 'a' ? 'Number of subproblems a' : 'Size factor b')}
                type="number"
                min={key === 'a' ? 1 : 2}
                max="16"
                value={key === 'a' ? a : b}
                onChange={(e) => updateParameter(key, Number(e.target.value))}
              />
              <button
                aria-label={tr(`Decrease ${key}`)}
                disabled={(key === 'a' ? a : b) === (key === 'a' ? 1 : 2)}
                onClick={() => updateParameter(key, (key === 'a' ? a : b) - 1)}
              >
                <Minus size={12} />
              </button>
              <button
                aria-label={tr(`Increase ${key}`)}
                disabled={(key === 'a' ? a : b) === 16}
                onClick={() => updateParameter(key, (key === 'a' ? a : b) + 1)}
              >
                <Plus size={12} />
              </button>
            </span>
            <small>{tr(key === 'a' ? 'Number of subproblems' : 'Size of each subproblem (n / b)')}</small>
          </label>
        ))}
        <label>
          <strong>{tr('Combine cost f(n)')}</strong>
          <select aria-label={tr('Divide and combine cost')} value={cost} onChange={(e) => setCost(e.target.value as DesignCost)}>
            {designCosts.map((choice) => (
              <option key={choice.id} value={choice.id}>
                {choice.label}
              </option>
            ))}
          </select>
          <small>{tr('Cost to divide and combine')}</small>
        </label>
      </div>
      {parameterError && <p role="alert">{tr(parameterError)}</p>}
      <div className="dm-recurrence-result">
        <strong>
          {tr('Example: ')}
          <MathLabel text={recurrence.recurrence} />
        </strong>
        <span>
          {tr('This recurrence solves to ')}
          <output>
            <MathLabel text={recurrence.bound} />
          </output>
          {tr(' using the Master Theorem.')}
        </span>
      </div>
    </Panel>
  )
  const exampleIcons = [List, Search, Trophy, BarChart3]
  const examples = (
    <Panel
      title={tr('Canonical Examples')}
      description="Common problems that use the divide and conquer design method."
      icon={<Layers3 />}
      className="dm-examples"
    >
      <button className="dm-all-examples" onClick={() => open({ kind: 'examples' })}>
        {tr('View all examples')}
        <ArrowRight size={14} />
      </button>
      <div className="dm-example-grid">
        {designExamples.map((example, index) => {
          const Icon = exampleIcons[index],
            model = designRecurrence(example.a, example.b, example.cost)
          return (
            <button
              className={`dm-example dm-example-${index}`}
              key={example.id}
              onClick={() => loadExample(index)}
              aria-label={tr(`Explore ${example.name} design`)}
            >
              <span className="dm-example-heading">
                <i>
                  <Icon />
                </i>
                <span>
                  <strong>{tr(example.name)}</strong>
                  <small>{tr(example.description)}</small>
                </span>
              </span>
              <MathLabel text={model.recurrence} />
              <b>
                <CheckCircle2 />
                <MathLabel text={model.bound} />
              </b>
            </button>
          )
        })}
      </div>
    </Panel>
  )
  const bottom = (
    <div className="dm-bottom-grid">
      <Panel title={tr('Concept and Intuition')} icon={<Target />} className="dm-intuition">
        <p>
          {tr(
            'Divide and conquer breaks a problem into smaller subproblems of the same type, solves them recursively, and combines their solutions. Direct base cases and decreasing input size ensure termination. Typical examples include merge sort, binary search, and maximum subarray.',
          )}
        </p>
      </Panel>
      <Panel title={tr('General Steps Checklist')} icon={<ClipboardList />} className="dm-checklist">
        <div>
          {[
            'Define the subproblem(s) and show how to divide.',
            'Specify base case(s) and solve them directly.',
            'Write the recurrence for time (and space, if needed).',
            'Prove correctness and solve the recurrence to obtain the bound.',
          ].map((item, i) => (
            <button
              key={item}
              aria-pressed={checklist[i]}
              onClick={() => setChecklist((previous) => previous.map((checked, j) => (i === j ? !checked : checked)))}
            >
              <b>{checklist[i] ? <Check size={12} /> : i + 1}</b>
              <span>{tr(item)}</span>
            </button>
          ))}
        </div>
      </Panel>
    </div>
  )
  const traceTree = (
    <div className="dm-trace-scroll">
      <svg
        className="dm-trace-tree"
        viewBox={`0 0 1000 ${Math.max(...trace.nodes.map((n) => n.depth)) * 74 + 92}`}
        style={{ height: Math.max(130, Math.max(...trace.nodes.map((n) => n.depth)) * 74 + 92) }}
        aria-label={tr('Merge sort recursive subproblems and completed solutions')}
      >
        <defs>
          <marker id={treeMarker} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0 0L6 3L0 6" fill="#8aa9d3" />
          </marker>
        </defs>
        {trace.nodes.flatMap((node) =>
          node.children.map((child) => {
            const next = trace.nodes[child],
              x = values.length ? ((node.start + node.end) / 2 / values.length) * 900 + 50 : 500,
              cx = values.length ? ((next.start + next.end) / 2 / values.length) * 900 + 50 : 500
            return (
              <path
                key={`${node.id}-${child}`}
                d={`M${x} ${node.depth * 74 + 53}L${cx} ${next.depth * 74 + 24}`}
                stroke="#a9bfde"
                fill="none"
                markerEnd={`url(#${treeMarker})`}
              />
            )
          }),
        )}
        {trace.nodes.map((node) => {
          const x = values.length ? ((node.start + node.end) / 2 / values.length) * 900 + 50 : 500,
            current = node.id === event.node,
            completed = completedNodes.has(node.id),
            shown = completed ? node.result : node.values,
            label = shown.length > 4 ? `${shown.slice(0, 4).join(', ')}, …` : shown.length ? shown.join(', ') : '∅',
            w = Math.min(130, Math.max(54, shown.slice(0, 4).join(', ').length * 7 + 18))
          return (
            <g
              key={node.id}
              role="button"
              tabIndex={0}
              aria-label={tr(node.end === node.start ? 'Inspect empty subproblem' : `Inspect subproblem indices ${node.start} to ${node.end - 1}`)}
              aria-pressed={current}
              onClick={() => inspectNode(node.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  inspectNode(node.id)
                }
              }}
            >
              <title>
                {tr(
                  `Input: [${node.values.join(', ')}]. ${completed ? `Completed solution: [${node.result.join(', ')}].` : 'Solution not completed at this step.'}`,
                )}
              </title>
              <rect
                x={x - w / 2}
                y={node.depth * 74 + 25}
                width={w}
                height="30"
                rx="7"
                fill={current ? '#dceeff' : completed ? '#dff8eb' : '#f0f6ff'}
                stroke={current ? '#087cff' : completed ? '#76cda5' : '#bad4f5'}
                strokeWidth={current ? 2 : 1}
              />
              <text x={x} y={node.depth * 74 + 44} textAnchor="middle" fontSize="11" fill="#133971">
                {label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
  const laboratory = (
    <Panel
      title={tr('Divide, Conquer and Combine Laboratory')}
      description="Follow a real merge sort. Its two balanced child calls and linear merge are independent of experiments in the recurrence builder."
      icon={<GitFork />}
      className="dm-lab"
    >
      <form
        className="dm-array-form"
        onSubmit={(e) => {
          e.preventDefault()
          try {
            setValues(parseDesignArray(draft))
            setCursor(0)
            setPlaying(false)
            setArrayError('')
          } catch (err) {
            setArrayError((err as Error).message)
          }
        }}
      >
        <label>
          {tr('Array to divide and conquer')}
          <input aria-label={tr('Array to divide and conquer')} value={draft} onChange={(e) => setDraft(e.target.value)} />
        </label>
        <button>{tr('Apply array')}</button>
        <label>
          {tr('Playback delay')}
          <input
            type="range"
            aria-label={tr('Merge trace playback delay')}
            min="100"
            max="1000"
            step="50"
            value={delay}
            onChange={(e) => setDelay(Number(e.target.value))}
          />
          <span>{tr(`${delay} ms`)}</span>
        </label>
      </form>
      {arrayError && <p role="alert">{tr(arrayError)}</p>}
      <div className="dm-trace-controls">
        <button
          disabled={cursor === 0}
          onClick={() => {
            setCursor((c) => c - 1)
            setPlaying(false)
          }}
        >
          {tr('Previous step')}
        </button>
        <button
          onClick={() => {
            setPlaying((v) => !v)
            if (cursor === trace.events.length - 1) setCursor(0)
          }}
        >
          {playing ? <Pause size={15} /> : <Play size={15} />} {tr(playing ? 'Pause trace' : 'Play trace')}
        </button>
        <button
          disabled={cursor === trace.events.length - 1}
          onClick={() => {
            setCursor((c) => c + 1)
            setPlaying(false)
          }}
        >
          {tr('Next step')}
          <ChevronRight size={15} />
        </button>
        <button
          onClick={() => {
            setCursor(0)
            setPlaying(false)
          }}
        >
          {tr('Reset trace')}
        </button>
        <output>{tr(`Step ${cursor + 1} of ${trace.events.length}: ${event.phase}`)}</output>
      </div>
      {traceTree}
      <p className="dm-trace-message" role="status">
        {tr(event.message)}
      </p>
      <div className="dm-trace-stats">
        <span>
          {tr('Key comparisons: ')}
          <output className="dm-comparisons">{event.comparisons}</output>
        </span>
        <span>
          {tr('Live frames: ')}
          {event.stack.length}
        </span>
        <span>
          {tr('Peak frames: ')}
          {trace.peakFrames}
        </span>
      </div>
      <div className="dm-merge-state">
        <div>
          <h3>{tr('Left child solution')}</h3>
          <p>{event.left.length ? event.left.join(', ') : '—'}</p>
        </div>
        <div>
          <h3>{tr('Right child solution')}</h3>
          <p>{event.right.length ? event.right.join(', ') : '—'}</p>
        </div>
        <div>
          <h3>{tr('Combined output so far')}</h3>
          <output className="dm-current-output">
            {event.output.length ? event.output.join(', ') : event.phase === 'base' || event.phase === 'done' ? '∅' : '—'}
          </output>
        </div>
      </div>
      <p>
        {tr(
          'The tree is the recursion plan. Green nodes show completed solutions; the outlined node belongs to the selected step. Equal values are taken from the left first. Odd inputs split into floor(n/2) and ceil(n/2); empty and singleton inputs are base cases.',
        )}
      </p>
      {builder}
      <div className="dm-modeled-cost">
        <h3>{tr('Work by recursion level')}</h3>
        <label>
          {tr('Modeled recursion depth h')}
          <input
            aria-label={tr('Modeled recursion depth')}
            type="number"
            min="0"
            max="5"
            value={depth}
            onChange={(e) => {
              const value = Number(e.target.value)
              if (Number.isInteger(value) && value >= 0 && value <= 5) setDepth(value)
            }}
          />
        </label>
        <p>
          {tr(
            `n = bʰ = ${recurrence.tree.n}. T(1) = 1; the selected combine-cost representative has coefficient 1. These modeled costs illustrate the recurrence, rather than merge sort’s exact comparison count.`,
          )}
        </p>
        <div className="dm-table-scroll">
          <table>
            <thead>
              <tr>
                {['Level', 'Calls', 'Size per call', 'Work per call', 'Total level work'].map((item) => (
                  <th key={item}>{tr(item)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recurrence.tree.levels.map((level) => (
                <tr key={level.level}>
                  <td>{level.level}</td>
                  <td>{level.nodes}</td>
                  <td>{level.size}</td>
                  <td>{formatWork(level.perNode)}</td>
                  <td>{formatWork(level.work)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="dm-modeled-total">
          {tr('Modeled total work: ')}
          {formatWork(recurrence.tree.total)}
        </p>
        <p>
          {tr(
            'The displayed Master Theorem solution assumes equal-sized recursive calls, appropriate base cases, and sufficiently large powers of b. Rounding and other input sizes require the usual boundary argument. Space needs its own analysis; it is not obtained by summing all calls.',
          )}
        </p>
      </div>
    </Panel>
  )
  return (
    <div className="mom-page divide-method-page target-visual" data-target="18">
      <MockupLessonChrome
        {...props}
        title={tr('Divide and Conquer: Design Method')}
        description="Solve smaller instances and prove the combine step to build efficient algorithms."
        concepts={6}
        heroIcon={<DesignIcon />}
        decoration={<HeroArt />}
        onStart={() => setTab('Visualize')}
        badges={
          <>
            <span>
              <Clock3 />
              {tr('10–15 min')}
            </span>
            <span>
              <BarChart3 />
              {tr('Intermediate')}
            </span>
            <span>
              <Lightbulb />
              {tr('6 key concepts')}
            </span>
          </>
        }
      />
      <nav className="mom-tabs dm-tabs" aria-label={tr('Algorithm sections')}>
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
              <Icon size={18} />
              {tr(name)}
            </button>
          )
        })}
      </nav>
      {tab === 'Learn' && (
        <>
          <div className="dm-top-grid">
            {framework}
            {flow}
            {principlesPanel}
          </div>
          <div className="dm-lower-grid">
            {builder}
            {examples}
          </div>
          {bottom}
        </>
      )}
      {tab === 'Visualize' && laboratory}
      {tab === 'Practice' && (
        <Panel title={tr('Prediction Challenge')} icon={<Code2 />} className="dm-exercise">
          <p>
            {tr(
              'Merge sort has recursively sorted the halves [1, 4] and [2, 3]. Predict how many key comparisons the combine step needs to produce [1, 2, 3, 4]. Appending an exhausted side’s tail does not count as another key comparison.',
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
                  ? 'Correct. Compare 1 vs 2, 4 vs 2, and 4 vs 3; append 4 after the right side is exhausted.'
                  : 'Try again. There are three key comparisons, followed by a tail append that needs no key comparison.',
              )
            }}
          >
            <label>
              {tr('Predicted merge comparisons')}
              <input type="number" value={prediction} onChange={(e) => setPrediction(e.target.value)} />
            </label>
            <button>{tr('Check prediction')}</button>
          </form>
          {feedback && <p role="status">{tr(feedback)}</p>}
        </Panel>
      )}
      {tab === 'Quiz' && (
        <Panel title={tr('Check Your Understanding')} icon={<Trophy />} className="dm-exercise">
          <p>{tr('For the divide-and-conquer maximum subarray algorithm, which combine rule is complete?')}</p>
          {[
            'Return the better child solution only.',
            'Compare the left, right, and best crossing subarray candidates.',
            'Add both child maxima without checking adjacency.',
          ].map((answer, i) => (
            <button key={answer} aria-pressed={quiz === String(i)} onClick={() => setQuiz(String(i))}>
              {tr(answer)}
            </button>
          ))}
          {quiz && (
            <p role="status">
              {tr(
                quiz === '1'
                  ? 'Correct. Every contiguous subarray is wholly left, wholly right, or crosses the midpoint.'
                  : 'Try again. A maximum subarray may cross the midpoint, so both child solutions alone can miss the answer.',
              )}
            </p>
          )}
        </Panel>
      )}
      {tab === 'Notes' && (
        <Panel title={tr('Your Design Notes')} icon={<FileText />} className="dm-exercise">
          <label htmlFor="dm-notes">{tr('Record the split, base cases, recursive contract, combine proof, and cost recurrence.')}</label>
          <textarea id="dm-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={12} />
          <p>{tr('Saved in this browser.')}</p>
        </Panel>
      )}
      <dialog ref={dialog} className="dm-dialog" aria-label={tr('Divide and conquer design details')} onClose={() => setDetail(null)}>
        <button className="dm-dialog-close" aria-label={tr('Close design details')} onClick={() => dialog.current?.close()}>
          <X size={20} />
        </button>
        {detail?.kind === 'stage' ? (
          <>
            <h2>{tr(`${phases[detail.index]}: the recursive design contract`)}</h2>
            <p>
              {tr(
                detail.index === 0
                  ? 'Specify the full problem and the smaller instances. Show that every recursive child has a strictly smaller well-founded size outside the base cases. For merge sort on n > 1 values, both halves are strictly smaller.'
                  : detail.index === 1
                    ? 'Solve the base cases directly. Assume the recursive calls meet their contracts on all smaller inputs. For sorting, each child returns a sorted permutation of its own input. Empty and singleton arrays are already sorted.'
                    : 'Prove that combining correct child solutions yields a correct whole solution. Merge sort preserves every element and sorted order; maximum subarray must also consider a crossing candidate. Count the combine work in f(n).',
              )}
            </p>
            <p>
              {tr(
                `The current recurrence has ${a} call${a === 1 ? '' : 's'} of size n/${b}. The schematic previews at most three child calls; all ${a} calls are included in the cost model.`,
              )}
            </p>
            <button
              onClick={() => {
                dialog.current?.close()
                setTab('Visualize')
              }}
            >
              {tr('Explore the merge-sort trace')}
              <ArrowRight size={15} />
            </button>
          </>
        ) : detail?.kind === 'principle' ? (
          <>
            <h2>{tr(principles[detail.index][0])}</h2>
            <p>{tr(principles[detail.index][1])}</p>
          </>
        ) : detail?.kind === 'flow' ? (
          <>
            <h2>{tr('Design Recommendation')}</h2>
            <p>{tr(decision.message)}</p>
            <p>
              {tr(
                'This is a design heuristic, not a correctness proof or a guarantee that the method is optimal. A decreasing size measure, valid base cases, correct child contracts, and a complete combine rule still need justification.',
              )}
            </p>
          </>
        ) : detail?.kind === 'example' ? (
          <>
            <h2>{tr(designExamples[detail.index].name)}</h2>
            <p>{tr(designExamples[detail.index].explanation)}</p>
            <p className="dm-example-equation">
              <MathLabel
                text={designRecurrence(designExamples[detail.index].a, designExamples[detail.index].b, designExamples[detail.index].cost).recurrence}
              />
              {' ⇒ '}
              <MathLabel text={designRecurrence(designExamples[detail.index].a, designExamples[detail.index].b, designExamples[detail.index].cost).bound} />
            </p>
            <button onClick={() => visitExample(detail.index)}>
              {tr('Open full visualization')}
              <ArrowRight size={15} />
            </button>
          </>
        ) : detail?.kind === 'examples' ? (
          <>
            <h2>{tr('Explore the Canonical Examples')}</h2>
            {designExamples.map((example, index) => (
              <section key={example.id}>
                <h3>{tr(example.name)}</h3>
                <p>{tr(example.explanation)}</p>
                <button onClick={() => visitExample(index)}>
                  {tr(`Open ${example.name}`)}
                  <ArrowRight size={15} />
                </button>
              </section>
            ))}
          </>
        ) : null}
      </dialog>
    </div>
  )
}
