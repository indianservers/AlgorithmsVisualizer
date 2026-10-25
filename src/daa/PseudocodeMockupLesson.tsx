// @localized-render
import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Code2,
  Copy,
  FileText,
  Lightbulb,
  MessageSquare,
  Network,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react'
import { tx, useLocaleRender } from '../i18n/render'
import { usePersistentState, persistentString } from '../hooks/usePersistentState'
import { MockupLessonChrome, type MockupPageProps } from './MockupLessonChrome'
import {
  pseudoTemplates,
  runPseudocode,
  parsePseudoArray,
  descriptionTemplate,
  binarySearchExample,
  validatePseudoInput,
  type PseudoRun,
  type PseudoTemplate,
} from './pseudocodeModel'
import './pseudocode-mockup.css'
const tr = (s: string) => tx(s, 'studios')
type Tab = 'Learn' | 'Visualize' | 'Practice' | 'Quiz' | 'Notes'
const tabs: Tab[] = ['Learn', 'Visualize', 'Practice', 'Quiz', 'Notes'],
  tabIcons = [BookOpen, Play, Code2, Trophy, FileText]
const names: Record<PseudoTemplate, string> = { linear: 'Linear Search', binary: 'Binary Search', maximum: 'Find Maximum', sum: 'Array Sum' }
const referenceArray = [2, 5, 8, 12, 16, 23]
const generatedFormat = (text: string) =>
  text
    .split('\n')
    .filter((s) => !s.trim().startsWith('//'))
    .map((s, i) => (i === 0 ? s : ' '.repeat(4 + 2 * (s.length - s.trimStart().length)) + s.trimStart()))
    .join('\n')
