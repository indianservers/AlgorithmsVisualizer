// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
import { AccountControl } from '../account/AccountControl'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, CheckCheck, GraduationCap, Layers, Moon, Play, Search, Sparkles, Sun } from 'lucide-react'
import { allModules } from '../algorithms'
import { categories, categoryPages } from '../data/catalog'
import { algorithmPath } from '../utils/routing'
import './home.css'
import { Layout } from '../components/Layout'
import { Sidebar } from '../components/Sidebar'

function storedIds(key: string): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

const lessons = allModules.filter((module) => module.id !== 'syllabus-dashboard')
const paths = [
  {
    title: 'Start with the fundamentals',
    text: 'Build intuition with sorting, searching and algorithm analysis.',
    ids: ['bubble-sort', 'binary-search'],
    tag: 'START HERE',
    color: 'blue',
  },
  {
    title: 'Think in graphs',
    text: 'Explore connections, traversals and shortest paths.',
    ids: ['bfs-traversal', 'dfs-traversal'],
    tag: 'EXPLORE',
    color: 'purple',
  },
  {
    title: 'Explore DAA concepts',
    text: 'Build your understanding of algorithm design and analysis.',
    ids: ['syllabus-dashboard'],
    tag: 'CONCEPT LIBRARY',
    color: 'green',
  },
]

