import { Menu, X } from 'lucide-react'
import { useEffect, type CSSProperties, type Dispatch, type ReactNode, type SetStateAction } from 'react'

type LayoutProps = {
  children: ReactNode
  focusMode: boolean
  fullCanvas: boolean
  mobileMenuOpen: boolean
  rightPanelWidth: number
  setMobileMenuOpen: Dispatch<SetStateAction<boolean>>
  sidebarCollapsed: boolean
  sidebar: ReactNode
  toasts: ReactNode
}

export function Layout({
  children,
  focusMode,
  fullCanvas,
  mobileMenuOpen,
  rightPanelWidth,
  setMobileMenuOpen,
  sidebar,
  sidebarCollapsed,
  toasts,
}: LayoutProps) {
  useEffect(() => {
    if (!mobileMenuOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileMenuOpen, setMobileMenuOpen])

  return (
    <main
      className={`app-shell ${fullCanvas ? 'full-canvas' : ''} ${focusMode ? 'focus-mode' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${mobileMenuOpen ? 'mobile-menu-open' : ''}`}
      style={{ '--right-panel-width': `${rightPanelWidth}px` } as CSSProperties}
    >
      <button className="mobile-menu-fab" type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
        <Menu size={18} />
        Menu
      </button>
      <button className="mobile-menu-backdrop" type="button" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)} />
      <div className="mobile-drawer-shell" aria-hidden={!mobileMenuOpen}>
        <button className="mobile-drawer-close" type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
          <X size={18} />
        </button>
        {sidebar}
      </div>
      {children}
      {toasts}
    </main>
  )
}
