import { LockKeyhole } from 'lucide-react'
import type { AlgorithmCategory } from '../types'
import { allModules } from '../algorithms'
import { categories } from '../data/catalog'
import { categoryIcon, menuGroupsFor, moduleIcon } from './navigation'

type SidebarProps = {
  activeCategory: AlgorithmCategory
  activeId: string
  chooseAlgorithm: (id: string) => void
  chooseCategory: (category: AlgorithmCategory) => void
  iconStyle: string
  onNavigate?: () => void
  recentIds: string[]
  setIconStyle: (style: string) => void
}

export function Sidebar({ activeCategory, activeId, chooseAlgorithm, chooseCategory, iconStyle, onNavigate, recentIds, setIconStyle }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">AD</div>
        <div>
          <strong>AlgoDrishti</strong>
          <span>Visualize every step</span>
        </div>
      </div>
      <nav className="category-list" aria-label="Algorithm categories">
        {categories.map((category) => (
          <div className="menu-group" key={category}>
            <button
              className={category === activeCategory ? 'active' : ''}
              onClick={() => {
                chooseCategory(category)
                onNavigate?.()
              }}
              type="button"
            >
              <span className={`category-icon ${iconStyle}`}>{categoryIcon(category)}</span>
              <span>{category}</span>
            </button>
            {category === activeCategory && (
              <div className="sidebar-submenu algorithm-submenu">
                {menuGroupsFor(category).map((group) => (
                  <section key={group.id}>
                    <h3>
                      <span>{group.icon}</span>
                      {group.label}
                    </h3>
                    {group.items.map((module) => (
                      <button
                        className={module.id === activeId ? 'active' : ''}
                        key={module.id}
                        onClick={() => {
                          chooseAlgorithm(module.id)
                          onNavigate?.()
                        }}
                        type="button"
                      >
                        <span>{moduleIcon(module)}</span>
                        {module.name}
                      </button>
                    ))}
                  </section>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      <section className="icon-style-panel">
        <h2>Icon style</h2>
        {(['study', 'sim', 'neon'] as const).map((style) => (
          <button className={iconStyle === style ? 'active' : ''} key={style} type="button" onClick={() => setIconStyle(style)}>
            <span>{categoryIcon('Graphs', 14)}</span>
            {style}
          </button>
        ))}
      </section>
      <section className="recent-box">
        <h2>Recent</h2>
        {recentIds.slice(0, 5).map((id) => {
          const module = allModules.find((item) => item.id === id)
          return module ? (
            <button
              key={id}
              type="button"
              onClick={() => {
                chooseAlgorithm(id)
                onNavigate?.()
              }}
            >
              {module.name}
            </button>
          ) : null
        })}
      </section>
      <section className="local-note">
        <LockKeyhole size={18} />
        <p>Browser-only workspace. Inputs, keys, reports, and experiments stay local.</p>
      </section>
    </aside>
  )
}
