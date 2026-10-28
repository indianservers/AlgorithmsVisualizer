// @localized-render
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  Bookmark,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Code2,
  Download,
  FileText,
  Lightbulb,
  LockKeyhole,
  Moon,
  PartyPopper,
  Pause,
  Play,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  TriangleAlert,
  UserRound,
  X,
  XCircle,
} from 'lucide-react'
import { tx, useLocaleRender } from '../i18n/render'
import { allModules } from '../algorithms'
import { algorithmPath } from '../utils/routing'
import { LanguageSelector } from '../i18n/LanguageSelector'
import { AccountControl } from '../account/AccountControl'
import { usePersistentState, persistentString } from '../hooks/usePersistentState'
import { MockupTabs, type MockupPageProps, type MockupTab } from './MockupLessonChrome'
import {
  buildCookEncoding,
  cookAssignment,
  cookDimacs,
  cookGroups,
  cookStateLabel,
  cookStates,
  cookSymbolLabel,
  formatCookClause,
  verifyCookTableau,
  type CookBranch,
  type CookGroup,
  type CookMode,
  type CookRow,
  type CookState,
} from './cookLevinModel'
import './cook-levin-mockup.css'

const tr = (s: string) => tx(s, 'studios'),
  tabs: MockupTab[] = ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments', 'Notes']
const groupTitles: Record<CookGroup, string> = {
  cell: 'Cell Variables',
  initial: 'Initial Configuration',
  transition: 'Transition Constraints',
  accept: 'Accepting State',
}
const presets = [
  { id: 'reference', name: 'Example: TM M on input w', word: 'abb', time: 5, mode: 'letters' as CookMode, branch: 'scan' as CookBranch },
  { id: 'binary', name: 'Binary: input 101, T = 5', word: '101', time: 5, mode: 'binary' as CookMode, branch: 'scan' as CookBranch },
  { id: 'no', name: 'Rejecting input: aba', word: 'aba', time: 5, mode: 'letters' as CookMode, branch: 'scan' as CookBranch },
  { id: 'branch', name: 'Rejecting branch on abb', word: 'abb', time: 5, mode: 'letters' as CookMode, branch: 'reject' as CookBranch },
  { id: 'short', name: 'Too little time: abb, T = 4', word: 'abb', time: 4, mode: 'letters' as CookMode, branch: 'scan' as CookBranch },
]
function CookBars() {
  return (
    <svg viewBox="0 0 26 26" fill="currentColor" aria-hidden="true">
      <rect x="3" y="11" width="5" height="13" rx="2" opacity=".7" />
      <rect x="10" y="3" width="5" height="21" rx="2" />
      <rect x="17" y="7" width="5" height="17" rx="2" opacity=".55" />
    </svg>
  )
}
function Panel({
  title,
  subtitle,
  icon,
  children,
  className = '',
  action,
}: {
  title: string
  subtitle?: string
  icon: ReactNode
  children: ReactNode
  className?: string
  action?: ReactNode
}) {
  return (
    <section className={`cl-panel ${className}`}>
      <header>
        <span className="cl-icon">{icon}</span>
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}
function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="cl-switch">
      <input type="checkbox" aria-label={label} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <i />
      {label}
    </label>
  )
}
function downloadText(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type })),
    anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
