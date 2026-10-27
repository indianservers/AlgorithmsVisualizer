// @localized-render
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Code2,
  FileText,
  FlaskConical,
  GraduationCap,
  Layers3,
  Lightbulb,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Sun,
  Timer,
  X,
} from 'lucide-react'
import { tx, useLocaleRender } from '../i18n/render'
import { AccountControl } from '../account/AccountControl'
import { LanguageSelector } from '../i18n/LanguageSelector'
import { allModules } from '../algorithms'
import { algorithmPath } from '../utils/routing'
import { medianGroups, medianReferenceValues, medianTrace, parseMedianValues, type MedianFrame } from './medianModel'
import modelSource from './medianModel.ts?raw'
import type { AlgorithmModule } from '../types'
import './median-mockup.css'
import './median-reference.css'

const tabs = ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments', 'Notes'] as const
type Tab = (typeof tabs)[number]
const tabIcons = [BookOpen, Play, Code2, GraduationCap, FlaskConical, FileText]
const tr = (s: string) => tx(s, 'studios')
function Numbers({ values, tone = '', selected }: { values: number[]; tone?: string; selected?: number }) {
  return (
    <div className={`mom-numbers ${tone}`} dir="ltr">
      {values.map((v, i) => (
        <span key={i} className={selected === i ? 'chosen' : ''}>
          {v}
        </span>
      ))}
    </div>
  )
}
function Panel({
  number,
  title,
  description,
  children,
  className = '',
  onExplain,
  icon,
}: {
  number?: number
  title: string
  description?: string
  children: ReactNode
  className?: string
  onExplain?: () => void
  icon?: ReactNode
}) {
  return (
    <article className={`mom-panel ${className}`}>
      <header>
        {onExplain ? (
          <button
            className={`median-explain ${number ? 'median-explain-number' : 'median-explain-icon'}`}
            aria-label={tr(`Explain ${title}`)}
            onClick={onExplain}
          >
            {number ? <b className="mom-number">{number}</b> : (icon ?? <BarChart3 size={23} />)}
          </button>
        ) : number ? (
          <b className="mom-number">{number}</b>
        ) : (
          (icon ?? <BarChart3 size={23} />)
        )}
        <div>
          <h2>{tr(title)}</h2>
          {description && <p>{tr(description)}</p>}
        </div>
      </header>
      {children}
    </article>
  )
}
function Split({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`mom-split ${compact ? 'compact' : ''}`} aria-label={tr('Schematic pivot split')}>
      <div>
        {Array.from({ length: 10 }, (_, i) => (
          <i key={i} />
        ))}
      </div>
      <b>{'p'}</b>
      <div>
        {Array.from({ length: 10 }, (_, i) => (
          <i key={i} />
        ))}
      </div>
      {!compact && (
        <>
          <span>
            {tr('≥ 3n/10 − O(1) elements')}
            <br />≤ {tr('pivot')}
          </span>
          <span>
            {tr('≥ 3n/10 − O(1) elements')}
            <br />≥ {tr('pivot')}
          </span>
        </>
      )}
    </div>
  )
}
function Workflow({ onExplain }: { onExplain: (condition: string, action: string) => void }) {
  return (
    <div className="mom-workflow">
      <div
        className="mom-flow-start"
        role="button"
        tabIndex={0}
        aria-label={tr('Explain pivot selection and partitioning')}
        onClick={() =>
          onExplain(
            'Select a pivot, then partition',
            'Recursively select the median of the group medians. Partition every original value into L (< p), E (= p), or R (> p). Rank k is one-based.',
          )
        }
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onExplain(
              'Select a pivot, then partition',
              'Recursively select the median of the group medians. Partition every original value into L (< p), E (= p), or R (> p). Rank k is one-based.',
            )
          }
        }}
      >
        <span>
          {tr('Array A')}
          <small>{tr('Select rank k')}</small>
        </span>
        <ArrowRight />
        <span>
          {tr('Choose pivot')}
          <small>{tr('(median of medians)')}</small>
        </span>
        <ArrowRight />
        <span className="orange">
          {tr('Three-way')}
          <small>{tr('partition')}</small>
        </span>
      </div>
      <svg className="median-workflow-fork" viewBox="0 0 25 100" aria-hidden="true">
        <defs>
          <marker id="median-flow-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
            <path d="M0 0L5 2.5L0 5" fill="#004fc3" />
          </marker>
        </defs>
        {['M0 50H8V10Q8 0 18 0H24', 'M8 50H24', 'M8 50V90Q8 100 18 100H24'].map((d) => (
          <path key={d} d={d} fill="none" stroke="#004fc3" markerEnd="url(#median-flow-arrow)" />
        ))}
      </svg>
      <div className="mom-flow-branches">
        {[
          ['k ≤ |L|', 'Recurse on L', 'blue'],
          ['|L| < k ≤ |L| + |E|', 'Return pivot', 'purple'],
          ['k > |L| + |E|', 'Recurse on R', 'green'],
        ].map(([condition, action, color]) => (
          <div
            key={condition}
            role="button"
            tabIndex={0}
            aria-label={tr(`Explain workflow branch ${condition}`)}
            onClick={() =>
              onExplain(
                condition,
                color === 'green'
                  ? 'Recurse on R with k′ = k − |L| − |E|. The rank decreases because the lower and equal blocks are skipped.'
                  : color === 'blue'
                    ? 'Recurse on L with the same rank k. The requested value lies among the |L| smaller values.'
                    : 'Return the pivot. The equal block occupies ranks |L|+1 through |L|+|E|, including duplicates.',
              )
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.currentTarget.click()
              }
            }}
          >
            <span className={color}>{condition}</span>
            <ArrowRight />
            <span className={color}>
              {tr(action)}
              {color === 'green' && <small>{tr('k′ = k − |L| − |E|')}</small>}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LearnDashboard({ onExplore }: { onExplore: (phase?: MedianFrame['phase']) => void }) {
  const groups = medianGroups(medianReferenceValues),
    sorted = groups.map((g) => [...g].sort((a, b) => a - b)),
    medians = sorted.map((g) => g[Math.floor(g.length / 2)])
  const [proof, setProof] = useState('Key Points'),
    [inspector, setInspector] = useState<{ title: string; body: string } | null>(null),
    dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (inspector && !dialog.current?.open) dialog.current?.showModal()
  }, [inspector])
  const explain = (title: string, body: string) => setInspector({ title, body }),
    inspectGroup = (i: number) =>
      explain(
        `Group ${i + 1}: median ${medians[i]}`,
        `Original order: [${groups[i].join(', ')}]. Sorted order: [${sorted[i].join(', ')}]. Choose zero-based index ${Math.floor(sorted[i].length / 2)} to obtain ${medians[i]}. A final incomplete group is still allowed; rounding contributes an additive constant to the split bound.`,
      )
  return (
    <div className="mom-dashboard">
      <div className="mom-main-grid">
        <Panel number={1} title={tr('Groups of Five')} description="Divide the array into groups of at most 5 elements." className="mom-groups-panel">
          <div className="mom-group-list">
            {groups.map((g, i) => (
              <div
                className={`mom-group tone-${i}`}
                key={i}
                role="button"
                tabIndex={0}
                aria-label={tr(`Inspect group ${i + 1}`)}
                onClick={() => inspectGroup(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    inspectGroup(i)
                  }
                }}
              >
                <b>
                  {tr('Group')} {i + 1}
                </b>
                <Numbers values={g} />
              </div>
            ))}
          </div>
        </Panel>
        <Panel
          number={2}
          title={tr('Find Medians of Each Group')}
          description="Sort each group (or use a small fixed network) and take the median."
          className="mom-sort-panel"
        >
          <div className="mom-sorted-groups">
            <div>
              {sorted.map((g, i) => (
                <div
                  className={`mom-sorted-row tone-${i}`}
                  key={i}
                  role="button"
                  tabIndex={0}
                  aria-label={tr(`Inspect sorted group ${i + 1}`)}
                  onClick={() => inspectGroup(i)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      inspectGroup(i)
                    }
                  }}
                >
                  <b>
                    {'G'}
                    {i + 1}
                  </b>
                  <Numbers values={g} />
                  <ArrowRight />
                  <strong>{medians[i]}</strong>
                </div>
              ))}
            </div>
            <div className="mom-medians-column">
              <b>{tr('Medians array')}</b>
              {medians.map((v, i) => (
                <span key={i}>{v}</span>
              ))}
            </div>
          </div>
        </Panel>
        <Panel
          number={3}
          title={tr('Recursively Select Pivot (Median of Medians)')}
          description="The medians form a smaller array. Recursively find its median to use as pivot."
          className="mom-pivot-panel"
          onExplain={() =>
            explain(
              'Why recurse on medians?',
              'For these 21 values, the group medians are [5, 6, 11, 17, 19]. Their median is 11. Selecting this median recursively gives the pivot guarantee; choosing an arbitrary group median does not. The medians form a smaller selection problem of size ⌈n/5⌉.',
            )
          }
        >
          <div className="mom-pivot-flow">
            <div>
              <b>{tr('Medians array (size ⌈n/5⌉)')}</b>
              <Numbers values={medians} />
            </div>
            <ArrowRight />
            <div className="mom-pivot-result">
              <b>{tr('Median = 11')}</b>
              <span>{tr('(pivot)')}</span>
            </div>
          </div>
        </Panel>
        <Panel
          number={4}
          title={tr('Guaranteed Split (≈ 3n/10 on each side)')}
          description="At least half the medians are ≥ pivot and half are ≤ pivot. Each full median group contributes three elements."
          className="mom-guarantee-panel"
          onExplain={() =>
            explain(
              'The split guarantee includes rounding',
              'Among the group medians, at least half are at most the pivot and at least half are at least the pivot. Each full group with such a median contributes three values on that side. The last incomplete group and rounding require a constant adjustment: at least 3n/10 − O(1) values on either side. These counts use ≤ and ≥, so duplicates are handled by the equal block.',
            )
          }
        >
          <Split />
        </Panel>
        <div className="mom-last-row">
          <Panel
            number={5}
            title={tr('Selection Workflow')}
            description="Use the pivot to partition and recurse on the appropriate side."
            className="mom-workflow-panel"
          >
            <Workflow onExplain={explain} />
          </Panel>
          <Panel
            title={tr('Recurrence & Linear-Time Guarantee')}
            description="The running time satisfies:"
            className="mom-recurrence-panel"
            onExplain={() =>
              explain(
                'Why the running time is linear',
                'There are two recursive calls: one on about n/5 medians and one on at most 7n/10 + O(1) remaining values. Their fractions sum to 9/10 < 1. Grouping, sorting constant-size groups and partitioning cost O(n) per call, giving T(n) = O(n). The learning trace stores extra snapshots beyond the algorithm’s working space.',
              )
            }
          >
            <div className="mom-formula">{tr('T(n) ≤ T(⌈n/5⌉) + T(7n/10 + O(1)) + O(n)')}</div>
            <ul>
              {[
                'Medians array has size ⌈n/5⌉.',
                'At most 7n/10 + O(1) elements after partition.',
                'Copied active partitions have geometric total size.',
                'Solves to T(n) = O(n).',
              ].map((s) => (
                <li key={s}>
                  <CheckCircle2 />
                  {tr(s)}
                </li>
              ))}
            </ul>
            <span className="mom-linear">
              <CheckCircle2 size={16} />
              {tr('Guaranteed linear time')}
            </span>
          </Panel>
        </div>
      </div>
      <aside className="mom-side-cards">
        <article className="mom-takeaways">
          <h2>
            <Lightbulb />
            {tr('Key Takeaways')}
          </h2>
          {[
            ['Pick pivot as median of medians of 5.', 'Deterministic and guarantees a good split.'],
            ['At least 3n/10 − O(1) on each side.', 'Ensures a linear-time worst-case bound.'],
            ['Use three-way partitioning.', '< pivot, = pivot, > pivot for duplicates.'],
            ['Simple, powerful, and robust.', 'Works for selection and as a pivot rule for Quicksort.'],
          ].map(([a, b]) => (
            <div className="mom-tip-row" key={a}>
              <CheckCircle2 />
              <p>
                <b>{tr(a)}</b>
                <span>{tr(b)}</span>
              </p>
            </div>
          ))}
        </article>
        <article className="mom-pitfalls">
          <h2>
            <AlertTriangle />
            {tr('Common Pitfalls')}
          </h2>
          {[
            ['Using a group size other than 5.', 'The standard 3n/10 proof may no longer apply.'],
            ['Not using three-way partitioning.', 'Can lead to incorrect handling of duplicates.'],
            ['Forgetting to recurse on medians.', 'Pivot must come from medians, not a random group.'],
            ['Off-by-one in rank after partition.', 'Adjust k correctly for the recursive side.'],
          ].map(([a, b]) => (
            <div className="mom-tip-row" key={a}>
              <span>×</span>
              <p>
                <b>{tr(a)}</b>
                <span>{tr(b)}</span>
              </p>
            </div>
          ))}
        </article>
        <article className="mom-pro-tip">
          <h2>
            <Sparkles />
            {tr('Pro Tip')}
          </h2>
          <p>
            {tr(
              'Group size 5 is a sweet spot: it gives a simple constant-time median computation and the standard 3n/10 split guarantee, leading to a clean linear-time bound.',
            )}
          </p>
        </article>
      </aside>
      <div className="mom-bottom-grid">
        <Panel
          title={tr('Worked Example: Find the 7th Smallest (1-indexed)')}
          description="Find the 7th smallest in A = [7, 2, 9, 4, 5, 12, 3, 8, 6, 1, 11, 13, 0, 10, 14] (n = 15)."
          className="mom-worked-example"
          icon={<FileText size={23} />}
        >
          <div className="mom-worked-stages">
            {[
              ['Group into 5s', 'M = [5, 6, 11]'],
              ['Median of M', '6 is the pivot'],
              ['Partition around 6', '|L| = 6, |E| = 1'],
              ['Rank 7 is in E', '6 < 7 ≤ 7'],
              ['Result', '7th smallest is 6'],
            ].map(([title, body], i) => (
              <div
                key={title}
                role="button"
                tabIndex={0}
                aria-label={tr(`Explore worked example step ${i + 1}`)}
                onClick={() => onExplore((['groups', 'pivot', 'partition', 'recurse', 'answer'] as const)[i])}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    e.currentTarget.click()
                  }
                }}
              >
                <b>{i + 1}</b>
                <span>{tr(title)}</span>
                <strong>{tr(body)}</strong>
              </div>
            ))}
          </div>
          <button className="mom-example-link" onClick={() => onExplore()}>
            {tr('Explore this worked example')}
            <ArrowRight size={14} />
          </button>
        </Panel>
        <Panel title={tr('Correctness and Complexity')} className="mom-correctness">
          <div className="mom-proof-tabs" role="group" aria-label={tr('Correctness topics')}>
            {['Key Points', 'Assumptions & Constraints', 'Formulas'].map((label) => (
              <button key={label} aria-pressed={proof === label} onClick={() => setProof(label)}>
                {tr(label)}
              </button>
            ))}
          </div>
          {proof === 'Key Points' ? (
            <div className="mom-correctness-columns">
              <p>
                <CheckCircle2 />
                <b>{tr('Correctness')}</b>
                <span>{tr('Every value is in L, E or R. Its block determines the answer, or the unique smaller subproblem containing rank k.')}</span>
              </p>
              <p>
                <Timer />
                <b>{tr('Complexity')}</b>
                <span>
                  {tr('Time: O(n)')}
                  <br />
                  {tr('Auxiliary space: O(n)')}
                  <br />
                  {tr('The two recursive fractions sum to 9/10, below 1.')}
                </span>
              </p>
            </div>
          ) : (
            <p className="mom-proof-content">
              {tr(
                proof === 'Formulas'
                  ? 'If k ≤ |L|, keep k; if |L| < k ≤ |L|+|E|, return p; otherwise use k′ = k−|L|−|E|. T(n) ≤ T(⌈n/5⌉)+T(7n/10+O(1))+O(n).'
                  : 'Ranks are one-based. The last group may contain fewer than five values. Finite-size split bounds have additive rounding constants. Equal values form their own partition. Stored visualization snapshots are additional to algorithm space.',
              )}
            </p>
          )}
        </Panel>
      </div>
      <section className="mom-theory-detail">
        <h2>{tr('Theory in plain language')}</h2>
        <p>
          {tr(
            'A good pivot prevents selection from repeatedly keeping almost the entire input. Group medians provide an inexpensive certificate that many values lie on either side. Recursively selecting the middle median guarantees progress without randomness.',
          )}
        </p>
      </section>
      {inspector && (
        <dialog
          ref={dialog}
          className="median-inspector"
          onCancel={() => setInspector(null)}
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspector(null)
          }}
        >
          <header>
            <h2>{tr(inspector.title)}</h2>
            <button aria-label={tr('Close median inspector')} onClick={() => setInspector(null)}>
              <X size={20} />
            </button>
          </header>
          <p>{tr(inspector.body)}</p>
        </dialog>
      )}
    </div>
  )
}

