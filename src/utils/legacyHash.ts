export function legacyHashDestination(_pathname: string, search: string, hash: string) {
  if (!/^#\/(?!\/)/.test(hash)) return null
  const url = new URL(hash.slice(1), 'https://algorithms.aimersociety.com')
  const params = new URLSearchParams(search)
  for (const [key, value] of url.searchParams) params.set(key, value)
  return url.pathname + (params.size ? '?' + params.toString() : '') + url.hash
}
export function migrateLegacyHash() {
  const next = legacyHashDestination(location.pathname, location.search, location.hash)
  if (next) {
    history.replaceState(history.state, '', next)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
}
