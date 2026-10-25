// @localized-render
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Check,
  FileText,
  Leaf,
  Lightbulb,
  LineChart,
  Pause,
  Pencil,
  Play,
  Settings,
  Sigma,
  Target,
  Trophy,
  X,
} from 'lucide-react'
import { tx, useLocaleRender } from '../i18n/render'
import { usePersistentState, persistentString } from '../hooks/usePersistentState'
import { MockupLessonChrome, type MockupPageProps } from './MockupLessonChrome'
import { masterGrowthLabel, type MasterParameters } from './masterTheoremModel'
import { recursionTreeAnalysis, recursionCostChart, decrementTree, type TreeScale } from './recursionTreeModel'
import './recursion-tree-mockup.css'

const tr = (s: string) => tx(s, 'studios'),
  format = (n: number) => (n !== 0 && (Math.abs(n) >= 1e6 || Math.abs(n) < 0.001) ? n.toExponential(5) : Number(n.toPrecision(6)).toString())
type Tab = 'Learn' | 'Visualize' | 'Practice' | 'Quiz' | 'Notes'
const tabs: Tab[] = ['Learn', 'Visualize', 'Practice', 'Quiz', 'Notes'],
  tabIcons = [BookOpen, LineChart, Pencil, Trophy, FileText]
const functions = [
  { id: 'one', label: '1', d: 0, k: 0 },
  { id: 'log', label: 'log n', d: 0, k: 1 },
  { id: 'n', label: 'n', d: 1, k: 0 },
  { id: 'nlog', label: 'n log n', d: 1, k: 1 },
  { id: 'square', label: 'n²', d: 2, k: 0 },
  { id: 'cube', label: 'n³', d: 3, k: 0 },
  { id: 'custom', label: 'Custom powers', d: 1, k: 0 },
]
const worked = recursionTreeAnalysis({ a: 4, b: 2, d: 1, k: 0 }, 7)
const mistakes = [
  [
    'Forgetting to multiply by the number of nodes at each level (aⁱ).',
    'f(n/bⁱ) is the cost of one node. The complete level costs aⁱ f(n/bⁱ). For 4T(n/2) + n, this is 4ⁱ(n/2ⁱ) = 2ⁱ n; it is not a constant 2n.',
  ],
  [
    'Stopping the tree too early (should go to depth log_b n).',
    'For the balanced power-size model, n/bʰ = 1 gives h = log_b n. Internal levels are 0 through h − 1, and level h consists of aʰ leaves. Do not count the leaf level as an additional combine-work level.',
  ],
  [
    'Incorrectly computing the leaf count (it is a^(log_b n)).',
    'There are a children per internal node, so the last level has aʰ = a^(log_b n) = n^(log_b a) leaves. When a = 4 and b = 2, the leaf count is n², not n.',
  ],
  [
    'Assuming f(n) is always the total work per level instead of per node.',
    'The total level work may grow, stay constant, or shrink. With f(n) = nᵈ and no log factor, the ratio of consecutive internal-level costs is a/bᵈ. A logarithmic factor can make the ratio vary with the level.',
  ],
]
function Bound({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\^-?\d+|\^\(log_\d+ \d+\))/).map((part, i) => {
        if (!part.startsWith('^')) return part
        const log = part.match(/^\^\(log_(\d+) (\d+)\)$/)
        return (
          <sup key={i}>
            {log ? (
              <>
                {'log'}
                <sub>{log[1]}</sub>
                {log[2]}
              </>
            ) : (
              part.slice(1)
            )}
          </sup>
        )
      })}
    </>
  )
}
function Growth({ d, k, variable = 'n' }: { d: number; k: number; variable?: string }) {
  return (
    <>
      {d === 0 && k === 0 ? (
        '1'
      ) : (
        <>
          {d !== 0 && (
            <>
              {variable}
              {d !== 1 && <sup>{d}</sup>}
            </>
          )}
          {d !== 0 && k !== 0 ? ' ' : ''}
          {k !== 0 && (
            <>
              {'log'}
              {k !== 1 && <sup>{k}</sup>} {variable}
            </>
          )}
        </>
      )}
    </>
  )
}
function Critical({ parameters }: { parameters: MasterParameters }) {
  const p = Math.log(parameters.a) / Math.log(parameters.b)
  return p === 0 ? (
    <>1</>
  ) : (
    <>
      {'n'}
      {p !== 1 && (
        <sup>
          {Number.isInteger(p) ? (
            p
          ) : (
            <>
              {'log'}
              <sub>{parameters.b}</sub>
              {parameters.a}
            </>
          )}
        </sup>
      )}
    </>
  )
}
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
    <section className={`mom-panel rt-panel ${className}`}>
      <header>
        <span className="rt-icon">{icon}</span>
        <div>
          <h2>{tr(title)}</h2>
          {description && <p>{tr(description)}</p>}
        </div>
      </header>
      {children}
    </section>
  )
}
function TreeIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M24 15V23M6 31V23H42V31M24 23V31" fill="none" stroke="#007aff" strokeWidth="2" />
      <circle cx="24" cy="9" r="6" fill="#0073ff" stroke="#d3edff" />
      {[6, 24, 42].map((x) => (
        <circle key={x} cx={x} cy="37" r="6" fill="#0073ff" stroke="#d3edff" />
      ))}
    </svg>
  )
}
function HeroArt() {
  return (
    <svg className="rt-hero-art" viewBox="0 0 300 145" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="rt-wave" x2="0" y2="1">
          <stop stopColor="#8bcaff" stopOpacity=".45" />
          <stop offset="1" stopColor="#bcdeff" stopOpacity=".08" />
        </linearGradient>
      </defs>
      <path d="M0 143C35 138 46 60 78 39S126 143 154 100S206 35 230 88S268 55 300 66V145Z" fill="url(#rt-wave)" />
      <path d="M0 141C33 117 47 110 73 65S103 27 120 18S146 98 170 88S201 39 223 76S249 139 269 101S291 74 300 73" fill="none" stroke="#9bd3ff" />
      <path d="M0 140C34 127 58 72 82 90S122 146 140 112S183 57 204 74S236 133 254 109S282 62 300 73" fill="none" stroke="#007bff" strokeWidth="1.5" />
      {[
        [52, 64],
        [80, 89],
        [100, 19],
        [177, 74],
        [220, 119],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="6.5" fill="#cceaff" />
          <circle cx={x} cy={y} r="4.5" fill="#087aff" stroke="white" strokeWidth="1.5" />
        </g>
      ))}
      <rect x="136" y="14" width="150" height="43" rx="9" fill="#eff9ff" stroke="#c9e8ff" />
      <text x="211" y="40" textAnchor="middle" fontSize="14" fontStyle="italic" fill="#0067ff">
        {'T(n) = aT(n/b) + f(n)'}
      </text>
    </svg>
  )
}
function workExpression(tree: ReturnType<typeof recursionTreeAnalysis>, level: number) {
  const p = tree.parameters,
    row = tree.levels[level]
  if (row.leaf) return `${tr('Base: ')}${format(row.work)}`
  if (!level) return masterGrowthLabel(p.d, p.k)
  if (p.k === 0 && p.d === 1) {
    const exponent = level === 1 ? '' : level === 2 ? '²' : level === 3 ? '³' : `^${level}`,
      coefficient = tree.ratio ** level
    return `${p.a}${exponent} · (n/${p.b ** level}) = ${coefficient === 1 ? '' : format(coefficient)}n`
  }
  return `${p.a}${level === 1 ? '' : `^${level}`} f(n/${p.b ** level})`
}
function RecursionDiagram({
  tree,
  selected,
  onPick,
}: {
  tree: ReturnType<typeof recursionTreeAnalysis>
  selected: number | null
  onPick: (level: number) => void
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, ''),
    a = tree.parameters.a,
    b = tree.parameters.b,
    children = tree.depth >= 1 ? Math.min(4, a) : 0,
    perParent = Math.min(2, a),
    grandchildren =
      tree.depth >= 2
        ? Array.from({ length: children }, (_, parent) => Array.from({ length: perParent }, (_, child) => ({ parent, index: parent * a + child }))).flat()
        : []
  const positions = (count: number, start: number, end: number) =>
      count === 1 ? [364] : Array.from({ length: count }, (_, i) => start + (i * (end - start)) / (count - 1)),
    childX = positions(children, 206, 521),
    grandX = positions(grandchildren.length, 165, 564),
    labels = tree.levels.slice(0, 4)
  return (
    <svg
      className="rt-diagram"
      viewBox="0 0 594 260"
      preserveAspectRatio="none"
      role="group"
      aria-label={tr('Recursion tree preview with complete level counts')}
    >
      <defs>
        <linearGradient id={`rt-root-${id}`} x2="0" y2="1">
          <stop stopColor="#e5f4ff" />
          <stop offset="1" stopColor="#c4e6ff" />
        </linearGradient>
        <linearGradient id={`rt-child-${id}`} x2="0" y2="1">
          <stop stopColor="#fff0f5" />
          <stop offset="1" stopColor="#ffd9e7" />
        </linearGradient>
        <linearGradient id={`rt-grand-${id}`} x2="0" y2="1">
          <stop stopColor="#e8fff5" />
          <stop offset="1" stopColor="#c9f4e2" />
        </linearGradient>
        <marker id={`rt-arrow-${id}`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0L8 4L0 8Z" fill="#6538ff" />
        </marker>
      </defs>
      {[21, 78, 151, 224].map((y) => (
        <line key={y} x1={110} x2={594} y1={y} y2={y} stroke="#e0ebfc" strokeDasharray="3 4" />
      ))}
      {childX.map((x, i) => (
        <path key={i} d={`M364 67L${x} 100`} stroke="#3e51ff" strokeWidth="1.5" fill="none" markerEnd={`url(#rt-arrow-${id})`} />
      ))}
      {grandchildren.map((node, i) => (
        <path key={i} d={`M${childX[node.parent]} 141L${grandX[i]} 173`} stroke="#8651ff" strokeWidth="1.4" fill="none" markerEnd={`url(#rt-arrow-${id})`} />
      ))}
      {labels.map((_, i) => (
        <g key={i} className={`rt-level-label ${selected === i ? 'selected' : ''}`}>
          <text x="0" y={i === 3 ? 235 : 43 + i * 69} fontWeight="700">
            {tr('Level ')}
            {i}
          </text>
          <text x="0" y={i === 3 ? 251 : 60 + i * 69} className="rt-level-expression">
            {tr('Work: ')}
            {workExpression(tree, i)}
          </text>
        </g>
      ))}
      <TreeNode x={364} y={40} r={26} label="n" fill={`url(#rt-root-${id})`} stroke="#1967ff" level={0} node={1} selected={selected === 0} onPick={onPick} />
      {childX.map((x, i) => (
        <TreeNode
          key={i}
          x={x}
          y={121}
          r={21}
          label={`n/${b}`}
          fill={`url(#rt-child-${id})`}
          stroke="#ff6899"
          level={1}
          node={i + 1}
          selected={selected === 1}
          onPick={onPick}
        />
      ))}
      {grandchildren.map((node, i) => (
        <TreeNode
          key={node.index}
          x={grandX[i]}
          y={194}
          r={20}
          label={`n/${b * b}`}
          fill={`url(#rt-grand-${id})`}
          stroke="#70dfaf"
          level={2}
          node={node.index + 1}
          selected={selected === 2}
          onPick={onPick}
        />
      ))}
      {tree.depth > 2 &&
        grandX.map((x) => (
          <text key={x} x={x} y="238" textAnchor="middle" fill="#24145c" fontSize="19">
            ⋯
          </text>
        ))}
      {a > 2 && tree.depth > 1 && (
        <text x="150" y="258" className="rt-preview-note">
          {tr('Preview: ')}
          {children}/{tree.levels[1].nodes}
          {tr(' nodes at level 1; ')}
          {grandchildren.length}/{tree.levels[2].nodes}
          {tr(' at level 2. Full counts are used.')}
        </text>
      )}
    </svg>
  )
}
function TreeNode({
  x,
  y,
  r,
  label,
  fill,
  stroke,
  level,
  node,
  selected,
  onPick,
}: {
  x: number
  y: number
  r: number
  label: string
  fill: string
  stroke: string
  level: number
  node: number
  selected: boolean
  onPick: (level: number) => void
}) {
  return (
    <g
      role="button"
      tabIndex={0}
      className={`rt-node ${selected ? 'selected' : ''}`}
      aria-label={tr(`Inspect recursion level ${level}, node ${node}`)}
      onClick={() => onPick(level)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onPick(level)
        }
      }}
    >
      <circle cx={x} cy={y} r={r} fill={fill} stroke={stroke} strokeWidth={level ? 1.2 : 1.7} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize={level ? 12 : 17} fontStyle={level ? 'italic' : undefined} fontWeight={500}>
        {label}
      </text>
    </g>
  )
}
function CostChart({
  tree,
  scale,
  selected,
  onPick,
}: {
  tree: ReturnType<typeof recursionTreeAnalysis>
  scale: TreeScale
  selected: number | null
  onPick: (level: number) => void
}) {
  const [hover, setHover] = useState<number | null>(null),
    chart = recursionCostChart(
      tree.levels.map((row) => row.work),
      scale,
    ),
    x = (i: number) => 60 + (i * 240) / Math.max(1, tree.depth),
    y = (fraction: number) => 160 - fraction * 150,
    requested = hover ?? selected,
    inspected = requested !== null && requested >= 0 && requested < tree.levels.length ? requested : null
  const label =
    inspected === null
      ? tree.parameters.k === 0
        ? `${tr('Each level: ')}×${format(tree.ratio)} ${tr('work')}`
        : tr('Inspect a level for exact work')
      : `${tr('Level ')}${inspected}: ${format(tree.levels[inspected].work)}`
  return (
    <svg
      className="rt-cost-chart"
      viewBox="0 0 312 214"
      preserveAspectRatio="none"
      role="group"
      aria-label={tr(`Level costs on a ${scale} scale`)}
      onMouseLeave={() => setHover(null)}
    >
      {chart.ticks.map((tick) => {
        const fraction = scale === 'linear' ? tick / chart.max : (Math.log10(tick) - Math.log10(chart.min)) / (Math.log10(chart.max) - Math.log10(chart.min))
        return (
          <g key={tick}>
            <line x1="60" x2="312" y1={y(fraction)} y2={y(fraction)} stroke="#dce8fa" strokeDasharray="2 2" />
            <text x="47" y={y(fraction) + 4} textAnchor="end">
              {scale === 'logarithmic' ? (
                <>
                  {'10'}
                  <tspan baselineShift="super" fontSize="9">
                    {Math.round(Math.log10(tick))}
                  </tspan>
                </>
              ) : tick >= 1e6 ? (
                tick.toExponential(1).replace('e+', 'e')
              ) : tick >= 1000 ? (
                `${format(tick / 1000)}k`
              ) : (
                format(tick)
              )}
            </text>
          </g>
        )
      })}
      {tree.levels.map((row) => (
        <g key={row.level}>
          <line x1={x(row.level)} x2={x(row.level)} y1="10" y2="160" stroke="#dce8fa" strokeDasharray="2 2" />
          <text x={x(row.level)} y="182" textAnchor="middle">
            {row.level}
          </text>
        </g>
      ))}
      <path d="M60 5V160H312" fill="none" stroke="#5c7fc2" />
      <path d={`M${x(0)} 160 ${chart.fractions.map((f, i) => `L${x(i)} ${y(f)}`).join(' ')} L${x(tree.depth)} 160Z`} fill="#cfe6ff" opacity=".45" />
      <path d={chart.fractions.map((f, i) => `${i ? 'L' : 'M'}${x(i)} ${y(f)}`).join(' ')} fill="none" stroke="#0070ff" strokeWidth="2" />
      {tree.levels.map((row, i) => (
        <circle
          key={i}
          role="button"
          tabIndex={0}
          aria-label={tr(`Inspect level ${i} cost ${format(row.work)}`)}
          className={selected === i ? 'selected' : ''}
          cx={x(i)}
          cy={y(chart.fractions[i])}
          r="5.5"
          fill="#006cff"
          stroke="white"
          strokeWidth="1.8"
          onMouseEnter={() => setHover(i)}
          onFocus={() => setHover(i)}
          onBlur={() => setHover(null)}
          onClick={() => onPick(i)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onPick(i)
            }
          }}
        />
      ))}
      <g className="rt-chart-callout">
        <rect x="128" y="48" width="132" height="33" rx="6" fill="#f0faff" stroke="#cce7ff" />
        <path d="M188 81L194 87L200 81" fill="#f0faff" stroke="#cce7ff" />
        <text x="194" y="68" textAnchor="middle">
          {label}
        </text>
      </g>
      <text x="186" y="204" textAnchor="middle">
        {tr('Level (i)')}
      </text>
      <text x="14" y="90" textAnchor="middle" transform="rotate(-90 14 90)">
        {tr('Work per level')}
      </text>
    </svg>
  )
}

