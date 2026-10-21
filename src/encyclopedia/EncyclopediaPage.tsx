// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
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
  useLocaleRender()

  const [query, setQuery] = useState('')
  const [bookmarks] = usePersistentState<string[]>('algodrishti-article-bookmarks', [])
  const [savedOnly, setSavedOnly] = useState(false)
  const modules = allModules.filter(
    (m) => `${m.name} ${m.summary} ${m.category}`.toLowerCase().includes(query.toLowerCase()) && (!savedOnly || bookmarks.includes(m.id)),
  )
  return (
    <main className="wiki-page">
      <WikiHeader />
      <h1>{tx('Algorithm encyclopedia', 'common')}</h1>
      <p className="wiki-deck">
        {tx('Explore ', 'common')}
        {tx(allModules.length, 'common')}
        {tx(
          ' guides to algorithms, data structures, problem-solving techniques and learning tools. Each guide includes its purpose, mechanics, examples and analysis.',
          'common',
        )}
      </p>
      <label className="wiki-search">
        {tx('Find a topic', 'common')}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tx('Search selection sort, shortest paths, trees…', 'common')}
        />
      </label>
      <button className="wiki-bookmark-filter" aria-pressed={savedOnly} onClick={() => setSavedOnly((value) => !value)}>
        {tx(savedOnly ? 'Show all topics' : `Bookmarked articles (${bookmarks.length})`, 'common')}
      </button>
      {tx(
        Object.entries(categoryPages).map(([category, page]) => {
          const items = modules.filter((m) => m.category === category)
          return items.length ? (
            <section key={category} className="wiki-directory-category">
              <h2>{tx(category, 'common')}</h2>
              <p>{tx(page.subtitle, 'common')}</p>
              <div className="wiki-related">
                {tx(
                  items.map((m) => (
                    <Link to={learnPath(m)} key={m.id}>
                      <strong>{tx(m.name, 'common')}</strong>
                      <span>{tx(m.summary, 'common')}</span>
                    </Link>
                  )),
                  'common',
                )}
              </div>
            </section>
          ) : null
        }),
        'common',
      )}
    </main>
  )
}
function WikiHeader() {
  useLocaleRender()

  return (
    <header className="wiki-site-header">
      <Link to="/" className="wiki-brand">
        {tx('AlgoDrishti', 'common')}
        <span>{tx('Visualize. Understand. Remember.', 'common')}</span>
      </Link>
      <Link to="/encyclopedia">{tx('Encyclopedia', 'common')}</Link>
      <AccountControl />
    </header>
  )
}
export function EncyclopediaPage() {
  useLocaleRender()

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
        <h1>{tx('Topic not found', 'common')}</h1>
        <Link to="/encyclopedia">{tx('Browse the encyclopedia', 'common')}</Link>
      </main>
    )
  const saved = bookmarks.includes(module.id)
  return (
    <main className="wiki-page">
      <WikiHeader />
      <nav aria-label={tx('Breadcrumb', 'common')} className="wiki-breadcrumb">
        <Link to="/">{tx('Home', 'common')}</Link>
        <span>/</span>
        <Link to="/encyclopedia">{tx('Encyclopedia', 'common')}</Link>
        <span>/</span>
        <Link to={algorithmPath(module)}>{tx(module.name, 'common')}</Link>
        <span>{tx('/ Theory', 'common')}</span>
      </nav>
      <nav className="wiki-actions" aria-label={tx('Algorithm sections', 'common')}>
        <button aria-pressed="true">{tx('Learn', 'common')}</button>
        <button onClick={() => navigate(algorithmPath(module) + '#problem-input')}>{tx('Edit input', 'common')}</button>
        <Link to={algorithmPath(module)}>
          <Play size={16} />
          {tx(' Visualization', 'common')}
        </Link>
        <button aria-pressed={saved} onClick={() => setBookmarks((items) => (saved ? items.filter((x) => x !== module.id) : [...items, module.id]))}>
          {tx(saved ? <Check size={16} /> : <Bookmark size={16} />, 'common')} {tx(saved ? 'Bookmarked' : 'Bookmark article', 'common')}
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
          {tx(copied ? 'Link copied' : 'Copy page link', 'common')}
        </button>
        <span aria-live="polite">{tx(saved ? 'Saved in this browser' : '', 'common')}</span>
      </nav>
      <AlgorithmArticle module={module} />
      <footer className="wiki-footer">
        {tx('AlgoDrishti · AIMER Society · ', 'common')}
        <Link to="/encyclopedia">{tx('Keep exploring', 'common')}</Link>
      </footer>
    </main>
  )
}