const encodingCode = `Encode(M, w, T, S):
    X[t,i,s] = tape cell i contains symbol s at time t
    H[t,i]   = head scans cell i at time t
    Q[t,q]   = machine state at time t is q
    D[t,r]   = transition rule r is chosen at time t

    Ccell: exactly one symbol per cell, one head and state per row,
           and one chosen transition per time step
    Cinit: fix the initial tape, head position and state q0
    Ctrans: D[t,r] implies its source and target states;
            D[t,r] AND H[t,i] implies read, write and head move;
            a non-head tape cell keeps its symbol in the next row
    Caccept: require Q[T,qa]

    return Ccell AND Cinit AND Ctrans AND Caccept

This teaching machine makes its only nondeterministic choice at q0:
scan the input, or reject immediately. qa and qr have stutter rules.
An accepting branch can therefore be padded to exactly T steps.

The actual CNF uses one variable per listed proposition.
Pairwise head uniqueness uses O(T·S²) clauses in this encoding;
all other factors for this fixed machine are polynomial in T and S.
Constructing the formula does not solve arbitrary SAT instances.`
export function CookLevinMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const navigate = useNavigate(),
    [tab, setTab] = useState<MockupTab>('Visualization'),
    [word, setWord] = useState('abb'),
    [time, setTime] = useState(5),
    [mode, setMode] = useState<CookMode>('letters'),
    [branch, setBranch] = useState<CookBranch>('scan'),
    [example, setExample] = useState('reference')
  const encoding = useMemo(() => buildCookEncoding(word, time, mode), [word, time, mode])
  const [rows, setRows] = useState<CookRow[]>(() => buildCookEncoding().scan),
    evaluation = useMemo(() => verifyCookTableau(encoding, rows), [encoding, rows]),
    [tick, setTick] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(700),
    [names, setNames] = useState(true),
    [highlights, setHighlights] = useState(true),
    [initialHighlight, setInitialHighlight] = useState(true),
    [transitionHighlight, setTransitionHighlight] = useState(false),
    [acceptHighlight, setAcceptHighlight] = useState(false)
  const [modal, setModal] = useState<'instance' | 'cell' | 'clauses' | 'worked' | null>(null),
    dialog = useRef<HTMLDialogElement>(null),
    wordInput = useRef<HTMLInputElement>(null),
    [draftWord, setDraftWord] = useState('abb'),
    [draftTime, setDraftTime] = useState('5'),
    [draftMode, setDraftMode] = useState<CookMode>('letters'),
    [draftBranch, setDraftBranch] = useState<CookBranch>('scan'),
    [error, setError] = useState(''),
    [cell, setCell] = useState({ t: 0, i: 2 }),
    [cellSymbol, setCellSymbol] = useState('_'),
    [cellHead, setCellHead] = useState(2),
    [cellState, setCellState] = useState<CookState>('q0'),
    [group, setGroup] = useState<'all' | 'failed' | CookGroup>('initial'),
    [clausePage, setClausePage] = useState(0),
    [message, setMessage] = useState(''),
    [prediction, setPrediction] = useState(''),
    [feedback, setFeedback] = useState('')
  const [query, setQuery] = useState(''),
    search = useRef<HTMLInputElement>(null),
    [fallbackTheme, setFallbackTheme] = useState(() => localStorage.getItem('algodrishti-theme') ?? 'light'),
    theme = props.theme ?? fallbackTheme,
    [notes, setNotes] = usePersistentState('algodrishti-cook-levin-notes', '', persistentString),
    [reviewed, setReviewed] = usePersistentState<number[]>('algodrishti-cook-levin-reviewed', [], {
      deserialize: (value) => {
        try {
          const a: unknown = JSON.parse(value)
          return Array.isArray(a) ? [...new Set(a.filter((v): v is number => Number.isInteger(v) && v >= 0 && v < 6))] : []
        } catch {
          return []
        }
      },
    })
  const matches = query.trim() ? allModules.filter((m) => `${m.name} ${m.summary}`.toLowerCase().includes(query.toLowerCase())).slice(0, 5) : [],
    studied = props.completed.includes(props.module.id),
    failedSet = new Set(evaluation.failed),
    assignment = useMemo(() => cookAssignment(encoding, rows), [encoding, rows]),
    filteredClauses = encoding.clauses.flatMap((clause, index) =>
      group === 'all' || (group === 'failed' && failedSet.has(index)) || group === clause.group ? [{ clause, index }] : [],
    ),
    pageCount = Math.max(1, Math.ceil(filteredClauses.length / 12)),
    visibleIndices = encoding.positions.flatMap((position, i) => (position <= 3 ? [i] : [])),
    hiddenIndices = encoding.positions.flatMap((position, i) => (position > 3 ? [i] : []))
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('algodrishti-theme', theme)
  }, [theme])
  useEffect(() => {
    if (modal) {
      dialog.current?.showModal()
      if (modal === 'instance') wordInput.current?.focus()
    } else dialog.current?.close()
  }, [modal])
  useEffect(() => {
    if (!playing || tick >= time) return
    const timer = setTimeout(() => {
      setTick(tick + 1)
      if (tick + 1 === time) setPlaying(false)
    }, speed)
    return () => clearTimeout(timer)
  }, [playing, tick, time, speed])
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        search.current?.focus()
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [])
  function load(nextWord: string, nextTime: number, nextMode: CookMode, nextBranch: CookBranch, id: string) {
    const next = buildCookEncoding(nextWord, nextTime, nextMode)
    setWord(nextWord)
    setTime(nextTime)
    setMode(nextMode)
    setBranch(nextBranch)
    setExample(id)
    setRows(structuredClone(nextBranch === 'scan' ? next.scan : next.reject))
    setTick(0)
    setPlaying(false)
    setMessage('')
    setClausePage(0)
    setError('')
  }
  function reset() {
    load('abb', 5, 'letters', 'scan', 'reference')
    setNames(true)
    setHighlights(true)
    setInitialHighlight(true)
    setTransitionHighlight(false)
    setAcceptHighlight(false)
  }
  function openInstance() {
    setDraftWord(word)
    setDraftTime(String(time))
    setDraftMode(mode)
    setDraftBranch(branch)
    setError('')
    setModal('instance')
  }
  function chooseExample(id: string) {
    if (id === 'custom') {
      setExample('custom')
      openInstance()
    } else {
      const p = presets.find((p) => p.id === id)!
      load(p.word, p.time, p.mode, p.branch, p.id)
    }
  }
  function applyInstance() {
    try {
      if (!draftTime.trim()) throw new Error('Enter a time bound T.')
      load(draftWord, Number(draftTime), draftMode, draftBranch, 'custom')
      setModal(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }
  function chooseTick(next: number) {
    setTick(next)
    setPlaying(false)
  }
  function togglePlay() {
    if (playing) {
      setPlaying(false)
      return
    }
    if (time === 0) return
    if (tick === time) setTick(0)
    setPlaying(true)
  }
  function inspectCell(t: number, i: number) {
    setCell({ t, i })
    setCellSymbol(rows[t].tape[i])
    setCellHead(rows[t].head)
    setCellState(rows[t].state)
    setTick(t)
    setPlaying(false)
    setModal('cell')
  }
  function chooseCellIndex(i: number) {
    setCell({ ...cell, i })
    setCellSymbol(rows[cell.t].tape[i])
  }
  function applyCell() {
    setRows((old) =>
      old.map((row, t) =>
        t !== cell.t ? row : { ...row, tape: row.tape.map((symbol, i) => (i === cell.i ? cellSymbol : symbol)), head: cellHead, state: cellState },
      ),
    )
    setMessage('Candidate configuration edited. The formula and its input are unchanged; failed clauses identify inconsistent evidence.')
    setModal(null)
  }
  function openClauses(next: 'all' | 'failed' | CookGroup) {
    setGroup(next)
    setClausePage(0)
    setModal('clauses')
  }
  function resetCandidate() {
    setRows(structuredClone(branch === 'scan' ? encoding.scan : encoding.reject))
    setMessage('Reset to the generated candidate branch.')
    setPlaying(false)
  }
  function useAccepting() {
    if (!encoding.accepting) return
    setRows(structuredClone(encoding.accepting))
    setBranch('scan')
    setTick(time)
    setAcceptHighlight(true)
    setHighlights(true)
    setMessage('An accepting branch gives a satisfying assignment for every generated clause.')
    setPlaying(false)
  }
  function corruptTransition() {
    if (time < 1) return
    const at = Math.max(1, tick)
    setRows((old) => old.map((row, t) => (t === at ? { ...row, tape: row.tape.map((symbol, i) => (i === 0 ? encoding.machine.zero : symbol)) } : row)))
    setTick(at)
    setTransitionHighlight(true)
    setHighlights(true)
    setMessage('The edited non-head cell changes without a write. Inspect the failed transition clauses.')
    setPlaying(false)
  }
  function hasFailedCell(t: number, i: number) {
    return evaluation.failed.some((index) => {
      const clause = encoding.clauses[index]
      return clause.i === i && (clause.t === t || (clause.group === 'transition' && clause.t !== undefined && clause.t + 1 === t))
    })
  }
  function renderCell(t: number, i: number, outside = false) {
    const row = rows[t],
      head = row.head === i,
      window = transitionHighlight && (t === tick || t === tick + 1) && Math.abs(i - rows[tick].head) <= 1,
      init = initialHighlight && t === 0,
      accept = acceptHighlight && t === time,
      failed = hasFailedCell(t, i),
      classes = [
        'cl-tape-cell',
        head ? `cl-head cl-state-${row.state}` : '',
        row.tape[i] !== '_' && !head ? 'cl-symbol' : '',
        highlights && init ? 'cl-initial-highlight' : '',
        highlights && window ? 'cl-transition-highlight' : '',
        highlights && accept ? 'cl-accept-highlight' : '',
        highlights && failed ? 'cl-failed-cell' : '',
        outside ? 'cl-outside-cell' : '',
      ]
        .filter(Boolean)
        .join(' ')
    return (
      <td key={i} className={classes}>
        <button
          aria-label={tr(`Inspect tableau cell t=${t}, i=${encoding.positions[i]}`)}
          onClick={() => inspectCell(t, i)}
          title={`${head ? `${cookStateLabel(row.state)}, ` : ''}${tr('symbol ')}${cookSymbolLabel(row.tape[i])}; ${encoding.variables.find((v) => v.kind === 'symbol' && v.t === t && v.i === i && v.symbol === row.tape[i])?.name ?? tr('no symbol selected')}`}
        >
          <span>{head ? (names ? cookStateLabel(row.state) : '●') : outside ? '…' : cookSymbolLabel(row.tape[i])}</span>
        </button>
      </td>
    )
  }
  const tableau = (
    <Panel
      title={tr('Nondeterministic Computation (TM Tableau)')}
      subtitle={tr('Rows are time steps, columns are tape cells.')}
      icon={<UserRound />}
      className="cl-tableau-panel"
      action={
        <button className="cl-machine-badge" aria-label={tr('Edit teaching machine input')} onClick={openInstance}>
          {tr('M on input w')}
        </button>
      }
    >
      <div className="cl-table-scroll">
        <table className="cl-tableau">
          <thead>
            <tr>
              <th>{'t ∖ i'}</th>
              <th>{'…'}</th>
              {visibleIndices.map((i) => (
                <th key={i}>{encoding.positions[i]}</th>
              ))}
              <th title={tr('Additional encoded tape cells; click a row to inspect.')}>{'…'}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, t) => (
              <tr key={t} className={tick === t ? 'cl-active-row' : ''}>
                <th>
                  <button aria-label={tr(`Show tableau row ${t}`)} onClick={() => chooseTick(t)}>{`t = ${t}`}</button>
                </th>
                <td>{'…'}</td>
                {visibleIndices.map((i) => renderCell(t, i))}
                {hiddenIndices.length ? renderCell(t, hiddenIndices.includes(row.head) ? row.head : hiddenIndices[0], true) : <td>{'…'}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="cl-table-legend">
        <span>
          <i className="cl-start-dot" />
          {tr('Start state (q₀)')}
        </span>
        <span>
          <i className="cl-symbol-dot" />
          {tr('Tape symbol')}
        </span>
        <span>
          <i className="cl-head-dot" />
          {tr('Head position')}
        </span>
        <span>
          <i className="cl-intermediate-dot" />
          {tr('Intermediate state')}
        </span>
        <span>
          <i className="cl-accept-dot" />
          {tr('Accept state (qₐ)')}
        </span>
        <span>
          <i className="cl-blank-dot" />
          {tr('Blank (⊔)')}
        </span>
      </div>
    </Panel>
  )
  const constraintDescriptions: Record<CookGroup, string> = {
    cell: 'X[t,i,σ] records tape symbols; H and Q locate the head and state.',
    initial: 'Fix the input w, state q₀ and head position in row 0.',
    transition: 'One chosen rule updates the head and state; non-head cells stay fixed.',
    accept: 'Require qₐ at time T; accepting branches stutter to fill the tableau.',
  }
  const constraints = (
    <Panel
      title={tr('Local Constraints → Boolean Formula')}
      subtitle={tr('Each cell variable and constraint becomes clauses.')}
      icon={<Settings />}
      className="cl-constraints-panel"
    >
      <div className="cl-constraint-list">
        {cookGroups.map((current, index) => (
          <button
            key={current}
            className={`cl-constraint-card cl-family-${current} ${evaluation.groups[current].failed ? 'cl-constraint-failed' : ''}`}
            aria-label={tr(`Inspect ${groupTitles[current]} clauses`)}
            onClick={() => openClauses(current)}
          >
            <i>{index + 1}</i>
            <span>
              <b>{tr(groupTitles[current])}</b>
              <span>{tr(constraintDescriptions[current])}</span>
            </span>
            <em>{['O(T · S · |Γ|)', 'O(S)', 'O(T · S)', 'O(1)'][index]}</em>
          </button>
        ))}
      </div>
      <section className="cl-result-formula">
        <header>
          <FileText />
          <button aria-label={tr('Inspect generated CNF formula')} onClick={() => openClauses('all')}>
            {tr('Resulting Formula')}
          </button>
        </header>
        <p>
          {'φ = C'}
          <sub>{'cell'}</sub>
          {' ∧ C'}
          <sub>{'init'}</sub>
          {' ∧ C'}
          <sub>{'trans'}</sub>
          {' ∧ C'}
          <sub>{'accept'}</sub>
        </p>
        <span>{tr('Size: polynomial in T and S.')}</span>
      </section>
      <ArrowRight className="cl-formula-arrow" />
    </Panel>
  )
  const outcome = (
    <Panel
      title={tr('SAT Outcome')}
      subtitle={tr('A satisfying assignment encodes an accepting computation.')}
      icon={<ShieldCheck />}
      className="cl-outcome-panel"
    >
      <article
        className={`cl-outcome-card cl-sat ${encoding.satisfiable ? 'cl-current-outcome' : ''}`}
        role={encoding.satisfiable ? 'status' : undefined}
        aria-current={encoding.satisfiable}
      >
        <header>
          <CheckCircle2 />
          <div>
            <h3>{tr('SATISFIABLE')}</h3>
            <p>{tr(encoding.satisfiable ? 'The formula has a satisfying assignment.' : 'An accepting branch would give a satisfying assignment.')}</p>
          </div>
        </header>
        <section>
          <LockKeyhole />
          <div>
            <b>{tr('Interpretation')}</b>
            <p>
              {tr(
                encoding.satisfiable
                  ? evaluation.valid
                    ? 'This assignment gives a valid tableau in which M accepts w by time T.'
                    : 'An accepting branch exists, but the current candidate assignment is rejected.'
                  : 'No accepting branch exists within this time bound. This panel explains the SAT direction.',
              )}
            </p>
          </div>
          <PartyPopper />
        </section>
      </article>
      <article
        className={`cl-outcome-card cl-unsat ${!encoding.satisfiable ? 'cl-current-outcome' : ''}`}
        role={!encoding.satisfiable ? 'status' : undefined}
        aria-current={!encoding.satisfiable}
      >
        <header>
          <XCircle />
          <div>
            <h3>{tr('UNSATISFIABLE')}</h3>
            <p>
              {tr(
                !encoding.satisfiable ? 'No assignment satisfies the bounded formula.' : 'If no assignment satisfied the formula, no branch would accept by T.',
              )}
            </p>
          </div>
        </header>
        <section>
          <LockKeyhole />
          <div>
            <b>{tr('Interpretation')}</b>
            <p>
              {tr(
                !encoding.satisfiable
                  ? word.length > 0 && word.endsWith(encoding.machine.one)
                    ? 'T is too short for acceptance. This does not show that M rejects w without a time bound.'
                    : 'For this machine and time bound, no valid accepting computation exists.'
                  : 'A rejected candidate alone does not establish UNSAT; every candidate would have to fail.',
              )}
            </p>
          </div>
          <Ban />
        </section>
      </article>
    </Panel>
  )
  const controls = (
    <section className="cl-explore">
      <div className="cl-explore-time">
        <header>
          <button aria-label={tr('Start tableau playback')} onClick={togglePlay}>
            {playing ? <Pause /> : <Play />}
          </button>
          <div>
            <h2>{tr('Explore the Tableau')}</h2>
            <p>{tr('Step through time steps and highlight different sets of constraints.')}</p>
          </div>
        </header>
        <div className="cl-time-track">
          {rows.map((_, t) => (
            <button key={t} aria-label={tr(`Show tableau time ${t}`)} aria-pressed={tick === t} onClick={() => chooseTick(t)}>
              <i />
              <span>{`t = ${t}`}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="cl-highlight-controls">
        <h3>{tr('Highlight constraints:')}</h3>
        <Switch label={tr('Initial configuration (Cinit)')} checked={initialHighlight} onChange={setInitialHighlight} />
        <Switch label={tr('Transition constraints (Ctrans)')} checked={transitionHighlight} onChange={setTransitionHighlight} />
        <Switch label={tr('Accepting state (Caccept)')} checked={acceptHighlight} onChange={setAcceptHighlight} />
      </div>
      <div className="cl-playback">
        <h3>{tr('Playback')}</h3>
        <div>
          <button className="cl-primary" onClick={togglePlay} disabled={time === 0}>
            {playing ? <Pause size={16} /> : <Play size={16} />} {tr(playing ? 'Pause steps' : 'Play steps')}
          </button>
          <button aria-label={tr('Previous tableau step')} disabled={tick === 0} onClick={() => chooseTick(tick - 1)}>
            <ChevronLeft size={18} />
          </button>
          <button aria-label={tr('Next tableau step')} disabled={tick === time} onClick={() => chooseTick(tick + 1)}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  )
  const footer = (
    <div className="cl-footer-grid">
      <Panel title={tr('Key Takeaways')} icon={<Lightbulb />} className="cl-takeaways">
        <ul>
          {[
            'SAT is NP-complete (Cook–Levin theorem).',
            'Encode a polynomial-time computation as a tableau with constraints.',
            'Satisfying assignment ↔ accepting computation.',
            'The construction is polynomial in input size.',
          ].map((s) => (
            <li key={s}>
              <Check />
              {tr(s)}
            </li>
          ))}
        </ul>
      </Panel>
      <Panel
        title={tr('Worked Example')}
        icon={<FileText />}
        className="cl-worked"
        action={
          <button
            className="cl-primary"
            onClick={() => {
              load('101', 5, 'binary', 'scan', 'binary')
              setModal('worked')
            }}
          >
            {tr('Try It')}
          </button>
        }
      >
        <p>{tr('Construct φ for a simple TM that accepts strings ending with 1.')}</p>
        <ol>
          {[
            'Define tableau size (T, S).',
            'Write initial configuration clauses.',
            'Add local transition constraints.',
            'Add accepting state clauses.',
            'Combine to get φ.',
          ].map((s, i) => (
            <li key={s}>
              <i>{i + 1}</i>
              {tr(s)}
            </li>
          ))}
        </ol>
      </Panel>
      <Panel title={tr('Correctness & Proof Structure')} icon={<CookBars />} className="cl-proof">
        <ol>
          {[
            'An accepting computation gives a satisfying assignment.',
            'A satisfying assignment describes a valid accepting computation.',
            'For a polynomial time bound, the variables and clauses have polynomial size.',
          ].map((s, i) => (
            <li key={s}>
              <i>{i + 1}</i>
              {tr(s)}
            </li>
          ))}
        </ol>
        <p>{tr('Together with SAT ∈ NP, this proves completeness in the general construction.')}</p>
      </Panel>
      <Panel title={tr('Concepts and Pitfalls')} icon={<TriangleAlert />} className="cl-pitfalls">
        <ul>
          {[
            'Use consistent local transition choices.',
            'Enforce exactly one symbol, head and state.',
            'Include initial and accepting conditions.',
            'The tableau size must be polynomial in input.',
            'This proves SAT NP-complete; a separate clause-size conversion gives 3-SAT.',
          ].map((s) => (
            <li key={s}>{tr(s)}</li>
          ))}
        </ul>
      </Panel>
    </div>
  )
  const reviewIndex = tabs.indexOf(tab),
    review = (
      <button
        className="cl-review"
        aria-pressed={reviewed.includes(reviewIndex)}
        onClick={() => setReviewed(reviewed.includes(reviewIndex) ? reviewed.filter((v) => v !== reviewIndex) : [...reviewed, reviewIndex])}
      >
        <Check size={15} />
        {tr(reviewed.includes(reviewIndex) ? 'Section reviewed' : 'Mark section reviewed')}
      </button>
    )
  return (
    <div className="mom-page target-visual cook-levin-page" data-target="27">
      <div className="mom-topbar cl-topbar">
        <button
          className="cl-back"
          aria-label={tr('Back to Clique to Vertex Cover')}
          onClick={() => navigate('/complexity-theory/clique-vertex-cover-reduction')}
        >
          <ArrowLeft size={18} />
        </button>
        <div className="mom-search">
          <Search size={17} />
          <input
            ref={search}
            aria-label={tr('Search topics')}
            placeholder={tr('Search topics, algorithms, or keywords…')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="cl-search-key" aria-label={tr('Focus topic search')} onClick={() => search.current?.focus()}>
            {'⌘ K'}
          </button>
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
        <button className="mom-study" aria-pressed={studied} onClick={() => props.toggleCompleted(props.module.id)}>
          {studied ? <Check size={16} /> : <Bookmark size={16} />} {tr(studied ? 'Studied' : 'Mark studied')}
        </button>
        <AccountControl showLanguage={false} />
      </div>
      <header className="cl-lesson-header">
        <button
          className="cl-back"
          aria-label={tr('Open Clique to Vertex Cover lesson')}
          onClick={() => navigate('/complexity-theory/clique-vertex-cover-reduction')}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1>
            {tr('Cook–Levin Theorem Overview')}
            <span aria-hidden="true">{tr('Complexity Theory')}</span>
          </h1>
          <p>{tr('Understand why SAT became the first NP-complete problem.')}</p>
        </div>
        <div className="cl-progress" aria-label={tr(`${reviewed.length} of 6 sections reviewed`)}>
          <span>{tr(`${reviewed.length} of 6 sections`)}</span>
          <div>
            {tabs.map((s, i) => (
              <i key={s} className={reviewed.includes(i) ? 'cl-reviewed' : ''} />
            ))}
          </div>
        </div>
        <button className="cl-primary cl-start" onClick={() => setTab('Learn')}>
          {tr('Start Learning')}
          <ArrowRight size={18} />
        </button>
      </header>
      <MockupTabs active={tab} onChange={setTab} tabs={tabs} />
      {tab === 'Visualization' ? (
        <>
          <section className="cl-visualization">
            <header className="cl-visual-heading">
              <CookBars />
              <div>
                <h2>{tr('Interactive Visualization')}</h2>
                <p>{tr('See how a nondeterministic computation becomes a Boolean formula (SAT) through the Cook–Levin construction.')}</p>
              </div>
              <div className="cl-visual-options">
                <select aria-label={tr('Cook-Levin example')} value={example} onChange={(e) => chooseExample(e.target.value)}>
                  {presets.map((p) => (
                    <option value={p.id} key={p.id}>
                      {tr(p.name)}
                    </option>
                  ))}
                  <option value="custom">{tr('Custom input and time bound…')}</option>
                </select>
                <Switch label={tr('Show variable names')} checked={names} onChange={setNames} />
                <Switch label={tr('Show constraint highlights')} checked={highlights} onChange={setHighlights} />
                <button onClick={reset}>
                  <RotateCcw size={16} />
                  {tr('Reset')}
                </button>
              </div>
            </header>
            <div className="cl-dashboard-grid">
              {tableau}
              {constraints}
              {outcome}
            </div>
          </section>
          {controls}
          {footer}
          {review}
        </>
      ) : tab === 'Learn' ? (
        <div className="cl-learning">
          <Panel title={tr('Computation as a Satisfiability Problem')} icon={<BookOpen />}>
            <p>
              {tr(
                'Cook–Levin encodes a polynomially bounded accepting computation as a Boolean formula. A tableau records one branch. Correct cells, the initial input, valid transitions and acceptance must all hold. SAT membership follows by checking a proposed Boolean assignment.',
              )}
            </p>
            <div className="cl-concept-grid">
              <article>
                <h3>{tr('Forward direction')}</h3>
                <p>{tr('Read an accepting tableau into Boolean variables. Its legal configurations satisfy each constraint family.')}</p>
              </article>
              <article>
                <h3>{tr('Reverse direction')}</h3>
                <p>{tr('Read a satisfying assignment back into configurations. Uniqueness and transition clauses yield an accepting branch.')}</p>
              </article>
              <article>
                <h3>{tr('Polynomial size')}</h3>
                <p>
                  {tr(
                    'The general proof uses a polynomial time bound. Cell and transition descriptions produce a polynomial-size formula; constructing it does not solve SAT.',
                  )}
                </p>
              </article>
            </div>
            <p>
              <a href="https://www.cs.toronto.edu/~ashe/cook-levin-handout.pdf" target="_blank" rel="noreferrer">
                {tr('University of Toronto: Cook–Levin proof and tableau construction')}
              </a>
            </p>
            <h3>{tr('The worked teaching machine')}</h3>
            <p>
              {tr(
                `This machine accepts nonempty ${mode === 'letters' ? 'a/b strings ending in b' : 'binary strings ending in 1'}. It starts on blank position 0 with input at positions 1 onward. One branch scans; another rejects immediately. States q₁ and q₂ remember whether the last scanned symbol was ${encoding.machine.zero} or ${encoding.machine.one}. On the final blank, q₂ accepts and moves left. Accepting and rejecting states then stutter.`,
              )}
            </p>
            <p>
              {tr(
                'The full tape includes a right-hand blank beyond the displayed cells. The right … column shows the head if it reaches that encoded position; inspect it to see the exact cell. This display never removes a head from the actual configuration.',
              )}
            </p>
            <button className="cl-primary" onClick={() => setTab('Visualization')}>
              {tr('Explore the real tableau')}
            </button>
          </Panel>
          <Panel title={tr('The Time Bound and the Candidate Matter')} icon={<ShieldCheck />}>
            <p>
              {tr(
                'The formula here describes acceptance by time T, not unrestricted acceptance. A short T can make it unsatisfiable even for an input the machine eventually accepts. A rejected candidate branch also does not prove UNSAT when another accepting branch exists.',
              )}
            </p>
            <p>
              {tr(
                'This executable CNF uses separate tape, head, state and rule-choice variables. Its pairwise head uniqueness uses O(T·S²) clauses; all terms remain polynomial. The general proof applies to arbitrary polynomial-time nondeterministic machines, not just this small example.',
              )}
            </p>
          </Panel>
          {review}
        </div>
      ) : tab === 'Code' ? (
        <Panel title={tr('Executable CNF Encoding')} icon={<Code2 />} className="cl-code">
          <pre>{encodingCode}</pre>
          <p>
            {tr(
              `Generated instance: ${encoding.variables.length} Boolean variables and ${encoding.clauses.length} CNF clauses for T = ${time} and S = ${encoding.space}. These counts come from the actual encoder.`,
            )}
          </p>
          <button onClick={() => openClauses('all')}>{tr('Inspect every generated clause')}</button>
          <button onClick={() => downloadText('cook-levin.cnf', cookDimacs(encoding), 'text/plain')}>{tr('Download generated CNF')}</button>
          {review}
        </Panel>
      ) : tab === 'Practice' ? (
        <div className="cl-practice">
          <Panel title={tr('Does One Rejected Branch Prove UNSAT?')} icon={<Lightbulb />}>
            <p>{tr('Input abb has an accepting scan branch and an immediate rejecting branch. What follows from inspecting the rejecting branch?')}</p>
            <button onClick={() => setFeedback('Correct: a different branch can accept. The formula asks whether any accepting branch exists by T.')}>
              {tr('Another branch may still satisfy the formula')}
            </button>
            <button onClick={() => setFeedback('Reconsider: a failed candidate is not the same as failure of every possible assignment.')}>
              {tr('The formula must be UNSAT')}
            </button>
            {feedback && <p role="status">{tr(feedback)}</p>}
          </Panel>
          <Panel title={tr('Predict the Earliest Accepting Time')} icon={<CookBars />}>
            <p>{tr('For this machine on a nonempty input of length 3 ending in b, count the start move, three scans and the accepting move on blank.')}</p>
            <label>
              {tr('Predicted T')}
              <input aria-label={tr('Predicted accepting time')} value={prediction} onChange={(e) => setPrediction(e.target.value)} />
            </label>
            <button
              className="cl-primary"
              onClick={() =>
                setFeedback(
                  prediction.trim() && Number(prediction) === 5
                    ? 'Correct: 1 + 3 + 1 = 5 transitions. Smaller bounds cannot include acceptance.'
                    : 'Try again: include the initial move onto the input and the final transition on blank.',
                )
              }
            >
              {tr('Check prediction')}
            </button>
            <p>{tr(feedback)}</p>
          </Panel>
          <Panel title={tr('Does This Prove P ≠ NP?')} icon={<TriangleAlert />}>
            <p>{tr('The theorem proves SAT complete for NP. It does not resolve whether P and NP are equal.')}</p>
            <button onClick={() => setTab('Experiments')}>{tr('Explore bounded examples')}</button>
          </Panel>
          {review}
        </div>
      ) : tab === 'Experiments' ? (
        <div className="cl-experiments">
          <Panel title={tr('Candidate Tableau Laboratory')} icon={<Settings />}>
            <p>{tr(`Input ${word || '(empty)'}, T = ${time}, S = ${encoding.space}. Candidate branch: ${branch}.`)}</p>
            <div className="cl-lab-actions">
              <button onClick={openInstance}>{tr('Edit input and time bound')}</button>
              <button
                onClick={() => {
                  setRows(structuredClone(encoding.reject))
                  setBranch('reject')
                  setPlaying(false)
                  setMessage('The immediate-reject branch is a valid computation but not an accepting witness.')
                }}
              >
                {tr('Use rejecting branch')}
              </button>
              <button disabled={!encoding.accepting} onClick={useAccepting}>
                {tr('Use accepting branch')}
              </button>
              <button disabled={time === 0} onClick={corruptTransition}>
                {tr('Introduce a transition error')}
              </button>
              <button onClick={resetCandidate}>{tr('Reset candidate tableau')}</button>
              <button onClick={() => openClauses('failed')}>{tr('Inspect failed clauses')}</button>
            </div>
            <p className="cl-candidate-summary" role="status">
              {tr(
                `Candidate ${evaluation.valid ? 'satisfies' : 'fails'} the formula: ${evaluation.failed.length} failed clauses. Formula itself is ${encoding.satisfiable ? 'SAT' : 'UNSAT'} for the bounded machine.`,
              )}
            </p>
            {message && <p>{tr(message)}</p>}
            <ul>
              {cookGroups.map((current) => (
                <li key={current}>
                  {tr(`${groupTitles[current]}: ${evaluation.groups[current].total} clauses, ${evaluation.groups[current].failed} failed.`)}
                </li>
              ))}
            </ul>
            <p>
              {tr(
                `This machine has ${encoding.branchCount} possible branch shapes by this bound. Their exact simulation supplies the bounded SAT/UNSAT result; this is not a general polynomial SAT solver.`,
              )}
            </p>
          </Panel>
          <Panel title={tr('Inspect the Current Configuration')} icon={<FileText />}>
            <p>
              {tr(`t = ${tick}; state ${cookStateLabel(rows[tick].state)}; head ${rows[tick].head < 0 ? 'missing' : encoding.positions[rows[tick].head]}.`)}
            </p>
            <button onClick={() => inspectCell(tick, Math.max(0, rows[tick].head))}>{tr('Edit a candidate configuration')}</button>
            <button onClick={() => downloadText('cook-levin.cnf', cookDimacs(encoding), 'text/plain')}>{tr('Download generated CNF')}</button>
            <button
              disabled={!evaluation.valid}
              onClick={() =>
                downloadText(
                  'cook-levin-assignment.json',
                  JSON.stringify({ word, time, mode, rows, assignment: assignment.slice(1) }, null, 2),
                  'application/json',
                )
              }
            >
              {tr('Export satisfying assignment')}
            </button>
            <label>
              {tr('Playback speed')}
              <select aria-label={tr('Tableau playback speed')} value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                <option value={700}>{tr('Normal')}</option>
                <option value={100}>{tr('Fast')}</option>
                <option value={1400}>{tr('Slow')}</option>
              </select>
            </label>
          </Panel>
          {review}
        </div>
      ) : (
        <Panel title={tr('Your Cook–Levin Notes')} icon={<BookOpen />} className="cl-notes">
          <LanguageSelector />
          <label>
            {tr('Explain both proof directions, the four constraint groups and the role of the polynomial time bound.')}
            <textarea aria-label={tr('Cook-Levin proof notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <p>{tr('Notes and reviewed sections are saved automatically in this browser.')}</p>
          <button
            aria-label={tr('Toggle color theme')}
            onClick={() => (props.onToggleTheme ? props.onToggleTheme() : setFallbackTheme(theme === 'dark' ? 'light' : 'dark'))}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} {tr('Toggle color theme')}
          </button>
          {review}
        </Panel>
      )}
      <dialog
        ref={dialog}
        className="cl-dialog"
        aria-label={tr(
          modal === 'instance'
            ? 'Edit bounded machine instance'
            : modal === 'cell'
              ? 'Inspect and edit tableau cell'
              : modal === 'clauses'
                ? 'Generated CNF clause inspector'
                : 'Worked Cook-Levin example',
        )}
        onCancel={() => setModal(null)}
      >
        <button className="cl-close" aria-label={tr('Close Cook-Levin dialog')} onClick={() => setModal(null)}>
          <X size={18} />
        </button>
        {modal === 'instance' ? (
          <>
            <h2>{tr('Edit Input, Time Bound and Branch')}</h2>
            <p>
              {tr(
                'The machine chooses once: scan the word or reject immediately. Letter mode accepts nonempty words ending in b; binary mode accepts those ending in 1. T bounds the encoded computation.',
              )}
            </p>
            <label>
              {tr('Alphabet')}
              <select aria-label={tr('Machine alphabet')} value={draftMode} onChange={(e) => setDraftMode(e.target.value as CookMode)}>
                <option value="letters">{tr('Letters a, b')}</option>
                <option value="binary">{tr('Binary 0, 1')}</option>
              </select>
            </label>
            <label>
              {tr('Input word w')}
              <input ref={wordInput} aria-label={tr('Machine input word')} value={draftWord} onChange={(e) => setDraftWord(e.target.value)} />
            </label>
            <label>
              {tr('Time bound T (0–8)')}
              <input aria-label={tr('Machine time bound')} value={draftTime} onChange={(e) => setDraftTime(e.target.value)} />
            </label>
            <label>
              {tr('Candidate branch')}
              <select aria-label={tr('Candidate machine branch')} value={draftBranch} onChange={(e) => setDraftBranch(e.target.value as CookBranch)}>
                <option value="scan">{tr('Scan branch')}</option>
                <option value="reject">{tr('Immediate reject branch')}</option>
              </select>
            </label>
            {error && <p role="alert">{tr(error)}</p>}
            <button className="cl-primary" onClick={applyInstance}>
              {tr('Apply machine instance')}
            </button>
          </>
        ) : modal === 'cell' ? (
          <>
            <h2>{tr(`Configuration t = ${cell.t}, cell i = ${encoding.positions[cell.i]}`)}</h2>
            <p>
              {tr(
                'Edit a proposed assignment, while keeping the machine, input and formula fixed. A state label on the tape marks the head; its underlying tape symbol is shown below.',
              )}
            </p>
            <label>
              {tr('Inspect tape position')}
              <select aria-label={tr('Inspected tape position')} value={cell.i} onChange={(e) => chooseCellIndex(Number(e.target.value))}>
                {encoding.positions.map((position, i) => (
                  <option key={i} value={i}>
                    {position}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {tr('Tape symbol')}
              <select aria-label={tr('Candidate tape symbol')} value={cellSymbol} onChange={(e) => setCellSymbol(e.target.value)}>
                {encoding.machine.symbols.map((symbol) => (
                  <option key={symbol} value={symbol}>
                    {cookSymbolLabel(symbol)}
                  </option>
                ))}
                <option value="?">{tr('No symbol (invalid)')}</option>
              </select>
            </label>
            <label>
              {tr('Head position')}
              <select aria-label={tr('Candidate head position')} value={cellHead} onChange={(e) => setCellHead(Number(e.target.value))}>
                <option value={-1}>{tr('No head (invalid)')}</option>
                {encoding.positions.map((position, i) => (
                  <option key={i} value={i}>
                    {position}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {tr('Machine state')}
              <select aria-label={tr('Candidate state')} value={cellState} onChange={(e) => setCellState(e.target.value as CookState)}>
                {cookStates.map((state) => (
                  <option key={state} value={state}>
                    {cookStateLabel(state)}
                  </option>
                ))}
              </select>
            </label>
            <p>{tr(`X[${cell.t},${encoding.positions[cell.i]},σ] selects a symbol. H[${cell.t},i] selects one head; Q[${cell.t},q] selects one state.`)}</p>
            <button className="cl-primary" onClick={applyCell}>
              {tr('Apply candidate configuration')}
            </button>
          </>
        ) : modal === 'clauses' ? (
          <>
            <h2>{tr('Actual Generated CNF')}</h2>
            <p>
              {tr(
                `${encoding.variables.length} variables; ${encoding.clauses.length} clauses; ${evaluation.failed.length} clauses fail under the current candidate assignment.`,
              )}
            </p>
            <p>{tr('The formula describes every bounded branch. The current assignment describes one candidate tableau and its transition choices.')}</p>
            <label>
              {tr('Clause family')}
              <select
                aria-label={tr('CNF clause filter')}
                value={group}
                onChange={(e) => {
                  setGroup(e.target.value as typeof group)
                  setClausePage(0)
                }}
              >
                <option value="all">{tr('All clauses')}</option>
                <option value="failed">{tr('Failed clauses')}</option>
                {cookGroups.map((current) => (
                  <option value={current} key={current}>
                    {tr(groupTitles[current])}
                  </option>
                ))}
              </select>
            </label>
            <div className="cl-clause-page">
              {filteredClauses.slice(clausePage * 12, (clausePage + 1) * 12).map(({ clause, index }) => (
                <article key={index} className={failedSet.has(index) ? 'cl-clause-failed' : ''}>
                  <b>{tr(`Clause ${index + 1} · ${groupTitles[clause.group]} · ${failedSet.has(index) ? 'FALSE' : 'TRUE'}`)}</b>
                  <code>{formatCookClause(encoding, clause)}</code>
                  <p>{tr(clause.detail)}</p>
                </article>
              ))}
              {filteredClauses.length === 0 && <p>{tr('No clauses match this filter.')}</p>}
            </div>
            <div className="cl-clause-navigation">
              <button disabled={clausePage === 0} onClick={() => setClausePage(clausePage - 1)}>
                {tr('Previous clauses')}
              </button>
              <span>{`${clausePage + 1}/${pageCount}`}</span>
              <button disabled={clausePage + 1 === pageCount} onClick={() => setClausePage(clausePage + 1)}>
                {tr('Next clauses')}
              </button>
              <button onClick={() => downloadText('cook-levin.cnf', cookDimacs(encoding), 'text/plain')}>
                <Download size={14} />
                {tr('Download CNF')}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>{tr('Worked Example: Strings Ending in 1')}</h2>
            <p>
              {tr(
                `Input ${word || '(empty)'}, T = ${time}, S = ${encoding.space}. This generated formula has ${encoding.variables.length} variables and ${encoding.clauses.length} clauses.`,
              )}
            </p>
            <ol>
              {[
                'Create tape, head, state and rule-choice variables.',
                'Fix the initial row to encode the input.',
                'Require one consistent transition and preserve untouched tape cells.',
                'Require acceptance at time T; accepting states stutter if needed.',
                'Read a valid accepting tableau as a satisfying assignment.',
              ].map((s) => (
                <li key={s}>{tr(s)}</li>
              ))}
            </ol>
            <p>
              {tr(
                'The complete theorem uses the same proof idea for an arbitrary polynomial-time nondeterministic machine. This fixed machine is only the worked example.',
              )}
            </p>
            <button
              className="cl-primary"
              onClick={() => {
                setModal(null)
                setTab('Visualization')
                setTick(0)
                setPlaying(true)
              }}
            >
              {tr('Play this computation')}
            </button>
          </>
        )}
      </dialog>
    </div>
  )
}
