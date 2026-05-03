import type { Dispatch, SetStateAction } from 'react'
import { ChevronLeft, ChevronRight, Gauge, ListRestart, Pause, Play, RotateCcw, SkipBack, SkipForward, Square } from 'lucide-react'
import type { AlgorithmCategory } from '../types'

type ControlsProps = {
  activeCategory: AlgorithmCategory
  disabledReason: string
  pauseOn: string
  playing: boolean
  pushToast: (message: string) => void
  resetAll: () => void
  resetPlayback: () => void
  setPauseOn: (type: string) => void
  setPlaying: Dispatch<SetStateAction<boolean>>
  setSpeed: Dispatch<SetStateAction<number>>
  setStepIndex: Dispatch<SetStateAction<number>>
  speed: number
  stepsLength: number
}

export function Controls({
  activeCategory,
  disabledReason,
  pauseOn,
  playing,
  pushToast,
  resetAll,
  resetPlayback,
  setPauseOn,
  setPlaying,
  setSpeed,
  setStepIndex,
  speed,
  stepsLength,
}: ControlsProps) {
  return (
    <div className="control-panel">
      <button className="btn-nav" type="button" onClick={() => setStepIndex(0)} title="Jump to first step" aria-label="Jump to first step">
        <SkipBack size={18} />
      </button>
      <button
        className="btn-nav"
        type="button"
        onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
        title="Step backward"
        aria-label="Step backward"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        className="primary btn-run"
        type="button"
        onClick={() => setPlaying((value) => !value)}
        disabled={!stepsLength || Boolean(disabledReason)}
        title={disabledReason || 'Play or pause the timeline'}
      >
        {playing ? <Pause size={18} /> : <Play size={18} />}
        {playing ? 'Pause' : activeCategory === 'Sorting' ? 'Sort' : activeCategory === 'Searching' ? 'Search' : 'Run'}
      </button>
      <button className="btn-stop" type="button" onClick={() => setPlaying(false)} title="Stop" aria-label="Stop">
        <Square size={18} />
      </button>
      <button
        className="btn-stop"
        type="button"
        onClick={() => {
          setPlaying(false)
          pushToast('Run cancelled')
        }}
        title="Cancel long run playback"
      >
        Cancel
      </button>
      <button
        className="btn-nav"
        type="button"
        onClick={() => setStepIndex((index) => Math.min(stepsLength - 1, index + 1))}
        title="Step forward"
        aria-label="Step forward"
      >
        <ChevronRight size={18} />
      </button>
      <button
        className="btn-nav"
        type="button"
        onClick={() => setStepIndex(Math.max(0, stepsLength - 1))}
        title="Jump to last step"
        aria-label="Jump to last step"
      >
        <SkipForward size={18} />
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
      {disabledReason && <div className="run-disabled-reason">Run disabled because: {disabledReason}</div>}
    </div>
  )
}
