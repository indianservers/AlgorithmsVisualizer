import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, CheckCheck, GraduationCap, Layers, Moon, Play, Search, Sparkles, Sun } from 'lucide-react'
import { allModules } from '../algorithms'
import { categories, categoryPages } from '../data/catalog'
import { algorithmPath } from '../utils/routing'
import './home.css'

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
    <div className="home-dashboard">
      <header className="home-header">
        <Link to="/" className="home-brand">
          <span>
            <GraduationCap size={27} />
          </span>
          <div>
            <strong>AlgoDrishti</strong>
            <small>Visualize every step</small>
          </div>
        </Link>
        <nav aria-label="Home navigation">
          <button className="home-explore-button" type="button" onClick={() => document.getElementById('home-explore')?.scrollIntoView()}>
            Explore
          </button>
          <Link to="/daa/syllabus-dashboard">DAA concepts</Link>
          <button
            type="button"
            aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </nav>
      </header>
      <main>
        <section className="home-hero">
          <div className="home-hero-copy">
            <span className="home-eyebrow">
              <Sparkles size={15} /> A little curiosity. A lot of clarity.
            </span>
            <h1>
              Big ideas.
              <br />
              <em>One step at a time.</em>
            </h1>
            <p>Your playground for algorithms. Learn the idea, watch it unfold, and understand why it works.</p>
            <div className="home-hero-actions">
              <Link className="home-primary" to={resume ? algorithmPath(resume) : '/sorting/bubble-sort'}>
                <Play size={18} />
                {resume ? 'Continue learning' : 'Explore Bubble Sort'}
                <ArrowRight size={18} />
              </Link>
              <Link className="home-secondary" to="/daa/syllabus-dashboard">
                Explore DAA concepts
              </Link>
            </div>
            {resume && <small className="home-resume">Pick up where you left off: {resume.name}</small>}
          </div>
          <div className="home-art" aria-label="Illustration of an array becoming sorted">
            <div className="home-art-top">
              <span className="home-live-dot" /> FROM CONFUSION TO CLARITY <span>01 → 02 → 03</span>
            </div>
            <div className="home-art-bars">
              {[35, 65, 45, 90, 55, 75].map((height, index) => (
                <div key={height} style={{ height: `${height}%` }} className={index === 2 || index === 3 ? 'home-bar-active' : ''}>
                  <span>{height}</span>
                </div>
              ))}
            </div>
            <div className="home-art-caption">
              <span>
                <Layers size={18} /> Compare. Swap. Understand.
              </span>
              <span className="home-art-badge">O(n²)</span>
            </div>
            <div className="home-art-note">
              <CheckCheck size={19} />
              <div>
                <strong>The moment it clicks.</strong>
                <small>Every comparison has a reason.</small>
              </div>
            </div>
          </div>
        </section>
        <section className="home-stats" aria-label="Your learning overview">
          {[
            { icon: <BookOpen />, value: lessons.length, label: 'Catalog lessons' },
            { icon: <Play />, value: lessons.filter((module) => module.runner || module.typedRunner).length, label: 'Runnable explorations' },
            { icon: <Layers />, value: categories.length - 1, label: 'Learning categories' },
            { icon: <CheckCheck />, value: completed, label: 'Marked complete by you' },
          ].map((stat) => (
            <div key={stat.label}>
              <span>{stat.icon}</span>
              <strong>{stat.value}</strong>
              <small>{stat.label}</small>
            </div>
          ))}
        </section>
        <section className="home-paths">
          <div className="home-section-heading">
            <div>
              <span className="home-kicker">CHOOSE YOUR NEXT STEP</span>
              <h2>A path for every curious mind</h2>
            </div>
            <span>Learn → Visualize → Practice</span>
          </div>
          <div className="home-path-grid">
            {paths.map((path, index) => {
              const module = allModules.find((item) => path.ids.includes(item.id))
              return (
                <Link key={path.title} className={`home-path ${path.color}`} to={module ? algorithmPath(module) : '/graphs'}>
                  <span className="home-path-number">0{index + 1}</span>
                  <small>{path.tag}</small>
                  <h3>{path.title}</h3>
                  <p>{path.text}</p>
                  <span className="home-path-link">
                    Let’s get started <ArrowRight size={18} />
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
        <section id="home-explore" className="home-explore">
          <div className="home-section-heading">
            <div>
              <span className="home-kicker">YOUR ALGORITHM LIBRARY</span>
              <h2>Find your next “aha!”</h2>
            </div>
            <label className="home-search">
              <Search size={19} />
              <input aria-label="Search lessons" placeholder="Search algorithms or topics…" value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
          </div>
          {query.trim() ? (
            <div className="home-search-results" aria-live="polite">
              <p>{results.length} matching lessons</p>
              {results.map((module) => (
                <Link key={module.id} to={algorithmPath(module)}>
                  <div>
                    <strong>{module.name}</strong>
                    <small>{module.category}</small>
                  </div>
                  <ArrowRight size={18} />
                </Link>
              ))}
              {results.length === 0 && <p>Try sorting, graphs, knapsack or complexity.</p>}
            </div>
          ) : (
            <div className="home-category-grid">
              {categories
                .filter((category) => category !== 'DAA Concepts')
                .map((category, index) => (
                  <Link to={`/${categoryPages[category].slug}`} key={category} className="home-category">
                    <span style={{ color: categoryPages[category].accent }}>{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <h3>{category}</h3>
                      <small>{lessons.filter((module) => module.category === category).length} lessons</small>
                    </div>
                    <ArrowRight size={18} />
                  </Link>
                ))}
            </div>
          )}
        </section>
        {(recent.length > 0 || favorites.length > 0) && (
          <section className="home-personal">
            {[
              { title: 'Recently explored', modules: recent },
              { title: 'Your favorites', modules: favorites },
            ]
              .filter((group) => group.modules.length > 0)
              .map((group) => (
                <div key={group.title}>
                  <h2>{group.title}</h2>
                  {group.modules.map((module) => (
                    <Link key={module.id} to={algorithmPath(module)}>
                      {module.name}
                      <ArrowRight size={17} />
                    </Link>
                  ))}
                </div>
              ))}
          </section>
        )}
        <section className="home-syllabus">
          <GraduationCap size={36} />
          <div>
            <h2>Build a deeper understanding of algorithms</h2>
            <p>Browse core and advanced concepts, explore worked examples, and follow your own learning path.</p>
          </div>
          <Link to="/daa/syllabus-dashboard">
            Open concept library <ArrowRight size={18} />
          </Link>
        </section>
      </main>
      <footer className="home-footer">
        <strong>Learn. Visualize. Grow.</strong>
        <span>Your learning progress and experiments stay in this browser.</span>
      </footer>
    </div>
  )
}
