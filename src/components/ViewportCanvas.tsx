import { useRef, useState, type ReactNode } from 'react'
import { ZoomIn, ZoomOut, RotateCcw, Scan } from 'lucide-react'

export function ViewportCanvas({ children, onReset }: { children: ReactNode; onReset?: () => void }) {
  const [zoom, setZoom] = useState(1)
  const viewport = useRef<HTMLDivElement>(null)
  function fit() {
    onReset?.()
    setZoom(1)
    viewport.current?.scrollTo({ left: 0, top: 0 })
  }
  return (
    <section className="viewport-canvas" aria-label="Visualization canvas">
      <div className="canvas-view-tools" role="group" aria-label="Canvas view controls">
        <span>{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          aria-label="Zoom out"
          title="Zoom out"
          disabled={zoom <= 0.6}
          onClick={() => setZoom((value) => Math.max(0.6, Number((value - 0.1).toFixed(1))))}
        >
          <ZoomOut size={15} />
        </button>
        <button
          type="button"
          aria-label="Zoom in"
          title="Zoom in"
          disabled={zoom >= 1.8}
          onClick={() => setZoom((value) => Math.min(1.8, Number((value + 0.1).toFixed(1))))}
        >
          <ZoomIn size={15} />
        </button>
        <button type="button" aria-label="Fit to view" title="Fit to view" onClick={fit}>
          <Scan size={15} />
        </button>
        <button type="button" aria-label="Reset view" title="Reset view" onClick={fit}>
          <RotateCcw size={15} />
        </button>
      </div>
      <div ref={viewport} className="canvas-viewport-scroll">
        <div className="canvas-zoom-content" style={{ zoom }}>
          {children}
        </div>
      </div>
    </section>
  )
}
