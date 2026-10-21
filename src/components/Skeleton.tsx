// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
export function SavedExperimentsSkeleton() {
  useLocaleRender()

  return (
    <div className="saved-list skeleton-list" aria-label={tx('Loading saved experiments', 'common')}>
      {tx(
        Array.from({ length: 3 }, (_, index) => <span className="skeleton-line" key={index} />),
        'common',
      )}
    </div>
  )
}

export function RouteTransitionSkeleton() {
  useLocaleRender()

  return (
    <div className="route-skeleton" aria-label={tx('Loading route', 'common')}>
      <span className="skeleton-line wide" />
      <span className="skeleton-line" />
    </div>
  )
}
