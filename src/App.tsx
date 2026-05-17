import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import './App.css'
import type { AlgorithmCategory, AlgorithmModule, AnimationQuality, LearningTab, QuizScore, SavedExperiment } from './types'
import { algorithmModules, allModules, baseMetrics } from './algorithms'
import { categoryPages } from './data/catalog'
import { db } from './storage/db'
import { BottomPanel } from './components/BottomPanel'
import { CommandPalette } from './components/CommandPalette'
import { CompareView } from './components/CompareView'
import { Controls } from './components/Controls'
import { Layout } from './components/Layout'
import { MobileCategoryTabs } from './components/MobileCategoryTabs'
import { RightPanel } from './components/RightPanel'
import { RouteFallback } from './components/RouteFallback'
import { RouteTransitionSkeleton } from './components/Skeleton'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { Visualizer } from './components/Visualizer'
import { codeLinesFor, learningGuideFor, pseudocodeIndexFor, stepReason } from './guides'
import { persistentBoolean, persistentNumber, persistentString, usePersistentState } from './hooks/usePersistentState'
import { getInputDiagnostics, isSortedAscending, parseInput, randomArray, safeJsonValue, sortedCopyText } from './utils/input'
import { algorithmPath, filteredModulesForCategory, resolveRouteState } from './utils/routing'
import { runDisabledReason } from './utils/validation'
import { buildStepLogCsv, downloadBlob, downloadText as saveText, exportPngFrame, exportSvgFrame } from './exports'

const MAX_VISUAL_STEPS = 1000

