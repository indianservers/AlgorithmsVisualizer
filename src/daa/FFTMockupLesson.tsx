// @localized-render
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Bookmark,
  Check,
  Play,
  Pause,
  RotateCw,
  Waves,
  Activity,
  ChartNoAxesColumnIncreasing,
  FileText,
  Network,
  Settings,
  CheckCircle2,
  Lightbulb,
  X,
} from 'lucide-react'
import { AccountControl } from '../account/AccountControl'
import { LanguageSelector } from '../i18n/LanguageSelector'
import { allModules } from '../algorithms'
import { algorithmPath } from '../utils/routing'
import { tx, useLocaleRender } from '../i18n/render'
import { persistentString, usePersistentState } from '../hooks/usePersistentState'
import { MockupTabs, type MockupTab, type MockupPageProps } from './MockupLessonChrome'
import { fftExample, runFFTLesson, parseFFT, formatFFT, type FFTInput } from './fftLessonModel'
import './fft-mockup.css'
const tr = (s: string) => tx(s, 'studios'),
  tabs: MockupTab[] = ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments'],
  example = runFFTLesson(fftExample)
const draftOf = (input: FFTInput) => ({
  type: input.type,
  size: String(input.size),
  a1: Number.isInteger(input.a1) ? input.a1.toFixed(1) : String(input.a1),
  f1: String(input.f1),
  a2: String(input.a2),
  f2: String(input.f2),
  samples: input.samples?.join(', ') ?? '',
})
const short = (v: number) => (v !== 0 && Math.abs(v) < 1e-6 ? Number(v.toPrecision(4)).toString() : Number(v.toFixed(4)).toString())
function Panel({ title, icon, children, className = '' }: { title: string; icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`fft-panel ${className}`}>
      <header>
        <span className="fft-icon">{icon}</span>
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  )
}
export function FFTMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const navigate = useNavigate(),
    [tab, setTab] = useState<MockupTab>('Visualization'),
    [run, setRun] = useState(example),
    [draft, setDraft] = useState(draftOf(fftExample)),
    [cursor, setCursor] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(900),
    [showSpectrum, setShowSpectrum] = useState(true),
    [error, setError] = useState(''),
    [query, setQuery] = useState(''),
    [prediction, setPrediction] = useState(''),
    [feedback, setFeedback] = useState(''),
    [localTheme, setLocalTheme] = useState(() => localStorage.getItem('algodrishti-theme') ?? 'light'),
    [modal, setModal] = useState<{ type: 'sample' | 'bin' | 'node' | 'butterfly' | 'even' | 'odd'; index: number; column?: number } | null>(null),
    [notes, setNotes] = usePersistentState('algodrishti-fft-notes', '', persistentString),
    dialog = useRef<HTMLDialogElement>(null),
    search = useRef<HTMLInputElement>(null)
  const n = run.input.size,
    frame = run.frames[cursor],
    theme = props.theme ?? localTheme,
    topicText = query.trim().toLowerCase(),
    topicScore = (name: string) => (name.toLowerCase() === topicText ? 0 : name.toLowerCase().includes(topicText) ? 1 : 2),
    topics = topicText
      ? allModules
          .filter((m) => `${m.name} ${m.summary}`.toLowerCase().includes(topicText))
          .sort((a, b) => topicScore(a.name) - topicScore(b.name))
          .slice(0, 5)
      : [],
    sampleScale = Math.max(1, Math.ceil(Math.max(...run.samples.map(Math.abs)))),
    magnitudeScale = Math.max(1, Math.ceil(Math.max(...run.spectrum.map((p) => p.magnitude)) - 1e-9)),
    timeX = (i: number) => 61 + (i / (n - 1)) * 450,
    timeY = (v: number) => 70 - (v / sampleScale) * 55,
    freqX = (i: number) => 78 + (i / (n - 1)) * 381,
    freqY = (v: number) => 125 - (v / magnitudeScale) * 110,
    columns = [72, 184, ...Array.from({ length: Math.log2(n) }, (_, s) => (s === 0 ? 246 : 246 + s * (n === 8 ? 129 : 116)))],
    networkWidth = Math.max(574, columns.at(-1)! + 70),
    networkHeight = Math.max(211, n * 25 + 12),
    rowY = (i: number) => 17 + i * 25,
    hues = ['#0785ff', '#8438d5', '#ff9a00', '#16be8f', '#ff4265', '#9275eb', '#07a6bd'],
    stageNames = [tr('Input & Bit-Reverse Order'), ...run.frames.slice(1).map((f) => `${tr('Stage')} ${f.stage} (m = ${f.width})`)],
    stageDescriptions = [
      tr('Reorder input in bit-reversed order.'),
      ...run.frames
        .slice(1)
        .map((f) =>
          f.width === n ? `${tr('Compute final')} ${n}${tr('-point DFT.')}` : `${tr('Compute')} ${f.width}${tr('-point DFTs using twiddle factors.')}`,
        ),
    ],
    op = modal?.type === 'butterfly' ? run.operations[modal.index] : null,
    bin = modal?.type === 'bin' ? run.spectrum[modal.index] : null,
    nodeValue =
      modal?.type === 'node' ? (modal.column === 0 ? { re: run.samples[modal.index], im: 0 } : run.frames[(modal.column ?? 1) - 1].values[modal.index]) : null
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
  useEffect(() => {
    if (modal) dialog.current?.showModal()
    else dialog.current?.close()
  }, [modal])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        search.current?.focus()
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])
  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(
      () =>
        setCursor((c) => {
          if (c >= run.frames.length - 2) {
            setPlaying(false)
            return run.frames.length - 1
          }
          return c + 1
        }),
      speed,
    )
    return () => window.clearInterval(timer)
  }, [playing, run, speed])
  function edit(patch: Partial<typeof draft>) {
    setPlaying(false)
    setDraft((d) => ({ ...d, ...patch }))
    setError('')
  }
  function load(input: FFTInput, animate = false) {
    const next = runFFTLesson(input)
    setRun(next)
    setDraft(draftOf(input))
    setCursor(0)
    setPlaying(animate)
    setError('')
    setModal(null)
  }
  function apply(animate = false) {
    try {
      load(parseFFT(draft), animate)
    } catch (e) {
      setError((e as Error).message)
      setPlaying(false)
    }
  }
  function animate() {
    if (playing) {
      setPlaying(false)
      return
    }
    try {
      const input = parseFFT(draft)
      if (JSON.stringify(draftOf(input)) !== JSON.stringify(draftOf(run.input))) load(input, true)
      else {
        if (cursor === run.frames.length - 1) setCursor(0)
        setPlaying(true)
        setError('')
      }
    } catch (e) {
      setError((e as Error).message)
    }
  }
  function seek(i: number) {
    setPlaying(false)
    setCursor(i)
  }
  function changeTab(next: MockupTab) {
    setPlaying(false)
    setTab(next)
  }
  function inspect(type: NonNullable<typeof modal>['type'], index = 0, column?: number) {
    setPlaying(false)
    setModal({ type, index, column })
  }
  function keyAction(e: React.KeyboardEvent, action: () => void) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      action()
    }
  }
  const code = `// Forward, unnormalized DFT: X[k] = sum x[n] exp(-2πikn/N)
function fft(x) {
  const N = x.length;
  if (N === 1) return x;
  const E = fft(x.filter((_, i) => i % 2 === 0));
  const O = fft(x.filter((_, i) => i % 2 === 1));
  const X = Array(N);
  for (let k = 0; k < N / 2; k++) {
    const t = multiply(exp(-2 * Math.PI * k / N), O[k]);
    X[k] = add(E[k], t);
    X[k + N / 2] = subtract(E[k], t);
  }
  return X;
} // exp(θ) means cos(θ) + i sin(θ).`
  return (
    <div className="mom-page target-visual fft-page" data-target="43">
      <div className="fft-toolbar">
        <button className="fft-back" aria-label={tr('Return to reliability design')} onClick={() => navigate('/daa-extensions/reliability-design')}>
          <ArrowLeft size={18} />
        </button>
        <div className="fft-search">
          <Search size={19} />
          <input
            ref={search}
            aria-label={tr('Search algorithm topics')}
            placeholder={tr('Search topics, algorithms, or keywords...')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setQuery('')
              if (e.key === 'Enter' && topics[0]) navigate(algorithmPath(topics[0]))
            }}
          />
          <kbd>{'⌘ K'}</kbd>
          {query && (
            <div className="fft-search-results">
              {topics.length ? (
                topics.map((m) => (
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
        <button className="mom-study" aria-pressed={props.completed.includes(props.module.id)} onClick={() => props.toggleCompleted(props.module.id)}>
          {props.completed.includes(props.module.id) ? <Check size={16} /> : <Bookmark size={16} />}
          {tr(props.completed.includes(props.module.id) ? 'Studied' : 'Mark studied')}
        </button>
        <AccountControl showLanguage={false} />
      </div>
      <header className="fft-hero">
        <button className="fft-back" aria-label={tr('Back to DAA extensions')} onClick={() => navigate('/daa-extensions')}>
          <ArrowLeft size={23} />
        </button>
        <div>
          <div className="fft-title">
            <h1>{tr('FFT / Discrete Fourier Transform')}</h1>
            <span>{tr('Radix-2 FFT')}</span>
          </div>
          <p>{tr('Radix-2 FFT computes the forward DFT. Visualize the divide-and-conquer process, butterfly operations and frequency spectrum.')}</p>
        </div>
      </header>
      <MockupTabs tabs={tabs} active={tab} onChange={changeTab} />
      {tab === 'Visualization' && (
        <>
          <Panel title={tr('Signal Input')} icon={<Waves />} className={`fft-input ${draft.type === 'custom' ? 'fft-custom-input' : ''}`}>
            <div className="fft-controls">
              <label className="fft-type">
                {tr('Signal type')}
                <select aria-label={tr('Signal type')} value={draft.type} onChange={(e) => edit({ type: e.target.value as FFTInput['type'] })}>
                  <option value="sine">{tr('Sum of Sine Waves')}</option>
                  <option value="impulse">{tr('Unit Impulse')}</option>
                  <option value="constant">{tr('Constant / DC')}</option>
                  <option value="custom">{tr('Custom Samples')}</option>
                </select>
              </label>
              <fieldset>
                <legend>{tr('Parameters')}</legend>
                <div className="fft-parameters">
                  {draft.type !== 'custom' && (
                    <>
                      <label>
                        <i>{'A₁'}</i>
                        <input
                          aria-label={tr('First amplitude')}
                          type="number"
                          min="-10"
                          max="10"
                          step="0.1"
                          value={draft.a1}
                          onChange={(e) => edit({ a1: e.target.value })}
                        />
                      </label>
                      {draft.type === 'sine' && (
                        <>
                          <label>
                            <i>{'f₁'}</i>
                            <input
                              aria-label={tr('First frequency')}
                              type="number"
                              min="0"
                              max={Number(draft.size) / 2}
                              step="0.5"
                              value={draft.f1}
                              onChange={(e) => edit({ f1: e.target.value })}
                            />
                          </label>
                          <label>
                            <i>{'A₂'}</i>
                            <input
                              aria-label={tr('Second amplitude')}
                              type="number"
                              min="-10"
                              max="10"
                              step="0.1"
                              value={draft.a2}
                              onChange={(e) => edit({ a2: e.target.value })}
                            />
                          </label>
                          <label>
                            <i>{'f₂'}</i>
                            <input
                              aria-label={tr('Second frequency')}
                              type="number"
                              min="0"
                              max={Number(draft.size) / 2}
                              step="0.5"
                              value={draft.f2}
                              onChange={(e) => edit({ f2: e.target.value })}
                            />
                          </label>
                        </>
                      )}
                    </>
                  )}
                  {draft.type === 'custom' && <span>{tr('Real samples in time order')}</span>}
                  <label className="fft-size">
                    {tr('N (sample size)')}
                    <select aria-label={tr('Sample size')} value={draft.size} onChange={(e) => edit({ size: e.target.value })}>
                      {[2, 4, 8, 16, 32].map((size) => (
                        <option key={size}>{size}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </fieldset>
              <button className="fft-primary fft-animate" onClick={animate}>
                {playing ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
                {tr(playing ? 'Pause FFT' : cursor > 0 && cursor < run.frames.length - 1 ? 'Resume FFT' : 'Animate FFT')}
              </button>
              <button className="fft-spectrum-toggle" role="switch" aria-checked={showSpectrum} onClick={() => setShowSpectrum((v) => !v)}>
                <span />
                <span>{tr('Show spectrum')}</span>
              </button>
              <button
                className="fft-reset"
                onClick={() => {
                  setDraft(draftOf(run.input))
                  seek(0)
                  setError('')
                }}
              >
                <RotateCw size={23} />
                {tr('Reset')}
              </button>
            </div>
            {draft.type === 'custom' && (
              <label className="fft-custom-samples">
                {tr('Custom sample values')}
                <textarea
                  aria-label={tr('Custom sample values')}
                  value={draft.samples}
                  placeholder={tr('Enter comma or space separated samples')}
                  onChange={(e) => edit({ samples: e.target.value })}
                />
                <button onClick={() => apply()}>{tr('Apply samples')}</button>
              </label>
            )}
            {error && (
              <p role="alert" className="fft-error">
                {tr(error)}
              </p>
            )}
          </Panel>
          <div className="fft-chart-row">
            <Panel title={tr('Time-Domain Signal')} icon={<Activity />} className="fft-time">
              <span className="fft-math-heading">{'x[n]'}</span>
              <svg viewBox="0 0 530 180" aria-label={tr('Time-domain sample chart')} role="img">
                {[-2, -1, 0, 1, 2].map((t) => (
                  <g key={t}>
                    <line className="fft-grid" x1="61" x2="511" y1={70 - t * 27.5} y2={70 - t * 27.5} />
                    <text className="fft-tick" x="47" y={74 - t * 27.5} textAnchor="middle">
                      {short((t * sampleScale) / 2)}
                    </text>
                  </g>
                ))}
                {Array.from(
                  { length: n },
                  (_, i) =>
                    (n <= 8 || i % (n / 8) === 0 || i === n - 1) && (
                      <g key={i}>
                        <line className="fft-grid" x1={timeX(i)} x2={timeX(i)} y1="15" y2="125" />
                        <text className="fft-tick" x={timeX(i)} y="146" textAnchor="middle">
                          {i}
                        </text>
                      </g>
                    ),
                )}
                <path d={`M61,70 ${run.samples.map((v, i) => `L${timeX(i)},${timeY(v)}`).join(' ')} L511,70Z`} fill="url(#fft-time-gradient)" />
                <defs>
                  <linearGradient id="fft-time-gradient" x2="0" y2="1">
                    <stop stopColor="#258bff" stopOpacity=".16" />
                    <stop offset="1" stopColor="#258bff" stopOpacity=".015" />
                  </linearGradient>
                </defs>
                <line className="fft-axis" x1="61" x2="511" y1="125" y2="125" />
                <line className="fft-axis" x1="61" x2="61" y1="15" y2="125" />
                <polyline points={run.samples.map((v, i) => `${timeX(i)},${timeY(v)}`).join(' ')} fill="none" stroke="#0879ff" strokeWidth="1.7" />
                {run.samples.map((v, i) => (
                  <g
                    className="fft-chart-point"
                    key={i}
                    role="button"
                    tabIndex={0}
                    aria-label={`${tr('Inspect sample')} ${i}`}
                    onClick={() => inspect('sample', i)}
                    onKeyDown={(e) => keyAction(e, () => inspect('sample', i))}
                  >
                    <title>{`x[${i}] = ${short(v)}`}</title>
                    <circle cx={timeX(i)} cy={timeY(v)} r="12" fill="transparent" />
                    <circle cx={timeX(i)} cy={timeY(v)} r="4.2" fill="#0879ff" />
                  </g>
                ))}
                <text className="fft-axis-label" x="284" y="166" textAnchor="middle">
                  {'n '}
                  {tr('(sample index)')}
                </text>
                <text className="fft-axis-label" transform="translate(22 72) rotate(-90)" textAnchor="middle">
                  {tr('Amplitude')}
                </text>
              </svg>
            </Panel>
            <Panel title={tr('Frequency Spectrum')} icon={<ChartNoAxesColumnIncreasing />} className="fft-spectrum">
              <span className="fft-math-heading">{'|X[k]|'}</span>
              {showSpectrum ? (
                <svg viewBox="0 0 500 180" aria-label={tr('Full unnormalized frequency spectrum')} role="img">
                  {[0, 1, 2, 3, 4].map((t) => (
                    <g key={t}>
                      <line className="fft-grid" x1="65" x2="477" y1={125 - t * 27.5} y2={125 - t * 27.5} />
                      <text className="fft-tick" x="50" y={129 - t * 27.5} textAnchor="middle">
                        {short((t * magnitudeScale) / 4)}
                      </text>
                    </g>
                  ))}
                  {run.spectrum.map(
                    (p) =>
                      (n <= 8 || p.k % (n / 8) === 0 || p.k === n - 1) && (
                        <g key={p.k}>
                          <line className="fft-grid" x1={freqX(p.k)} x2={freqX(p.k)} y1="15" y2="125" />
                          <text className="fft-tick" x={freqX(p.k)} y="146" textAnchor="middle">
                            {p.k}
                          </text>
                        </g>
                      ),
                  )}
                  <line className="fft-axis" x1="65" x2="477" y1="125" y2="125" />
                  <line className="fft-axis" x1="65" x2="65" y1="15" y2="125" />
                  {run.spectrum.map((p) => (
                    <g
                      className="fft-bin"
                      key={p.k}
                      role="button"
                      tabIndex={0}
                      aria-label={`${tr('Inspect frequency bin')} ${p.k}`}
                      onClick={() => inspect('bin', p.k)}
                      onKeyDown={(e) => keyAction(e, () => inspect('bin', p.k))}
                    >
                      <title>{`X[${p.k}] = ${formatFFT(p.value)}; |X| = ${short(p.magnitude)}`}</title>
                      <rect x={freqX(p.k) - 7} y="10" width="14" height="123" fill="transparent" />
                      <line x1={freqX(p.k)} x2={freqX(p.k)} y1="125" y2={freqY(p.magnitude)} stroke="#8248ff" strokeWidth="1.7" />
                      <circle cx={freqX(p.k)} cy={freqY(p.magnitude)} r="4" fill="#8248ff" stroke="#6030d5" strokeWidth=".6" />
                    </g>
                  ))}
                  <text className="fft-axis-label" x="275" y="166" textAnchor="middle">
                    {'k '}
                    {tr('(frequency index)')}
                  </text>
                  <text className="fft-axis-label" transform="translate(22 72) rotate(-90)" textAnchor="middle">
                    {tr('Magnitude')}
                  </text>
                </svg>
              ) : (
                <div className="fft-spectrum-hidden">
                  <p>{tr('Spectrum hidden. Turn on Show spectrum to inspect all final frequency bins.')}</p>
                  <button onClick={() => setShowSpectrum(true)}>{tr('Show spectrum')}</button>
                </div>
              )}
            </Panel>
            <Panel title={tr('Signal Details')} icon={<FileText />} className="fft-details">
              <div className="fft-detail-box">
                <b>{tr('Signal:')}</b>
                <p className="fft-signal-formula">
                  {run.input.type === 'sine'
                    ? `x[n] = ${run.input.a1} · sin(2π · ${run.input.f1}n/${n}) + ${run.input.a2} · sin(2π · ${run.input.f2}n/${n})`
                    : run.input.type === 'impulse'
                      ? `x[0] = ${run.input.a1}; x[n > 0] = 0`
                      : run.input.type === 'constant'
                        ? `x[n] = ${run.input.a1}`
                        : `x = [${run.samples.map(short).join(', ')}]`}
                </p>
                <p>
                  <b>{tr('Sample size (N):')}</b> {n}
                </p>
                <p>
                  <b>{tr('Dominant frequencies:')}</b> {run.positive.length ? `k = ${run.positive.map((p) => p.k).join(', ')}` : tr('None (zero signal)')}
                </p>
                <p>
                  <b>{tr('Peak magnitudes:')}</b>{' '}
                  <span>
                    {[...run.positive]
                      .sort((a, b) => b.magnitude - a.magnitude)
                      .slice(0, 2)
                      .map((p) => `|X[${p.k}]| = ${short(p.magnitude)}`)
                      .join('   ') || '0'}
                  </span>
                </p>
              </div>
            </Panel>
          </div>
          <div className="fft-computation-row">
            <Panel title={`${tr('Radix-2 Butterfly Network')} (N = ${n})`} icon={<Network />} className="fft-network">
              <div className="fft-stage-pills">
                {run.frames.slice(1).map((f) => (
                  <button key={f.stage} aria-pressed={cursor === f.stage} onClick={() => seek(f.stage)}>
                    {tr('Stage')} {f.stage}
                    {' (m = '}
                    {f.width}
                    {')'}
                  </button>
                ))}
              </div>
              <div className="fft-network-scroll">
                <svg
                  width={networkWidth}
                  height={networkHeight}
                  viewBox={`0 0 ${networkWidth} ${networkHeight}`}
                  aria-label={tr('Bit reversal and radix-2 butterfly network')}
                  role="img"
                >
                  <defs>
                    {hues.map((color, i) => (
                      <marker key={color} id={`fft-arrow-${i}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L6,3 L0,6" fill={color} />
                      </marker>
                    ))}
                  </defs>
                  {columns.slice(1).map((x, c) => (
                    <line key={c} x1={x + (c === 0 ? 30 : 34)} x2={x + (c === 0 ? 30 : 34)} y1="0" y2={networkHeight} stroke="#e2eaf6" strokeDasharray="5 5" />
                  ))}
                  {run.reversal.map((original, i) => (
                    <line
                      key={`reverse-${i}`}
                      x1={columns[0] + 7}
                      x2={columns[1] - 8}
                      y1={rowY(original)}
                      y2={rowY(i)}
                      stroke={hues[0]}
                      strokeWidth="1.35"
                      markerEnd="url(#fft-arrow-0)"
                      opacity=".8"
                    />
                  ))}
                  {run.operations.map((b, index) => (
                    <g
                      key={index}
                      role="button"
                      tabIndex={0}
                      className={`fft-butterfly ${cursor === b.stage ? 'fft-active-butterfly' : ''}`}
                      aria-label={`${tr('Inspect butterfly stage')} ${b.stage}, ${tr('pair')} ${b.upper} ${b.lower}`}
                      onClick={() => inspect('butterfly', index)}
                      onKeyDown={(e) => keyAction(e, () => inspect('butterfly', index))}
                    >
                      <path
                        className="fft-wire-hit"
                        d={[b.upper, b.lower]
                          .flatMap((from) => [b.upper, b.lower].map((to) => `M${columns[b.stage] + 8},${rowY(from)} L${columns[b.stage + 1] - 9},${rowY(to)}`))
                          .join(' ')}
                        fill="none"
                        stroke="transparent"
                        strokeWidth="10"
                        pointerEvents="stroke"
                      />
                      {[b.upper, b.lower].flatMap((from) =>
                        [b.upper, b.lower].map((to) => (
                          <line
                            key={`${from}-${to}`}
                            x1={columns[b.stage] + 8}
                            x2={columns[b.stage + 1] - 9}
                            y1={rowY(from)}
                            y2={rowY(to)}
                            stroke={hues[(b.stage + 1) % hues.length]}
                            strokeWidth="1.2"
                            opacity=".8"
                            markerEnd={`url(#fft-arrow-${(b.stage + 1) % hues.length})`}
                          />
                        )),
                      )}
                    </g>
                  ))}
                  {columns.map((x, c) =>
                    Array.from({ length: n }, (_, i) => (
                      <g
                        key={`${c}-${i}`}
                        className="fft-node"
                        role="button"
                        tabIndex={0}
                        aria-label={`${tr('Inspect network column')} ${c}, ${tr('row')} ${i}`}
                        onClick={() => inspect('node', i, c)}
                        onKeyDown={(e) => keyAction(e, () => inspect('node', i, c))}
                      >
                        <title>{c === 0 ? `x[${i}] = ${short(run.samples[i])}` : formatFFT(run.frames[c - 1].values[i])}</title>
                        <circle cx={x} cy={rowY(i)} r="11" fill="transparent" />
                        <circle
                          cx={x}
                          cy={rowY(i)}
                          r="7"
                          fill={c === columns.length - 1 ? '#fff0f1' : `${hues[c % hues.length]}70`}
                          stroke={hues[c % hues.length]}
                          strokeWidth="1.5"
                        />
                        {c === 0 && <text className="fft-network-label" x={x - 27} y={rowY(i) + 4} textAnchor="end">{`x[${i}]`}</text>}
                        {c === columns.length - 1 && i === 0 && (
                          <text className="fft-network-label" x={x + 24} y={rowY(i) + 4}>
                            {'X[0]'}
                          </text>
                        )}
                      </g>
                    )),
                  )}
                </svg>
              </div>
            </Panel>
            <Panel title={tr('Twiddle Factors & Even-Odd Decomposition')} icon={<Settings />} className="fft-twiddle">
              <div className="fft-formula">
                <div>
                  {'X[k] = '}
                  <span>{'E[k]'}</span>
                  {' + '}
                  <em>{'Wᴷₙ'}</em>
                  {' · '}
                  <strong>{'O[k]'}</strong>
                </div>
                <p>
                  {'Wₙ = e⁻²πⁱ/ᴺ '}
                  {tr('(twiddle factor)')}
                </p>
              </div>
              <div className="fft-even-odd">
                <button onClick={() => inspect('even')}>
                  <b>{tr('Even indices')}</b>
                  <small>{`E[k] = FFT(${Array.from({ length: n / 2 }, (_, i) => `x[${i * 2}]`).join(', ')})`}</small>
                </button>
                <button onClick={() => inspect('odd')}>
                  <b>{tr('Odd indices')}</b>
                  <small>{`O[k] = FFT(${Array.from({ length: n / 2 }, (_, i) => `x[${i * 2 + 1}]`).join(', ')})`}</small>
                </button>
              </div>
              <button
                className="fft-twiddle-box"
                onClick={() =>
                  inspect(
                    'butterfly',
                    run.operations.findIndex((b) => b.stage === Math.max(1, cursor) && b.j === Math.max(0, Math.min(1, frame.width / 2 - 1))),
                  )
                }
              >
                <b>
                  {tr('Twiddle factor')}
                  {' (N = '}
                  {n}
                  {')'}
                </b>
                <span>{'Wᴷₙ = e⁻²πⁱᵏ/ᴺ = cos(2πk/N) − i sin(2πk/N)'}</span>
              </button>
            </Panel>
            <Panel title={tr('Step-by-Step FFT Computation')} icon={<FileText />} className="fft-steps">
              <div className="fft-step-list">
                {stageNames.map((name, i) => (
                  <button className={i === cursor ? 'fft-selected-step' : ''} key={name} aria-pressed={i === cursor} onClick={() => seek(i)}>
                    <span>{i + 1}</span>
                    <div>
                      <b>{name}</b>
                      <small>{stageDescriptions[i]}</small>
                    </div>
                  </button>
                ))}
              </div>
              <div className="fft-step-nav">
                <button aria-label={tr('Previous FFT step')} disabled={cursor === 0} onClick={() => seek(cursor - 1)}>
                  <ArrowLeft size={18} />
                </button>
                <span aria-live="polite">
                  {tr('Step')} {cursor + 1} {tr('of')} {run.frames.length}
                </span>
                <button aria-label={tr('Next FFT step')} disabled={cursor === run.frames.length - 1} onClick={() => seek(cursor + 1)}>
                  <ArrowRight size={18} />
                </button>
              </div>
            </Panel>
          </div>
          <div className="fft-bottom-row">
            <Panel title={tr('Correctness')} icon={<CheckCircle2 />} className="fft-correctness">
              <p>
                {tr(
                  'Splitting the DFT sum into even and odd indices gives two half-size DFTs joined by roots of unity. Butterfly identities recover all N frequency bins.',
                )}
              </p>
            </Panel>
            <Panel title={tr('Complexity')} icon={<ChartNoAxesColumnIncreasing />} className="fft-complexity">
              <p>
                <b>
                  {tr('Time: O(N log N)')} {' · '} {tr('Auxiliary/output space: O(N)')}
                </b>
              </p>
              <p>{tr('T(N) = 2T(N/2) + O(N). The recursively allocated active arrays have geometric O(N) total size.')}</p>
            </Panel>
            <Panel title={tr('Key Takeaways')} icon={<Lightbulb />} className="fft-takeaways">
              <ul>
                <li>{tr('FFT uses divide and conquer with butterfly operations.')}</li>
                <li>{tr('Twiddle factors connect subproblems.')}</li>
                <li>{tr('Computes the DFT in O(N log N) time.')}</li>
                <li>{tr('Default spectrum may have small floating-point error.')}</li>
              </ul>
            </Panel>
          </div>
        </>
      )}
      {tab === 'Learn' && (
        <div className="fft-learning">
          <Panel title={tr('From samples to frequencies')} icon={<Waves />}>
            <p>
              {tr(
                'A discrete Fourier transform expresses N samples as a weighted sum of complex waves. Bin k means k cycles across the entire N-sample window. The transform below is forward and unnormalized: X[k] = Σ x[n] exp(−2πikn/N).',
              )}
            </p>
            <p>
              {tr(
                'For real signals, X[N−k] is the complex conjugate of X[k]. A unit-amplitude sine at an integer bin f has magnitude N/2 at both f and N−f. The DC bin k = 0 measures the sum of all samples. Fractional-bin frequencies spread energy across bins (spectral leakage).',
              )}
            </p>
            <p>
              {tr(
                'The spectrum is the final result, available as a preview during playback. The numbered steps and network inspectors show the current stage. Connecting sample dots is a visual guide, not extra measured data.',
              )}
            </p>
          </Panel>
          <Panel title={tr('Worked example: two sine waves')} icon={<Activity />}>
            <p>
              {tr(
                'With N = 8, A₁ = 1, f₁ = 2, A₂ = 0.5 and f₂ = 3, the first two samples are x[0] = 0 and x[1] ≈ 1.3536. The only nonzero bins are X[2] = −4i, X[3] = −2i, X[5] = 2i and X[6] = 4i.',
              )}
            </p>
            <p>
              {tr(
                'The input order is bit reversed to [0,4,2,6,1,5,3,7]. Three stages combine 2-point, 4-point and 8-point transforms; each stage uses four butterflies, for twelve in total.',
              )}
            </p>
            <button
              className="fft-primary"
              onClick={() => {
                load(fftExample)
                changeTab('Visualization')
              }}
            >
              {tr('Explore the worked example')}
            </button>
          </Panel>
          <Panel title={tr('Why the butterfly works')} icon={<Network />}>
            <p>
              {tr(
                'Separate even and odd sample indices. For 0 ≤ k < N/2, X[k] = E[k] + WₙᵏO[k] and X[k+N/2] = E[k] − WₙᵏO[k]. The minus sign follows from Wₙᴺ⁄² = −1. Reusing these two smaller transforms removes repeated work.',
              )}
            </p>
            <p>
              {tr(
                'A power-of-two sample count lets every subproblem split evenly down to one sample. The implementation uses an iterative in-place array after bit reversal, plus O(N) educational snapshots per stage. Those teaching snapshots consume O(N log N) storage; the FFT working array itself uses O(N).',
              )}
            </p>
          </Panel>
        </div>
      )}
      {tab === 'Code' && (
        <Panel title={tr('Radix-2 FFT pseudocode')} icon={<FileText />} className="fft-code">
          <p>
            {tr(
              'Complex addition, subtraction and multiplication are explicit operations. The visual network uses the equivalent iterative form with bit-reversed inputs.',
            )}
          </p>
          <pre>
            <code>{code}</code>
          </pre>
          <p>
            {tr('Current input:')} {'['}
            {run.samples.map(short).join(', ')}
            {']'}
          </p>
          <p>
            {tr('Final output:')} {'['}
            {run.spectrum.map((p) => formatFFT(p.value)).join(', ')}
            {']'}
          </p>
        </Panel>
      )}
      {tab === 'Practice' && (
        <Panel title={tr('Predict the spectrum')} icon={<Lightbulb />} className="fft-practice">
          <p>{tr('For N = 8 and the unit impulse x = [1,0,0,0,0,0,0,0], what is |X[k]| at every bin?')}</p>
          <div>
            {['0', '1', '8'].map((answer) => (
              <button
                key={answer}
                aria-pressed={prediction === answer}
                onClick={() => {
                  setPrediction(answer)
                  setFeedback('')
                }}
              >
                {answer}
              </button>
            ))}
          </div>
          <button
            className="fft-primary"
            onClick={() =>
              setFeedback(
                !prediction
                  ? tr('Choose a prediction first.')
                  : prediction === '1'
                    ? tr('Correct. Only x[0] contributes, and exp(0) = 1 for every k. All eight magnitudes are 1.')
                    : tr('Try again. The only nonzero term is x[0] · exp(0) = 1, independent of k.'),
              )
            }
          >
            {tr('Check prediction')}
          </button>
          <p role="status">{feedback}</p>
          <button
            onClick={() => {
              load({ ...fftExample, type: 'impulse' })
              changeTab('Visualization')
            }}
          >
            {tr('Test the impulse example')}
          </button>
        </Panel>
      )}
      {tab === 'Experiments' && (
        <div className="fft-experiments">
          <Panel title={tr('Signal laboratory')} icon={<Settings />}>
            <p>
              {tr(
                'Choose an example, then inspect samples, bins, network nodes and butterflies. Fractional frequencies demonstrate leakage; zero and DC signals demonstrate exact edge cases.',
              )}
            </p>
            <div className="fft-presets">
              {[
                [tr('Two sine waves'), fftExample],
                [tr('Unit impulse'), { ...fftExample, type: 'impulse' }],
                [tr('Constant / DC'), { ...fftExample, type: 'constant', a1: 2 }],
                [tr('Zero signal'), { ...fftExample, a1: 0, a2: 0 }],
                [tr('Spectral leakage'), { ...fftExample, f1: 1.5, a2: 0 }],
                [tr('Nyquist alternating'), { ...fftExample, type: 'custom', samples: [1, -1, 1, -1, 1, -1, 1, -1] }],
              ].map(([label, input]) => (
                <button
                  key={String(label)}
                  onClick={() => {
                    load(input as FFTInput)
                    changeTab('Visualization')
                  }}
                >
                  {String(label)}
                </button>
              ))}
            </div>
            <label>
              {tr('Playback speed')}
              <select
                aria-label={tr('Playback speed')}
                value={speed}
                onChange={(e) => {
                  setSpeed(Number(e.target.value))
                  setPlaying(false)
                }}
              >
                <option value="1600">{tr('Slow')}</option>
                <option value="900">{tr('Normal')}</option>
                <option value="200">{tr('Fast')}</option>
              </select>
            </label>
            <label>
              {tr('FFT stage')}
              <input
                aria-label={tr('FFT stage')}
                type="range"
                min="0"
                max={run.frames.length - 1}
                value={cursor}
                onChange={(e) => seek(Number(e.target.value))}
              />
            </label>
            <p>
              {tr('Bit-reversed input:')} {run.reversal.join(', ')}
              {' · '}
              {tr('Butterflies:')} {run.butterflyCount}
            </p>
            <div className="fft-stage-values">
              <table>
                <thead>
                  <tr>
                    <th>{tr('Index')}</th>
                    <th>{tr('Current stage value')}</th>
                    <th>{tr('Final DFT value')}</th>
                  </tr>
                </thead>
                <tbody>
                  {frame.values.map((v, i) => (
                    <tr key={i}>
                      <th>{i}</th>
                      <td>{formatFFT(v)}</td>
                      <td>{formatFFT(run.spectrum[i].value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <Panel title={tr('Notes & preferences')} icon={<FileText />}>
            <label>
              {tr('Your FFT notes')}
              <textarea aria-label={tr('Your FFT notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
            <LanguageSelector />
            <button onClick={() => (props.onToggleTheme ? props.onToggleTheme() : setLocalTheme(theme === 'dark' ? 'light' : 'dark'))}>
              {tr('Toggle color theme')}
            </button>
          </Panel>
        </div>
      )}
      <dialog
        ref={dialog}
        className="fft-dialog"
        onCancel={() => setModal(null)}
        onClick={(e) => {
          if (e.target === dialog.current) setModal(null)
        }}
      >
        <button className="fft-close" aria-label={tr('Close FFT inspector')} onClick={() => setModal(null)}>
          <X />
        </button>
        {modal?.type === 'sample' && (
          <>
            <h2>
              {tr('Time-domain sample')} {modal.index}
            </h2>
            <p>{`x[${modal.index}] = ${short(run.samples[modal.index])}`}</p>
            <p>
              {tr('This is a real input sample before bit reversal. Its position after reordering is')} {run.reversal.indexOf(modal.index)}.
            </p>
          </>
        )}
        {bin && (
          <>
            <h2>
              {tr('Frequency bin')} {bin.k}
            </h2>
            <p>{`X[${bin.k}] = ${formatFFT(bin.value, 8)}`}</p>
            <p>
              {tr('Magnitude:')} {short(bin.magnitude)}
              {' · '}
              {tr('Phase (radians):')} {!run.significant.some((p) => p.k === bin.k) ? tr('Undefined for zero magnitude') : short(bin.phase)}
            </p>
            <p>
              {tr('Cycles per sample:')} {bin.k <= n / 2 ? `${bin.k}/${n}` : `${bin.k - n}/${n}`}
              {' · '}
              {tr('Conjugate partner:')} {(n - bin.k) % n}
            </p>
            <p>{tr('Final unnormalized DFT preview. Real input produces conjugate pairs; bins above N/2 represent negative frequencies.')}</p>
          </>
        )}
        {nodeValue && modal && (
          <>
            <h2>{tr('Network value')}</h2>
            <p>
              {tr('Column')} {modal.column}
              {', '}
              {tr('row')} {modal.index}
              {': '}
              {formatFFT(nodeValue, 8)}
            </p>
            <p>
              {modal.column === 0
                ? tr('Original input order.')
                : modal.column === 1
                  ? `${tr('Bit-reversed input index:')} ${run.reversal[modal.index]}`
                  : `${tr('After stage')} ${modal.column! - 1}, m = ${run.frames[modal.column! - 1].width}.`}
            </p>
            {modal.column! > cursor + 1 && <p>{tr('This is a preview of a later stage. Select its stage button to move the playback there.')}</p>}
          </>
        )}
        {op && (
          <>
            <h2>{tr('Butterfly certificate')}</h2>
            <p>
              {tr('Stage')} {op.stage}
              {', m = '}
              {op.width}
              {', j = '}
              {op.j}
              {', '}
              {tr('pair')} {'('}
              {op.upper}
              {', '}
              {op.lower}
              {')'}
            </p>
            <p>{`u = ${formatFFT(op.u, 8)}, v = ${formatFFT(op.v, 8)}`}</p>
            <p>{`W_${n}^${op.exponent} = ${formatFFT(op.twiddle, 8)}`}</p>
            <p>{`t = W · v = ${formatFFT(op.product, 8)}`}</p>
            <p>{`u + t = ${formatFFT(op.sum, 8)}`}</p>
            <p>{`u − t = ${formatFFT(op.difference, 8)}`}</p>
            <button
              onClick={() => {
                seek(op.stage)
                setModal(null)
              }}
            >
              {tr('Go to this FFT stage')}
            </button>
          </>
        )}
        {(modal?.type === 'even' || modal?.type === 'odd') && (
          <>
            <h2>{tr(modal.type === 'even' ? 'Even-index subproblem' : 'Odd-index subproblem')}</h2>
            <p>
              {tr('Original indices:')} {Array.from({ length: n / 2 }, (_, i) => i * 2 + (modal.type === 'even' ? 0 : 1)).join(', ')}
            </p>
            <p>
              {tr('Samples:')} {(modal.type === 'even' ? run.even : run.odd).map(short).join(', ')}
            </p>
            <p>{tr('A half-size DFT is computed for these samples, then combined with the other half using twiddle factors.')}</p>
          </>
        )}
      </dialog>
    </div>
  )
}
