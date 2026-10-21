import type { Dispatch, SetStateAction } from 'react'
import { Gauge, ListRestart, RotateCcw, Square } from 'lucide-react'
import { TimelineToolbar } from './TimelineToolbar'
import type { AlgorithmCategory } from '../types'

type ControlsProps = {
  activeCategory: AlgorithmCategory
  disabledReason: string
  pauseOn: string
  playing: boolean
  resetAll: () => void
  resetPlayback: () => void
  setPauseOn: (type: string) => void
  setPlaying: Dispatch<SetStateAction<boolean>>
  setSpeed: Dispatch<SetStateAction<number>>
  setStepIndex: Dispatch<SetStateAction<number>>
  speed: number
  stepIndex: number
  stepsLength: number
}

export function Controls({
  activeCategory,
  disabledReason,
  pauseOn,
  playing,
  resetAll,
  resetPlayback,
  setPauseOn,
  setPlaying,
  setSpeed,
  setStepIndex,
  speed,
  stepsLength,
  stepIndex,
}: ControlsProps) {
  return (
    <div className="control-panel">
      <TimelineToolbar
        index={stepIndex}
        count={stepsLength}
        playing={playing}
        speed={speed}
        disabledReason={disabledReason}
        playLabel={activeCategory === 'Sorting' ? 'Run sort' : activeCategory === 'Searching' ? 'Run search' : 'Run algorithm'}
        labels={{ first: 'Jump to first step', previous: 'Step backward', next: 'Step forward', last: 'Jump to last step' }}
        onNavigate={(index) => {
          setPlaying(false)
          setStepIndex(index)
        }}
        onPlay={() => {
          if (stepIndex === stepsLength - 1) setStepIndex(0)
          setPlaying((value) => !value)
        }}
        onSpeed={setSpeed}
      />
      <details className="playback-options">
        <summary>Playback options</summary>
        <div>
          <button className="btn-stop" type="button" onClick={() => setPlaying(false)} title="Stop" aria-label="Stop">
            <Square size={18} />
          </button>
          <button className="btn-reset" type="button" onClick={resetPlayback} title="Reset animation">
            <ListRestart size={18} />
            Reset steps
          </button>
          <button className="btn-danger" type="button" onClick={resetAll} title="Reset data and controls">
            <RotateCcw size={18} />
            Reset all
          </button>
          <label className="speed">
            <Gauge size={17} />
            <input min={80} max={1200} step={40} type="range" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} />
            <span>{speed}ms</span>
          </label>
          <label className="pause-filter">
            Pause on
            <select value={pauseOn} onChange={(event) => setPauseOn(event.target.value)}>
              <option value="">none</option>
              {['compare', 'swap', 'select', 'partition', 'merge', 'update', 'complete'].map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
        </div>
      </details>
      {disabledReason && <div className="run-disabled-reason">Run disabled because: {disabledReason}</div>}
    </div>
  )
}
