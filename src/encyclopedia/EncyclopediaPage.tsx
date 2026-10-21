import { useEffect, useState } from 'react'
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom'
import { Bookmark, Check, Copy, Play } from 'lucide-react'
import { allModules } from '../algorithms'
import { categoryPages } from '../data/catalog'
import { algorithmPath, categoryFromSlug, learnPath } from '../utils/routing'
import { AccountControl } from '../account/AccountControl'
import { usePersistentState } from '../hooks/usePersistentState'
import { AlgorithmArticle } from './AlgorithmArticle'

export function EncyclopediaDirectory() {
  const [query, setQuery] = useState('')
  const [bookmarks] = usePersistentState<string[]>('algodrishti-article-bookmarks', [])
  const [savedOnly, setSavedOnly] = useState(false)
  const modules = allModules.filter(
    (m) => `${m.name} ${m.summary} ${m.category}`.toLowerCase().includes(query.toLowerCase()) && (!savedOnly || bookmarks.includes(m.id)),
  )
  return (
    <main className="wiki-page">
      <WikiHeader />
      <h1>Algorithm encyclopedia</h1>
      <p className="wiki-deck">
        Explore {allModules.length} guides to algorithms, data structures, problem-solving techniques and learning tools. Each guide includes its purpose,
        mechanics, examples and analysis.
      </p>
      <label className="wiki-search">
        Find a topic
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search selection sort, shortest paths, trees…" />
      </label>
      <button className="wiki-bookmark-filter" aria-pressed={savedOnly} onClick={() => setSavedOnly((value) => !value)}>
        {savedOnly ? 'Show all topics' : `Bookmarked articles (${bookmarks.length})`}
      </button>
      {Object.entries(categoryPages).map(([category, page]) => {
        const items = modules.filter((m) => m.category === category)
        return items.length ? (
          <section key={category} className="wiki-directory-category">
            <h2>{category}</h2>
            <p>{page.subtitle}</p>
            <div className="wiki-related">
              {items.map((m) => (
                <Link to={learnPath(m)} key={m.id}>
                  <strong>{m.name}</strong>
                  <span>{m.summary}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null
      })}
    </main>
  )
}
function WikiHeader() {
  return (
    <header className="wiki-site-header">
      <Link to="/" className="wiki-brand">
        AlgoDrishti<span>Visualize. Understand. Remember.</span>
      </Link>
      <Link to="/encyclopedia">Encyclopedia</Link>
      <AccountControl />
    </header>
  )
}
export function EncyclopediaPage() {
  const { categorySlug, algorithmSlug } = useParams()
  const location = useLocation(),
    navigate = useNavigate()
  const module = allModules.find((m) => m.id === algorithmSlug && m.category === categoryFromSlug(categorySlug))
  const [bookmarks, setBookmarks] = usePersistentState<string[]>('algodrishti-article-bookmarks', [])
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ block: 'start' })
      else window.scrollTo(0, 0)
    }, 50)
    return () => clearTimeout(timer)
  }, [location.pathname, location.hash])
  if (!module)
    return (
      <main className="wiki-page">
        <WikiHeader />
        <h1>Topic not found</h1>
        <Link to="/encyclopedia">Browse the encyclopedia</Link>
      </main>
    )
  const saved = bookmarks.includes(module.id)
  return (
    <main className="wiki-page">
      <WikiHeader />
      <nav aria-label="Breadcrumb" className="wiki-breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/encyclopedia">Encyclopedia</Link>
        <span>/</span>
        <Link to={algorithmPath(module)}>{module.name}</Link>
        <span>/ Theory</span>
      </nav>
      <nav className="wiki-actions" aria-label="Algorithm sections">
        <button aria-pressed="true">Learn</button>
        <button onClick={() => navigate(algorithmPath(module) + '#problem-input')}>Edit input</button>
        <Link to={algorithmPath(module)}>
          <Play size={16} /> Visualization
        </Link>
        <button aria-pressed={saved} onClick={() => setBookmarks((items) => (saved ? items.filter((x) => x !== module.id) : [...items, module.id]))}>
          {saved ? <Check size={16} /> : <Bookmark size={16} />} {saved ? 'Bookmarked' : 'Bookmark article'}
        </button>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(window.location.href)
              setCopied(true)
            } catch {
              setCopied(false)
            }
          }}
        >
          <Copy size={16} />
          {copied ? 'Link copied' : 'Copy page link'}
        </button>
        <span aria-live="polite">{saved ? 'Saved in this browser' : ''}</span>
      </nav>
      <AlgorithmArticle module={module} />
      <footer className="wiki-footer">
        AlgoDrishti · AIMER Society · <Link to="/encyclopedia">Keep exploring</Link>
      </footer>
    </main>
  )
}
