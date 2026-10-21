// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
import { SkipBack, ChevronLeft, Play, Pause, ChevronRight, SkipForward } from 'lucide-react'
import type { ReactNode } from 'react'

export function TimelineToolbar({
  index,
  count,
  playing,
  speed,
  onNavigate,
  onPlay,
  onSpeed,
  disabledReason,
  playLabel,
  labels,
  view,
  children,
  progressLabel = 'Step',
}: {
  index: number
  count: number
  playing: boolean
  speed: number
  onNavigate: (index: number) => void
  onPlay: () => void
  onSpeed: (speed: number) => void
  disabledReason?: string
  playLabel?: string
  progressLabel?: string
  labels?: { first: string; previous: string; next: string; last: string }
  view?: ReactNode
  children?: ReactNode
}) {
  useLocaleRender()

  const last = Math.max(0, count - 1)
  const names = labels ?? { first: 'First', previous: 'Previous', next: 'Next', last: 'Last' }
  return (
    <div className="workbench-toolbar" role="group" aria-label={tx('Timeline controls', 'controls')}>
      <div className="workbench-playback">
        <button
          type="button"
          aria-label={tx(names.first, 'controls')}
          title={tx(names.first, 'controls')}
          disabled={!count || index === 0}
          onClick={() => onNavigate(0)}
        >
          <SkipBack size={16} />
        </button>
        <button
          type="button"
          aria-label={tx(names.previous, 'controls')}
          title={tx(names.previous, 'controls')}
          disabled={!count || index === 0}
          onClick={() => onNavigate(Math.max(0, index - 1))}
        >
          <ChevronLeft size={17} />
        </button>
        <button
          className="workbench-play"
          type="button"
          aria-label={tx(playing ? 'Pause' : (playLabel ?? 'Play'), 'controls')}
          title={tx(disabledReason || (playing ? 'Pause' : (playLabel ?? 'Play')), 'controls')}
          disabled={!count || !!disabledReason || (index === last && !playLabel)}
          onClick={onPlay}
        >
          {tx(playing ? <Pause size={16} /> : <Play size={16} fill="currentColor" />, 'controls')}
          <span>{tx(playing ? 'Pause' : (playLabel ?? 'Play'), 'controls')}</span>
        </button>
        <button
          type="button"
          aria-label={tx(names.next, 'controls')}
          title={tx(names.next, 'controls')}
          disabled={!count || index === last}
          onClick={() => onNavigate(Math.min(last, index + 1))}
        >
          <ChevronRight size={17} />
        </button>
        <button
          type="button"
          aria-label={tx(names.last, 'controls')}
          title={tx(names.last, 'controls')}
          disabled={!count || index === last}
          onClick={() => onNavigate(last)}
        >
          <SkipForward size={16} />
        </button>
      </div>
      <label className="workbench-progress step-meter">
        <span>
          {tx(progressLabel, 'controls')} {tx(count ? index + 1 : 0, 'controls')}/{tx(count, 'controls')}
        </span>
        <input
          aria-label={tx('Timeline step', 'controls')}
          type="range"
          min={0}
          max={last}
          value={Math.min(index, last)}
          disabled={!count}
          onChange={(event) => onNavigate(Number(event.target.value))}
        />
      </label>
      <label className="workbench-speed">
        <span>{tx('Speed', 'controls')}</span>
        <select aria-label={tx('Playback speed', 'controls')} value={speed} onChange={(event) => onSpeed(Number(event.target.value))}>
          {tx(
            ![150, 600, 1200].includes(speed) && (
              <option value={speed}>
                {tx(speed, 'controls')}
                {tx(' ms', 'controls')}
              </option>
            ),
            'controls',
          )}
          <option value={1200}>{tx('Slow', 'controls')}</option>
          <option value={600}>{tx('Normal', 'controls')}</option>
          <option value={150}>{tx('Fast', 'controls')}</option>
        </select>
      </label>
      {tx(view, 'controls')}
      {tx(children, 'controls')}
    </div>
  )
}
