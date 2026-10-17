import { useEffect, useState } from 'react'
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
      <header className="ss-top">
        <Link to="/" className="ss-brand">
          <span className="ss-logo">A</span>
          <span>
            <strong>AlgoDrishti</strong>
            <small>Visualize every step</small>
          </span>
        </Link>
        <button className="ss-active">
          <Play />
          Algorithms
        </button>
        <button>
          <BarChart3 />
          Compare
        </button>
        <label className="ss-search">
          <Search />
          <input placeholder="Search algorithms, concepts..." onChange={(e) => setNotice(e.target.value ? `Searching for ${e.target.value}` : '')} />
          <kbd>Ctrl K</kbd>
        </label>
        <button onClick={() => setDark(!dark)}>
          <Moon /> {dark ? 'Light' : 'Dark'}
        </button>
        <button className="ss-export" onClick={download}>
          <Download />
          Export
        </button>
        <button
          className="ss-save"
          onClick={() => {
            localStorage.setItem('string-suite-experiment', JSON.stringify({ text, pattern, step }))
            setNotice('Experiment saved')
          }}
        >
          <Save />
          Save
        </button>
        <button className="ss-primary" onClick={() => setNotice('Account sign-in is available from the main dashboard')}>
          <UserRound />
          Sign in
        </button>
        <span className="ss-society">
          ◉{' '}
          <b>
            AIMER Society<small>AI for Education</small>
          </b>
        </span>
      </header>
      <aside className="ss-sidebar">
        <nav>
          {[
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
                to={name === 'Strings' ? '/strings/string-pattern-matching-suite' : name === 'Dashboard' ? '/' : '/' + name.toLowerCase().replaceAll(' ', '-')}
              >
                <span>{[<Network />, <Grid3X3 />, <Network />, <Grid3X3 />, <Type />, '#', '↶', '◎', <Grid3X3 />, '♧'][i]}</span>
                {name}
                {i > 0 && <ChevronDown />}
              </Link>
              {name === 'Strings' && (
                <div className="ss-subnav">
                  {['String Pattern Matching', 'Advanced String Structures', 'Naive String Matching', 'Knuth–Morris–Pratt', 'Rabin–Karp'].map((n, j) => (
                    <Link
                      key={n}
                      className={j === 0 ? 'selected' : ''}
                      to={
                        '/strings/' +
                        ['string-pattern-matching-suite', 'advanced-string-structures', 'naive-string-matching', 'knuth-morris-pratt', 'rabin-karp'][j]
                      }
                    >
                      {j === 0 && <i />}
                      {n}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className="ss-tip">
          <Lightbulb />
          <div>
            <b>Learn. Experiment. Grow.</b>
            <p>
              Interactive visualizations
              <br />
              for a deeper understanding.
            </p>
          </div>
        </div>
      </aside>
      <main className="ss-main">
        <div className="ss-route">
          <span>
            Home <ChevronRight /> Strings <ChevronRight /> <b>String Pattern Matching Suite</b>
          </span>
          <div>
            {['Learn', 'Visualize', 'Code', 'Practice', 'Experiments'].map((t) => (
              <button key={t} className={tab === t ? 'current' : ''} onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
            <button className="ss-studied" onClick={() => setStudied(!studied)}>
              {studied ? <Check /> : <Bookmark />}
              {studied ? 'Studied' : 'Mark as studied'}
            </button>
          </div>
        </div>
        <section className="ss-hero ss-card">
          <div className="ss-type">Tt</div>
          <div className="ss-title">
            <h1>String Pattern Matching Suite</h1>
            <p>Visualize KMP, Rabin-Karp, Z algorithm, prefix functions, rolling hashes, and palindrome checks.</p>
          </div>
          <div className="ss-feature green">
            <Eye />
            <span>
              Step-by-Step
              <br />
              <b>Visualization</b>
            </span>
          </div>
          <div className="ss-feature purple">
            <Network />
            <span>
              Multiple
              <br />
              <b>Algorithms</b>
            </span>
          </div>
          <div className="ss-feature orange">
            <BarChart3 />
            <span>
              Learn &amp; Compare
              <br />
              <b>Performance</b>
            </span>
          </div>
        </section>
        {tab !== 'Visualize' ? (
          <section className="ss-card ss-other">
            <h2>{tab}</h2>
            {tab === 'Learn' ? (
              <>
                <h3>Find a pattern inside a string</h3>
                <p>
                  Compare the pattern with each text window. KMP uses prefix information to skip redundant comparisons; Rabin–Karp compares rolling hashes
                  before checking characters.
                </p>
                <p>
                  Text: {text} · Pattern: {pattern} · Matches at indices: {matches.join(', ') || 'none'}
                </p>
              </>
            ) : tab === 'Code' ? (
              <pre>{`function findMatches(text, pattern) {\n  const matches = [];\n  for (let i = 0; i <= text.length - pattern.length; i++) {\n    if (text.slice(i, i + pattern.length) === pattern) matches.push(i);\n  }\n  return matches;\n}`}</pre>
            ) : tab === 'Practice' ? (
              <>
                <p>At which index does ABABC first appear in ABABACABABABC?</p>
                <input
                  aria-label="Practice answer"
                  onChange={(e) => setNotice(e.target.value === '8' ? 'Correct! The pattern starts at index 8.' : 'Try comparing each five-character window.')}
                />
              </>
            ) : (
              <>
                <p>Save your current experiment or download the step log to compare runs.</p>
                <button onClick={download}>Download experiment CSV</button>
              </>
            )}
          </section>
        ) : (
          <>
            <div className="ss-workspace">
              <div>
                <section className="ss-card ss-visual">
                  <h2>
                    <Activity />
                    String Visualization{' '}
                    <button className="ss-icon" onClick={() => document.querySelector('.ss-visual')?.requestFullscreen()} aria-label="Full screen">
                      <Maximize />
                    </button>
                  </h2>
                  <div className="ss-playback">
                    <button className="ss-primary" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause' : 'Play'}>
                      {playing ? <Pause /> : <Play fill="currentColor" />}
                    </button>
                    <button
                      onClick={() => {
                        setPlaying(false)
                        setStep(Math.max(0, step - 1))
                      }}
                      aria-label="Previous step"
                    >
                      <SkipBack />
                    </button>
                    <button onClick={() => setStep(Math.min(total - 1, step + 1))} aria-label="Next step">
                      <SkipForward />
                    </button>
                    <span>
                      Step {step + 1} / {total}
                    </span>
                    <input aria-label="Step timeline" type="range" min="0" max={total - 1} value={step} onChange={(e) => setStep(+e.target.value)} />
                    <span className="ss-speed">Speed</span>
                    <select aria-label="Speed" value={speed} onChange={(e) => setSpeed(+e.target.value)}>
                      <option value={1000}>Slow (1000 ms)</option>
                      <option value={520}>Medium (520 ms)</option>
                      <option value={200}>Fast (200 ms)</option>
                    </select>
                  </div>
                  <div className="ss-canvas">
                    <div className="ss-characters" style={{ fontSize: `${zoom}%` }}>
                      <div className="ss-character-row">
                        <b>Text (T)</b>
                        {text.split('').map((c, i) => (
                          <div
                            key={i}
                            className={`ss-char ${i === step + 2 ? 'position' : ''} ${step > 0 && matches.includes(step) && i >= step && i < step + pattern.length ? 'matched' : ''}`}
                          >
                            <small>{indices ? i : ''}</small>
                            {values ? c : '·'}
                          </div>
                        ))}
                      </div>
                      <div className="ss-character-row ss-pattern">
                        <b>Pattern (P)</b>
                        {pattern.split('').map((c, i) => (
                          <div className="ss-char" key={i}>
                            <small>{indices ? i : ''}</small>
                            {values ? c : '·'}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="ss-result">
                      <Search />
                      <span>
                        <b>{matches.some((i) => i <= step) ? `Match found at index ${matches.find((i) => i <= step)}!` : 'No match found yet...'}</b>
                        <br />
                        {playing ? 'Comparing characters…' : 'Continue stepping!'}
                      </span>
                    </div>
                    <div className="ss-canvas-bottom">
                      <div className="ss-legend">
                        {['Current position', 'Matching', 'Mismatch', 'Potential match', 'Completed match'].map((v, i) => (
                          <span key={v}>
                            <i style={{ background: ['#258cff', '#1a9c61', '#f43e58', '#ffb900', '#9250ff'][i] }} />
                            {v}
                          </span>
                        ))}
                      </div>
                      <span>{zoom}%</span>
                      <button aria-label="Zoom out" onClick={() => setZoom(Math.max(60, zoom - 10))}>
                        <ZoomOut />
                      </button>
                      <button aria-label="Zoom in" onClick={() => setZoom(Math.min(130, zoom + 10))}>
                        <ZoomIn />
                      </button>
                      <button aria-label="Fit canvas" onClick={() => setZoom(100)}>
                        <Maximize />
                      </button>
                      <button
                        aria-label="Reset"
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
                    <label>Visualization Options</label>
                    <div>
                      {['Show values', 'Show indices', 'Auto zoom', 'Fit to canvas', 'Before / After'].map((v, i) => (
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
                          {v}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label>Animation Style</label>
                    <div>
                      <select aria-label="Animation style">
                        <option>Detailed</option>
                        <option>Simple</option>
                      </select>
                      <button onClick={() => setNotice('Palette: blue position, green match, purple completed match')}>◉ &nbsp; Color-blind palette</button>
                    </div>
                  </div>
                </div>
              </div>
              <section className="ss-card ss-input">
                <h2>
                  <SquarePen />
                  Problem Input
                  <select
                    aria-label="Load example"
                    onChange={(e) => {
                      const [t, p] = e.target.value.split('|')
                      setText(t)
                      setPattern(p)
                      setInput(t)
                      setTarget(p)
                      setStep(0)
                    }}
                  >
                    <option value="ABABACABABABC|ABABC">Load example</option>
                    <option value="ABABACABABABC|ABABC">KMP example</option>
                    <option value="AABAACAADAABAABA|AABA">Repeated matches</option>
                    <option value="HELLOWORLD|WORLD">Hello world</option>
                  </select>
                </h2>
                <div className="ss-fields">
                  <label>
                    Text (T)
                    <textarea value={input} onChange={(e) => setInput(e.target.value)} />
                  </label>
                  <label>
                    Target
                    <input value={target} onChange={(e) => setTarget(e.target.value)} />
                  </label>
                  <label>
                    Size
                    <input type="number" min="1" max="48" value={size} onChange={(e) => setSize(+e.target.value)} />
                  </label>
                </div>
                <div className="ss-presets">
                  {presets.map((p, i) => (
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
                      {p}
                    </button>
                  ))}
                </div>
                <div className="ss-input-actions">
                  <button className="ss-primary" onClick={run}>
                    <Play fill="currentColor" />
                    Run
                  </button>
                  <button onClick={() => copy(input)}>
                    <Copy />
                    Copy input
                  </button>
                  <button onClick={download}>
                    <FileText />
                    CSV log
                  </button>
                </div>
              </section>
            </div>
            <div className="ss-bottom">
              <section className="ss-card">
                <h3>
                  <BookOpen />
                  Explanation
                </h3>
                <div className="ss-explanation">
                  <b>{step === 0 ? 'Build prefix, Z, or rolling-hash metadata for the pattern.' : `Compare the pattern with the text at position ${step}.`}</b>
                  <p>
                    {step === 0
                      ? 'Choose the active value, pivot, node, or candidate for this phase.'
                      : matches.includes(step)
                        ? 'Every character matches. Record this window and continue scanning.'
                        : 'Check characters from left to right, then advance to the next window.'}
                  </p>
                </div>
              </section>
              <section className="ss-card">
                <h3>
                  <span>☷</span>Current Step
                </h3>
                {['SELECT', 'COMPARE', 'UPDATE', 'COMPLETE'].map((s, i) => (
                  <div className={`ss-step ${i === Math.min(3, Math.floor(step / 2)) ? 'active' : ''}`} key={s}>
                    <i>{i + 1}</i>
                    <b>{s}</b>
                    <span>
                      {
                        [
                          'Build prefix, Z, or rolling-hash metadata for the pattern.',
                          'Compare text and pattern.',
                          'Report the matched window and continue scanning.',
                          'String pattern matching suite demo complete.',
                        ][i]
                      }
                    </span>
                  </div>
                ))}
              </section>
              <section className="ss-card">
                <h3>
                  <BarChart3 />
                  Experiment Metrics
                </h3>
                <div className="ss-metrics">
                  {['comparisons', 'swaps', 'reads', 'writes', 'recursive calls', 'memory', 'steps'].map((m, i) => (
                    <div key={m}>
                      <strong>{[step + 1, 0, step * 2, 2, 0, 8, 4][i]}</strong>
                      <small>{m}</small>
                    </div>
                  ))}
                </div>
              </section>
              <section className="ss-card ss-log">
                <h3>
                  <FileText />
                  Step Log{' '}
                  <button onClick={() => copy(`Text: ${text}\nPattern: ${pattern}\nCurrent step: ${step + 1}`)}>
                    <Copy />
                    Copy log
                  </button>
                  <button onClick={download}>Download CSV</button>
                </h3>
                <div>
                  {[
                    'Initialized text and pattern',
                    `Text length: ${size}, Pattern length: ${pattern.length}`,
                    'Computing prefix/Z/rolling-hash metadata',
                    playing ? `Comparing window at index ${step}` : 'Ready to start visualization',
                  ].map((s, i) => (
                    <p key={i}>
                      <time>23:50:21</time>
                      {s}
                    </p>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </main>
      <footer className="ss-footer">
        <b>www.AimerSociety.com</b>
        <span>AI Learning Tools</span>
        <span className="ss-footer-right">Artificial Intelligence Medical &amp; Engineering Researchers Society</span>
        <Heart /> Learn &nbsp; Visualize &nbsp; Innovate
      </footer>
      {notice && (
        <div className="ss-toast" role="status">
          {notice}
        </div>
      )}
    </div>
  )
}
