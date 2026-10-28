// @localized-render
import { useEffect, useId, useState, type ReactNode } from 'react'
import { CheckCircle2, ClipboardList, Clock3, Layers3, Play, Pause, RotateCcw, Settings, Sigma, Timer } from 'lucide-react'
import { LanguageSelector } from '../i18n/LanguageSelector'
import { tx, useLocaleRender } from '../i18n/render'
import { usePersistentState, persistentString } from '../hooks/usePersistentState'
import { MockupLessonChrome, MockupTabs, type MockupPageProps, type MockupTab } from './MockupLessonChrome'
import {
  strassenMultiply,
  strassenExampleA,
  strassenExampleB,
  strassenProductFormulas,
  strassenCombineFormulas,
  matrixQuadrants,
  type Matrix,
  type StrassenNode,
} from './strassenModel'
import source from './strassenModel.ts?raw'
import './strassen-mockup.css'

const tr = (s: string) => tx(s, 'studios')
const sub = ['₁₁', '₁₂', '₂₁', '₂₂']
const fmt = (n: number) => Number(n.toPrecision(9)).toString()
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
    <section className={`mom-panel sm-panel ${className}`}>
      <header>
        <span className="sm-icon">{icon}</span>
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
  const id = useId()
  return (
    <svg className="sm-hero-art" viewBox="0 0 290 130" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-left`} x2=".3" y2="1">
          <stop stopColor="#a2e9ff" />
          <stop offset=".48" stopColor="#6952ff" />
          <stop offset="1" stopColor="#4e11e5" />
        </linearGradient>
        <linearGradient id={`${id}-right`} x2="0" y2="1">
          <stop stopColor="#87d6ff" />
          <stop offset=".5" stopColor="#7541f7" />
          <stop offset="1" stopColor="#5c20e8" />
        </linearGradient>
        <linearGradient id={`${id}-top`} x2=".5" y2="1">
          <stop stopColor="#e7fbff" />
          <stop offset="1" stopColor="#9edaff" />
        </linearGradient>
      </defs>
      <path
        d="M5 20H280M5 40H280M5 60H280M5 80H280M5 100H280M30 0V130M55 0V130M80 0V130M105 0V130M130 0V130M155 0V130M180 0V130M205 0V130M230 0V130M255 0V130"
        stroke="#e3efff"
        opacity=".35"
      />
      <g stroke="#ddf4ff" strokeWidth="1">
        <path d="M90 30L140 59V126L90 97Z" fill={`url(#${id}-left)`} />
        <path d="M140 59L190 30V97L140 126Z" fill={`url(#${id}-right)`} />
        <path d="M90 30L140 3L190 30L140 59Z" fill={`url(#${id}-top)`} />
        <path d="M115 16.5L165 44.5V111.5M165 16.5L115 44.5V111.5M90 63.5L140 92.5L190 63.5" fill="none" />
      </g>
      <path d="M16 65L40 51L64 65V104L40 118L16 104Z" fill="#9ce6ff" opacity=".8" stroke="#fff" />
      <path d="M16 65L40 79L64 65M40 79V118M16 85L40 99L64 85" stroke="white" fill="none" />
      <g transform="translate(-6 4)">
        <path d="M206 111L220 91L233 111L246 78L260 92L269 53" fill="none" stroke="#b9caff" strokeWidth="2" />
        {[
          [206, 111],
          [220, 91],
          [233, 111],
          [246, 78],
          [260, 92],
          [269, 53],
        ].map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r="4" fill="#9ab9ff" />
        ))}
      </g>
    </svg>
  )
}
function StrassenBars() {
  return (
    <svg viewBox="0 0 28 28" fill="currentColor" aria-hidden="true">
      <rect x="3" y="15" width="5" height="11" rx="1.5" opacity=".65" />
      <rect x="10" y="8" width="5" height="18" rx="1.5" opacity=".85" />
      <rect x="17" y="2" width="5" height="24" rx="1.5" />
    </svg>
  )
}
function MatrixEntry({ value, label, onCommit }: { value: number; label: string; onCommit: (value: string) => void }) {
  const [draft, setDraft] = useState(String(value))
  return (
    <input
      key={value}
      type="number"
      step="any"
      aria-label={label}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        onCommit(draft)
        setDraft(String(value))
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
      }}
    />
  )
}
function MatrixView({
  matrix,
  label,
  editable,
  onEdit,
}: {
  matrix: Matrix
  label?: string
  editable?: boolean
  onEdit?: (i: number, j: number, value: string) => void
}) {
  return (
    <div className="sm-matrix" dir="ltr">
      {label && <b>{label} =</b>}
      <div className="sm-matrix-values" style={{ gridTemplateColumns: `repeat(${matrix.length}, minmax(0,1fr))` }}>
        {matrix.flatMap((r, i) =>
          r.map((v, j) =>
            editable ? (
              <MatrixEntry
                key={`${i}-${j}-${v}`}
                label={tr(`Matrix ${label} row ${i + 1} column ${j + 1}`)}
                value={v}
                onCommit={(value) => onEdit?.(i, j, value)}
              />
            ) : (
              <span key={`${i}-${j}`}>{fmt(v)}</span>
            ),
          ),
        )}
      </div>
    </div>
  )
}
function BlockDiagram({ name, tone, onSelect, selected }: { name: string; tone: string; onSelect?: (i: number) => void; selected?: number }) {
  return (
    <div className={`sm-block-diagram ${tone}`}>
      <h3>{tr(name === 'C' ? 'Result Matrix C (n × n)' : `Matrix ${name} (n × n)`)}</h3>
      <div className="sm-block-body">
        <div className="sm-column-brackets">
          <span>{tr('n/2')}</span>
          <span>{tr('n/2')}</span>
        </div>
        <div className="sm-row-brackets">
          <span>{tr('n/2')}</span>
          <span>{tr('n/2')}</span>
        </div>
        <div className="sm-blocks">
          {sub.map((s, i) => (
            <button key={s} aria-label={tr(`Inspect ${name}${s}`)} aria-pressed={selected === i} onClick={() => onSelect?.(i)}>
              {name}
              <sub>{['11', '12', '21', '22'][i]}</sub>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
function PerformanceChart() {
  const [inspected, setInspected] = useState<{ n: number; exponent: number }>()
  const sizes = [16, 32, 64, 128, 256, 512, 1024, 2048],
    x = (i: number) => 90 + (i * 466) / 7,
    y = (n: number, p: number) => 126 - Math.log10(n ** p) * 9.4
  return (
    <div className="sm-chart" onMouseLeave={() => setInspected(undefined)}>
      <div className="sm-chart-legend">
        <span>
          <i />
          {tr('Classical O(n³)')}
        </span>
        <span>
          <i />
          {tr('Strassen O(n^2.807)')}
        </span>
      </div>
      <svg viewBox="0 0 575 175" role="img" aria-label={tr('Theoretical operation growth on a logarithmic scale')} preserveAspectRatio="none">
        {[0, 3, 6, 9, 12].map((k) => (
          <g key={k}>
            <path d={`M70 ${126 - k * 9.4}H556`} stroke="#e4ebf6" />
            <text x="61" y={130 - k * 9.4} textAnchor="end">
              {k === 0 ? '10⁰' : `10${['', '', '', '³', '', '', '⁶', '', '', '⁹', '', '', '¹²'][k]}`}
            </text>
          </g>
        ))}
        {sizes.map((n, i) => (
          <g key={n}>
            <path d={`M${x(i)} 13V126`} stroke="#e9eef7" />
            <text x={x(i)} y="143" textAnchor="middle">
              {n === 2048 ? '' : n}
            </text>
          </g>
        ))}
        {[3, Math.log2(7)].map((p, i) => (
          <g key={p}>
            {i === 1 && (
              <polygon points={`${x(0)},126 ${sizes.map((n, j) => `${x(j)},${y(n, p)}`).join(' ')} ${x(sizes.length - 1)},126`} fill="#ff4267" opacity=".06" />
            )}
            <polyline points={sizes.map((n, j) => `${x(j)},${y(n, p)}`).join(' ')} fill="none" stroke={i ? '#ff4267' : '#0878ff'} strokeWidth="1.7" />
            {sizes.map((n, j) => (
              <circle
                key={n}
                cx={x(j)}
                cy={y(n, p)}
                r="3.4"
                fill={i ? '#ff4267' : '#0878ff'}
                tabIndex={0}
                role="button"
                aria-label={tr(`${i ? 'Strassen' : 'Classical'} growth at n = ${n}`)}
                onFocus={() => setInspected({ n, exponent: p })}
                onMouseEnter={() => setInspected({ n, exponent: p })}
                onClick={() => setInspected({ n, exponent: p })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setInspected({ n, exponent: p })
                  }
                }}
              >
                <title>{`${i ? 'Strassen' : 'Classical'}: n = ${n}, n^${p.toFixed(3)} = ${fmt(n ** p)}`}</title>
              </circle>
            ))}
          </g>
        ))}
        <text x="300" y="167" textAnchor="middle">
          {tr('Matrix size n')}
        </text>
        <text transform="translate(13 76) rotate(-90)" textAnchor="middle">
          {tr('Operations (log scale)')}
        </text>
      </svg>
      {inspected && (
        <output className="sm-chart-inspection" role="status">
          {'n = '}
          {inspected.n} · {tr(inspected.exponent === 3 ? 'Classical' : 'Strassen')} = {fmt(inspected.n ** inspected.exponent)} {tr('normalized operations')}
        </output>
      )}
    </div>
  )
}
function productExpressions(a: Matrix, b: Matrix) {
  const [[aa, ab], [ac, ad]] = a,
    [[ba, bb], [bc, bd]] = b
  const f = fmt
  return [
    `(${f(aa)}+${f(ad)})(${f(ba)}+${f(bd)})`,
    `(${f(ac)}+${f(ad)})${f(ba)}`,
    `${f(aa)}(${f(bb)}−${f(bd)})`,
    `${f(ad)}(${f(bc)}−${f(ba)})`,
    `(${f(aa)}+${f(ab)})${f(bd)}`,
    `(${f(ac)}−${f(aa)})(${f(ba)}+${f(bb)})`,
    `(${f(ab)}−${f(ad)})(${f(bc)}+${f(bd)})`,
  ]
}
export function StrassenMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const [tab, setTab] = useState<MockupTab>('Learn'),
    [a, setA] = useState(strassenExampleA),
    [b, setB] = useState(strassenExampleB)
  const [run, setRun] = useState(() => strassenMultiply(strassenExampleA, strassenExampleB)),
    [nodePath, setNodePath] = useState<number[]>([])
  const [step, setStep] = useState(0),
    [playing, setPlaying] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('')
  const [bulkA, setBulkA] = useState(JSON.stringify(strassenExampleA)),
    [bulkB, setBulkB] = useState(JSON.stringify(strassenExampleB))
  const [prediction, setPrediction] = useState(''),
    [feedback, setFeedback] = useState(''),
    [block, setBlock] = useState<number>()
  const [notes, setNotes] = usePersistentState('strassen-mockup-notes', '', persistentString)
  let node: StrassenNode = run
  for (const i of nodePath) node = node.children[i]
  const maxStep = node.products.length ? 12 : 1
  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(
      () =>
        setStep((s) => {
          if (s >= maxStep) {
            setPlaying(false)
            return s
          }
          return s + 1
        }),
      900,
    )
    return () => window.clearInterval(timer)
  }, [playing, maxStep])
  function changeTab(next: MockupTab) {
    setTab(next)
    setPlaying(false)
    setNotice('')
  }
  function apply(nextA: unknown, nextB: unknown) {
    try {
      const next = strassenMultiply(nextA as Matrix, nextB as Matrix)
      setA(next.a)
      setB(next.b)
      setRun(next)
      setBulkA(JSON.stringify(next.a))
      setBulkB(JSON.stringify(next.b))
      setNodePath([])
      setStep(0)
      setPlaying(false)
      setError('')
      setFeedback('')
      setBlock(undefined)
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid matrices.')
      return false
    }
  }
  function edit(which: 'A' | 'B', i: number, j: number, value: string) {
    if (value.trim() === '') {
      setError('Enter a finite number in every matrix cell.')
      return
    }
    const matrix = (which === 'A' ? a : b).map((r, ri) => r.map((v, cj) => (ri === i && cj === j ? Number(value) : v)))
    apply(which === 'A' ? matrix : a, which === 'B' ? matrix : b)
  }
  function selectStep(s: number) {
    setStep(Math.min(maxStep, Math.max(0, s)))
    setPlaying(false)
  }
  function exportRun() {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ a: run.a, b: run.b, result: run.result, trace: run }, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'strassen-experiment.json'
    link.click()
    URL.revokeObjectURL(url)
  }
  const products = node.products,
    resultBlocks = products.length ? matrixQuadrants(node.result) : [node.result]
  const worked = run.a.length === 2 ? run : strassenMultiply(strassenExampleA, strassenExampleB)
  const workedProducts = worked.products.map((m) => m[0][0]),
    expressions = productExpressions(worked.a, worked.b)
  const message = !node.products.length
    ? step === 0
      ? 'Base case: multiply the two scalar entries directly.'
      : 'The scalar product is complete.'
    : step === 0
      ? 'Split A and B into four equal blocks.'
      : step <= 7 && products.length
        ? `Compute M${step}: ${strassenProductFormulas[step - 1]}`
        : step <= 11 && products.length
          ? `Combine C${sub[step - 8]} = ${strassenCombineFormulas[step - 8]}`
          : 'The product matrix is complete.'
  return (
    <div className="mom-page strassen-page target-visual" data-target="15">
      <MockupLessonChrome
        {...props}
        showLanguage={false}
        title={tr('Strassen Matrix Multiplication')}
        description={tr('Multiply blocks with seven recursive products and achieve sub-cubic time complexity.')}
        onStart={() => changeTab('Visualization')}
        decoration={<HeroArt />}
        badges={
          <>
            <span>{tr('O(n^log₂7) ≈ O(n^2.807)')}</span>
            <span>
              <Clock3 />
              {tr('Divide and Conquer')}
            </span>
            <span>
              <Timer />
              {tr('7 recursive multiplications')}
            </span>
          </>
        }
      />
      <MockupTabs active={tab} onChange={changeTab} />
      {error && (
        <p className="sm-error" role="alert">
          {tr(error)}
        </p>
      )}
      {(tab === 'Learn' || tab === 'Visualization') && (
        <>
          {tab === 'Visualization' && (
            <Panel
              className="sm-lab"
              title={tr('Interactive Strassen laboratory')}
              description="Edit square matrices, inspect recursive calls and predict the next product."
              icon={<Play />}
            >
              <div className="sm-editors">
                <label>
                  {tr('Matrix A (JSON)')}
                  <textarea aria-label={tr('Matrix A JSON')} rows={3} value={bulkA} onChange={(e) => setBulkA(e.target.value)} />
                </label>
                <label>
                  {tr('Matrix B (JSON)')}
                  <textarea aria-label={tr('Matrix B JSON')} rows={3} value={bulkB} onChange={(e) => setBulkB(e.target.value)} />
                </label>
              </div>
              <div className="sm-toolbar">
                <button
                  onClick={() => {
                    try {
                      apply(JSON.parse(bulkA), JSON.parse(bulkB))
                    } catch {
                      setError('Enter valid JSON arrays for both matrices.')
                    }
                  }}
                >
                  {tr('Apply matrices')}
                </button>
                <button disabled={step === 0} aria-label={tr('Step back')} onClick={() => selectStep(step - 1)}>
                  ←
                </button>
                <button aria-label={tr('Step forward')} disabled={step === maxStep} onClick={() => selectStep(step + 1)}>
                  →
                </button>
                <button
                  onClick={() => {
                    if (step === maxStep) setStep(0)
                    setPlaying(!playing)
                  }}
                >
                  {playing ? <Pause size={15} /> : <Play size={15} />} {tr(playing ? 'Pause' : 'Auto Run')}
                </button>
                <button
                  onClick={() => {
                    setStep(0)
                    setPlaying(false)
                  }}
                >
                  <RotateCcw size={15} />
                  {tr('Reset steps')}
                </button>
                <button onClick={() => apply(strassenExampleA, strassenExampleB)}>{tr('Reference example')}</button>
              </div>
              <p role="status">
                {tr('Step ')}
                {step}/{maxStep} · {tr(message)}
              </p>
              <div className="sm-recursive-path">
                <button
                  disabled={!nodePath.length}
                  onClick={() => {
                    setNodePath(nodePath.slice(0, -1))
                    selectStep(0)
                  }}
                >
                  {tr('Parent call')}
                </button>
                <b>
                  {node.id} · {node.a.length} × {node.a.length}
                </b>
                {node.children.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setNodePath([...nodePath, i])
                      selectStep(0)
                    }}
                  >
                    {tr('Inspect recursive product ')}
                    {'M'}
                    {i + 1}
                  </button>
                ))}
              </div>
              <div className="sm-call-matrices">
                <MatrixView matrix={node.a} label="A" />
                <span>×</span>
                <MatrixView matrix={node.b} label="B" />
                <span>=</span>
                <MatrixView matrix={node.result} label="C" />
              </div>
            </Panel>
          )}
          <div className="sm-top-grid">
            <Panel
              className="sm-decomposition"
              title={tr('Matrix Block Decomposition')}
              description="Split matrices A and B into four equal submatrices and compute seven products."
              icon={<Layers3 />}
            >
              <div className="sm-decomposition-body">
                <BlockDiagram
                  name="A"
                  tone="blue"
                  onSelect={(i) => {
                    setBlock(i)
                    setNotice(`A${sub[i]} is the ${['top-left', 'top-right', 'bottom-left', 'bottom-right'][i]} input block.`)
                  }}
                />
                <span className="sm-times">×</span>
                <BlockDiagram
                  name="B"
                  tone="green"
                  onSelect={(i) => {
                    setBlock(i)
                    setNotice(`B${sub[i]} is the ${['top-left', 'top-right', 'bottom-left', 'bottom-right'][i]} input block.`)
                  }}
                />
              </div>
            </Panel>
            <Panel className="sm-products" title={tr('Seven Recursive Products')} description="Compute only 7 products instead of 8." icon={<Settings />}>
              <div className="sm-product-list">
                {strassenProductFormulas.map((formula, i) => (
                  <button
                    className={`sm-product sm-tone-${i + 1}`}
                    key={formula}
                    aria-label={tr(`Inspect product M${i + 1}`)}
                    aria-pressed={step === i + 1}
                    onClick={() => {
                      selectStep(i + 1)
                      setNotice(`M${i + 1} = ${formula}`)
                    }}
                  >
                    <b>
                      {'M'}
                      {i + 1}
                    </b>
                    <span>{formula}</span>
                  </button>
                ))}
              </div>
            </Panel>
            <Panel className="sm-combine" title={tr('Combine to Get Result')} description="Construct the result matrix blocks from M1 … M7." icon={<Sigma />}>
              <div className="sm-combine-grid">
                {strassenCombineFormulas.map((f, i) => (
                  <button
                    key={f}
                    className={`sm-result-${i}`}
                    aria-pressed={step === i + 8}
                    onClick={() => {
                      selectStep(i + 8)
                      setBlock(i)
                      setNotice(`C${sub[i]} = ${f}`)
                    }}
                  >
                    {'C'}
                    <sub>{['11', '12', '21', '22'][i]}</sub> = <i>{f}</i>
                  </button>
                ))}
              </div>
              <BlockDiagram
                name="C"
                tone="pink"
                selected={block}
                onSelect={(i) => {
                  setBlock(i)
                  selectStep(i + 8)
                  setNotice(`C${sub[i]} = ${strassenCombineFormulas[i]}`)
                }}
              />
            </Panel>
          </div>
          {notice && (
            <div className="sm-inspection" role="status">
              {tr(notice)}
              <button onClick={() => setNotice('')}>{tr('Close')}</button>
              {products.length > 0 && step >= 1 && step <= 7 && <MatrixView matrix={products[step - 1]} label={`M${step}`} />}
              {step >= 8 && step <= 11 && resultBlocks[step - 8] && <MatrixView matrix={resultBlocks[step - 8]} label={`C${sub[step - 8]}`} />}
            </div>
          )}
          <div className="sm-middle-grid">
            <Panel
              className="sm-worked"
              title={tr('Worked Example (2 × 2 Matrices)')}
              description="Illustrate Strassen’s method with 2 × 2 matrices (base case)."
              icon={<ClipboardList />}
            >
              <div className="sm-example-top">
                <div className="sm-example-inputs">
                  <MatrixView matrix={worked.a} label="A" editable={run.a.length === 2} onEdit={(i, j, v) => edit('A', i, j, v)} />
                  <MatrixView matrix={worked.b} label="B" editable={run.a.length === 2} onEdit={(i, j, v) => edit('B', i, j, v)} />
                </div>
                <div className="sm-worked-products">
                  <h3>{tr('Seven products')}</h3>
                  <div>
                    {workedProducts.map((v, i) => (
                      <button
                        className={`sm-product sm-tone-${i + 1}`}
                        key={i}
                        onClick={() => {
                          selectStep(i + 1)
                          setNotice(`M${i + 1} = ${expressions[i]} = ${fmt(v)}`)
                        }}
                      >
                        <b>
                          {'M'}
                          {i + 1}
                        </b>
                        <span>
                          {expressions[i]} = {fmt(v)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="sm-example-bottom">
                <div className="sm-worked-blocks">
                  <h3>{tr('Result blocks')}</h3>
                  <div>
                    {worked.result.flat().map((v, i) => (
                      <div key={i} className={`sm-result-${i}`}>
                        <span>
                          {'C'}
                          {sub[i]} ={' '}
                          {i === 0
                            ? `${fmt(workedProducts[0])} ${workedProducts[3] < 0 ? '−' : '+'} ${fmt(Math.abs(workedProducts[3]))} − ${fmt(workedProducts[4])} ${workedProducts[6] < 0 ? '−' : '+'} ${fmt(Math.abs(workedProducts[6]))}`
                            : i === 1
                              ? `${fmt(workedProducts[2])} + ${fmt(workedProducts[4])}`
                              : i === 2
                                ? `${fmt(workedProducts[1])} + (${fmt(workedProducts[3])})`
                                : `${fmt(workedProducts[0])} − ${fmt(workedProducts[1])} + ${fmt(workedProducts[2])} + ${fmt(workedProducts[5])}`}
                        </span>
                        <b>= {fmt(v)}</b>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="sm-final">
                  <h3>{tr('Final Matrix')}</h3>
                  <MatrixView matrix={worked.result} label="C" />
                </div>
              </div>
            </Panel>
            <Panel
              className="sm-performance"
              title={tr('Performance Comparison')}
              description="Strassen’s algorithm has lower asymptotic complexity than classical multiplication."
              icon={<StrassenBars />}
            >
              <PerformanceChart />
            </Panel>
          </div>
          <div className="sm-bottom-grid">
            <Panel title={tr('Correctness')} icon={<CheckCircle2 />} className="sm-correctness">
              <p>
                {tr(
                  'Expanding the seven products algebraically yields AE + BG, AF + BH, CE + DG and CF + DH. Induction proves each block product and hence the full matrix product.',
                )}
              </p>
            </Panel>
            <Panel title={tr('Complexity Analysis')} icon={<StrassenBars />}>
              <p>
                <b>{tr('Time: O(n^log₂7) ≈ O(n^2.807)')}</b>
                <br />
                <b>{tr('Auxiliary/output space: O(n²)')}</b>
                <br />
                {tr('T(n) = 7T(n/2) + O(n²), by Master Theorem. Active blocks form a geometric O(n²) space sum.')}
              </p>
            </Panel>
            <Panel title={tr('Assumptions and Constraints')} icon={<ClipboardList />}>
              <ul>
                <li>{tr('Input matrices are square and of size n × n (n is a power of 2).')}</li>
                <li>{tr('Entries can be integers or real numbers.')}</li>
                <li>{tr('This lab accepts sizes 1, 2, 4 or 8 and entries from −1000 to 1000.')}</li>
                <li>{tr('Floating-point rounding may differ from classical multiplication.')}</li>
                <li>{tr('Small matrices often run faster with classical multiplication.')}</li>
              </ul>
            </Panel>
          </div>
          <details className="sm-theory">
            <summary>{tr('Understand why seven products are enough')}</summary>
            <p>
              {tr(
                'Classical block multiplication uses eight recursive multiplications: C₁₁ = A₁₁B₁₁ + A₁₂B₂₁, and similarly for the other three blocks. Strassen trades one multiplication for extra additions and subtractions. Expand M₁ + M₄ − M₅ + M₇: all unwanted cross terms cancel, leaving A₁₁B₁₁ + A₁₂B₂₁. The same cancellation establishes the remaining blocks. Recursing on blocks of half the side length gives seven subproblems and quadratic work per call.',
              )}
            </p>
            <p>
              {tr(
                'The chart compares n³ with n^log₂7, using normalized theoretical growth. It does not measure runtime or predict a practical crossover. Production implementations usually switch to a classical kernel below a threshold and pad arbitrary sizes with zeroes. The O(n²) space bound describes sequential Strassen with released temporary blocks. This teaching model retains the entire recursion tree for inspection, using O(n^log₂7) trace storage.',
              )}
            </p>
          </details>
        </>
      )}
      {tab === 'Code' && (
        <Panel title={tr('Strassen implementation')} description="The visualization executes this recursive TypeScript model." icon={<ClipboardList />}>
          <pre className="sm-source">
            <code>{source}</code>
          </pre>
        </Panel>
      )}
      {tab === 'Practice' && (
        <Panel
          className="sm-extra"
          title={tr('Predict the next product')}
          description="Use the current matrix entries to calculate M1 before checking."
          icon={<Settings />}
        >
          <div className="sm-call-matrices">
            <MatrixView matrix={run.a} label="A" />
            <MatrixView matrix={run.b} label="B" />
          </div>
          <p>{tr('M₁ = (A₁₁ + A₂₂)(B₁₁ + B₂₂). For a 2 × 2 input, what scalar value does M₁ have?')}</p>
          {run.a.length === 2 ? (
            <>
              <label>
                {tr('Your prediction')}
                <input
                  type="number"
                  step="any"
                  aria-label={tr('Strassen predicted M1')}
                  value={prediction}
                  onChange={(e) => {
                    setPrediction(e.target.value)
                    setFeedback('')
                  }}
                />
              </label>
              <button
                onClick={() =>
                  setFeedback(
                    prediction.trim() !== '' && Number(prediction) === run.products[0][0][0]
                      ? `Correct! M1 = ${fmt(run.products[0][0][0])}.`
                      : 'Not yet. Add the diagonal entries in A and B, then multiply those sums.',
                  )
                }
              >
                {tr('Check prediction')}
              </button>
              {feedback && <p role="status">{tr(feedback)}</p>}
            </>
          ) : (
            <p>{tr('Load the reference 2 × 2 example in Visualization to try this scalar challenge.')}</p>
          )}
        </Panel>
      )}
      {tab === 'Experiments' && (
        <Panel
          className="sm-extra"
          title={tr('Compare and save experiments')}
          description="Try identity or zero matrices and inspect how products cancel."
          icon={<StrassenBars />}
        >
          <div className="sm-toolbar">
            <button
              onClick={() => {
                const n = 4
                const identity = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)))
                apply(
                  identity,
                  Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i * n + j + 1)),
                )
                changeTab('Visualization')
              }}
            >
              {tr('4 × 4 identity example')}
            </button>
            <button
              onClick={() => {
                apply(
                  [
                    [0, 0],
                    [0, 0],
                  ],
                  strassenExampleB,
                )
                changeTab('Visualization')
              }}
            >
              {tr('Zero matrix example')}
            </button>
            <button
              onClick={() => {
                localStorage.setItem('strassen-saved-experiment', JSON.stringify({ a, b }))
                setNotice('Experiment saved in this browser.')
              }}
            >
              {tr('Save experiment')}
            </button>
            <button
              onClick={() => {
                try {
                  const saved = JSON.parse(localStorage.getItem('strassen-saved-experiment') ?? 'null')
                  if (!saved) throw new Error()
                  if (apply(saved.a, saved.b)) setNotice('Saved experiment loaded.')
                } catch {
                  setError('No valid saved experiment is available.')
                }
              }}
            >
              {tr('Load experiment')}
            </button>
            <button onClick={exportRun}>{tr('Export JSON')}</button>
          </div>
          <MatrixView matrix={run.result} label="C" />
          {notice && <p role="status">{tr(notice)}</p>}
        </Panel>
      )}
      {tab === 'Notes' && (
        <Panel className="sm-extra" title={tr('Your Strassen notes')} description="Saved automatically in this browser." icon={<ClipboardList />}>
          <LanguageSelector />
          <label>
            {tr('Explain the cancellation in C₁₁ in your own words.')}
            <textarea rows={10} aria-label={tr('Strassen notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
        </Panel>
      )}
    </div>
  )
}
