// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
import { AccountControl } from '../account/AccountControl'
import type { Dispatch, SetStateAction } from 'react'
import { useEffect, useRef } from 'react'
import {
  BarChart3,
  Download,
  FileJson,
  ImageDown,
  Link as LinkIcon,
  Maximize2,
  Menu,
  Moon,
  PanelLeft,
  Play,
  RotateCcw,
  Save,
  Search,
  Settings,
  Square,
  Sun,
  Upload,
} from 'lucide-react'
import type { AlgorithmModule } from '../types'

type TopBarProps = {
  activeModule: AlgorithmModule
  classroomMode: boolean
  clearLocalData: () => void
  copyText: (label: string, value: string) => void
  density: string
  downloadText: (filename: string, value: string, type?: string) => void
  exportJson: () => void
  exportPng: () => void
  exportSvg: () => void
  exportsOpen: boolean
  focusMode: boolean
  fullCanvas: boolean
  notes: Record<string, string>
  onFileLoad: (file?: File) => Promise<void>
  openCommandPalette: () => void
  pushToast: (message: string) => void
  reducedMotion: boolean
  resetUiSettings: () => void
  saveExperiment: () => void
  saving: boolean
  setClassroomMode: Dispatch<SetStateAction<boolean>>
  setDensity: Dispatch<SetStateAction<string>>
  setExportsOpen: Dispatch<SetStateAction<boolean>>
  setFocusMode: Dispatch<SetStateAction<boolean>>
  setFullCanvas: Dispatch<SetStateAction<boolean>>
  setNotes: Dispatch<SetStateAction<Record<string, string>>>
  setReducedMotion: Dispatch<SetStateAction<boolean>>
  setSettingsOpen: Dispatch<SetStateAction<boolean>>
  setSidebarCollapsed: Dispatch<SetStateAction<boolean>>
  setTheme: Dispatch<SetStateAction<string>>
  setViewMode: Dispatch<SetStateAction<'visualize' | 'compare'>>
  settingsOpen: boolean
  sidebarCollapsed: boolean
  stepsLength: number
  theme: string
  viewMode: 'visualize' | 'compare'
}

