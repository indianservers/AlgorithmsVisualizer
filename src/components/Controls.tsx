// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
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
  useLocaleRender()

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
        <summary>{tx('Playback options', 'controls')}</summary>
        <div>
          <button className="btn-stop" type="button" onClick={() => setPlaying(false)} title={tx('Stop', 'controls')} aria-label={tx('Stop', 'controls')}>
            <Square size={18} />
          </button>
          <button className="btn-reset" type="button" onClick={resetPlayback} title={tx('Reset animation', 'controls')}>
            <ListRestart size={18} />
            {tx('Reset steps', 'controls')}
          </button>
          <button className="btn-danger" type="button" onClick={resetAll} title={tx('Reset data and controls', 'controls')}>
            <RotateCcw size={18} />
            {tx('Reset all', 'controls')}
          </button>
          <label className="speed">
            <Gauge size={17} />
            <input min={80} max={1200} step={40} type="range" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} />
            <span>
              {tx(speed, 'controls')}
              {tx('ms', 'controls')}
            </span>
          </label>
          <label className="pause-filter">
            {tx('Pause on', 'controls')}
            <select value={pauseOn} onChange={(event) => setPauseOn(event.target.value)}>
              <option value="">{tx('none', 'controls')}</option>
              {tx(
                ['compare', 'swap', 'select', 'partition', 'merge', 'update', 'complete'].map((type) => (
                  <option key={type} value={type}>
                    {tx(type, 'controls')}
                  </option>
                )),
                'controls',
              )}
            </select>
          </label>
        </div>
      </details>
      {tx(
        disabledReason && (
          <div className="run-disabled-reason">
            {tx('Run disabled because: ', 'controls')}
            {tx(disabledReason, 'controls')}
          </div>
        ),
        'controls',
      )}
    </div>
  )
}
