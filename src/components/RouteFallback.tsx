import type { AlgorithmModule } from '../types'

type RouteFallbackProps = {
  algorithmSlug?: string
  categorySlug?: string
  fallbackModule: AlgorithmModule
  openFallback: () => void
}

export function RouteFallback({ algorithmSlug, categorySlug, fallbackModule, openFallback }: RouteFallbackProps) {
  return (
    <section className="route-fallback">
      <span className="eyebrow">Route not found</span>
      <h1>That algorithm page is not in this catalog.</h1>
      <p>
        We could not match {categorySlug ? `/${categorySlug}` : 'this category'}
        {algorithmSlug ? `/${algorithmSlug}` : ''}. You can jump back to a known interactive module.
      </p>
      <button type="button" onClick={openFallback}>
        Open {fallbackModule.name}
      </button>
    </section>
  )
}