function LiveFrame({ frame }: { frame: MedianFrame }) {
  return (
    <div className="mom-live-frame">
      <div className="mom-live-context">
        <b>{tr(frame.purpose === 'pivot' ? 'Selecting a pivot recursively' : 'Selecting the requested rank')}</b>
        <span>
          {tr('Depth')} {frame.depth}
          {tr(' · k = ')}
          {frame.rank}
          {tr(' · n = ')}
          {frame.values.length}
        </span>
      </div>
      <div className="mom-group-list">
        {frame.groups.map((g, i) => (
          <div className={`mom-group tone-${i % 5}`} key={i}>
            <b>
              {'G'}
              {i + 1}
            </b>
            <Numbers values={frame.phase === 'groups' ? g : frame.sorted[i]} selected={frame.phase === 'groups' ? undefined : Math.floor(g.length / 2)} />
          </div>
        ))}
      </div>
      {frame.phase !== 'groups' && (
        <div className="mom-live-medians">
          <b>{tr('Medians')}</b>
          <Numbers values={frame.medians} />
        </div>
      )}
      {frame.pivot !== undefined && (
        <p className="mom-live-pivot">
          {tr('Pivot')} = <strong>{frame.pivot}</strong>
        </p>
      )}
      {frame.lower && (
        <div className="mom-partitions">
          {[
            [tr('Less than pivot'), frame.lower, 'blue'],
            [tr('Equal to pivot'), frame.equal!, 'purple'],
            [tr('Greater than pivot'), frame.upper!, 'green'],
          ].map(([label, values, tone]) => (
            <div key={String(label)} className={String(tone)}>
              <b>{String(label)}</b>
              <Numbers values={values as number[]} />
              <span>
                |{tone === 'blue' ? 'L' : tone === 'purple' ? 'E' : 'R'}| = {(values as number[]).length}
              </span>
            </div>
          ))}
        </div>
      )}
      <p className="mom-frame-reason" aria-live="polite">
        {tr(frame.message)}
      </p>
    </div>
  )
}

