// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
import { AlgorithmStudio, CodeExecutionPanel } from '../studio/AlgorithmStudio'
import { isStudioId } from '../studio/engine'
import { MobileDisclosure } from './MobileDisclosure'
import { ViewportCanvas } from './ViewportCanvas'
import { motion } from 'framer-motion'
import { Home, Search, Shuffle } from 'lucide-react'
import type { CSSProperties, Dispatch, ReactNode, RefObject, SetStateAction } from 'react'
import { lazy, Suspense } from 'react'
import type { AlgorithmCategory, AlgorithmModule, AlgorithmStep, AnimationQuality, InputDiagnostics, LearningTab } from '../types'
import { allModules, chessFenPresets, gameBoardPresets } from '../algorithms'
import { TraversalWorkbench } from './TraversalWorkbench'
import { PenguinVisualization } from './PenguinVisualization'
import { DetectiveSearch } from './DetectiveSearch'
import { sortingCharacters } from '../data/sortingCharacters'
import { LessonTabs } from './LessonTabs'
import { suiteLinks } from '../daa/syllabi'
import { usePersistentState, persistentString } from '../hooks/usePersistentState'
import { TreeLearningStudio } from '../learning/TreeLearningStudio'
import { isTreeLearningModule } from '../learning/treeModel'
import { GraphSuiteLearning } from '../learning/GraphSuiteLearning'
const DPSuiteLearning = lazy(() => import('../learning/DynamicProgrammingStudio').then((module) => ({ default: module.DPSuiteLearning })))
const GreedySuiteLearning = lazy(() => import('../learning/GreedyStudio').then((module) => ({ default: module.GreedySuiteLearning })))
const BacktrackingSuiteLearning = lazy(() => import('../learning/BacktrackingStudio').then((module) => ({ default: module.BacktrackingSuiteLearning })))

type VisualItem = {
  id: string
  index: number
  value: number
}

type VisualizerProps = {
  learningTab: LearningTab
  setLearningTab: (tab: LearningTab) => void
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
  searchHistory: AlgorithmStep[]
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
  startGameInteraction: () => void
}

const gameProfiles: Record<
  string,
  {
    objective: string
    setup: string
    engine: string
    board: string
    tactic: string
    mistake: string
    practice: string
    depth: string
  }