function AimerSiteFooter() {
  return (
    <footer className="aimer-site-footer">
      <div>
        <strong>www.AimerSociety.com</strong>
        <span>AI Learning Tools</span>
      </div>
      <p>Artificial Intelligence Medical &amp; Engineering Researchers Society Tools</p>
      <small>All rights reserved.</small>
    </footer>
  )
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const { categorySlug, algorithmSlug } = useParams()
  const wildcardParts = !categorySlug && location.pathname !== '/' ? location.pathname.split('/').filter(Boolean) : []
  const routeCategorySlug = categorySlug ?? wildcardParts[0]
  const routeAlgorithmSlug = algorithmSlug ?? wildcardParts[1]
  const [lastAlgorithmId, setLastAlgorithmId] = usePersistentState('algodrishti-last-algorithm', 'bubble-sort', persistentString)
  const routeState = useMemo(
    () => resolveRouteState(routeCategorySlug, routeAlgorithmSlug, lastAlgorithmId),
    [lastAlgorithmId, routeAlgorithmSlug, routeCategorySlug],
  )
  const activeCategory = routeState.activeCategory
  const activeModule = routeState.activeModule
  const activeId = activeModule.id
  const activePage = categoryPages[activeCategory]

  const [inputText, setInputText] = usePersistentState('algodrishti-input', '42, 18, 67, 9, 31, 73, 54, 26, 88, 12', persistentString)
  const [target, setTarget] = usePersistentState('algodrishti-target', 31, persistentNumber)
  const [size, setSize] = usePersistentState('algodrishti-size', 10, persistentNumber)
  const [dataMode, setDataMode] = usePersistentState('algodrishti-data-mode', 'random', persistentString)
  const [speed, setSpeed] = usePersistentState('algodrishti-speed', 520, persistentNumber)
  const [theme, setTheme] = usePersistentState('algodrishti-theme', 'light', persistentString)
  const [density, setDensity] = usePersistentState('algodrishti-density', 'comfortable', persistentString)
  const [classroomMode, setClassroomMode] = usePersistentState('algodrishti-classroom', false, persistentBoolean)
  const [sidebarCollapsed, setSidebarCollapsed] = usePersistentState('algodrishti-sidebar-collapsed', false, persistentBoolean)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [rightPanelWidth, setRightPanelWidth] = usePersistentState('algodrishti-right-panel-width', 360, persistentNumber)
  const [reducedMotion, setReducedMotion] = usePersistentState('algodrishti-reduced-motion', false, persistentBoolean)
  const [showValues, setShowValues] = usePersistentState('algodrishti-show-values', true, persistentBoolean)
  const [showIndices, setShowIndices] = usePersistentState('algodrishti-show-indices', true, persistentBoolean)
  const [canvasZoom, setCanvasZoom] = usePersistentState('algodrishti-canvas-zoom', 100, persistentNumber)
  const [stepPalette, setStepPalette] = usePersistentState<Record<string, string>>('algodrishti-step-palette', {})
  const [animationQuality, setAnimationQuality] = usePersistentState<AnimationQuality>('algodrishti-animation-quality', 'detailed', persistentString as never)
  const [showStateComparison, setShowStateComparison] = usePersistentState('algodrishti-state-comparison', false, persistentBoolean)
  const [favorites, setFavorites] = usePersistentState<string[]>('algodrishti-favorites', () => safeJsonValue('algodrishti-favorites', []))
  const [recentIds, setRecentIds] = usePersistentState<string[]>('algodrishti-recent', () => safeJsonValue('algodrishti-recent', []))
  const [iconStyle, setIconStyle] = usePersistentState('algodrishti-icon-style', 'study', persistentString)
  const [notes, setNotes] = usePersistentState<Record<string, string>>('algodrishti-notes', () => safeJsonValue('algodrishti-notes', {}))
  const [completed, setCompleted] = usePersistentState<string[]>('algodrishti-completed', () => safeJsonValue('algodrishti-completed', []))
  const [quizScores, setQuizScores] = usePersistentState<Record<string, QuizScore>>('algodrishti-quiz-scores', {})
  const [reviewDueDates, setReviewDueDates] = usePersistentState<Record<string, string>>('algodrishti-review-due', {})

  const [stepIndex, setStepIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [saved, setSaved] = useState<SavedExperiment[]>([])
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [loadingSaved, setLoadingSaved] = useState(true)
  const [viewMode, setViewMode] = useState<'visualize' | 'compare'>('visualize')
  const [exportsOpen, setExportsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [algorithmQuery, setAlgorithmQuery] = useState('')
  const [compareCategory, setCompareCategory] = useState<'Sorting' | 'Searching'>('Sorting')
  const [comparedIds, setComparedIds] = useState<string[]>(['bubble-sort', 'selection-sort', 'insertion-sort', 'quick-sort'])
  const [fullCanvas, setFullCanvas] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(() => localStorage.getItem('algodrishti-onboarded') !== 'true')
  const [pauseOn, setPauseOn] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'planned'>('all')
  const [visualFilter, setVisualFilter] = useState<'all' | AlgorithmModule['visualMode']>('all')
  const [complexityFilter, setComplexityFilter] = useState<'all' | 'log' | 'linear' | 'nlogn' | 'quadratic'>('all')
  const [learningTab, setLearningTab] = useState<LearningTab>('Study')
  const [practiceReveal, setPracticeReveal] = useState(false)
  const [practiceGuess, setPracticeGuess] = useState('')
  const [routeChanging, setRouteChanging] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const [gameRevision, setGameRevision] = useState(0)
  const canvasRef = useRef<HTMLDivElement>(null)

  const pushToast = (message: string) => {
    const id = crypto.randomUUID()
    setToasts((items) => [...items.slice(-3), { id, message }])
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 4200)
  }

  const guide = useMemo(() => learningGuideFor(activeModule), [activeModule])
  const inputDiagnostics = useMemo(() => getInputDiagnostics(inputText), [inputText])
  const input = useMemo(() => inputDiagnostics.valid.slice(0, 48), [inputDiagnostics])
  const sortedInputRequired = Boolean(activeModule.flags?.includes('Requires sorted input'))
  const sortedInputValid = !sortedInputRequired || isSortedAscending(input)
  const disabledReason = runDisabledReason(activeModule, input, sortedInputValid)
  const steps = useMemo(() => {
    if (disabledReason) return []
    if (gameRevision < 0) return []
    const run = activeModule.runner?.(input, target) ?? []
    return run.length > MAX_VISUAL_STEPS ? run.slice(0, MAX_VISUAL_STEPS) : run
  }, [activeModule, disabledReason, gameRevision, input, target])
  const currentStep = steps[Math.min(stepIndex, Math.max(steps.length - 1, 0))]
  const visualData = currentStep?.dataState.length ? currentStep.dataState : input
  const finalMetrics = steps.at(-1)?.metrics ?? baseMetrics
  const maxMagnitude = Math.max(...visualData.map((value) => Math.abs(value)), 1)
  const resultText = currentStep?.type === 'complete' ? currentStep.description : ''
  const pseudoActiveIndex = pseudocodeIndexFor(currentStep, activeModule.pseudocode)
  const codeView = codeLinesFor(activeModule.code, currentStep)
  const nextStep = steps[stepIndex + 1]
  const quizScore = quizScores[activeId] ?? { correct: 0, total: 0 }
  const statusLabel = activeModule.status === 'live' ? 'Interactive' : 'Coming soon'
  const filteredModules = filteredModulesForCategory(activeCategory)
  const progressPercent = Math.round(
    (completed.filter((id) => allModules.find((module) => module.id === id)?.category === activeCategory).length / Math.max(1, filteredModules.length)) * 100,
  )
  const difficulty =
    activeModule.complexity.average === 'O(n)' || activeModule.complexity.average.includes('n²') || activeModule.complexity.average.includes('n^2')
      ? 'Beginner'
      : activeModule.complexity.average.includes('log n') || activeModule.complexity.average.includes('n log n')
        ? 'Intermediate'
        : 'Advanced'
  const correctnessText =
    activeModule.category === 'Sorting' && steps.length
      ? isSortedAscending(steps.at(-1)?.dataState ?? [])
        ? 'Correctness check: final output is sorted.'
        : 'Correctness check: final output is not sorted.'
      : sortedInputRequired && steps.length
        ? sortedInputValid
          ? 'Input assumption check: sorted input confirmed.'
          : 'Input assumption check: sorted input required.'
        : activeModule.id === 'stack' && steps.length
          ? 'Correctness check: stack ends empty after LIFO pops.'
          : activeModule.id === 'queue' && steps.length
            ? 'Correctness check: queue ends empty after FIFO dequeues.'
            : ['Graph', 'Tree'].includes(activeModule.visualMode) && steps.length
              ? 'Correctness check: traversal completed with a visited order.'
              : activeModule.category === 'Games' && steps.length
                ? activeModule.id === 'chess-minimax'
                  ? 'Game check: legal chess moves are generated and scored into a plan.'
                  : 'Game check: legal moves are generated from the current board, then the computer replies.'
                : ''
  const recommendation = activeModule.flags?.includes('Great for nearly sorted data')
    ? 'Recommended for nearly sorted data.'
    : activeModule.category === 'Searching' && activeModule.flags?.includes('Requires sorted input')
      ? 'Best when the input is already sorted.'
      : activeModule.category === 'Sorting'
        ? `Average complexity: ${activeModule.complexity.average}.`
        : activeModule.category === 'Games'
          ? 'Run the board to see threats, blocks, and simple look-ahead.'
          : 'Use this module when the data shape matches the visual mode.'
  const inputConstraints = [
    activeModule.category === 'Games'
      ? 'Supports presets, custom board text, and click-to-play moves'
      : !['Graph', 'Tree'].includes(activeModule.visualMode)
        ? 'At least one numeric value'
        : 'Uses graph/tree preset or numeric tree input',
    sortedInputRequired ? 'Input must be sorted ascending' : '',
    ['counting-sort', 'radix-sort'].includes(activeModule.id) ? 'Non-negative integers only' : '',
  ].filter(Boolean)
  const hugeRunWarning =
    steps.length >= MAX_VISUAL_STEPS
      ? `Performance warning: this run was capped at ${MAX_VISUAL_STEPS} steps.`
      : steps.length > 350
        ? `Performance warning: this run generated ${steps.length} steps.`
        : ''
  const sortedBoundary =
    activeModule.category === 'Sorting'
      ? currentStep?.type === 'complete'
        ? visualData.length
        : Math.max(
            0,
            Number(currentStep?.highlights.variables?.pass ?? 0),
            visualData.length - 1 - Number(currentStep?.highlights.variables?.end ?? visualData.length - 1),
          )
      : 0
  const pointerEntries = Object.entries(currentStep?.highlights.variables ?? {})
    .filter(([key, value]) => ['low', 'mid', 'high', 'pivot', 'pivotIndex', 'min'].includes(key) && Number.isFinite(Number(value)))
    .map(([key, value]) => ({ key, index: Number(value) }))
  const discardedRange =
    activeModule.category === 'Searching' && currentStep?.highlights.variables?.low !== undefined && currentStep?.highlights.variables?.high !== undefined
      ? { low: Number(currentStep.highlights.variables.low), high: Number(currentStep.highlights.variables.high) }
      : undefined
  const visualItems = useMemo(() => {
    const buckets = new Map<number, string[]>()
    input.forEach((value, index) => {
      const ids = buckets.get(value) ?? []
      ids.push(`${value}-${index}`)
      buckets.set(value, ids)
    })
    return visualData.map((value, index) => ({
      id: buckets.get(value)?.shift() ?? `${value}-new-${index}`,
      value,
      index,
    }))
  }, [input, visualData])
  const visiblePickerModules = filteredModules.filter((module) => {
    const text = `${module.name} ${module.summary} ${module.subcategory ?? ''}`.toLowerCase()
    const complexity = module.complexity.average.toLowerCase()
    const complexityMatch =
      complexityFilter === 'all' ||
      (complexityFilter === 'log' && complexity.includes('log')) ||
      (complexityFilter === 'linear' && complexity === 'o(n)') ||
      (complexityFilter === 'nlogn' && complexity.includes('n log n')) ||
      (complexityFilter === 'quadratic' && (complexity.includes('n^2') || complexity.includes('n²')))
    return (
      text.includes(algorithmQuery.toLowerCase()) &&
      (statusFilter === 'all' || module.status === statusFilter) &&
      (visualFilter === 'all' || module.visualMode === visualFilter) &&
      complexityMatch
    )
  })
  const comparableModules = useMemo(() => algorithmModules.filter((module) => module.category === compareCategory && module.runner), [compareCategory])
  const comparisonRows = useMemo(() => {
    return comparableModules
      .filter((module) => comparedIds.includes(module.id))
      .map((module) => {
        const run = module.runner?.(input, target) ?? []
        const metrics = run.at(-1)?.metrics ?? {}
        return {
          module,
          steps: run.length,
          comparisons: metrics.comparisons ?? 0,
          swaps: metrics.swaps ?? 0,
          reads: metrics.reads ?? 0,
          writes: metrics.writes ?? 0,
          recursiveCalls: metrics.recursiveCalls ?? 0,
          output: run.at(-1)?.dataState ?? input,
        }
      })
      .sort((a, b) => a.steps - b.steps)
  }, [comparableModules, comparedIds, input, target])
  const maxComparisonSteps = Math.max(1, ...comparisonRows.map((row) => row.steps))
  const maxComparisonComparisons = Math.max(1, ...comparisonRows.map((row) => row.comparisons))

  useEffect(() => {
    db.experiments
      .orderBy('createdAt')
      .reverse()
      .limit(6)
      .toArray()
      .then(setSaved)
      .catch(() => {
        pushToast('Local experiment storage is unavailable in this browser session')
      })
      .finally(() => setLoadingSaved(false))
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.dataset.density = density
    document.documentElement.dataset.classroom = String(classroomMode)
    document.documentElement.dataset.reducedMotion = String(reducedMotion)
  }, [theme, density, classroomMode, reducedMotion])

  useEffect(() => {
    setLastAlgorithmId(activeId)
    const resetTimer = window.setTimeout(() => {
      setStepIndex(0)
      setPlaying(false)
    }, 0)
    const timer = window.setTimeout(() => setRouteChanging(false), 120)
    return () => {
      window.clearTimeout(resetTimer)
      window.clearTimeout(timer)
    }
  }, [activeId, location.key, setLastAlgorithmId])

  useEffect(() => {
    if (!playing || !steps.length) return
    const timer = window.setTimeout(() => {
      setStepIndex((index) => {
        if (index >= steps.length - 1) {
          setPlaying(false)
          return index
        }
        if (pauseOn && steps[index + 1]?.type === pauseOn) {
          setPlaying(false)
          return index + 1
        }
        return index + 1
      })
    }, speed)
    return () => window.clearTimeout(timer)
  }, [pauseOn, playing, speed, stepIndex, steps])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement).tagName)) return
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandOpen(true)
      }
      if (event.key === ' ') {
        event.preventDefault()
        setPlaying((value) => !value)
      }
      if (event.key === 'ArrowRight') setStepIndex((index) => Math.min(steps.length - 1, index + 1))
      if (event.key === 'ArrowLeft') setStepIndex((index) => Math.max(0, index - 1))
      if (event.key === 'Home') setStepIndex(0)
      if (event.key === 'End') setStepIndex(steps.length - 1)
      if (event.key.toLowerCase() === 'r') {
        setStepIndex(0)
        setPlaying(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [steps.length])

  const resetPlayback = () => {
    setStepIndex(0)
    setPlaying(false)
  }

  const startGameInteraction = () => {
    setGameRevision((value) => value + 1)
    setStepIndex(0)
    setPlaying(true)
  }

  const resetAll = () => {
    if (!window.confirm('Reset the data, target, presets, and animation state?')) return
    setInputText('42, 18, 67, 9, 31, 73, 54, 26, 88, 12')
    setTarget(31)
    setSize(10)
    setDataMode('random')
    resetPlayback()
  }

  const chooseCategory = (category: AlgorithmCategory) => {
    const nextId = allModules.find((module) => module.category === category)?.id ?? activeId
    setRouteChanging(true)
    navigate(`/${categoryPages[category].slug}`)
    setRecentIds((ids) => [nextId, ...ids.filter((item) => item !== nextId)].slice(0, 8))
    setAlgorithmQuery('')
    resetPlayback()
  }

  const chooseAlgorithm = (id: string) => {
    const module = allModules.find((item) => item.id === id)
    if (!module) return
    setRouteChanging(true)
    navigate(algorithmPath(module))
    setRecentIds((ids) => [id, ...ids.filter((item) => item !== id)].slice(0, 8))
    resetPlayback()
  }

  const toggleComparedAlgorithm = (id: string) => {
    setComparedIds((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]))
  }

  const toggleFavorite = (id: string) => {
    setFavorites((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]))
  }

  const toggleComplete = (id: string) => {
    setCompleted((ids) => {
      const isCompleting = !ids.includes(id)
      if (isCompleting) {
        setReviewDueDates((dates) => ({
          ...dates,
          [id]: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }))
      }
      return isCompleting ? [...ids, id] : ids.filter((item) => item !== id)
    })
  }

  const resetFilters = () => {
    setAlgorithmQuery('')
    setStatusFilter('all')
    setVisualFilter('all')
    setComplexityFilter('all')
  }

  const resetUiSettings = () => {
    setTheme('light')
    setDensity('comfortable')
    setClassroomMode(false)
    setSidebarCollapsed(false)
    setRightPanelWidth(360)
    setReducedMotion(false)
    setShowValues(true)
    setShowIndices(true)
    setCanvasZoom(100)
    setStepPalette({})
    setAnimationQuality('detailed')
    setShowStateComparison(false)
    setIconStyle('study')
    pushToast('UI settings reset')
  }

  const clearLocalData = async () => {
    if (!window.confirm('Clear local settings, notes, favorites, recent items, and saved experiments?')) return
    localStorage.clear()
    try {
      setSaving(true)
      await db.experiments.clear()
      setSaved([])
    } catch {
      pushToast('Settings cleared, but saved experiments could not be cleared')
      setSaving(false)
      return
    }
    setFavorites([])
    setRecentIds([])
    setNotes({})
    setCompleted([])
    resetFilters()
    pushToast('Local data cleared')
    setSaving(false)
  }

  const copyText = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      pushToast(`${label} copied`)
    } catch {
      pushToast(`Could not copy ${label.toLowerCase()}`)
    }
  }

  const downloadText = (filename: string, value: string, type = 'text/plain') => {
    saveText(filename, value, type)
    pushToast(`${filename} downloaded`)
  }

  const stepLogCsv = () => buildStepLogCsv(steps)
  const comparisonCsv = () =>
    ['algorithm,steps,comparisons,swaps,reads,writes,recursiveCalls']
      .concat(comparisonRows.map((row) => [`"${row.module.name}"`, row.steps, row.comparisons, row.swaps, row.reads, row.writes, row.recursiveCalls].join(',')))
      .join('\n')

  const updateRandom = (mode = dataMode) => {
    const generated = randomArray(size, mode)
    setDataMode(mode)
    setInputText(generated.join(', '))
    if (activeCategory === 'Searching') setTarget(generated[Math.floor(generated.length / 2)] ?? 0)
    resetPlayback()
  }

  const sortCurrentInput = () => {
    setInputText(sortedCopyText(input))
    resetPlayback()
    pushToast('Input sorted for this algorithm')
  }

  const saveExperiment = async () => {
    const experiment: SavedExperiment = {
      id: crypto.randomUUID(),
      algorithmId: activeModule.id,
      algorithmName: activeModule.name,
      createdAt: new Date().toISOString(),
      input,
      target,
      stepCount: steps.length,
      metrics: finalMetrics,
    }
    try {
      setSaving(true)
      await db.experiments.put(experiment)
      setSaved(await db.experiments.orderBy('createdAt').reverse().limit(6).toArray())
      pushToast('Saved locally in IndexedDB')
    } catch {
      pushToast('Could not save this experiment locally')
    } finally {
      setSaving(false)
    }
  }

  const exportJson = () => {
    const payload = { product: 'AlgoDrishti', localOnly: true, algorithm: activeModule.name, input, target, steps, metrics: finalMetrics }
    downloadBlob(`${activeModule.id}-report.json`, new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
    pushToast('JSON report exported')
  }

  const exportSvg = () => {
    exportSvgFrame({
      activeIndices: currentStep?.highlights.indices,
      algorithmName: activeModule.name,
      filename: `${activeModule.id}-frame.svg`,
      maxMagnitude,
      visualData,
    })
    pushToast('Current frame exported as SVG')
  }

  const exportPng = () => {
    exportPngFrame({
      activeIndices: currentStep?.highlights.indices,
      algorithmName: activeModule.name,
      filename: `${activeModule.id}-frame.png`,
      maxMagnitude,
      visualData,
    })
    pushToast('Current frame exported as PNG')
  }

  const onFileLoad = async (file?: File) => {
    if (!file) return
    const text = await file.text()
    setInputText(parseInput(text).join(', '))
    resetPlayback()
    setViewMode('visualize')
    pushToast('Loaded data locally with the Browser File API')
    window.requestAnimationFrame(() =>
      document.querySelector('.input-strip, .ds-input-panel, .visual-canvas')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    )
  }

  const scrollToSection = (selector: string) => {
    window.requestAnimationFrame(() => document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const sidebar = (
    <Sidebar
      activeCategory={activeCategory}
      activeId={activeId}
      chooseAlgorithm={chooseAlgorithm}
      chooseCategory={chooseCategory}
      iconStyle={iconStyle}
      onNavigate={() => setMobileMenuOpen(false)}
      recentIds={recentIds}
      setIconStyle={setIconStyle}
    />
  )
  const toastStack = toasts.length > 0 && (
    <div className="toast-stack">
      {toasts.map((toast) => (
        <button className="toast" key={toast.id} type="button" onClick={() => setToasts((items) => items.filter((item) => item.id !== toast.id))}>
          {toast.message}
        </button>
      ))}
    </div>
  )

  if (routeState.notFound) {
    return (
      <Layout
        focusMode={false}
        fullCanvas={false}
        mobileMenuOpen={mobileMenuOpen}
        rightPanelWidth={rightPanelWidth}
        setMobileMenuOpen={setMobileMenuOpen}
        sidebar={sidebar}
        sidebarCollapsed={sidebarCollapsed}
        toasts={toastStack}
      >
        <section className={`workspace category-page page-${activePage.slug}`} style={{ '--page-accent': activePage.accent } as CSSProperties}>
          <RouteFallback
            algorithmSlug={routeState.notFound.algorithmSlug}
            categorySlug={routeState.notFound.categorySlug}
            fallbackModule={activeModule}
            openFallback={() => chooseAlgorithm(activeModule.id)}
          />
          <AimerSiteFooter />
        </section>
      </Layout>
    )
  }

  return (
    <Layout
      focusMode={focusMode}
      fullCanvas={fullCanvas}
      mobileMenuOpen={mobileMenuOpen}
      rightPanelWidth={rightPanelWidth}
      setMobileMenuOpen={setMobileMenuOpen}
      sidebar={sidebar}
      sidebarCollapsed={sidebarCollapsed}
      toasts={toastStack}
    >
      <section className={`workspace category-page page-${activePage.slug}`} style={{ '--page-accent': activePage.accent } as CSSProperties}>
        <TopBar
          activeModule={activeModule}
          classroomMode={classroomMode}
          clearLocalData={clearLocalData}
          copyText={copyText}
          density={density}
          downloadText={downloadText}
          exportJson={exportJson}
          exportPng={exportPng}
          exportSvg={exportSvg}
          exportsOpen={exportsOpen}
          focusMode={focusMode}
          fullCanvas={fullCanvas}
          notes={notes}
          onFileLoad={onFileLoad}
          openCommandPalette={() => setCommandOpen(true)}
          pushToast={pushToast}
          reducedMotion={reducedMotion}
          resetUiSettings={resetUiSettings}
          saveExperiment={saveExperiment}
          saving={saving}
          setClassroomMode={setClassroomMode}
          setDensity={setDensity}
          setExportsOpen={setExportsOpen}
          setFocusMode={setFocusMode}
          setFullCanvas={setFullCanvas}
          setNotes={setNotes}
          setReducedMotion={setReducedMotion}
          setSettingsOpen={setSettingsOpen}
          setSidebarCollapsed={setSidebarCollapsed}
          setTheme={setTheme}
          setViewMode={setViewMode}
          settingsOpen={settingsOpen}
          sidebarCollapsed={sidebarCollapsed}
          stepsLength={steps.length}
          theme={theme}
          viewMode={viewMode}
        />
        <MobileCategoryTabs activeCategory={activeCategory} chooseCategory={chooseCategory} />
        <CommandPalette
          algorithms={allModules}
          chooseAlgorithm={chooseAlgorithm}
          close={() => setCommandOpen(false)}
          copyLink={() => copyText('Algorithm link', window.location.href)}
          open={commandOpen}
          reset={resetPlayback}
          run={() => setPlaying((value) => !value)}
          switchTheme={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}
        />
        {routeChanging && <RouteTransitionSkeleton />}
        {viewMode === 'visualize' && (
          <section className="category-hero algorithm-hero">
            {showOnboarding && (
              <div className="onboarding-panel">
                <strong>Start here</strong>
                <span>Pick an algorithm, choose a preset, press Run, then use the step slider to connect the bars with pseudocode and metrics.</span>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('algodrishti-onboarded', 'true')
                    setShowOnboarding(false)
                  }}
                >
                  Got it
                </button>
              </div>
            )}
            <div>
              <nav className="breadcrumbs" aria-label="Current route">
                <button type="button" onClick={() => chooseCategory(activeCategory)}>
                  {activeCategory}
                </button>
                <span>/</span>
                <button type="button" onClick={() => chooseAlgorithm(activeModule.id)}>
                  {activeModule.name}
                </button>
              </nav>
              <h1>{activeModule.name}</h1>
              <p>{activeModule.summary}</p>
            </div>
            <div className="category-section-strip">
              <span>{activeModule.category}</span>
              <span>{activeModule.subcategory ?? activeModule.visualMode}</span>
              <span>{statusLabel}</span>
              <span>{activeModule.complexity.average}</span>
            </div>
            <div className="learning-paths">
              {[
                ['What this page teaches', guide.concept],
                ['What to watch', guide.objectives[1]],
                ['Pitfall', guide.misconceptions[0]],
              ].map(([title, detail]) => (
                <article key={title}>
                  <strong>{title}</strong>
                  <span>{detail}</span>
                </article>
              ))}
            </div>
          </section>
        )}
        {viewMode === 'compare' ? (
          <CompareView
            comparableModules={comparableModules}
            comparedIds={comparedIds}
            compareCategory={compareCategory}
            comparisonCsv={comparisonCsv}
            comparisonRows={comparisonRows}
            dataMode={dataMode}
            downloadText={downloadText}
            inputText={inputText}
            maxComparisonComparisons={maxComparisonComparisons}
            maxComparisonSteps={maxComparisonSteps}
            resetPlayback={resetPlayback}
            setCompareCategory={setCompareCategory}
            setComparedIds={setComparedIds}
            setInputText={setInputText}
            setTarget={setTarget}
            target={target}
            toggleComparedAlgorithm={toggleComparedAlgorithm}
            updateRandom={updateRandom}
          />
        ) : (
          <Visualizer
            activeCategory={activeCategory}
            activeId={activeId}
            activeModule={activeModule}
            animationQuality={animationQuality}
            algorithmQuery={algorithmQuery}
            canvasRef={canvasRef}
            canvasZoom={canvasZoom}
            chooseAlgorithm={chooseAlgorithm}
            complexityFilter={complexityFilter}
            controls={
              <Controls
                activeCategory={activeCategory}
                disabledReason={disabledReason}
                pauseOn={pauseOn}
                playing={playing}
                resetAll={resetAll}
                resetPlayback={resetPlayback}
                setPauseOn={setPauseOn}
                setPlaying={setPlaying}
                setSpeed={setSpeed}
                setStepIndex={setStepIndex}
                speed={speed}
                stepsLength={steps.length}
              />
            }
            copyText={copyText}
            currentStep={currentStep}
            dataMode={dataMode}
            disabledReason={disabledReason}
            discardedRange={discardedRange}
            downloadText={downloadText}
            favorites={favorites}
            filteredModules={filteredModules}
            hasNegativeValues={visualData.some((value) => value < 0)}
            input={input}
            inputDiagnostics={inputDiagnostics}
            inputText={inputText}
            maxMagnitude={maxMagnitude}
            pageSections={activePage.sections}
            pointerEntries={pointerEntries}
            progressPercent={progressPercent}
            recommendation={recommendation}
            reducedMotion={reducedMotion}
            resetFilters={resetFilters}
            resetPlayback={resetPlayback}
            rightPanel={
              <RightPanel
                activeModule={activeModule}
                codeView={codeView}
                completed={completed}
                copyText={copyText}
                correctnessText={correctnessText}
                currentStep={currentStep}
                difficulty={difficulty}
                guide={guide}
                hugeRunWarning={hugeRunWarning}
                inputConstraints={inputConstraints}
                learningTab={learningTab}
                nextStep={nextStep}
                notes={notes}
                practiceGuess={practiceGuess}
                practiceReveal={practiceReveal}
                pseudoActiveIndex={pseudoActiveIndex}
                quizScore={quizScore}
                recommendation={recommendation}
                reviewDueDate={reviewDueDates[activeId]}
                resultText={resultText}
                rightPanelWidth={rightPanelWidth}
                setLearningTab={setLearningTab}
                setNotes={setNotes}
                setPracticeGuess={setPracticeGuess}
                setPracticeReveal={setPracticeReveal}
                setQuizScore={(updater) =>
                  setQuizScores((scores) => ({
                    ...scores,
                    [activeId]: typeof updater === 'function' ? updater(scores[activeId] ?? { correct: 0, total: 0 }) : updater,
                  }))
                }
                setRightPanelWidth={setRightPanelWidth}
                setStepIndex={setStepIndex}
                stepIndex={stepIndex}
                stepReason={stepReason}
                steps={steps}
                toggleComplete={toggleComplete}
              />
            }
            setAlgorithmQuery={setAlgorithmQuery}
            setAnimationQuality={setAnimationQuality}
            setCanvasZoom={setCanvasZoom}
            setComplexityFilter={setComplexityFilter}
            setInputText={setInputText}
            setShowIndices={setShowIndices}
            setShowValues={setShowValues}
            setSize={setSize}
            setStatusFilter={setStatusFilter}
            setStepPalette={setStepPalette}
            setShowStateComparison={setShowStateComparison}
            setTarget={setTarget}
            setVisualFilter={setVisualFilter}
            showIndices={showIndices}
            showStateComparison={showStateComparison}
            showValues={showValues}
            size={size}
            startGameInteraction={startGameInteraction}
            sortCurrentInput={sortCurrentInput}
            sortedBoundary={sortedBoundary}
            sortedInputRequired={sortedInputRequired}
            sortedInputValid={sortedInputValid}
            statusFilter={statusFilter}
            statusLabel={statusLabel}
            stepLogCsv={stepLogCsv}
            stepPalette={stepPalette}
            stepsLength={steps.length}
            target={target}
            toggleFavorite={toggleFavorite}
            updateRandom={updateRandom}
            visiblePickerModules={visiblePickerModules}
            visualFilter={visualFilter}
            visualItems={visualItems}
          />
        )}
        <BottomPanel
          activeModuleId={activeModule.id}
          copyText={copyText}
          downloadText={downloadText}
          finalMetrics={finalMetrics}
          loadingSaved={loadingSaved}
          onLoadSaved={(item) => {
            chooseAlgorithm(item.algorithmId)
            setInputText(item.input.join(', '))
            setTarget(item.target)
            setViewMode('visualize')
            resetPlayback()
            pushToast(`${item.algorithmName} loaded`)
            scrollToSection('.visual-canvas')
          }}
          openDashboard={() => {
            setViewMode('visualize')
            scrollToSection('.page-ribbon')
          }}
          openDataGrid={() => {
            setViewMode('visualize')
            scrollToSection('.input-strip, .ds-input-panel')
          }}
          openStatistics={() => scrollToSection('.metrics-panel')}
          openVisualizer={() => {
            setViewMode('visualize')
            scrollToSection('.visual-canvas')
          }}
          saved={saved}
          setStepIndex={setStepIndex}
          stepIndex={stepIndex}
          stepLogCsv={stepLogCsv}
          steps={steps}
        />
        <AimerSiteFooter />
      </section>
    </Layout>
  )
}

export default App