export function HomeDashboard() {
  useLocaleRender()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [theme, setTheme] = useState(() => (localStorage.getItem('algodrishti-theme') === 'dark' ? 'dark' : 'light'))
  const [saved] = useState(() => ({
    completed: storedIds('algodrishti-completed'),
    recent: storedIds('algodrishti-recent'),
    favorites: storedIds('algodrishti-favorites'),
    last: localStorage.getItem('algodrishti-last-algorithm'),
  }))
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('algodrishti-theme', theme)
  }, [theme])
  const completed = lessons.filter((module) => saved.completed.includes(module.id)).length
  const resume = lessons.find((module) => module.id === saved.last)
  const recent = [...new Set(saved.recent)]
    .map((id) => lessons.find((module) => module.id === id))
    .filter((module) => module !== undefined)
    .slice(0, 4)
  const favorites = lessons.filter((module) => saved.favorites.includes(module.id)).slice(0, 4)
  const results = query.trim()
    ? lessons.filter((module) => `${module.name} ${module.category} ${module.summary}`.toLowerCase().includes(query.trim().toLowerCase()))
    : []
  return (
    <Layout
      focusMode={false}
      fullCanvas={false}
      mobileMenuOpen={mobileMenuOpen}
      setMobileMenuOpen={setMobileMenuOpen}
      rightPanelWidth={360}
      sidebarCollapsed={false}
      sidebar={<Sidebar onNavigate={() => setMobileMenuOpen(false)} />}
      toasts={null}
    >
      <div className="home-dashboard">
        <header className="home-header">
          <Link to="/" className="home-brand">
            <span>
              <GraduationCap size={27} />
            </span>
            <div>
              <strong>{tx('AlgoDrishti', 'common')}</strong>
              <small>{tx('Visualize every step', 'common')}</small>
            </div>
          </Link>
          <nav aria-label={tx('Home navigation', 'common')}>
            <button className="home-explore-button" type="button" onClick={() => document.getElementById('home-explore')?.scrollIntoView()}>
              {tx('Explore', 'common')}
            </button>
            <Link to="/daa/syllabus-dashboard">{tx('DAA concepts', 'common')}</Link>
            <button
              type="button"
              aria-label={tx(theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme', 'common')}
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              {tx(theme === 'light' ? <Moon size={20} /> : <Sun size={20} />, 'common')}
            </button>
          </nav>
          <Link to="/encyclopedia">{tx('Algorithm encyclopedia', 'common')}</Link>
          <AccountControl />
        </header>
        <div className="home-main">
          <section className="home-hero">
            <div className="home-hero-copy">
              <span className="home-eyebrow">
                <Sparkles size={15} />
                {tx(' A little curiosity. A lot of clarity.', 'common')}
              </span>
              <h1>
                {tx('Big ideas.', 'common')}
                <br />
                <em>{tx('One step at a time.', 'common')}</em>
              </h1>
              <p>{tx('Your playground for algorithms. Learn the idea, watch it unfold, and understand why it works.', 'common')}</p>
              <div className="home-hero-actions">
                <Link className="home-primary" to={resume ? algorithmPath(resume) : '/sorting/bubble-sort'}>
                  <Play size={18} />
                  {tx(resume ? 'Continue learning' : 'Explore Bubble Sort', 'common')}
                  <ArrowRight size={18} />
                </Link>
                <Link className="home-secondary" to="/daa/syllabus-dashboard">
                  {tx('Explore DAA concepts', 'common')}
                </Link>
              </div>
              {tx(
                resume && (
                  <small className="home-resume">
                    {tx('Pick up where you left off: ', 'common')}
                    {tx(resume.name, 'common')}
                  </small>
                ),
                'common',
              )}
            </div>
            <div className="home-art" aria-label={tx('Illustration of an array becoming sorted', 'common')}>
              <div className="home-art-top">
                <span className="home-live-dot" />
                {tx(' FROM CONFUSION TO CLARITY ', 'common')}
                <span>01 → 02 → 03</span>
              </div>
              <div className="home-art-bars">
                {tx(
                  [35, 65, 45, 90, 55, 75].map((height, index) => (
                    <div key={height} style={{ height: `${height}%` }} className={index === 2 || index === 3 ? 'home-bar-active' : ''}>
                      <span>{tx(height, 'common')}</span>
                    </div>
                  )),
                  'common',
                )}
              </div>
              <div className="home-art-caption">
                <span>
                  <Layers size={18} />
                  {tx(' Compare. Swap. Understand.', 'common')}
                </span>
                <span className="home-art-badge">{tx('O(n²)', 'common')}</span>
              </div>
              <div className="home-art-note">
                <CheckCheck size={19} />
                <div>
                  <strong>{tx('The moment it clicks.', 'common')}</strong>
                  <small>{tx('Every comparison has a reason.', 'common')}</small>
                </div>
              </div>
            </div>
          </section>
          <section className="home-stats" aria-label={tx('Your learning overview', 'common')}>
            {tx(
              [
                { icon: <BookOpen />, value: lessons.length, label: 'Catalog lessons' },
                { icon: <Play />, value: lessons.filter((module) => module.runner || module.typedRunner).length, label: 'Runnable explorations' },
                { icon: <Layers />, value: categories.length - 1, label: 'Learning categories' },
                { icon: <CheckCheck />, value: completed, label: 'Marked complete by you' },
              ].map((stat) => (
                <div key={stat.label}>
                  <span>{tx(stat.icon, 'common')}</span>
                  <strong>{tx(stat.value, 'common')}</strong>
                  <small>{tx(stat.label, 'common')}</small>
                </div>
              )),
              'common',
            )}
          </section>
          <section className="home-paths">
            <div className="home-section-heading">
              <div>
                <span className="home-kicker">{tx('CHOOSE YOUR NEXT STEP', 'common')}</span>
                <h2>{tx('A path for every curious mind', 'common')}</h2>
              </div>
              <span>{tx('Learn → Visualize → Practice', 'common')}</span>
            </div>
            <div className="home-path-grid">
              {tx(
                paths.map((path, index) => {
                  const module = allModules.find((item) => path.ids.includes(item.id))
                  return (
                    <Link key={path.title} className={`home-path ${path.color}`} to={module ? algorithmPath(module) : '/graphs'}>
                      <span className="home-path-number">0{tx(index + 1, 'common')}</span>
                      <small>{tx(path.tag, 'common')}</small>
                      <h3>{tx(path.title, 'common')}</h3>
                      <p>{tx(path.text, 'common')}</p>
                      <span className="home-path-link">
                        {tx('Let’s get started ', 'common')}
                        <ArrowRight size={18} />
                      </span>
                    </Link>
                  )
                }),
                'common',
              )}
            </div>
          </section>
          <section id="home-explore" className="home-explore">
            <div className="home-section-heading">
              <div>
                <span className="home-kicker">{tx('YOUR ALGORITHM LIBRARY', 'common')}</span>
                <h2>{tx('Find your next “aha!”', 'common')}</h2>
              </div>
              <label className="home-search">
                <Search size={19} />
                <input
                  aria-label={tx('Search lessons', 'common')}
                  placeholder={tx('Search algorithms or topics…', 'common')}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
            </div>
            {tx(
              query.trim() ? (
                <div className="home-search-results" aria-live="polite">
                  <p>
                    {tx(results.length, 'common')}
                    {tx(' matching lessons', 'common')}
                  </p>
                  {tx(
                    results.map((module) => (
                      <Link key={module.id} to={algorithmPath(module)}>
                        <div>
                          <strong>{tx(module.name, 'common')}</strong>
                          <small>{tx(module.category, 'common')}</small>
                        </div>
                        <ArrowRight size={18} />
                      </Link>
                    )),
                    'common',
                  )}
                  {tx(results.length === 0 && <p>{tx('Try sorting, graphs, knapsack or complexity.', 'common')}</p>, 'common')}
                </div>
              ) : (
                <div className="home-category-grid">
                  {tx(
                    categories
                      .filter((category) => category !== 'DAA Concepts')
                      .map((category, index) => (
                        <Link to={`/${categoryPages[category].slug}`} key={category} className="home-category">
                          <span style={{ color: categoryPages[category].accent }}>{tx(String(index + 1).padStart(2, '0'), 'common')}</span>
                          <div>
                            <h3>{tx(category, 'common')}</h3>
                            <small>
                              {tx(lessons.filter((module) => module.category === category).length, 'common')}
                              {tx(' lessons', 'common')}
                            </small>
                          </div>
                          <ArrowRight size={18} />
                        </Link>
                      )),
                    'common',
                  )}
                </div>
              ),
              'common',
            )}
          </section>
          {tx(
            (recent.length > 0 || favorites.length > 0) && (
              <section className="home-personal">
                {tx(
                  [
                    { title: 'Recently explored', modules: recent },
                    { title: 'Your favorites', modules: favorites },
                  ]
                    .filter((group) => group.modules.length > 0)
                    .map((group) => (
                      <div key={group.title}>
                        <h2>{tx(group.title, 'common')}</h2>
                        {tx(
                          group.modules.map((module) => (
                            <Link key={module.id} to={algorithmPath(module)}>
                              {tx(module.name, 'common')}
                              <ArrowRight size={17} />
                            </Link>
                          )),
                          'common',
                        )}
                      </div>
                    )),
                  'common',
                )}
              </section>
            ),
            'common',
          )}
          <section className="home-syllabus">
            <GraduationCap size={36} />
            <div>
              <h2>{tx('Build a deeper understanding of algorithms', 'common')}</h2>
              <p>{tx('Browse core and advanced concepts, explore worked examples, and follow your own learning path.', 'common')}</p>
            </div>
            <Link to="/daa/syllabus-dashboard">
              {tx('Open concept library ', 'common')}
              <ArrowRight size={18} />
            </Link>
          </section>
        </div>
        <footer className="home-footer">
          <strong>{tx('Learn. Visualize. Grow.', 'common')}</strong>
          <span>{tx('Your learning progress and experiments stay in this browser.', 'common')}</span>
        </footer>
      </div>
    </Layout>
  )
}
