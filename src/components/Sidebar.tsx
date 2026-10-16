import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown, Home, LockKeyhole, Settings2 } from 'lucide-react'
import type { AlgorithmCategory } from '../types'
import { allModules } from '../algorithms'
import { sidebarNavigation } from '../data/sidebarNavigation'
import { algorithmPath } from '../utils/routing'
import { categoryIcon } from './navigation'
import './sidebar.css'

type SidebarProps = {
  activeCategory?: AlgorithmCategory
  activeId?: string
  chooseAlgorithm?: (id: string) => void
  iconStyle?: string
  onNavigate?: () => void
  onExpand?: () => void
  recentIds?: string[]
  setIconStyle?: (style: string) => void
}

export function Sidebar({ activeCategory, activeId, chooseAlgorithm, iconStyle = 'study', onNavigate, onExpand, recentIds = [], setIconStyle }: SidebarProps) {
  const { pathname, key: historyKey } = useLocation()
  const routeKey = `${historyKey}:${pathname}`
  const isHome = pathname === '/'
  const blueRail = /\/graphs\/(bfs-traversal|daa-bfs)$/.test(pathname)
  const routeCategory = isHome
    ? undefined
    : (sidebarNavigation.find((group) => group.items.some((item) => item.aliases.some((id) => id === activeId || pathname.endsWith('/' + id))))?.category ??
      activeCategory)
  const [selection, setSelection] = useState<{ route: string; category?: AlgorithmCategory }>({ route: routeKey, category: routeCategory })
  // Route changes always reveal their parent; manual accordion changes belong to that route only.
  const expanded = selection.route === routeKey ? selection.category : routeCategory
  if (selection.route !== routeKey) setSelection({ route: routeKey, category: routeCategory })
  const navigation = useRef<HTMLElement>(null)
  const selectedLink = useRef<HTMLAnchorElement>(null)
  useEffect(() => {
    const region = navigation.current
    if (!region) return
    try {
      region.scrollTop = Number(sessionStorage.getItem('algodrishti-sidebar-scroll') ?? 0)
    } catch {
      /* Navigation also works when storage is unavailable. */
    }
  }, [])
  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        const region = navigation.current,
          link = selectedLink.current
        if (!region || !link) return
        const bounds = region.getBoundingClientRect(),
          item = link.getBoundingClientRect()
        if (item.top < bounds.top + 8) region.scrollTop -= bounds.top - item.top + 12
        else if (item.bottom > bounds.bottom - 8) region.scrollTop += item.bottom - bounds.bottom + 12
      },
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 230,
    )
    return () => window.clearTimeout(timer)
  }, [pathname, routeKey])
  return (
    <aside className="sidebar global-sidebar" data-icon-style={iconStyle} aria-label="AlgoDrishti sidebar">
      <header className="sidebar-header">
        <Link className="brand" to="/" onClick={onNavigate} aria-label="AlgoDrishti home">
          <svg className="sidebar-logo" viewBox="0 0 44 44" aria-hidden="true">
            <defs>
              <linearGradient id="sidebar-logo-blue" x2="1" y2="1">
                <stop stopColor="#083faa" />
                <stop offset="1" stopColor="#1684ff" />
              </linearGradient>
            </defs>
            <path d="M18 3h9l17 36H33L22 15 11 39H0Z" fill="url(#sidebar-logo-blue)" />
            <path d="m9 29 6-10 8 15H12l-2 5H0l5-10Z" fill="#45adff" />
            <path d="m27 3-5 12 6 14h12Z" fill="#0a3094" />
            <path d="M15 29h14l4 10H11Z" fill="#b7e5ff" />
            <path d="m15 29 7-14 6 14Z" fill="#edf8ff" />
          </svg>
          <div>
            <strong>AlgoDrishti</strong>
            <span>Visualize every step</span>
          </div>
        </Link>
      </header>
      <nav
        className="sidebar-navigation"
        aria-label="Algorithm navigation"
        ref={navigation}
        onScroll={(event) => {
          try {
            sessionStorage.setItem('algodrishti-sidebar-scroll', String(event.currentTarget.scrollTop))
          } catch {
            /* Optional scroll memory. */
          }
        }}
      >
        <Link
          ref={isHome ? selectedLink : undefined}
          className={`sidebar-home ${isHome ? 'active' : ''}`}
          aria-current={isHome ? 'page' : undefined}
          to="/"
          onClick={onNavigate}
          title="Home dashboard"
        >
          <Home size={19} />
          <span>Home dashboard</span>
        </Link>
        <div className="sidebar-section-label">ALGORITHMS</div>
        <div className="category-list">
          {sidebarNavigation.map(({ category, items }, index) => {
            const open = category === expanded,
              current = category === routeCategory,
              panelId = `sidebar-category-${index}`
            return (
              <section className="sidebar-category" key={category}>
                <button
                  type="button"
                  className={`sidebar-category-toggle ${current ? 'current' : ''} ${open ? 'expanded' : ''}`}
                  aria-expanded={open}
                  aria-controls={panelId}
                  title={category}
                  onClick={() => {
                    setSelection({ route: routeKey, category: open ? undefined : category })
                    onExpand?.()
                  }}
                >
                  <span className="category-icon">{categoryIcon(category, 19)}</span>
                  <span className="sidebar-category-label">{category}</span>
                  <ChevronDown className="sidebar-chevron" size={14} />
                </button>
                <div id={panelId} className={`sidebar-accordion ${open ? 'is-open' : ''}`} inert={!open ? true : undefined} aria-hidden={!open}>
                  <div className="sidebar-accordion-clip">
                    <div className="sidebar-submenu">
                      {items.map((item) => {
                        const active = !isHome && item.aliases.some((id) => id === activeId || pathname.endsWith('/' + id))
                        return (
                          <Link
                            key={item.id}
                            ref={active ? selectedLink : undefined}
                            className={`sidebar-algorithm ${active ? 'active' : ''}`}
                            aria-current={active ? 'page' : undefined}
                            to={item.path}
                            title={item.label}
                            onClick={(event) => {
                              if (chooseAlgorithm && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) {
                                event.preventDefault()
                                chooseAlgorithm(item.id)
                              }
                              onNavigate?.()
                            }}
                          >
                            {item.label}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </section>
            )
          })}
        </div>
        {recentIds.length > 0 && (
          <details open={blueRail || undefined} className="sidebar-utilities recent-box">
            <summary>Recently explored</summary>
            {recentIds.slice(0, 5).map((id) => {
              const module = allModules.find((item) => item.id === id)
              return module ? (
                <Link key={id} to={algorithmPath(module)} title={module.name} onClick={onNavigate}>
                  {module.name}
                </Link>
              ) : null
            })}
          </details>
        )}
        {setIconStyle && (
          <details open={blueRail || undefined} className="sidebar-utilities icon-style-panel">
            <summary>
              <Settings2 size={14} />
              Icon style
            </summary>
            <div>
              {['study', 'sim', 'neon'].map((style) => (
                <button type="button" key={style} aria-pressed={iconStyle === style} onClick={() => setIconStyle(style)}>
                  {style}
                </button>
              ))}
            </div>
          </details>
        )}
      </nav>
      <footer className="sidebar-footer">
        <LockKeyhole size={16} />
        <span>
          {blueRail ? 'Browser-only workspace' : 'Learn at your own pace.'}
          <small>{blueRail ? 'Inputs, keys, reports and experiments stay local to your browser.' : 'Your work stays in this browser.'}</small>
        </span>
      </footer>
    </aside>
  )
}