const quality = [
  'Clearly specify input and output.',
  'State preconditions and postconditions.',
  'Use consistent indexing (e.g., 0-based).',
  'Handle base cases and edge cases.',
  'Ensure every step is effective and unambiguous.',
  'Show termination (e.g., decreasing measure).',
  'Argue correctness (invariant or case analysis).',
  'Analyze time and space complexity.',
  'Use clear and consistent variable names.',
  'Keep the pseudocode language-independent.',
]
function Panel({
  title,
  description,
  icon,
  children,
  className = '',
  action,
}: {
  title: string
  description?: string
  icon: ReactNode
  children: ReactNode
  className?: string
  action?: ReactNode
}) {
  return (
    <section className={`mom-panel pc-panel ${className}`}>
      <header>
        <span className="pc-icon">{icon}</span>
        <div>
          <h2>{tr(title)}</h2>
          {description && <p>{tr(description)}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}
function PaperIcon() {
  return (
    <svg viewBox="0 0 50 56" aria-hidden="true">
      <defs>
        <linearGradient id="pc-paper-icon" x2="0" y2="1">
          <stop stopColor="#66d0ff" />
          <stop offset="1" stopColor="#278cff" />
        </linearGradient>
      </defs>
      <path d="M7 4H32L44 16V48Q44 52 39 52H7Q3 52 3 47V9Q3 4 7 4Z" fill="url(#pc-paper-icon)" />
      <path d="M31 4V17H44" fill="#a5e9ff" />
      <path d="M12 19H33M12 29H33M12 39H28" stroke="white" strokeWidth="3" />
    </svg>
  )
}
function HeroArt() {
  return (
    <svg className="pc-hero-art" viewBox="0 0 300 125" aria-hidden="true">
      <defs>
        <linearGradient id="pc-hero-paper" x2="0" y2="1">
          <stop stopColor="#dcf5ff" />
          <stop offset="1" stopColor="#d6e4ff" />
        </linearGradient>
        <linearGradient id="pc-hero-node" x2="0" y2="1">
          <stop stopColor="#11c1ff" />
          <stop offset="1" stopColor="#6351ff" />
        </linearGradient>
      </defs>
      <path d="M88 7H171L196 32V117H88Q83 117 83 110V15Q83 7 88 7Z" fill="url(#pc-hero-paper)" stroke="#93d6ff" />
      <path d="M171 7V32H196Z" fill="#72d4ff" />
      <path d="M5 42L77 52V111L5 103Z" fill="#a4adff" stroke="#cfdbff" strokeWidth="2" />
      <path d="M221 51L287 36V103L221 113Z" fill="#96c7ff" stroke="#d1e7ff" strokeWidth="2" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <path d={`M15 ${56 + i * 12}L65 ${63 + i * 12}`} stroke="#e9ecff" strokeWidth="2" strokeDasharray="6 4" />
          <path d={`M230 ${61 + i * 12}L278 ${51 + i * 12}`} stroke="#e9f7ff" strokeWidth="2" strokeDasharray="7 4" />
        </g>
      ))}
      <rect x="118" y="30" width="27" height="17" rx="3" fill="#00b5f5" stroke="white" strokeWidth="2" />
      <path d="M131 47V59M144 76H154Q165 76 165 91V102H147M132 87V97" fill="none" stroke="#6b68ed" strokeWidth="2" />
      <path d="M131 58L147 73L131 88L115 73Z" fill="url(#pc-hero-node)" stroke="white" />
      <rect x="110" y="98" width="35" height="18" rx="3" fill="url(#pc-hero-node)" stroke="white" />
      <circle cx="165" cy="96" r="7" fill="#7171ff" />
      <circle cx="229" cy="23" r="12" fill="#b9e6ff" opacity=".65" />
    </svg>
  )
}
function syntax(text: string) {
  return text.split(/(\/\/.*|\b(?:ALGORITHM|for|to|do|if|then|return|end|while|else|floor|and|or|not|true|false)\b)/gi).map((token, i) => (
    <span
      key={i}
      className={
        token.startsWith('//')
          ? 'comment'
          : /^(ALGORITHM|for|to|do|if|then|return|end|while|else|floor|and|or|not|true|false)$/i.test(token)
            ? 'keyword'
            : undefined
      }
    >
      {token}
    </span>
  ))
}
function CodeView({
  source,
  editable,
  onChange,
  line,
  mini = false,
  numbers = true,
}: {
  source: string
  editable?: boolean
  onChange?: (source: string) => void
  line?: number
  mini?: boolean
  numbers?: boolean
}) {
  const [scroll, setScroll] = useState({ top: 0, left: 0 })
  const editorRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const editor = editorRef.current
    if (!editable || !line || !editor) return
    const top = 8 + (line - 1) * 21
    if (top < editor.scrollTop + 8) editor.scrollTop = Math.max(0, top - 8)
    else if (top + 21 > editor.scrollTop + editor.clientHeight - 8) editor.scrollTop = top + 21 - editor.clientHeight + 8
  }, [line, editable])
  return (
    <div className={`pc-code-editor ${editable ? 'editable' : 'readonly'} ${mini ? 'mini' : ''} ${numbers ? '' : 'no-numbers'}`}>
      <div
        className="pc-code-lines"
        aria-hidden={editable ? true : undefined}
        style={editable ? { transform: `translate(${-scroll.left}px, ${-scroll.top}px)` } : undefined}
      >
        {source.split('\n').map((text, i) => (
          <div className={`pc-code-line ${line === i + 1 ? 'current' : ''}`} key={i}>
            {numbers && <span>{i + 1}</span>}
            <code>{syntax(text) || ' '}</code>
          </div>
        ))}
      </div>
      {editable && (
        <textarea
          ref={editorRef}
          aria-label={tr('Pseudocode editor')}
          spellCheck={false}
          value={source}
          onChange={(e) => onChange?.(e.target.value)}
          onScroll={(e) => setScroll({ top: e.currentTarget.scrollTop, left: e.currentTarget.scrollLeft })}
        />
      )}
    </div>
  )
}
type FlowKey = 'start' | 'initial' | 'bound' | 'match' | 'increment' | 'found' | 'missing'
function LinearFlow({ active, onSelect }: { active?: FlowKey; onSelect: (key: FlowKey) => void }) {
  const node = (key: FlowKey, label: string, shape: ReactNode, x: number, y: number) => (
    <g
      key={key}
      role="button"
      tabIndex={0}
      aria-label={tr(`Inspect flow ${label}`)}
      className={`pc-flow-node ${key} ${active === key ? 'active' : ''}`}
      onClick={() => onSelect(key)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(key)
        }
      }}
    >
      {shape}
      <text x={x} y={y} textAnchor="middle">
        {label}
      </text>
    </g>
  )
  return (
    <svg className="pc-linear-flow" viewBox="0 0 230 275" preserveAspectRatio="none" role="img" aria-label={tr('Linear-search control flow')}>
      <defs>
        <marker id="pc-flow-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0 0L6 3L0 6Z" fill="#172858" />
        </marker>
      </defs>
      <g className="pc-flow-links" fill="none" stroke="#172858" strokeWidth="1.4" markerEnd="url(#pc-flow-arrow)">
        <path d="M100 30V44" />
        <path d="M100 79V89Q100 94 88 100" />
        <path d="M126 129H155" />
        <path d="M88 158V174" />
        <path d="M126 205H159" />
        <path d="M80 234V241" />
        <path d="M39 257H3V135Q3 129 10 129H49" />
      </g>
      <text className="pc-edge-label" x="139" y="115">
        {tr('No')}
      </text>
      <text className="pc-edge-label" x="96" y="171">
        {tr('Yes')}
      </text>
      <text className="pc-edge-label" x="132" y="191">
        {tr('Yes')}
      </text>
      {node('start', tr('Start'), <rect x="55" y="0" width="90" height="30" rx="15" />, 100, 19)}
      {node('initial', 'i = 0', <rect x="51" y="44" width="96" height="35" rx="7" />, 99, 66)}
      {node('bound', 'i < n?', <path d="M88 100L127 129L88 158L49 129Z" />, 88, 133)}
      {node('missing', tr('Return −1'), <rect x="155" y="111" width="74" height="35" rx="7" />, 192, 133)}
      {node('match', 'A[i] = x?', <path d="M80 175L126 205L80 234L34 205Z" />, 80, 209)}
      {node('found', tr('Return i'), <rect x="159" y="187" width="70" height="35" rx="7" />, 194, 209)}
      {node('increment', 'i = i + 1', <rect x="34" y="240" width="93" height="35" rx="6" />, 80, 262)}
    </svg>
  )
}
const questions = [
  {
    question: 'Which statement best describes pseudocode?',
    options: ['A language-independent description of an algorithm', 'A program that always runs unchanged in Python', 'A diagram with no defined steps'],
    answer: 0,
    why: 'Pseudocode describes precise steps without depending on a particular implementation language.',
  },
  {
    question: 'What establishes total correctness?',
    options: ['Correct output only when a program terminates', 'Partial correctness together with termination', 'A short running time alone'],
    answer: 1,
    why: 'Total correctness requires both the right result and eventual termination.',
  },
  {
    question: 'What does binary search require?',
    options: ['A sorted array', 'Only positive values', 'A target already present in the array'],
    answer: 0,
    why: 'Binary search discards half the candidates using the array’s sorted order.',
  },
  {
    question: 'What is a postcondition?',
    options: ['An input restriction that must hold before execution', 'A property guaranteed when the algorithm finishes', 'A programming-language keyword'],
    answer: 1,
    why: 'A postcondition describes the promised result after successful execution.',
  },
]
export function PseudocodeMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const [tab, setTab] = useState<Tab>('Learn'),
    [source, setSource] = useState(pseudoTemplates.linear),
    [appliedSource, setAppliedSource] = useState(pseudoTemplates.linear),
    [values, setValues] = useState(referenceArray),
    [target, setTarget] = useState(12),
    [run, setRun] = useState<PseudoRun>(),
    [cursor, setCursor] = useState(-1),
    [playing, setPlaying] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [flowFocus, setFlowFocus] = useState<FlowKey>(),
    [inputOpen, setInputOpen] = useState(false),
    [arrayDraft, setArrayDraft] = useState(referenceArray.join(', ')),
    [targetDraft, setTargetDraft] = useState('12')
  const [description, setDescription] = useState('Search for a value x in an array. If found, return its index. Otherwise, return −1.'),
    [generated, setGenerated] = useState(() => generatedFormat(pseudoTemplates.linear)),
    [generatedEdited, setGeneratedEdited] = useState(false),
    [workedTab, setWorkedTab] = useState('Pseudocode'),
    [workedStep, setWorkedStep] = useState(-1),
    [prediction, setPrediction] = useState(''),
    [feedback, setFeedback] = useState(''),
    [question, setQuestion] = useState(0),
    [answer, setAnswer] = useState(''),
    [quizFeedback, setQuizFeedback] = useState('')
  const [checks, setChecks] = usePersistentState<boolean[]>('pseudocode-quality-checklist', Array(quality.length).fill(false), {
    deserialize: (text) => {
      try {
        const a = JSON.parse(text)
        return Array.isArray(a) && a.length === quality.length && a.every((x) => typeof x === 'boolean') ? a : Array(quality.length).fill(false)
      } catch {
        return Array(quality.length).fill(false)
      }
    },
  })
  const [notes, setNotes] = usePersistentState('pseudocode-notes', '', persistentString)
  const dirty = source !== appliedSource,
    frame = run?.frames[cursor],
    selectedTemplate = (Object.keys(pseudoTemplates) as PseudoTemplate[]).find((k) => pseudoTemplates[k] === source) ?? 'custom',
    canonicalFlow = appliedSource === pseudoTemplates.linear
  let worked: ReturnType<typeof binarySearchExample> | undefined
  try {
    worked = binarySearchExample(values, target)
  } catch {
    /* The worked example reports the sorted-input precondition below. */
  }
  useEffect(() => {
    if (!playing || !run) return
    const timer = window.setTimeout(() => {
      if (cursor >= run.frames.length - 1) {
        setPlaying(false)
        return
      }
      setCursor(cursor + 1)
      if (cursor + 1 === run.frames.length - 1) setPlaying(false)
    }, 450)
    return () => window.clearTimeout(timer)
  }, [playing, cursor, run])
  function open(next: Tab) {
    setTab(next)
    setPlaying(false)
    setNotice('')
    setInputOpen(false)
  }
  function chooseTemplate(kind: PseudoTemplate) {
    setSource(pseudoTemplates[kind])
    setAppliedSource(pseudoTemplates[kind])
    setRun(undefined)
    setCursor(-1)
    setPlaying(false)
    setError('')
    setFlowFocus(undefined)
  }
  function execute(end = true) {
    try {
      const next = runPseudocode(source, values, target)
      setRun(next)
      setAppliedSource(source)
      setCursor(end ? next.frames.length - 1 : 0)
      setPlaying(false)
      setError('')
      setNotice('')
      setFlowFocus(undefined)
      return next
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Pseudocode could not be executed.')
      setPlaying(false)
      return undefined
    }
  }
  function stepForward() {
    if (!run || dirty) {
      execute(false)
      return
    }
    setPlaying(false)
    setFlowFocus(undefined)
    setCursor(Math.min(cursor + 1, run.frames.length - 1))
  }
  function autoplay() {
    if (playing) {
      setPlaying(false)
      return
    }
    if (!run || dirty) {
      if (!execute(false)) return
    } else if (cursor === run.frames.length - 1) setCursor(0)
    setFlowFocus(undefined)
    setPlaying(true)
  }
  function applyInput(a?: number[], x?: number) {
    try {
      const next = a ?? parsePseudoArray(arrayDraft),
        nextX = x ?? (targetDraft.trim() ? Number(targetDraft) : NaN)
      validatePseudoInput(next, nextX)
      setValues(next)
      setTarget(nextX)
      setArrayDraft(next.join(', '))
      setTargetDraft(String(nextX))
      setRun(undefined)
      setCursor(-1)
      setPlaying(false)
      setError('')
      setWorkedStep(-1)
      setFeedback('')
      setInputOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid input.')
    }
  }
  function inspectFlow(key: FlowKey) {
    if (dirty) {
      setError('Run the edited pseudocode before inspecting its updated flow.')
      return
    }
    const next = run ?? execute(false)
    if (!next) return
    const found =
      key === 'start'
        ? 0
        : next.frames.findIndex((fr) =>
            key === 'initial' || key === 'bound' || key === 'increment'
              ? fr.phase === 'loop' && (key !== 'increment' || Number(fr.variables.i) > 0)
              : key === 'match'
                ? fr.phase === 'condition'
                : fr.phase === 'return' && (key === 'missing' ? fr.result === -1 : fr.result !== -1),
          )
    if (found < 0) {
      setNotice('This branch is not executed for the current input.')
      return
    }
    setCursor(found)
    setFlowFocus(key)
    setPlaying(false)
    setNotice(`Line ${next.frames[found].line}: inspect the current variable values in Visualize.`)
  }
  const activeFlow: FlowKey | undefined =
    flowFocus ??
    (frame?.phase === 'loop'
      ? 'bound'
      : frame?.phase === 'condition'
        ? 'match'
        : frame?.phase === 'return'
          ? frame.result === -1
            ? 'missing'
            : 'found'
          : undefined)
  async function copy() {
    try {
      await navigator.clipboard.writeText(generated)
      setNotice('Generated pseudocode copied.')
    } catch {
      setNotice('Clipboard unavailable. Select and copy the generated pseudocode manually.')
    }
  }
  return (
    <div className="mom-page pseudocode-page target-visual" data-target="12">
      <MockupLessonChrome
        {...props}
        title={tr('Algorithms and Pseudocode')}
        description={tr('Specify input, output and termination. Write clear, correct pseudocode.')}
        heroIcon={<PaperIcon />}
        decoration={<HeroArt />}
        onStart={() => open('Visualize')}
        badges={
          <>
            <span>
              <Clock3 />
              {tr('15–20 min')}
            </span>
            <span>
              <span className="pc-beginner-bars">▥</span>
              {tr('Beginner to Intermediate')}
            </span>
            <span>
              <ClipboardCheck />
              {tr('5 key concepts')}
            </span>
          </>
        }
      />
      <nav className="mom-tabs pc-tabs" aria-label={tr('Algorithm sections')}>
        {tabs.map((name, i) => {
          const Icon = tabIcons[i]
          return (
            <button key={name} aria-pressed={tab === name} onClick={() => open(name)}>
              <Icon size={18} />
              {tr(name)}
            </button>
          )
        })}
      </nav>
      {error && (
        <p className="pc-error" role="alert">
          {tr(error)}
        </p>
      )}
      {(tab === 'Learn' || tab === 'Visualize') && (
        <>
          {tab === 'Visualize' && (
            <Panel
              className="pc-trace-panel"
              title={tr('Trace the actual pseudocode execution')}
              description="Step through assignments, conditions and return statements. Changes execute only when you run the editor."
              icon={<Play />}
            >
              <div className="pc-trace-toolbar">
                <button onClick={() => execute(false)}>{tr('Restart trace')}</button>
                <button
                  disabled={!run || cursor <= 0 || dirty}
                  onClick={() => {
                    setPlaying(false)
                    setCursor(cursor - 1)
                    setFlowFocus(undefined)
                  }}
                >
                  {tr('Step back')}
                </button>
                <button disabled={!!run && !dirty && cursor === run.frames.length - 1} onClick={stepForward}>
                  {tr('Step forward')}
                </button>
                <button onClick={autoplay}>
                  {playing ? <Pause size={15} /> : <Play size={15} />} {tr(playing ? 'Pause' : 'Auto Run')}
                </button>
                <button
                  onClick={() => {
                    setRun(undefined)
                    setCursor(-1)
                    setPlaying(false)
                    setFlowFocus(undefined)
                  }}
                >
                  {tr('Clear trace')}
                </button>
              </div>
              <p className="pc-trace-message" role="status">
                {run
                  ? `${tr('Step ')}${cursor + 1}/${run.frames.length} · ${tr('Line ')}${frame?.line ?? '—'} · ${tr(frame?.phase ?? 'Ready')}${frame?.test !== undefined ? ` → ${frame.test}` : ''}`
                  : tr('Run or step forward to begin.')}
              </p>
              <div className="pc-variable-list">
                {Object.entries(frame?.variables ?? { n: values.length, x: target }).map(([name, value]) => (
                  <span key={name}>
                    <b>{name}</b> = {String(value)}
                  </span>
                ))}
              </div>
              <div className="pc-trace-array">
                {values.map((v, i) => (
                  <span key={i} className={frame?.variables.i === i || frame?.variables.mid === i ? 'active' : ''}>
                    <small>{i}</small>
                    <b>{v}</b>
                  </span>
                ))}
              </div>
            </Panel>
          )}
          <div className="pc-dashboard">
            <div className="pc-main">
              <div className="pc-primary-grid">
                <Panel
                  className={`pc-editor ${run || dirty ? 'has-run' : ''}`}
                  title={tr('Pseudocode Editor')}
                  description="Write and run pseudocode to see the flow and output."
                  icon={<Code2 />}
                  action={
                    <select
                      aria-label={tr('Pseudocode template')}
                      value={selectedTemplate}
                      onChange={(e) => {
                        if (e.target.value !== 'custom') chooseTemplate(e.target.value as PseudoTemplate)
                      }}
                    >
                      {(Object.keys(names) as PseudoTemplate[]).map((k) => (
                        <option key={k} value={k}>
                          {tr(names[k])}
                        </option>
                      ))}
                      {selectedTemplate === 'custom' && <option value="custom">{tr('Custom')}</option>}
                    </select>
                  }
                >
                  <CodeView
                    source={source}
                    editable
                    onChange={(s) => {
                      setSource(s)
                      setPlaying(false)
                    }}
                    line={!dirty ? frame?.line : undefined}
                  />
                  <div className="pc-editor-actions">
                    <button className="pc-primary" onClick={() => execute()}>
                      <Play size={15} />
                      {tr('Run')}
                    </button>
                    <button
                      onClick={() => {
                        chooseTemplate('linear')
                        applyInput(referenceArray, 12)
                      }}
                    >
                      <RotateCcw size={15} />
                      {tr('Reset')}
                    </button>
                    <button onClick={() => setInputOpen(!inputOpen)} aria-expanded={inputOpen}>
                      {tr('Example Input')}
                      <span aria-hidden="true">⌄</span>
                    </button>
                    {inputOpen && (
                      <div className="pc-input-menu">
                        <h3>{tr('Example input')}</h3>
                        <label>
                          {tr('Array A')}
                          <textarea rows={2} aria-label={tr('Pseudocode input array')} value={arrayDraft} onChange={(e) => setArrayDraft(e.target.value)} />
                        </label>
                        <label>
                          {tr('Target x')}
                          <input
                            type="number"
                            step="any"
                            aria-label={tr('Pseudocode target x')}
                            value={targetDraft}
                            onChange={(e) => setTargetDraft(e.target.value)}
                          />
                        </label>
                        <div>
                          <button onClick={() => applyInput()}>{tr('Apply input')}</button>
                          <button onClick={() => applyInput(referenceArray, 99)}>{tr('Not found')}</button>
                          <button onClick={() => applyInput([], 12)}>{tr('Empty array')}</button>
                        </div>
                        <p>{tr('0–30 finite values; binary search requires sorted input.')}</p>
                      </div>
                    )}
                  </div>
                  {run && (
                    <output className="pc-run-result">
                      {tr(dirty ? 'Last successful output: ' : cursor < run.frames.length - 1 ? 'Computed output (preview): ' : 'Output: ')}
                      <b>{String(run.result)}</b> · {run.frames.length} {tr('executed steps')}
                    </output>
                  )}
                  {dirty && !run && <p className="pc-dirty">{tr('Run to update the flowchart from your edits.')}</p>}
                </Panel>
                <Panel
                  className="pc-flow-panel"
                  title={tr('Flowchart Visualizer')}
                  description={canonicalFlow ? 'Visualize the control flow of the algorithm.' : 'Run to inspect this program’s executed path.'}
                  icon={<Network />}
                >
                  {canonicalFlow ? (
                    <LinearFlow active={!dirty ? activeFlow : undefined} onSelect={inspectFlow} />
                  ) : run ? (
                    <div className="pc-executed-path">
                      {run.frames.map((fr, i) => (
                        <button
                          key={i}
                          aria-pressed={i === cursor}
                          onClick={() => {
                            setCursor(i)
                            setPlaying(false)
                          }}
                        >
                          <b>
                            {tr('Line ')}
                            {fr.line}
                          </b>
                          <span>{run.program.source.split('\n')[fr.line - 1].trim()}</span>
                          {fr.test !== undefined && <small>{String(fr.test)}</small>}
                          {fr.result !== undefined && (
                            <small>
                              {tr('Return ')}
                              {String(fr.result)}
                            </small>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="pc-flow-empty">
                      <Network />
                      <p>{tr('Run the pseudocode to build its execution path.')}</p>
                    </div>
                  )}
                </Panel>
                <Panel
                  className={`pc-natural ${generatedEdited ? 'generated-active' : ''}`}
                  title={tr('Natural Language → Pseudocode')}
                  description="Convert a description to structured pseudocode."
                  icon={<MessageSquare />}
                >
                  <textarea aria-label={tr('Algorithm description')} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                  <button
                    className="pc-primary pc-generate"
                    onClick={() => {
                      try {
                        const kind = descriptionTemplate(description)
                        setGenerated(generatedFormat(pseudoTemplates[kind]))
                        setGeneratedEdited(true)
                        setError('')
                        setNotice('A supported template was generated. Review its preconditions before running.')
                      } catch (e) {
                        setError(e instanceof Error ? e.message : 'Description could not be converted.')
                      }
                    }}
                  >
                    <Sparkles size={18} />
                    {tr('Generate Pseudocode')}
                  </button>
                  <div className="pc-generated">
                    <h3>{tr('Generated Pseudocode')}</h3>
                    <button aria-label={tr('Copy generated pseudocode')} onClick={copy}>
                      <Copy size={16} />
                    </button>
                    <CodeView
                      source={generated
                        .split('\n')
                        .filter((s) => !s.trim().startsWith('//'))
                        .join('\n')}
                      mini
                      numbers={false}
                    />
                  </div>
                  {generatedEdited && (
                    <button
                      className="pc-open-generated"
                      onClick={() => {
                        setSource(generated)
                        setAppliedSource(generated)
                        setRun(undefined)
                        setCursor(-1)
                        setPlaying(false)
                        setNotice('Generated pseudocode opened in the editor.')
                      }}
                    >
                      {tr('Open in editor')}
                      <ArrowRight size={13} />
                    </button>
                  )}
                </Panel>
              </div>
              <div className="pc-bottom-grid">
                <Panel
                  className="pc-worked"
                  title={tr('Worked Example: Binary Search')}
                  description="Search a sorted array using divide and conquer."
                  icon={<BookOpen />}
                >
                  <div className="pc-worked-tabs">
                    {['Pseudocode', 'Explanation', 'Trace Example', 'Analysis'].map((name) => (
                      <button key={name} aria-pressed={workedTab === name} onClick={() => setWorkedTab(name)}>
                        {tr(name)}
                      </button>
                    ))}
                  </div>
                  <div className="pc-worked-grid">
                    <div>
                      {workedTab === 'Pseudocode' ? (
                        <CodeView source={pseudoTemplates.binary} mini />
                      ) : workedTab === 'Explanation' ? (
                        <div className="pc-worked-theory">
                          <h3>{tr('Halve the candidate range')}</h3>
                          <p>
                            {tr(
                              'Keep x, if present, inside A[low..high]. Test the midpoint: return it if equal, discard the left half when A[mid] < x, and discard the right half otherwise.',
                            )}
                          </p>
                          <p>{tr('Each unsuccessful test strictly reduces high − low + 1. When low > high, no candidate remains, so return −1.')}</p>
                        </div>
                      ) : workedTab === 'Analysis' ? (
                        <div className="pc-worked-theory">
                          <h3>{tr('Correctness + termination')}</h3>
                          <p>
                            {tr(
                              'Invariant: if the target is present, at least one matching index is in the candidate interval. Sorted order justifies each discarded half.',
                            )}
                          </p>
                          <p>
                            {tr(
                              'Worst-case time is O(log n); auxiliary space is O(1). Empty arrays return −1 without reading an element. Duplicate targets may return any matching index.',
                            )}
                          </p>
                        </div>
                      ) : (
                        <div className="pc-binary-stepper">
                          <h3>{tr('Predict the next midpoint')}</h3>
                          <p>{tr('Click a trace row to inspect its candidate bounds.')}</p>
                          {worked && worked.rows.length > 0 && (
                            <>
                              <div className="pc-midpoint-array">
                                {values.map((v, i) => (
                                  <span key={i} className={worked.rows[Math.max(0, workedStep)]?.mid === i ? 'active' : ''}>
                                    {v}
                                  </span>
                                ))}
                              </div>
                              <p>
                                {tr('low = ')}
                                {worked.rows[Math.max(0, workedStep)]?.low} · {tr('high = ')}
                                {worked.rows[Math.max(0, workedStep)]?.high}
                              </p>
                              <button
                                disabled={workedStep >= worked.rows.length - 1}
                                onClick={() => setWorkedStep(Math.min(workedStep + 1, worked.rows.length - 1))}
                              >
                                {tr('Next trace row')}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="pc-example-results">
                      {worked ? (
                        <>
                          <div className="pc-binary-table">
                            <h3>
                              {tr('Example Trace ')}
                              {'(A = ['}
                              {values.join(', ')}
                              {'], x = '}
                              {target})
                            </h3>
                            <table>
                              <thead>
                                <tr>
                                  {['Step', 'low', 'high', 'mid', 'A[mid]', 'Action'].map((name) => (
                                    <th key={name}>{tr(name)}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {worked.rows.map((r, i) => (
                                  <tr key={i} className={workedStep === i ? 'active' : ''} onClick={() => setWorkedStep(i)}>
                                    <td>
                                      <button aria-label={tr(`Inspect binary trace step ${i + 1}`)} onClick={() => setWorkedStep(i)}>
                                        {i + 1}
                                      </button>
                                    </td>
                                    <td>{r.low}</td>
                                    <td>{r.high}</td>
                                    <td>{r.mid}</td>
                                    <td>{r.value}</td>
                                    <td>{tr(r.action)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {worked.rows.length === 0 && <p>{tr('No candidates: return −1.')}</p>}
                          </div>
                          <div className="pc-example-cards">
                            <div>
                              <h3>
                                <CheckCircle2 />
                                {tr('Output')}
                              </h3>
                              <p>
                                {tr('Returns index ')}
                                {worked.result}
                              </p>
                              <small>{worked.result < 0 ? tr('The value is not present.') : `A[${worked.result}] = ${values[worked.result]}.`}</small>
                            </div>
                            <div>
                              <h3>
                                <Sparkles />
                                {tr('Time & Space')}
                              </h3>
                              <p>{tr('Time: O(log n)')}</p>
                              <small>{tr('Space: O(1)')}</small>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="pc-sorted-required">
                          <p>{tr('Binary search requires a sorted array. The editor can still run linear search on this input.')}</p>
                          <button
                            onClick={() =>
                              applyInput(
                                [...values].sort((a, b) => a - b),
                                target,
                              )
                            }
                          >
                            {tr('Use sorted copy')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </Panel>
                <Panel
                  className="pc-checklist"
                  title={tr('Algorithm Quality Checklist')}
                  description="Use this checklist for designing and writing pseudocode."
                  icon={<ClipboardCheck />}
                >
                  <div>
                    {quality.map((text, i) => (
                      <label key={text}>
                        <input type="checkbox" checked={checks[i]} onChange={(e) => setChecks(checks.map((v, j) => (j === i ? e.target.checked : v)))} />
                        <span>{tr(text)}</span>
                      </label>
                    ))}
                  </div>
                </Panel>
              </div>
            </div>
            <aside className="pc-sidebar-cards">
              <article className="pc-takeaways">
                <h2>
                  <Lightbulb />
                  {tr('Key Takeaways')}
                </h2>
                {[
                  'An algorithm specifies input, output, and a finite sequence of effective steps.',
                  'Pseudocode is language-independent and uses structured constructs.',
                  'State preconditions, postconditions and indexing conventions clearly.',
                  'Use meaningful variables and handle base cases.',
                  'Partial correctness + termination ⇒ total correctness.',
                ].map((s) => (
                  <p key={s}>
                    <CheckCircle2 />
                    <span>{tr(s)}</span>
                  </p>
                ))}
              </article>
              <article className="pc-pitfalls">
                <h2>
                  <AlertTriangle />
                  {tr('Common Pitfalls')}
                </h2>
                {[
                  'Missing or unclear input/output specification.',
                  'Ambiguous indexing (0-based vs 1-based).',
                  'Forgetting base cases and termination.',
                  'Using undefined variables or invalid updates.',
                  'Pseudocode that is implementation specific.',
                ].map((s) => (
                  <p key={s}>
                    <XCircle />
                    <span>{tr(s)}</span>
                  </p>
                ))}
              </article>
              <article className="pc-pro-tip">
                <Sparkles />
                <div>
                  <h2>{tr('Pro Tip')}</h2>
                  <p>
                    {tr('Use consistent indentation and structured constructs (if, while, for, function) to make your pseudocode clear and easy to analyze.')}
                  </p>
                </div>
              </article>
            </aside>
          </div>
          {notice && (
            <p className="pc-notice" role="status">
              {tr(notice)}
              <button onClick={() => setNotice('')}>{tr('Close')}</button>
            </p>
          )}
          <details className="pc-language-help">
            <summary>{tr('Supported editor language and execution limits')}</summary>
            <p>
              {tr(
                'This educational interpreter supports numeric assignments with ← or <-, read-only A[index], floor, arithmetic, comparisons, boolean and/or/not, if/else if/else, inclusive for loops, while loops, and return. Indent nested bodies; optional end if, end for and end while must match their block. Start with ALGORITHM Name(A, n, x). n is initialized to the array length and x to the target. Arbitrary JavaScript, external functions and array writes are not supported.',
              )}
            </p>
            <p>
              {tr(
                'Runs stop at 1000 executed steps. The array accepts 0–30 finite values and a finite target, each between −1000000 and 1000000. BinarySearch requires sorted input; FindMaximum needs a nonempty array. The description converter selects among four authored templates: search, binary search, maximum and sum. Other descriptions need manual pseudocode editing.',
              )}
            </p>
          </details>
        </>
      )}
      {tab === 'Practice' && (
        <Panel
          className="pc-extra"
          title={tr('Predict the return value')}
          description="Use the current pseudocode and input to predict its output before running."
          icon={<Code2 />}
        >
          <p>
            {tr('Array A: ')}[{values.join(', ')}
            {'] · x = '}
            {target}
          </p>
          <CodeView source={source} mini />
          <label>
            {tr('Your prediction')}
            <input
              aria-label={tr('Predicted pseudocode output')}
              value={prediction}
              onChange={(e) => {
                setPrediction(e.target.value)
                setFeedback('')
              }}
            />
          </label>
          <button
            onClick={() => {
              try {
                const actual = runPseudocode(source, values, target).result
                setFeedback(
                  prediction.trim() !== '' && (typeof actual === 'number' ? Number(prediction) === actual : prediction.trim().toLowerCase() === String(actual))
                    ? `Correct! The algorithm returns ${String(actual)}.`
                    : `Not yet. Follow the executed branches and zero-based indices. The current prediction is ${prediction || 'empty'}.`,
                )
                setError('')
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Fix the editor before predicting.')
              }
            }}
          >
            {tr('Check prediction')}
          </button>
          {feedback && <p role="status">{tr(feedback)}</p>}
        </Panel>
      )}
      {tab === 'Quiz' && (
        <Panel
          className="pc-extra"
          title={tr('Algorithm foundations quiz')}
          description="Check your understanding of contracts, correctness and termination."
          icon={<Trophy />}
        >
          <label>
            {tr('Question')}
            <select
              aria-label={tr('Quiz question')}
              value={question}
              onChange={(e) => {
                setQuestion(Number(e.target.value))
                setAnswer('')
                setQuizFeedback('')
              }}
            >
              {questions.map((q, i) => (
                <option key={q.question} value={i}>
                  {i + 1}. {tr(q.question)}
                </option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend>{tr(questions[question].question)}</legend>
            {questions[question].options.map((text, i) => (
              <label key={text}>
                <input type="radio" name="pseudocode-quiz" value={i} checked={answer === String(i)} onChange={(e) => setAnswer(e.target.value)} />
                {tr(text)}
              </label>
            ))}
          </fieldset>
          <button
            onClick={() =>
              setQuizFeedback(answer === String(questions[question].answer) ? `Correct. ${questions[question].why}` : `Not yet. ${questions[question].why}`)
            }
          >
            {tr('Check answer')}
          </button>
          {quizFeedback && <p role="status">{tr(quizFeedback)}</p>}
        </Panel>
      )}
      {tab === 'Notes' && (
        <Panel className="pc-extra" title={tr('Your pseudocode notes')} description="Saved automatically in this browser." icon={<FileText />}>
          <label>
            {tr('Record a precondition, a postcondition and a termination argument.')}
            <textarea aria-label={tr('Pseudocode notes')} rows={12} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
        </Panel>
      )}
    </div>
  )
}
