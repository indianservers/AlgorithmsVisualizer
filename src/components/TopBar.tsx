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
  PanelLeft,
  Play,
  RotateCcw,
  Save,
  Search,
  Settings,
  Square,
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
          Visualizer
        </button>
        <button className={viewMode === 'compare' ? 'active' : ''} type="button" onClick={() => setViewMode('compare')}>
          <BarChart3 size={16} />
          Compare
        </button>
      </div>
      <div className="top-actions">
        <button
          className="icon-button btn-data"
          type="button"
          onClick={() => setSidebarCollapsed((value) => !value)}
          title="Collapse or expand category sidebar"
          aria-label="Collapse or expand category sidebar"
          aria-pressed={sidebarCollapsed}
        >
          {sidebarCollapsed ? <Menu size={16} /> : <PanelLeft size={16} />}
        </button>
        <button
          className="icon-button btn-export"
          type="button"
          onClick={() => setFullCanvas((value) => !value)}
          title="Toggle full canvas"
          aria-label="Toggle full canvas"
          aria-pressed={fullCanvas}
        >
          <Maximize2 size={16} />
        </button>
        <button
          className="icon-button btn-export"
          type="button"
          onClick={() => setFocusMode((value) => !value)}
          title="Focus mode: canvas and controls only"
          aria-label="Toggle focus mode"
          aria-pressed={focusMode}
        >
          <Square size={16} />
        </button>
        <button
          className="icon-button btn-data"
          type="button"
          onClick={() => copyText('Algorithm link', window.location.href)}
          title="Copy link"
          aria-label="Copy algorithm link"
        >
          <LinkIcon size={16} />
        </button>
        <button className="icon-button btn-data" type="button" onClick={openCommandPalette} title="Open command palette" aria-label="Open command palette">
          <Search size={16} />
        </button>
        <button
          className="icon-button btn-data"
          type="button"
          onClick={() => setSettingsOpen((value) => !value)}
          title="Open settings"
          aria-label="Open settings"
        >
          <Settings size={16} />
        </button>
        <button className="btn-export" type="button" onClick={() => setExportsOpen((value) => !value)} title="Open export menu">
          <Download size={16} />
          Export
        </button>
        <span className="pwa-status">Offline ready</span>
        <button className="btn-save" type="button" onClick={saveExperiment} disabled={saving || !stepsLength}>
          <Save size={16} />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
      <div ref={menuRef}>
        {exportsOpen && (
          <div className="top-menu export-menu">
            <label className="file-button">
              <Upload size={16} />
              <span>Load data</span>
              <input accept=".csv,.json,.txt" type="file" onChange={(event) => onFileLoad(event.target.files?.[0])} />
            </label>
            <button type="button" onClick={exportSvg}>
              <Download size={16} />
              Export SVG
            </button>
            <button type="button" onClick={exportPng}>
              <ImageDown size={16} />
              Export PNG
            </button>
            <button type="button" onClick={exportJson}>
              <FileJson size={16} />
              Export JSON
            </button>
            <button type="button" onClick={() => downloadText(`${activeModule.id}-notes.json`, JSON.stringify(notes, null, 2), 'application/json')}>
              Export notes
            </button>
            <label className="file-button">
              <Upload size={16} />
              <span>Import notes</span>
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
              WebM/GIF status
            </button>
          </div>
        )}
        {settingsOpen && (
          <div className="top-menu settings-menu">
            <h2>Settings</h2>
            <button type="button" onClick={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}>
              {theme === 'dark' ? 'Light theme' : 'Dark theme'}
            </button>
            <button type="button" onClick={() => setDensity((value) => (value === 'compact' ? 'comfortable' : 'compact'))}>
              {density === 'compact' ? 'Comfort density' : 'Compact density'}
            </button>
            <button type="button" onClick={() => setClassroomMode((value) => !value)}>
              {classroomMode ? 'Classroom off' : 'Classroom mode'}
            </button>
            <button type="button" onClick={() => setReducedMotion((value) => !value)}>
              {reducedMotion ? 'Enable motion' : 'Reduce motion'}
            </button>
            <button type="button" onClick={resetUiSettings}>
              <RotateCcw size={16} />
              Reset UI settings
            </button>
            <button className="btn-danger" type="button" onClick={clearLocalData} disabled={saving}>
              Clear local data
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
