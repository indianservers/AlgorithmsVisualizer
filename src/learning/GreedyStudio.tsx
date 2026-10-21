// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
import { MobileDisclosure } from '../components/MobileDisclosure'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ChevronLeft, ChevronRight, Lightbulb, Play, RotateCcw, Sparkles, Target } from 'lucide-react'
import type { AlgorithmModule, LearningTab } from '../types'
import { daaLessons } from '../daa/catalog'
import { executeLesson, type DaaInput, type GreedyTree, type LearningState, type Lesson } from '../daa/types'
import designSource from '../daa/design.ts?raw'
import { CompactLessonHeader } from '../components/CompactLessonHeader'
import { AccountControl } from '../account/AccountControl'
import { LessonTabs } from '../components/LessonTabs'
import { greedyFields, greedyFieldsFor, greedyProfiles, matchesGreedyAnswer, nextGreedyPrediction, parseGreedyFields } from './greedyModel'
import './learning-studio.css'
import './greedy.css'

const lessons = daaLessons.filter((l) => l.category === 'Greedy' && l.run)
type GreedyState = NonNullable<LearningState['greedy']>
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : Number(n.toFixed(4)).toString())
const symbol = (id: number) => `S${id}`

function HuffmanTree({ root }: { root: GreedyTree }) {
  useLocaleRender()

  type Node = { node: GreedyTree; x: number; y: number; code: string }
  const nodes: Node[] = [],
    edges: { from: Node; to: Node; bit: string }[] = []
  let leaf = 0,
    depth = 0
  function visit(node: GreedyTree, level: number, code: string): Node {
    depth = Math.max(depth, level)
    const current: Node = { node, x: 0, y: level * 82 + 30, code }
    if (node.id !== undefined) current.x = leaf++ * 70 + 40
    else {
      const left = visit(node.left!, level + 1, code + '0'),
        right = visit(node.right!, level + 1, code + '1')
      current.x = (left.x + right.x) / 2
      edges.push({ from: current, to: left, bit: '0' }, { from: current, to: right, bit: '1' })
    }
    nodes.push(current)
    return current
  }
  visit(root, 0, '')
  return (
    <svg
      style={{ minWidth: Math.max(80, leaf * 70 + 10), minHeight: depth * 82 + 80 }}
      viewBox={`0 0 ${Math.max(80, leaf * 70 + 10)} ${depth * 82 + 80}`}
      role="img"
      aria-label={tx(`Huffman tree with weight ${root.weight}`, 'studios')}
    >
      {tx(
        edges.map((e, i) => (
          <g key={i}>
            <line x1={e.from.x} y1={e.from.y + 17} x2={e.to.x} y2={e.to.y - 18} />
            <text className="gr-bit" x={(e.from.x + e.to.x) / 2 + 8} y={(e.from.y + e.to.y) / 2}>
              {tx(e.bit, 'studios')}
            </text>
          </g>
        )),
        'studios',
      )}
      {tx(
        nodes.map((n, i) => (
          <g key={i} className={n.node.id !== undefined ? 'gr-leaf' : ''}>
            <title>{tx(n.node.id === undefined ? 'Merged subtree' : `${symbol(n.node.id)} · code ${n.code || '0'}`, 'studios')}</title>
            <circle cx={n.x} cy={n.y} r="21" />
            <text x={n.x} y={n.y + 5}>
              {tx(fmt(n.node.weight), 'studios')}
            </text>
            {tx(
              n.node.id !== undefined && (
                <text className="gr-symbol" x={n.x} y={n.y + 38}>
                  {tx(symbol(n.node.id), 'studios')}
                </text>
              ),
              'studios',
            )}
          </g>
        )),
        'studios',
      )}
    </svg>
  )
}