export function RecursionTreeMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const [tab, setTab] = useState<Tab>('Learn'),
    [parameters, setParameters] = useState<MasterParameters>({ a: 4, b: 2, d: 1, k: 0 }),
    [choice, setChoice] = useState('n'),
    [depth, setDepth] = useState(7),
    [scale, setScale] = useState<TreeScale>('linear'),
    [selected, setSelected] = useState<number | null>(null),
    [playing, setPlaying] = useState(false),
    [error, setError] = useState(''),
    [modal, setModal] = useState<{ kind: 'mistake' | 'worked' | 'chain' | 'expanded'; index?: number } | null>(null),
    [chainSize, setChainSize] = useState(6),
    [predictedWork, setPredictedWork] = useState(''),
    [predictedLeaves, setPredictedLeaves] = useState(''),
    [feedback, setFeedback] = useState(''),
    [quiz, setQuiz] = useState(''),
    [quizFeedback, setQuizFeedback] = useState(''),
    [done, setDone] = useState<string[]>([]),
    [notes, setNotes] = usePersistentState('recursion-tree-notes', '', persistentString)
  const dialogRef = useRef<HTMLDialogElement>(null),
    tree = recursionTreeAnalysis(parameters, depth),
    level = selected ?? 0,
    current = tree.levels[level],
    chain = decrementTree(chainSize)
  function mark(key: string) {
    setDone((old) => (old.includes(key) ? old : [...old, key]))
  }
  useEffect(() => {
    if (!playing || level >= depth) return
    const timer = window.setTimeout(() => {
      setSelected(level + 1)
      if (level + 1 === depth) {
        setPlaying(false)
        mark('level')
      }
    }, 650)
    return () => clearTimeout(timer)
  }, [playing, level, depth])
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
  function update(next: MasterParameters) {
    try {
      recursionTreeAnalysis(next, depth)
      setParameters(next)
      setSelected(null)
      setPlaying(false)
      setError('')
      setFeedback('')
      mark('parameters')
    } catch (e) {
      setError((e as Error).message)
    }
  }
  function edit(key: 'a' | 'b' | 'd' | 'k', raw: string) {
    if (!raw.trim()) {
      setError('Enter an integer in the supported range.')
      return
    }
    update({ ...parameters, [key]: Number(raw) })
  }
  function chooseFunction(id: string) {
    setChoice(id)
    if (id !== 'custom') {
      const f = functions.find((f) => f.id === id)!
      update({ ...parameters, d: f.d, k: f.k })
    } else mark('parameters')
  }
  function pick(next: number) {
    setSelected(next)
    setPlaying(false)
    setFeedback('')
    mark('level')
  }
  function loadWorked() {
    setParameters({ a: 4, b: 2, d: 1, k: 0 })
    setChoice('n')
    setDepth(7)
    setSelected(null)
    setPlaying(false)
    setError('')
    setFeedback('')
    mark('worked')
  }
  function predict() {
    if (level >= depth) {
      setFeedback('The leaf level is already reached. Reset the inspected level to predict an expansion.')
      return
    }
    const expected = tree.levels[level + 1].work,
      work = Number(predictedWork),
      leaves = Number(predictedLeaves),
      correct =
        predictedWork.trim() !== '' &&
        predictedLeaves.trim() !== '' &&
        Number.isFinite(work) &&
        Number.isFinite(leaves) &&
        Math.abs(work - expected) <= Math.max(1, Math.abs(expected)) * 5e-6 &&
        Math.abs(leaves - tree.leafWork) <= Math.max(1, tree.leafWork) * 5e-6
    setFeedback(
      correct
        ? `Correct. Level ${level + 1} costs ${format(expected)}; there are ${format(tree.leafWork)} leaves.`
        : 'Not yet. Multiply the next level’s node count by its per-node work; the leaf count is a^h. Enter exact values or at least six significant digits.',
    )
    if (correct) mark('challenge')
  }
  function exportTrace() {
    const url = URL.createObjectURL(
        new Blob([JSON.stringify({ parameters, depth, scale, selectedLevel: selected, analysis: tree }, null, 2)], { type: 'application/json' }),
      ),
      anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'recursion-tree-levels.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div className="mom-page recursion-page target-visual" data-target="7">
      <MockupLessonChrome
        {...props}
        title={tr('Recurrences: Recursion Trees')}
        description={'Visualize the recursion tree, compute work at each level and at the leaves, and\nunderstand how the recurrence solves.'}
        heroIcon={<TreeIcon />}
        decoration={<HeroArt />}
        progress={{ completed: done.length, total: 5 }}
        startLabel="Continue Learning"
        searchPlaceholder="Search topics, examples, or practice problems..."
        onStart={() => open('Visualize')}
        badges={
          <>
            <span>
              <BarChart3 />
              {tr('Visual Interactive Tree')}
            </span>
            <span>
              <FileText />
              {tr('Step-by-step Example')}
            </span>
            <span>
              <Settings />
              {tr('Multiple Functions')}
            </span>
            <span>
              <Trophy />
              {tr('Exam Practice')}
            </span>
          </>
        }
      />
      <nav className="mom-tabs rt-tabs" aria-label={tr('Algorithm sections')}>
        {tabs.map((name, i) => {
          const Icon = tabIcons[i]
          return (
            <button key={name} aria-pressed={tab === name} onClick={() => open(name)}>
              <Icon size={19} />
              {tr(name)}
            </button>
          )
        })}
      </nav>
      {error && (
        <p className="rt-error" role="alert">
          {tr(error)}
        </p>
      )}
      {(tab === 'Learn' || tab === 'Visualize') && (
        <>
          {tab === 'Visualize' && (
            <Panel
              className="rt-lab"
              title={tr('Inspect every level and its contribution')}
              description="The power-size model uses n = b^h and T(1) = 1. Internal levels exclude the leaf level."
              icon={<LineChart />}
            >
              <div className="rt-controls">
                <label>
                  {tr('Tree depth h')}
                  <input
                    aria-label={tr('Recursion tree depth')}
                    type="number"
                    min={0}
                    max={10}
                    value={depth}
                    onChange={(e) => {
                      const n = Number(e.target.value)
                      if (!e.target.value.trim() || !Number.isInteger(n) || n < 0 || n > 10) {
                        setError('Use an integer depth from 0 to 10.')
                        return
                      }
                      setDepth(n)
                      setSelected(0)
                      setPlaying(false)
                      setError('')
                      setFeedback('')
                    }}
                  />
                </label>
                <button disabled={!level} onClick={() => pick(level - 1)}>
                  {tr('Previous level')}
                </button>
                <button disabled={level === depth} onClick={() => pick(level + 1)}>
                  {tr('Next level')}
                </button>
                <button
                  disabled={!depth}
                  onClick={() => {
                    if (level === depth) setSelected(0)
                    setPlaying(!playing)
                  }}
                >
                  {playing ? <Pause size={15} /> : <Play size={15} />} {tr(playing ? 'Pause levels' : 'Play levels')}
                </button>
                <button
                  onClick={() => {
                    setSelected(0)
                    setPlaying(false)
                  }}
                >
                  {tr('Reset levels')}
                </button>
                <button
                  onClick={() => {
                    setModal({ kind: 'expanded' })
                    setPlaying(false)
                  }}
                >
                  {tr('Expand tree accounting')}
                </button>
                <button onClick={exportTrace}>{tr('Export levels JSON')}</button>
              </div>
              <p className="rt-trace-status" role="status">
                {tr('Level ')}
                {level}/{depth} · {tr('nodes = ')}
                {format(current.nodes)} · {tr('size per node = ')}
                {format(current.size)} · {tr('work = ')}
                {format(current.work)} · {tr(current.leaf ? 'leaf base costs' : 'combine work')}
              </p>
              <input
                aria-label={tr('Selected recursion tree level')}
                type="range"
                min={0}
                max={depth}
                value={level}
                onChange={(e) => pick(Number(e.target.value))}
              />
              <LevelTable tree={tree} selected={level} onPick={pick} />
              <div className="rt-numeric-totals">
                <span>
                  {tr('Internal work: ')}
                  {format(tree.combineWork)}
                </span>
                <span>
                  {tr('Leaf work: ')}
                  {format(tree.leafWork)}
                </span>
                <b>
                  {tr('Modeled total: ')}
                  {format(tree.total)}
                </b>
              </div>
              <div className="rt-presets">
                <button onClick={loadWorked}>{tr('Load worked recurrence')}</button>
                <button
                  onClick={() => {
                    setParameters({ a: 2, b: 2, d: 1, k: 0 })
                    setChoice('n')
                    setSelected(null)
                    setPlaying(false)
                    setError('')
                    mark('parameters')
                  }}
                >
                  {tr('Compare merge sort')}
                </button>
                <button
                  onClick={() => {
                    setParameters({ a: 1, b: 2, d: 0, k: 0 })
                    setChoice('one')
                    setSelected(null)
                    setPlaying(false)
                    setError('')
                    mark('parameters')
                  }}
                >
                  {tr('Compare binary search')}
                </button>
                <button onClick={() => setModal({ kind: 'chain' })}>{tr('Contrast T(n−1) + n')}</button>
              </div>
            </Panel>
          )}
          <div className="rt-upper-grid">
            <div className="rt-main-column">
              <div className="rt-first-row">
                <Panel
                  className={`rt-tree-panel ${choice === 'custom' ? 'custom' : ''}`}
                  title={tr('Interactive Recursion Tree')}
                  description="Adjust parameters and see the recursion tree, level costs and total complexity in real time."
                  icon={<BarChart3 />}
                >
                  <div className="rt-tree-inputs">
                    <label>
                      {tr('a (branch factor)')}
                      <div>
                        <input
                          aria-label={tr('Branch factor slider')}
                          type="range"
                          min={1}
                          max={16}
                          step={1}
                          value={parameters.a}
                          onChange={(e) => edit('a', e.target.value)}
                        />
                        <input
                          aria-label={tr('Branch factor a')}
                          type="number"
                          min={1}
                          max={16}
                          value={parameters.a}
                          onChange={(e) => edit('a', e.target.value)}
                        />
                      </div>
                    </label>
                    <label>
                      {tr('b (subproblem size)')}
                      <div>
                        <input
                          aria-label={tr('Size reduction slider')}
                          type="range"
                          min={2}
                          max={16}
                          step={1}
                          value={parameters.b}
                          onChange={(e) => edit('b', e.target.value)}
                        />
                        <input
                          aria-label={tr('Size reduction b')}
                          type="number"
                          min={2}
                          max={16}
                          value={parameters.b}
                          onChange={(e) => edit('b', e.target.value)}
                        />
                      </div>
                    </label>
                    <label>
                      {tr('f(n) (work per node)')}
                      <select aria-label={tr('Work per node function')} value={choice} onChange={(e) => chooseFunction(e.target.value)}>
                        {functions.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.id === 'custom' ? tr(f.label) : f.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {choice === 'custom' && (
                    <div className="rt-custom-inputs">
                      <label>
                        {tr('Polynomial exponent d')}
                        <input
                          aria-label={tr('Tree polynomial exponent d')}
                          type="number"
                          min={0}
                          max={8}
                          value={parameters.d}
                          onChange={(e) => edit('d', e.target.value)}
                        />
                      </label>
                      <label>
                        {tr('Logarithmic exponent k')}
                        <input
                          aria-label={tr('Tree logarithmic exponent k')}
                          type="number"
                          min={-3}
                          max={5}
                          value={parameters.k}
                          onChange={(e) => edit('k', e.target.value)}
                        />
                      </label>
                    </div>
                  )}
                  <div className="rt-diagram-scroll" tabIndex={0} role="region" aria-label={tr('Recursion tree, scroll horizontally on narrow screens')}>
                    <RecursionDiagram tree={tree} selected={selected} onPick={pick} />
                  </div>
                </Panel>
                <Panel className="rt-summary" title={tr('Level Cost Summary')} icon={<BarChart3 />}>
                  <div className="rt-scale">
                    <span>{tr('Scale:')}</span>
                    {(['linear', 'logarithmic'] as const).map((s) => (
                      <button
                        key={s}
                        aria-pressed={scale === s}
                        onClick={() => {
                          setScale(s)
                          mark('scale')
                        }}
                      >
                        {tr(s === 'linear' ? 'Linear' : 'Logarithmic')}
                      </button>
                    ))}
                  </div>
                  <div className="rt-chart-scroll">
                    <CostChart tree={tree} scale={scale} selected={selected} onPick={pick} />
                  </div>
                  <div className="rt-cost-formula">
                    <h3>{tr('Level cost formula')}</h3>
                    <p>
                      {selected === null ? (
                        <>
                          {tr('Work at level i: ')}
                          {'aⁱ · f(n/bⁱ)'}
                          {parameters.k === 0 && parameters.d === 1 ? (
                            <>
                              {' = '}
                              {parameters.a}
                              {'ⁱ · (n/'}
                              {parameters.b}
                              {'ⁱ) = ('}
                              {format(tree.ratio)}
                              {')ⁱ n'}
                            </>
                          ) : null}
                        </>
                      ) : (
                        <>
                          {tr('Level ')}
                          {level}: {format(current.nodes)} × {format(current.perNode)} = {format(current.work)}.
                        </>
                      )}
                    </p>
                    <p>
                      {selected === null
                        ? tr(
                            parameters.k === 0
                              ? tree.ratio === 1
                                ? 'Internal level costs are equal.'
                                : tree.ratio > 1
                                  ? 'Internal level costs grow geometrically.'
                                  : 'Internal level costs shrink geometrically.'
                              : 'The log factor changes the level-cost ratio. Inspect the actual values.',
                          )
                        : tr(
                            current.leaf ? 'Leaf work uses T(1) = 1, not an unevaluated f(1).' : 'This is total work across every node at the selected level.',
                          )}
                    </p>
                  </div>
                </Panel>
              </div>
              <div className="rt-cost-row">
                <Panel className="rt-leaf" title={tr('Leaf Cost Analysis')} icon={<Leaf />}>
                  <div className="rt-leaf-cards">
                    <div>
                      <h3>{tr('Number of leaves')}</h3>
                      <p>
                        {parameters.a}
                        <sup>
                          {'log'}
                          <sub>{parameters.b}</sub>
                          {' n'}
                        </sup>
                        {' = '}
                        <Critical parameters={parameters} />
                      </p>
                      <small>
                        {tr('At n = ')}
                        {format(tree.n)}: {format(tree.leafWork)}
                      </small>
                    </div>
                    <div>
                      <h3>{tr('Work per leaf')}</h3>
                      <p>{'T(1) = 1'}</p>
                    </div>
                    <div>
                      <h3>{tr('Total leaf cost')}</h3>
                      <p>
                        <Critical parameters={parameters} />
                        {' · 1'}
                      </p>
                      <small>
                        <Bound text={tree.leafBound} />
                      </small>
                    </div>
                  </div>
                </Panel>
                <Panel className="rt-total" title={tr('Total Work')} icon={<Sigma />}>
                  <p>
                    {tr('Internal levels: ')}
                    {parameters.a === 4 && parameters.b === 2 && parameters.d === 1 && parameters.k === 0 ? (
                      <>
                        {'n(n − 1) = '}
                        <Bound text={tree.internalBound} />
                      </>
                    ) : (
                      <Bound text={tree.internalBound} />
                    )}
                  </p>
                  <p className="rt-leaf-bound">
                    {tr('Leaf cost: ')}
                    {'Θ('}
                    <Critical parameters={parameters} />
                    {')'}
                  </p>
                  <div className="rt-overall" data-bound={tree.bound}>
                    {tr('Overall: ')}
                    <b>
                      {'T(n) = '}
                      <Bound text={tree.bound} />
                    </b>
                  </div>
                </Panel>
              </div>
            </div>
            <aside className="rt-side-column">
              <article className="rt-takeaways">
                <h2>
                  <Lightbulb />
                  {tr('Key Takeaways')}
                </h2>
                <ul>
                  {[
                    'At level i, there are aⁱ nodes of size n/bⁱ. Total level work is aⁱ f(n/bⁱ).',
                    'Sum internal levels 0…h−1 and add the leaves at h = log_b n.',
                    'Recursion trees give an intuitive way to understand many divide-and-conquer recurrences.',
                    'Useful for justifying rounding and for non-uniform recursion.',
                  ].map((s) => (
                    <li key={s}>
                      <span>
                        <Check />
                      </span>
                      <p>{tr(s)}</p>
                    </li>
                  ))}
                </ul>
                <div className="rt-pro-tip">
                  <h3>
                    <Target />
                    {tr('Pro Tip')}
                  </h3>
                  <p>
                    {tr(
                      'In many divide-and-conquer algorithms, f(n) is a polynomial. Compare its growth with n^log_b(a), the number of leaves, to see which part dominates.',
                    )}
                  </p>
                </div>
              </article>
              <Panel className="rt-mistakes" title={tr('Common Mistakes')} icon={<AlertTriangle />}>
                <ul>
                  {mistakes.map(([text], i) => (
                    <li key={text}>
                      <X />
                      <button onClick={() => setModal({ kind: 'mistake', index: i })}>{tr(text)}</button>
                    </li>
                  ))}
                </ul>
              </Panel>
            </aside>
          </div>
          <div className="rt-bottom-grid">
            <Panel className="rt-worked" title={tr('Worked Example: T(n) = 4T(n/2) + n')} icon={<BookOpen />}>
              <div className="rt-worked-grid">
                {[
                  ['Level work', '4ⁱ · (n/2ⁱ) = 2ⁱ n for i = 0, 1, …, h − 1.'],
                  ['Internal cost', 'Σ n·2ⁱ = n(2ʰ − 1) = n(n − 1) = Θ(n²).'],
                  ['Leaf cost', 'Number of leaves: 4^log₂n = n²; work per leaf: T(1) = 1.'],
                  ['Total work', 'n(n − 1) + n² = 2n² − n = Θ(n²).'],
                ].map(([title, body], i) => (
                  <button
                    key={title}
                    aria-label={tr(`Inspect worked step ${i + 1}`)}
                    onClick={() => {
                      setModal({ kind: 'worked', index: i })
                      mark('worked')
                    }}
                  >
                    <b>{i + 1}</b>
                    <span>
                      <strong>{tr(title)}</strong>
                      <span>{tr(body)}</span>
                    </span>
                  </button>
                ))}
              </div>
            </Panel>
            <Panel className="rt-assumptions" title={tr('Assumptions and Constraints')} icon={<Settings />}>
              <ul>
                {[
                  'a ≥ 1 and b > 1 are constants.',
                  'f(n) is eventually nonnegative; base work is T(1) = 1 in this model.',
                  'The displayed balanced model uses n = bʰ for exact sizes. Floors and ceilings need their own justification.',
                  'Lab bounds: integer a = 1…16, b = 2…16, d = 0…8, k = −3…5 and depth h = 0…10.',
                ].map((s) => (
                  <li key={s}>{tr(s)}</li>
                ))}
              </ul>
            </Panel>
          </div>
          <details className="rt-theory">
            <summary>{tr('Theory: count nodes, sum levels, include leaves')}</summary>
            <div>
              <article>
                <h2>{tr('Build and sum a balanced recursion tree')}</h2>
                <p>
                  {tr(
                    'For T(n) = aT(n/b) + f(n), assume n = bʰ and constant base cost T(1) = 1. At internal level i, there are aⁱ nodes, each of size n/bⁱ. Their total combine work is aⁱ f(n/bⁱ). The internal levels run from 0 through h − 1. The leaf level h has aʰ = n^log_b(a) unit-cost leaves. Add those leaf costs separately. A bounded drawing is a preview; the accounting includes every node.',
                  )}
                </p>
                <p>
                  {tr(
                    'When f(n) = nᵈ, the internal-level cost is nᵈ(a/bᵈ)ⁱ. A ratio below 1 gives a root-dominated geometric sum, a ratio of 1 gives h equal contributions, and a ratio above 1 gives growth toward the bottom. A logarithmic factor adds a level-dependent term; do not assume a constant ratio without checking it. Linear and logarithmic chart scales plot the same positive work values with different axes.',
                  )}
                </p>
              </article>
              <article>
                <h2>{tr('The reference recurrence, corrected')}</h2>
                <p>
                  {tr(
                    'For 4T(n/2) + n, level i costs 4ⁱ(n/2ⁱ) = 2ⁱ n. It is not a constant 2n at every level. For n = 128 there are seven internal levels costing 128, 256, 512, 1024, 2048, 4096 and 8192. Their sum is 16256. There are 4⁷ = 16384 unit-cost leaves. The exact total is 32640 = 2n² − n, so T(n) = Θ(n²). Both the internal and leaf costs have order n².',
                  )}
                </p>
                <p>
                  {tr(
                    'This lab also evaluates nᵈ logᵏn with negative k. At d = log_b a, rewriting by distance from the leaves gives n^log_b(a) times a harmonic-type sum. For k = −1, that adds log log n; for k < −1, the sum converges and the total has order n^log_b(a). These are direct level-sum extensions, not applications of the stated Master Theorem Case 2 with k ≥ 0.',
                  )}
                </p>
              </article>
            </div>
            <p>
              {tr(
                'A recurrence such as T(n) = T(n−1) + n is a chain of depth n−1, not a balanced logarithmic-height tree. Unequal splits also require the actual sizes and node counts at each level. Rounding may change exact finite costs; justify its asymptotic effect instead of assuming all recurrences have uniform levels.',
              )}
            </p>
            <button onClick={() => setModal({ kind: 'chain' })}>{tr('Visualize the decreasing-by-one chain')}</button>
          </details>
        </>
      )}
      {(tab === 'Practice' || tab === 'Quiz') && (
        <Panel
          className="rt-lab"
          title={tr('Predict the next level and the leaf count')}
          description="Count all nodes and multiply by the work at one node. Small numerical rounding is accepted."
          icon={<Trophy />}
        >
          <p>
            {tr('Current recurrence: ')}
            {'T(n) = '}
            {parameters.a}
            {`T(n/${parameters.b}) + `}
            <Growth d={parameters.d} k={parameters.k} />
            {' · n = '}
            {format(tree.n)}
            {' · h = '}
            {depth}
            {' · i = '}
            {level}
          </p>
          <div className="rt-controls">
            <button onClick={loadWorked}>{tr('Use worked example')}</button>
            <button onClick={() => pick(0)}>{tr('Reset prediction level')}</button>
            <label>
              {tr('Next level work')}
              <input
                aria-label={tr('Predicted next level work')}
                type="number"
                step="any"
                value={predictedWork}
                onChange={(e) => {
                  setPredictedWork(e.target.value)
                  setFeedback('')
                }}
              />
            </label>
            <label>
              {tr('Number of leaves')}
              <input
                aria-label={tr('Predicted number of leaves')}
                type="number"
                step="any"
                value={predictedLeaves}
                onChange={(e) => {
                  setPredictedLeaves(e.target.value)
                  setFeedback('')
                }}
              />
            </label>
            <button disabled={level === depth} onClick={predict}>
              {tr('Check prediction')}
            </button>
          </div>
          {feedback && (
            <p className="rt-prediction-feedback" role="status">
              {tr(feedback)}
            </p>
          )}
          {tab === 'Quiz' && (
            <div className="rt-quiz">
              <h3>{tr('Which expression is the total combine work at internal level i?')}</h3>
              {[
                ['one', 'f(n/bⁱ), because all nodes are identical.'],
                ['all', 'aⁱ f(n/bⁱ), because every node contributes work.'],
                ['constant', '2n for every divide-and-conquer recurrence.'],
              ].map(([value, label]) => (
                <label key={value}>
                  <input type="radio" name="recursion-level-quiz" value={value} checked={quiz === value} onChange={(e) => setQuiz(e.target.value)} />
                  {tr(label)}
                </label>
              ))}
              <button
                onClick={() => {
                  setQuizFeedback(
                    quiz === 'all'
                      ? 'Correct. Identical costs still need to be multiplied by the number of nodes.'
                      : 'Not yet. f(n/bⁱ) is the work of one node; count all aⁱ nodes.',
                  )
                  if (quiz === 'all') mark('challenge')
                }}
              >
                {tr('Check answer')}
              </button>
              {quizFeedback && (
                <p className="rt-quiz-feedback" role="status">
                  {tr(quizFeedback)}
                </p>
              )}
            </div>
          )}
        </Panel>
      )}
      {tab === 'Notes' && (
        <Panel className="rt-lab" title={tr('Your recursion-tree notes')} description="Saved automatically in this browser." icon={<FileText />}>
          <label>
            {tr('Record the recurrence, node count, per-node work, depth, leaf cost and total.')}
            <textarea rows={12} aria-label={tr('Recursion tree notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
        </Panel>
      )}
      <dialog
        ref={dialogRef}
        className={`rt-dialog ${modal?.kind === 'expanded' ? 'rt-expanded' : ''}`}
        aria-label={tr('Recursion tree detail')}
        onClose={() => setModal(null)}
      >
        <button className="rt-dialog-close" aria-label={tr('Close recursion detail')} onClick={() => setModal(null)}>
          <X />
        </button>
        {modal?.kind === 'mistake' && (
          <>
            <h2>{tr('Correct the recursion-tree mistake')}</h2>
            <h3>{tr(mistakes[modal.index!][0])}</h3>
            <p>{tr(mistakes[modal.index!][1])}</p>
          </>
        )}
        {modal?.kind === 'worked' && (
          <>
            <h2>{tr(`Worked example — Step ${modal.index! + 1}`)}</h2>
            <p>{'T(n) = 4T(n/2) + n, n = 128, T(1) = 1.'}</p>
            <p className="rt-worked-proof">
              {tr(
                modal.index === 0
                  ? 'At level i there are 4ⁱ nodes, each doing n/2ⁱ work. Multiply to obtain 2ⁱ n. The internal levels i = 0…6 cost 128, 256, 512, 1024, 2048, 4096 and 8192.'
                  : modal.index === 1
                    ? 'The geometric sum is n(1 + 2 + ⋯ + 2ʰ⁻¹) = n(2ʰ − 1). Since 2ʰ = n, the internal cost is n(n − 1). At n = 128, this equals 16256.'
                    : modal.index === 2
                      ? 'At depth h = log₂n = 7 there are 4ʰ = 16384 leaves, each of size 1. Their base cost is T(1) = 1 each, so the leaf cost is 16384.'
                      : 'Add the internal and leaf costs: n(n − 1) + n² = 2n² − n = 32640 at n = 128. Hence both parts and the overall total have order n², not n log n.',
              )}
            </p>
            <LevelTable tree={worked} selected={modal.index === 2 ? 7 : 0} />
            <button
              className="rt-primary"
              onClick={() => {
                loadWorked()
                setModal(null)
                open('Visualize')
              }}
            >
              {tr('Explore the worked recurrence')}
            </button>
          </>
        )}
        {modal?.kind === 'expanded' && (
          <>
            <h2>{tr('Full level accounting')}</h2>
            <p>{tr('The picture is a bounded preview. Every node is counted in the table, including the leaves.')}</p>
            <div className="rt-expanded-diagram">
              <RecursionDiagram tree={tree} selected={selected} onPick={pick} />
            </div>
            <LevelTable tree={tree} selected={level} onPick={pick} />
            <p className="rt-expanded-total">
              {tr('Internal + leaf = ')}
              {format(tree.combineWork)}
              {' + '}
              {format(tree.leafWork)}
              {' = '}
              {format(tree.total)}
            </p>
          </>
        )}
        {modal?.kind === 'chain' && (
          <>
            <h2>{tr('A decreasing-by-one recurrence is a chain')}</h2>
            <p>
              {'T(n) = T(n−1) + n, T(1) = 1.'} {tr('There is one child at each step. The depth is n−1, and the total is n + (n−1) + ⋯ + 1 = n(n+1)/2.')}
            </p>
            <label>
              {tr('Input n')}
              <input
                aria-label={tr('Decrement recurrence input n')}
                type="number"
                min={1}
                max={16}
                value={chainSize}
                onChange={(e) => {
                  const n = Number(e.target.value)
                  if (e.target.value.trim() && Number.isInteger(n) && n >= 1 && n <= 16) setChainSize(n)
                }}
              />
            </label>
            <p className="rt-chain-status" role="status">
              {tr('Depth: ')}
              {chain.depth}
              {' · '}
              {tr('Total work: ')}
              {chain.total}
              {' · '}
              {chain.bound}
            </p>
            <svg
              className="rt-chain-svg"
              viewBox={`0 0 440 ${chainSize * 52}`}
              role="img"
              aria-label={tr('Single-child recursion chain')}
              style={{ height: chainSize * 52 }}
            >
              {chain.levels.map((row, i) => (
                <g key={i}>
                  {i < chainSize - 1 && <path d={`M90 ${i * 52 + 34}V${(i + 1) * 52 + 8}`} stroke="#167eff" />}
                  <rect x="40" y={i * 52 + 7} width="100" height="31" rx="15" fill={row.leaf ? '#d4f5e3' : '#dfedff'} stroke="#a1caff" />
                  <text className="rt-chain-node-label" x="90" y={i * 52 + 27} textAnchor="middle">{`T(${row.size})`}</text>
                  <text x="170" y={i * 52 + 27}>
                    {tr('Level ')}
                    {i}
                    {': '}
                    {tr(row.leaf ? 'base cost ' : 'work ')}
                    {row.work}
                  </text>
                </g>
              ))}
            </svg>
          </>
        )}
      </dialog>
    </div>
  )
}
function LevelTable({ tree, selected, onPick }: { tree: ReturnType<typeof recursionTreeAnalysis>; selected: number; onPick?: (level: number) => void }) {
  return (
    <div className="rt-level-table-scroll">
      <table className="rt-level-table">
        <thead>
          <tr>
            {['Level', 'Nodes', 'Size per node', 'Work per node', 'Level work'].map((s) => (
              <th key={s}>{tr(s)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tree.levels.map((row) => (
            <tr key={row.level} className={selected === row.level ? 'selected' : ''}>
              <td>
                {onPick ? (
                  <button aria-label={tr(`Inspect level ${row.level} accounting`)} onClick={() => onPick(row.level)}>
                    {row.level}
                    {row.leaf ? tr(' (leaf)') : ''}
                  </button>
                ) : (
                  <>
                    {row.level}
                    {row.leaf ? tr(' (leaf)') : ''}
                  </>
                )}
              </td>
              <td>{format(row.nodes)}</td>
              <td>{format(row.size)}</td>
              <td>{format(row.perNode)}</td>
              <td>{format(row.work)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
