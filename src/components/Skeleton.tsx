export function SavedExperimentsSkeleton() {
  return (
    <div className="saved-list skeleton-list" aria-label="Loading saved experiments">
      {Array.from({ length: 3 }, (_, index) => (
        <span className="skeleton-line" key={index} />
      ))}
    </div>
  )
}

export function RouteTransitionSkeleton() {
  return (
    <div className="route-skeleton" aria-label="Loading route">
      <span className="skeleton-line wide" />
      <span className="skeleton-line" />
    </div>
  )
}