function GreedyPicture({ lesson, input, state, onInspect }: { lesson: Lesson; input: DaaInput; state: GreedyState; onInspect: (id: number) => void }) {
  useLocaleRender()

  const status = (id: number) =>
    state.current === id ? 'current' : state.selected.includes(id) ? 'accepted' : state.rejected.includes(id) ? 'rejected' : 'pending'
  if (input.intervals) {
    const min = Math.min(...input.intervals.map((r) => r[0])),
      max = Math.max(...input.intervals.map((r) => r[1])),
      span = max - min || 1
    return (
      <div className="gr-timeline" aria-label={tx('Activity timeline', 'studios')}>
        <div className="gr-scale">
          <span>
            {tx('Start ', 'studios')}
            {tx(min, 'studios')}
          </span>
          <span>
            {tx('Finish ', 'studios')}
            {tx(max, 'studios')}
          </span>
        </div>
        {tx(
          state.order.map((id) => {
            const [start, end] = input.intervals![id]
            return (
              <button
                key={id}
                className="gr-activity"
                data-status={status(id)}
                onClick={() => onInspect(id)}
                aria-label={tx(`Inspect activity ${id}`, 'studios')}
              >
                <span>
                  {tx('A', 'studios')}
                  {tx(id, 'studios')}
                  <small>
                    {tx(start, 'studios')} → {tx(end, 'studios')}
                  </small>
                </span>
                <span className="gr-track">
                  <span style={{ left: `${((start - min) / span) * 100}%`, width: `${((end - start) / span) * 100}%` }}>{tx(end - start, 'studios')}</span>
                  {tx(Number.isFinite(state.boundary) && <i style={{ left: `${((state.boundary! - min) / span) * 100}%` }} />, 'studios')}
                </span>
                <small>{tx(state.selected.includes(id) ? 'Chosen' : state.rejected.includes(id) ? 'Overlap' : 'Waiting', 'studios')}</small>
              </button>
            )
          }),
          'studios',
        )}
        <p>{tx('Rows follow finish-time order. Bars show duration; the vertical marker is the last chosen finish. Click a row to inspect it.', 'studios')}</p>
      </div>
    )
  }
  if (input.weights)
    return (
      <div className="gr-knapsack">
        <h3>
          {tx('Capacity vessel · ', 'studios')}
          {tx(fmt(input.capacity! - (state.remaining ?? input.capacity!)), 'studios')} / {tx(input.capacity, 'studios')}
          {tx(' weight', 'studios')}
        </h3>
        <div className="gr-vessel" aria-label={tx('Used knapsack capacity', 'studios')}>
          {tx(
            input.weights.map((w, id) => (
              <span
                key={id}
                title={tx(`Item ${id}: ${fmt((state.fractions?.[id] ?? 0) * w)} weight`, 'studios')}
                style={{
                  width: `${input.capacity ? (((state.fractions?.[id] ?? 0) * w) / input.capacity) * 100 : 0}%`,
                  background: `hsl(${180 + id * 27} 60% 40%)`,
                }}
              >
                {tx((state.fractions?.[id] ?? 0) > 0 ? `I${id}` : '', 'studios')}
              </span>
            )),
            'studios',
          )}
        </div>
        <div className="gr-item-grid">
          {tx(
            state.order.map((id) => (
              <button key={id} data-status={status(id)} onClick={() => onInspect(id)} aria-label={tx(`Inspect item ${id}`, 'studios')}>
                <small>
                  {tx('ITEM ', 'studios')}
                  {tx(id, 'studios')}
                </small>
                <strong>{tx(fmt(input.profits![id] / input.weights![id]), 'studios')}</strong>
                <span>{tx('profit / weight', 'studios')}</span>
                <small>
                  {tx(input.profits![id], 'studios')} / {tx(input.weights![id], 'studios')}
                </small>
                <div className="gr-fraction">
                  <i style={{ width: `${(state.fractions?.[id] ?? 0) * 100}%` }} />
                </div>
                <b>
                  {tx(fmt((state.fractions?.[id] ?? 0) * 100), 'studios')}
                  {tx('% taken', 'studios')}
                </b>
              </button>
            )),
            'studios',
          )}
        </div>
        <p>{tx('Cards are ranked by value density. A partial fill means only that fraction of the item is taken.', 'studios')}</p>
      </div>
    )
  if (input.deadlines)
    return (
      <div className="gr-schedule">
        <h3>{tx('Schedule · each slot takes one time unit', 'studios')}</h3>
        <div className="gr-slots">
          {tx(
            state.slots?.length ? (
              state.slots.map((id, i) => (
                <div key={i} data-status={id >= 0 ? 'accepted' : 'pending'}>
                  <small>
                    {tx('Slot ', 'studios')}
                    {tx(i + 1, 'studios')} · [{tx(i, 'studios')},{tx(i + 1, 'studios')}]
                  </small>
                  <strong>{tx(id < 0 ? 'Free' : `J${id}`, 'studios')}</strong>
                  <span>{tx(id < 0 ? 'No job' : `profit ${input.profits![id]}`, 'studios')}</span>
                </div>
              ))
            ) : (
              <p>{tx('No slots: every deadline is zero.', 'studios')}</p>
            ),
            'studios',
          )}
        </div>
        <div className="gr-item-grid">
          {tx(
            state.order.map((id) => (
              <button key={id} data-status={status(id)} onClick={() => onInspect(id)} aria-label={tx(`Inspect job ${id}`, 'studios')}>
                <small>
                  {tx('JOB ', 'studios')}
                  {tx(id, 'studios')}
                </small>
                <strong>{tx(input.profits![id], 'studios')}</strong>
                <span>
                  {tx('profit · deadline ', 'studios')}
                  {tx(input.deadlines![id], 'studios')}
                </span>
                <b>{tx(state.selected.includes(id) ? 'Scheduled' : state.rejected.includes(id) ? 'Rejected' : 'Waiting', 'studios')}</b>
              </button>
            )),
            'studios',
          )}
        </div>
        <p>{tx('Highest-profit jobs are considered first. A job may only occupy a slot ending at or before its deadline.', 'studios')}</p>
      </div>
    )
  return (
    <div className="gr-huffman">
      <h3>{tx(state.phase === 'codes' ? 'Prefix-code tree' : 'Minimum-weight forest', 'studios')}</h3>
      <p>{tx('Each circle shows total frequency. Edges encode left = 0, right = 1. Scroll inside a large tree to explore every branch.', 'studios')}</p>
      <div className="gr-forest">
        {tx(
          state.forest?.map((root, i) => (
            <div className="gr-tree" key={i}>
              <HuffmanTree root={root} />
            </div>
          )),
          'studios',
        )}
      </div>
      {tx(
        state.codes && (
          <div className="gr-table-scroll">
            <table>
              <caption>{tx('Codebook · weighted length = Σ frequency × code length', 'studios')}</caption>
              <thead>
                <tr>
                  <th>{tx('Symbol', 'studios')}</th>
                  <th>{tx('Frequency', 'studios')}</th>
                  <th>{tx('Code', 'studios')}</th>
                  <th>{tx('Weighted bits', 'studios')}</th>
                </tr>
              </thead>
              <tbody>
                {tx(
                  input.frequencies!.map((f, id) => (
                    <tr key={id}>
                      <th>{tx(symbol(id), 'studios')}</th>
                      <td>{tx(f, 'studios')}</td>
                      <td>
                        <code>{state.codes![id]}</code>
                      </td>
                      <td>{tx(fmt(f * state.codes![id].length), 'studios')}</td>
                    </tr>
                  )),
                  'studios',
                )}
              </tbody>
            </table>
          </div>
        ),
        'studios',
      )}
      <p>
        {tx(
          lesson.id === 'huffman-coding' ? 'The two lightest roots are merged at each step. Tree weights stay visible throughout construction.' : '',
          'studios',
        )}
      </p>
    </div>
  )
}