export function TopBar({
  activeModule,
  classroomMode,
  clearLocalData,
  copyText,
  density,
  downloadText,
  exportJson,
  exportPng,
  exportSvg,
  exportsOpen,
  focusMode,
  fullCanvas,
  notes,
  onFileLoad,
  openCommandPalette,
  pushToast,
  reducedMotion,
  resetUiSettings,
  saveExperiment,
  saving,
  setClassroomMode,
  setDensity,
  setExportsOpen,
  setFocusMode,
  setFullCanvas,
  setNotes,
  setReducedMotion,
  setSettingsOpen,
  setSidebarCollapsed,
  setTheme,
  setViewMode,
  settingsOpen,
  sidebarCollapsed,
  stepsLength,
  theme,
  viewMode,
}: TopBarProps) {
  useLocaleRender()

  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!exportsOpen && !settingsOpen) return
    const closeMenus = () => {
      setExportsOpen(false)
      setSettingsOpen(false)
    }
    const onPointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return
      closeMenus()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenus()
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [exportsOpen, setExportsOpen, setSettingsOpen, settingsOpen])

  return (
    <header className="topbar">
      <div className="view-switch">
        <button className={viewMode === 'visualize' ? 'active' : ''} type="button" onClick={() => setViewMode('visualize')}>
          <Play size={16} />
          {tx('Algorithms', 'common')}
        </button>
        <button className={viewMode === 'compare' ? 'active' : ''} type="button" onClick={() => setViewMode('compare')}>
          <BarChart3 size={16} />
          {tx('Compare', 'common')}
        </button>
      </div>
      <div className="top-actions">
        <AccountControl />
        <button
          className="icon-button btn-data desktop-sidebar-toggle"
          type="button"
          onClick={() => setSidebarCollapsed((value) => !value)}
          title={tx('Collapse or expand category sidebar', 'common')}
          aria-label={tx('Collapse or expand category sidebar', 'common')}
          aria-pressed={sidebarCollapsed}
        >
          {tx(sidebarCollapsed ? <Menu size={16} /> : <PanelLeft size={16} />, 'common')}
        </button>
        <button
          className="icon-button btn-export mobile-low-priority"
          type="button"
          onClick={() => setFullCanvas((value) => !value)}
          title={tx('Toggle full canvas', 'common')}
          aria-label={tx('Toggle full canvas', 'common')}
          aria-pressed={fullCanvas}
        >
          <Maximize2 size={16} />
        </button>
        <button
          className="icon-button btn-export mobile-low-priority"
          type="button"
          onClick={() => setFocusMode((value) => !value)}
          title={tx('Focus mode: canvas and controls only', 'common')}
          aria-label={tx('Toggle focus mode', 'common')}
          aria-pressed={focusMode}
        >
          <Square size={16} />
        </button>
        <button
          className="icon-button btn-data mobile-low-priority"
          type="button"
          onClick={() => copyText('Algorithm link', window.location.href)}
          title={tx('Copy link', 'common')}
          aria-label={tx('Copy algorithm link', 'common')}
        >
          <LinkIcon size={16} />
        </button>
        <button
          className="icon-button btn-data"
          type="button"
          onClick={openCommandPalette}
          title={tx('Open command palette', 'common')}
          aria-label={tx('Open command palette', 'common')}
        >
          <Search size={16} />
        </button>
        <button
          className="icon-button theme-toggle"
          type="button"
          onClick={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}
          title={tx(theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme', 'common')}
          aria-label={tx(theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme', 'common')}
          aria-pressed={theme === 'dark'}
        >
          {tx(theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />, 'common')}
        </button>
        <button
          className="icon-button btn-data"
          type="button"
          onClick={() => setSettingsOpen((value) => !value)}
          title={tx('Open settings', 'common')}
          aria-label={tx('Open settings', 'common')}
        >
          <Settings size={16} />
        </button>
        <button
          className="btn-export"
          aria-label={tx('Export', 'common')}
          type="button"
          onClick={() => setExportsOpen((value) => !value)}
          title={tx('Open export menu', 'common')}
        >
          <Download size={16} />
          {tx('Export', 'common')}
        </button>
        <button
          className="btn-save"
          aria-label={tx(saving ? 'Saving...' : 'Save', 'common')}
          title={tx('Save experiment', 'common')}
          type="button"
          onClick={saveExperiment}
          disabled={saving || !stepsLength}
        >
          <Save size={16} />
          {tx(saving ? 'Saving...' : 'Save', 'common')}
        </button>
      </div>
      <div ref={menuRef}>
        {tx(
          exportsOpen && (
            <div className="top-menu export-menu">
              <label className="file-button">
                <Upload size={16} />
                <span>{tx('Load data', 'common')}</span>
                <input accept=".csv,.json,.txt" type="file" onChange={(event) => onFileLoad(event.target.files?.[0])} />
              </label>
              <button type="button" onClick={exportSvg}>
                <Download size={16} />
                {tx('Export SVG', 'common')}
              </button>
              <button type="button" onClick={exportPng}>
                <ImageDown size={16} />
                {tx('Export PNG', 'common')}
              </button>
              <button type="button" onClick={exportJson}>
                <FileJson size={16} />
                {tx('Export JSON', 'common')}
              </button>
              <button type="button" onClick={() => downloadText(`${activeModule.id}-notes.json`, JSON.stringify(notes, null, 2), 'application/json')}>
                {tx('Export notes', 'common')}
              </button>
              <label className="file-button">
                <Upload size={16} />
                <span>{tx('Import notes', 'common')}</span>
                <input
                  accept=".json"
                  type="file"
                  onChange={async (event) => {
                    const text = await event.target.files?.[0]?.text()
                    if (!text) return
                    try {
                      setNotes(JSON.parse(text) as Record<string, string>)
                      pushToast('Notes imported')
                    } catch {
                      pushToast('Could not import notes')
                    }
                  }}
                />
              </label>
              <button type="button" onClick={() => pushToast('WebM/GIF export is coming soon. Current exports support PNG, SVG, JSON, and CSV.')}>
                {tx('WebM/GIF status', 'common')}
              </button>
            </div>
          ),
          'common',
        )}
        {tx(
          settingsOpen && (
            <div className="top-menu settings-menu">
              <h2>{tx('Settings', 'common')}</h2>
              <button type="button" onClick={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}>
                {tx(theme === 'dark' ? 'Light theme' : 'Dark theme', 'common')}
              </button>
              <button type="button" onClick={() => setDensity((value) => (value === 'compact' ? 'comfortable' : 'compact'))}>
                {tx(density === 'compact' ? 'Comfort density' : 'Compact density', 'common')}
              </button>
              <button type="button" onClick={() => setClassroomMode((value) => !value)}>
                {tx(classroomMode ? 'Classroom off' : 'Classroom mode', 'common')}
              </button>
              <button type="button" onClick={() => setReducedMotion((value) => !value)}>
                {tx(reducedMotion ? 'Enable motion' : 'Reduce motion', 'common')}
              </button>
              <button type="button" onClick={resetUiSettings}>
                <RotateCcw size={16} />
                {tx('Reset UI settings', 'common')}
              </button>
              <button className="btn-danger" type="button" onClick={clearLocalData} disabled={saving}>
                {tx('Clear local data', 'common')}
              </button>
            </div>
          ),
          'common',
        )}
      </div>
    </header>
  )
}
