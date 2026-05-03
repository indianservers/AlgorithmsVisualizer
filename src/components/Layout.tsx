import type { CSSProperties, ReactNode } from 'react'

type LayoutProps = {
  children: ReactNode
  focusMode: boolean
  fullCanvas: boolean
  rightPanelWidth: number
  sidebarCollapsed: boolean
  sidebar: ReactNode
  toasts: ReactNode
}

export function Layout({ children, focusMode, fullCanvas, rightPanelWidth, sidebar, sidebarCollapsed, toasts }: LayoutProps) {
  return (
    <main
      className={`app-shell ${fullCanvas ? 'full-canvas' : ''} ${focusMode ? 'focus-mode' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
      style={{ '--right-panel-width': `${rightPanelWidth}px` } as CSSProperties}
    >
      {sidebar}
      {children}
      {toasts}
    </main>
  )
}