function GreedyLab({ lesson, tab, onTab }: { lesson: Lesson; tab: LearningTab; onTab: (tab: LearningTab) => void }) {
  useLocaleRender()

  const defaults = lesson.defaultInput!,
    profile = greedyProfiles[lesson.id]
  const [input, setInput] = useState<DaaInput>(() => structuredClone(defaults)),
    [fields, setFields] = useState(() => greedyFieldsFor(defaults)),
    [run, setRun] = useState(() => executeLesson(lesson, defaults)),
    [cursor, setCursor] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(900),
    [error, setError] = useState(''),
    [answer, setAnswer] = useState(''),
    [feedback, setFeedback] = useState(''),
    [inspected, setInspected] = useState<number>(),
    [revealed, setRevealed] = useState(false),
    [notice, setNotice] = useState('')
  const [saved, setSaved] = useState<{ input: DaaInput }[]>(() => {
    try {
      const value = JSON.parse(localStorage.getItem(`algodrishti-greedy-${lesson.id}`) ?? '[]')
      return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object' && item.input && typeof item.input === 'object').slice(0, 5) : []
    } catch {
      return []
    }
  })
  const step = run.steps[cursor],
    state = (tab === 'Learn' ? run.steps.at(-1) : step)!.state!.greedy!,
    prediction = nextGreedyPrediction(run.steps, cursor),
    interactive = ['Visualization', 'Practice', 'Experiments'].includes(tab)
  const changed = JSON.stringify(fields) !== JSON.stringify(greedyFieldsFor(input))
  const source = useMemo(() => {
    const name = {
      'activity-selection': 'activitySelection',
      'fractional-knapsack': 'fractionalKnapsack',
      'job-sequencing': 'jobSequencing',
      'huffman-coding': 'huffman',
    }[lesson.id]!
    const start = designSource.indexOf(`export function ${name}(`),
      end = designSource.indexOf('\nexport function ', start + 1)
    return designSource.slice(start, end < 0 ? undefined : end)
  }, [lesson.id])
  function go(index: number) {
    setCursor(index)
    setPlaying(false)
    setFeedback('')
    setAnswer('')
    setInspected(undefined)
    setRevealed(false)
  }
  useEffect(() => {
    if (!playing || !interactive || cursor >= run.steps.length - 1) return
    const timer = window.setTimeout(() => {
      setCursor((c) => c + 1)
      if (cursor + 1 >= run.steps.length - 1) setPlaying(false)
      setFeedback('')
      setAnswer('')
      setRevealed(false)
    }, speed)
    return () => window.clearTimeout(timer)
  }, [playing, cursor, run.steps.length, speed, interactive])
  function compute(next: DaaInput) {
    try {
      const result = executeLesson(lesson, next)
      setInput(structuredClone(next))
      setFields(greedyFieldsFor(next))
      setRun(result)
      go(0)
      setError('')
      setNotice('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Check inputs.')
      setPlaying(false)
    }
  }
  function save() {
    try {
      const next = [{ input }, ...saved].slice(0, 5)
      localStorage.setItem(`algodrishti-greedy-${lesson.id}`, JSON.stringify(next))
      setSaved(next)
      setNotice('Example saved in this browser.')
    } catch {
      setNotice('Browser storage is unavailable. Export the trace instead.')
    }
  }
  function exportTrace() {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ lesson: lesson.id, input, ...run }, null, 2)], { type: 'application/json' })),
      a = document.createElement('a')
    a.href = url
    a.download = `${lesson.id}-trace.json`
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <section className="learning-studio greedy-studio" aria-label={tx(`${lesson.title} greedy studio`, 'studios')}>
      <header className="gr-heading">
        <div>
          <span className="ls-eyebrow">
            <Sparkles size={16} />
            {tx(' THE GREEDY DECISION LAB', 'studios')}
          </span>
          <h2>{tx(lesson.title, 'studios')}</h2>
          <p>{tx(lesson.summary, 'studios')}</p>
        </div>
        <span className="ls-chip">
          {tx(lesson.time, 'studios')}
          {tx(' time · ', 'studios')}
          {tx(lesson.space, 'studios')}
          {tx(' space', 'studios')}
        </span>
      </header>
      <div className="gr-recipe">
        {tx(
          [
            ['01 · LOCAL CHOICE', profile.rule],
            ['02 · STAY FEASIBLE', profile.feasibility],
            ['03 · PRESERVE OPTIMALITY', profile.invariant],
          ].map(([title, text]) => (
            <article key={title}>
              <small>{tx(title, 'studios')}</small>
              <p>{text}</p>
            </article>
          )),
          'studios',
        )}
      </div>
      {tx(
        tab === 'Learn' && (
          <>
            <div className="ls-theory-grid">
              <article>
                <BookOpen size={20} />
                <h3>{tx('Theory in plain language', 'studios')}</h3>
                <p>
                  {tx(profile.rule, 'studios')}
                  {tx(' Unlike dynamic programming, this algorithm commits to one safe choice instead of evaluating every alternative.', 'studios')}
                </p>
                <h4>{tx('Why this choice is safe', 'studios')}</h4>
                <p>{tx(lesson.correctness, 'studios')}</p>
              </article>
              <article>
                <Target size={20} />
                <h3>{tx('Worked example', 'studios')}</h3>
                <ol>
                  {tx(
                    profile.worked.map((s) => <li key={s}>{tx(s, 'studios')}</li>),
                    'studios',
                  )}
                </ol>
                <button
                  onClick={() => {
                    compute(defaults)
                    onTab('Visualization')
                  }}
                >
                  {tx('Replay this worked example', 'studios')}
                </button>
              </article>
              <article>
                <Lightbulb size={20} />
                <h3>{tx('Common mistake', 'studios')}</h3>
                <p>{tx(profile.pitfall, 'studios')}</p>
                <h4>{tx('Implementation tradeoff', 'studios')}</h4>
                <p>{tx(profile.tradeoff, 'studios')}</p>
              </article>
            </div>
            <h3>{tx('Current example, solved', 'studios')}</h3>
            <p>{tx('This diagram reflects the last successful input. Open Visualization to edit and replay it.', 'studios')}</p>
            <GreedyPicture lesson={lesson} input={input} state={state} onInspect={setInspected} />
            <div className="gr-result">
              <span>
                {tx(
                  lesson.id === 'activity-selection' ? 'Maximum count' : lesson.id === 'huffman-coding' ? 'Weighted code length' : 'Maximum profit',
                  'studios',
                )}
              </span>
              <strong>{tx(fmt(state.objective), 'studios')}</strong>
            </div>
            <button className="ls-primary" onClick={() => onTab('Visualization')}>
              <Play size={16} />
              {tx(' Explore this example', 'studios')}
            </button>
          </>
        ),
        'studios',
      )}
      {tx(
        interactive && (
          <>
            <section className="problem-input-panel learning-input-panel">
              <div className="gr-input-heading">
                <h3>{tx('Problem Input', 'studios')}</h3>
                <label>
                  {tx('Load a worked example', 'studios')}
                  <select
                    aria-label={tx('Greedy example preset', 'studios')}
                    value=""
                    onChange={(e) => {
                      const next = e.target.value === 'default' ? defaults : profile.examples[Number(e.target.value)]?.input
                      if (next) compute(next)
                    }}
                  >
                    <option value="">{tx('Choose a preset…', 'studios')}</option>
                    <option value="default">{tx('Default worked example', 'studios')}</option>
                    {tx(
                      profile.examples.map((p, i) => (
                        <option key={p.name} value={i}>
                          {tx(p.name, 'studios')}
                        </option>
                      )),
                      'studios',
                    )}
                  </select>
                </label>
              </div>
              <div className="gr-fields">
                {tx(
                  Object.entries(defaults).map(([key, value]) => (
                    <label key={key}>
                      {tx(greedyFields[key], 'studios')}
                      {tx(
                        Array.isArray(value) ? (
                          <textarea
                            rows={5}
                            aria-label={tx(`Greedy ${greedyFields[key]}`, 'studios')}
                            value={fields[key]}
                            onChange={(e) => {
                              setFields({ ...fields, [key]: e.target.value })
                              setPlaying(false)
                            }}
                          />
                        ) : (
                          <input
                            aria-label={tx(`Greedy ${greedyFields[key]}`, 'studios')}
                            type={typeof value === 'number' ? 'number' : 'text'}
                            value={fields[key]}
                            onChange={(e) => {
                              setFields({ ...fields, [key]: e.target.value })
                              setPlaying(false)
                            }}
                          />
                        ),
                        'studios',
                      )}
                    </label>
                  )),
                  'studios',
                )}
              </div>
              <p className="gr-help">
                {tx(
                  {
                    'activity-selection': 'Enter 1–16 activities, each with start < finish. Touching endpoints are compatible.',
                    'fractional-knapsack':
                      'Enter 1–20 matching weights and profits. Weights must be positive integers; profits non-negative. Capacity: integer 0–100.',
                    'job-sequencing':
                      'Enter 1–20 matching profits and deadlines. Profits must be non-negative; deadlines: integers 0–20. Each job takes one time unit.',
                    'huffman-coding': 'Enter 1–20 positive frequencies, each at most 1,000,000.',
                  }[lesson.id],
                  'studios',
                )}
                {tx(' ', 'studios')}
                {tx(
                  lesson.id === 'huffman-coding'
                    ? 'All frequencies must be positive. Symbols are labeled S0, S1, … in input order.'
                    : 'Lists use commas or spaces. Original item IDs start at 0.',
                  'studios',
                )}
              </p>
              <div className="ls-operations">
                <button
                  className="ls-primary"
                  onClick={() => {
                    try {
                      compute(parseGreedyFields(fields, defaults))
                    } catch (e) {
                      setError(e instanceof Error ? e.message : 'Check inputs.')
                      setPlaying(false)
                    }
                  }}
                >
                  <Play size={16} />
                  {tx('Run greedy example', 'studios')}
                </button>
                <button onClick={() => compute(structuredClone(defaults))}>
                  <RotateCcw size={16} />
                  {tx('Reset default', 'studios')}
                </button>
                <button onClick={save}>{tx('Save greedy example', 'studios')}</button>
                <button onClick={exportTrace}>{tx('Export greedy trace', 'studios')}</button>
              </div>
              {tx(
                changed && (
                  <p role="status">{tx('Inputs edited. Run greedy example to apply changes; the diagram still shows the last successful run.', 'studios')}</p>
                ),
                'studios',
              )}
              {tx(
                error && (
                  <p className="ls-error" role="alert">
                    {tx(error, 'studios')}
                  </p>
                ),
                'studios',
              )}
              {tx(notice && <p role="status">{tx(notice, 'studios')}</p>, 'studios')}
            </section>
            <div className="gr-workbench">
              <div>
                <div className="gr-legend">
                  <span data-status="current">{tx('Current', 'studios')}</span>
                  <span data-status="accepted">{tx('Accepted', 'studios')}</span>
                  <span data-status="rejected">{tx('Rejected', 'studios')}</span>
                  <span>{tx('Waiting', 'studios')}</span>
                </div>
                <GreedyPicture lesson={lesson} input={input} state={state} onInspect={setInspected} />
              </div>
              <aside className="gr-decision">
                <span className="ls-eyebrow">{tx('ONE SAFE CHOICE AT A TIME', 'studios')}</span>
                <h3>
                  {tx('Step ', 'studios')}
                  {tx(cursor + 1, 'studios')}
                  {tx(' of ', 'studios')}
                  {tx(run.steps.length, 'studios')}
                </h3>
                <p aria-live="polite">
                  {tx(
                    step.type === 'complete' ? 'All choices are complete. Inspect the final solution below or replay the decisions.' : step.description,
                    'studios',
                  )}
                </p>
                <div className="gr-reason">{tx(state.reason, 'studios')}</div>
                <div className="gr-result">
                  <span>
                    {tx(
                      lesson.id === 'activity-selection' ? 'Chosen count' : lesson.id === 'huffman-coding' ? 'Weighted bits so far' : 'Profit so far',
                      'studios',
                    )}
                  </span>
                  <strong>{tx(fmt(state.objective), 'studios')}</strong>
                </div>
                <p>
                  {tx('Phase: ', 'studios')}
                  {tx(step.type === 'complete' ? 'complete' : state.phase, 'studios')}
                </p>
                <h4>{tx('Proof checkpoint', 'studios')}</h4>
                <p>{tx(profile.invariant, 'studios')}</p>
              </aside>
            </div>
            <div className="gr-controls">
              <button aria-label={tx('Replay greedy trace', 'studios')} onClick={() => go(0)}>
                <RotateCcw size={16} />
              </button>
              <button aria-label={tx('Previous greedy step', 'studios')} disabled={cursor === 0} onClick={() => go(cursor - 1)}>
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => {
                  if (cursor === run.steps.length - 1) go(0)
                  setPlaying(!playing)
                }}
              >
                {tx(playing && cursor < run.steps.length - 1 ? 'Pause' : 'Play', 'studios')}
              </button>
              <button aria-label={tx('Next greedy step', 'studios')} disabled={cursor === run.steps.length - 1} onClick={() => go(cursor + 1)}>
                <ChevronRight size={16} />
              </button>
              <input
                type="range"
                aria-label={tx('Greedy timeline', 'studios')}
                min={0}
                max={run.steps.length - 1}
                value={cursor}
                onChange={(e) => go(Number(e.target.value))}
              />
              <label>
                {tx('Speed', 'studios')}
                <select aria-label={tx('Greedy playback speed', 'studios')} value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                  <option value={1600}>{tx('Slow', 'studios')}</option>
                  <option value={900}>{tx('Normal', 'studios')}</option>
                  <option value={350}>{tx('Fast', 'studios')}</option>
                </select>
              </label>
              <button onClick={() => go(run.steps.length - 1)}>{tx('Jump to solution', 'studios')}</button>
            </div>
            <section className="gr-prediction">
              <Target size={22} />
              <div>
                <span className="ls-eyebrow">{tx('PREDICT BEFORE REVEALING', 'studios')}</span>
                <h3>{tx(prediction?.question ?? 'All decisions explored', 'studios')}</h3>
                {tx(
                  prediction ? (
                    <>
                      <p>{tx('Use the visible state and the greedy rule. Numeric answers accept decimals (tolerance 0.001%).', 'studios')}</p>
                      <div className="ls-operations">
                        <label>
                          {tx('Your prediction', 'studios')}
                          <input aria-label={tx('Greedy prediction', 'studios')} value={answer} onChange={(e) => setAnswer(e.target.value)} />
                        </label>
                        <button
                          onClick={() => {
                            setPlaying(false)
                            setFeedback(
                              matchesGreedyAnswer(answer, prediction.answer)
                                ? `Correct. ${prediction.explanation}`
                                : 'Not yet. Check the ordering rule and remaining feasible choices, then try again.',
                            )
                          }}
                        >
                          {tx('Check prediction', 'studios')}
                        </button>
                        <button onClick={() => go(prediction.index)}>{tx('Reveal next decision', 'studios')}</button>
                      </div>
                      {tx(feedback && <p role="status">{tx(feedback, 'studios')}</p>, 'studios')}
                    </>
                  ) : (
                    <button onClick={() => go(0)}>{tx('Try the challenge again', 'studios')}</button>
                  ),
                  'studios',
                )}
              </div>
            </section>
            {tx(
              cursor === run.steps.length - 1 && (
                <div className="gr-final">
                  <h3>{tx('Final solution', 'studios')}</h3>
                  <p>{tx(state.reason, 'studios')}</p>
                  {tx(
                    input.intervals && (
                      <p>
                        {tx('Chosen activities: ', 'studios')}
                        {tx(state.selected.map((id) => `A${id}`).join(' → '), 'studios')}
                        {tx('. Maximum compatible count: ', 'studios')}
                        <strong>{tx(state.objective, 'studios')}</strong>.
                      </p>
                    ),
                    'studios',
                  )}
                  {tx(
                    input.weights && (
                      <p>
                        {tx('Take ', 'studios')}
                        {tx(state.fractions?.map((fraction, id) => `item ${id}: ${fmt(fraction * 100)}%`).join(' · '), 'studios')}
                        {tx('. Total profit:', 'studios')}
                        {tx(' ', 'studios')}
                        <strong>{tx(fmt(state.objective), 'studios')}</strong>
                        {tx('; used weight: ', 'studios')}
                        {tx(fmt(input.capacity! - (state.remaining ?? 0)), 'studios')}.
                      </p>
                    ),
                    'studios',
                  )}
                  {tx(
                    input.deadlines && (
                      <p>
                        {tx('Schedule: ', 'studios')}
                        {tx(state.slots?.map((id, i) => `slot ${i + 1}: ${id < 0 ? 'free' : `job ${id}`}`).join(' · ') || 'no feasible slots', 'studios')}
                        {tx('. Total profit:', 'studios')}
                        {tx(' ', 'studios')}
                        <strong>{tx(state.objective, 'studios')}</strong>.
                      </p>
                    ),
                    'studios',
                  )}
                  {tx(
                    input.frequencies && (
                      <p>
                        {tx('The codebook above uses ', 'studios')}
                        <strong>
                          {tx(fmt(state.objective), 'studios')}
                          {tx(' weighted bits', 'studios')}
                        </strong>
                        {tx(', compared with', 'studios')}
                        {tx(' ', 'studios')}
                        {tx(fmt(input.frequencies.reduce((a, b) => a + b, 0) * Math.max(1, Math.ceil(Math.log2(input.frequencies.length)))), 'studios')}
                        {tx(' for a fixed-length binary code (', 'studios')}
                        {tx(Math.max(1, Math.ceil(Math.log2(input.frequencies.length))), 'studios')}
                        {tx(' bits per symbol). Average length:', 'studios')}
                        {tx(' ', 'studios')}
                        {tx(fmt(state.objective / input.frequencies.reduce((a, b) => a + b, 0)), 'studios')}
                        {tx(' bits per symbol. Frequencies are counts, not percentages.', 'studios')}
                      </p>
                    ),
                    'studios',
                  )}
                </div>
              ),
              'studios',
            )}
          </>
        ),
        'studios',
      )}
      {tx(
        inspected !== undefined && ['Learn', 'Visualization', 'Practice', 'Experiments'].includes(tab) && (
          <MobileDisclosure className="ls-inspector" title={tx('Inspect current state', 'studios')}>
            <strong>
              {tx('Inspect #', 'studios')}
              {tx(inspected, 'studios')}
            </strong>
            <p>
              {tx(
                input.intervals
                  ? `Activity [${input.intervals[inspected].join(', ')}]`
                  : input.weights
                    ? `Weight ${input.weights[inspected]}, profit ${input.profits![inspected]}, ratio ${fmt(input.profits![inspected] / input.weights[inspected])}`
                    : `Profit ${input.profits![inspected]}, deadline ${input.deadlines![inspected]}`,
                'studios',
              )}
            </p>
            <p>{tx(state.selected.includes(inspected) ? 'Accepted' : state.rejected.includes(inspected) ? 'Rejected' : 'Not considered yet', 'studios')}</p>
          </MobileDisclosure>
        ),
        'studios',
      )}
      {tx(
        tab === 'Practice' && (
          <div className="gr-proof">
            <h3>{tx('Explain the boundary of the rule', 'studios')}</h3>
            <p>{tx(lesson.exercise.question, 'studios')}</p>
            <button onClick={() => setRevealed(!revealed)}>{tx(revealed ? 'Hide reasoning' : 'Reveal reasoning', 'studios')}</button>
            {tx(revealed && <p>{tx(lesson.exercise.answer, 'studios')}</p>, 'studios')}
            <h4>{tx('Proof checklist', 'studios')}</h4>
            <ol>
              <li>{tx('Identify the greedy choice.', 'studios')}</li>
              <li>{tx('Exchange it into an optimal solution without losing feasibility or value.', 'studios')}</li>
              <li>{tx('Apply the same reasoning to the remaining subproblem.', 'studios')}</li>
            </ol>
          </div>
        ),
        'studios',
      )}
      {tx(
        tab === 'Code' && (
          <div className="gr-code">
            <h3>{tx('Algorithm recipe', 'studios')}</h3>
            <ol>
              {tx(
                lesson.pseudocode.map((s) => <li key={s}>{tx(s, 'studios')}</li>),
                'studios',
              )}
            </ol>
            <h3>{tx('Actual TypeScript implementation', 'studios')}</h3>
            <p>{tx('This is the implementation generating the trace, including educational state snapshots.', 'studios')}</p>
            <pre>
              <code>{source}</code>
            </pre>
            <h3>{tx('Complexity derivation', 'studios')}</h3>
            <p>{tx(lesson.derivation, 'studios')}</p>
          </div>
        ),
        'studios',
      )}
      {tx(
        tab === 'Experiments' && (
          <div className="ls-experiments">
            <h3>{tx('Saved greedy examples', 'studios')}</h3>
            {tx(!saved.length && <p>{tx('No examples saved yet. Save the current successful input above, then compare a preset.', 'studios')}</p>, 'studios')}
            {tx(
              saved.map((s, i) => (
                <article key={i}>
                  <code>{JSON.stringify(s.input)}</code>
                  <button
                    onClick={() => {
                      compute(s.input)
                      onTab('Visualization')
                    }}
                  >
                    {tx('Load greedy example ', 'studios')}
                    {tx(i + 1, 'studios')}
                  </button>
                </article>
              )),
              'studios',
            )}
          </div>
        ),
        'studios',
      )}
    </section>
  )
}

