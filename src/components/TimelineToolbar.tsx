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
  const last = Math.max(0, count - 1)
  const names = labels ?? { first: 'First', previous: 'Previous', next: 'Next', last: 'Last' }
  return (
    <div className="workbench-toolbar" role="group" aria-label="Timeline controls">
      <div className="workbench-playback">
        <button type="button" aria-label={names.first} title={names.first} disabled={!count || index === 0} onClick={() => onNavigate(0)}>
          <SkipBack size={16} />
        </button>
        <button
          type="button"
          aria-label={names.previous}
          title={names.previous}
          disabled={!count || index === 0}
          onClick={() => onNavigate(Math.max(0, index - 1))}
        >
          <ChevronLeft size={17} />
        </button>
        <button
          className="workbench-play"
          type="button"
          aria-label={playing ? 'Pause' : (playLabel ?? 'Play')}
          title={disabledReason || (playing ? 'Pause' : (playLabel ?? 'Play'))}
          disabled={!count || !!disabledReason || (index === last && !playLabel)}
          onClick={onPlay}
        >
          {playing ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
          <span>{playing ? 'Pause' : (playLabel ?? 'Play')}</span>
        </button>
        <button
          type="button"
          aria-label={names.next}
          title={names.next}
          disabled={!count || index === last}
          onClick={() => onNavigate(Math.min(last, index + 1))}
        >
          <ChevronRight size={17} />
        </button>
        <button type="button" aria-label={names.last} title={names.last} disabled={!count || index === last} onClick={() => onNavigate(last)}>
          <SkipForward size={16} />
        </button>
      </div>
      <label className="workbench-progress step-meter">
        <span>
          {progressLabel} {count ? index + 1 : 0}/{count}
        </span>
        <input
          aria-label="Timeline step"
          type="range"
          min={0}
          max={last}
          value={Math.min(index, last)}
          disabled={!count}
          onChange={(event) => onNavigate(Number(event.target.value))}
        />
      </label>
      <label className="workbench-speed">
        <span>Speed</span>
        <select aria-label="Playback speed" value={speed} onChange={(event) => onSpeed(Number(event.target.value))}>
          {![150, 600, 1200].includes(speed) && <option value={speed}>{speed} ms</option>}
          <option value={1200}>Slow</option>
          <option value={600}>Normal</option>
          <option value={150}>Fast</option>
        </select>
      </label>
      {view}
      {children}
    </div>
  )
}
