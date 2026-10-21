// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
import { useRef, useState, type ReactNode } from 'react'
import { ZoomIn, ZoomOut, RotateCcw, Scan } from 'lucide-react'

export function ViewportCanvas({ children, onReset }: { children: ReactNode; onReset?: () => void }) {
  useLocaleRender()

  const [zoom, setZoom] = useState(1)
  const viewport = useRef<HTMLDivElement>(null)
  function fit() {
    onReset?.()
    setZoom(1)
    viewport.current?.scrollTo({ left: 0, top: 0 })
  }
  return (
    <section className="viewport-canvas" aria-label={tx('Visualization canvas', 'controls')}>
      <div className="canvas-view-tools" role="group" aria-label={tx('Canvas view controls', 'controls')}>
        <span>{tx(Math.round(zoom * 100), 'controls')}%</span>
        <button
          type="button"
          aria-label={tx('Zoom out', 'controls')}
          title={tx('Zoom out', 'controls')}
          disabled={zoom <= 0.6}
          onClick={() => setZoom((value) => Math.max(0.6, Number((value - 0.1).toFixed(1))))}
        >
          <ZoomOut size={15} />
        </button>
        <button
          type="button"
          aria-label={tx('Zoom in', 'controls')}
          title={tx('Zoom in', 'controls')}
          disabled={zoom >= 1.8}
          onClick={() => setZoom((value) => Math.min(1.8, Number((value + 0.1).toFixed(1))))}
        >
          <ZoomIn size={15} />
        </button>
        <button type="button" aria-label={tx('Fit to view', 'controls')} title={tx('Fit to view', 'controls')} onClick={fit}>
          <Scan size={15} />
        </button>
        <button type="button" aria-label={tx('Reset view', 'controls')} title={tx('Reset view', 'controls')} onClick={fit}>
          <RotateCcw size={15} />
        </button>
      </div>
      <div ref={viewport} className="canvas-viewport-scroll">
        <div className="canvas-zoom-content" style={{ zoom }}>
          {tx(children, 'controls')}
        </div>
      </div>
    </section>
  )
}