export function GreedySuiteLearning({ module, tab, onTab }: { module: AlgorithmModule; tab: LearningTab; onTab: (tab: LearningTab) => void }) {
  useLocaleRender()

  const [selected, setSelected] = useState('activity-selection')
  return (
    <div className="gr-suite">
      <section className="learning-studio gr-suite-intro">
        <span className="ls-eyebrow">{tx('CHOOSE · JUSTIFY · REPEAT', 'studios')}</span>
        <h2>{tx(module.name, 'studios')}</h2>
        <p>{tx(module.summary, 'studios')}</p>
        {tx(
          module.id === 'greedy-exchange' && (
            <div className="gr-exchange">
              <h3>{tx('The exchange argument', 'studios')}</h3>
              <p>
                {tx(
                  'Start from an optimal solution. Replace its first choice with the greedy choice. Show that this replacement preserves feasibility and does not worsen the objective. Solve the smaller remaining problem in the same way.',
                  'studios',
                )}
              </p>
              <h4>{tx('Counterexample: optimal substructure is not enough', 'studios')}</h4>
              <p>
                {tx(
                  'For coins [1,3,4], amount 6: largest-first chooses 4+1+1 (3 coins), but 3+3 uses 2. A local rule needs a proof, not just successful examples.',
                  'studios',
                )}
              </p>
              <p>
                {tx(
                  'Compare the safe exchange used in each of the four labs below. Fractional exchanges are legal in fractional knapsack, but not in 0/1 knapsack.',
                  'studios',
                )}
              </p>
            </div>
          ),
          'studios',
        )}
        <label>
          {tx('Choose a greedy concept', 'studios')}
          <select aria-label={tx('Greedy suite concept', 'studios')} value={selected} onChange={(e) => setSelected(e.target.value)}>
            {tx(
              lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {tx(l.title, 'studios')}
                </option>
              )),
              'studios',
            )}
          </select>
        </label>
        <nav className="gr-related" aria-label={tx('Full greedy lessons', 'studios')}>
          {tx(
            lessons.map((l) => (
              <Link key={l.id} to={`/greedy/${l.id}`}>
                {tx(l.title, 'studios')} →
              </Link>
            )),
            'studios',
          )}
        </nav>
      </section>
      <GreedyLab key={selected} lesson={lessons.find((l) => l.id === selected)!} tab={tab} onTab={onTab} />
    </div>
  )
}
export function GreedyLessonPage({
  module,
  completed,
  toggleCompleted,
}: {
  module: AlgorithmModule
  completed: string[]
  toggleCompleted: (id: string) => void
}) {
  useLocaleRender()

  const [tab, setTab] = useState<LearningTab>('Visualization'),
    lesson = lessons.find((l) => l.id === module.id)
  return (
    <div className="lesson-surface greedy-page daa-workspace compact-daa" data-learning-tab={tab}>
      <CompactLessonHeader
        title={tx(module.name, 'studios')}
        description={module.summary}
        studied={completed.includes(module.id)}
        onStudy={() => toggleCompleted(module.id)}
        account={<AccountControl />}
      />
      <LessonTabs active={tab} onChange={setTab} />
      {tx(lesson ? <GreedyLab lesson={lesson} tab={tab} onTab={setTab} /> : <GreedySuiteLearning module={module} tab={tab} onTab={setTab} />, 'studios')}
    </div>
  )
}
