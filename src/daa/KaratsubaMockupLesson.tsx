// @localized-render
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  BarChart3,
  Bookmark,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Code2,
  FileText,
  Info,
  Lightbulb,
  Moon,
  Network,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Sun,
  X,
} from 'lucide-react'
import { AccountControl } from '../account/AccountControl'
import { LanguageSelector } from '../i18n/LanguageSelector'
import { tx, useLocaleRender } from '../i18n/render'
import { persistentString, usePersistentState } from '../hooks/usePersistentState'
import { MockupTabs, type MockupPageProps, type MockupTab } from './MockupLessonChrome'
import { parseKaratsubaInteger, runKaratsubaLesson, type KaratsubaNode, type KaratsubaRun } from './karatsubaLessonModel'
import './karatsuba-mockup.css'
const tr = (s: string) => tx(s, 'studios'),
  tabs: MockupTab[] = ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments'],
  short = (v: bigint) => (String(v).length > 6 ? `${String(v).slice(0, 3)}…${String(v).slice(-2)}` : String(v))
function Panel({ title, icon, children, className = '' }: { title: string; icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`kt-panel ${className}`}>
      <header>
        <span className="kt-icon">{icon}</span>
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  )
}
function Formula() {
  return (
    <span className="kt-equation">
      {`xy = z₂ · 10`}
      <sup>{'2m'}</sup>
      {' + (z₁ − z₂ − z₀) · 10'}
      <sup>{'m'}</sup>
      {' + z₀'}
    </span>
  )
}
function FirstTree({ run, active, onCall }: { run: KaratsubaRun; active: string; onCall: (n: KaratsubaNode) => void }) {
  const id = useId(),
    children = run.root.children
  return (
    <svg className="kt-tree" viewBox="13 0 815 134" aria-label={tr('First-level Karatsuba recursion tree')}>
      <title>{tr('Select a recursive call to inspect its exact inputs, split and result.')}</title>
      <defs>
        <marker id={`${id}-arrow`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0 0L6 3L0 6Z" fill="#0875ff" />
        </marker>
      </defs>
      {children &&
        ['M394 53L250 75', 'M438 53V75', 'M480 53L623 75'].map((path) => (
          <path key={path} d={path} stroke="#0875ff" fill="none" strokeWidth="1.8" markerEnd={`url(#${id}-arrow)`} />
        ))}
      {[
        { node: run.root, x: 438, y: 1, w: 170, label: '' },
        ...(children?.map((node, i) => ({ node, x: [250, 438, 623][i], y: 76, w: [145, 160, 140][i], label: `z${i}: ` })) ?? []),
      ].map(({ node, x, y, w, label }) => (
        <g
          key={node.id}
          role="button"
          tabIndex={0}
          aria-label={tr(`Inspect Karatsuba call ${node.id}`)}
          className={`kt-tree-node kt-tree-${node.id === 'P' ? 'root' : node.id.at(-1)} ${active !== 'P' && active.startsWith(node.id) && node.id !== 'P' ? 'kt-active-call' : ''}`}
          onClick={() => onCall(node)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onCall(node)
            }
          }}
        >
          <title>{`${node.x} × ${node.y} = ${node.result}`}</title>
          <rect x={x - w / 2} y={y} width={w} height="52" rx="10" />
          <text x={x} y={y + 22} textAnchor="middle" style={{ fontSize: node.n > 5 ? 12 : undefined }}>{`${label}${short(node.x)} × ${short(node.y)}`}</text>
          <text x={x} y={y + 42} textAnchor="middle">
            {tr(node.id === 'P' ? `(n = ${node.n} digits)` : `(n = ${node.n})`)}
          </text>
        </g>
      ))}
    </svg>
  )
}
export function KaratsubaMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const navigate = useNavigate(),
    [tab, setTab] = useState<MockupTab>('Visualization'),
    [run, setRun] = useState(() => runKaratsubaLesson('1234', '5678')),
    [xDraft, setXDraft] = useState('1234'),
    [yDraft, setYDraft] = useState('5678'),
    [cursor, setCursor] = useState(() => runKaratsubaLesson('1234', '5678').defaultCursor),
    [preview, setPreview] = useState(true),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(700),
    [error, setError] = useState(''),
    [modal, setModal] = useState<'product' | 'call' | 'result' | null>(null),
    [product, setProduct] = useState(0),
    [callId, setCallId] = useState('P'),
    [prediction, setPrediction] = useState(''),
    [feedback, setFeedback] = useState(''),
    [localTheme, setLocalTheme] = useState(() => localStorage.getItem('algodrishti-theme') ?? 'light'),
    dialog = useRef<HTMLDialogElement>(null)
  const [notes, setNotes] = usePersistentState('algodrishti-karatsuba-notes', '', persistentString),
    root = run.root,
    frame = run.frames[cursor],
    rootFrame = run.frames.slice(0, cursor + 1).findLast((f) => f.node === 'P')!,
    ready = preview ? [true, true, true] : rootFrame.known,
    resultReady = preview || rootFrame.kind === 'combine' || rootFrame.kind === 'base',
    call = run.nodes.find((n) => n.id === callId) ?? root,
    currentCall = run.nodes.find((n) => n.id === frame.node) ?? root,
    child = root.children?.[product],
    products = [root.z0, root.z1, root.z2],
    theme = props.theme ?? localTheme,
    studied = props.completed.includes(props.module.id),
    pending = xDraft.trim() !== String(run.x) || yDraft.trim() !== String(run.y),
    large = root.n > 12
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('algodrishti-theme', theme)
  }, [theme])
  useEffect(() => {
    if (modal) dialog.current?.showModal()
    else dialog.current?.close()
  }, [modal])
  useEffect(() => {
    if (!playing) return
    const timer = window.setTimeout(() => {
      if (cursor >= run.frames.length - 1) {
        setPlaying(false)
        return
      }
      setCursor(cursor + 1)
      if (cursor + 1 === run.frames.length - 1) setPlaying(false)
    }, speed)
    return () => window.clearTimeout(timer)
  }, [playing, cursor, run.frames.length, speed])
  function load(x: string, y: string, start = false) {
    const next = runKaratsubaLesson(x, y)
    setRun(next)
    setXDraft(String(next.x))
    setYDraft(String(next.y))
    setCursor(start ? 0 : next.defaultCursor)
    setPreview(!start)
    setPlaying(false)
    setError('')
    setFeedback('')
    setCallId('P')
    return next
  }
  function compute(start = false) {
    try {
      return load(xDraft, yDraft, start)
    } catch (e) {
      setError((e as Error).message)
      return undefined
    }
  }
  function step() {
    if (pending) {
      compute(true)
      return
    }
    setPlaying(false)
    setError('')
    setPreview(false)
    setCursor(cursor === run.frames.length - 1 ? 0 : cursor + 1)
  }
  function spin(which: 'x' | 'y', increment: bigint) {
    try {
      const next = String(parseKaratsubaInteger(which === 'x' ? xDraft : yDraft) + increment)
      parseKaratsubaInteger(next)
      if (which === 'x') setXDraft(next)
      else setYDraft(next)
      setError('')
    } catch (e) {
      setError((e as Error).message)
    }
  }
  function inspectProduct(i: number) {
    setProduct(i)
    setPlaying(false)
    setModal('product')
  }
  function inspectCall(n: KaratsubaNode) {
    setCallId(n.id)
    setPlaying(false)
    setModal('call')
  }
  function changeTab(next: MockupTab) {
    setTab(next)
    setPlaying(false)
  }
  function preset(x: string, y: string) {
    load(x, y)
  }
  const expressions = [`${root.b} × ${root.d}`, `(${root.b} + ${root.a}) × (${root.d} + ${root.c})`, `${root.a} × ${root.c}`],
    resultText = `${run.x} × ${run.y} = ${run.result}`
  return (
    <div className={`mom-page target-visual karatsuba-page ${large ? 'kt-large' : ''}`} data-target="35">
      <header className="kt-topbar">
        <button className="kt-back" aria-label={tr('Back to closest pair')} onClick={() => navigate('/daa-extensions/closest-pair')}>
          <ArrowLeft size={19} />
        </button>
        <div className="kt-title-row">
          <h1>{tr('Karatsuba Multiplication')}</h1>
          <p>{tr('Multiply integers with three recursive products.')}</p>
        </div>
        <button className="mom-study" aria-pressed={studied} onClick={() => props.toggleCompleted(props.module.id)}>
          {studied ? <Check size={16} /> : <Bookmark size={16} />} {tr(studied ? 'Studied' : 'Mark studied')}
        </button>
        <AccountControl showLanguage={false} />
      </header>
      <MockupTabs active={tab} onChange={changeTab} tabs={tabs} />
      {tab === 'Visualization' ? (
        <div className="kt-layout">
          <div className="kt-left-column">
            <section className="kt-visualization">
              <header className="kt-visual-heading">
                <span className="kt-main-icon">
                  <svg viewBox="0 0 28 28" aria-hidden="true">
                    <path d="M6 10L14 20L22 8M14 20L22 19" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    <path d="M2 10L6 6L10 10L6 14ZM10 20L14 16L18 20L14 24ZM18 8L22 4L26 8L22 12ZM19 19L22 16L25 19L22 22Z" fill="currentColor" />
                  </svg>
                </span>
                <div>
                  <h2>{tr('Interactive Visualization')}</h2>
                  <p>{tr('See how Karatsuba splits numbers, computes three products recursively, and combines the result.')}</p>
                </div>
              </header>
              <div className="kt-input-panel">
                {(['x', 'y'] as const).map((which) => (
                  <label key={which}>
                    {tr(which === 'x' ? 'First number (x)' : 'Second number (y)')}
                    <span className="kt-number-field">
                      <input
                        type="text"
                        inputMode="numeric"
                        aria-label={tr(which === 'x' ? 'Karatsuba first integer' : 'Karatsuba second integer')}
                        value={which === 'x' ? xDraft : yDraft}
                        onChange={(e) => {
                          if (which === 'x') setXDraft(e.target.value)
                          else setYDraft(e.target.value)
                          setPlaying(false)
                        }}
                      />
                      <span>
                        <button aria-label={tr(which === 'x' ? 'Increase first number' : 'Increase second number')} onClick={() => spin(which, 1n)}>
                          <ChevronUp />
                        </button>
                        <button aria-label={tr(which === 'x' ? 'Decrease first number' : 'Decrease second number')} onClick={() => spin(which, -1n)}>
                          <ChevronDown />
                        </button>
                      </span>
                    </span>
                  </label>
                ))}
                <button className="kt-primary kt-step" disabled={run.frames.length === 1 && !pending} onClick={step}>
                  <Play size={17} fill="currentColor" />
                  {tr('Step split')}
                </button>
                <button className="kt-compute" onClick={() => compute()}>
                  <Settings size={19} />
                  {tr('Compute')}
                </button>
                <button className="kt-reset" onClick={() => load('1234', '5678')}>
                  <RotateCcw size={19} />
                  {tr('Reset')}
                </button>
              </div>
              {error && (
                <p className="kt-input-error" role="alert">
                  {tr(error)}
                </p>
              )}
              {pending && !error && (
                <p className="kt-input-notice" role="status">
                  {tr('Inputs changed. Compute or Step split to apply them.')}
                </p>
              )}
              {!preview && (
                <p className="kt-trace-status" role="status">
                  {tr(`Step ${cursor + 1} / ${run.frames.length} · ${currentCall.x} × ${currentCall.y} · ${frame.message}`)}
                </p>
              )}
              <div className="kt-diagram-scroll" role="region" tabIndex={0} aria-label={tr('Scrollable Karatsuba split and recombination diagram')}>
                <div className="kt-diagram">
                  {root.children ? (
                    <>
                      <svg className="kt-arrows" viewBox="0 0 813 458" preserveAspectRatio="none" aria-hidden="true">
                        <defs>
                          {['blue', 'red', 'purple', 'green'].map((color, i) => (
                            <marker key={color} id={`kt-arrow-${color}`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                              <path d="M0 0L7 3.5L0 7Z" fill={['#0785ff', '#ff4c5d', '#8c46ee', '#13a75c'][i]} />
                            </marker>
                          ))}
                        </defs>
                        <path
                          d="M115 109L205 137L146 151M294 109L205 137M294 109L400 144M520 109L411 144"
                          stroke="#0785ff"
                          fill="none"
                          strokeWidth="1.5"
                          markerEnd="url(#kt-arrow-blue)"
                        />
                        <path d="M520 109L611 137M700 109L611 137L669 151" stroke="#8c46ee" fill="none" strokeWidth="1.5" markerEnd="url(#kt-arrow-purple)" />
                        <path d="M140 261L194 298" stroke="#0785ff" fill="none" strokeWidth="1.5" markerEnd="url(#kt-arrow-blue)" />
                        <path d="M408 277V298" stroke="#ff4c5d" fill="none" strokeWidth="1.5" markerEnd="url(#kt-arrow-red)" />
                        <path d="M678 262L622 298" stroke="#8c46ee" fill="none" strokeWidth="1.5" markerEnd="url(#kt-arrow-purple)" />
                        <path d="M408 366V386" stroke="#13a75c" fill="none" strokeWidth="1.5" markerEnd="url(#kt-arrow-green)" />
                      </svg>
                      <div className="kt-split-card kt-split-x">
                        <h3>{tr(`Split ${run.x < 0n ? '|x|' : 'x'} = ${root.x}`)}</h3>
                        <div>
                          <span>
                            <b>
                              {'x'}
                              <sub>{tr('high')}</sub>
                              {' = '}
                              <strong>{String(root.a)}</strong>
                              <small>{tr(`(first ${root.n - root.m} digits)`)}</small>
                            </b>
                          </span>
                          <span>
                            <b>
                              {'x'}
                              <sub>{tr('low')}</sub>
                              {' = '}
                              <strong>{String(root.b)}</strong>
                              <small>{tr(`(last ${root.m} digits)`)}</small>
                            </b>
                          </span>
                        </div>
                      </div>
                      <div className="kt-split-card kt-split-y">
                        <h3>{tr(`Split ${run.y < 0n ? '|y|' : 'y'} = ${root.y}`)}</h3>
                        <div>
                          <span>
                            <b>
                              {'y'}
                              <sub>{tr('high')}</sub>
                              {' = '}
                              <strong>{String(root.c)}</strong>
                              <small>{tr(`(first ${root.n - root.m} digits)`)}</small>
                            </b>
                          </span>
                          <span>
                            <b>
                              {'y'}
                              <sub>{tr('low')}</sub>
                              {' = '}
                              <strong>{String(root.d)}</strong>
                              <small>{tr(`(last ${root.m} digits)`)}</small>
                            </b>
                          </span>
                        </div>
                      </div>
                      {[0, 1, 2].map((i) => (
                        <button
                          key={i}
                          className={`kt-product kt-product-${i} ${ready[i] ? 'kt-product-ready' : 'kt-product-pending'}`}
                          aria-label={tr(`Inspect Karatsuba product z${i}`)}
                          onClick={() => inspectProduct(i)}
                        >
                          <h3>{`Z${i}`}</h3>
                          <p>
                            {i === 0 ? (
                              <>
                                {'x'}
                                <sub>{tr('low')}</sub>
                                {' × y'}
                                <sub>{tr('low')}</sub>
                              </>
                            ) : i === 2 ? (
                              <>
                                {'x'}
                                <sub>{tr('high')}</sub>
                                {' × y'}
                                <sub>{tr('high')}</sub>
                              </>
                            ) : (
                              <>
                                {'(x'}
                                <sub>{tr('low')}</sub>
                                {' + x'}
                                <sub>{tr('high')}</sub>
                                {') × (y'}
                                <sub>{tr('low')}</sub>
                                {' + y'}
                                <sub>{tr('high')}</sub>
                                {')'}
                              </>
                            )}
                          </p>
                          <p>{expressions[i]}</p>
                          {i === 1 && <p>{`= ${root.a + root.b} × ${root.c + root.d}`}</p>}
                          <strong>{ready[i] ? `= ${products[i]}` : tr('Pending')}</strong>
                        </button>
                      ))}
                      <button
                        className="kt-combine"
                        aria-label={tr('Inspect Karatsuba recombination')}
                        onClick={() => {
                          setPlaying(false)
                          setModal('result')
                        }}
                      >
                        <b>{tr(run.sign < 0n ? 'Combine magnitudes, then restore the sign' : 'Combine using Karatsuba formula')}</b>
                        <Formula />
                      </button>
                    </>
                  ) : (
                    <div className="kt-base-case">
                      <Lightbulb size={34} />
                      <h3>{tr('Base case: direct multiplication')}</h3>
                      <p>{tr('At least one operand has one digit, so no recursive products are needed.')}</p>
                      <strong>{`${root.x} × ${root.y} = ${root.result}`}</strong>
                    </div>
                  )}
                  <button
                    className="kt-result"
                    aria-label={tr('Inspect Karatsuba result')}
                    onClick={() => {
                      setPlaying(false)
                      setModal('result')
                    }}
                  >
                    <h3>{tr('Result')}</h3>
                    <strong>
                      {resultReady ? (resultText.length > 50 ? `${tr('Product')} = ${run.result}` : resultText) : tr('Waiting for all three products')}
                    </strong>
                  </button>
                </div>
              </div>
            </section>
            <Panel title={tr('Recursion tree (first level)')} icon={<Network />} className="kt-recursion">
              <FirstTree run={run} active={frame.node} onCall={inspectCall} />
            </Panel>
          </div>
          <div className="kt-right-column">
            <Panel title={tr('How it works')} icon={<Info />} className="kt-how">
              <ol>
                <li>
                  <i>{1}</i>
                  <p>
                    {tr('Split each n-digit number into high and low halves: ')}
                    {'x = a · 10'}
                    <sup>{'m'}</sup>
                    {' + b,   y = c · 10'}
                    <sup>{'m'}</sup>
                    {' + d.'}
                  </p>
                </li>
                <li>
                  <i>{2}</i>
                  <p>
                    {tr('Compute three products recursively:')}
                    <br />
                    {'z₀ = b · d,   z₂ = a · c,   z₁ = (a+b)(c+d).'}
                  </p>
                </li>
                <li>
                  <i>{3}</i>
                  <p>
                    {tr('Combine using: ')}
                    <Formula />
                  </p>
                </li>
                <li>
                  <i>{4}</i>
                  <p>{tr('Recurse on smaller values until base case (single-digit multiplication).')}</p>
                </li>
              </ol>
            </Panel>
            <Panel title={tr('Formula')} icon={<FileText />} className="kt-formula">
              <p>
                {tr('For ')}
                {'x = a · 10'}
                <sup>{'m'}</sup>
                {' + b'}
                {tr(' and ')}
                {'y = c · 10'}
                <sup>{'m'}</sup>
                {' + d,'}
              </p>
              <div className="kt-formula-box">
                <Formula />
              </div>
              <div className="kt-where">
                <span>{tr('where')}</span>
                <p>
                  {'z₀ = b · d,'}
                  <br />
                  {'z₁ = (a + b)(c + d),'}
                  <br />
                  {'z₂ = a · c.'}
                </p>
              </div>
            </Panel>
            <Panel title={tr('Intermediate products')} icon={<BarChart3 />} className="kt-intermediate">
              <div className="kt-table-scroll">
                <table>
                  <thead>
                    <tr>
                      {['Product', 'Expression', 'Value'].map((s) => (
                        <th key={s}>{tr(s)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[0, 1, 2].map((i) => (
                      <tr key={i}>
                        <td>
                          <button aria-label={tr(`Inspect intermediate product z${i}`)} onClick={() => inspectProduct(i)}>
                            <i className={`kt-dot kt-dot-${i}`} />
                            {`z${i}`}
                          </button>
                        </td>
                        <td>{root.children ? expressions[i] : '—'}</td>
                        <td>{root.children ? (ready[i] ? String(products[i]) : tr('Pending')) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
            <Panel title={tr('Complexity')} icon={<BarChart3 />} className="kt-complexity">
              <strong>
                {tr('Time: ')}
                {'O(n'}
                <sup>{'log₂ 3'}</sup>
                {') ≈ O(n'}
                <sup>{'1.585'}</sup>
                {')'}
              </strong>
              <strong>{tr('Auxiliary/output space: O(n)')}</strong>
              <p>{tr('Uses three recursive multiplications instead of four, giving a lower asymptotic cost than the grade-school method.')}</p>
            </Panel>
          </div>
        </div>
      ) : tab === 'Learn' ? (
        <div className="kt-learning">
          <Panel title={tr('Four Products Become Three')} icon={<BookOpen />}>
            <p>
              {tr(
                'Split the magnitudes x = a·B + b and y = c·B + d, with B = 10^m. Ordinary expansion needs ac, ad, bc, and bd. Karatsuba computes only ac, bd, and (a+b)(c+d). Since (a+b)(c+d) − ac − bd = ad + bc, the cross term comes from additions and subtractions.',
              )}
            </p>
            <div className="kt-concepts">
              {[
                [
                  'Split',
                  'Use n = max(digits(x), digits(y)), m = floor(n/2), and B = 10^m. High parts use integer division by B; low parts use the remainder. Unequal inputs are conceptually padded with leading zeros.',
                ],
                [
                  'Recurse',
                  'Compute z0 = b·d, z1 = (a+b)(c+d), and z2 = a·c. A sum can have an extra digit; recurse on its actual size rather than assuming every child has n/2 digits.',
                ],
                [
                  'Combine',
                  'The middle coefficient is z1 − z2 − z0. Reconstruct z2·B² + middle·B + z0. For signed inputs, run the recurrence on magnitudes, then restore the product sign.',
                ],
              ].map(([title, text]) => (
                <article key={title}>
                  <h3>{tr(title)}</h3>
                  <p>{tr(text)}</p>
                </article>
              ))}
            </div>
          </Panel>
          <Panel title={tr('Worked Example: 1234 × 5678')} icon={<Lightbulb />}>
            <p>
              {tr(
                'Split 1234 = 12·100 + 34 and 5678 = 56·100 + 78. The three products are z0 = 34·78 = 2652, z1 = 46·134 = 6164, and z2 = 12·56 = 672. The cross coefficient is 6164 − 672 − 2652 = 2840. Recombine: 672·10000 + 2840·100 + 2652 = 7006652.',
              )}
            </p>
            <button
              onClick={() => {
                load('1234', '5678')
                setTab('Visualization')
              }}
            >
              {tr('Explore worked example')}
            </button>
          </Panel>
          <Panel title={tr('Why the Recursion Is Faster')} icon={<Check />}>
            <p>
              {tr(
                'For n-digit operands, the recurrence is T(n) = 3T(n/2) + O(n), up to rounding and carry digits. Thus T(n) = O(n^(log₂ 3)) ≈ O(n^1.585), improving on quadratic digit multiplication. Active copied operands and the recursion stack require O(n) auxiliary space. This teaching tool additionally stores the full call tree and playback frames.',
              )}
            </p>
            <p>
              {tr(
                'Inputs accept signed decimal integers with up to 24 digits each. BigInt preserves every product digit; fractions and exponent notation are rejected. The trace stops when either operand has one digit, including zero. Small-number overhead can make ordinary multiplication faster in practice.',
              )}
            </p>
          </Panel>
        </div>
      ) : tab === 'Code' ? (
        <Panel title={tr('Exact Integer Karatsuba Pseudocode')} icon={<Code2 />} className="kt-code">
          <pre>
            <code>{`karatsubaMagnitude(x, y):
  if x < 10 or y < 10: return x * y
  n = max(decimalDigits(x), decimalDigits(y))
  m = floor(n / 2)
  B = 10 ** m
  a, b = x // B, x % B
  c, d = y // B, y % B
  z0 = karatsubaMagnitude(b, d)
  z1 = karatsubaMagnitude(a + b, c + d)
  z2 = karatsubaMagnitude(a, c)
  return z2 * B * B + (z1 - z2 - z0) * B + z0

multiplySigned(x, y):
  magnitude = karatsubaMagnitude(abs(x), abs(y))
  return -magnitude if exactly one input is negative else magnitude`}</code>
          </pre>
          <p>
            {tr(
              'All operations in this lesson use exact integers. The visible fields remain text strings until decimal validation, so large inputs never pass through an imprecise floating-point conversion.',
            )}
          </p>
        </Panel>
      ) : tab === 'Practice' ? (
        <Panel title={tr('Predict the Missing Product')} icon={<Lightbulb />} className="kt-practice">
          <p>{tr(root.children ? `Predict z1 = (${root.a} + ${root.b}) × (${root.c} + ${root.d}).` : `Predict the direct product ${run.x} × ${run.y}.`)}</p>
          <input
            type="text"
            inputMode="numeric"
            aria-label={tr('Predicted Karatsuba product')}
            value={prediction}
            onChange={(e) => {
              setPrediction(e.target.value)
              setFeedback('')
            }}
          />
          <button
            className="kt-primary"
            onClick={() => {
              try {
                setFeedback(
                  parseKaratsubaInteger(prediction, 48) === (root.children ? root.z1 : run.result)
                    ? root.children
                      ? 'Correct! The sum product supplies the cross term after subtracting z0 and z2.'
                      : 'Correct! This base case uses direct multiplication.'
                    : 'Try again. Add the two parts of each operand, then multiply those sums.',
                )
              } catch {
                setFeedback('Enter a whole decimal integer for your prediction.')
              }
            }}
          >
            {tr('Check prediction')}
          </button>
          {feedback && <p role="status">{tr(feedback)}</p>}
          <p>{tr('For the default input, z1 has a three-digit second operand: 46 × 134. The high/low products alone cannot reconstruct the cross terms.')}</p>
        </Panel>
      ) : (
        <div className="kt-experiments">
          <Panel title={tr('Exact Product and Call-Tree Laboratory')} icon={<Settings />}>
            <div className="kt-lab-actions">
              {[
                ['Unequal lengths', '123', '45678'],
                ['Negative input', '-1234', '5678'],
                ['Leading zeros', '000012', '000034'],
                ['Zero input', '0', '5678'],
                ['Single-digit input', '7', '98765'],
                ['24-digit inputs', '999999999999999999999999', '999999999999999999999999'],
              ].map(([name, x, y]) => (
                <button key={name} onClick={() => preset(x, y)}>
                  {tr(name)}
                </button>
              ))}
            </div>
            <p>{tr(`Inputs: ${run.x} and ${run.y}. Exact result: ${run.result}.`)}</p>
            <label>
              {tr('Playback speed')}
              <select aria-label={tr('Karatsuba playback speed')} value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                <option value={700}>{tr('Normal')}</option>
                <option value={100}>{tr('Fast')}</option>
                <option value={1400}>{tr('Slow')}</option>
              </select>
            </label>
            <label>
              <input type="checkbox" checked={preview} onChange={(e) => setPreview(e.target.checked)} />
              {tr('Preview computed products')}
            </label>
            <div className="kt-lab-actions">
              <button
                onClick={() => {
                  setCursor(0)
                  setPlaying(false)
                  setPreview(false)
                }}
              >
                {tr('Jump to first split')}
              </button>
              <button
                disabled={cursor === 0}
                onClick={() => {
                  setCursor(Math.max(0, cursor - 1))
                  setPlaying(false)
                  setPreview(false)
                }}
              >
                {tr('Previous recursive event')}
              </button>
              <button
                disabled={run.frames.length === 1}
                onClick={() => {
                  if (cursor === run.frames.length - 1) setCursor(0)
                  setPreview(false)
                  setPlaying(!playing)
                }}
              >
                {playing ? <Pause size={17} /> : <Play size={17} />} {tr(playing ? 'Pause playback' : 'Auto multiply')}
              </button>
              <button
                onClick={() => {
                  setCursor(run.frames.length - 1)
                  setPlaying(false)
                  setPreview(false)
                }}
              >
                {tr('Jump to final product')}
              </button>
              <button onClick={() => setTab('Visualization')}>{tr('Return to multiplication diagram')}</button>
            </div>
            <p className="kt-run-summary" role="status">
              {tr(`Event ${cursor + 1} / ${run.frames.length}. Call ${frame.node}: ${currentCall.x} × ${currentCall.y}. ${frame.message}`)}
            </p>
            <p>{tr(`Recursive calls: ${run.nodes.length}. Root base B = ${root.base}. Cross coefficient = ${root.middle}.`)}</p>
            <div className="kt-call-buttons">
              {run.nodes.map((n) => (
                <button key={n.id} onClick={() => inspectCall(n)}>
                  {tr(`Call ${n.id}: ${short(n.x)} × ${short(n.y)}`)}
                </button>
              ))}
            </div>
          </Panel>
          <Panel title={tr('Your Karatsuba Notes')} icon={<BookOpen />}>
            <LanguageSelector />
            <label>
              {tr('Notes')}
              <textarea aria-label={tr('Karatsuba notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
            <button
              aria-label={tr('Toggle color theme')}
              onClick={() => {
                if (props.onToggleTheme) props.onToggleTheme()
                else setLocalTheme(theme === 'dark' ? 'light' : 'dark')
              }}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />} {tr('Toggle color theme')}
            </button>
          </Panel>
        </div>
      )}
      <dialog
        ref={dialog}
        className="kt-dialog"
        aria-label={tr(
          modal === 'product' ? 'Inspect Karatsuba product' : modal === 'call' ? 'Inspect Karatsuba recursive call' : 'Karatsuba result and recombination',
        )}
        onCancel={() => setModal(null)}
      >
        <button className="kt-close" aria-label={tr('Close Karatsuba dialog')} onClick={() => setModal(null)}>
          <X />
        </button>
        {modal === 'product' ? (
          <>
            <h2>{tr(`Product z${product}`)}</h2>
            {child ? (
              <>
                <p>{`${expressions[product]} = ${products[product]}`}</p>
                <p>
                  {tr(
                    product === 0
                      ? 'The low product contributes to the units and lower decimal positions.'
                      : product === 2
                        ? 'The high product is shifted left by 2m decimal digits.'
                        : 'Subtract z0 and z2 from this sum product to recover the cross coefficient ad + bc.',
                  )}
                </p>
                <div className="kt-lab-actions">
                  <button onClick={() => inspectCall(child)}>{tr('Inspect this recursive call')}</button>
                  <button
                    onClick={() => {
                      setCursor(run.frames.findIndex((f) => f.node === 'P' && f.kind === ['low', 'sum', 'high'][product]))
                      setPreview(false)
                      setModal(null)
                    }}
                  >
                    {tr('Show product return')}
                  </button>
                </div>
              </>
            ) : (
              <p>{tr('This input is a base case; no separate recursive products are computed.')}</p>
            )}
          </>
        ) : modal === 'call' ? (
          <>
            <h2>{tr(`Recursive Call ${call.id}`)}</h2>
            <p>{`${call.x} × ${call.y} = ${call.result}`}</p>
            <p>{tr(`Digits n = ${call.n}. Low-part digits m = ${call.m}.`)}</p>
            {call.children ? (
              <>
                <p>{tr(`Split: a = ${call.a}, b = ${call.b}, c = ${call.c}, d = ${call.d}, B = ${call.base}.`)}</p>
                <p>{tr(`z0 = ${call.z0}, z1 = ${call.z1}, z2 = ${call.z2}. Cross coefficient = ${call.middle}.`)}</p>
                <div className="kt-lab-actions">
                  {call.children.map((n) => (
                    <button key={n.id} onClick={() => inspectCall(n)}>
                      {tr(`Open call ${n.id}`)}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p>{tr('Base case: an operand has one digit. Multiply directly.')}</p>
            )}
            <button
              onClick={() => {
                setCursor(run.frames.findIndex((f) => f.node === call.id))
                setPreview(false)
                setModal(null)
              }}
            >
              {tr('Show this recursive event')}
            </button>
            {call.id !== 'P' && <button onClick={() => inspectCall(run.nodes.find((n) => n.id === call.id.slice(0, -1))!)}>{tr('Inspect parent call')}</button>}
          </>
        ) : (
          <>
            <h2>{tr('Exact Karatsuba Recombination')}</h2>
            <p className="kt-exact-product">{resultText}</p>
            {root.children && (
              <>
                <p>{tr(`z1 − z2 − z0 = ${root.z1} − ${root.z2} − ${root.z0} = ${root.middle}.`)}</p>
                <p>{`${root.z2} × ${root.base * root.base} + ${root.middle} × ${root.base} + ${root.z0} = ${root.result}`}</p>
              </>
            )}
            {run.sign < 0n && <p>{tr('The input signs differ, so the magnitude receives a negative sign.')}</p>}
            <button
              onClick={() => {
                setCursor(0)
                setPreview(false)
                setModal(null)
                setTab('Visualization')
              }}
            >
              {tr('Replay Karatsuba trace')}
            </button>
          </>
        )}
      </dialog>
    </div>
  )
}
