// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
import type { AlgorithmModule } from '../types'

type RouteFallbackProps = {
  algorithmSlug?: string
  categorySlug?: string
  fallbackModule: AlgorithmModule
  openFallback: () => void
}

export function RouteFallback({ algorithmSlug, categorySlug, fallbackModule, openFallback }: RouteFallbackProps) {
  useLocaleRender()

  return (
    <section className="route-fallback">
      <span className="eyebrow">{tx('Route not found', 'common')}</span>
      <h1>{tx('That algorithm page is not in this catalog.', 'common')}</h1>
      <p>
        {tx('We could not match ', 'common')}
        {tx(categorySlug ? `/${categorySlug}` : 'this category', 'common')}
        {tx(algorithmSlug ? `/${algorithmSlug}` : '', 'common')}
        {tx('. You can jump back to a known interactive module.', 'common')}
      </p>
      <button type="button" onClick={openFallback}>
        {tx('Open ', 'common')}
        {tx(fallbackModule.name, 'common')}
      </button>
    </section>
  )
}
