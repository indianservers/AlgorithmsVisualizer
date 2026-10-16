export async function accountRequest(path, options = {}) {
  if (!['/api/session', '/api/profile'].includes(path)) throw new Error('Unknown account endpoint.')
  let response
  try {
    response = await fetch(new URL(path, 'https://tools.aimersociety.com'), { ...options, credentials: 'include', cache: 'no-store' })
  } catch {
    throw new Error(
      'The shared AIMER account service could not be reached from this website. Check your connection, retry, or continue on AIMER Tools. Learning remains available.',
    )
  }
  let data
  try {
    data = await response.json()
  } catch {
    throw new Error('The account service is temporarily unavailable. Please try again.')
  }
  if (response.status === 401) window.dispatchEvent(new Event('aimer-session-expired'))
  if (!response.ok) {
    const error = new Error(
      response.status === 401
        ? 'Your session expired. Sign in again to continue.'
        : response.status === 403
          ? 'Shared sign-in is not enabled for this website yet. Continue on AIMER Tools; learning remains available here.'
          : typeof data?.error === 'string'
            ? data.error
            : 'The account service could not complete this request. Please try again.',
    )
    error.status = response.status
    throw error
  }
  if (path === '/api/session' && (!data || !Object.hasOwn(data, 'user')))
    throw new Error('The account service returned an unexpected session response. Try again.')
  return data
}
export const getProfile = () => accountRequest('/api/profile').then((r) => r.profile)
export const updateProfile = (body, uid) =>
  accountRequest('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'X-Aimer-Account': uid }, body: JSON.stringify(body) }).then(
    (r) => r.profile,
  )
export function safeReturnTo(value) {
  if (!value) return null
  try {
    const url = new URL(value, location.origin)
    const hosts = [
      'aimersociety.com',
      'www.aimersociety.com',
      'tools.aimersociety.com',
      'ml.aimersociety.com',
      'algorithms.aimersociety.com',
      'maths.aimersociety.com',
      'physics.aimersociety.com',
      'biology.aimersociety.com',
      'chemistry.aimersociety.com',
      'digital.aimersociety.com',
      'electronics-lab.aimersociety.com',
      'iq-labs.aimersociety.com',
      'cryptography.aimersociety.com',
      'statistics.aimersociety.com',
      'analytics.aimersociety.com',
      'dbms.aimersociety.com',
      'os.aimersociety.com',
    ]
    if (url.username || url.password || url.port || url.protocol !== 'https:' || !hosts.includes(url.hostname)) return null
    if (url.searchParams.has('returnTo') || url.searchParams.has('login')) return null
    return url.href
  } catch {
    return null
  }
}
export function photo(container, user) {
  container.replaceChildren()
  container.textContent = (user.name || user.email || 'A').slice(0, 1).toUpperCase()
  try {
    const url = new URL(user.picture)
    if (url.protocol !== 'https:' || !(url.hostname === 'lh3.googleusercontent.com' || url.hostname.endsWith('.googleusercontent.com'))) return
    const img = document.createElement('img')
    img.alt = ''
    img.referrerPolicy = 'no-referrer'
    img.src = url.href
    img.addEventListener('error', () => img.remove())
    container.append(img)
  } catch {
    /* Initials remain available. */
  }
}
