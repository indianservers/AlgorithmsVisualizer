import { i18n } from './config'
import { defaultLocale, validLocale, localeStorageKey, languages } from './languages'
import type { Namespace } from './keys'
export type Template = { text: string; namespace: Namespace; key: string; parts: string[] }
export let templates: Template[] = []
const pending = new Map<string, Promise<void>>()
let requestVersion = 0
let templatesRequest: Promise<void> | undefined
export function namespacesForRoute(pathname: string): Namespace[] {
  return pathname === '/'
    ? ['common', 'navigation', 'algorithms', 'messages']
    : pathname.includes('/learn') || pathname === '/encyclopedia'
      ? ['common', 'navigation', 'algorithms', 'messages']
      : ['common', 'navigation', 'controls', 'studios', 'algorithms', 'messages']
}
export async function loadResources(locale: string, names: Namespace[]) {
  if (locale === defaultLocale) return
  await Promise.all(
    names.map((ns) => {
      const cacheKey = locale + '/' + ns
      if (i18n.hasResourceBundle(locale, ns)) return
      if (!pending.has(cacheKey))
        pending.set(
          cacheKey,
          fetch(`/locales/${locale}/${ns}.json`)
            .then(async (response) => {
              if (!response.ok) throw Error('Language resources could not load. Please try again.')
              const data: unknown = await response.json()
              if (!data || Array.isArray(data) || typeof data !== 'object' || Object.values(data).some((value) => typeof value !== 'string'))
                throw Error('Invalid language resources.')
              i18n.addResourceBundle(locale, ns, data, true, true)
            })
            .catch((error) => {
              pending.delete(cacheKey)
              throw error
            }),
        )
      return pending.get(cacheKey)
    }),
  )
  templatesRequest ??= fetch('/locales/templates.json')
    .then(async (response) => {
      if (response.ok) templates = await response.json()
    })
    .catch(() => {
      templatesRequest = undefined
    })
  await templatesRequest
}
export function applyDocumentLanguage(locale: string) {
  if (typeof document === 'undefined') return
  const lang = languages.find((l) => l.code === locale) ?? languages[0]
  document.documentElement.lang = lang.code
  document.documentElement.dir = lang.direction
  document.documentElement.dataset.locale = lang.code
}
export async function changeLocale(requested: string, pathname: string, persist = true) {
  const locale = validLocale(requested),
    version = ++requestVersion
  await loadResources(locale, namespacesForRoute(pathname))
  if (version !== requestVersion) return
  await i18n.changeLanguage(locale)
  applyDocumentLanguage(locale)
  if (persist) {
    try {
      localStorage.setItem(localeStorageKey, locale)
    } catch {
      /* Selection still works when storage is unavailable. */
    }
  }
}
export async function loadRouteResources(pathname: string) {
  const locale = validLocale(i18n.language)
  await loadResources(locale, namespacesForRoute(pathname))
  i18n.emit('loaded', {})
}