> = {
  'tic-tac-toe-minimax': {
    objective: 'Make three in a row while blocking the opponent.',
    setup: 'X goes first. Run the lesson to see attack, block, and draw logic.',
    engine: 'Minimax tries every move, assumes the opponent answers perfectly, then chooses the safest score.',
    board: '3 x 3 grid',
    tactic: 'Forks and blocks',
    mistake: 'Playing only your own threat and missing the opponent win.',
    practice: 'Pause before each move and name the square that stops the strongest threat.',
    depth: 'Full game tree',
  },
  'sudoku-backtracking-game': {
    objective: 'Fill every row, column, and 3 x 3 box with 1-9.',
    setup: 'Run the lesson to watch candidate checking and backtracking.',
    engine: 'Backtracking picks an empty cell, tries legal digits, and undoes a digit when a later cell gets stuck.',
    board: '9 x 9 grid',
    tactic: 'Candidate elimination',
    mistake: 'Guessing without checking row, column, and box together.',
    practice: 'For the highlighted blank, say which digits are impossible before revealing the next step.',
    depth: 'Recursive search',
  },
  'go-liberties-territory': {
    objective: 'Surround territory and keep stone groups alive with liberties.',
    setup: 'Run the lesson to count liberties and reduce a weak group.',
    engine: 'Go bots combine liberty counting, territory estimates, pattern knowledge, and deeper search.',
    board: '9 x 9 teaching board',
    tactic: 'Liberty pressure',
    mistake: 'Counting stones but not the empty neighbor points that keep groups alive.',
    practice: 'Count the liberties around the highlighted group before moving forward.',
    depth: 'Pattern search',
  },
  'connect-four-minimax': {
    objective: 'Drop pieces to make four in a row.',
    setup: 'Run the lesson to see gravity, threats, and a defensive block.',
    engine: 'Minimax scores every four-cell window, then searches likely drops and replies.',
    board: '6 x 7 grid',
    tactic: 'Window scoring',
    mistake: 'Blocking one line while allowing a stronger line next turn.',
    practice: 'Find which column creates or blocks the next four-cell window.',
    depth: 'Reply search',
  },
  'checkers-capture-search': {
    objective: 'Capture pieces and promote to kings.',
    setup: 'Run the lesson to see diagonal movement and a jump capture.',
    engine: 'The search checks forced captures first, then follows multi-jump lines before quiet moves.',
    board: '8 x 8 board',
    tactic: 'Forced capture',
    mistake: 'Moving a piece when a capture sequence is available.',
    practice: 'Trace the jump path from start square to landing square.',
    depth: 'Capture tree',
  },
  'minesweeper-constraints': {
    objective: 'Reveal safe cells and flag mines using number clues.',
    setup: 'Run the lesson to convert visible numbers into safe/mine constraints.',
    engine: 'Constraint propagation treats each number as an equation over its covered neighbors.',
    board: '8 x 8 grid',
    tactic: 'Safe-cell inference',
    mistake: 'Treating a number by itself instead of checking all neighboring covered cells.',
    practice: 'Point to the safe neighbor implied by the highlighted number.',
    depth: 'Constraint solving',
  },
  'twenty-forty-eight-expectimax': {
    objective: 'Merge equal tiles and keep enough open space to survive.',
    setup: 'Run the lesson to see slide, merge, and board scoring.',
    engine: 'Expectimax tries each swipe, estimates random new tiles, and prefers smooth boards with open cells.',
    board: '4 x 4 grid',
    tactic: 'Space control',
    mistake: 'Chasing one merge while trapping the largest tile.',
    practice: 'Predict the board after the highlighted swipe before stepping forward.',
    depth: 'Chance search',
  },
  'chess-minimax': {
    objective: 'Choose legal moves that improve the position after replies.',
    setup: 'Load a FEN, press Run, then follow legal moves, arrows, scores, and plans.',
    engine: 'Minimax with alpha-beta pruning searches move, reply, score, and principal variation lines.',
    board: '8 x 8 board',
    tactic: 'Best move and reply',
    mistake: 'Looking at one attractive move without checking the opponent response.',
    practice: 'Compare the top candidate with the likely reply before accepting the best line.',
    depth: '4-12 ply planning',
  },
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
  startGameInteraction,
  sortCurrentInput,
  sortedBoundary,
  sortedInputRequired,
  sortedInputValid,
  statusFilter,
  stepLogCsv,
  stepPalette,
  stepsLength,
  searchHistory,
  target,
  toggleFavorite,
  updateRandom,
  visiblePickerModules,
  visualFilter,
  visualItems,
  learningTab,
  setLearningTab,
}: VisualizerProps) {
  useLocaleRender()

  const isBubble = activeId === 'bubble-sort'
  const isSorting = activeModule.category === 'Sorting'
  const [sortingCharacter, setSortingCharacter] = usePersistentState('algodrishti-sorting-character', 'penguins', persistentString)
  const [bubbleView, setBubbleView] = usePersistentState('algodrishti-bubble-view', 'bars', persistentString)
  const matrixData = currentStep?.dataState?.length ? currentStep.dataState : input
  const isGameBoard = activeModule.category === 'Games'
  const isChessBoard = activeModule.id === 'chess-minimax'
  const gameProfile = gameProfiles[activeModule.id]
  const gameVariables = currentStep?.highlights.variables ?? {}
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
  const gamePresets = gameBoardPresets[activeModule.id] ?? []
  const customGameKey = `algodrishti-game-custom-${activeModule.id}`
  const gameStateKey = `algodrishti-game-state-${activeModule.id}`
  const legalMovePayload = Array.isArray(gameVariables.legalMovePayload)
    ? (gameVariables.legalMovePayload as { from?: number; label: string; set?: Record<number, string>; to: number }[])
    : []
  const legalTargets = Array.isArray(gameVariables.legalTargets) ? (gameVariables.legalTargets as number[]) : []
  const gameMoveArrow =
    isGameBoard && !isChessBoard && currentStep?.highlights.indices && currentStep.highlights.indices.length >= 2
      ? {
          from: currentStep.highlights.indices[0],
          to: currentStep.highlights.indices[1],
        }
      : undefined
  const activeGameArrow = chessArrow ?? gameMoveArrow
  const playGameCell = (index: number) => {
    if (!isGameBoard || isChessBoard || !legalMovePayload.length) return
    const move = legalMovePayload.find((item) => item.to === index) ?? legalMovePayload[0]
    localStorage.setItem(gameStateKey, JSON.stringify({ base: gameSymbols, move }))
    startGameInteraction()
  }

  if (activeModule.category === 'Backtracking')
    return (
      <section className="lab-grid" data-learning-tab={learningTab}>
        <LessonTabs active={learningTab} onChange={setLearningTab} />
        <Suspense fallback={<p role="status">{tx('Loading the backtracking lab…', 'common')}</p>}>
          <BacktrackingSuiteLearning key={activeModule.id} module={activeModule} tab={learningTab} onTab={setLearningTab} />
        </Suspense>
      </section>
    )

  if (activeModule.category === 'Greedy')
    return (
      <section className="lab-grid" data-learning-tab={learningTab}>
        <LessonTabs active={learningTab} onChange={setLearningTab} />
        <Suspense fallback={<p role="status">{tx('Loading the greedy lab…', 'common')}</p>}>
          <GreedySuiteLearning key={activeModule.id} module={activeModule} tab={learningTab} onTab={setLearningTab} />
        </Suspense>
      </section>
    )

  if (activeModule.category === 'Dynamic Programming')
    return (
      <section className="lab-grid" data-learning-tab={learningTab}>
        <LessonTabs active={learningTab} onChange={setLearningTab} />
        <Suspense fallback={<p role="status">{tx('Loading the dynamic programming lab…', 'common')}</p>}>
          <DPSuiteLearning key={activeModule.id} module={activeModule} tab={learningTab} onTab={setLearningTab} />
        </Suspense>
      </section>
    )

  if (isTreeLearningModule(activeModule))
    return (
      <section className="lab-grid" data-learning-tab={learningTab}>
        <LessonTabs active={learningTab} onChange={setLearningTab} />
        <TreeLearningStudio key={activeModule.id} module={activeModule} tab={learningTab} />
      </section>
    )

  if (['Learn', 'Visualization'].includes(learningTab) && activeModule.category === 'Graphs') {
    return (
      <section className="lab-grid" data-learning-tab={learningTab}>
        <LessonTabs active={learningTab} onChange={setLearningTab} />
        <GraphSuiteLearning key={activeModule.id} module={activeModule} tab={learningTab} />
      </section>
    )
  }

  if (isStudioId(activeModule.id) && learningTab === 'Code')
    return (
      <section className="studio-lesson">
        <LessonTabs active={learningTab} onChange={setLearningTab} />
        <CodeExecutionPanel id={activeModule.id} step={currentStep as import('../studio/trace').StudioStep} />
      </section>
    )

  if (isStudioId(activeModule.id) && learningTab === 'Visualization')
    return (
      <section className="studio-lesson" data-learning-tab={learningTab}>
        <LessonTabs active={learningTab} onChange={setLearningTab} />
        <AlgorithmStudio
          key={activeModule.id}
          module={activeModule}
          input={input}
          inputText={inputText}
          target={target}
          size={size}
          step={currentStep}
          controls={controls}
          history={searchHistory}
          reducedMotion={reducedMotion || animationQuality === 'off'}
          disabledReason={disabledReason}
          modules={filteredModules}
          setInput={setInputText}
          setTarget={setTarget}
          setSize={setSize}
          preset={updateRandom}
          reset={resetPlayback}
          copy={copyText}
          csv={stepLogCsv}
          download={downloadText}
          canvasRef={canvasRef}
        />
      </section>
    )

  return (
    <section className="lab-grid" data-learning-tab={learningTab}>
      <LessonTabs active={learningTab} onChange={setLearningTab} />
      <MobileDisclosure key={activeModule.id} className="workbench-input" defaultOpen title={tx('Edit problem input', 'common')}>
        <h2>{tx('Problem Input', 'common')}</h2>
        {tx(
          activeModule.visualMode === 'Array' && activeCategory !== 'Data Structures' && (
            <div className={`input-strip ${isBubble ? 'bubble-compact' : ''}`}>
              <label>
                {tx(isBubble ? 'Array (comma separated)' : 'Data', 'common')}
                <textarea
                  value={inputText}
                  onChange={(event) => {
                    setInputText(event.target.value)
                    resetPlayback()
                  }}
                  rows={isBubble ? 1 : 2}
                />
              </label>
              <label>
                {tx('Target', 'common')}
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
                {tx('Size', 'common')}
                <input min={4} max={48} type="number" value={size} onChange={(event) => setSize(Number(event.target.value))} />
              </label>
              <div className="preset-row">
                {tx(
                  (isBubble
                    ? ['random', 'sorted', 'reverse', 'duplicates', 'nearly', 'empty']
                    : ['random', 'sorted', 'reverse', 'duplicates', 'nearly', 'best', 'average', 'worst', 'empty', 'single', 'all-equal', 'negative']
                  ).map((mode) => (
                    <button type="button" key={mode} className={dataMode === mode ? 'active' : ''} onClick={() => updateRandom(mode)}>
                      <Shuffle size={14} />
                      {tx(
                        isBubble ? (mode === 'empty' ? 'Clear' : mode === 'nearly' ? 'Nearly sorted' : mode[0].toUpperCase() + mode.slice(1)) : mode,
                        'common',
                      )}
                    </button>
                  )),
                  'common',
                )}
                {tx(
                  isBubble && (
                    <select
                      aria-label={tx('More input presets', 'common')}
                      value=""
                      onChange={(event) => {
                        if (event.target.value) updateRandom(event.target.value)
                      }}
                    >
                      <option value="">{tx('More presets', 'common')}</option>
                      {tx(
                        ['best', 'average', 'worst', 'single', 'all-equal', 'negative'].map((mode) => (
                          <option key={mode} value={mode}>
                            {tx(mode, 'common')}
                          </option>
                        )),
                        'common',
                      )}
                    </select>
                  ),
                  'common',
                )}
              </div>
              <div className="input-messages">
                {tx(
                  inputDiagnostics.invalid.length > 0 && (
                    <span>
                      {tx(inputDiagnostics.invalid.length, 'common')}
                      {tx(' invalid tokens ignored: ', 'common')}
                      {tx(inputDiagnostics.invalid.slice(0, 5).join(', '), 'common')}
                    </span>
                  ),
                  'common',
                )}
                {tx(inputDiagnostics.clipped && <span>{tx('Only the first 48 numeric values are visualized.', 'common')}</span>, 'common')}
                {tx(
                  sortedInputRequired && !sortedInputValid && (
                    <span>{tx('This algorithm requires sorted input. Sort the input first or the result may be misleading.', 'common')}</span>
                  ),
                  'common',
                )}
                {tx(sortedInputRequired && sortedInputValid && <span>{tx('Sorted-input requirement satisfied.', 'common')}</span>, 'common')}
                {tx(
                  disabledReason && (
                    <span>
                      {tx('Run disabled because: ', 'common')}
                      {tx(disabledReason, 'common')}
                    </span>
                  ),
                  'common',
                )}
                {tx(dataMode === 'nearly' && <span>{tx('Nearly sorted keeps most values ordered and swaps a few positions.', 'common')}</span>, 'common')}
              </div>
              <div className="utility-row">
                <button type="button" onClick={() => copyText('Input', inputText)}>
                  {tx('Copy input', 'common')}
                </button>
                {tx(
                  sortedInputRequired && (
                    <button type="button" onClick={sortCurrentInput}>
                      {tx('Sort input', 'common')}
                    </button>
                  ),
                  'common',
                )}
                <button type="button" onClick={() => downloadText(`${activeModule.id}-steps.csv`, stepLogCsv(), 'text/csv')} disabled={!stepsLength}>
                  {tx('CSV step log', 'common')}
                </button>
              </div>
            </div>
          ),
          'common',
        )}

        {tx(
          activeCategory === 'Data Structures' && (
            <div className="ds-input-panel">
              <div>
                <h2>{tx('Data Structure Input', 'common')}</h2>
                <p>{tx('Use comma-separated values for stack, queue, and traversal teaching examples.', 'common')}</p>
              </div>
              <label>
                {tx('Values', 'common')}
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
                {tx('Search / lookup value', 'common')}
                <input
                  type="number"
                  value={target}
                  onChange={(event) => {
                    setTarget(Number(event.target.value))
                    resetPlayback()
                  }}
                />
              </label>
              <div className="preset-row">
                <button type="button" onClick={() => updateRandom('random')}>
                  <Shuffle size={14} />
                  {tx('Random', 'common')}
                </button>
                <button type="button" onClick={() => setInputText('8, 3, 10, 1, 6, 14, 4, 7, 13')}>
                  {tx('Tree preset', 'common')}
                </button>
                <button type="button" onClick={() => setInputText('12, 24, 36, 48, 60')}>
                  {tx('Queue preset', 'common')}
                </button>
                <button type="button" onClick={() => setInputText('5, 9, 2, 7, 1')}>
                  {tx('Stack preset', 'common')}
                </button>
              </div>
              <div className="input-messages">
                {tx(
                  inputDiagnostics.invalid.length > 0 && (
                    <span>
                      {tx(inputDiagnostics.invalid.length, 'common')}
                      {tx(' invalid tokens ignored: ', 'common')}
                      {tx(inputDiagnostics.invalid.slice(0, 5).join(', '), 'common')}
                    </span>
                  ),
                  'common',
                )}
                {tx(inputDiagnostics.clipped && <span>{tx('Only the first 48 numeric values are used.', 'common')}</span>, 'common')}
              </div>
            </div>
          ),
          'common',
        )}

        {tx(
          activeModule.visualMode === 'Graph' && (
            <div className="ds-input-panel">
              <div>
                <h2>{tx('Graph Input Editor', 'common')}</h2>
                <p>{tx('Graph topology is fixed for BFS/DFS demos. Custom edge editing is planned.', 'common')}</p>
              </div>
            </div>
          ),
          'common',
        )}

        {tx(
          activeModule.visualMode === 'Matrix' && (
            <div className="ds-input-panel">
              <div>
                <h2>{tx(isGameBoard ? 'Game Board Setup' : 'Matrix / Grid Input', 'common')}</h2>
                <p>
                  {tx(
                    isGameBoard
                      ? 'This lesson uses one fixed game so the moves are easy to follow.'
                      : 'Enter rows separated by semicolons. Planned grid modules will read this shape.',
                    'common',
                  )}
                </p>
              </div>
              {tx(
                isGameBoard ? (
                  <div className="game-rule-card">
                    {tx(
                      isChessBoard ? (
                        <>
                          <strong>{tx('Load a FEN, then press Run.', 'common')}</strong>
                          <span>{tx('The computer lists legal moves, checks replies, scores the board, and builds a line up to 12 plies.', 'common')}</span>
                          <label>
                            {tx('Chess FEN', 'common')}
                            <select
                              value={Math.abs(Math.trunc(target)) % chessFenPresets.length}
                              onChange={(event) => {
                                localStorage.removeItem('algodrishti-chess-fen')
                                setTarget(Number(event.target.value))
                                resetPlayback()
                              }}
                            >
                              {tx(
                                chessFenPresets.map((preset, index) => (
                                  <option key={preset.name} value={index}>
                                    {tx(index + 1, 'common')}. {tx(preset.name, 'common')}
                                  </option>
                                )),
                                'common',
                              )}
                            </select>
                          </label>
                          <small>{tx(chessFenPresets[Math.abs(Math.trunc(target)) % chessFenPresets.length]?.fen, 'common')}</small>
                          <label>
                            {tx('Custom FEN', 'common')}
                            <textarea
                              rows={2}
                              placeholder={tx('Paste any legal FEN here', 'common')}
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
                          <strong>{tx(gameProfile?.objective ?? 'Learn the rules, then watch the algorithm choose a move.', 'common')}</strong>
                          <span>{tx(gameProfile?.setup ?? 'Press Run to step through the board state and the computer decision.', 'common')}</span>
                          {tx(
                            gamePresets.length > 0 && (
                              <label>
                                {tx('Board preset', 'common')}
                                <select
                                  value={Math.abs(Math.trunc(target)) % gamePresets.length}
                                  onChange={(event) => {
                                    localStorage.removeItem(customGameKey)
                                    localStorage.removeItem(gameStateKey)
                                    setTarget(Number(event.target.value))
                                    resetPlayback()
                                  }}
                                >
                                  {tx(
                                    gamePresets.map((preset, index) => (
                                      <option key={preset.name} value={index}>
                                        {tx(index + 1, 'common')}. {tx(preset.name, 'common')}
                                      </option>
                                    )),
                                    'common',
                                  )}
                                </select>
                              </label>
                            ),
                            'common',
                          )}
                          <label>
                            {tx('Custom board', 'common')}
                            <textarea
                              rows={2}
                              placeholder={tx('Use comma, space, or semicolon separated cells. Use . for empty cells.', 'common')}
                              value={localStorage.getItem(customGameKey) ?? ''}
                              onChange={(event) => {
                                localStorage.setItem(customGameKey, event.target.value)
                                localStorage.removeItem(gameStateKey)
                                resetPlayback()
                                startGameInteraction()
                              }}
                            />
                          </label>
                        </>
                      ),
                      'common',
                    )}
                  </div>
                ) : (
                  <label>
                    {tx('Grid', 'common')}
                    <textarea
                      value={inputText}
                      onChange={(event) => {
                        setInputText(event.target.value)
                        resetPlayback()
                      }}
                      placeholder={tx('1,0,1; 0,1,0; 1,0,1', 'common')}
                      rows={3}
                    />
                  </label>
                ),
                'common',
              )}
            </div>
          ),
          'common',
        )}
        <details className="algorithm-browser">
          <summary>
            <Search size={17} />
            {tx('Browse ', 'common')}
            {tx(activeCategory.toLowerCase(), 'common')}
            {tx(' algorithms', 'common')}
            <span>
              {tx(visiblePickerModules.length, 'common')}
              {tx(' results', 'common')}
            </span>
          </summary>
          <section className="category-module-map">
            {tx(
              pageSections.map((section) => {
                const sectionModules = filteredModules
                  .filter((module) =>
                    `${module.subcategory ?? ''} ${module.name} ${module.summary}`.toLowerCase().includes(section.split(' ')[0].toLowerCase()),
                  )
                  .slice(0, 4)
                const fallback = sectionModules.length ? sectionModules : filteredModules.slice(0, 3)
                return (
                  <article key={section}>
                    <h2>{tx(section, 'common')}</h2>
                    <div>
                      {tx(
                        fallback.map((module) => (
                          <button
                            className={module.id === activeId ? 'active' : ''}
                            key={`${section}-${module.id}`}
                            type="button"
                            onClick={() => chooseAlgorithm(module.id)}
                          >
                            {tx(module.name, 'common')}
                          </button>
                        )),
                        'common',
                      )}
                    </div>
                  </article>
                )
              }),
              'common',
            )}
          </section>

          <section className="algorithm-picker" aria-label={tx('Algorithm picker', 'common')}>
            <div className="picker-search">
              <Search size={17} />
              <input
                aria-label={tx('Search algorithms', 'common')}
                placeholder={tx(`Search ${activeCategory.toLowerCase()} algorithms`, 'common')}
                value={algorithmQuery}
                onChange={(event) => setAlgorithmQuery(event.target.value)}
              />
              <span className="picker-count">
                {tx(visiblePickerModules.length, 'common')}
                {tx(' results', 'common')}
              </span>
            </div>
            <div className="picker-filters">
              <label>
                {tx('Status', 'common')}
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
                  <option value="all">{tx('All', 'common')}</option>
                  <option value="live">{tx('Interactive', 'common')}</option>
                  <option value="planned">{tx('Coming soon', 'common')}</option>
                </select>
              </label>
              <label>
                {tx('View', 'common')}
                <select value={visualFilter} onChange={(event) => setVisualFilter(event.target.value as typeof visualFilter)}>
                  <option value="all">{tx('All', 'common')}</option>
                  {tx(
                    (['Array', 'Tree', 'Graph', 'Matrix'] as const).map((mode) => (
                      <option key={mode} value={mode}>
                        {tx(mode, 'common')}
                      </option>
                    )),
                    'common',
                  )}
                </select>
              </label>
              <label>
                {tx('Complexity', 'common')}
                <select value={complexityFilter} onChange={(event) => setComplexityFilter(event.target.value as typeof complexityFilter)}>
                  <option value="all">{tx('All', 'common')}</option>
                  <option value="log">{tx('Logarithmic', 'common')}</option>
                  <option value="linear">{tx('Linear', 'common')}</option>
                  <option value="nlogn">{tx('n log n', 'common')}</option>
                  <option value="quadratic">{tx('Quadratic', 'common')}</option>
                </select>
              </label>
              <button className="btn-reset-filters" type="button" onClick={resetFilters}>
                {tx('Reset filters', 'common')}
              </button>
            </div>
            <div className="favorite-row">
              {tx(
                favorites
                  .map((id) => allModules.find((module) => module.id === id))
                  .filter(Boolean)
                  .map((module) => (
                    <button key={module!.id} type="button" onClick={() => chooseAlgorithm(module!.id)}>
                      {tx('Pinned: ', 'common')}
                      {tx(module!.name, 'common')}
                    </button>
                  )),
                'common',
              )}
            </div>
            {tx(
              visiblePickerModules.length ? (
                <div className="picker-grid">
                  {tx(
                    visiblePickerModules.map((module) => (
                      <button
                        className={`${module.id === activeId ? 'active' : ''} ${module.status === 'planned' ? 'planned-module' : ''} cat-${module.category.toLowerCase().replaceAll(' ', '-').replaceAll('&', 'and').replaceAll('/', '-')}`}
                        key={module.id}
                        onClick={() => chooseAlgorithm(module.id)}
                        type="button"
                      >
                        <span>
                          <strong>{tx(module.name, 'common')}</strong>
                          <small>
                            {tx(module.subcategory ?? module.visualMode, 'common')} / {tx(module.status === 'live' ? 'interactive' : 'coming soon', 'common')}
                          </small>
                        </span>
                        <em>{tx(module.complexity.average, 'common')}</em>
                      </button>
                    )),
                    'common',
                  )}
                </div>
              ) : (
                <div className="empty-state">
                  <strong>{tx('No algorithms match these filters.', 'common')}</strong>
                  <span>
                    {tx('Clear the search or reset filters to see the full ', 'common')}
                    {tx(activeCategory.toLowerCase(), 'common')}
                    {tx(' catalog.', 'common')}
                  </span>
                </div>
              ),
              'common',
            )}
            <button className="favorite-toggle" type="button" onClick={() => toggleFavorite(activeModule.id)}>
              {tx(favorites.includes(activeModule.id) ? 'Unpin favorite' : 'Pin favorite', 'common')}
            </button>
          </section>
        </details>
      </MobileDisclosure>
      <section className="canvas-zone">
        {tx(
          learningTab === 'Visualization' && suiteLinks[activeId] && (
            <div className="daa-suite-notice">
              <strong>{tx('This suite uses an illustrative example.', 'common')}</strong>
              <p>{tx('Choose a dedicated algorithm below to edit its problem data and compute a full timeline.', 'common')}</p>
              {tx(
                suiteLinks[activeId].map((id) => (
                  <button type="button" key={id} onClick={() => chooseAlgorithm(id)}>
                    {tx(allModules.find((module) => module.id === id)?.name ?? id, 'common')}
                  </button>
                )),
                'common',
              )}
            </div>
          ),
          'common',
        )}
        <div className="page-ribbon">
          <span>
            {tx(activeCategory, 'common')}
            {tx(' page', 'common')}
          </span>
          <strong>{tx(activeModule.subcategory ?? activeModule.visualMode, 'common')}</strong>
          <em>{tx(recommendation, 'common')}</em>
          <em>
            {tx(progressPercent, 'common')}
            {tx('% category progress', 'common')}
          </em>
        </div>

        {tx(controls, 'common')}
        {tx(
          !['Graph', 'Tree'].includes(activeModule.visualMode) && (
            <section className="visual-controls">
              {tx(
                isSorting && (
                  <div className="bubble-view-switch" role="group" aria-label={tx('View as', 'common')}>
                    <span>{tx('View as', 'common')}</span>
                    <button type="button" aria-pressed={bubbleView !== 'icons'} onClick={() => setBubbleView('bars')}>
                      {tx('Bars', 'common')}
                    </button>
                    <button type="button" aria-pressed={bubbleView === 'icons'} onClick={() => setBubbleView('icons')}>
                      {tx('Icons', 'common')}
                    </button>
                  </div>
                ),
                'common',
              )}
              {tx(
                isSorting && (
                  <label className="sorting-character-picker">
                    {tx('Character', 'common')}
                    <select
                      aria-label={tx('Sorting character', 'common')}
                      value={sortingCharacters.some((option) => option.id === sortingCharacter) ? sortingCharacter : 'penguins'}
                      onChange={(event) => {
                        setSortingCharacter(event.target.value)
                        setBubbleView('icons')
                      }}
                    >
                      {tx(
                        sortingCharacters.map((option) => (
                          <option key={option.id} value={option.id}>
                            {tx(option.icon, 'common')} {tx(option.name, 'common')}
                          </option>
                        )),
                        'common',
                      )}
                    </select>
                  </label>
                ),
                'common',
              )}
              <details className="display-options">
                <summary>{tx('Display options', 'common')}</summary>
                <div>
                  <label>
                    <input
                      type="checkbox"
                      checked={activeModule.category === 'Searching' || showValues}
                      disabled={activeModule.category === 'Searching'}
                      onChange={(event) => setShowValues(event.target.checked)}
                    />
                    {tx('Show values', 'common')}
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={activeModule.category === 'Searching' || showIndices}
                      disabled={activeModule.category === 'Searching'}
                      onChange={(event) => setShowIndices(event.target.checked)}
                    />
                    {tx('Show indices', 'common')}
                  </label>
                  <label>
                    {tx('Zoom', 'common')}
                    <input min={70} max={170} step={10} type="range" value={canvasZoom} onChange={(event) => setCanvasZoom(Number(event.target.value))} />
                    <span>{tx(canvasZoom, 'common')}%</span>
                  </label>
                  <button type="button" onClick={() => setCanvasZoom(100)}>
                    {tx('Fit to canvas', 'common')}
                  </button>
                  <label>
                    <input type="checkbox" checked={showStateComparison} onChange={(event) => setShowStateComparison(event.target.checked)} />
                    {tx('Before/after', 'common')}
                  </label>
                  <label>
                    {tx('Motion', 'common')}
                    <select value={animationQuality} onChange={(event) => setAnimationQuality(event.target.value as AnimationQuality)}>
                      <option value="off">{tx('Off', 'common')}</option>
                      <option value="simple">{tx('Simple', 'common')}</option>
                      <option value="detailed">{tx('Detailed', 'common')}</option>
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
                    {tx('Color-blind palette', 'common')}
                  </button>
                  {tx(
                    (['compare', 'swap', 'select', 'complete'] as const).map((type) => (
                      <label key={type}>
                        {tx(type, 'common')}
                        <input
                          type="color"
                          value={
                            stepPalette[type] ?? (type === 'swap' ? '#7c5bb0' : type === 'complete' ? '#397b50' : type === 'select' ? '#d59a26' : '#d85f3f')
                          }
                          onChange={(event) => setStepPalette((value) => ({ ...value, [type]: event.target.value }))}
                        />
                      </label>
                    )),
                    'common',
                  )}
                </div>
              </details>
            </section>
          ),
          'common',
        )}

        <ViewportCanvas onReset={() => setCanvasZoom(100)}>
          <div className="visual-canvas" ref={canvasRef}>
            {tx(
              activeModule.category !== 'Searching' && (
                <div className="visual-legend persistent">
                  <span className="red" />
                  {tx(' active', 'common')}
                  <span className="purple" />
                  {tx(' swap/negative', 'common')}
                  <span className="green" />
                  {tx(' complete', 'common')}
                  <span className="blue" />
                  {tx(' normal', 'common')}
                </div>
              ),
              'common',
            )}
            {tx(
              ['Graph', 'Tree'].includes(activeModule.visualMode) ? (
                <TraversalWorkbench activeModule={activeModule} currentStep={currentStep} input={input} />
              ) : activeModule.status === 'planned' ? (
                <div className="planned-state">
                  <Home size={34} />
                  <h2>
                    {tx(activeModule.name, 'common')}
                    {tx(' is coming soon.', 'common')}
                  </h2>
                  <p>
                    {tx(
                      'This page is prepared with learning notes, complexity, routing, local saves, and exports. The interactive runner is the remaining piece.',
                      'common',
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      chooseAlgorithm(allModules.find((module) => module.category === activeCategory && module.status === 'live')?.id ?? 'bubble-sort')
                    }
                  >
                    {tx('Open an interactive ', 'common')}
                    {tx(activeCategory.toLowerCase(), 'common')}
                    {tx(' module', 'common')}
                  </button>
                </div>
              ) : activeModule.visualMode === 'Matrix' ? (
                <div
                  className={`matrix-stage ${isGameBoard ? 'game-board-stage' : ''} ${isChessBoard ? 'chess-board-stage' : ''}`}
                  aria-label={tx('Matrix visualization', 'common')}
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
                      {tx(matrixRows, 'common')}
                      {tx(' x ', 'common')}
                      {tx(matrixColumns, 'common')}
                    </span>
                    <strong>{tx(String(currentStep?.highlights.variables?.problem ?? activeModule.subcategory ?? 'Matrix state'), 'common')}</strong>
                    <em>{tx(currentStep?.type ?? 'ready', 'common')}</em>
                  </div>
                  <div className="matrix-grid-view">
                    {tx(
                      activeGameArrow && (
                        <svg className="game-arrow-layer" aria-hidden="true">
                          <defs>
                            <marker id="chess-arrow-head" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
                              <path d="M0,0 L8,4 L0,8 Z" />
                            </marker>
                          </defs>
                          <line
                            x1={arrowPoint(activeGameArrow.from).x}
                            y1={arrowPoint(activeGameArrow.from).y}
                            x2={arrowPoint(activeGameArrow.to).x}
                            y2={arrowPoint(activeGameArrow.to).y}
                          />
                        </svg>
                      ),
                      'common',
                    )}
                    {tx(
                      matrixData.map((value, index) => {
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
                            className={`matrix-cell ${active ? 'active' : ''} ${currentStep?.type ?? ''} ${isGameBoard ? 'game-cell' : ''} ${activeGameArrow?.from === index ? 'move-from' : ''} ${activeGameArrow?.to === index ? 'move-to' : ''} ${markClass}`}
                            key={`${index}-${value}`}
                            layout
                            onClick={() => playGameCell(index)}
                            transition={{ duration: reducedMotion || animationQuality === 'off' ? 0 : 0.16 }}
                            data-legal={isGameBoard && !isChessBoard && legalTargets.includes(index) ? 'true' : undefined}
                          >
                            {tx(showIndices && <small>{tx(index, 'common')}</small>, 'common')}
                            {tx(showValues && <strong>{tx(isGameBoard ? gameSymbol : value, 'common')}</strong>, 'common')}
                          </motion.div>
                        )
                      }),
                      'common',
                    )}
                  </div>
                  {tx(
                    isGameBoard && currentStep?.highlights.variables && (
                      <div className="game-insight">
                        {tx(
                          [
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
                                <strong>{tx(key, 'common')}</strong>
                                {tx(String(currentStep.highlights.variables[key]), 'common')}
                              </span>
                            ) : null,
                          ),
                          'common',
                        )}
                      </div>
                    ),
                    'common',
                  )}
                  {tx(
                    isGameBoard && gameProfile && (
                      <section className="game-coach" aria-label={tx('Board game learning tools', 'common')}>
                        <div className="game-coach-main">
                          <article>
                            <span>{tx('Goal', 'common')}</span>
                            <strong>{tx(gameProfile.objective, 'common')}</strong>
                          </article>
                          <article>
                            <span>{tx('How computer thinks', 'common')}</span>
                            <strong>{tx(gameProfile.engine, 'common')}</strong>
                          </article>
                          <article>
                            <span>{tx('Practice now', 'common')}</span>
                            <strong>{tx(gameProfile.practice, 'common')}</strong>
                          </article>
                        </div>
                        <div className="game-coach-strip">
                          {tx(
                            [
                              ['Board', gameProfile.board],
                              ['Search', gameProfile.depth],
                              ['Tactic', gameProfile.tactic],
                              ['Mistake', gameProfile.mistake],
                              ['Turn', String(gameVariables.sideToMove ?? gameVariables.next ?? 'Step through')],
                              ['Move', String(gameVariables.bestMove ?? gameVariables.move ?? gameVariables.check ?? 'Look at highlight')],
                              ['Reply', String(gameVariables.likelyReply ?? gameVariables.opponentReplies ?? 'Compare opponent answer')],
                              ['Score', String(gameVariables.score ?? gameVariables.result ?? 'Explain after Run')],
                            ].map(([label, value]) => (
                              <span key={label}>
                                <strong>{tx(label, 'common')}</strong>
                                {value}
                              </span>
                            )),
                            'common',
                          )}
                        </div>
                        <div className="game-teacher-grid">
                          {tx(
                            [
                              ['Read', 'Name the pieces, empty cells, and current player.'],
                              ['Legal', 'List only moves allowed by the rules.'],
                              ['Threat', String(gameVariables.threat ?? gameVariables.capture ?? gameVariables.inference ?? 'Find the urgent idea.')],
                              [
                                'Candidates',
                                String(gameVariables.possibleMoves ?? gameVariables.candidates ?? gameVariables.liberties ?? 'Check the highlighted options.'),
                              ],
                              ['Choose', String(gameVariables.bestMove ?? gameVariables.move ?? 'Pick the move with the best explanation.')],
                              [
                                'Plan',
                                String(gameVariables.planNext12Plies ?? gameVariables.bestLine4Ply ?? gameVariables.algorithm ?? 'Repeat move, reply, score.'),
                              ],
                            ].map(([label, value]) => (
                              <article key={label}>
                                <span>{tx(label, 'common')}</span>
                                <p>{value}</p>
                              </article>
                            )),
                            'common',
                          )}
                        </div>
                        <div className="game-upgrade-list" aria-label={tx('Applied board game upgrades', 'common')}>
                          {tx(
                            [
                              'compact board',
                              'visible symbols',
                              'rule card',
                              'AI thinking',
                              'legal moves',
                              'best move',
                              'reply view',
                              'score',
                              'threats',
                              'mistakes',
                              'practice prompt',
                              'plan line',
                              'active cells',
                              'move labels',
                              'game objective',
                              'board size',
                              'search depth',
                              'candidate list',
                              'turn display',
                              'teaching steps',
                              'algorithm name',
                              'simple wording',
                              'mobile fit',
                              'highlight legend',
                              'shared layout',
                            ].map((item) => <span key={item}>{tx(item, 'common')}</span>),
                            'common',
                          )}
                        </div>
                      </section>
                    ),
                    'common',
                  )}
                  {tx(
                    showStateComparison && currentStep && (
                      <div className="state-comparison matrix-comparison">
                        <span>
                          {tx('Before: ', 'common')}
                          {tx((currentStep.beforeState ?? []).join(', ') || 'none', 'common')}
                        </span>
                        <span>
                          {tx('After: ', 'common')}
                          {tx((currentStep.afterState ?? currentStep.dataState).join(', ') || 'none', 'common')}
                        </span>
                      </div>
                    ),
                    'common',
                  )}
                </div>
              ) : activeModule.category === 'Searching' ? (
                <DetectiveSearch
                  items={visualItems}
                  step={currentStep}
                  history={searchHistory}
                  target={target}
                  algorithmId={activeId}
                  reducedMotion={reducedMotion}
                  quality={animationQuality}
                />
              ) : isSorting && bubbleView === 'icons' ? (
                <PenguinVisualization
                  items={visualItems}
                  step={currentStep}
                  reducedMotion={reducedMotion}
                  quality={animationQuality}
                  showIndices={showIndices}
                  showValues={showValues}
                  sortedCount={isBubble ? sortedBoundary : currentStep?.type === 'complete' ? visualItems.length : 0}
                  character={sortingCharacter}
                  palette={stepPalette}
                  showStateComparison={showStateComparison}
                />
              ) : (
                <div
                  className={`bar-stage ${hasNegativeValues ? 'has-negatives' : ''}`}
                  aria-label={tx('Array visualization', 'common')}
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
                  {tx(hasNegativeValues && <div className="baseline-axis">{tx('0 baseline', 'common')}</div>, 'common')}
                  {tx(
                    currentStep?.type === 'swap' && (
                      <div className="swap-arrow" aria-label={tx('Swap direction', 'common')}>
                        ⇌
                      </div>
                    ),
                    'common',
                  )}
                  {tx(sortedBoundary > 0 && <div className="sorted-region-label">{tx('sorted region', 'common')}</div>, 'common')}
                  {tx(
                    showIndices && (
                      <div className="index-ruler">
                        {tx(
                          visualItems.map((item) => <span key={`ruler-${item.id}`}>{tx(item.index, 'common')}</span>),
                          'common',
                        )}
                      </div>
                    ),
                    'common',
                  )}
                  <div className="bar-pointer-row">
                    {tx(
                      pointerEntries.map((pointer) => (
                        <span key={pointer.key} style={{ left: `${((pointer.index + 0.5) / Math.max(visualItems.length, 1)) * 100}%` }}>
                          {tx(pointer.key, 'common')}
                        </span>
                      )),
                      'common',
                    )}
                  </div>
                  {tx(
                    visualItems.map((item) => {
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
                            {tx(showValues && <span>{item.value}</span>, 'common')}
                          </motion.div>
                          {tx(showIndices && <small>{tx(item.index, 'common')}</small>, 'common')}
                        </motion.div>
                      )
                    }),
                    'common',
                  )}
                  {tx(
                    currentStep?.highlights.variables && (
                      <div className="pointer-labels">
                        {tx(
                          ['low', 'mid', 'high', 'pivot', 'pivotIndex', 'min'].map((key) =>
                            currentStep.highlights.variables?.[key] !== undefined ? (
                              <span key={key}>
                                {tx(key, 'common')}: {tx(String(currentStep.highlights.variables[key]), 'common')}
                              </span>
                            ) : null,
                          ),
                          'common',
                        )}
                      </div>
                    ),
                    'common',
                  )}
                  {tx(
                    activeModule.id === 'counting-sort' && (
                      <div className="bucket-panel">
                        {tx('Frequency table: ', 'common')}
                        {tx(String(currentStep?.highlights.variables?.counts ?? 'counts appear during counting steps'), 'common')}
                      </div>
                    ),
                    'common',
                  )}
                  {tx(
                    activeModule.id === 'radix-sort' && (
                      <div className="bucket-panel">
                        {tx('Radix bucket: ', 'common')}
                        {tx(String(currentStep?.highlights.variables?.digit ?? 'digits appear during bucket placement'), 'common')}
                      </div>
                    ),
                    'common',
                  )}
                  {tx(
                    activeModule.id === 'heap-sort' && (
                      <div className="bucket-panel">
                        {tx('Heap relation: parent i, children 2i+1 and 2i+2. Active heap indices are highlighted.', 'common')}
                      </div>
                    ),
                    'common',
                  )}
                  {tx(
                    activeModule.id === 'merge-sort' && (
                      <div className="bucket-panel">
                        {tx('Merge range: ', 'common')}
                        {tx(String(currentStep?.highlights.variables?.left ?? '-'), 'common')}-
                        {tx(String(currentStep?.highlights.variables?.right ?? '-'), 'common')}
                      </div>
                    ),
                    'common',
                  )}
                  {tx(
                    showStateComparison && currentStep && (
                      <div className="state-comparison">
                        <span>
                          {tx('Before: ', 'common')}
                          {tx((currentStep.beforeState ?? []).join(', ') || 'none', 'common')}
                        </span>
                        <span>
                          {tx('After: ', 'common')}
                          {tx((currentStep.afterState ?? currentStep.dataState).join(', ') || 'none', 'common')}
                        </span>
                      </div>
                    ),
                    'common',
                  )}
                </div>
              ),
              'common',
            )}
          </div>
        </ViewportCanvas>
        <p className="workbench-step-description" aria-live="polite">
          {tx(currentStep?.description ?? 'Choose your input and run the algorithm.', 'common')}
        </p>
      </section>
      {tx(
        learningTab === 'Visualization' ? (
          <details className="workbench-details">
            <summary>{tx('Explanation, results & variables', 'common')}</summary>
            {tx(rightPanel, 'common')}
          </details>
        ) : (
          rightPanel
        ),
        'common',
      )}
    </section>
  )
}