export function MedianOfMediansLesson({
  module,
  completed,
  toggleCompleted,
  theme: controlledTheme,
  onToggleTheme,
}: {
  module: AlgorithmModule
  completed: string[]
  toggleCompleted: (id: string) => void
  theme?: string
  onToggleTheme?: () => void
}) {
  useLocaleRender()
  const navigate = useNavigate(),
    [tab, setTab] = useState<Tab>('Learn'),
    [query, setQuery] = useState(''),
    [localTheme, setTheme] = useState(() => localStorage.getItem('algodrishti-theme') ?? 'light'),
    [draft, setDraft] = useState(medianReferenceValues.join(', ')),
    [rank, setRank] = useState('11'),
    [computed, setComputed] = useState(() => medianTrace(medianReferenceValues, 11)),
    [cursor, setCursor] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(800),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [guess, setGuess] = useState(''),
    [feedback, setFeedback] = useState(''),
    [notes, setNotes] = useState(() => localStorage.getItem('algodrishti-median-notes') ?? '')
  const [saved, setSaved] = useState<{ values: number[]; rank: number }[]>(() => {
    try {
      const v = JSON.parse(localStorage.getItem('algodrishti-median-experiments') ?? '[]')
      return Array.isArray(v) ? v.filter((x) => x && Array.isArray(x.values) && Number.isInteger(x.rank)).slice(0, 5) : []
    } catch {
      return []
    }
  })
  const theme = controlledTheme ?? localTheme
  const studied = completed.includes(module.id),
    frame = computed.frames[cursor],
    matches = useMemo(
      () => (query.trim() ? allModules.filter((m) => `${m.name} ${m.summary}`.toLowerCase().includes(query.toLowerCase())).slice(0, 5) : []),
      [query],
    )
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('algodrishti-theme', theme)
  }, [theme])
  useEffect(() => {
    if (!playing || tab !== 'Visualization' || cursor >= computed.frames.length - 1) return
    const timer = window.setTimeout(() => {
      setCursor((c) => c + 1)
      if (cursor + 1 >= computed.frames.length - 1) setPlaying(false)
    }, speed)
    return () => window.clearTimeout(timer)
  }, [playing, tab, cursor, computed.frames.length, speed])
  function go(index: number) {
    setCursor(index)
    setPlaying(false)
    setFeedback('')
  }
  function switchTab(next: Tab) {
    setTab(next)
    setPlaying(false)
    setGuess('')
    setFeedback('')
  }
  function run(values?: number[], k?: number) {
    try {
      const a = values ?? parseMedianValues(draft),
        r = k ?? Number(rank),
        next = medianTrace(a, r)
      setComputed(next)
      setDraft(a.join(', '))
      setRank(String(r))
      go(0)
      setError('')
      setNotice('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Check the input.')
      setPlaying(false)
    }
  }
  function save() {
    try {
      const first = computed.frames[0],
        next = [{ values: first.values, rank: first.rank }, ...saved].slice(0, 5)
      localStorage.setItem('algodrishti-median-experiments', JSON.stringify(next))
      setSaved(next)
      setNotice('Experiment saved in this browser.')
    } catch {
      setNotice('Local storage is unavailable.')
    }
  }
  function exportRun() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(computed, null, 2)], { type: 'application/json' })),
      a = document.createElement('a')
    a.href = url
    a.download = 'median-of-medians-trace.json'
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <div className="mom-page target-visual median-reference-page" data-target="17" data-mockup-page="median-of-medians">
      <div className="mom-topbar">
        <div className="mom-search">
          <Search size={19} />
          <input
            aria-label={tr('Search topics')}
            placeholder={tr('Search topics, e.g., dynamic programming, graph algorithms...')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <div className="mom-search-results">
              {matches.length ? (
                matches.map((m) => (
                  <button key={m.id} onClick={() => navigate(algorithmPath(m))}>
                    {tx(m.name, 'algorithms')}
                  </button>
                ))
              ) : (
                <p>{tr('No matching topics.')}</p>
              )}
            </div>
          )}
        </div>
        <button
          className="mom-theme"
          aria-label={tr('Toggle color theme')}
          onClick={() => (onToggleTheme ? onToggleTheme() : setTheme(theme === 'dark' ? 'light' : 'dark'))}
        >
          <Sun size={20} />
          <span>{theme === 'dark' ? <Moon size={15} /> : <i />}</span>
        </button>
        <button className="mom-study" aria-pressed={studied} onClick={() => toggleCompleted(module.id)}>
          {studied ? <Check size={16} /> : <Bookmark size={16} />}
          <span>{tr(studied ? 'Studied' : 'Mark studied')}</span>
        </button>
        <AccountControl showLanguage={false} />
      </div>
      <header className="mom-hero">
        <div className="mom-hero-icon">
          <Layers3 size={41} />
        </div>
        <div className="mom-hero-title">
          <h1>{tr('Median-of-Medians Selection')}</h1>
          <p>{tr('Use medians of groups of five for a guaranteed linear-time selection.')}</p>
          <div className="mom-badges">
            <span>
              <Clock3 />
              {tr('10–15 min')}
            </span>
            <span>
              <BarChart3 />
              {tr('Intermediate')}
            </span>
            <span>
              <Timer />
              {tr('Divide and Conquer')}
            </span>
            <span>
              <Timer />
              {tr('5 key concepts')}
            </span>
          </div>
        </div>
        <div className="mom-hero-split">
          <svg className="median-hero-cubes" viewBox="0 0 284 100" aria-hidden="true">
            <defs>
              <linearGradient id="median-cube-top">
                <stop stopColor="#b9f4ff" />
                <stop offset="1" stopColor="#74d4ff" />
              </linearGradient>
              <linearGradient id="median-cube-left" x2="0" y2="1">
                <stop stopColor="#70c9ff" />
                <stop offset="1" stopColor="#67a8f4" />
              </linearGradient>
              <linearGradient id="median-cube-right" x2="0" y2="1">
                <stop stopColor="#73c9ff" />
                <stop offset="1" stopColor="#4091eb" />
              </linearGradient>
            </defs>
            {[
              [8, 17, 31],
              [0, 57, 43],
              [245, 29, 38],
              [171, 2, 42],
            ].map(([x, y, s], i) => (
              <g key={i} transform={`translate(${x} ${y})`} opacity={i === 3 ? 0.12 : 0.7}>
                <path d={`M0 ${s / 4}L${s / 2} 0L${s} ${s / 4}L${s / 2} ${s / 2}Z`} fill="url(#median-cube-top)" />
                <path d={`M0 ${s / 4}L${s / 2} ${s / 2}V${s * 1.08}L0 ${s * 0.82}Z`} fill="url(#median-cube-left)" />
                <path d={`M${s / 2} ${s / 2}L${s} ${s / 4}V${s * 0.82}L${s / 2} ${s * 1.08}Z`} fill="url(#median-cube-right)" />
              </g>
            ))}
          </svg>
          <Split compact />
          <span>
            {tr('Guaranteed split')}
            <br />
            {tr('≥ 3n/10 − O(1) ')}
            {tr('on each side')}
          </span>
        </div>
        <div className="mom-progress">
          <div style={{ background: `conic-gradient(#1677ff ${studied ? 100 : 0}%,#e1e8f2 0)` }}>
            <b>{studied ? '100%' : '0%'}</b>
          </div>
          <span>{tr(studied ? 'Studied' : 'Not started')}</span>
        </div>
        <button
          className="mom-start"
          onClick={() => {
            switchTab('Visualization')
            go(0)
          }}
        >
          {tr('Start Learning')}
          <ArrowRight size={18} />
        </button>
      </header>
      <nav className="mom-tabs" aria-label={tr('Algorithm sections')}>
        {tabs.map((label, i) => {
          const Icon = tabIcons[i]
          return (
            <button key={label} aria-pressed={tab === label} onClick={() => switchTab(label)}>
              <Icon size={19} />
              {tr(label)}
            </button>
          )
        })}
      </nav>
      {tab === 'Learn' && (
        <LearnDashboard
          onExplore={(phase) => {
            run(medianReferenceValues.slice(0, 15), 7)
            switchTab('Visualization')
            if (phase) {
              const next = medianTrace(medianReferenceValues.slice(0, 15), 7),
                index = next.frames.findIndex((f) => f.depth === 0 && f.phase === phase)
              if (index >= 0) go(index)
            }
          }}
        />
      )}
      {tab === 'Visualization' && (
        <div className="mom-workspace">
          <div className="mom-main-visual">
            <Panel title={tr('Median-of-Medians Visualizer')} description="Follow the real recursive pivot selection, partition sizes, and adjusted rank.">
              <div className="mom-playback">
                <button aria-label={tr('Step backward')} disabled={!cursor} onClick={() => go(cursor - 1)}>
                  <ChevronLeft />
                </button>
                <button
                  aria-label={tr(playing ? 'Pause' : 'Play')}
                  onClick={() => {
                    if (cursor === computed.frames.length - 1) go(0)
                    setPlaying(!playing)
                  }}
                >
                  {playing ? <Pause /> : <Play />}
                </button>
                <button aria-label={tr('Step forward')} disabled={cursor === computed.frames.length - 1} onClick={() => go(cursor + 1)}>
                  <ChevronRight />
                </button>
                <button onClick={() => go(0)}>
                  <RotateCcw size={15} />
                  {tr('Reset')}
                </button>
                <span>
                  {tr('Step')} {cursor + 1} / {computed.frames.length}
                </span>
                <input
                  aria-label={tr('Selection timeline')}
                  type="range"
                  min={0}
                  max={computed.frames.length - 1}
                  value={cursor}
                  onChange={(e) => go(Number(e.target.value))}
                />
                <label>
                  {tr('Speed')}
                  <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                    <option value={1500}>{tr('Slow')}</option>
                    <option value={800}>{tr('Normal')}</option>
                    <option value={250}>{tr('Fast')}</option>
                  </select>
                </label>
              </div>
              <LiveFrame frame={frame} />
              <button className="mom-result-button" onClick={() => go(computed.frames.length - 1)}>
                {tr('Show computed answer')}
              </button>
              {frame.phase === 'answer' && (
                <output className="mom-answer">
                  {tr('k = ')}
                  {computed.frames[0].rank} → {computed.answer}
                </output>
              )}
            </Panel>
            <Panel title={tr('Prediction challenge')} description="Check the partition sizes before choosing the next branch.">
              <p>{tr('For the next partition decision, should selection go left, return the pivot, or go right?')}</p>
              <p>{tr('The challenge uses the next partition frame, not a later recursive subproblem.')}</p>
              {(() => {
                const next = computed.frames.findIndex((f, i) => i > cursor && f.phase === 'recurse')
                if (next < 0) return <p>{tr('Replay the trace to try another prediction.')}</p>
                const p = computed.frames[next]
                return (
                  <>
                    <p>
                      {tr('|L| = ')}
                      {p.lower!.length}
                      {tr(' · |E| = ')}
                      {p.equal!.length}
                      {tr(' · k = ')}
                      {p.rank}
                    </p>
                    <label>
                      {tr('Your prediction')}
                      <select aria-label={tr('Predicted partition branch')} value={guess} onChange={(e) => setGuess(e.target.value)}>
                        <option value="">{tr('Choose a branch…')}</option>
                        <option value="left">{tr('Left')}</option>
                        <option value="equal">{tr('Return pivot')}</option>
                        <option value="right">{tr('Right')}</option>
                      </select>
                    </label>
                    <button onClick={() => setFeedback(guess === p.branch ? 'Correct. ' + p.message : 'Not yet. Compare k with |L| and |L|+|E|.')}>
                      {tr('Check prediction')}
                    </button>
                    <button onClick={() => go(next)}>{tr('Reveal decision')}</button>
                    {feedback && <p role="status">{tr(feedback)}</p>}
                  </>
                )
              })()}
            </Panel>
          </div>
          <aside className="mom-input-panel">
            <h2>{tr('Problem Input')}</h2>
            <label>
              {tr('Dataset')}
              <textarea
                aria-label={tr('Median dataset')}
                rows={5}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value)
                  setPlaying(false)
                }}
              />
            </label>
            <label>
              {tr('Selection rank (k)')}
              <input
                type="number"
                aria-label={tr('Selection rank (k)')}
                value={rank}
                onChange={(e) => {
                  setRank(e.target.value)
                  setPlaying(false)
                }}
              />
            </label>
            <p>{tr('Ranks are one-based. Up to 60 values; duplicates and negative numbers are supported.')}</p>
            <button className="mom-start" onClick={() => run()}>
              <Play size={16} />
              {tr('Run algorithm')}
            </button>
            <button
              onClick={() => {
                run(medianReferenceValues, 11)
              }}
            >
              {tr('Reset input')}
            </button>
            {error && <p role="alert">{tr(error)}</p>}
            <p>{tr('Editing does not replace the current trace until Run algorithm succeeds.')}</p>
            <button onClick={save}>{tr('Save experiment')}</button>
            <button onClick={exportRun}>{tr('Export trace')}</button>
            {notice && <p role="status">{tr(notice)}</p>}
          </aside>
        </div>
      )}
      {tab === 'Code' && (
        <Panel title={tr('Executable TypeScript implementation')} description="The source below generates the actual pivot-selection and partition frames.">
          <pre>
            <code>{modelSource}</code>
          </pre>
        </Panel>
      )}
      {tab === 'Practice' && (
        <Panel title={tr('Practice: rank, duplicates and guarantees')}>
          <p>{tr('In the reference worked example, |L|=6 and |E|=1 around pivot 6. Which value is the 7th smallest?')}</p>
          <input aria-label={tr('Worked example answer')} value={guess} onChange={(e) => setGuess(e.target.value)} />
          <button
            onClick={() =>
              setFeedback(
                Number(guess) === 6 && guess.trim() ? 'Correct: rank 7 is in the equal block, so return 6.' : 'Not yet. The equal block occupies rank 7.',
              )
            }
          >
            {tr('Check answer')}
          </button>
          {feedback && <p role="status">{tr(feedback)}</p>}
          <h3>{tr('Explain the guarantee')}</h3>
          <details>
            <summary>{tr('Why groups of five?')}</summary>
            <p>
              {tr(
                'For each full group, its median has two elements on either side. At least about half the medians are no smaller than the pivot, and half are no larger. Excluding the pivot group and a possible incomplete group gives the 3n/10 − O(1) discard guarantee.',
              )}
            </p>
          </details>
        </Panel>
      )}
      {tab === 'Experiments' && (
        <Panel title={tr('Saved experiments')}>
          <button onClick={save}>{tr('Save current run')}</button>
          <button onClick={exportRun}>{tr('Export trace')}</button>
          {notice && <p role="status">{tr(notice)}</p>}
          {saved.length ? (
            saved.map((s, i) => (
              <div className="mom-saved" key={i}>
                <Numbers values={s.values} />
                <span>
                  {tr('k = ')}
                  {s.rank}
                </span>
                <button
                  onClick={() => {
                    run(s.values, s.rank)
                    switchTab('Visualization')
                  }}
                >
                  {tr('Load experiment')} {i + 1}
                </button>
              </div>
            ))
          ) : (
            <p>{tr('No saved experiments yet. Run your own dataset, then save it here.')}</p>
          )}
        </Panel>
      )}
      {tab === 'Notes' && (
        <Panel title={tr('Your lesson notes')} description="Notes are stored in this browser. Algorithm state is not changed by writing notes.">
          <LanguageSelector />
          <textarea
            aria-label={tr('Lesson notes')}
            rows={12}
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value)
              try {
                localStorage.setItem('algodrishti-median-notes', e.target.value)
                setNotice('Notes saved in this browser.')
              } catch {
                setNotice('Local storage is unavailable.')
              }
            }}
          />
          {notice && <p role="status">{tr(notice)}</p>}
        </Panel>
      )}
    </div>
  )
}
