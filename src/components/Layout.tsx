import { Menu, X } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties, type Dispatch, type ReactNode, type SetStateAction } from 'react'

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
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 1120px)').matches)
  const drawer = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const query = window.matchMedia('(max-width: 1120px)')
    const update = () => setIsMobile(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    if (!mobileMenuOpen || !isMobile) return
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    drawer.current?.querySelector<HTMLButtonElement>('.mobile-drawer-close')?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false)
      if (event.key === 'Tab') {
        const controls = Array.from(drawer.current?.querySelectorAll<HTMLElement>('a[href],button,summary') ?? []).filter(
          (element) => !element.closest('[inert]') && element.getClientRects().length > 0,
        )
        const first = controls[0],
          last = controls.at(-1)
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus({ preventScroll: true })
    }
  }, [mobileMenuOpen, isMobile, setMobileMenuOpen])

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
      <div
        ref={drawer}
        className="mobile-drawer-shell"
        role={isMobile && mobileMenuOpen ? 'dialog' : undefined}
        aria-modal={isMobile && mobileMenuOpen ? true : undefined}
        aria-label={isMobile && mobileMenuOpen ? 'Algorithm navigation menu' : undefined}
        aria-hidden={isMobile && !mobileMenuOpen}
        inert={isMobile && !mobileMenuOpen ? true : undefined}
      >
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
