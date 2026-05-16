import { motion } from 'framer-motion'
import { Home, Search, Shuffle } from 'lucide-react'
import type { CSSProperties, Dispatch, ReactNode, RefObject, SetStateAction } from 'react'
import type { AlgorithmCategory, AlgorithmModule, AlgorithmStep, AnimationQuality, InputDiagnostics } from '../types'
import { allModules, chessFenPresets } from '../algorithms'
import { TraversalWorkbench } from './TraversalWorkbench'

type VisualItem = {
  id: string
  index: number
  value: number
}

type VisualizerProps = {
  activeCategory: AlgorithmCategory
  activeId: string
  activeModule: AlgorithmModule
  animationQuality: AnimationQuality
  canvasRef: RefObject<HTMLDivElement | null>
  canvasZoom: number
  chooseAlgorithm: (id: string) => void
  controls: ReactNode
  copyText: (label: string, value: string) => void
  currentStep?: AlgorithmStep
  dataMode: string
  disabledReason: string
  discardedRange?: { high: number; low: number }
  downloadText: (filename: string, value: string, type?: string) => void
  favorites: string[]
  filteredModules: AlgorithmModule[]
  hasNegativeValues: boolean
  input: number[]
  inputDiagnostics: InputDiagnostics
  inputText: string
  maxMagnitude: number
  pageSections: string[]
  pointerEntries: { index: number; key: string }[]
  progressPercent: number
  recommendation: string
  reducedMotion: boolean
  resetFilters: () => void
  resetPlayback: () => void
  rightPanel: ReactNode
  setAlgorithmQuery: (value: string) => void
  setAnimationQuality: Dispatch<SetStateAction<AnimationQuality>>
  setCanvasZoom: Dispatch<SetStateAction<number>>
  setInputText: (value: string) => void
  setShowIndices: Dispatch<SetStateAction<boolean>>
  setShowValues: Dispatch<SetStateAction<boolean>>
  setSize: (value: number) => void
  setStepPalette: Dispatch<SetStateAction<Record<string, string>>>
  setShowStateComparison: Dispatch<SetStateAction<boolean>>
  setTarget: (value: number) => void
  showIndices: boolean
  showStateComparison: boolean
  showValues: boolean
  size: number
  sortedBoundary: number
  sortedInputRequired: boolean
  sortedInputValid: boolean
  sortCurrentInput: () => void
  statusFilter: 'all' | 'live' | 'planned'
  statusLabel: string
  stepLogCsv: () => string
  stepPalette: Record<string, string>
  stepsLength: number
  target: number
  toggleFavorite: (id: string) => void
  updateRandom: (mode?: string) => void
  visiblePickerModules: AlgorithmModule[]
  visualFilter: 'all' | AlgorithmModule['visualMode']
  visualItems: VisualItem[]
  complexityFilter: 'all' | 'log' | 'linear' | 'nlogn' | 'quadratic'
  algorithmQuery: string
  setStatusFilter: Dispatch<SetStateAction<'all' | 'live' | 'planned'>>
  setVisualFilter: Dispatch<SetStateAction<'all' | AlgorithmModule['visualMode']>>
  setComplexityFilter: Dispatch<SetStateAction<'all' | 'log' | 'linear' | 'nlogn' | 'quadratic'>>
}

