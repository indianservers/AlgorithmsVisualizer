import { LanguageSelector } from '../i18n/LanguageSelector'
// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
import { useNavigate } from 'react-router-dom'
import { InputAccessButton } from './InputAccessButton'
import { useEffect, useState, useRef } from 'react'
import {
  Activity,
  BarChart3,
  BookOpen,
  Bookmark,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Eye,
  FileText,
  Grid3X3,
  Heart,
  Lightbulb,
  Maximize,
  Moon,
  Network,
  Pause,
  Play,
  RotateCcw,
  Save,
  Search,
  Shuffle,
  SkipBack,
  SkipForward,
  SquarePen,
  Type,
  UserRound,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import './string-suite.css'

const initialText = 'ABABACABABABC'
const initialPattern = 'ABABC'
export function StringSuite() {
  useLocaleRender()

  const headerRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const header = headerRef.current
    if (!header) return
    const observer = new ResizeObserver(() => header.parentElement?.style.setProperty('--ss-header-height', `${header.offsetHeight}px`))
    observer.observe(header)
    return () => observer.disconnect()
  }, [])
  const [text, setText] = useState(initialText)
  const [pattern, setPattern] = useState(initialPattern)
  const [input, setInput] = useState('42, 18, 67, 9, 31, 73, 54, 26, 88, 12')
  const [target, setTarget] = useState('31')
  const [size, setSize] = useState(10)
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(520)
  const [zoom, setZoom] = useState(100)
  const [indices, setIndices] = useState(true)
  const [values, setValues] = useState(true)
  const navigate = useNavigate()
  const [tab, setTab] = useState('Visualize')
  const [studied, setStudied] = useState(false)
  const [dark, setDark] = useState(false)
  const [notice, setNotice] = useState('')
  const matches = Array.from({ length: Math.max(0, text.length - pattern.length + 1) }, (_, i) => i).filter(
    (i) => text.slice(i, i + pattern.length) === pattern,
  )
  const total = Math.max(1, text.length - pattern.length + 1)
  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(
      () =>
        setStep((s) => {
          if (s >= total - 1) {
            setPlaying(false)
            return total - 1
          }
          return s + 1
        }),
      speed,
    )
    return () => clearInterval(timer)
  }, [playing, speed, total])
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 2200)
    return () => clearTimeout(timer)
  }, [notice])
  function download() {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(
      new Blob(['step,text,pattern,match\n' + Array.from({ length: total }, (_, i) => `${i + 1},${text},${pattern},${matches.includes(i)}`).join('\n')], {
        type: 'text/csv',
      }),
    )
    a.download = 'string-pattern-log.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }
  function run() {
    if (/^[a-z\s]+$/i.test(input.trim()) && input.trim()) {
      setText(input.replace(/\s/g, '').toUpperCase())
      setPattern(/^[a-z]+$/i.test(target) ? target.toUpperCase() : initialPattern)
    }
    setStep(0)
    setPlaying(true)
  }
  const copy = (s: string) => {
    void navigator.clipboard.writeText(s)
    setNotice('Copied to clipboard')
  }
  const presets = ['Random', 'Sorted', 'Reverse', 'Duplicates', 'Nearly', 'Best', 'Average', 'Worst', 'Empty', 'Single', 'All Equal', 'Negative']
  return (
    <div className={`ss-page ${dark ? 'ss-dark' : ''}`}>
      <header ref={headerRef} className="ss-top">
        <Link to="/" className="ss-brand">
          <span className="ss-logo">{tx('A', 'studios')}</span>
          <span>
            <strong>{tx('AlgoDrishti', 'studios')}</strong>
            <small>{tx('Visualize every step', 'studios')}</small>
          </span>
        </Link>
        <button className="ss-active">
          <Play />
          {tx('Algorithms', 'studios')}
        </button>
        <button>
          <BarChart3 />
          {tx('Compare', 'studios')}
        </button>
        <label className="ss-search">
          <Search />
          <input
            placeholder={tx('Search algorithms, concepts...', 'studios')}
            onChange={(e) => setNotice(e.target.value ? `Searching for ${e.target.value}` : '')}
          />
          <kbd>{tx('Ctrl K', 'studios')}</kbd>
        </label>
        <button onClick={() => setDark(!dark)}>
          <Moon /> {tx(dark ? 'Light' : 'Dark', 'studios')}
        </button>
        <button className="ss-export" onClick={download}>
          <Download />
          {tx('Export', 'studios')}
        </button>
        <button
          className="ss-save"
          onClick={() => {
            localStorage.setItem('string-suite-experiment', JSON.stringify({ text, pattern, step }))
            setNotice('Experiment saved')
          }}
        >
          <Save />
          {tx('Save', 'studios')}
        </button>

        <button className="ss-primary" onClick={() => setNotice('Account sign-in is available from the main dashboard')}>
          <UserRound />
          {tx('Sign in', 'studios')}
        </button>
        <LanguageSelector />
        <span className="ss-society">
          ◉{tx(' ', 'studios')}
          <b>
            {tx('AIMER Society', 'studios')}
            <small>{tx('AI for Education', 'studios')}</small>
          </b>
        </span>
      </header>
      <aside className="ss-sidebar">
        <nav>
          {tx(
            [
              'Dashboard',
              'Data Structures',
              'Graphs',
              'Dynamic Programming',
              'Strings',
              'Number Theory',
              'Backtracking',
              'Greedy',
              'Matrix / Grid',
              'Games',
            ].map((name, i) => (
              <div key={name}>
                <Link
                  className={name === 'Strings' ? 'selected' : ''}
                  to={
                    name === 'Strings' ? '/strings/string-pattern-matching-suite' : name === 'Dashboard' ? '/' : '/' + name.toLowerCase().replaceAll(' ', '-')
                  }
                >
                  <span>{tx([<Network />, <Grid3X3 />, <Network />, <Grid3X3 />, <Type />, '#', '↶', '◎', <Grid3X3 />, '♧'][i], 'studios')}</span>
                  {tx(name, 'studios')}
                  {tx(i > 0 && <ChevronDown />, 'studios')}
                </Link>
                {tx(
                  name === 'Strings' && (
                    <div className="ss-subnav">
                      {tx(
                        ['String Pattern Matching', 'Advanced String Structures', 'Naive String Matching', 'Knuth–Morris–Pratt', 'Rabin–Karp'].map((n, j) => (
                          <Link
                            key={n}
                            className={j === 0 ? 'selected' : ''}
                            to={
                              '/strings/' +
                              ['string-pattern-matching-suite', 'advanced-string-structures', 'naive-string-matching', 'knuth-morris-pratt', 'rabin-karp'][j]
                            }
                          >
                            {tx(j === 0 && <i />, 'studios')}
                            {tx(n, 'studios')}
                          </Link>
                        )),
                        'studios',
                      )}
                    </div>
                  ),
                  'studios',
                )}
              </div>
            )),
            'studios',
          )}
        </nav>
        <div className="ss-tip">
          <Lightbulb />
          <div>
            <b>{tx('Learn. Experiment. Grow.', 'studios')}</b>
            <p>
              {tx('Interactive visualizations', 'studios')}
              <br />
              {tx('for a deeper understanding.', 'studios')}
            </p>
          </div>
        </div>
      </aside>
      <main className="ss-main">
        <div className="ss-route">
          <span>
            {tx('Home ', 'studios')}
            <ChevronRight />
            {tx(' Strings ', 'studios')}
            <ChevronRight /> <b>{tx('String Pattern Matching Suite', 'studios')}</b>
          </span>
          <div>
            {tx(
              ['Learn', 'Visualize', 'Code', 'Practice', 'Experiments'].map((t) => (
                <button
                  key={t}
                  className={tab === t ? 'current' : ''}
                  onClick={() => (t === 'Learn' ? navigate('/strings/string-pattern-matching-suite/learn') : setTab(t))}
                >
                  {tx(t, 'studios')}
                </button>
              )),
              'studios',
            )}
            <InputAccessButton onOpen={() => setTab('Visualize')} />
            <button className="ss-studied" onClick={() => setStudied(!studied)}>
              {tx(studied ? <Check /> : <Bookmark />, 'studios')}
              {tx(studied ? 'Studied' : 'Mark as studied', 'studios')}
            </button>
          </div>
        </div>
        <section className="ss-hero ss-card">
          <div className="ss-type">{tx('Tt', 'studios')}</div>
          <div className="ss-title">
            <h1>{tx('String Pattern Matching Suite', 'studios')}</h1>
            <p>{tx('Visualize KMP, Rabin-Karp, Z algorithm, prefix functions, rolling hashes, and palindrome checks.', 'studios')}</p>
          </div>
          <div className="ss-feature green">
            <Eye />
            <span>
              {tx('Step-by-Step', 'studios')}
              <br />
              <b>{tx('Visualization', 'studios')}</b>
            </span>
          </div>
          <div className="ss-feature purple">
            <Network />
            <span>
              {tx('Multiple', 'studios')}
              <br />
              <b>{tx('Algorithms', 'studios')}</b>
            </span>
          </div>
          <div className="ss-feature orange">
            <BarChart3 />
            <span>
              {tx('Learn & Compare', 'studios')}
              <br />
              <b>{tx('Performance', 'studios')}</b>
            </span>
          </div>
        </section>
        {tx(
          tab !== 'Visualize' ? (
            <section className="ss-card ss-other">
              <h2>{tx(tab, 'studios')}</h2>
              {tx(
                tab === 'Learn' ? (
                  <>
                    <h3>{tx('Find a pattern inside a string', 'studios')}</h3>
                    <p>
                      {tx(
                        'Compare the pattern with each text window. KMP uses prefix information to skip redundant comparisons; Rabin–Karp compares rolling hashes before checking characters.',
                        'studios',
                      )}
                    </p>
                    <p>
                      {tx('Text: ', 'studios')}
                      {text}
                      {tx(' · Pattern: ', 'studios')}
                      {pattern}
                      {tx(' · Matches at indices: ', 'studios')}
                      {tx(matches.join(', ') || 'none', 'studios')}
                    </p>
                  </>
                ) : tab === 'Code' ? (
                  <pre>{`function findMatches(text, pattern) {\n  const matches = [];\n  for (let i = 0; i <= text.length - pattern.length; i++) {\n    if (text.slice(i, i + pattern.length) === pattern) matches.push(i);\n  }\n  return matches;\n}`}</pre>
                ) : tab === 'Practice' ? (
                  <>
                    <p>{tx('At which index does ABABC first appear in ABABACABABABC?', 'studios')}</p>
                    <input
                      aria-label={tx('Practice answer', 'studios')}
                      onChange={(e) =>
                        setNotice(e.target.value === '8' ? 'Correct! The pattern starts at index 8.' : 'Try comparing each five-character window.')
                      }
                    />
                  </>
                ) : (
                  <>
                    <p>{tx('Save your current experiment or download the step log to compare runs.', 'studios')}</p>
                    <button onClick={download}>{tx('Download experiment CSV', 'studios')}</button>
                  </>
                ),
                'studios',
              )}
            </section>
          ) : (
            <>
              <div className="ss-workspace">
                <div>
                  <section className="ss-card ss-visual">
                    <h2>
                      <Activity />
                      {tx('String Visualization', 'studios')}
                      {tx(' ', 'studios')}
                      <button
                        className="ss-icon"
                        onClick={() => document.querySelector('.ss-visual')?.requestFullscreen()}
                        aria-label={tx('Full screen', 'studios')}
                      >
                        <Maximize />
                      </button>
                    </h2>
                    <div className="ss-playback">
                      <button className="ss-primary" onClick={() => setPlaying(!playing)} aria-label={tx(playing ? 'Pause' : 'Play', 'studios')}>
                        {tx(playing ? <Pause /> : <Play fill="currentColor" />, 'studios')}
                      </button>
                      <button
                        onClick={() => {
                          setPlaying(false)
                          setStep(Math.max(0, step - 1))
                        }}
                        aria-label={tx('Previous step', 'studios')}
                      >
                        <SkipBack />
                      </button>
                      <button onClick={() => setStep(Math.min(total - 1, step + 1))} aria-label={tx('Next step', 'studios')}>
                        <SkipForward />
                      </button>
                      <span>
                        {tx('Step ', 'studios')}
                        {tx(step + 1, 'studios')} / {tx(total, 'studios')}
                      </span>
                      <input
                        aria-label={tx('Step timeline', 'studios')}
                        type="range"
                        min="0"
                        max={total - 1}
                        value={step}
                        onChange={(e) => setStep(+e.target.value)}
                      />
                      <span className="ss-speed">{tx('Speed', 'studios')}</span>
                      <select aria-label={tx('Speed', 'studios')} value={speed} onChange={(e) => setSpeed(+e.target.value)}>
                        <option value={1000}>{tx('Slow (1000 ms)', 'studios')}</option>
                        <option value={520}>{tx('Medium (520 ms)', 'studios')}</option>
                        <option value={200}>{tx('Fast (200 ms)', 'studios')}</option>
                      </select>
                    </div>
                    <div className="ss-canvas">
                      <div className="ss-characters" style={{ fontSize: `${zoom}%` }}>
                        <div className="ss-character-row">
                          <b>{tx('Text (T)', 'studios')}</b>
                          {tx(
                            text.split('').map((c, i) => (
                              <div
                                key={i}
                                className={`ss-char ${i === step + 2 ? 'position' : ''} ${step > 0 && matches.includes(step) && i >= step && i < step + pattern.length ? 'matched' : ''}`}
                              >
                                <small>{tx(indices ? i : '', 'studios')}</small>
                                {tx(values ? c : '·', 'studios')}
                              </div>
                            )),
                            'studios',
                          )}
                        </div>
                        <div className="ss-character-row ss-pattern">
                          <b>{tx('Pattern (P)', 'studios')}</b>
                          {tx(
                            pattern.split('').map((c, i) => (
                              <div className="ss-char" key={i}>
                                <small>{tx(indices ? i : '', 'studios')}</small>
                                {tx(values ? c : '·', 'studios')}
                              </div>
                            )),
                            'studios',
                          )}
                        </div>
                      </div>
                      <div className="ss-result">
                        <Search />
                        <span>
                          <b>
                            {tx(
                              matches.some((i) => i <= step) ? `Match found at index ${matches.find((i) => i <= step)}!` : 'No match found yet...',
                              'studios',
                            )}
                          </b>
                          <br />
                          {tx(playing ? 'Comparing characters…' : 'Continue stepping!', 'studios')}
                        </span>
                      </div>
                      <div className="ss-canvas-bottom">
                        <div className="ss-legend">
                          {tx(
                            ['Current position', 'Matching', 'Mismatch', 'Potential match', 'Completed match'].map((v, i) => (
                              <span key={v}>
                                <i style={{ background: ['#258cff', '#1a9c61', '#f43e58', '#ffb900', '#9250ff'][i] }} />
                                {tx(v, 'studios')}
                              </span>
                            )),
                            'studios',
                          )}
                        </div>
                        <span>{tx(zoom, 'studios')}%</span>
                        <button aria-label={tx('Zoom out', 'studios')} onClick={() => setZoom(Math.max(60, zoom - 10))}>
                          <ZoomOut />
                        </button>
                        <button aria-label={tx('Zoom in', 'studios')} onClick={() => setZoom(Math.min(130, zoom + 10))}>
                          <ZoomIn />
                        </button>
                        <button aria-label={tx('Fit canvas', 'studios')} onClick={() => setZoom(100)}>
                          <Maximize />
                        </button>
                        <button
                          aria-label={tx('Reset', 'studios')}
                          onClick={() => {
                            setStep(0)
                            setPlaying(false)
                          }}
                        >
                          <RotateCcw />
                        </button>
                      </div>
                    </div>
                  </section>
                  <div className="ss-options">
                    <div>
                      <label>{tx('Visualization Options', 'studios')}</label>
                      <div>
                        {tx(
                          ['Show values', 'Show indices', 'Auto zoom', 'Fit to canvas', 'Before / After'].map((v, i) => (
                            <label key={v}>
                              <input
                                type="checkbox"
                                defaultChecked={i < 3}
                                onChange={(e) => {
                                  if (i === 0) setValues(e.target.checked)
                                  if (i === 1) setIndices(e.target.checked)
                                  if (i === 3) setZoom(100)
                                }}
                              />
                              {tx(v, 'studios')}
                            </label>
                          )),
                          'studios',
                        )}
                      </div>
                    </div>
                    <div>
                      <label>{tx('Animation Style', 'studios')}</label>
                      <div>
                        <select aria-label={tx('Animation style', 'studios')}>
                          <option>{tx('Detailed', 'studios')}</option>
                          <option>{tx('Simple', 'studios')}</option>
                        </select>
                        <button onClick={() => setNotice('Palette: blue position, green match, purple completed match')}>
                          {tx('◉   Color-blind palette', 'studios')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <section className="ss-card ss-input">
                  <h2>
                    <SquarePen />
                    {tx('Problem Input', 'studios')}
                    <select
                      aria-label={tx('Load example', 'studios')}
                      onChange={(e) => {
                        const [t, p] = e.target.value.split('|')
                        setText(t)
                        setPattern(p)
                        setInput(t)
                        setTarget(p)
                        setStep(0)
                      }}
                    >
                      <option value="ABABACABABABC|ABABC">{tx('Load example', 'studios')}</option>
                      <option value="ABABACABABABC|ABABC">{tx('KMP example', 'studios')}</option>
                      <option value="AABAACAADAABAABA|AABA">{tx('Repeated matches', 'studios')}</option>
                      <option value="HELLOWORLD|WORLD">{tx('Hello world', 'studios')}</option>
                    </select>
                  </h2>
                  <div className="ss-fields">
                    <label>
                      {tx('Text (T)', 'studios')}
                      <textarea value={input} onChange={(e) => setInput(e.target.value)} />
                    </label>
                    <label>
                      {tx('Target', 'studios')}
                      <input value={target} onChange={(e) => setTarget(e.target.value)} />
                    </label>
                    <label>
                      {tx('Size', 'studios')}
                      <input type="number" min="1" max="48" value={size} onChange={(e) => setSize(+e.target.value)} />
                    </label>
                  </div>
                  <div className="ss-presets">
                    {tx(
                      presets.map((p, i) => (
                        <button
                          className={i === 0 ? 'ss-primary' : ''}
                          key={p}
                          onClick={() => {
                            const a = Array.from({ length: Math.min(48, Math.max(1, size)) }, () => Math.floor(Math.random() * 90) + 1)
                            setInput(
                              p === 'Empty'
                                ? ''
                                : p === 'Single'
                                  ? '42'
                                  : p === 'All Equal'
                                    ? a.map(() => 7).join(', ')
                                    : p === 'Sorted'
                                      ? a.sort((a, b) => a - b).join(', ')
                                      : p === 'Reverse'
                                        ? a.sort((a, b) => b - a).join(', ')
                                        : p === 'Negative'
                                          ? a.map((n) => -n).join(', ')
                                          : p === 'Duplicates'
                                            ? a.map((n) => n % 4).join(', ')
                                            : a.join(', '),
                            )
                            setStep(0)
                          }}
                        >
                          <Shuffle />
                          {tx(p, 'studios')}
                        </button>
                      )),
                      'studios',
                    )}
                  </div>
                  <div className="ss-input-actions">
                    <button className="ss-primary" onClick={run}>
                      <Play fill="currentColor" />
                      {tx('Run algorithm', 'studios')}
                    </button>
                    <button onClick={() => copy(input)}>
                      <Copy />
                      {tx('Copy input', 'studios')}
                    </button>
                    <button onClick={download}>
                      <FileText />
                      {tx('CSV log', 'studios')}
                    </button>
                  </div>
                </section>
              </div>
              <div className="ss-bottom">
                <section className="ss-card">
                  <h3>
                    <BookOpen />
                    {tx('Explanation', 'studios')}
                  </h3>
                  <div className="ss-explanation">
                    <b>
                      {tx(
                        step === 0 ? 'Build prefix, Z, or rolling-hash metadata for the pattern.' : `Compare the pattern with the text at position ${step}.`,
                        'studios',
                      )}
                    </b>
                    <p>
                      {tx(
                        step === 0
                          ? 'Choose the active value, pivot, node, or candidate for this phase.'
                          : matches.includes(step)
                            ? 'Every character matches. Record this window and continue scanning.'
                            : 'Check characters from left to right, then advance to the next window.',
                        'studios',
                      )}
                    </p>
                  </div>
                </section>
                <section className="ss-card">
                  <h3>
                    <span>☷</span>
                    {tx('Current Step', 'studios')}
                  </h3>
                  {tx(
                    ['SELECT', 'COMPARE', 'UPDATE', 'COMPLETE'].map((s, i) => (
                      <div className={`ss-step ${i === Math.min(3, Math.floor(step / 2)) ? 'active' : ''}`} key={s}>
                        <i>{tx(i + 1, 'studios')}</i>
                        <b>{tx(s, 'studios')}</b>
                        <span>
                          {tx(
                            [
                              'Build prefix, Z, or rolling-hash metadata for the pattern.',
                              'Compare text and pattern.',
                              'Report the matched window and continue scanning.',
                              'String pattern matching suite demo complete.',
                            ][i],
                            'studios',
                          )}
                        </span>
                      </div>
                    )),
                    'studios',
                  )}
                </section>
                <section className="ss-card">
                  <h3>
                    <BarChart3 />
                    {tx('Experiment Metrics', 'studios')}
                  </h3>
                  <div className="ss-metrics">
                    {tx(
                      ['comparisons', 'swaps', 'reads', 'writes', 'recursive calls', 'memory', 'steps'].map((m, i) => (
                        <div key={m}>
                          <strong>{tx([step + 1, 0, step * 2, 2, 0, 8, 4][i], 'studios')}</strong>
                          <small>{tx(m, 'studios')}</small>
                        </div>
                      )),
                      'studios',
                    )}
                  </div>
                </section>
                <section className="ss-card ss-log">
                  <h3>
                    <FileText />
                    {tx('Step Log', 'studios')}
                    {tx(' ', 'studios')}
                    <button onClick={() => copy(`Text: ${text}\nPattern: ${pattern}\nCurrent step: ${step + 1}`)}>
                      <Copy />
                      {tx('Copy log', 'studios')}
                    </button>
                    <button onClick={download}>{tx('Download CSV', 'studios')}</button>
                  </h3>
                  <div>
                    {tx(
                      [
                        'Initialized text and pattern',
                        `Text length: ${size}, Pattern length: ${pattern.length}`,
                        'Computing prefix/Z/rolling-hash metadata',
                        playing ? `Comparing window at index ${step}` : 'Ready to start visualization',
                      ].map((s, i) => (
                        <p key={i}>
                          <time>23:50:21</time>
                          {tx(s, 'studios')}
                        </p>
                      )),
                      'studios',
                    )}
                  </div>
                </section>
              </div>
            </>
          ),
          'studios',
        )}
      </main>
      <footer className="ss-footer">
        <b>{tx('www.AimerSociety.com', 'studios')}</b>
        <span>{tx('AI Learning Tools', 'studios')}</span>
        <span className="ss-footer-right">{tx('Artificial Intelligence Medical & Engineering Researchers Society', 'studios')}</span>
        <Heart />
        {tx(' Learn   Visualize   Innovate', 'studios')}
      </footer>
      {tx(
        notice && (
          <div className="ss-toast" role="status">
            {tx(notice, 'studios')}
          </div>
        ),
        'studios',
      )}
    </div>
  )
}