export function Visualizer({
  activeCategory,
  activeId,
  activeModule,
  animationQuality,
  algorithmQuery,
  canvasRef,
  canvasZoom,
  chooseAlgorithm,
  complexityFilter,
  controls,
  copyText,
  currentStep,
  dataMode,
  disabledReason,
  discardedRange,
  downloadText,
  favorites,
  filteredModules,
  hasNegativeValues,
  input,
  inputDiagnostics,
  inputText,
  maxMagnitude,
  pageSections,
  pointerEntries,
  progressPercent,
  recommendation,
  reducedMotion,
  resetFilters,
  resetPlayback,
  rightPanel,
  setAlgorithmQuery,
  setAnimationQuality,
  setCanvasZoom,
  setComplexityFilter,
  setInputText,
  setShowIndices,
  setShowValues,
  setSize,
  setStatusFilter,
  setStepPalette,
  setShowStateComparison,
  setTarget,
  setVisualFilter,
  showIndices,
  showStateComparison,
  showValues,
  size,
  sortCurrentInput,
  sortedBoundary,
  sortedInputRequired,
  sortedInputValid,
  statusFilter,
  statusLabel,
  stepLogCsv,
  stepPalette,
  stepsLength,
  target,
  toggleFavorite,
  updateRandom,
  visiblePickerModules,
  visualFilter,
  visualItems,
}: VisualizerProps) {
  const matrixData = currentStep?.dataState?.length ? currentStep.dataState : input
  const isGameBoard = activeModule.category === 'Games'
  const isChessBoard = activeModule.id === 'chess-minimax'
  const gameSymbols = Array.isArray(currentStep?.highlights.variables?.boardSymbols) ? (currentStep?.highlights.variables?.boardSymbols as string[]) : []
  const tableShape = String(currentStep?.highlights.variables?.tableShape ?? '')
  const tableColumns = Number(tableShape.split('x')[1])
  const matrixColumns = Number.isFinite(tableColumns) && tableColumns > 0 ? tableColumns : Math.max(2, Math.ceil(Math.sqrt(Math.max(matrixData.length, 1))))
  const matrixRows = Math.max(1, Math.ceil(matrixData.length / matrixColumns))
  const chessArrow =
    isChessBoard && currentStep?.highlights.indices && currentStep.highlights.indices.length >= 2
      ? {
          from: currentStep.highlights.indices[0],
          to: currentStep.highlights.indices[1],
        }
      : undefined
  const arrowPoint = (index: number) => ({
    x: `${((index % matrixColumns) + 0.5) * (100 / matrixColumns)}%`,
    y: `${(Math.floor(index / matrixColumns) + 0.5) * (100 / matrixRows)}%`,
  })

  return (
    <section className="lab-grid">
      <section className="canvas-zone">
        <div className="canvas-header">
          <div>
            <span className="eyebrow">
              {activeModule.category} / {activeModule.visualMode} Mode
            </span>
            <h1>{activeModule.name}</h1>
            <p>{activeModule.summary}</p>
          </div>
          <span className={`status ${activeModule.status}`}>{statusLabel}</span>
        </div>
        <div className="page-ribbon">
          <span>{activeCategory} page</span>
          <strong>{activeModule.subcategory ?? activeModule.visualMode}</strong>
          <em>{recommendation}</em>
          <em>{progressPercent}% category progress</em>
        </div>
        <details className="algorithm-browser">
          <summary>
            <Search size={17} />
            Browse {activeCategory.toLowerCase()} algorithms
            <span>{visiblePickerModules.length} results</span>
          </summary>
          <section className="category-module-map">
            {pageSections.map((section) => {
              const sectionModules = filteredModules
                .filter((module) => `${module.subcategory ?? ''} ${module.name} ${module.summary}`.toLowerCase().includes(section.split(' ')[0].toLowerCase()))
                .slice(0, 4)
              const fallback = sectionModules.length ? sectionModules : filteredModules.slice(0, 3)
              return (
                <article key={section}>
                  <h2>{section}</h2>
                  <div>
                    {fallback.map((module) => (
                      <button
                        className={module.id === activeId ? 'active' : ''}
                        key={`${section}-${module.id}`}
                        type="button"
                        onClick={() => chooseAlgorithm(module.id)}
                      >
                        {module.name}
                      </button>
                    ))}
                  </div>
                </article>
              )
            })}
          </section>

          <section className="algorithm-picker" aria-label="Algorithm picker">
            <div className="picker-search">
              <Search size={17} />
              <input
                aria-label="Search algorithms"
                placeholder={`Search ${activeCategory.toLowerCase()} algorithms`}
                value={algorithmQuery}
                onChange={(event) => setAlgorithmQuery(event.target.value)}
              />
              <span className="picker-count">{visiblePickerModules.length} results</span>
            </div>
            <div className="picker-filters">
              <label>
                Status
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
                  <option value="all">All</option>
                  <option value="live">Interactive</option>
                  <option value="planned">Coming soon</option>
                </select>
              </label>
              <label>
                View
                <select value={visualFilter} onChange={(event) => setVisualFilter(event.target.value as typeof visualFilter)}>
                  <option value="all">All</option>
                  {(['Array', 'Tree', 'Graph', 'Matrix'] as const).map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Complexity
                <select value={complexityFilter} onChange={(event) => setComplexityFilter(event.target.value as typeof complexityFilter)}>
                  <option value="all">All</option>
                  <option value="log">Logarithmic</option>
                  <option value="linear">Linear</option>
                  <option value="nlogn">n log n</option>
                  <option value="quadratic">Quadratic</option>
                </select>
              </label>
              <button className="btn-reset-filters" type="button" onClick={resetFilters}>
                Reset filters
              </button>
            </div>
            <div className="favorite-row">
              {favorites
                .map((id) => allModules.find((module) => module.id === id))
                .filter(Boolean)
                .map((module) => (
                  <button key={module!.id} type="button" onClick={() => chooseAlgorithm(module!.id)}>
                    Pinned: {module!.name}
                  </button>
                ))}
            </div>
            {visiblePickerModules.length ? (
              <div className="picker-grid">
                {visiblePickerModules.map((module) => (
                  <button
                    className={`${module.id === activeId ? 'active' : ''} ${module.status === 'planned' ? 'planned-module' : ''} cat-${module.category.toLowerCase().replaceAll(' ', '-').replaceAll('&', 'and').replaceAll('/', '-')}`}
                    key={module.id}
                    onClick={() => chooseAlgorithm(module.id)}
                    type="button"
                  >
                    <span>
                      <strong>{module.name}</strong>
                      <small>
                        {module.subcategory ?? module.visualMode} / {module.status === 'live' ? 'interactive' : 'coming soon'}
                      </small>
                    </span>
                    <em>{module.complexity.average}</em>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <strong>No algorithms match these filters.</strong>
                <span>Clear the search or reset filters to see the full {activeCategory.toLowerCase()} catalog.</span>
              </div>
            )}
            <button className="favorite-toggle" type="button" onClick={() => toggleFavorite(activeModule.id)}>
              {favorites.includes(activeModule.id) ? 'Unpin favorite' : 'Pin favorite'}
            </button>
          </section>
        </details>

        {activeModule.visualMode === 'Array' && activeCategory !== 'Data Structures' && (
          <div className="input-strip">
            <label>
              Data
              <textarea
                value={inputText}
                onChange={(event) => {
                  setInputText(event.target.value)
                  resetPlayback()
                }}
                rows={2}
              />
            </label>
            <label>
              Target
              <input
                type="number"
                value={target}
                onChange={(event) => {
                  setTarget(Number(event.target.value))
                  resetPlayback()
                }}
              />
            </label>
            <label>
              Size
              <input min={4} max={48} type="number" value={size} onChange={(event) => setSize(Number(event.target.value))} />
            </label>
            <div className="preset-row">
              {['random', 'sorted', 'reverse', 'duplicates', 'nearly', 'best', 'average', 'worst', 'empty', 'single', 'all-equal', 'negative'].map((mode) => (
                <button type="button" key={mode} className={dataMode === mode ? 'active' : ''} onClick={() => updateRandom(mode)}>
                  <Shuffle size={14} />
                  {mode}
                </button>
              ))}
            </div>
            <div className="input-messages">
              {inputDiagnostics.invalid.length > 0 && (
                <span>
                  {inputDiagnostics.invalid.length} invalid tokens ignored: {inputDiagnostics.invalid.slice(0, 5).join(', ')}
                </span>
              )}
              {inputDiagnostics.clipped && <span>Only the first 48 numeric values are visualized.</span>}
              {sortedInputRequired && !sortedInputValid && (
                <span>This algorithm requires sorted input. Sort the input first or the result may be misleading.</span>
              )}
              {sortedInputRequired && sortedInputValid && <span>Sorted-input requirement satisfied.</span>}
              {disabledReason && <span>Run disabled because: {disabledReason}</span>}
              {dataMode === 'nearly' && <span>Nearly sorted keeps most values ordered and swaps a few positions.</span>}
            </div>
            <div className="utility-row">
              <button type="button" onClick={() => copyText('Input', inputText)}>
                Copy input
              </button>
              {sortedInputRequired && (
                <button type="button" onClick={sortCurrentInput}>
                  Sort input
                </button>
              )}
              <button type="button" onClick={() => downloadText(`${activeModule.id}-steps.csv`, stepLogCsv(), 'text/csv')} disabled={!stepsLength}>
                CSV step log
              </button>
            </div>
          </div>
        )}

        {activeCategory === 'Data Structures' && (
          <div className="ds-input-panel">
            <div>
              <h2>Data Structure Input</h2>
              <p>Use comma-separated values for stack, queue, and traversal teaching examples.</p>
            </div>
            <label>
              Values
              <textarea
                value={inputText}
                onChange={(event) => {
                  setInputText(event.target.value)
                  resetPlayback()
                }}
                rows={2}
              />
            </label>
            <div className="preset-row">
              <button type="button" onClick={() => updateRandom('random')}>
                <Shuffle size={14} />
                Random
              </button>
              <button type="button" onClick={() => setInputText('8, 3, 10, 1, 6, 14, 4, 7, 13')}>
                Tree preset
              </button>
              <button type="button" onClick={() => setInputText('12, 24, 36, 48, 60')}>
                Queue preset
              </button>
              <button type="button" onClick={() => setInputText('5, 9, 2, 7, 1')}>
                Stack preset
              </button>
            </div>
            <div className="input-messages">
              {inputDiagnostics.invalid.length > 0 && (
                <span>
                  {inputDiagnostics.invalid.length} invalid tokens ignored: {inputDiagnostics.invalid.slice(0, 5).join(', ')}
                </span>
              )}
              {inputDiagnostics.clipped && <span>Only the first 48 numeric values are used.</span>}
            </div>
          </div>
        )}

        {activeModule.visualMode === 'Graph' && (
          <div className="ds-input-panel">
            <div>
              <h2>Graph Input Editor</h2>
              <p>Graph topology is fixed for BFS/DFS demos. Custom edge editing is planned.</p>
            </div>
          </div>
        )}

        {activeModule.visualMode === 'Matrix' && (
          <div className="ds-input-panel">
            <div>
              <h2>{isGameBoard ? 'Game Board Setup' : 'Matrix / Grid Input'}</h2>
              <p>
                {isGameBoard
                  ? 'This lesson uses one fixed game so the moves are easy to follow.'
                  : 'Enter rows separated by semicolons. Planned grid modules will read this shape.'}
              </p>
            </div>
            {isGameBoard ? (
              <div className="game-rule-card">
                {isChessBoard ? (
                  <>
                    <strong>Load a FEN, then press Run.</strong>
                    <span>The computer lists legal moves, checks replies, scores the board, and builds a line up to 12 plies.</span>
                    <label>
                      Chess FEN
                      <select
                        value={Math.abs(Math.trunc(target)) % chessFenPresets.length}
                        onChange={(event) => {
                          localStorage.removeItem('algodrishti-chess-fen')
                          setTarget(Number(event.target.value))
                          resetPlayback()
                        }}
                      >
                        {chessFenPresets.map((preset, index) => (
                          <option key={preset.name} value={index}>
                            {index + 1}. {preset.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <small>{chessFenPresets[Math.abs(Math.trunc(target)) % chessFenPresets.length]?.fen}</small>
                    <label>
                      Custom FEN
                      <textarea
                        rows={2}
                        placeholder="Paste any legal FEN here"
                        value={localStorage.getItem('algodrishti-chess-fen') ?? ''}
                        onChange={(event) => {
                          localStorage.setItem('algodrishti-chess-fen', event.target.value)
                          setInputText(event.target.value)
                          resetPlayback()
                        }}
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <strong>X goes first. Three in a row wins.</strong>
                    <span>Press Run to watch X make threats, O block them, and the game end in a draw.</span>
                  </>
                )}
              </div>
            ) : (
              <label>
                Grid
                <textarea
                  value={inputText}
                  onChange={(event) => {
                    setInputText(event.target.value)
                    resetPlayback()
                  }}
                  placeholder="1,0,1; 0,1,0; 1,0,1"
                  rows={3}
                />
              </label>
            )}
          </div>
        )}

        {!['Graph', 'Tree'].includes(activeModule.visualMode) && (
          <section className="visual-controls">
            <label>
              <input type="checkbox" checked={showValues} onChange={(event) => setShowValues(event.target.checked)} />
              Show values
            </label>
            <label>
              <input type="checkbox" checked={showIndices} onChange={(event) => setShowIndices(event.target.checked)} />
              Show indices
            </label>
            <label>
              Zoom
              <input min={70} max={170} step={10} type="range" value={canvasZoom} onChange={(event) => setCanvasZoom(Number(event.target.value))} />
              <span>{canvasZoom}%</span>
            </label>
            <button type="button" onClick={() => setCanvasZoom(100)}>
              Fit to canvas
            </button>
            <label>
              <input type="checkbox" checked={showStateComparison} onChange={(event) => setShowStateComparison(event.target.checked)} />
              Before/after
            </label>
            <label>
              Motion
              <select value={animationQuality} onChange={(event) => setAnimationQuality(event.target.value as AnimationQuality)}>
                <option value="off">Off</option>
                <option value="simple">Simple</option>
                <option value="detailed">Detailed</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() =>
                setStepPalette({
                  compare: '#0072b2',
                  swap: '#cc79a7',
                  select: '#e69f00',
                  complete: '#009e73',
                })
              }
            >
              Color-blind palette
            </button>
            {(['compare', 'swap', 'select', 'complete'] as const).map((type) => (
              <label key={type}>
                {type}
                <input
                  type="color"
                  value={stepPalette[type] ?? (type === 'swap' ? '#7c5bb0' : type === 'complete' ? '#397b50' : type === 'select' ? '#d59a26' : '#d85f3f')}
                  onChange={(event) => setStepPalette((value) => ({ ...value, [type]: event.target.value }))}
                />
              </label>
            ))}
          </section>
        )}

        <div className="visual-canvas" ref={canvasRef}>
          <div className="visual-legend persistent">
            <span className="red" /> active
            <span className="purple" /> swap/negative
            <span className="green" /> complete
            <span className="blue" /> normal
          </div>
          {['Graph', 'Tree'].includes(activeModule.visualMode) ? (
            <TraversalWorkbench activeModule={activeModule} currentStep={currentStep} input={input} />
          ) : activeModule.status === 'planned' ? (
            <div className="planned-state">
              <Home size={34} />
              <h2>{activeModule.name} is coming soon.</h2>
              <p>This page is prepared with learning notes, complexity, routing, local saves, and exports. The interactive runner is the remaining piece.</p>
              <button
                type="button"
                onClick={() =>
                  chooseAlgorithm(allModules.find((module) => module.category === activeCategory && module.status === 'live')?.id ?? 'bubble-sort')
                }
              >
                Open an interactive {activeCategory.toLowerCase()} module
              </button>
            </div>
          ) : activeModule.visualMode === 'Matrix' ? (
            <div
              className={`matrix-stage ${isGameBoard ? 'game-board-stage' : ''} ${isChessBoard ? 'chess-board-stage' : ''}`}
              aria-label="Matrix visualization"
              style={
                {
                  '--matrix-columns': matrixColumns,
                  '--matrix-rows': matrixRows,
                  minWidth: isGameBoard ? undefined : `${canvasZoom}%`,
                } as CSSProperties
              }
            >
              <div className="matrix-meta">
                <span>
                  {matrixRows} x {matrixColumns}
                </span>
                <strong>{String(currentStep?.highlights.variables?.problem ?? activeModule.subcategory ?? 'Matrix state')}</strong>
                <em>{currentStep?.type ?? 'ready'}</em>
              </div>
              <div className="matrix-grid-view">
                {chessArrow && (
                  <svg className="game-arrow-layer" aria-hidden="true">
                    <defs>
                      <marker id="chess-arrow-head" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
                        <path d="M0,0 L8,4 L0,8 Z" />
                      </marker>
                    </defs>
                    <line
                      x1={arrowPoint(chessArrow.from).x}
                      y1={arrowPoint(chessArrow.from).y}
                      x2={arrowPoint(chessArrow.to).x}
                      y2={arrowPoint(chessArrow.to).y}
                    />
                  </svg>
                )}
                {matrixData.map((value, index) => {
                  const active = currentStep?.highlights.indices?.includes(index)
                  const gameSymbol = gameSymbols[index] ?? (value === 1 ? 'X' : value === -1 ? 'O' : '')
                  const markClass = isChessBoard
                    ? gameSymbol
                      ? 'chess-piece'
                      : 'empty-mark'
                    : gameSymbol === 'X'
                      ? 'x-mark'
                      : gameSymbol === 'O'
                        ? 'o-mark'
                        : gameSymbol
                          ? 'symbol-mark'
                          : 'empty-mark'
                  return (
                    <motion.div
                      className={`matrix-cell ${active ? 'active' : ''} ${currentStep?.type ?? ''} ${isGameBoard ? 'game-cell' : ''} ${isChessBoard && chessArrow?.from === index ? 'move-from' : ''} ${isChessBoard && chessArrow?.to === index ? 'move-to' : ''} ${markClass}`}
                      key={`${index}-${value}`}
                      layout
                      transition={{ duration: reducedMotion || animationQuality === 'off' ? 0 : 0.16 }}
                    >
                      {showIndices && <small>{index}</small>}
                      {showValues && <strong>{isGameBoard ? gameSymbol : value}</strong>}
                    </motion.div>
                  )
                })}
              </div>
              {isGameBoard && currentStep?.highlights.variables && (
                <div className="game-insight">
                  {[
                    'next',
                    'preset',
                    'sideToMove',
                    'legalMoveCount',
                    'move',
                    'check',
                    'score',
                    'possibleMoves',
                    'likelyReply',
                    'bestMove',
                    'opponentReplies',
                    'bestLine4Ply',
                    'planNext12Plies',
                    'threat',
                    'block',
                    'result',
                    'lesson',
                  ].map((key) =>
                    currentStep.highlights.variables?.[key] !== undefined ? (
                      <span key={key}>
                        <strong>{key}</strong>
                        {String(currentStep.highlights.variables[key])}
                      </span>
                    ) : null,
                  )}
                </div>
              )}
              {showStateComparison && currentStep && (
                <div className="state-comparison matrix-comparison">
                  <span>Before: {(currentStep.beforeState ?? []).join(', ') || 'none'}</span>
                  <span>After: {(currentStep.afterState ?? currentStep.dataState).join(', ') || 'none'}</span>
                </div>
              )}
            </div>
          ) : (
            <div
              className={`bar-stage ${hasNegativeValues ? 'has-negatives' : ''}`}
              aria-label="Array visualization"
              style={
                {
                  '--compare-color': stepPalette.compare ?? '#d85f3f',
                  '--swap-color': stepPalette.swap ?? '#7c5bb0',
                  '--select-color': stepPalette.select ?? '#d59a26',
                  '--complete-color': stepPalette.complete ?? '#397b50',
                  minWidth: `${canvasZoom}%`,
                } as CSSProperties
              }
            >
              {hasNegativeValues && <div className="baseline-axis">0 baseline</div>}
              {currentStep?.type === 'swap' && (
                <div className="swap-arrow" aria-label="Swap direction">
                  ⇌
                </div>
              )}
              {sortedBoundary > 0 && <div className="sorted-region-label">sorted region</div>}
              {showIndices && (
                <div className="index-ruler">
                  {visualItems.map((item) => (
                    <span key={`ruler-${item.id}`}>{item.index}</span>
                  ))}
                </div>
              )}
              <div className="bar-pointer-row">
                {pointerEntries.map((pointer) => (
                  <span key={pointer.key} style={{ left: `${((pointer.index + 0.5) / Math.max(visualItems.length, 1)) * 100}%` }}>
                    {pointer.key}
                  </span>
                ))}
              </div>
              {visualItems.map((item) => {
                const active = currentStep?.highlights.indices?.includes(item.index)
                const discarded = discardedRange ? item.index < discardedRange.low || item.index > discardedRange.high : false
                return (
                  <motion.div
                    className={`bar-wrap ${item.value < 0 ? 'negative' : ''}`}
                    key={item.id}
                    layout
                    transition={
                      animationQuality === 'detailed'
                        ? { duration: reducedMotion ? 0 : 0.36, type: 'spring', bounce: reducedMotion ? 0 : 0.18 }
                        : { duration: reducedMotion || animationQuality === 'off' ? 0 : 0.16 }
                    }
                  >
                    <motion.div
                      className={`bar ${active ? 'active' : ''} ${discarded ? 'discarded' : ''} ${currentStep?.type ?? ''}`}
                      animate={{ height: `${Math.max(8, (Math.abs(item.value) / maxMagnitude) * 100)}%` }}
                      transition={{ duration: reducedMotion || animationQuality === 'off' ? 0 : animationQuality === 'simple' ? 0.12 : 0.22 }}
                      data-negative={item.value < 0}
                    >
                      {showValues && <span>{item.value}</span>}
                    </motion.div>
                    {showIndices && <small>{item.index}</small>}
                  </motion.div>
                )
              })}
              {currentStep?.highlights.variables && (
                <div className="pointer-labels">
                  {['low', 'mid', 'high', 'pivot', 'pivotIndex', 'min'].map((key) =>
                    currentStep.highlights.variables?.[key] !== undefined ? (
                      <span key={key}>
                        {key}: {String(currentStep.highlights.variables[key])}
                      </span>
                    ) : null,
                  )}
                </div>
              )}
              {activeModule.id === 'counting-sort' && (
                <div className="bucket-panel">
                  Frequency table: {String(currentStep?.highlights.variables?.counts ?? 'counts appear during counting steps')}
                </div>
              )}
              {activeModule.id === 'radix-sort' && (
                <div className="bucket-panel">Radix bucket: {String(currentStep?.highlights.variables?.digit ?? 'digits appear during bucket placement')}</div>
              )}
              {activeModule.id === 'heap-sort' && (
                <div className="bucket-panel">Heap relation: parent i, children 2i+1 and 2i+2. Active heap indices are highlighted.</div>
              )}
              {activeModule.id === 'merge-sort' && (
                <div className="bucket-panel">
                  Merge range: {String(currentStep?.highlights.variables?.left ?? '-')}-{String(currentStep?.highlights.variables?.right ?? '-')}
                </div>
              )}
              {showStateComparison && currentStep && (
                <div className="state-comparison">
                  <span>Before: {(currentStep.beforeState ?? []).join(', ') || 'none'}</span>
                  <span>After: {(currentStep.afterState ?? currentStep.dataState).join(', ') || 'none'}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {controls}
      </section>
      {rightPanel}
    </section>
  )
}
